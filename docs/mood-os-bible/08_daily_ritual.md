# 08 — Daily Ritual

> The once-a-day rhythm that issues exactly one Daily Moment and makes opening MOOD feel like lighting a small candle.

## Purpose
The Daily Ritual is **station 3** of the Core Loop. It enforces the product's central discipline: *one Daily Moment per day, no more*. It exists to make MOOD a ritual rather than a feed — scarcity that creates meaning. It decides *when* a new `DailyMoment` is issued and protects the user from infinite scrolling or bingeing.

## User Experience
The user opens MOOD and sees today's single **Today / Daily Moment**. If they already met today's Moment, they see the same one again, calm and unchanged, with a soft line like "נתראה מחר לרגע חדש" ("see you tomorrow for a new moment"). There is no "next," no refresh-for-more. The open animation feels ceremonial — a slow fade from **Splash** into artwork. The ritual is gentle, not demanding: missing yesterday is invisible, never scolded.

## Game Mechanic
- **Day boundary:** local midnight in the user's timezone defines a new ritual slot.
- **States:** `awaiting_today → moment_issued → moment_met → settled`.
- **One-per-day rule:** at most one `DailyMoment` with `status != skipped` per date. Re-opening the same day returns the existing `DailyMoment`.
- **Selection:** on first open of a new day, the engine picks a `MomentTemplate` using `HumanMap` signals + `Memory Engine` (avoid recent repeats) and materializes a `DailyMoment` (station 4).
- **No catch-up stacking:** missed days do NOT queue up; the user always meets *today's* Moment only. History lives in the Library, not as a backlog.

## Screens Needed
- Splash
- Today / Daily Moment

## Visual Assets Needed
- Masterpiece assets (ritual open state)
- Moment assets (today's artwork)
- Light assets, Video keyframes (fade-in ceremony). No text in images.

## AI Logic
- **Reflection Generator** (Claude) writes today's living reflection in Hebrew at issue time.
- **Memory Engine** supplies recent `DailyMoment` history to prevent repetition and to weight selection.
- Guardrails: no time-pressure or streak language; Copy Linter blocks "don't miss," "keep it up," etc. Never diagnose from timing behavior.

## Data Stored
- `DailyMoment` (id, userId, momentTemplateId, date ISO 8601, status, issuedAt, metAt).
- Reference to generated `Reflection` and optional `Challenge`.
- Ritual state in Zustand; persisted local-first; optional Supabase sync.

## Edge Cases
- **Skipped days:** no penalty, no streak counter; next open simply issues today's Moment.
- **Timezone/travel:** day boundary follows device timezone; guard against double-issue when crossing midnight.
- **Offline:** issue from a locally cached pool of `MomentTemplate`s + assets.
- **Clock tampering:** cap to one new Moment per real elapsed ~20h to prevent farming.
- **Empty pool offline:** reuse a warm evergreen Moment rather than blocking.
- RTL/long-text: reflection can be multi-line; layout must reflow.

## Build Requirements
- `useDailyRitualStore` (Zustand) with day-boundary selector.
- `/api/daily-moment` (GET today, POST issue) — idempotent per date.
- Local `MomentTemplate` cache + asset prefetch for offline issue.
- Ceremony animation component (respects reduced-motion).
- Effort: M.

## Definition of Done
- [ ] Exactly one Daily Moment issued per calendar day, idempotent on re-open.
- [ ] No "next moment" / no bingeing path exists.
- [ ] Missed days produce zero penalty or streak copy.
- [ ] Works offline from cached pool; syncs later.
- [ ] Clock-tamper guard prevents farming extra Moments.
- [ ] Ceremony animation honors reduced-motion + RTL.
