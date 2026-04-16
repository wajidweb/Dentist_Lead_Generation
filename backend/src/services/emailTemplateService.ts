import { EmailSequenceStep } from "./instantlyService";

export interface EmailTemplateVariables {
  businessName: string;
  visualIssues: string[];
  criticalMissing: string[];
  issuesList: string[];
  oneLineSummary: string;
  websiteUrl: string;
  previewLink?: string;
  senderName: string;
}

export interface EmailPreview {
  subject: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildIssuesBulletList(items: string[]): string {
  if (items.length === 0) return "• No specific issues noted";
  return items.map((item) => `• ${item}`).join("\n");
}

function buildPreviewLinkBlock(previewLink?: string): string {
  if (!previewLink) return "";
  return (
    `\nI've also put together a quick mockup of what an improved site could look like:\n` +
    `${previewLink}\n`
  );
}

// ---------------------------------------------------------------------------
// Email 1 — Immediate
// ---------------------------------------------------------------------------

function buildEmail1(vars: EmailTemplateVariables): EmailPreview {
  const subject = `Quick question about ${vars.businessName}'s website`;
  const body = `Hi there,

I was researching dental practices in your area and took a look at ${vars.businessName}'s website at ${vars.websiteUrl}.

${vars.oneLineSummary}

I noticed a few things that could be costing you new patients:

{{issues_list}}
{{preview_block}}
I work with dental practices to fix exactly these kinds of issues. Would you be open to a quick 10-minute call to explore how we could help ${vars.businessName} get more patients through your website?

${vars.senderName}`;

  return { subject, body };
}

// ---------------------------------------------------------------------------
// Email 2 — +3 days follow-up
// ---------------------------------------------------------------------------

function buildEmail2(vars: EmailTemplateVariables): EmailPreview {
  const subject = `Re: Quick question about ${vars.businessName}'s website`;
  const body = `Hi again,

I wanted to follow up on my last email about ${vars.businessName}'s website.

The items I flagged as critically missing could be making a real difference in whether new patients choose your practice over a competitor:

{{critical_missing}}

Practices that address these gaps typically see a measurable increase in new patient inquiries within the first few weeks.

Would it make sense to jump on a quick call this week? I'd love to show you exactly what we'd do for ${vars.businessName}.

${vars.senderName}`;

  return { subject, body };
}

// ---------------------------------------------------------------------------
// Email 3 — +5 days final check-in
// ---------------------------------------------------------------------------

function buildEmail3(vars: EmailTemplateVariables): EmailPreview {
  const subject = `Re: Quick question about ${vars.businessName}'s website`;
  const body = `Hi,

I know you're busy running a practice, so I'll keep this short.

I'd still love to help ${vars.businessName} get more patients from your website. If the timing isn't right, no worries at all — just let me know and I'll leave you alone.

Otherwise, a quick reply is all it takes to get started.

${vars.senderName}`;

  return { subject, body };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generatePreviewEmail(
  vars: EmailTemplateVariables
): EmailPreview {
  const result = buildEmail1(vars);
  // For preview, replace Instantly placeholders with actual values
  const issuesBullets = buildIssuesBulletList(vars.issuesList);
  const previewBlock = buildPreviewLinkBlock(vars.previewLink);
  result.body = result.body
    .replace("{{issues_list}}", issuesBullets)
    .replace("{{preview_block}}", previewBlock);
  return result;
}

export function generateSequence(
  vars: EmailTemplateVariables
): EmailSequenceStep[] {
  const email1 = buildEmail1(vars);
  const email2 = buildEmail2(vars);
  const email3 = buildEmail3(vars);

  return [
    { subject: email1.subject, body: email1.body, delay_days: 0 },
    { subject: email2.subject, body: email2.body, delay_days: 3 },
    { subject: email3.subject, body: email3.body, delay_days: 5 },
  ];
}
