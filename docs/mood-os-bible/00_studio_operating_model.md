# 00 — Studio Operating Model

> One studio, three AIs, one product. Every AI has exactly one responsibility.
> No overlap. No duplicated work. Every decision must improve the same product,
> measured by one thing: **people remembering the feeling.**

This chapter governs *how* MOOD is built. Every other chapter governs *what* is
built. When a working method conflicts with this file, this file wins.

---

## The Three Departments

| AI | Department | Owns | Never touches |
|----|-----------|------|---------------|
| **Grok** | Art | Photography, illustration, lighting, mood, brand imagery, visual assets, packaging, video frames, storyboards — **every visual asset** | Product logic, copy, code |
| **Claude** | Product + Psychology | Game design, Human Map, discovery, challenge engine, recognition, reflection, writing, behavior, product decisions, the Bible, UX logic | Anything visual, anything technical |
| **Codex** | Engineering | Frontend, backend, AI integration, database, animation, performance, testing, release — **everything technical** | Anything creative |

No one works alone. Every feature passes through all three.

---

## The Pipeline (default, feature-level work)

```
Idea
  ↓ Claude         — define the human moment, mechanic, copy intent, DoD
  ↓ Grok           — give it a visual body (art, light, mood)
  ↓ Claude Review  — does the art still serve the feeling? refine the intent
  ↓ Codex          — build it (technical, performant, accessible)
  ↓ Claude QA      — does the built thing make the user feel seen? tone-safe?
  ↓ Grok Visual QA — is every pixel on-brand and text-free?
  ↓ FEELING GATE   — all three answer one question; any one may veto (see below)
  ↓ REALITY GATE   — real people experience it; memory, not usability, decides
Release
```

**No one may say "Done" until all three agree AND reality agrees.**

### Fast Lane (ratified)
Not every change deserves the full pipeline. Only **feeling-bearing work** — anything
the user perceives, feels, or remembers — passes every gate. Changes with no
user-felt surface (a perf fix, a token rename, a test) go **single-owner review**
in the owning department. If in doubt whether a change is feeling-bearing, it is.

### Feeling Gate (ratified — official production gate)
Before Release, every meaningful feature must answer one question, out loud, on the
record: **"Will people remember the feeling?"** Craft QA (Claude QA, Grok Visual QA)
checks each lane; the Feeling Gate checks the *whole*. Craft can be flawless while
the feeling is absent — this gate catches that.

### Shared Veto (ratified)
**Claude, Grok, and Codex each hold the right to stop a feature at the Feeling Gate.**
No hierarchy. The one who felt nothing gets to say so, regardless of lane. A veto is
not a "no" — it triggers the Disagreement Protocol: stop, explain, improve.

### Reality Gate (ratified — the final gate)
No feature is truly complete until it has been experienced by **real people**. The
Reality Gate's purpose is **not usability — it is memory.** After a person
experiences the feature, we ask exactly four questions:

1. **What do you remember?**
2. **How did you feel?**
3. **Would you come back tomorrow?**
4. **What would you tell a friend?**

**Reality always wins. If reality disagrees with us, reality is right.** No amount
of internal conviction overrides what real people actually remembered and felt.

---

## Disagreement Protocol

1. **Stop.** Do not proceed on the first idea.
2. **Explain why** — in your own lane's terms (Claude: does it serve the feeling
   and stay tone-safe? Grok: is it beautiful and true? Codex: is it real and fast?).
3. **Improve.** Propose the better version, not just a veto.
4. **Challenge each other.** The first idea is a starting point, never the answer.
5. **Deadlock → the human founder decides.** The founder is the tiebreaker and the
   keeper of the category vision. Their call is logged as a product decision.

## The One Quality Bar

We optimize for **people remembering the feeling** — not engagement, not clicks,
not retention, not time-in-app. Every review at every gate asks the same question:

> *"Will the user remember how this made them feel — 'someone noticed something
> small about my life I never knew how to say'?"*

If the answer is no, it does not ship, no matter how polished, fast, or beautiful.

## Studio Rule: We Build Habits, Not Features (ratified)

We are no longer shipping features. We are building a **habit** — a daily return that
the person *wants*, never one we manufacture through streaks, guilt, or loss-aversion.
The only KPI that matters:

> **"Did the player naturally want to return tomorrow?"**

Everything else is secondary. "Naturally" is the whole word: if the return is
produced by a streak counter, a shame notification, or a fear of loss, it does not
count and it does not ship. A wanted return comes from anticipation, continuity, and
curiosity (see the "Returning Pull" model in the One Perfect Moment spec). This KPI
is what the Reality Gate's question 3 measures against real people.

## Final Goal

Build something people have never experienced before. Not another app. Not another
game. **A new category** — a Human Experience Game.

---

## Ratified Refinements (studio-approved)

All three Product refinements were raised, challenged, and **approved by the founder**,
and are now binding parts of the pipeline above:

1. **Fast Lane** — approved. Only feeling-bearing work passes every gate.
2. **Feeling Gate** — approved as an official production gate.
3. **Shared Veto** — approved. Claude, Grok, and Codex each may stop a feature. No
   hierarchy, only quality.

The founder added a fourth, final gate — the **Reality Gate** (real people, memory
over usability, reality always wins) — and one studio rule — **we build habits, not
features** (KPI: did the player naturally want to return tomorrow?). Both are now
binding and documented above. The first feature to run this full pipeline is
**One Perfect Moment** (see `specs/one_perfect_moment.md`).
