# 106 — Weekly Shared Story

> Once a week, MOOD gathers the whole community's small acts into one anonymous, beautiful narrative of shared humanity — a story the user belongs to without ever being ranked in it.

## Purpose
Individual belonging (Ch. 103) becomes even warmer when it is woven into a story. This chapter defines the Weekly Shared Story: a once-a-week, anonymous, aggregate narrative of what the community felt and dared together. It is a `Chapter` (weekly) at the community scale — a mirror that says "look what we, all of us, quietly did this week." No individual is named, ranked, or featured.

## User Experience
On the Shared Humanity screen, once a week, the user finds a short illustrated story assembled from anonymous aggregates: "השבוע 61,400 אנשים ניסו משהו שהפחיד אותם. 9 מתוך 10 אמרו שהיו מנסים שוב." ("this week 61,400 people tried something that scared them. 9 of 10 said they'd try again."). It reads like a gentle newspaper of courage — themes, feelings, small triumphs — with warm artwork and generous negative space. The user may make a shareable Ripple image of the week's line to send to one person. The feeling: pride in belonging to something larger and kind.

## Game Mechanic
Each week the system composes a `Chapter (weekly, scope: community)` from anonymized `RippleStat` aggregates: most-chosen theme, share of "would try again", a standout anonymous emotion. States: `composing → published`. It is read-only and non-comparative — the user's own data is never singled out within it, and no member is ever named or ranked.

## Screens Needed
- Shared Humanity
- Living Library
- Moment Detail

## Visual Assets Needed
- Masterpiece assets and Social/Share assets (the story's illustrated spreads)
- Light and Texture assets (warm, editorial calm)
No text baked into images; Hebrew story copy is a live RTL layer.

## AI Logic
Reflection Generator + Pattern Recognition (Claude, Ch. 06) turn anonymized community aggregates into a warm narrative. Inputs: weekly `RippleStat` set only — never individual records. Guardrails: outcome-agnostic, no comparison, no naming, no diagnosis. Copy Linter validates the full story before publish; blocks rank/shame/vanity framing.

## Data Stored
`Chapter { id, scope: community, period: weekly, startDate, endDate, storyHe, rippleStatIds[] }`. Built purely from aggregate `RippleStat`s — **no user linkage**. Copy Hebrew; timestamps ISO 8601. Local-first cache of the current week's story; Supabase composes and serves it.

## Edge Cases
- Sparse week (low activity): tell a smaller, still-warm story; never expose thin numbers below k = 50.
- First-ever week: seed with a general humanity narrative.
- Offline: last published weekly story from cache, gently dated.
- Long Hebrew narrative / RTL: paginates cleanly; accessible reading order.
- User opts out of social surfaces: story simply not shown, no nag.

## Build Requirements
Weekly composition job; `Chapter` (community) model; story reader component; shareable Ripple image hook (Ch. 102); Copy Linter gate. Medium effort.

## Definition of Done
- [ ] Story is fully anonymous and aggregate — no individuals named or ranked.
- [ ] No comparison of the user to others anywhere in the story.
- [ ] k-anonymity (≥ 50) enforced for every number shown.
- [ ] Publishes once per week; readable offline from cache.
- [ ] Hebrew RTL copy renders in light and dark.
