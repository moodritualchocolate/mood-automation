# 05 — Emotional Principles

> Five non-negotiable emotional principles — noticed, never judged, courage over outcome, warmth over pressure, belonging without comparison — govern every word, screen, and AI output in MOOD.

## Purpose
This chapter encodes the emotional contract with the user into product-enforceable principles. It exists so that "feeling" is not left to chance: every reflection, challenge, empty state, and error inherits these rules. The principles protect the core promise — "someone noticed something small about my life that I never knew how to say."

## User Experience
The user should always feel: seen, safe, gently invited, and quietly part of something. Concretely:
- **Noticed:** reflections speak to a small true detail — "שמנו לב שקשה לך לבקש עזרה" ("we noticed it's hard for you to ask for help").
- **Never judged:** no verdicts — never "אתה ביישן" ("you are shy"), only soft observations.
- **Courage over outcome:** after a hard day — "ניסית, וזה מה שחשוב" ("you tried, and that's what matters").
- **Warmth over pressure:** invitations, never demands — "אם בא לך" ("if you feel like it").
- **Belonging without comparison:** "עוד אנשים הרגישו כך היום" ("others felt this way today").

## Game Mechanic
The principles are constraints applied to every state transition:
1. Every reflection references a soft `Trait` signal, never a label.
2. Every Challenge frames success as attempt across easy | medium | brave.
3. Every empty/skip/miss state uses warm re-entry, no penalty.
4. Every social surface is anonymous aggregate only (Ripple).
5. Any distress signal downgrades intensity and offers gentle support.

## Screens Needed
- Today / Daily Moment (reflection tone)
- Challenge Selection (courage framing)
- Evening Check-in (safe, light)
- Shared Humanity (belonging without comparison)
- Patterns (gentle, non-diagnostic)

## Visual Assets Needed
- Light assets and Texture assets carrying warmth and safety.
- Moment assets depicting human intimacy and negative space (room to breathe).
- Masterpiece assets for emotionally weighty moments.
Grok-generated, no baked text; painterly-photographic warmth.

## AI Logic
Every engine (Reflection, Challenge, Pattern) is bound by these principles as system-prompt guardrails: never diagnose, never label, never rate, never shame, never use "should/must." The Copy Linter blocks banned framings before ship (see Ch. 06). Tone Guardrails reject outputs that judge or compare. Distress-detection heuristics route to pre-approved, non-clinical support copy rather than AI-generated advice.

## Data Stored
No judgmental data is ever persisted. `Trait` stored as soft float 0–1 with confidence + decay, never a categorical label. `JournalEntry` stores `tried` (bool), `feltNote` (Hebrew), `wantAgain` (bool) — framed around attempt and feeling, not success/failure. Optional `safetyFlag` (bool) triggers gentle support flow. All copy Hebrew; timestamps ISO 8601; local-first with optional Supabase sync.

## Edge Cases
- User reports a hard/failed day: reframe around the attempt, never "you failed."
- Distress language detected: switch to supportive, non-diagnostic copy; never label.
- Skipped days: warm, no streak penalty.
- Long RTL emotional copy must not clip; screen-reader tone preserved.
- Accessibility: emotional warmth must survive plain-text rendering.

## Build Requirements
Shared tone-guardrail module and Copy Linter ruleset consumed by all AI calls. Pre-approved safety-copy library (Hebrew). Empty/skip-state components with warm defaults. Distress-signal heuristic. Moderate effort; cross-cutting.

## Definition of Done
- [ ] All AI outputs pass Tone Guardrails and Copy Linter.
- [ ] No copy judges, diagnoses, rates, or shames the user.
- [ ] Attempt-framing verified across success and hard-day paths.
- [ ] Distress flow routes to approved non-clinical support copy.
- [ ] Warmth verified in Hebrew RTL, light and dark, and screen readers.
