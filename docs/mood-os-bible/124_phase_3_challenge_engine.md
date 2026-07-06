# 124 — Phase 3 — Challenge Engine

> Phase 3 turns the Challenge from an authored ladder into a living engine that generates Easy / Medium / Brave real-world invitations tuned to the person.

## Purpose
Phase 1 shipped one fixed Challenge ladder; Phase 3 makes challenges generative and personal, so each Moment can invite a real-world action that fits the user's courage and readiness. This is the bridge from being seen to living differently (core-loop steps 5–7). Success is always defined as *trying*, never outcome — the engine encodes that rule structurally.

## User Experience
On the Challenge Selection screen the user sees three live-generated levels beneath the Moment, each a small real-world act. Example Easy: "תגיד תודה למישהו היום" ("say thank you to someone today"); Brave: a bolder social act framed warmly, never as a dare. The user picks one, leaves to live it, and returns to the Evening Check-in where "ניסיתי" ("I tried") and "לא ניסיתי היום" ("didn't try today") are equally accepted, both unpunished.

## Game Mechanic
**Scope IN:** Challenge Generator (Claude) producing `ChallengeLevel` easy|medium|brave from `HumanMap` challenge-readiness signals; Attempt recording; success = attempt. Safety guardrails on generated challenges.
**Scope OUT:** Pattern reflection over attempts (Phase 4), Ripple counts (Phase 5), accounts/sync. This phase **implements** Ch. 41 Challenge Philosophy, Ch. 42 Difficulty Levels, and core-loop steps 5–7, reading the Human Map from Phase 2 (Ch. 123).
**Entry criteria:** Phase 2 exit met; Challenge Generator prompt + safety filter authored and reviewed.
**Exit criteria:** generated challenges are real-world, safe, level-appropriate, and framed as attempts across ≥3 distinct Human Maps; authored fallback works offline.
**Demo goal:** a user with low challenge-readiness gets gentler Brave options than a bolder user, and "didn't try" is celebrated as valid.

## Screens Needed
- Today / Daily Moment
- Challenge Selection
- Evening Check-in
- Living Library

## Visual Assets Needed
- Moment assets, People assets, Object assets
- Light assets, Texture assets
Grok-generated, warm, painterly-photographic. NO text baked into images; challenge copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06 / Ch. 54) inputs: current `Moment`, `HumanMap` challenge-readiness + comfort-zone signals, recent `Attempt` history (local). Outputs three graded `ChallengeLevel`s. Guardrails: no unsafe, illegal, medical, or humiliating actions; no pressure framing; success language = attempt. A safety filter rejects and regenerates flagged challenges. Authored ladder remains the offline fallback. All copy passes Tone Guardrails + Copy Linter.

## Data Stored
- `Challenge` (momentId, generatorVersion)
- `ChallengeLevel` (level, Hebrew copy, safetyFlag)
- `Attempt` (level, tried|didn't-try, timestamp — no score)
Reads `HumanMap` (Ch. 123). Local-first source of truth; Supabase still out of scope. Hebrew strings; ISO 8601.

## Edge Cases
- Safety-flagged generation: rejected and regenerated; never shown.
- Low readiness: Brave stays gentle, never a stunt.
- Offline: authored fallback ladder renders.
- Abandoned / "didn't try": recorded warmly, no penalty, no streak.
- Repeated same challenge: Memory context avoids monotony where possible.
- Long RTL challenge text / accessibility: operable, never clipped.

## Build Requirements
Adds `ChallengeGenerator` endpoint (Claude) + safety filter + authored fallback to the Phase 2 base. `ChallengeLadder` component upgraded to render live levels. Attempt store slice. Next.js 14, TypeScript, Tailwind, RTL, PWA, local-first. Effort: medium.

## Definition of Done
- [ ] Three live-generated Easy/Medium/Brave challenges render per Moment.
- [ ] Levels scale to `HumanMap` challenge-readiness signals.
- [ ] Safety filter blocks unsafe/humiliating challenges before display.
- [ ] "I tried" and "didn't try" are both valid, unpunished outcomes.
- [ ] Offline authored fallback works; Copy Linter passes.
- [ ] No score/streak/dare framing anywhere.
