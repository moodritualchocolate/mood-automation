# 23 — Strengths

> The quiet, growing sense of what a person is already good at — surfaced gently, never as a badge or a score.

## Purpose
Strengths are the part of the Human Map (Ch. 22) that notices what already works in a person: warmth, persistence, curiosity, steadiness, courage. They exist so MOOD can reflect a user back to themselves kindly and pitch challenges that build on real footing. Strengths are soft signals, not achievements, badges, or points.

## User Experience
Strengths appear as gentle recognition inside reflections and Moments, never as a trophy shelf. A reflection might say: "יש בך משהו שמחזיק גם כשקשה." ("There's something in you that holds on even when it's hard.") The user feels quietly seen. There is no "Strengths screen" ranking traits; instead strengths color the tone of Daily Moments and the framing of challenges. If surfaced in the self-portrait view, they read as tendencies, not certificates: "נראה שאכפתיות מגיעה לך בטבעיות." ("Caring seems to come to you naturally.")

## Game Mechanic
- Strength `Trait`s: `{ family: "strength", kind, signal: 0–1, confidence, decayRate, evidence[] }`.
- Reinforced when Attempts and JournalEntries show the strength in action (e.g., a "brave" attempt lifts a courage-adjacent strength by ≤ +0.1).
- Never reinforced by outcome — trying a challenge counts, succeeding is not required (success = attempt).
- Decay toward neutral if unreinforced, so strengths stay current.
- Feed Challenge Generator: strengths can anchor an Easy level so growth feels safe.

## Screens Needed
- Today / Daily Moment (tone shaped by strengths)
- Patterns (gentle reflection over time)
- Moment Detail (reflection copy)

## Visual Assets Needed
- Masterpiece and Moment assets whose warmth echoes the recognized strength (textless).
- Light assets for a soft, affirming mood.

## AI Logic
Reflection Generator (Claude) uses strength signals as context to phrase recognition warmly and tentatively. Guardrails: no ranking, no superlatives that imply comparison to others, no "you are the kind of person who…" as fixed identity. Copy Linter blocks score/badge framing. Pattern Recognition may note a recurring strength but always as "lately" language, never permanent.

## Data Stored
- Strength `Trait[]` on the `HumanMap`.
- `evidence[]` linking to `Attempt`/`JournalEntry` ids that reinforced the signal.
- Local-first; optional Supabase `human_maps` sync.

## Edge Cases
- New user → no strengths yet; reflections stay universal and warm.
- User dismisses a recognition ("זה לא אני") → soften signal + lower confidence.
- Over-reinforcement guard → bounded nudges prevent one attempt from spiking a signal.
- Offline → local reinforcement queued for sync.
- Never frame absence of a strength as a deficit.
- RTL long-text wrapping in reflection copy.

## Build Requirements
- Strength kinds enum + weighting in the `humanMap` slice.
- Reinforcement hooks fired from Attempt/Journal save events.
- Reflection prompt template exposing top strengths (with confidence) to Claude.
- Effort: ~2 dev days on top of the Human Map core.

## Definition of Done
- [ ] Strengths are stored as soft 0–1 signals with confidence + decay.
- [ ] Strengths are reinforced by attempts, never by outcomes.
- [ ] No badges, rankings, scores, or fixed-identity language appear.
- [ ] Reflections referencing strengths pass the Copy Linter.
- [ ] User can soften a recognition that doesn't fit.
