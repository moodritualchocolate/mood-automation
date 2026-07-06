# 47 — Social Challenges

> Social challenges invite the user into small, real human contact — the theme family that turns loneliness and social fear into gentle, livable steps.

## Purpose
Connection is one of the deepest human hungers and one of the most common fears. Social challenges exist to let a person practice reaching toward other people in doses they can actually handle, so social courage grows through lived experience rather than advice. This chapter defines the Social theme family and its Easy/Medium/Brave ladder (see Ch. 42 for level rules).

## User Experience
When the Human Map (Ch. 22 domain) shows social courage as a growth area, the Daily Moment may offer a Social challenge. The user picks a level that fits today. Example ladder:
- **Easy** — "תגיד שלום לזר היום" ("say hello to a stranger today").
- **Medium** — "פתח שיחה קצרה עם מישהו" ("start a short conversation with someone").
- **Brave** — "גש למישהו שסקרן אותך והתחל שיחה אמיתית" ("approach someone you're curious about and begin a real conversation").
The user lives it and journals the trying — a hello unreturned is a full success.

## Game Mechanic
A Social `Challenge` carries three `ChallengeLevel` entries scaling social exposure from ~0.2 (Easy) to ~0.85 (Brave). Completion is defined by initiation, never by the other person's response — this is the load-bearing rule that keeps social challenges safe from feeling like rejection tests. `Attempt` honored identically at every level. No outcome is ever recorded as failure.

## Screens Needed
- Today / Daily Moment
- Challenge Selection
- Evening Check-in

## Visual Assets Needed
- People assets (warm, non-specific human presence, no faces required)
- Moment assets and Light assets
No text baked into images; Hebrew copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) writes the three Hebrew levels from the Moment theme and social-courage signal, keeping the ladder crossable. Guardrails (Ch. 52): consensual, non-harassing, respectful of others' boundaries, age-appropriate, outcome-agnostic. Copy Linter blocks pressure and any framing that would treat another person's reaction as the user's success. Never diagnose shyness.

## Data Stored
`Challenge { theme: "social", levels }`, `ChallengeLevel { socialExposure, copyHe, safetyFlags }`, `Attempt`. Soft `Trait` for social courage (0–1 + confidence + decay). Local-first; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- Isolated user, no one around: offer an online-safe variant (a warm message) as fallback.
- Rejection or awkwardness: Evening copy reframes as courage, never failure (Ch. 53).
- Anxiety spike: skip path plus safe fallback (Ch. 52).
- Offline: levels cached; a "message someone" variant works without live people nearby.
- Long RTL copy and accessibility as elsewhere.

## Build Requirements
Social theme profile in the generator; reuse level selector and Attempt flow. Small effort.

## Definition of Done
- [ ] Ladder present: hello → short conversation → real conversation.
- [ ] Success = initiating, never the other person's response.
- [ ] No challenge pressures or harasses another person.
- [ ] Safe fallback exists for isolated/anxious users.
- [ ] Hebrew RTL renders in light and dark.
