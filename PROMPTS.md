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

---

### 2026-06-07 — Admin UI auth decision

**Prompt:** Add decision: Admin pages protected by `?key=` query param matching `ADMIN_API_KEY` env var. No session, no cookie. Known limitation: key visible in browser history and logs.
**Output:** Added to DECISIONS.md.
**Accepted.**

---

### 2026-06-07 — Admin UI plan

**Prompt:** Show the plan for the Admin UI before writing anything. Keep it simple, read-only, no authentication beyond existing API key pattern. Prioritise alert list and delivery log over user list. Auto-append key to nav links.
**Output:** Planned Server Components querying Prisma directly. `layout.tsx` (nav shell), `admin/page.tsx` (alert list), `admin/logs/page.tsx` (delivery log, last 100 rows), `admin/users/page.tsx` (user list, lower priority). Auth via `?key=` query param. Tailwind utility classes, plain `<table>` layout.
**Accepted.**

---

### 2026-06-07 — src/app/admin/layout.tsx

**Prompt:** Write layout.tsx first — shared nav shell with auto-appended ?key= param on all links.
**Output:** Server Component with nav links to Alerts, Delivery Log, Users. Key forwarded via searchParams to all nav hrefs.
**Accepted.**

---

### 2026-06-07 — src/app/admin/page.tsx

**Prompt:** Write the alert list page.
**Output:** Server Component. Auth check against ADMIN_API_KEY env var. Table with columns: Name, User email, Status (badge), Conditions count, Channels count, Created date. Uses Prisma _count for condition/channel counts. Sorted by createdAt desc.
**Accepted.**

---

### 2026-06-07 — unauthorized() duplication noted

**Prompt:** Note in DECISIONS.md that unauthorized() is duplicated across admin pages, worth refactoring to a shared component in the future.
**Output:** Added to DECISIONS.md. Suggested future path: `src/app/admin/_components/Unauthorized.tsx`.
**Accepted.**

---

### 2026-06-07 — src/app/admin/logs/page.tsx

**Prompt:** Write the delivery log page.
**Output:** Server Component. Auth check. Table with last 100 NotificationLog rows: Sent at, Alert name, Event headline (truncated with title attr), Channel type, Status badge (green/red), Error message (truncated to 60 chars, full text on hover). Sorted by sentAt desc.
**Accepted.**

---

### 2026-06-07 — src/app/admin/users/page.tsx

**Prompt:** Write the users page.
**Output:** Server Component. Auth check. Table with columns: Name, Email, API key (last 8 chars visible, rest masked), Alert count (via _count), Created date. Sorted by createdAt desc.
**Accepted.**

---

### 2026-06-07 — Build fix: layout.tsx searchParams + AdminNav Suspense

**Prompt:** `npm run build` failed — Next.js layouts don't receive searchParams. Fix by extracting nav to a client component using useSearchParams(), wrapped in Suspense with a fallback.
**Output:** Created `src/app/admin/_components/AdminNav.tsx` (client component, useSearchParams, AdminNavFallback export). Rewrote `layout.tsx` to import AdminNav wrapped in `<Suspense fallback={<AdminNavFallback />}>`.
**Accepted.**

---

### 2026-06-07 — Build fix: matchAlerts generic type

**Prompt:** Build error — matchAlerts returns AlertWithConditions[] but dispatch expects AlertWithChannels. The return type drops the channels property.
**Output:** Made matchAlerts generic: `function matchAlerts<T extends AlertWithConditions>(alerts: T[]): T[]`. The function now preserves the full input type, so FullAlert[] in → FullAlert[] out.
**Accepted.**

---

### 2026-06-07 — DECISIONS.md entry: matchAlerts generic

**Prompt:** Add a DECISIONS.md entry noting that matchAlerts was made generic during the build fix to preserve the full alert type through to dispatch. Caught by TypeScript at build time, not runtime.
**Output:** Added entry to DECISIONS.md documenting the generic refactor, why it was needed, and noting this as an example of TypeScript catching a real correctness bug before runtime.
**Accepted.**

---

### 2026-06-07 — .env.example

**Prompt:** Write the full .env.example with all required environment variables.
**Output:** Added RESEND_API_KEY, RESEND_FROM_EMAIL, NEWSAPI_KEY, CRON_SECRET, ADMIN_API_KEY alongside the existing Supabase vars. Each entry has a comment explaining where to get the value and how to generate secrets.
**Accepted.**

---

### 2026-06-07 — vercel.json

**Prompt:** Write vercel.json with cron schedule for /api/ingest every 5 minutes.
**Output:** Minimal vercel.json with one cron entry: path /api/ingest, schedule */5 * * * *. Vercel automatically sends Authorization: Bearer $CRON_SECRET on cron invocations.
**Accepted.**
