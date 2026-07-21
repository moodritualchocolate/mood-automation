# Brain Activation Roadmap · 30 Improvements

**Goal:** take the brain that was built — strategy stack, vertical intelligence,
LLM adapter, cognitive layers, provider adapters — and make it WORK: produce
sellable output, learn from usage, and earn money.

**Ordering:** phases are sequential; items inside a phase are ranked by
impact-per-effort. Effort: S (< half day) · M (1-2 days) · L (3+ days).
"Key" marks items requiring `OPENAI_API_KEY`; everything else runs today.

---

## Phase A · Make the generator genuinely good (the core brain) — items 1-10

| # | Improvement | Effort | Key | Why it matters |
|---|---|---|---|---|
| 1 | **Run LIVE OpenAI validation** — `diagnose-openai.ts` on the operator's machine, pass the 40/60 gate | S | ✅ | The single blocking gate before charging money. Everything below raises the ceiling; this opens the door. |
| 2 | **Deepen the corpus 2-3× per vertical** — more hooks per family, more UGC angles, richer vocabulary | L | — | Density floors sit at 60-63% for several verticals. Corpus depth lifts BOTH the stub path (32.4 →~36) and the LLM path (better few-shot examples). The moat is content. |
| 3 | **Per-archetype copy variation** — same vertical, different audience archetype → different hooks | M | — | Today two real-estate brands with different audiences get near-identical kits. The schema already carries `resolvedAudience`; the corpus needs per-archetype hooks. |
| 4 | **Feedback loop from review screen** — `mvpSelectionMemory` already records kept/skipped hook IDs; aggregate per vertical+family and boost/dampen future ranking | M | — | REAL learning from REAL usage, zero new UI. The signal is already being captured — nothing reads it yet. |
| 5 | **LLM tie-break for vertical detection** — brand descriptions with no keyword hit currently fall back to chocolate silently | S | ✅ | A wrong vertical produces confidently wrong output. One short LLM call fixes the silent-fallback failure mode. |
| 6 | **"Other" vertical graceful path** — low-confidence detection → ask the operator to confirm, or capture email for the 90-day vertical waitlist | S | — | The design doc promised refusal over generic output. Today the promise isn't enforced in the flow. |
| 7 | **Anthropic adapter** — second LLM provider behind the same `mvpGenerate()` boundary (`@anthropic-ai/sdk` already in package.json) | M | ✅ | Provider redundancy: if OpenAI fails/limits, generation degrades to corpus today. A second provider makes LIVE resilient. |
| 8 | **Regenerate button** — "another 10 hooks", excluding already-seen ones, biased by what the operator kept | M | — | Turns one-shot generation into a session. Selection signal (item 4) makes each round better. |
| 9 | **Self-scoring before display** — run each generated kit through the deterministic quality scorer; auto-retry items below threshold | M | — | The scorer exists in the verifier. Moving it into the pipeline means weak output never reaches the customer. |
| 10 | **Brand-voice layer** — feed the operator's own phrasing (from onboarding free-text) into the LLM prompt as tone examples | M | ✅ | V2 of the design doc. Makes output feel like THE brand, not just the industry. |

## Phase B · Product experience — items 11-15

| # | Improvement | Effort | Key | Why |
|---|---|---|---|---|
| 11 | **Full Hebrew RTL polish on the 4 MVP screens** — onboard → generating → review → library | M | — | The product is Hebrew-first; the MVP screens are functional but not native-feeling. This is the paying customer's entire journey. |
| 12 | **Inline editing in review** — edit hook text in place, not just keep/skip | M | — | Operators always want to tweak. Editing keeps them in-app instead of copying to Notes; edits are also learning signal. |
| 13 | **Library export** — copy-all button + downloadable brief (.docx/PDF) with the full kit | M | — | The deliverable today is copy-paste. A branded export document is what customers show their team — and it markets us. |
| 14 | **Generation progress streaming** — real stage-by-stage progress instead of a spinner | S | — | 6-14s LLM latency feels long silently. "Analyzing vertical → composing hooks → validating" earns trust for free. |
| 15 | **Onboarding examples + vertical confirmation** — placeholder examples per question, plus "we detected: Real Estate — correct?" using `detectionConfidence` | S | — | Better input → better output. Confirmation kills wrong-vertical kits at the source. |

## Phase C · Trust & operations — items 16-20

| # | Improvement | Effort | Key | Why |
|---|---|---|---|---|
| 16 | **Decide the 979-file cognitive layer: wire or archive** — audit which engines feed the MVP; move the rest to `legacy/` | L | — | Honest item. Most engines are observational and unwired. Shrinking active surface cuts build time, confusion, and risk. Nothing is deleted — archived with a map. |
| 17 | **Cost + latency telemetry surface** — `llmDiagnostics` already returns tokens/latency/fallbacks per generation; persist and show in an operator/admin view | S | — | Can't run a paid product blind on unit economics. The data already exists per call — it's just discarded. |
| 18 | **Per-tenant generation quotas + rate limiting** — N generations per plan per month, enforced at the API | M | — | Before Stripe there must be something to sell tiers OF. Also protects the LLM budget from abuse. |
| 19 | **CI verifier gate** — GitHub Action running typecheck + build + the verifier suite on every push | S | — | The suite (80/80 · 42/42 · 12/12) only protects when it runs automatically. One YAML file. |
| 20 | **Error monitoring** — minimal server-side error log store + operator view (or Sentry) | S | — | First paying customer hits a bug → today nobody knows. |

## Phase D · Commercial engine — items 21-25

| # | Improvement | Effort | Key | Why |
|---|---|---|---|---|
| 21 | **Stripe checkout** — single product, one price, license per workspace | M | after #1 | The gate: only after LIVE passes 40/60. Then this is the revenue switch. |
| 22 | **Landing page with REAL generated examples** — one genuine kit per vertical as social proof | M | ✅ | "Show, don't tell." Real hooks per industry outsell any copy about AI. |
| 23 | **Two pricing tiers** — corpus tier (cheap/instant) vs LLM tier (premium) | S | — | The two paths already exist behind one boundary. Price the difference; the corpus tier also hedges LLM downtime. |
| 24 | **Concierge mode for first 10 customers** — operator-assisted onboarding per `mvp-launch-plan.md` | M | — | The plan's revenue track that needs zero new code. Learning per customer feeds items 2-4. |
| 25 | **Public share link per kit** — read-only branded page of a generated kit | M | — | Every shared kit is an ad. The viral loop for a B2B tool. |

## Phase E · Growing the moat — items 26-30

| # | Improvement | Effort | Key | Why |
|---|---|---|---|---|
| 26 | **Verticals 11-15** — dental clinic, real-estate agent, therapist, photographer, event producer | L | — | Each vertical is ~4-6h of content work and multiplies addressable market. The roadmap IS verticals. |
| 27 | **English-corpus deepening** — the `en` side is thinner than `he` in most verticals | M | — | Unlocks non-Israeli customers with the same engine. Content-only. |
| 28 | **Selection-driven corpus updates** — quarterly: promote hooks operators keep, demote/rewrite ones they skip (builds on item 4's data) | M | — | The design doc's V3 learning loop at honest scale: the knowledge base gets smarter with every customer. |
| 29 | **Wire ONE image adapter** — 11 image/video adapters exist unwired in `lib/providers/`; connect one (e.g. `openaiImageAdapter`) so image concepts become actual images behind operator approval | L | ✅ | The kit's visual half becomes real. Massive perceived-value jump: from "prompts for a designer" to "assets". |
| 30 | **Multi-brand workspaces** — tenancy already exists; expose a brand switcher so an agency manages several brands | M | — | Turns single-brand customers into agencies — the highest-LTV segment — using infrastructure that's already built. |

---

## The dependency spine

```
#1 LIVE gate ──► #21 Stripe ──► revenue
      │
#2-#4 corpus+learning ──► quality rises on BOTH paths
      │
#16 surface cleanup ──► everything else moves faster
      │
#26-#27 verticals ──► market expands
      │
#29 images ──► perceived value jumps
```

**Recommended start (no key needed): #4 → #2 → #3 → #15 → #6.**
The learning loop first — because every day it's not wired, real usage
signal is being recorded and wasted.
