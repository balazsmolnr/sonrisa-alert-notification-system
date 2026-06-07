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

### 2026-06-07 — Backend stack váltás: Express → Next.js

**Eredeti AI javaslat:** Express + külön PostgreSQL backend, külön React frontend.  
**Megváltoztatva:** Next.js + Supabase + Vercel (egy repo, minden egyben).  
**Miért:** Az eredeti stack-et az AI anélkül választotta, hogy megkérdezte volna a tapasztalati szintet vagy a preferenciákat. Miután kiderült, hogy egyik stackben sincs tapasztalat, a Next.js logikusabb választás — kevesebb konfigurációs overhead, egy deployment, és a "backend" ugyanolyan TypeScript mint a frontend. A feladat értékelési szempontja a folyamat minősége, nem a backend komplexitása.
