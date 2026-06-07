# Alert System — Project Plan

**Author:** [Your name]  
**Date:** 2026-06-07  
**Stack:** Next.js + TypeScript · Supabase (PostgreSQL) · Prisma · Vercel

---

## Brief Summary

A product manager asked for a system where users can set up alerts and get notified when "something important happens in the world" — via email or Slack, with extensibility for future channels, plus an admin view.

No wireframes, no schema, no event source defined. This plan resolves those ambiguities before writing any code.

---

## Stack Decision

**Next.js + Supabase + Vercel** — egy repo, egy deployment, minden TypeScript.

- **Next.js** — frontend (React) és backend (API Routes) egyben, egy projektben
- **Supabase** — managed PostgreSQL adatbázis, ingyenes tier elegendő
- **Prisma** — TypeScript-friendly adatbázis kliens
- **Resend** — email küldés API (egyszerűbb mint SMTP)
- **Vercel** — deployment + Cron Jobs (a polling job-hoz)

Alternatíva volt egy külön Express backend, de elvetettük: több boilerplate, két külön deployment, és a feladat szempontjából nem ad többet. Lásd `DECISIONS.md`.

---

## Deliverables (self-defined)

| # | Deliverable | Why |
|---|-------------|-----|
| 1 | `SCOPING.md` — resolved ambiguities and assumptions | Forces upfront decisions; prevents rework |
| 2 | `PLAN.md` — this document | Scopes the work before touching code |
| 3 | Prisma schema + Supabase migrations | Data model must be stable before building on it |
| 4 | API Routes — alerts CRUD | Core backend logic |
| 5 | Channel abstraction + Email + Slack | Proves extensibility |
| 6 | Event ingestion — mock + NewsAPI | Feeds the system |
| 7 | Admin UI — React pages in Next.js | Dashboard for alerts and delivery logs |
| 8 | `DECISIONS.md` — ongoing log | Documents AI course-corrections |
| 9 | `PROMPTS.md` — prompt history | Full record of AI interactions |

---

## Execution Order & Rationale

### Phase 1 — Define (before any code)
1. `SCOPING.md` — resolve ambiguities
2. Data model design — entities and relationships on paper
3. `PLAN.md` — this document

### Phase 2 — Foundation
4. Init Next.js project with TypeScript
5. Connect Supabase, set up Prisma
6. Write and run DB migrations

### Phase 3 — Backend (API Routes)
7. `GET/POST /api/alerts` — list and create alerts
8. `GET/PUT/DELETE /api/alerts/[id]` — manage individual alerts
9. `GET /api/admin/users` — admin endpoints
10. `GET /api/admin/logs` — delivery log

### Phase 4 — Channel system
11. `NotificationChannel` TypeScript interface
12. `EmailChannel` implementation (Resend)
13. `SlackChannel` implementation (Incoming Webhooks)
14. `NotificationDispatcher` — fan-out logic

### Phase 5 — Event ingestion
15. `MockEventEmitter` — synthetic events for local dev
16. NewsAPI integration
17. Rule evaluation engine — does event match alert conditions?
18. Vercel Cron job — triggers polling every 5 minutes

### Phase 6 — Admin UI
19. `/admin` — alert list across all users
20. `/admin/logs` — delivery log with filters
21. `/admin/users` — user list

### Phase 7 — Polish
22. README with setup instructions
23. Final `DECISIONS.md` review

---

## Key Design Decisions

**Channel extensibility:**
`NotificationChannel` interface — each channel is a class implementing `send()`. New channels require no changes to existing code.

**Rule engine:**
`AlertCondition` rows in DB (not JSON) — enables efficient SQL queries when matching incoming events against user alerts.

**Admin view:**
Read-only in v1. No user impersonation or alert editing.

**Auth:**
API key auth only (header: `X-API-Key`). Not production-ready — explicitly noted.

---

## What I Will Critically Evaluate

- Prisma schema: missing indexes, wrong relation directions, N+1 risks
- Slack channel code: verify webhook payload against current Slack docs
- Rule engine: edge cases — empty rules, duplicate events, timezone handling
- Any suggested library: check publish date and download count before accepting

---

## Out of Scope (v1)

- Real-time push (WebSocket / SSE)
- User authentication / OAuth
- Alert deduplication
- Rate limiting on notifications
- Digest mode (daily summary)
