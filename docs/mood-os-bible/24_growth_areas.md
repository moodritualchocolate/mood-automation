# 24 — Growth Areas

> The tender edges where a person is quietly ready to stretch — framed as openings, never as flaws or weaknesses.

## Purpose
Growth Areas are the part of the Human Map (Ch. 22) that senses where a user might gently expand — speaking up, resting, reaching out, slowing down. They exist so challenges (Ch. 06 Challenge Generator) can meet the user just past their comfort zone. Crucially, a growth area is **not a weakness, deficit, or problem** — it is a soft direction of possible movement.

## User Experience
Growth areas are never named as shortcomings. They shape invitations, not verdicts. A Moment's optional invitation might read: "אולי היום יש מקום למילה אחת יותר כנה." ("Maybe today there's room for one more honest word.") The user feels invited, not corrected. There is no list titled "Things to fix." If ever surfaced, growth reads as gentle horizon: "נראה שיש בך סקרנות לנסות דברים חדשים." ("There seems to be curiosity in you to try new things.") The user can always decline an invitation with zero penalty.

## Game Mechanic
- Growth `Trait`s: `{ family: "growth", kind, signal: 0–1, confidence, decayRate, evidence[] }`.
- Signal reflects *readiness to stretch*, not lack — high signal = "gently ready here," not "bad at this."
- Reinforced when the user tries related challenges (attempt counts, outcome irrelevant) and when reflections mention wanting to try again.
- Feeds Challenge Generator to calibrate Medium/Brave levels just beyond current comfort.
- Decays toward neutral; a satisfied growth edge naturally cools so MOOD doesn't nag.

## Screens Needed
- Today / Daily Moment (invitation framing)
- Challenge Selection (level calibration)
- Patterns (gentle "you've been leaning toward…" reflection)

## Visual Assets Needed
- Moment and Masterpiece assets suggesting openness, thresholds, open sky (textless).
- Light assets for a hopeful, forward mood.

## AI Logic
Challenge Generator and Reflection Generator (Claude) read growth signals to calibrate stretch and phrase invitations. Guardrails: never frame as deficit; never use "should", "need to", "you're not good at"; always optional. Copy Linter blocks shame/deficit framing. Confidence-weighted so low-certainty growth areas produce only the softest, most optional invitations.

## Data Stored
- Growth `Trait[]` on the `HumanMap`.
- `evidence[]` referencing `Attempt`/`JournalEntry` ids.
- `readiness` derived from signal × confidence, consumed by Challenge Generator.
- Local-first; optional Supabase sync.

## Edge Cases
- New user → no growth edges; challenges default to safe, universal Easy/Medium.
- User declines related invitations repeatedly → down-weight that edge; never escalate, never remind with pressure.
- Skipped day → no penalty, no "you're falling behind" (no streaks).
- Offline → local; sync later.
- Never present growth as a failing or compare to others.
- RTL long-text wrapping.

## Build Requirements
- Growth kinds enum + readiness derivation in the `humanMap` slice.
- Invitation template exposing top growth edges (confidence-gated) to Claude.
- Challenge Generator hook consuming `readiness` for level calibration.
- Effort: ~2–3 dev days.

## Definition of Done
- [ ] Growth areas stored as soft readiness signals (0–1) with confidence + decay.
- [ ] No language frames them as weaknesses, deficits, or problems.
- [ ] Invitations are always optional and declinable without penalty.
- [ ] Challenge levels calibrate from growth readiness.
- [ ] All copy passes the Copy Linter.
