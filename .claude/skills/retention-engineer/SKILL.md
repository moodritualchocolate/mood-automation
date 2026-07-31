---
name: retention-engineer
description: >
  Audit a short-form video cut for watch-time and retention killers, then prescribe specific,
  timestamped fixes — first-frame thumbstop, hook clarity in the first 1.5s, the 3-second payoff
  promise, mid-video drop points, dead air, pattern-interrupt cadence, and loop-ability. Use this
  skill whenever the user wants to improve retention or watch time, asks "why do people drop off",
  "why is this not getting views", "tighten the edit", "make it more re-watchable", "is this cut
  good", or is about to publish/render a short-form clip and wants it stress-tested first. Trigger it
  proactively after a cut or storyboard exists and before it's rendered/published — retention is the
  metric the algorithm rewards most, and small edit changes move it a lot. Brand-agnostic: reads the
  cut from the composition/storyboard/MP4 and pairs with `viral-hook-generator` (hook) and
  `motion-psychology` (pacing).
---

# Retention Engineer

Views follow **retention**. The platform decides how far a video travels mostly by how well it holds
attention — the 3-second hold, the average watch percentage, and whether people re-watch or loop.
Most videos die not from a bad idea but from fixable edit problems: a slow first frame, a hook that
takes too long to land, a dead beat in the middle, an ending that just stops. This skill finds those
killers with timestamps and prescribes concrete fixes. It does **not** re-cut on vibes — it reasons
about a known retention model.

## The retention model — audit against these checkpoints

Walk the cut against each checkpoint. For each, decide pass/fail and, if fail, the exact fix.

1. **Frame 0 — the thumbstop.** The very first frame must arrest a scrolling thumb. Is there motion,
   a face, a bold contrast, or an open question *in the first frame* — or does it fade up from
   nothing / open on a logo? Fixes: start on the peak visual, cold-open the motion, kill fade-ins.
2. **0–1.5s — hook clarity.** Within ~1.5s the viewer must grasp *what this is about* or *feel a
   tension*. Is the hook visual and immediate, or buried behind setup? Coordinate with
   `viral-hook-generator`. Fixes: move the hook earlier, cut the runway, put the boldest words on
   screen first.
3. **~3s — the payoff promise.** By 3 seconds the viewer needs a reason to believe the payoff is
   coming (a question posed, a transformation teased, a pattern started). This is the single biggest
   drop point. Fixes: plant the promise, foreshadow the reveal.
4. **Mid-video drop points.** Scan for dead air — a beat where nothing changes visually or aurally
   for too long (a held card, a slow tween, a pause with no sound). Every ~1.5–3s needs a **pattern
   interrupt**: a cut, a move, a new element, an audio hit. Fixes: tighten or cut the dead beat, add
   an interrupt, speed the tween.
5. **The reveal / value beat.** Does the promised payoff actually land, clearly and on time? A payoff
   that's late, weak, or unclear collapses the back half. Fixes: bring it forward, make it bigger,
   give it an audio accent (coordinate with `sound-designer`).
6. **Ending — loop & CTA.** Does the end lead back into the start (seamless loop = replays = huge
   retention boost) or dead-stop? Is the CTA soft and quick, not a long outro that bleeds viewers?
   Fixes: design a loop (last frame ≈ first frame), trim the tail, shorten the CTA.
7. **Length discipline.** Is every second earning its place? In 2026, 60–90s can outperform 15s *when
   every beat delivers* — but padding kills. Fixes: cut anything that doesn't advance tension,
   payoff, or brand.

## Output — the Retention Report

```
# Retention Report — {video}
Predicted curve: {where you expect drops, in words} 
Checkpoint scan:
  ✅/❌ Frame 0 (thumbstop) — {finding}
  ✅/❌ 0–1.5s hook — {finding}
  … (all 7)
Ranked fixes (most watch-time recovered first):
  1. [t={timestamp}] {specific change} — why it recovers retention
  2. …
Loop verdict: {loops / dead-stops} + how to make it loop
```

Rules that keep the audit useful:

- **Every finding gets a timestamp and a concrete fix**, not "make it punchier". Name the second and
  the edit.
- **Rank by watch-time recovered**, not by ease. The first-3-seconds fixes almost always outrank
  cosmetic ones — say so.
- **Predict, then verify where possible.** If real analytics exist (a retention curve from
  `performance-analyst`), anchor the audit to the actual drop points rather than only the model.
- Don't over-cut a piece that's already tight. If a checkpoint passes, say it passes and move on —
  a clean bill is a valid result.

## Handoffs

- Weak hook → `viral-hook-generator` for stronger openings.
- Pacing/dead air → `motion-psychology` for rhythm, and `sound-designer` for interrupts/accents.
- After publish → `performance-analyst` to compare the predicted curve to the real one and learn.
