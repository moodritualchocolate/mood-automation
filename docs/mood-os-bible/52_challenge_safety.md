# 52 — Challenge Safety

> Every Challenge, at every level, must pass a hard safety gate — consensual, legal, non-harming, non-harassing, age-appropriate — before it can ever reach a user.

## Purpose
Because MOOD sends people into the real world, safety is not a feature — it is the precondition for the whole Challenge Engine to exist. This chapter defines the non-negotiable rules every generated `Challenge` and `ChallengeLevel` must satisfy, the checks that enforce them, and the safe fallback that protects the user when anything is uncertain. Bravery in MOOD (Ch. 45) is always safe bravery.

## User Experience
The user never sees an unsafe challenge — safety is invisible when it works. If generation is uncertain, the user simply receives a warm, safe alternative instead. Example safe fallback copy: "בוא ננסה משהו עדין יותר היום" ("let's try something gentler today"). If a Moment touches distress, the user is routed to non-diagnostic support copy and a skip, never a dare. The user always keeps a penalty-free way out (Ch. 41).

## Game Mechanic — the hard safety rules
Every challenge, all three levels, MUST be:
1. **Consensual** — never require anyone (user or others) to do something without their willing agreement; respect others' boundaries.
2. **Legal** — never suggest anything unlawful.
3. **No self-harm** — never risk the user's physical, emotional, or psychological safety.
4. **No harassment** — never pressure, corner, deceive, or target another person.
5. **No risky dares** — no physical stunts, no danger, no substances, no thrill-risk framing.
6. **Age-appropriate** — calibrated to the user's declared age band; nothing romantic/adult for minors.
7. **Reversible & user-controlled** — the user can stop at any time; nothing irreversible.
Any level failing a check is suppressed and regenerated; if regeneration fails, the **safe fallback** (a gentle Easy act) is shown.

## Screens Needed
- Challenge Selection
- Today / Daily Moment
- Privacy
- Accessibility

## Visual Assets Needed
- Light assets (calm, reassuring)
- Moment assets
No text baked into images; Hebrew copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) applies the seven rules as hard constraints during generation; the Copy Linter then blocks banned/unsafe framing (dares, self-harm, harassment, illegality, shame) as a second gate. A safety classifier flags risky output; flagged content is dropped and regenerated or replaced with the fallback. Distress signals route to gentle support, never diagnosis. Never diagnose, never label; treat all signals as soft.

## Data Stored
`ChallengeLevel.safetyFlags`, `Challenge.safetyReviewed: boolean`, `Attempt.safetyRouted` (if fallback/support used). Optional `User.ageBand`. No raw distress content stored beyond a soft flag. Local-first; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- Generation uncertain → safe fallback shown.
- Minor user → adult/romantic themes hard-excluded.
- Unsafe relationship context → suppress confrontation, offer self-only act + support (Ch. 50).
- Distress detected → support copy + skip, never a challenge.
- Offline → only pre-vetted cached challenges are shown; no unreviewed generation surfaces.
- Accessibility/RTL as elsewhere.

## Build Requirements
Two-gate pipeline (generator constraints + Copy Linter/classifier), safe-fallback library, age-band handling, distress routing. Medium effort, top priority.

## Definition of Done
- [ ] All seven safety rules enforced on every level before display.
- [ ] Copy Linter + classifier block dares, self-harm, harassment, illegality.
- [ ] Safe fallback shown whenever generation is uncertain.
- [ ] Age-appropriateness enforced by age band.
- [ ] Offline shows only pre-vetted challenges; distress routes to support.
