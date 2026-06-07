# Sonrisa Alert Notification System

A backend service that lets users define custom alert rules and receive notifications via email or Slack when matching world events are detected. Built from a PM brief: _"Users set up alerts and get notified via email or Slack when something important happens in the world."_

---

## Architecture

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, API Routes) |
| Database | Supabase (managed PostgreSQL) |
| ORM | Prisma 6 |
| Email | Resend |
| Slack | Incoming Webhooks |
| Deployment | Vercel + Vercel Cron Jobs |

### Key design decisions

**Channel abstraction** — Email and Slack implement a shared `NotificationChannel` interface. Adding a new channel type requires one new class; no schema changes needed (channel config is stored as a JSON column).

**Rule engine (OR logic)** — An alert fires if *any* of its conditions match the incoming event. Conditions are stored as rows (not JSON) to allow efficient SQL lookups. Supported condition types: `keyword`, `category`, `severity`.

**Event ingestion** — A Vercel Cron job polls NewsAPI every 5 minutes. Events are deduplicated by `sourceId` before being stored. The dispatcher fans out to all matching alerts and writes a `NotificationLog` row per channel regardless of success or failure.

---

## Project structure

```
src/
  app/
    admin/                  Read-only admin UI (Server Components)
      _components/          AdminNav client component
      logs/                 Delivery log page
      users/                User list page
    api/
      alerts/               GET + POST /api/alerts
      alerts/[id]/          GET + PUT + DELETE /api/alerts/:id
      ingest/               POST /api/ingest (Vercel Cron endpoint)
  lib/
    channels/
      types.ts              NotificationChannel interface + shared types
      email.ts              Resend email implementation
      slack.ts              Slack Block Kit implementation
      dispatcher.ts         Fan-out logic + NotificationLog writes
    events/
      types.ts              EventSource interface + IncomingEvent type
      mock.ts               Hardcoded events for local testing
      newsapi.ts            NewsAPI integration
      matcher.ts            OR-logic condition matching
    api-helpers.ts          authenticate() + condition/channel validators
    prisma.ts               Prisma client singleton
prisma/
  schema.prisma             Full data model
  migrations/               Applied migrations
  seed.ts                   Creates one test user + one test alert
vercel.json                 Cron schedule (every 5 minutes)
.env.example                All required environment variables
```

---

## Local setup

**Prerequisites:** Node.js 20+, a Supabase project, Resend account, NewsAPI key.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in all values in .env

# 3. Run database migration
npx prisma migrate dev

# 4. Seed test data
npm run seed
# Creates: test@example.com | apiKey: test-api-key-123

# 5. Start dev server
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string (port 6543) |
| `DIRECT_URL` | Supabase direct connection string (for Prisma Migrate) |
| `RESEND_API_KEY` | From resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Verified sender address in your Resend account |
| `NEWSAPI_KEY` | From newsapi.org → Get API Key |
| `CRON_SECRET` | Shared secret between Vercel Cron and `/api/ingest` |
| `ADMIN_API_KEY` | Password for the admin UI (`?key=` query param) |

---

## API reference

All routes require the header `x-api-key: <user api key>`.

### `GET /api/alerts`

Returns all alerts for the authenticated user.

| Query param | Values | Default |
|---|---|---|
| `active` | `true` / `false` | all |

```bash
curl https://your-app.vercel.app/api/alerts \
  -H "x-api-key: test-api-key-123"
```

### `POST /api/alerts`

Creates a new alert.

```bash
curl -X POST https://your-app.vercel.app/api/alerts \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Earthquake Alert",
    "conditions": [
      { "type": "keyword", "value": "earthquake" }
    ],
    "channels": [
      { "channelType": "slack", "config": { "webhookUrl": "https://hooks.slack.com/..." } }
    ]
  }'
```

### `GET /api/alerts/:id`

Returns a single alert with conditions and channels.

### `PUT /api/alerts/:id`

Partial update. `conditions` and `channels`, if provided, replace existing rows entirely. Empty arrays are rejected with `400`.

```bash
curl -X PUT https://your-app.vercel.app/api/alerts/<id> \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{ "isActive": false }'
```

### `DELETE /api/alerts/:id`

Deletes the alert and all associated conditions, channels, and logs. Returns `204`.

### `POST /api/ingest`

Fetches events, matches against active alerts, and dispatches notifications. Called automatically by Vercel Cron every 5 minutes.

Requires `Authorization: Bearer <CRON_SECRET>`.

Returns `{ "processed": N, "skipped": N }`.

---

## Triggering ingest manually

Use `?mock=true` (non-production only) to skip NewsAPI and use hardcoded test events:

```bash
curl -X POST https://your-app.vercel.app/api/ingest?mock=true \
  -H "Authorization: Bearer <CRON_SECRET>"
```

On first run with the seed data in place, this should return `{ "processed": 3, "skipped": 0 }` and fire notifications for any active alerts that match the mock events.

---

## Admin UI

Access any page by appending `?key=<ADMIN_API_KEY>` to the URL. The key is forwarded automatically when navigating between pages.

| Page | URL | Description |
|---|---|---|
| Alert list | `/admin` | All alerts across all users — name, status, condition/channel counts |
| Delivery log | `/admin/logs` | Last 100 notification attempts — status, error messages, channel type |
| User list | `/admin/users` | All users — masked API key, alert count |

---

## Out of scope / future work

- **User-facing UI** — alert management is currently API-only; no frontend for end users
- **Webhook event sources** — ingestion is polling-only; real-time sources (e.g. firehose APIs) are not supported
- **Semantic severity detection** — all NewsAPI events are assigned severity `"medium"`; no NLP-based classification
- **True NewsAPI categories** — `category` is mapped from `source.id` (e.g. `"bbc-news"`), not a semantic label
- **AND condition logic** — conditions use OR; no way to express "earthquake AND high severity" in one alert
- **Admin auth hardening** — `?key=` in query params appears in browser history and server logs; not suitable for production
- **Rate limiting** — no rate limiting on API routes
- **authenticate() caching** — every API call hits the database; a short-lived cache would be needed at scale