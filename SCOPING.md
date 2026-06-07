# Scoping Document — Alert System

**Status:** Approved (self-defined, no PM available)  
**Date:** 2026-06-07

This document resolves every ambiguity in the original PM brief before any code is written. Each decision is logged with reasoning. If assumptions later prove wrong, this is the document to update — and downstream code changes flow from here.

---

## Original Brief

> "We want users to be able to set up alerts so they get notified when something important happens in the world — like breaking news, market movements, natural disasters, that kind of thing. Should work for both email and Slack. Make it flexible enough that we can add more channels later. We need an admin view too."

---

## Resolved Ambiguities

### 1. What is "something important"?

**Decision:** Users define importance themselves via alert rules. An alert has:
- One or more **keywords** (e.g. "earthquake", "Fed rate")
- An optional **category filter** (breaking-news, markets, disasters, technology)
- An optional **severity threshold** (if the event source provides one)

**Rationale:** "Important" is subjective. A rule engine is the only approach that scales — hardcoding categories would require code changes every time the definition of "important" changes.

**Assumption logged:** The event source provides category metadata. If it doesn't, keyword matching alone is the fallback.

---

### 2. Where does event data come from?

**Decision:** [NewsAPI](https://newsapi.org) as the primary external source. Polled every 5 minutes via a background job (not a webhook, because NewsAPI doesn't support push).

**Rationale:** Free tier supports 100 requests/day, which is sufficient for a prototype. The polling interval is configurable via environment variable.

**Rejected alternative:** Twitter/X API — too expensive and unreliable for v1.  
**Rejected alternative:** Manual event submission only — doesn't match the "breaking news" spirit of the brief.

**Mock source:** A `MockEventEmitter` class generates synthetic events locally, so development and testing work without an API key.

---

### 3. What does a notification look like?

**Decision:**
- **Email:** Subject line with event headline, body with summary + source URL, sent via SMTP (configurable) or Resend API.
- **Slack:** A formatted message block with headline, category badge, and link. Uses Slack Incoming Webhooks (not the full Slack API — simpler, no OAuth required).

**Immediate vs digest:** v1 sends notifications immediately when a matching event is detected. Digest mode (daily summary) is out of scope but the data model supports it.

---

### 4. What is the data model?

```
User
  id, email, name, apiKey, createdAt

Alert
  id, userId, name, isActive, createdAt
  → has many AlertConditions
  → has many AlertChannels

AlertCondition
  id, alertId, type (keyword | category | severity), value

AlertChannel
  id, alertId, channelType (email | slack), config (JSON)
  # config examples:
  #   email:  { "address": "user@example.com" }
  #   slack:  { "webhookUrl": "https://hooks.slack.com/..." }

Event
  id, sourceId, headline, summary, category, severity, url, publishedAt, processedAt

NotificationLog
  id, alertId, eventId, channelType, status (sent | failed), sentAt, errorMessage
```

**Key design choices:**
- `AlertChannel.config` is JSON — adding a new channel type (SMS, PagerDuty) requires no schema migration, just a new class
- `AlertCondition` is a separate table (not a JSON blob) — makes querying "all alerts matching keyword X" possible without a full table scan
- `NotificationLog` records every delivery attempt — admin view and debugging depend on this

---

### 5. What does the admin view show?

**Decision:** A read-only React dashboard with three sections:

1. **Users** — list of registered users, their alert count, last active
2. **Alerts** — all alerts across all users, with conditions and channel config visible
3. **Delivery Log** — recent notification attempts, filterable by status (sent/failed), channel type, and date range

**Not in admin v1:**
- Creating or editing alerts on behalf of users
- Impersonating users
- Configuring event sources

**Rationale:** Read-only is safer and faster to build. The brief says "we need an admin view" — it doesn't say admins need to write data.

---

### 6. Authentication

**Decision:** Simple API key auth for the backend (header: `X-API-Key`). Admin UI is protected by a separate hardcoded admin token (environment variable).

**Rationale:** Full OAuth/JWT is out of scope for a prototype. The question being answered is whether the alert system works, not whether the auth is production-grade.

**Explicitly noted as not production-ready.**

---

### 7. Channel extensibility

**Decision:** A `NotificationChannel` TypeScript interface:

```typescript
interface NotificationChannel {
  type: string;
  send(notification: NotificationPayload): Promise<void>;
}
```

New channels are registered in a `ChannelRegistry` at startup. The dispatcher looks up the correct channel by `channelType` string. Adding a new channel = create a new class + register it. Zero changes to existing code.

---

## Open Questions (punted to future)

| Question | Status |
|----------|--------|
| What if the same event triggers the same alert twice? | Out of scope — deduplication by `sourceId` is partial mitigation |
| Rate limiting (too many notifications to one user) | Out of scope — noted in README |
| Timezone-aware scheduling ("only notify me 9am–5pm") | Out of scope |
| Multi-language support | Out of scope |

---

## Assumptions Summary

1. NewsAPI provides sufficient event volume and category metadata for v1
2. Users are trusted to provide valid Slack webhook URLs (no validation beyond format check)
3. Email sending via SMTP relay — no custom domain required for the prototype
4. A single polling job is sufficient (no horizontal scaling needed in v1)
5. Admin access is restricted by a single shared token (not per-admin accounts)
