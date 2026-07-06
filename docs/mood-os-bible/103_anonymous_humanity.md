# 103 — Anonymous Humanity

> The user feels part of a quiet, invisible crowd of people living the same small courage today — with no names, no faces, and no one to compare themselves to.

## Purpose
Loneliness is the enemy MOOD fights hardest. This chapter defines the anonymous belonging layer: aggregate, faceless proof that the user is not alone in what they just felt or chose. It replaces every social-media vanity signal (likes, followers, comparison) with one honest sentence about shared humanity. It exists to comfort, never to pressure or rank.

## User Experience
On the Shared Humanity screen, and gently after the Daily Moment or Evening Check-in, the user sees an anonymous aggregate line tuned to what they just did: "היום 8,412 אנשים בחרו גם הם מעשה קטן של אומץ" ("today 8,412 people also chose a small act of courage"), or "עוד 1,203 אנשים הרגישו היום בדיוק את מה שהרגשת" ("another 1,203 people felt today exactly what you felt"). No avatars, no usernames, no ability to click through to a person. The feeling is a warm exhale — "I'm one of many". The user can never see who; that is the point.

## Game Mechanic
The system reads the day's aggregate `RippleStat` matching the user's context (challenge chosen, emotion noted, Moment theme) and renders one belonging line. No individual data is ever exposed or linkable. Counts are k-anonymous: below a threshold (k = 50) the line switches to qualitative warmth instead of a number. Nothing here is interactive beyond reading; no reply, no like, no follow.

## Screens Needed
- Shared Humanity
- Today / Daily Moment
- Evening Check-in

## Visual Assets Needed
- Light assets and Texture assets (soft, communal warmth)
- Masterpiece assets (backdrop for the belonging screen)
No text baked into images; the Hebrew belonging line is a live RTL layer.

## AI Logic
Not AI-driven for the number — counts are deterministic aggregates. Reflection Generator (Claude) may vary the phrasing of the belonging line for warmth; Copy Linter blocks any comparison, ranking, or shame framing ("more than you", "you're behind" are forbidden). Never diagnose, never single anyone out.

## Data Stored
`RippleStat { id, date, statType (courage|emotion|theme), count, copyHe, k }` — pure aggregates with **no user linkage**. Individual `Attempt`/`JournalEntry` records contribute to counts only through anonymized server-side aggregation. Local-first cache of the latest lines; Supabase computes aggregates without exposing identities.

## Edge Cases
- Count below k = 50: show "אנשים ברחבי העולם חוו היום את אותו הדבר" ("people around the world felt the same today"), no bare number.
- First run / empty: show a general humanity line, never "0 people".
- Offline: last cached `RippleStat` line, marked gently as "מהיום האחרון".
- Accessibility: line is screen-reader friendly; RTL numerals correct.

## Build Requirements
Aggregation pipeline with k-anonymity threshold; context matcher; belonging-line component; Copy Linter integration. Medium effort. No per-user social records.

## Definition of Done
- [ ] Belonging is always anonymous and aggregate — no names, faces, or profiles.
- [ ] No comparison or ranking language anywhere.
- [ ] k-anonymity enforced (k ≥ 50) before any number is shown.
- [ ] No interactive social action (no like/reply/follow).
- [ ] Hebrew RTL copy renders in light and dark, online and offline.
