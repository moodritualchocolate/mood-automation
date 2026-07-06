# 97 — Shared Humanity

> Anonymous belonging: the quiet knowledge that thousands of others chose courage today too — no likes, no profiles, no comparison.

## Purpose
Shared Humanity (the Ripple) exists to dissolve loneliness without creating social media (see Ch. 06 station 10). It shows that a user's small act is part of a much larger human wave, giving belonging while refusing likes, followers, profiles, and comparison. It is connection as atmosphere, not as a feed.

## User Experience
After choosing or resolving a Challenge, a soft full-screen moment appears: gentle artwork and one Hebrew line, e.g. "8,412 אנשים בחרו היום מעשה קטן של אומץ." ("8,412 people chose a small act of courage today.") or "לא היחיד שלמד לומר 'לא' היום." ("not the only one who learned to say 'no' today."). Optionally the user can add their Moment anonymously to a Ripple — "הוסף בעילום שם" ("add anonymously") — contributing a count, never content or identity. There are no names, faces, likes, or replies. Optionally view a calm ambient "רחש הרגע" ("the murmur of the moment") — aggregate belonging only. The feeling target: *I'm not alone in this small brave thing.*

## Game Mechanic
Renders `RippleStat` aggregates (counts by challenge theme/level/day). Contribution increments an anonymous aggregate — no identifiable payload. States: `stat_shown → (optional) contributed`. No profiles, no likes, no comparison to others, no leaderboard, no rank. Numbers express company, never competition. Fully optional and skippable.

## Screens Needed
- Shared Humanity
- Today / Daily Moment
- Moment Detail (share entry)
- Privacy (what's shared)

## Visual Assets Needed
- Social/Share assets (anonymous, textless compositions), Masterpiece/Light assets (belonging warmth). No text baked in; the belonging line is a live RTL layer. Shared images carry no personal text.

## AI Logic
Mostly aggregate computation. Optional light copy generation for the belonging line (Reflection Generator, Ch. 06) passed through Tone Guardrails + Copy Linter. Guardrail: never phrase as ranking/comparison; never expose any individual. No diagnosis.

## Data Stored
- `RippleStat` (theme, level, date, count) — aggregates only, no user linkage.
- A local flag that the user contributed (for their own record), not stored against the aggregate identifiably. Local-first; optional Supabase for aggregate sync.

## Edge Cases
- Low/zero counts (early product): warm phrasing "מעטים בחרו — ואתה אחד מהם." ("few chose — and you're one of them."), never an empty "0."
- Offline: show last cached stat; queue optional contribution.
- Privacy off (Ch. 99): hide contribution option, still show read-only belonging.
- Error fetching stats: graceful fallback line, never an error code.
- Long RTL numbers/lines: format Hebrew numerals correctly; no clip (Ch. 100).

## Build Requirements
- `SharedHumanity` screen, `RippleStatView`, anonymous `ContributeButton`, Tailwind, RTL, light/dark, mobile-first.
- `/api/ripple` aggregate read + increment (no PII); privacy-gated contribution.
- Zustand + PWA cache of last stat.
- Effort: M.

## Definition of Done
- [ ] Belonging shown as anonymous aggregates in Hebrew RTL.
- [ ] No likes, profiles, names, replies, leaderboards, or comparison.
- [ ] Contribution is optional, anonymous, and privacy-gated.
- [ ] Low-count and offline states are warm, never "0" or error.
- [ ] Shared images carry no baked text; RTL + light/dark verified.
