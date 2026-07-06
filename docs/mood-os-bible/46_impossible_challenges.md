# 46 — Impossible Challenges

> Impossible challenges are rare, aspirational dreams the user may opt into — never assigned by default, always framed as a someday-horizon, never a task with a deadline.

## Purpose
Some growth edges are too big for a single day: a life-scale dream a person carries quietly. The Impossible tier exists to *hold* those dreams with dignity, not to demand them. It is deliberately outside the default three-level ladder (Easy/Medium/Brave) so it can never pressure anyone. Impossible is opt-in, aspirational, and reframed constantly as a horizon to walk toward — the app breaks it into safe Brave-sized steps rather than ever asking the user to "complete" the impossible. This chapter defines that safe framing.

## User Experience
A user never sees an Impossible challenge unless they choose to open the optional "חלומות רחוקים" ("faraway dreams") space in Settings. There, they can name a big dream themselves. Example (user-authored): "לדבר מול קהל" ("to speak in front of an audience"). MOOD responds not with a dare but with warmth and a first small rung: "חלום יפה. הצעד הראשון הקטן יכול להיות..." ("a beautiful dream. the first small step could be..."). The Impossible is celebrated as a direction, and today's actual Challenge remains an ordinary safe Easy/Medium/Brave step toward it. The user never feels they failed to reach it.

## Game Mechanic
An Impossible entry is stored as an aspirational `Challenge` with a flag, not scheduled into any `DailyMoment` automatically. It has no `chosenLevel` of its own; instead it *seeds* future normal three-level ladders. It has no completion state — only ongoing "steps taken toward it", each an ordinary honored `Attempt`. No streaks, no countdown, no progress bar to 100%. The user may archive or release a dream at any time with zero penalty.

## Screens Needed
- Settings (faraway dreams space)
- Challenge Selection (steps toward a dream surface as normal levels)
- Living Library (dream horizon and steps taken)

## Visual Assets Needed
- Masterpiece assets (expansive, horizon-like artwork)
- Light assets (dawn/horizon warmth)
No text baked into images; Hebrew copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) never emits an Impossible challenge unprompted. When a user names a dream, the generator translates it into safe Brave-sized first steps. Hard guardrails (Ch. 52): the dream and every derived step must be safe, legal, consensual, non-self-harming, age-appropriate. Copy Linter blocks any "you must / by when / you failed" framing. Never diagnose ambition; hold it gently.

## Data Stored
`Challenge { id, tier: "impossible", isAspirational: true, userAuthored, copyHe, derivedStepIds[] }`. Steps are ordinary `Attempt`s on normal three-level ladders. Local-first source of truth; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- Never assigned by default — enforced in the scheduler.
- User abandons a dream: released warmly, no guilt copy (Ch. 53).
- Unsafe user-authored dream: gently declined with a safe reframing (Ch. 52 fallback).
- Offline: dreams and steps stored locally.
- Long RTL copy and accessibility as elsewhere.

## Build Requirements
Optional dreams space in Settings; aspirational flag on Challenge; generator step-derivation; scheduler exclusion rule. Medium effort, low priority.

## Definition of Done
- [ ] Impossible is never surfaced or assigned without explicit opt-in.
- [ ] No completion state, countdown, or progress bar exists.
- [ ] Every derived step passes the Ch. 52 safety gate.
- [ ] Releasing a dream carries zero penalty or shame.
- [ ] Hebrew RTL renders in light and dark.
