# 42 — Difficulty Levels

> Every Challenge is expressed as a ladder of three levels — Easy, Medium, Brave — so the user can meet themselves exactly where they are today.

## Purpose
Difficulty in MOOD is not about how hard something is to achieve — it is about how much courage it asks of *this* person, *today*. Three levels give the user agency and a gentle on-ramp: the same theme rendered at three emotional depths. This chapter defines what each level means, how they are calibrated from the `HumanMap`, and why there is deliberately no level above Brave in the default flow (Impossible in Ch. 46 is opt-in and aspirational only).

## User Experience
On the Challenge Selection screen the user sees three softly-labeled options, never numbered or scored. Example labels: "קל" (Easy), "בינוני" (Medium), "אמיץ" (Brave). Each shows one line of Hebrew describing the act. The framing invites, never pushes: "בחר מה שמרגיש נכון לך היום" ("choose what feels right for you today"). A person low on social courage can honestly pick Easy and feel proud; a person ready to stretch can pick Brave. Choosing Easy is never framed as lesser. There is no "recommended" badge that shames the other choices.

## Game Mechanic
- **Easy** — a small, low-exposure act, doable in minutes, minimal social risk. Ch. 43.
- **Medium** — a meaningful stretch with mild vulnerability or effort. Ch. 44.
- **Brave** — a genuine, honest step toward a growth edge, still fully safe. Ch. 45.
Each `Challenge` carries exactly three `ChallengeLevel` entries. Levels scale the *ask*, never the *reward* — the `Attempt` is honored identically regardless of level chosen. The engine calibrates the concrete wording of each level using soft `Trait` signals (0–1) for challenge readiness and social courage, so "Brave" for one user is not overwhelming.

## Screens Needed
- Challenge Selection
- Today / Daily Moment

## Visual Assets Needed
- Moment assets (shared background for all three levels)
- Light assets (subtle warmth differentiation, never traffic-light colors)
No text baked into images; levels are a live RTL text layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) receives the `Moment` theme plus `HumanMap` readiness signals and returns three calibrated Hebrew level strings. Guardrail: the gap between Easy and Brave must stay crossable — Brave is a stretch, never a cliff. All three pass Copy Linter and safety checks (Ch. 52). Never diagnose readiness; treat signals as soft and decaying.

## Data Stored
`ChallengeLevel { level: easy|medium|brave, copyHe, estMinutes, socialExposure: 0–1, safetyFlags }`. Readiness pulled from `HumanMap.traits` (soft float + confidence + decay). Local-first; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- New user, thin Human Map: default to gentle calibration (bias toward Easy wording).
- User always picks Easy: never nudged or shamed; patterns note it privately (Ch. 09 domain).
- Long Hebrew strings: level cards must wrap without clipping in RTL.
- Offline: all three levels precomputed and cached with the Moment.
- Accessibility: levels distinguishable by text and shape, not color alone.

## Build Requirements
Three-option selector component, readiness calibration in Challenge Generator, cached level payload on the DailyMoment. Small-to-medium effort.

## Definition of Done
- [ ] Exactly three levels, always Easy/Medium/Brave.
- [ ] No numeric scores, stars, or "recommended" pressure.
- [ ] Brave is a stretch, never unsafe or impossible.
- [ ] Calibration uses soft signals, never hard labels.
- [ ] RTL cards render in light and dark without clipping.
