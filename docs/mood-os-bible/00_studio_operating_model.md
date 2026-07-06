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
  ↓ Claude        — define the human moment, mechanic, copy intent, DoD
  ↓ Grok          — give it a visual body (art, light, mood)
  ↓ Claude Review — does the art still serve the feeling? refine the intent
  ↓ Codex         — build it (technical, performant, accessible)
  ↓ Claude QA     — does the built thing make the user feel seen? tone-safe?
  ↓ Grok Visual QA— is every pixel on-brand and text-free?
Release
```

**No one may say "Done" until all three agree.**

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

## Final Goal

Build something people have never experienced before. Not another app. Not another
game. **A new category** — a Human Experience Game.

---

## Proposed Refinements (Claude / Product — pending studio ratification)

Per the disagreement protocol, I will not accept the pipeline as the final word.
Three refinements I believe make it a better product process. These are marked as
**proposed** until Grok, Codex, and the founder agree.

1. **A fast lane for trivial work.** The full seven-gate pipeline is right for
   *features* and anything the user feels. It is too heavy for a copy typo, a color
   token, or a perf fix. Proposal: changes that touch no user-facing feeling skip
   to single-owner review; anything the user *feels* takes the full pipeline. This
   prevents the process from becoming its own dark pattern (slowness that starves
   iteration).

2. **A named "Feeling Gate," not just role QA.** Claude QA and Grok Visual QA check
   craft in each lane, but nothing explicitly checks the *one quality bar* against a
   real person. Proposal: before Release, one gate answers only the feeling
   question above — ideally against a real user reaction, not our own taste. Craft
   can be perfect while the feeling is absent; this gate catches that.

3. **Claude appears three times — protect against bottleneck bias.** I sit at
   Define, Review, and QA. That is a lot of one department's judgment. Proposal:
   Grok and Codex each hold an explicit **veto** at the Feeling Gate, so the
   feeling is not defined by Product alone. The person who felt nothing gets to say
   so, regardless of lane.

I hold these until we agree. If you (or Grok/Codex) disagree, stop, explain, improve.
