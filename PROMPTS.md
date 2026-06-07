# Prompt History

Full record of all AI interactions during this project. Includes the prompt, what was produced, and what was accepted/rejected/modified.

---

## Format

```
### [Date] — [Topic]
**Tool:** Claude / ChatGPT / Copilot / etc.
**Prompt:**
> [exact prompt text]

**Output summary:** [what was produced]
**Accepted / Modified / Rejected:** [what happened and why]
```

---

## Entries

### 2026-06-07 — Initial planning

**Tool:** Claude (claude.ai)  
**Prompt:**
> I have a vague PM brief asking for an alert notification system. Users set up alerts, get notified via email or Slack when "something important happens in the world." Needs an admin view. I need to take this from ambiguity to a working implementation. Help me define a plan of attack — what deliverables, in what order, and why. Stack: Node.js + TypeScript, PostgreSQL + Prisma, React.

**Output summary:** Produced `PLAN.md` with phased execution plan, deliverable list, key design decisions, and evaluation criteria.  
**Accepted with minor edits:** Added explicit "Out of Scope" section to keep scope contained.

---

### 2026-06-07 — Scoping document

**Tool:** Claude (claude.ai)  
**Prompt:**
> Now write a scoping document (`SCOPING.md`) that resolves every ambiguity in the brief before any code is written. Cover: what "important event" means, where event data comes from, what the data model looks like, what the admin view shows, how authentication works, and how channel extensibility is achieved. Log all assumptions explicitly.

**Output summary:** Produced `SCOPING.md` with resolved decisions on all ambiguities, data model sketch, and open questions list.  
**Accepted:** Reviewed data model — `AlertCondition` as rows (not JSON) was a deliberate choice I validated before accepting.

---

_[New entries added as development proceeds]_

### 2026-06-07 — Stack decision

**Tool:** Claude (claude.ai)
**Prompt:** Which would be the better solution and why — Express + PostgreSQL or Next.js + Supabase? I have no experience with either stack.
**Output:** Comparison of the two stacks, recommendation for Next.js because everything is in one repo, less boilerplate, and it's the more practical choice given the experience level.
**Accepted:** The reasoning was sound. Added to DECISIONS.md as an explicit stack switch, noting that the original Express suggestion was an AI error.

---

### 2026-06-07 — Next.js scaffold setup

**Prompt:** Scaffold doesn't exist in the repo despite briefing claiming it does. Run create-next-app in the current directory.
**Output:** Attempted `create-next-app .` — failed due to existing files conflict and Node.js v18 (needed >=20). Upgraded Node to v24.16.0 via winget, scaffolded in a temp directory, copied files over, removed temp directory. Fixed `package.json` name from "temp-scaffold" to "sonrisa-alert-notification-system".
**Accepted:** All steps completed successfully.

---

### 2026-06-07 — Branch-per-step workflow

**Prompt:** Every development step should have a new branch created for traceability.
**Output:** Established pattern: create a `feature/<name>` branch before each phase, commit on branch, merge to main at phase end.
**Accepted:** Applied from this point forward. Saved to memory.

---

### 2026-06-07 — Prisma setup + schema

**Prompt:** Install Prisma, create `prisma/schema.prisma` with the approved schema, create `.env.example`.
**Output:** Installed `prisma@^7` and `@prisma/client@^7`, created schema file verbatim from briefing, created `.env.example` with Supabase connection string placeholders. Branch: `feature/prisma-setup`.
**Modified:** Prisma 7 was installed but immediately failed — `url`/`directUrl` are no longer supported in `schema.prisma` in v7. Downgraded to Prisma 6 (`^6`) to keep the approved schema intact. Migration `20260607142430_init` applied successfully.

---

### 2026-06-07 — API routes plan

**Prompt:** Show me the planned structure for both route files so I can approve it before writing any code.
**Output:** Planned `GET /api/alerts`, `POST /api/alerts`, `GET/PUT/DELETE /api/alerts/[id]` with auth via `x-api-key` header, replace strategy for conditions/channels on PUT, cascade delete.
**Modified:** User added `?active=true/false` filter to GET. User clarified empty array on PUT = 400 validation error (not delete-all or no-op).

---

### 2026-06-07 — authenticate() DB query decision

**Prompt:** Note in DECISIONS.md that authenticate() runs a DB query on every call — acceptable now but needs caching at scale.
**Output:** Added entry to DECISIONS.md documenting the known concern and suggested mitigation (in-memory/Redis cache with ~60s TTL).
**Accepted.**

---

### 2026-06-07 — Channel config validation placement

**Prompt:** Channel config content is not validated at the API layer in v1 — only that it is a non-null object. Deep validation deferred to the channel dispatcher. Add to DECISIONS.md.
**Output:** Added DECISIONS.md entry. API layer kept to non-null object check only.
**Accepted.**

---

### 2026-06-07 — api-helpers.ts extraction

**Prompt:** Extract `authenticate()` and condition/channel validators to `src/lib/api-helpers.ts`, then write `[id]/route.ts` using those helpers. Show api-helpers.ts first.
**Output:** Designed `api-helpers.ts` with `authenticate()`, `validateConditions()`, `validateChannels()` — each validator returns `string | null`. Shown as preview, approved, then written.
**Accepted.**

---

### 2026-06-07 — getOwnedAlert single-query optimisation

**Prompt:** GET calls `getOwnedAlert` then `findUnique` again — that's 2 DB queries. Refactor to accept an optional include parameter.
**Output:** Refactored `getOwnedAlert` to accept optional `include?: { conditions: true; channels: true }`. GET passes it → 1 query. PUT/DELETE omit it → lightweight ownership check only.
**Accepted.**

---

### 2026-06-07 — Channel abstraction plan + format decisions

**Prompt:** Show the plan for the channel abstraction layer before writing any code. Plain text email, Block Kit for Slack.
**Output:** Planned `types.ts`, `email.ts`, `slack.ts`, `dispatcher.ts`. Format decisions: plain text email, Slack Block Kit with severity emoji. `send()` receives base `Alert` (not with includes) — dispatcher holds `AlertWithChannels`. Used `Prisma.AlertGetPayload` for type safety.
**Accepted after clarification:** User asked to define exact `send()` types before writing implementations — `Alert` (base) confirmed sufficient for `send()`, `AlertWithChannels` used only by dispatcher.

---

### 2026-06-07 — dispatcher.ts log write error handling

**Prompt:** What happens if `prisma.notificationLog.create` itself throws? The error would be silently lost.
**Output:** Wrapped log write in a second `try/catch` with `console.error`. Channel send failures and log write failures are now independently caught — neither can silently swallow the other.
**Accepted.**

---

### 2026-06-07 — Condition matching: OR logic

**Prompt:** AND or OR logic for alert condition matching?
**Output:** Recommended OR — users add conditions to broaden subscriptions, not narrow them. AND-like precision achievable via separate alerts. Logged to DECISIONS.md.
**Accepted.**

---

### 2026-06-07 — Event ingestion plan

**Prompt:** Show the plan for the event ingestion layer before writing any code.
**Output:** Planned `types.ts` (EventSource interface + IncomingEvent type), `mock.ts` (hardcoded test events), `newsapi.ts` (NewsAPI integration, severity hardcoded to "medium"), `matcher.ts` (OR condition matching), `src/app/api/ingest/route.ts` (Vercel Cron entry point with dedup, dispatch, processedAt tracking).
**Accepted with OR logic confirmed.**
