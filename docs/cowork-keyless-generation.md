# Keyless premium generation via Claude Cowork tasks

**Goal:** get LLM-grade output **without a paid API key and without spend** —
the premium generation is fulfilled by **Claude Cowork as a task** instead of a
paid OpenAI/Anthropic call. This is the pragmatic alternative to roadmap #1
(LIVE key gate) / #21 (Stripe) while the operator does not want to spend.

## How it works

```
operator generates
      │
      ▼
runMvpGeneration()  ──►  delivers the INSTANT corpus kit (providerId: stub)   ← unchanged, always free
      │
      └─ coworkEnabled()?  ──►  enqueueCoworkTask()  →  data/memory/mvp-cowork-queue.json
                                                              │
                    Claude (Cowork), on demand or on a schedule, drains it:
                                                              │
   scripts/cowork-fulfill.ts  list → brief <taskId> → apply <taskId> hooks.json
                                                              │
                          applyCoworkKit() VALIDATES every hook against the
                          SAME contract the paid path uses, then upgrades the
                          generation (providerId → cowork).
```

`coworkEnabled()` is **on by default whenever there is no paid key**. It turns
itself off automatically if `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` is set (the
real-LLM path takes over), and can be forced off with `MVP_COWORK=0`.

The corpus kit is **always delivered first**, so the operator never waits and
enqueue failures never affect it. The Cowork upgrade replaces the hooks when it
lands.

## The task interface (what Claude runs in Cowork)

```bash
# 1 · see the queue
npx tsx scripts/cowork-fulfill.ts list

# 2 · get the contract for one task
npx tsx scripts/cowork-fulfill.ts brief <taskId>
#     → brand signals · vertical · audience · purchase moments ·
#       REQUIRED vocab · FORBIDDEN vocab · cross-vertical bans ·
#       on-brand example hooks · exclusions

# 3 · author { "hooks": [...10], "oneLiners": [...2] } and apply
npx tsx scripts/cowork-fulfill.ts apply <taskId> hooks.json
```

`apply` runs each authored hook through the **exact same gates as the paid
provider** — locale purity, forbidden vocab, cross-vertical leak, and the
deterministic quality floor (≥ 24 / 60) — and only upgrades the generation if
enough hooks pass. Bad output is rejected with a per-hook reason, never shipped.

## Running it as a recurring Cowork task

Instead of running the three commands by hand, schedule a Cowork task that wakes
Claude to drain the queue (e.g. every few hours or on demand). The task prompt
is simply:

> Run `npx tsx scripts/cowork-fulfill.ts list`. For each pending task, run
> `brief`, author 10 on-contract hooks + 2 one-liners, write them to a JSON
> file, and `apply`. Stop when the queue is drained.

Zero API cost — the "LLM" is Claude in Cowork.

## Try it

```bash
export MOOD_MEMORY_DIR=/tmp/coworkmem      # keep it out of the repo
npx tsx scripts/cowork-demo.ts             # creates a brand + generation, enqueues a task
npx tsx scripts/cowork-fulfill.ts list
npx tsx scripts/cowork-fulfill.ts brief <taskId>
# author hooks.json, then:
npx tsx scripts/cowork-fulfill.ts apply <taskId> hooks.json
```

Verified end-to-end (realtor · he): corpus baseline (scores 53-72) upgraded to
10 Cowork hooks (scores 84-86), all passing the contract, `providerId → cowork`.

## Files

| File | Role |
|---|---|
| `lib/mvpCoworkBridge.ts` | queue + `coworkEnabled()` + `applyCoworkKit()` (validation + upgrade) |
| `lib/mvpGenerationEngine.ts` | best-effort enqueue after the corpus kit ships |
| `lib/mvpGenerationMemory.ts` | `providerId: 'cowork'` + `coworkTaskId` / `coworkStatus` |
| `scripts/cowork-fulfill.ts` | the Cowork task CLI (`list` · `brief` · `apply`) |
| `scripts/cowork-demo.ts` | end-to-end demo |
