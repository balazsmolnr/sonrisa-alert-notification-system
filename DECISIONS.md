# Decision Log

This file documents every significant decision, AI course-correction, and rejected suggestion made during the build. It is updated continuously throughout the process.

---

## Format

Each entry:

- **What the AI suggested or produced**
- **What I accepted, rejected, or changed**
- **Why**

---

## Entries

### 2026-06-07 — Initial scoping

**Decision:** Chose polling over webhooks for event ingestion.  
**Reasoning:** NewsAPI doesn't support push. Polling every 5 minutes is acceptable latency for "breaking news" at prototype scale. If a real-time source is added later (e.g. a firehose API), the architecture supports it — the ingestion layer is behind an interface.

---

### 2026-06-07 — Channel config as JSON vs. typed columns

**AI suggestion (anticipated):** Separate tables for EmailChannelConfig and SlackChannelConfig.  
**Decision:** Single `config JSON` column on `AlertChannel`.  
**Reasoning:** The brief explicitly asks for extensibility. Separate tables require a schema migration every time a new channel type is added. JSON config + a TypeScript interface per channel type gives extensibility without DB churn. Tradeoff: can't query inside config fields easily — acceptable because we don't need to.

---

### 2026-06-07 — AlertCondition as rows vs. JSON

**Decision:** AlertCondition as separate rows (not a JSON blob on Alert).  
**Reasoning:** We need to query "which alerts match this incoming event?" efficiently. If conditions were stored as JSON, we'd have to deserialize every alert's conditions in application code. Separate rows allow a SQL query like `WHERE type = 'keyword' AND value = 'earthquake'` to find candidate alerts quickly.

---

_[New entries added as development proceeds]_

### 2026-06-07 — Backend stack switch: Express → Next.js

**Original AI suggestion:** Express + separate PostgreSQL backend, separate React frontend.
**Changed to:** Next.js + Supabase + Vercel (one repo, everything together).
**Reasoning:** The original stack was chosen by the AI without asking about experience level or preferences. Once it became clear there was no experience with either stack, Next.js was the more logical choice — less configuration overhead, single deployment, and the "backend" is the same TypeScript as the frontend. The evaluation criterion for the task is the quality of the process, not backend complexity.

---

### 2026-06-07 — authenticate() hits the database on every request

**Decision:** `authenticate()` in `src/lib/api-helpers.ts` runs a `SELECT` against the `User` table on every API call — no caching.
**Accepted for v1 because:** Request volume at prototype scale is negligible; adding a cache layer (e.g. Redis, in-memory LRU) before there is a measurable problem is premature.
**Known scaling concern:** At higher request volume, this adds one DB round-trip per request. Mitigation when needed: short-lived in-memory or Redis cache keyed on the API key, with a TTL of ~60 seconds.

---

### 2026-06-07 — Channel config validation deferred to dispatcher

**AI suggestion:** Validate channel config contents at the API layer (e.g. require `address` field on email channels).
**Decision:** API layer only checks that `config` is a non-null object. Deep validation (e.g. required fields per channel type) is deferred to the channel dispatcher.
**Reasoning:** Keeping validation in one place — the dispatcher already has to understand channel-specific config to send notifications. Duplicating that knowledge in the API layer creates two places to update when a new channel type is added.

---

### 2026-06-07 — Resend client instantiation per EmailChannel instance

**Decision:** The `Resend` client is instantiated per `EmailChannel` instance rather than as a shared singleton.
**Accepted for v1 because:** Notification volume at prototype scale is low; optimizing this prematurely adds complexity without measurable benefit.
**Known concern:** At higher volume, repeated instantiation is wasteful. Fix when needed: move to a module-level singleton.

---

### 2026-06-07 — Channel config validation at constructor level

**Decision:** Channel config content (e.g. presence of `address` for email, `webhookUrl` for Slack) is validated in the channel class constructor, not at the API layer.
**Reasoning:** Validation lives close to where the config is used. The API layer only checks that config is a non-null object — adding channel-specific checks there would duplicate knowledge that already lives in the channel classes.

---

### 2026-06-07 — NewsAPI category mapped from source.id, not a true category

**Decision:** The `category` field on ingested events is populated from `article.source.id` (e.g. `"bbc-news"`, `"the-verge"`), not a semantic category like "politics" or "disaster".
**Reasoning:** NewsAPI's `/top-headlines` endpoint does not return a category field per article. `source.id` is the closest available proxy. Falls back to `"general"` when `source.id` is null.
**Known limitation:** Users setting `category` conditions will need to match on source identifiers, not intuitive category names. Fix when needed: switch to `/top-headlines?category=...` endpoint and pass the category as a query param, then expose it on `IncomingEvent`.

---

### 2026-06-07 — Condition matching logic: OR

**Decision:** An alert fires if ANY condition matches (OR logic), not all conditions (AND).
**Reasoning:** Users add multiple conditions to subscribe to a broader topic set, not to narrow results. OR matches typical notification system behaviour. Users who want AND-like precision can create separate single-condition alerts.
**Tradeoff:** No way to express "earthquake AND high severity" in one alert. Accepted for v1.

---

### 2026-06-07 — Ingest dedup strategy: batch findMany + createMany vs. upsert

**Decision:** Instead of per-event upsert, the ingest route does one batch `findMany` to find existing sourceIds, filters them out, then `createMany` with `skipDuplicates: true`.
**Reasoning:** More efficient for batches — one query instead of N upserts. `skipDuplicates` provides a safety net for race conditions. Tradeoff: a small window exists between the `findMany` and `createMany` where a duplicate could slip through — `skipDuplicates` handles this.

---

### 2026-06-07 — Admin UI authentication: query param key

**Decision:** Admin pages are protected by a `?key=` query param matching `ADMIN_API_KEY` env var. No session, no cookie.
**Accepted for v1:** Simple, shareable, zero infrastructure.
**Known limitation:** The key appears in browser history, server logs, and any URL sharing. Not suitable for production. A proper solution would use a session cookie or HTTP Basic Auth.

---

### 2026-06-07 — Admin unauthorized() helper is duplicated across pages

**Decision:** `unauthorized()` is defined inline in each admin page rather than as a shared component.
**Accepted for v1:** Only two pages currently need it; extraction before a third exists is premature.
**Known concern:** As pages grow, this should be refactored to `src/app/admin/_components/Unauthorized.tsx` and imported by each page.

---

### 2026-06-07 — matchAlerts made generic to preserve full alert type

**Decision:** `matchAlerts` was refactored from `(alerts: AlertWithConditions[]) => AlertWithConditions[]` to a generic `<T extends AlertWithConditions>(alerts: T[]) => T[]`.
**Why it was needed:** The ingest route loads alerts as `FullAlert` (conditions + channels). After passing through `matchAlerts`, the return type narrowed to `AlertWithConditions`, dropping the `channels` property that `dispatch` requires. TypeScript caught this at build time before it could fail silently at runtime.
**Note:** This is a good example of TypeScript's type system catching a real correctness bug — without the generic, the code would have compiled with a cast and potentially crashed at runtime when `dispatch` tried to access `alert.channels`.

---

### 2026-06-07 — Keyword matching scope

**Decision:** Keyword conditions match against `headline` and `summary` fields only — not `url` or `category`.
**Reasoning:** These are the human-readable fields where meaningful keywords appear. Matching against URL or category strings would produce false positives.

---

### 2026-06-07 — .env.example excluded from .gitignore

**Decision:** Added `!.env.example` exception to `.gitignore` so the example env file is committed to the repo.
**Why it became necessary:** The Next.js scaffold's `.gitignore` uses `.env*` which catches `.env.example`. When the env example only had Supabase vars it was optional. Once it documented all 7 required env vars (including API keys and secrets), it became essential for the repo to track it.
**Earlier decision:** Previously rejected as unnecessary — revisited when `.env.example` was silently excluded from the deployment config commit.
