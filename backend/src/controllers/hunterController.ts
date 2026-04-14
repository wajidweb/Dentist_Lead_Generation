import { Request, Response } from "express";
import Lead from "../models/Lead";
import {
  domainSearch,
  emailFinder,
  emailVerifier,
  getAccountInfo,
  mapHunterResultToDecisionMaker,
  HunterAuthError,
  HunterQuotaError,
  HunterRateLimitError,
} from "../services/hunterService";

// ---------------------------------------------------------------------------
// Error → HTTP status mapper
// ---------------------------------------------------------------------------

function handleHunterError(err: unknown, res: Response): void {
  if (err instanceof HunterAuthError) {
    res.status(401).json({ message: err.message });
    return;
  }
  if (err instanceof HunterQuotaError) {
    res.status(402).json({ message: err.message });
    return;
  }
  if (err instanceof HunterRateLimitError) {
    res.status(429).json({ message: err.message });
    return;
  }
  console.error("[Hunter] Unexpected error:", err);
  const msg = err instanceof Error ? err.message : "Hunter API error";
  res.status(500).json({ message: msg });
}

// ---------------------------------------------------------------------------
// Helper — extract domain from website URL
// ---------------------------------------------------------------------------

function extractDomain(website: string): string {
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  }
}

// ---------------------------------------------------------------------------
// POST /api/hunter/leads/:id/search
// ---------------------------------------------------------------------------

export const searchDecisionMakers = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    const domain = extractDomain(lead.website);
    const existingEmails = new Set(lead.decisionMakers.map((dm) => dm.email));

    if (lead.likelyOwner?.firstName && lead.likelyOwner?.lastName) {
      // Name-first path: try email-finder first
      const finderResult = await emailFinder(domain, lead.likelyOwner.firstName, lead.likelyOwner.lastName);
      if (finderResult.email) {
        // Finder succeeded
        const alreadyExists = existingEmails.has(finderResult.email);
        if (!alreadyExists) {
          const dm = mapHunterResultToDecisionMaker(
            {
              value: finderResult.email,
              first_name: finderResult.first_name ?? lead.likelyOwner.firstName,
              last_name: finderResult.last_name ?? lead.likelyOwner.lastName,
              position: finderResult.position,
              confidence: finderResult.score ?? 0,
              verified: false,
            },
            "hunter-finder"
          );
          lead.decisionMakers.push(dm);
        }
        lead.hunterSearchedAt = new Date();
        lead.hunterQuotaUsed = (lead.hunterQuotaUsed ?? 0) + 1;
        await lead.save();
        res.json({ lead });
        return;
      }
      // Finder found nothing — fallback to domain search
      const domainResult = await domainSearch(domain);
      const toAdd = domainResult.emails
        .map((email) => mapHunterResultToDecisionMaker(email, "hunter-domain"))
        .filter((dm) => !existingEmails.has(dm.email));
      lead.decisionMakers.push(...toAdd);
      lead.hunterSearchedAt = new Date();
      lead.hunterQuotaUsed = (lead.hunterQuotaUsed ?? 0) + 2;
      await lead.save();
      res.json({ lead });
      return;
    }

    // No owner name — domain search only
    const result = await domainSearch(domain);
    const newDecisionMakers = result.emails.map((email) =>
      mapHunterResultToDecisionMaker(email, "hunter-domain")
    );
    const toAdd = newDecisionMakers.filter((dm) => !existingEmails.has(dm.email));
    lead.decisionMakers.push(...toAdd);
    lead.hunterSearchedAt = new Date();
    lead.hunterQuotaUsed = (lead.hunterQuotaUsed ?? 0) + 1;
    await lead.save();

    res.json({ lead });
  } catch (err) {
    handleHunterError(err, res);
  }
};

// ---------------------------------------------------------------------------
// POST /api/hunter/leads/:id/find-email
// ---------------------------------------------------------------------------

export const findEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName } = req.body as { firstName?: string; lastName?: string };
    if (!firstName || !lastName) {
      res.status(400).json({ message: "firstName and lastName are required" });
      return;
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    const domain = extractDomain(lead.website);
    const result = await emailFinder(domain, firstName, lastName);

    if (!result.email) {
      res.status(404).json({ message: "No email found for this person" });
      return;
    }

    // Only add if not already present
    const alreadyExists = lead.decisionMakers.some((dm) => dm.email === result.email);
    if (!alreadyExists) {
      const dm = mapHunterResultToDecisionMaker(
        {
          value: result.email,
          first_name: result.first_name ?? firstName,
          last_name: result.last_name ?? lastName,
          position: result.position,
          confidence: result.score ?? 0,
          verified: false,
        },
        "hunter-finder"
      );
      lead.decisionMakers.push(dm);
      lead.hunterQuotaUsed = (lead.hunterQuotaUsed ?? 0) + 1;
      await lead.save();
    }

    res.json({ lead });
  } catch (err) {
    handleHunterError(err, res);
  }
};

// ---------------------------------------------------------------------------
// POST /api/hunter/leads/:id/verify
// ---------------------------------------------------------------------------

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ message: "email is required" });
      return;
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    const result = await emailVerifier(email);

    const dmIndex = lead.decisionMakers.findIndex((dm) => dm.email === email);
    if (dmIndex !== -1) {
      const dm = lead.decisionMakers[dmIndex];
      dm.verified = result.result === "deliverable";
      dm.verificationStatus = result.result;
      dm.verifiedAt = new Date();
    }

    lead.hunterQuotaUsed = (lead.hunterQuotaUsed ?? 0) + 1;
    await lead.save();

    res.json({ lead });
  } catch (err) {
    handleHunterError(err, res);
  }
};

// ---------------------------------------------------------------------------
// POST /api/hunter/bulk-search
// ---------------------------------------------------------------------------

export const bulkSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body as { ids?: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "ids array is required" });
      return;
    }
    if (ids.length > 10) {
      res.status(400).json({ message: "Maximum 10 leads per bulk search" });
      return;
    }

    const results: Array<{ leadId: string; added: number; error?: string }> = [];

    for (const id of ids) {
      try {
        const lead = await Lead.findById(id);
        if (!lead) {
          results.push({ leadId: id, added: 0, error: "Lead not found" });
          continue;
        }

        const domain = extractDomain(lead.website);
        const existingEmails = new Set(lead.decisionMakers.map((dm) => dm.email));
        let added = 0;

        if (lead.likelyOwner?.firstName && lead.likelyOwner?.lastName) {
          // Name-first path: try email-finder first
          const finderResult = await emailFinder(domain, lead.likelyOwner.firstName, lead.likelyOwner.lastName);
          if (finderResult.email) {
            const alreadyExists = existingEmails.has(finderResult.email);
            if (!alreadyExists) {
              const dm = mapHunterResultToDecisionMaker(
                {
                  value: finderResult.email,
                  first_name: finderResult.first_name ?? lead.likelyOwner.firstName,
                  last_name: finderResult.last_name ?? lead.likelyOwner.lastName,
                  position: finderResult.position,
                  confidence: finderResult.score ?? 0,
                  verified: false,
                },
                "hunter-finder"
              );
              lead.decisionMakers.push(dm);
              added = 1;
            }
            lead.hunterSearchedAt = new Date();
            lead.hunterQuotaUsed = (lead.hunterQuotaUsed ?? 0) + 1;
            await lead.save();
            results.push({ leadId: id, added });
            continue;
          }
          // Finder found nothing — fallback to domain search
          const domainResult = await domainSearch(domain);
          const toAdd = domainResult.emails
            .map((email) => mapHunterResultToDecisionMaker(email, "hunter-domain"))
            .filter((dm) => !existingEmails.has(dm.email));
          lead.decisionMakers.push(...toAdd);
          lead.hunterSearchedAt = new Date();
          lead.hunterQuotaUsed = (lead.hunterQuotaUsed ?? 0) + 2;
          await lead.save();
          results.push({ leadId: id, added: toAdd.length });
          continue;
        }

        // No owner name — domain search only
        const result = await domainSearch(domain);
        const toAdd = result.emails
          .map((email) => mapHunterResultToDecisionMaker(email, "hunter-domain"))
          .filter((dm) => !existingEmails.has(dm.email));

        lead.decisionMakers.push(...toAdd);
        lead.hunterSearchedAt = new Date();
        lead.hunterQuotaUsed = (lead.hunterQuotaUsed ?? 0) + 1;
        await lead.save();

        results.push({ leadId: id, added: toAdd.length });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.push({ leadId: id, added: 0, error: msg });
      }
    }

    res.json({ results });
  } catch (err) {
    handleHunterError(err, res);
  }
};

// ---------------------------------------------------------------------------
// GET /api/hunter/quota
// ---------------------------------------------------------------------------

export const getQuota = async (_req: Request, res: Response): Promise<void> => {
  try {
    const info = await getAccountInfo();

    const searches = info.requests?.searches ?? info.calls ?? { used: 0, available: 0 };
    const verifications = info.requests?.verifications ?? { used: 0, available: 0 };
    const plan = (info.plan_name ?? "free").toLowerCase();

    res.json({
      searches,
      verifications,
      plan,
    });
  } catch (err) {
    handleHunterError(err, res);
  }
};
