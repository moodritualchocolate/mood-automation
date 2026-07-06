# 57 — Challenge Generator

> The Challenge Generator produces three real-world invitations — Easy, Medium, Brave — where success is always the attempt, never the outcome.

## Purpose
Every Daily Moment can offer a Challenge: a small, real-world act the user can go live (see Ch. 01 Core Loop). This engine generates three levels tuned to the person's `HumanMap` and challenge readiness, so the leap always feels possible but meaningful. Challenges turn quiet self-noticing into a lived step in the world.

## User Experience
On Challenge Selection, the user sees three warm Hebrew invitations. Example set for a "small courage" Moment:
- Easy: "שלח הודעה קצרה למישהו שחשבת עליו היום" ("send a short message to someone you thought about today").
- Medium: "אמור למישהו דבר אחד כן שקשה לך לומר" ("tell someone one honest thing that's hard to say").
- Brave: "התחל שיחה שדחית כבר הרבה זמן" ("start a conversation you've been putting off").
The user picks one, leaves the app, and lives it. Success = trying.

## Game Mechanic
Input → generate three levels → guardrail → present. Inputs: `MomentTemplate` theme, soft `Trait` signals (social courage, comfort zones, challenge readiness), recent `Attempt` history. Output: a `Challenge` with three `ChallengeLevel`s (easy | medium | brave). The Evening Journal later records tried/didn't-try (Ch. on Journal) — never pass/fail. No scoring, no streaks.

## Screens Needed
- Today / Daily Moment
- Challenge Selection
- Evening Check-in

## Visual Assets Needed
- Moment assets, People assets, Object assets (contextual warmth)
No text baked into images; challenge copy renders in the live RTL text layer.

## AI Logic
Engine: **Challenge Generator** on the **Claude API** (`claude-opus-4-8`, adaptive thinking). Reads challenge-readiness signals via Memory Engine (Ch. 59). Guardrails: challenges must be safe, legal, real-world, non-clinical, and never framed as tests. Never diagnose or label (Ch. 55). Never imply failure. Brave must stretch, not endanger. Full system + user template in Ch. 64. Fallback: hand-authored three-level sets per MomentTemplate.

## Data Stored
- `Challenge` { id, momentId, levels: ChallengeLevel[3], engineVersion, createdAt (ISO 8601) }
- `ChallengeLevel` { level, hebrewText, estimatedStretch (soft float) }
- `Attempt` { challengeLevelId, tried: bool, createdAt } — records the attempt, not a result.
Local-first; optional Supabase sync.

## Edge Cases
- First run: gentle, universally-safe default challenges.
- Offline: serve cached three-level set for the MomentTemplate.
- Abandoned challenge: no penalty, no guilt copy; Journal simply records "didn't try today."
- Safety-sensitive themes: route through User Safety review (Ch. 61); never propose risky acts.
- Long RTL text: cap each level to one clear sentence.

## Build Requirements
- `/api/challenge` endpoint calling Claude with the Ch. 64 template.
- Safety filter that rejects unsafe, illegal, or coercive suggestions.
- Fallback challenge bundle per MomentTemplate.
- Effort: medium.

## Definition of Done
- [ ] Produces exactly three levels (easy/medium/brave) in Hebrew RTL.
- [ ] Levels are safe, legal, real-world, and never framed as tests.
- [ ] Success language is always about the attempt, never the outcome.
- [ ] Passes Tone Guardrails + Copy Linter; no streak/score/fail language.
- [ ] Offline and failure serve cached three-level sets.
