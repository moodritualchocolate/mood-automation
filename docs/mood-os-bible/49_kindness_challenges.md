# 49 — Kindness Challenges

> Kindness challenges invite the user to turn a small noticing of another person into a small real act of care — the theme family that lets warmth become motion.

## Purpose
Kindness challenges exist to close the gap between feeling for someone and doing something for them. They give a person low-friction ways to matter to another human, which quietly nourishes the giver as much as the receiver. Unlike Social challenges (Ch. 47), the emphasis is on generosity rather than exposure. This chapter defines the Kindness theme family and its Easy/Medium/Brave ladder (Ch. 42).

## User Experience
When the Human Map shows care or connection as a live thread, the Daily Moment may offer a Kindness challenge. Example ladder:
- **Easy** — "שלח הודעה חמה למישהו שחשבת עליו" ("send a warm message to someone you thought about").
- **Medium** — "עשה טובה קטנה למישהו בלי שיבקש" ("do a small favor for someone without being asked").
- **Brave** — "אמור למישהו בדיוק למה הוא חשוב לך" ("tell someone exactly why they matter to you").
The user lives it and journals the trying. A message left unanswered is still a full success.

## Game Mechanic
A Kindness `Challenge` carries three `ChallengeLevel` entries scaling emotional exposure and effort. Success is defined by the act of giving, never by gratitude received or reciprocation. `Attempt` honored identically at all levels. Kindness challenges must never instrumentalize others — the act is complete in the offering, with no expectation of return.

## Screens Needed
- Today / Daily Moment
- Challenge Selection
- Evening Check-in

## Visual Assets Needed
- People assets and Home assets (warm, relational, no faces required)
- Light assets (gentle glow)
No text baked into images; Hebrew copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) writes the three Hebrew levels from the Moment theme and the user's care signal. Guardrails (Ch. 52): consensual, respectful of the recipient's boundaries, non-intrusive, age-appropriate, outcome-agnostic. Copy Linter blocks any framing that ties success to being thanked. Never diagnose; hold generosity as a strength to water, not a deficit.

## Data Stored
`Challenge { theme: "kindness", levels }`, `ChallengeLevel { copyHe, socialExposure, safetyFlags }`, `Attempt`. Soft `Trait` for care/connection (0–1 + confidence + decay). Local-first; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- No response or thanks: reframed as generosity, never failure (Ch. 53).
- Recipient uncomfortable: copy stays gentle and non-intrusive; respect boundaries (Ch. 52).
- User has no one to reach: fallback act of kindness toward a stranger or community.
- Offline: levels cached with the DailyMoment.
- Long RTL copy and accessibility as elsewhere.

## Build Requirements
Kindness theme profile in the generator; reuse level selector and Attempt flow. Small effort.

## Definition of Done
- [ ] Ladder present: warm message → small favor → tell someone why they matter.
- [ ] Success = giving, never gratitude or reciprocation received.
- [ ] Acts never intrude on or instrumentalize the recipient.
- [ ] Fallback exists for users with no one nearby.
- [ ] Hebrew RTL renders in light and dark.
