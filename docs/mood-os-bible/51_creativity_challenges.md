# 51 — Creativity Challenges

> Creativity challenges invite the user to make, notice, or play — the theme family that reawakens the part of a person that creates without needing to be good at it.

## Purpose
Creativity challenges exist to give people permission to make something with no standard to meet. They counter the belief that creativity is a talent reserved for artists, replacing it with small acts of play, attention, and expression. The point is the making, never the quality of what is made. This chapter defines the Creativity theme family and its Easy/Medium/Brave ladder (Ch. 42).

## User Experience
When the Human Map shows curiosity, play, or self-expression as a live thread, the Daily Moment may offer a Creativity challenge. Example ladder:
- **Easy** — "צלם דבר אחד יפה שראית היום" ("photograph one beautiful thing you saw today").
- **Medium** — "כתוב שלוש שורות על משהו שהרגשת" ("write three lines about something you felt").
- **Brave** — "צור משהו ושתף אותו עם אדם אחד" ("make something and share it with one person").
The user lives it and journals the trying. An ugly drawing is a full success — the courage was in the making.

## Game Mechanic
A Creativity `Challenge` carries three `ChallengeLevel` entries scaling effort and exposure (private making → sharing with one person). Success is defined by the act of creating, never by the result's quality or anyone's reception. `Attempt` honored identically at all levels. The engine never evaluates or rates what the user makes.

## Screens Needed
- Today / Daily Moment
- Challenge Selection
- Evening Check-in
- Living Library (optional keepsake of what was made)

## Visual Assets Needed
- Object assets and Texture assets (materials, making, craft — no text)
- Light assets (inviting, playful warmth)
No text baked into images; Hebrew copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) writes the three Hebrew levels from the Moment theme and the play/curiosity signal. Guardrails (Ch. 52): safe, legal, consensual, age-appropriate, outcome-agnostic; sharing steps must respect the recipient. Copy Linter blocks any framing that judges skill ("do it well", "make it good"). Never diagnose; treat creativity as a muscle, not a gift.

## Data Stored
`Challenge { theme: "creativity", levels }`, `ChallengeLevel { copyHe, socialExposure, safetyFlags }`, `Attempt`. Optional `LibraryItem` keepsake reference if the user chooses to save what they made. Soft `Trait` for play/curiosity (0–1 + confidence + decay). Local-first; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- User dislikes what they made: Evening copy honors the making, never the quality (Ch. 53).
- Shared creation gets no reaction: reframed as brave sharing, not failure.
- User "can't think of anything": Easy fallback (notice one beautiful thing) always works.
- Offline: levels cached; making works fully offline.
- Long RTL copy and accessibility as elsewhere.

## Build Requirements
Creativity theme profile in the generator; reuse level selector and Attempt flow; optional keepsake link into Living Library. Small effort.

## Definition of Done
- [ ] Ladder present: notice/photograph → write a few lines → make and share.
- [ ] Success = making, never the quality of the result.
- [ ] Engine never rates or evaluates the user's creation.
- [ ] Easy fallback always available for creative block.
- [ ] Hebrew RTL renders in light and dark.
