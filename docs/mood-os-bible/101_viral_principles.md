# 101 — Viral Principles

> MOOD grows because people feel they belong to something quietly beautiful — never because they were pressured, ranked, or made to perform.

## Purpose
This chapter fixes the philosophy every other Volume 10 chapter answers to. Most apps grow through vanity (likes, follower counts) and pressure (streaks, notifications that shame). MOOD refuses all of it. Our growth engine has exactly two fuels: **belonging** ("I am not alone in this") and **beauty** ("this is worth showing someone I love"). If a growth idea does not come from one of those two, it does not ship. This is not a marketing tactic; it is a product value that protects the user (see Ch. 109 No Dark Patterns).

## User Experience
The user never sees a like, a follower count, a leaderboard, or a comparison to another person. Instead they encounter quiet, anonymous belonging inside the Shared Humanity screen: "היום 8,412 אנשים בחרו גם הם מעשה קטן של אומץ" ("today 8,412 people also chose a small act of courage"). When a Moment moves them, they may choose to make a **shareable Ripple image** and send it to one person, as a gift, not a broadcast. Sharing always feels like generosity, never self-promotion. The default emotional tone: warmth, relief, "someone else feels this too".

## Game Mechanic
Growth surfaces are opt-in, penalty-free, and asymmetric toward giving. Three sanctioned mechanics only: (1) anonymous aggregate belonging via `RippleStat`; (2) one-to-one or small-group gifting (Ch. 104, 105); (3) shareable Ripple images (Ch. 102). No mechanic may create obligation, count a user's audience, or rank one person against another. Every shared object carries zero identity of the sender by default.

## Screens Needed
- Shared Humanity
- Today / Daily Moment
- Living Library

## Visual Assets Needed
- Social/Share assets (backgrounds for shareable Ripple images)
- Light assets and Texture assets (to signal warmth, not urgency)
No text is ever baked into images; all copy is a live RTL text layer.

## AI Logic
Not AI-driven for the growth decision itself — virality is a product/policy layer, not a model. The Copy Linter (Ch. 06) enforces it: any share or invite copy is blocked if it contains streak, score, follower, rank, or shame framing. Reflection Generator may write the warm one-line caption that accompanies a shareable Ripple image, always outcome-agnostic.

## Data Stored
`RippleStat { id, date, statType, count, copyHe }` (anonymous aggregate, no user linkage). No `follower`, `like`, or `rank` entity exists anywhere in the schema. Local-first; aggregate counts computed server-side in Supabase without exposing individual identities.

## Edge Cases
- Low counts (e.g. new region, count < 50): show a warmer qualitative line, never a bare small number that could feel lonely.
- Offline: belonging line falls back to the last cached `RippleStat`.
- User opts out of all social surfaces: full app still works; no nagging.
- Skipped days: never surfaced socially, no streak penalty.

## Build Requirements
`RippleStat` aggregation job; Copy Linter rules for growth copy; opt-in share components. No follower/like tables — enforced by schema review. Small-to-medium effort.

## Definition of Done
- [ ] No likes, follower counts, leaderboards, or comparisons exist in any surface.
- [ ] Every growth surface is opt-in and penalty-free.
- [ ] Belonging copy is anonymous and aggregate.
- [ ] Sharing framed as gift, never self-promotion.
- [ ] Copy Linter blocks vanity/pressure framing in all invite and share copy.
