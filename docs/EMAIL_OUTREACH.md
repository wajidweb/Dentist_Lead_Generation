# Email Outreach — Instantly.ai Integration

> Feature introduced in v1.1.0 (2026-04-09)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Setup](#3-setup)
4. [API Reference](#4-api-reference)
5. [Email Sequence Templates](#5-email-sequence-templates)
6. [Webhook Integration](#6-webhook-integration)
7. [Lead Status Flow](#7-lead-status-flow)
8. [Frontend Components](#8-frontend-components)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Overview

The email outreach feature allows DentalLeads users to send personalised cold-outreach email sequences to analyzed dental practice leads through [Instantly.ai](https://instantly.ai). Each outreach is a 3-step sequence automatically built from the lead's website analysis data (issues list, critical missing items, one-line summary).

Key capabilities:

- Generate and preview a personalised first email from analysis data before sending
- Send outreach to a single lead or in bulk (up to 100 leads per request)
- Track email events (sent, opened, replied, bounced) via Instantly webhooks
- View per-lead email history and aggregate dashboard statistics
- One Instantly campaign is created automatically per user on first send; subsequent sends add leads to that same campaign

---

## 2. Architecture

### Component Map

```
Frontend (Next.js)
  ├── EmailPreviewModal       — preview & edit email before sending
  ├── EmailTrackingTab        — per-lead event history
  ├── OutreachStatsCard       — dashboard aggregate stats
  └── emailOutreachStore      — Zustand state (preview, tracking, stats)
          |
          | HTTP (JWT-authenticated)
          v
Backend (Express)
  ├── emailOutreachRoutes     — /api/email-outreach/*
  ├── webhookRoutes           — /api/webhooks/instantly  (public, HMAC-verified)
  │
  ├── emailOutreachController — request parsing, response formatting
  ├── webhookController       — signature verification, event dispatch
  │
  ├── emailOutreachService    — campaign lifecycle, send, stats, webhook handling
  ├── emailTemplateService    — 3-step sequence generation
  ├── instantlyService        — Instantly V2 REST API wrapper
  │
  ├── Campaign (Mongoose)     — one document per user, stores Instantly IDs & counters
  └── Lead (Mongoose)         — outreach fields appended (emailHistory, outreachStatus…)
          |
          | HTTPS + Bearer token
          v
Instantly.ai (V2 API)
  ├── POST /campaigns         — create campaign with sequence template
  ├── POST /campaigns/:id/activate
  ├── POST /leads             — add single lead
  ├── POST /leads/bulk        — add multiple leads
  └── POST /webhooks          — register event callback
          |
          | POST /api/webhooks/instantly
          v
Backend webhook receiver
```

### Data Flow — Single Send

```
User clicks "Send Outreach"
  → Frontend fetches POST /api/email-outreach/preview
      → Controller reads Lead from MongoDB
      → emailTemplateService.generatePreviewEmail() builds Email 1
      → Returns { preview: {subject, body}, to, from, leadId, businessName }
  → User reviews / edits email in EmailPreviewModal
  → User confirms → POST /api/email-outreach/send
      → emailOutreachService.sendOutreach()
          → getOrCreateCampaign() — creates campaign in Instantly if none exists
          → instantlyService.addLeadToCampaign() — queues the lead in Instantly
          → Lead document updated: status="email_sent", outreachStatus="sent", emailHistory entry added
          → Campaign counters incremented: leadsAdded+1, emailsSent+1
      → Response: { lead, campaignId, message }
  → Instantly sends emails per the 3-step sequence
  → Instantly fires webhook events as emails are delivered/opened/replied/bounced
      → POST /api/webhooks/instantly
          → HMAC signature verified
          → handleWebhookEvent() updates Lead.outreachStatus and emailHistory timestamps
          → Campaign counters incremented accordingly
```

---

## 3. Setup

### 3.1 Environment Variables

Add the following to `backend/.env`:

```env
# Already required — Instantly API key
INSTANTLY_API_KEY=your_instantly_api_key_here

# Already required — the sending email address registered in Instantly
INSTANTLY_EMAIL=outreach@yourdomain.com

# NEW — HMAC secret for webhook signature verification
# Generate with: openssl rand -hex 32
INSTANTLY_WEBHOOK_SECRET=your_generated_secret_here

# NEW — Public base URL of your backend (no trailing slash)
# Used to auto-register the webhook callback with Instantly on first campaign creation
BACKEND_URL=https://api.yourdomain.com
```

`INSTANTLY_WEBHOOK_SECRET` is optional in development (verification is skipped with a console warning) but **mandatory in production** — the server will reject all webhook requests and return HTTP 500 if the secret is missing when `NODE_ENV=production`.

### 3.2 Instantly.ai Account Requirements

1. An active Instantly.ai account with a verified sending domain/mailbox.
2. The sending email (`INSTANTLY_EMAIL`) must be added and verified inside Instantly's dashboard under **Email Accounts**.
3. The API key (`INSTANTLY_API_KEY`) is found under **Settings → API Keys**. The key requires at minimum the **Campaigns** and **Leads** scopes.
4. Ensure your Instantly plan supports the API (Hypergrowth or higher recommended for bulk sending).

### 3.3 Webhook Registration

The webhook URL is registered automatically the first time a user triggers a send (inside `getOrCreateCampaign`). The registered URL is:

```
{BACKEND_URL}/api/webhooks/instantly
```

Registered event types: `email_opened`, `email_replied`, `email_bounced`, `email_sent`.

If `BACKEND_URL` is not set, webhook registration is skipped (a warning is logged). You can also register the webhook manually in the Instantly dashboard under **Settings → Webhooks**.

### 3.4 Lead Prerequisites

A lead must satisfy all of the following before outreach can be sent:

- Has an `email` address on the Lead document
- `analyzed` is `true` and `websiteAnalysis` is populated (analysis must have completed)

---

## 4. API Reference

All `/api/email-outreach/*` endpoints require a valid JWT in the `Authorization: Bearer <token>` header. The webhook endpoint is public but HMAC-verified.

---

### POST /api/email-outreach/preview

Generate a personalised first-email preview from a lead's analysis data. Does not send anything.

**Request body**

```json
{
  "leadId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "previewLink": "https://example.com/mockup"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `leadId` | string | Yes | MongoDB ObjectId of the lead |
| `previewLink` | string | No | Optional URL to a website mockup to include in the email body |

**Response 200**

```json
{
  "preview": {
    "subject": "Quick question about Sunrise Dental's website",
    "body": "Hi there,\n\nI was researching dental practices..."
  },
  "to": "doctor@sunrisedental.com",
  "from": "outreach@yourdomain.com",
  "leadId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "businessName": "Sunrise Dental"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `leadId` missing or invalid ObjectId |
| 400 | Lead has no email address |
| 400 | Lead has not been analyzed yet |
| 404 | Lead not found |
| 500 | Internal error generating preview |

---

### POST /api/email-outreach/send

Send the 3-step outreach sequence to a single lead via Instantly.ai.

**Request body**

```json
{
  "leadId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "subject": "Quick question about Sunrise Dental's website",
  "body": "Hi there,\n\nI was researching dental practices...",
  "previewLink": "https://example.com/mockup"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `leadId` | string | Yes | MongoDB ObjectId of the lead |
| `subject` | string | Yes | Email subject line |
| `body` | string | Yes | Email body text |
| `previewLink` | string | No | Optional mockup URL passed as a personalisation variable |

**Response 200**

```json
{
  "lead": { "...": "full Lead document" },
  "campaignId": "inst_campaign_abc123",
  "message": "Email outreach queued successfully"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `leadId` missing or invalid |
| 400 | `subject` or `body` empty |
| 401 | No authenticated user |
| 500 | Lead not found, lead has no email, or Instantly API error |

---

### POST /api/email-outreach/send-bulk

Send outreach to multiple leads in one request. Each lead receives its own personalised sequence. Processed concurrently with `Promise.allSettled` — failures are reported individually without aborting the rest.

**Request body**

```json
{
  "leadIds": [
    "64f1a2b3c4d5e6f7a8b9c0d1",
    "64f1a2b3c4d5e6f7a8b9c0d2"
  ],
  "subject": "Quick question about your dental website",
  "body": "Hi there,\n\nI was researching dental practices...",
  "previewLink": "https://example.com/mockup"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `leadIds` | string[] | Yes | Array of Lead ObjectIds (max 100) |
| `subject` | string | Yes | Email subject line |
| `body` | string | Yes | Email body text |
| `previewLink` | string | No | Optional mockup URL |

**Response 200**

```json
{
  "sent": 47,
  "failed": 3,
  "errors": [
    { "leadId": "64f1a2b3c4d5e6f7a8b9c0d9", "error": "Lead has no email address" }
  ],
  "message": "47 sent, 3 failed"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `leadIds` empty or not an array |
| 400 | More than 100 leads |
| 400 | Any `leadId` is not a valid ObjectId |
| 400 | `subject` or `body` empty |
| 401 | No authenticated user |
| 500 | Unexpected error |

---

### GET /api/email-outreach/tracking/:leadId

Retrieve the full email event history for a single lead.

**Path parameter**

| Parameter | Description |
|-----------|-------------|
| `leadId` | MongoDB ObjectId of the lead |

**Response 200**

```json
{
  "emailHistory": [
    {
      "sentAt": "2026-04-09T10:00:00.000Z",
      "templateName": "instantly-outreach",
      "subject": "Quick question about Sunrise Dental's website",
      "body": "Hi there, ...",
      "status": "opened",
      "instantlyEmailId": "inst_lead_xyz",
      "openedAt": "2026-04-09T14:32:00.000Z",
      "repliedAt": null,
      "bouncedAt": null
    }
  ],
  "outreachStatus": "opened",
  "lastOutreachAt": "2026-04-09T10:00:00.000Z",
  "instantlyCampaignId": "inst_campaign_abc123",
  "instantlyLeadId": "inst_lead_xyz"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400 | `leadId` missing or invalid |
| 404 | Lead not found |
| 500 | Internal error |

---

### GET /api/email-outreach/stats

Get aggregate outreach statistics for the authenticated user. Optionally filter by date range.

**Query parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | ISO 8601 string | Filter leads with `lastOutreachAt >= startDate` |
| `endDate` | ISO 8601 string | Filter leads with `lastOutreachAt <= endDate` |

**Response 200**

```json
{
  "totalSent": 120,
  "opened": 45,
  "replied": 12,
  "bounced": 3,
  "openRate": "37.5",
  "replyRate": "10.0",
  "bounceRate": "2.5",
  "campaign": {
    "_id": "...",
    "userEmail": "user@agency.com",
    "instantlyCampaignId": "inst_campaign_abc123",
    "name": "DentalLeads – user@agency.com",
    "status": "active",
    "sendingEmail": "outreach@agency.com",
    "leadsAdded": 120,
    "emailsSent": 120,
    "emailsOpened": 45,
    "emailsReplied": 12,
    "emailsBounced": 3
  }
}
```

Rates are returned as strings representing percentages with one decimal place (e.g., `"37.5"` means 37.5%). When `totalSent` is 0, all rates are `"0"`.

---

### GET /api/email-outreach/campaign

Get the Instantly campaign record for the authenticated user.

**Response 200**

```json
{
  "campaign": {
    "_id": "...",
    "userEmail": "user@agency.com",
    "instantlyCampaignId": "inst_campaign_abc123",
    "name": "DentalLeads – user@agency.com",
    "status": "active",
    "sendingEmail": "outreach@agency.com",
    "instantlyWebhookId": "inst_wh_def456",
    "leadsAdded": 120,
    "emailsSent": 120,
    "emailsOpened": 45,
    "emailsReplied": 12,
    "emailsBounced": 3,
    "createdAt": "2026-04-09T09:00:00.000Z",
    "updatedAt": "2026-04-09T10:30:00.000Z"
  }
}
```

Returns `{ "campaign": null }` (HTTP 200) when no campaign exists yet for this user.

---

### POST /api/webhooks/instantly

Receives event notifications from Instantly.ai. This endpoint is **public** (no JWT required) but is protected by HMAC-SHA256 signature verification.

The endpoint always returns HTTP 200 to prevent Instantly from retrying; invalid or stale events are silently ignored.

**Headers**

| Header | Description |
|--------|-------------|
| `x-instantly-signature` | HMAC-SHA256 hex digest of the raw request body, optionally prefixed with `sha256=` |

**Request body (example — email opened event)**

```json
{
  "event_type": "email_opened",
  "campaign_id": "inst_campaign_abc123",
  "lead_email": "doctor@sunrisedental.com",
  "timestamp": "2026-04-09T14:32:00.000Z"
}
```

Supported `event_type` values:

| Event | Effect |
|-------|--------|
| `email_opened` | Sets `outreachStatus` → `opened`, records `openedAt` |
| `email_replied` | Sets `outreachStatus` → `replied`, records `repliedAt`; sets Lead `status` → `replied` |
| `email_bounced` | Sets `outreachStatus` → `bounced`, records `bouncedAt` |
| `email_sent` | Acknowledged but produces no status change (status is set at send time) |

**Status upgrades only.** The outreach status follows a one-way progression: `pending` → `sent` → `opened`/`bounced` → `replied`. A webhook can never downgrade a status (e.g., an `email_opened` event will not overwrite a `replied` status).

**Response 200**

```json
{ "received": true }
```

---

## 5. Email Sequence Templates

All three emails are generated by `emailTemplateService.generateSequence()` from a set of variables derived from the lead's website analysis.

### Template Variables

| Variable | Source |
|----------|--------|
| `businessName` | `lead.businessName` |
| `websiteUrl` | `lead.website` |
| `oneLineSummary` | `lead.websiteAnalysis.oneLineSummary` |
| `issuesList` | `lead.websiteAnalysis.issuesList` (array of strings) |
| `criticalMissing` | `lead.websiteAnalysis.criticalMissing` (array of strings) |
| `visualIssues` | `lead.websiteAnalysis.visualIssues` (array of strings) |
| `previewLink` | Optional URL passed by the user at send time |
| `senderName` | Derived from the authenticated user's email |

### Email 1 — Immediate (delay: 0 days)

Subject: `Quick question about {businessName}'s website`

Content structure:
1. Opening: states the sender researched the practice and visited the website
2. `oneLineSummary` — the single-sentence audit result
3. Bullet list from `issuesList` — the specific issues found
4. Optional block with `previewLink` if a mockup URL was provided
5. Soft CTA: request for a 10-minute call

### Email 2 — Follow-up (delay: +3 days)

Subject: `Re: Quick question about {businessName}'s website`

Content structure:
1. Follow-up reference to the first email
2. Bullet list from `criticalMissing` — highest-pitch-value gaps
3. Social proof statement about practices that fix these gaps
4. CTA: request for a call this week

### Email 3 — Final check-in (delay: +5 days)

Subject: `Re: Quick question about {businessName}'s website`

Content structure:
1. Brief acknowledgment that the dentist is busy
2. Low-pressure CTA: reply or opt out
3. No further follow-up implied

### Customising Templates

Templates are plain functions in `backend/src/services/emailTemplateService.ts`. To change the copy:

1. Edit the relevant `buildEmail1`, `buildEmail2`, or `buildEmail3` function.
2. The `generatePreviewEmail` export returns Email 1 only (used by the preview endpoint).
3. The `generateSequence` export returns all three as `EmailSequenceStep[]` objects consumed by `instantlyService.createCampaign`.
4. Delay values (0, 3, 5 days) are set in the `return` array at the bottom of `generateSequence`. Change the `delay_days` values there to adjust timing.

Note: Because Instantly campaigns are created once per user, template changes do not affect campaigns already created. Existing campaigns retain the sequence they were created with. New users (or users whose campaign is deleted from MongoDB) will get the updated template.

---

## 6. Webhook Setup and Verification

### How Signature Verification Works

1. Instantly signs each webhook request body with HMAC-SHA256 using a shared secret and places the hex digest in the `x-instantly-signature` header (optionally prefixed with `sha256=`).
2. The webhook route in `backend/src/routes/webhookRoutes.ts` registers a raw-body capture middleware **before** Express parses JSON. This raw string is stored on `req.rawBody`.
3. `webhookController.verifySignature` recomputes the HMAC from `req.rawBody` and compares it to the header value using `crypto.timingSafeEqual` to prevent timing attacks.
4. Events with a `timestamp` older than 5 minutes are rejected to prevent replay attacks.

### Raw Body Middleware Detail

The webhook route must be registered in `index.ts` **before** `app.use(express.json())`. This is already the case:

```typescript
// index.ts — order matters
app.use("/api/webhooks", webhookRoutes);  // raw body captured here
app.use(express.json());                  // JSON parsing for all other routes
```

If you add any global body-parsing middleware above the webhook route, signature verification will break because the raw body will no longer be available.

### Production Checklist

- [ ] `INSTANTLY_WEBHOOK_SECRET` is set to a random 32-byte hex string
- [ ] `BACKEND_URL` is set to the public HTTPS URL of the backend
- [ ] The URL `{BACKEND_URL}/api/webhooks/instantly` is reachable from the public internet
- [ ] Instantly's dashboard shows the webhook as active (auto-registered on first send, or manually added)

---

## 7. Lead Status Flow

### `outreachStatus` on the Lead document

```
(none / pending)
      |
      | POST /api/email-outreach/send
      v
    sent
      |
      |------ webhook: email_bounced ------> bounced
      |
      | webhook: email_opened
      v
   opened
      |
      | webhook: email_replied
      v
  replied  <-------- also sets lead.status = "replied"
```

Transitions are **one-way** (status rank enforced in `isStatusUpgrade`). A bounced email cannot become opened; a replied email cannot be downgraded to opened.

### `status` on the Lead document

The broader lead lifecycle status is updated at two points by the outreach system:

| Trigger | Lead `status` set to |
|---------|----------------------|
| Outreach sent successfully | `email_sent` |
| Webhook: `email_replied` | `replied` |

The lead `status` is not changed for `email_opened` or `email_bounced` events, as those do not represent a commercial action. Downstream conversion to `converted` or `lost` is a manual step.

---

## 8. Frontend Components

### emailOutreachStore (`frontend/app/store/emailOutreachStore.ts`)

Zustand store. Import with:

```typescript
import { useEmailOutreachStore } from "@/app/store/emailOutreachStore";
```

Key state and actions:

| Member | Type | Description |
|--------|------|-------------|
| `previewModalOpen` | boolean | Controls modal visibility |
| `emailPreview` | `EmailPreview \| null` | Populated after preview fetch |
| `previewLoading` | boolean | True while preview API call is in flight |
| `sendingLoading` | boolean | True while send API call is in flight |
| `trackingData` | `Record<leadId, TrackingEntry[]>` | Per-lead tracking cache |
| `outreachStats` | `OutreachStats \| null` | Dashboard aggregate stats |
| `openPreviewModal(leadId, previewLink?)` | async | Fetches preview and opens modal |
| `closePreviewModal()` | sync | Resets modal state |
| `updatePreviewField(field, value)` | sync | Edits subject, body, or previewLink |
| `sendOutreach()` | async → boolean | Sends the current preview; returns true on success |
| `sendBulkOutreach(leadIds, subject, body, previewLink?)` | async | Bulk send |
| `fetchTracking(leadId)` | async | Loads and caches tracking data for a lead |
| `fetchOutreachStats(startDate?, endDate?)` | async | Loads aggregate stats |

### EmailPreviewModal (`frontend/app/components/EmailPreviewModal.tsx`)

Renders an editable modal showing the generated Email 1. Subject, body, and preview link fields are editable before send. The "Send" button calls `sendOutreach()` from the store.

### EmailTrackingTab (`frontend/app/components/EmailTrackingTab.tsx`)

Rendered inside the lead detail page (`/dashboard/leads/[id]`). Calls `fetchTracking(leadId)` on mount and renders a table of email history entries with status badges and timestamps.

### OutreachStatsCard (`frontend/app/components/OutreachStatsCard.tsx`)

Rendered on the main dashboard page. Calls `fetchOutreachStats()` on mount and displays total sent, open rate, reply rate, and bounce rate.

---

## 9. Troubleshooting

### "Campaign not found" or emails not sending

- Confirm `INSTANTLY_API_KEY` is set and valid.
- Confirm `INSTANTLY_EMAIL` is a verified mailbox in your Instantly account.
- Check the backend logs for Instantly API errors during `getOrCreateCampaign`.
- The Campaign document is keyed by `userEmail` (one per user). If the campaign was manually deleted from Instantly's dashboard but still exists in MongoDB, subsequent sends will fail. Delete the Campaign document from MongoDB to force recreation.

### Webhook events not arriving

- Confirm `BACKEND_URL` is set and the backend is publicly reachable over HTTPS.
- Check whether the webhook was registered by querying `GET /api/email-outreach/campaign` and inspecting `instantlyWebhookId`. If null, registration failed — set `BACKEND_URL` and re-trigger by deleting the Campaign document from MongoDB.
- Alternatively, register the webhook manually in Instantly's dashboard under **Settings → Webhooks**, pointing to `{BACKEND_URL}/api/webhooks/instantly`.
- In development, use a tunnel tool (e.g., ngrok) to expose localhost and set `BACKEND_URL` to the tunnel URL.

### "Webhook: invalid signature" in logs

- Confirm `INSTANTLY_WEBHOOK_SECRET` matches the secret configured in Instantly's dashboard for this webhook.
- Confirm the webhook route is registered before `express.json()` in `index.ts` (see Section 6). If any middleware runs before the webhook route and consumes the request body stream, the raw body will be empty and HMAC verification will always fail.

### Signature verification bypassed in development

If `INSTANTLY_WEBHOOK_SECRET` is not set and `NODE_ENV` is not `production`, the server logs:

```
INSTANTLY_WEBHOOK_SECRET not set — skipping signature check
```

This is intentional for local development. Set the variable before deploying to production.

### Stale events ignored

Events with a `timestamp` more than 5 minutes in the past are logged and discarded:

```
Webhook: stale event (type=email_opened) — ignoring
```

This is replay-attack protection. If you are manually replaying test events, ensure the `timestamp` field is within the last 5 minutes.

### Lead status not updating after webhook

- Verify the lead document has both `email` matching `lead_email` in the webhook payload and `instantlyCampaignId` matching `campaign_id`. Both fields are set when `sendOutreach` runs successfully.
- Check backend logs for `Webhook: lead not found` warnings.
- Remember status updates are one-way. If the lead is already `replied`, an `email_opened` event will not change it.

### Rate limiting from Instantly API

`instantlyService` retries up to 3 times with exponential backoff (1s, 2s, 4s) on HTTP 429 responses. If all retries fail, the error propagates and the send request returns HTTP 500. Consider spacing out bulk sends or checking your Instantly plan's rate limits.
