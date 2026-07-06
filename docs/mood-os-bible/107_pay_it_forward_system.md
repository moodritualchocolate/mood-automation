# 107 — Pay It Forward System

> After a Moment moves someone, MOOD lets them pass a small kindness onward — anonymously gifting a Moment to a stranger — so generosity, not vanity, becomes the thing that spreads.

## Purpose
The most human form of virality is generosity. This chapter defines Pay It Forward: a user who was touched can send a small anonymous gift — a Moment, a warm line, or an unlocked experience — to an unknown other person, and later receive one from someone they'll never meet. It replaces "share to grow my audience" with "give because I was given to". No thanks are owed, no ledger of who gave more.

## User Experience
After a meaningful Moment, the user may be invited: "מישהו נתן לך רגע. רוצה להעביר אחד הלאה?" ("someone gave you a Moment. want to pass one forward?"). They choose a Moment or write a short warm line, and send it anonymously into the pool. Days later they may receive one: "רגע קטן הגיע אליך ממישהו, אנונימית, רק כי רצה לתת" ("a small Moment reached you from someone, anonymously, just because they wanted to give"). Neither giver nor receiver is identified. No count of how many you've given is shown as a badge. The feeling: quiet grace, both ways.

## Game Mechanic
A `Gift` enters an anonymous pool and is later matched to a consenting receiver. States: `given → pooled → received | expired`. Matching is random and identity-stripped. Giving is always optional and never counted publicly; there is no "giver rank" or generosity leaderboard. A user can opt out of both giving and receiving at any time with no penalty.

## Screens Needed
- Moment Detail
- Shared Humanity
- Today / Daily Moment

## Visual Assets Needed
- Social/Share assets and Masterpiece assets (the gifted Moment's artwork)
- Light and Texture assets (warmth of giving)
No text baked into images; Hebrew gift copy is a live RTL layer.

## AI Logic
Reflection Generator (Claude) may help phrase the optional warm line; Copy Linter validates it (no shame, no "should", no self-promotion). Pattern Recognition may match a gift's theme to a receiver who might need it, using soft signals only — never diagnosing, never labeling. Matching identities are always stripped.

## Data Stored
`Gift { id, type (moment|line|unlock), payloadRef, captionHe?, state, createdAt, expiresAt }` with **no giver or receiver identity stored on the gift**. Delivery mapping is transient and anonymized. Copy Hebrew; timestamps ISO 8601. Local-first for composing; Supabase manages the anonymous pool and matching.

## Edge Cases
- Empty pool: user receives a system-seeded warm Moment instead of nothing.
- Gift unclaimed before expiry: returns to pool or gently retires; giver never notified of "failure".
- User opts out: never prompted again; existing gifts unaffected.
- Abuse/safety: free-text lines pass safety filters (Ch. 52) before pooling.
- Offline: giving queues locally; receiving syncs later.

## Build Requirements
Anonymous `Gift` pool; identity-stripped matcher; safety filter on free text; opt-out controls; Copy Linter gate. Medium effort. No generosity counter or ledger.

## Definition of Done
- [ ] Giving and receiving are both fully anonymous.
- [ ] No generosity count, badge, or leaderboard exists.
- [ ] Opt-out for giving and receiving, penalty-free.
- [ ] Free-text gifts pass safety filters before entering the pool.
- [ ] Hebrew RTL copy renders in light and dark, offline-safe.
