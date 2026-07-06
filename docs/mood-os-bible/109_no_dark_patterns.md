# 109 — No Dark Patterns

> MOOD names, forbids, and engineers against every manipulative growth pattern the industry relies on — and ships the humane alternative in its place.

## Purpose
Volume 10 grows MOOD through belonging and beauty (Ch. 101), which is only credible if we explicitly refuse the manipulation everyone else uses. This chapter is the enforceable ban list: the dark patterns MOOD forbids, why each harms the user, and the humane alternative we build instead. It is a contract the Copy Linter and design review enforce on every release.

## User Experience
The user never encounters guilt, pressure, or a trap. They can leave the app after one Moment and feel complete. Closing controls are honest; opting out of any social surface is one tap and never punished. No red-badge anxiety, no "you'll lose your progress", no manufactured FOMO. The felt experience is a calm, generous space that respects their time and never begs for it back.

## Game Mechanic — Forbidden Dark Patterns and Their Alternatives
| Forbidden dark pattern | Why it harms | MOOD alternative |
|---|---|---|
| **Streaks / streak-loss anxiety** | Punishes life happening; manufactures guilt | Library growth + courage history; skipped days are silent (Ch. 41) |
| **Likes / reaction counts** | Turns feeling into performance | Anonymous aggregate belonging (Ch. 103) |
| **Follower / friend counts** | Vanity metric, social ranking | Small consenting circles, no counter as goal (Ch. 105) |
| **Leaderboards / comparison** | Makes users rank each other | Symmetric "you both tried" only (Ch. 104) |
| **Guilt/shame notifications** ("we miss you", "don't break it") | Coerces return through anxiety | Optional, warm, low-frequency invitations only |
| **Infinite feed / doomscroll** | Steals time, no natural stop | One Daily Moment, then done (Ch. 06) |
| **FOMO / fake scarcity timers** | Fabricates urgency | Timeless Moments; nothing expires punitively |
| **Confirmshaming** ("No, I don't want to grow") | Manipulates the opt-out | Honest, equal-weight decline copy: "לא היום — וזה בסדר גמור" |
| **Roach-motel / hard cancel** | Traps the user in | One-tap opt-out and data export (Ch. Privacy) |
| **Vanity share pressure** ("show off your progress") | Self-promotion loop | Sharing framed as a gift to one person (Ch. 102) |

## Screens Needed
- Settings
- Privacy
- Shared Humanity

## Visual Assets Needed
- Light and Texture assets (calm, non-urgent tone)
No manipulative visual cues (no fake red badges, no pulsing urgency). No text baked into images.

## AI Logic
Copy Linter (Ch. 06) is the enforcement engine: it blocks banned words and framings — streak, fail, score, rank, follower, "you'll lose", "don't break", confirmshaming — before any copy ships. Reflection and Challenge Generators inherit the same guardrails. Never diagnose, never shame. Design review adds a manual dark-pattern checklist per release.

## Data Stored
No entity that enables a dark pattern exists in the schema — no `streak`, `like`, `follower`, `rank`, or `score` field anywhere. This absence is asserted by schema tests. Opt-out preferences stored in `User.settings`; local-first, optional Supabase sync.

## Edge Cases
- Skipped days: never trigger loss/guilt messaging.
- Re-engagement: at most gentle, opt-out-able, low-frequency; never guilt-framed.
- A/B tests: forbidden from testing any dark pattern, even to measure lift.
- Accessibility: opt-outs reachable by screen reader and keyboard.

## Build Requirements
Copy Linter ban-list rules; schema tests asserting forbidden fields never exist; per-release dark-pattern review checklist; honest opt-out + export flows. Ongoing effort; enforced in CI.

## Definition of Done
- [ ] The forbidden-pattern table is enforced by Copy Linter and schema tests.
- [ ] No streak, like, follower, rank, or score field exists in the schema.
- [ ] Every opt-out is one tap, penalty-free, and honestly worded.
- [ ] No guilt, FOMO, confirmshaming, or fake-scarcity copy ships.
- [ ] Dark-pattern review checklist passes before each release.
