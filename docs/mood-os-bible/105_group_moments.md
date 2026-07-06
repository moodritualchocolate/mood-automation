# 105 — Group Moments

> A small circle of people — friends, a family, a team — can share one Moment on the same day and feel quietly connected, with no group leaderboard and no one left behind.

## Purpose
Belonging deepens in small, trusted circles. This chapter lets a handful of people (default cap: 8) experience the same `Moment` together on a chosen day and hold a shared sense of "we did this together". It scales the anonymous-humanity feeling (Ch. 103) down to a named circle of consent, while keeping every MOOD guarantee: no ranking, no comparison, no member counter used as pressure.

## User Experience
A user creates or joins a small circle (e.g. "משפחה", "family") by invite. On a Group Moment day, each member opens the same artwork and tiny title, reflects privately, and may live an aligned challenge. The circle sees only a warm collective line: "5 מתוך 6 בחוג שלכם חוו את הרגע הזה השבוע" ("5 of 6 in your circle experienced this Moment this week") — framed as togetherness, never as "who's missing". No member's journal is exposed; no one is ranked. Leaving or lurking is fine. The feeling is a shared campfire, not a group chat obligation.

## Game Mechanic
A `Circle` (≤ 8 members) can be assigned a shared `DailyMoment`. States per member: `invited → member`, then `chosen → lived | not_lived` privately. The circle-level surface shows only an aggregate "N experienced this" line, never per-member breakdowns. No streaks across the circle, no most-active member, no notifications that shame the absent. Membership count is shown for warmth only, never as a growth target.

## Screens Needed
- Shared Humanity
- Today / Daily Moment
- Living Library

## Visual Assets Needed
- Social/Share assets (circle invite background)
- People assets, Home assets, Light assets (intimate, communal warmth)
No text baked into images; Hebrew circle copy is a live RTL layer.

## AI Logic
Not AI-driven for circle mechanics. Reflection Generator (Claude) may phrase the shared Moment's reflection and the warm collective line. Copy Linter blocks "who didn't", ranking, or shame framing. Never diagnose the group or single out a member.

## Data Stored
`Circle { id, nameHe, memberUserIds[], createdAt }`, `GroupMoment { id, circleId, momentId, date }`. Each member's `Attempt`/`JournalEntry` stays private to them. Aggregate "N experienced" computed without exposing identities. Copy Hebrew; timestamps ISO 8601. Local-first; Supabase syncs membership and the shared Moment assignment.

## Edge Cases
- Only one member engages: shown as complete for them, no "others didn't" nag.
- Member leaves circle: silent, no penalty, no announcement of absence.
- Circle > 8 attempted: capped, with a warm explanation of why small is intentional.
- Offline: member experiences the shared Moment locally; sync later.
- Long Hebrew circle names / RTL: render safely.

## Build Requirements
`Circle` and `GroupMoment` models; invite flow; aggregate circle-line component; membership cap enforcement; Copy Linter rules. Medium effort. No per-member leaderboard.

## Definition of Done
- [ ] Circles capped small (≤ 8) by design.
- [ ] No leaderboard, ranking, or "who's missing" framing.
- [ ] Member journals and outcomes stay private.
- [ ] Only warm aggregate circle lines are shown.
- [ ] Hebrew RTL copy renders in light and dark, offline-safe.
