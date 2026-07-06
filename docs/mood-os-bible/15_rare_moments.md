# 15 — Rare Moments

> Uncommon, treasured Moments that appear unpredictably — the closest MOOD comes to magic, and never a reward for performance.

## Purpose
Rare Moments enrich **station 4 (Moment)** and **station 8 (Library)** by occasionally delivering a heightened, special Daily Moment. They exist to create wonder and depth in the ritual without gamifying it — they are *gifts*, not prizes. They give the Living Library texture: most Moments are quiet, a few are unforgettable.

## User Experience
Once in a while the user opens **Today / Daily Moment** and something feels different: a **Masterpiece asset**, a slower reveal, a rarer title and reflection — e.g. "רגע נדיר: השקט שאחרי" ("a rare moment: the quiet after"). It is not announced as a trophy; there is no "you unlocked" language. In the **Living Library** it sits distinctly, softly luminous, marked as treasured. The feeling is serendipity — "the app gave me something special today" — never "I earned this."

## Game Mechanic
- **Trigger:** a Rare Moment is a `MomentTemplate` with `rarity = rare` selected via low-probability weighting, seasoned by `HumanMap` fit and `Memory Engine` (avoid clustering, honor cool-downs).
- **States:** `issued(rare) → met → settled(isRare=true)`.
- **Probability:** target frequency ~1 in 15–25 days, jittered so it's never predictable and never a schedule the user can game.
- **Not a reward:** rarity is NOT tied to trying, Brave choices, or activity level — decoupled from performance by design so it can never become a streak incentive.
- **Inputs:** rarity roll + fit. **Outputs:** a distinct `RareMoment` record + `LibraryItem.isRare`.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library

## Visual Assets Needed
- Masterpiece assets (primary — the highest-craft artwork)
- Light assets, Texture assets, Video keyframes (special reveal). No text baked into any image; titles live RTL.

## AI Logic
- **Reflection Generator** (Claude) writes a richer, more resonant Hebrew reflection with a rare-tone prompt profile.
- **Memory Engine** enforces cool-down and avoids repeating a rare theme.
- Guardrails: rare copy is still non-diagnostic, still kind, no "reward/unlock/achievement" framing; Copy Linter enforced.

## Data Stored
- `RareMoment` (id, userId, dailyMomentId, templateId, rarityTier, issuedAt ISO 8601).
- `MomentTemplate.rarity` field; `LibraryItem.isRare = true`.
Local-first; optional Supabase sync. Copy Hebrew.

## Edge Cases
- **New user:** rare eligible only after a small warm-up (~5 Moments) so it feels earned by time, not tasks.
- **Offline:** rarity roll runs locally from cached rare templates/assets; if none cached, defer (never block the day).
- **Clustering:** cool-down prevents two rares close together.
- **No performance coupling:** verify rarity ignores Attempt history (test).
- **RTL/long-text + accessibility:** special reveal honors reduced-motion; alt text present.

## Build Requirements
- Rarity selector in Daily Ritual engine (`rarity-roll.ts`) with jitter + cool-down.
- Special reveal component + Masterpiece asset preloading.
- Effort: M.

## Definition of Done
- [ ] Rare Moments appear at target ~1/15–25 days, unpredictably.
- [ ] Rarity is fully decoupled from user performance/trying (tested).
- [ ] No reward/unlock/achievement language (Copy Linter passes).
- [ ] Rendered with Masterpiece assets, no baked text.
- [ ] Marked distinctly in Living Library (`isRare`).
- [ ] Offline-safe; cool-down enforced; reduced-motion + RTL verified.
