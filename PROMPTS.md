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

### 2026-06-07 — Stack döntés

**Tool:** Claude (claude.ai)  
**Prompt:**
> Melyik lenne a jobb megoldás és miért — Express + PostgreSQL vagy Next.js + Supabase? Egyik stackben sincs tapasztalatom.

**Output summary:** Összehasonlítás a két stack között, javaslat Next.js-re mert egy repóban van minden, kevesebb boilerplate, és a tapasztalati szint mellett ez a praktikusabb választás.  
**Elfogadva:** A döntés logikus. Bekerült a DECISIONS.md-be mint explicit stack-váltás, kiemelve hogy az eredeti Express javaslat AI hiba volt.
