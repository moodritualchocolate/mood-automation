# 96 — Patterns Screen

> A gentle mirror that reflects quiet patterns in a person's life over time — observations, never diagnoses.

## Purpose
The Patterns screen is how MOOD reflects a life back to its owner (see Ch. 06 station 9). It exists to surface soft, non-diagnostic observations — "you seem braver in the evenings," "warmth toward others keeps showing up" — that a person might never have put into words. It is insight as a gift, never a verdict or a metric.

## User Experience
A calm scroll of a few `Pattern` cards, each a soft artwork with one Hebrew observation and a supporting line, e.g. "נדמה שאתה אמיץ יותר בערבים." ("it seems you're braver in the evenings.") or "חום כלפי אחרים חוזר אצלך שוב ושוב." ("warmth toward others keeps returning in you."). Each pattern links to the Moments behind it ("הרגעים שמאחורי זה" — "the moments behind this"). Tone is tentative — "נדמה", "אולי" ("it seems", "maybe") — never absolute. No charts of scores, no personality type. Early on: "עוד לא אספנו מספיק כדי לשקף — וזה בסדר." ("we haven't gathered enough to reflect yet — and that's okay."). The feeling target: *something saw a truth about me and offered it kindly.*

## Game Mechanic
Renders `Pattern` entities derived from history (`Attempt`s, `JournalEntry`s, `Trait` signals, time-of-day, emotion tags). Patterns appear only above a confidence threshold and always as soft language. States: `insufficient_data → emerging → shown`. Users can dismiss a pattern ("זה לא אני" — "that's not me"), which lowers its signal — feedback, not failure. No score, no streak, no ranking of the person.

## Screens Needed
- Patterns
- Moment Detail (the Moments behind a pattern)
- Living Library
- Shared Humanity

## Visual Assets Needed
- Masterpiece/Moment assets (pattern card art), Light/Texture assets (calm). No text baked in; observations are live RTL layers. No score charts.

## AI Logic
Pattern Recognition (Claude + heuristics) with Memory Engine (Ch. 06). Inputs: history above. Guardrails: never diagnose, never label with clinical/personality categories, always tentative phrasing, respect confidence + decay. All copy through Tone Guardrails + Copy Linter. Dismissals feed back into confidence.

## Data Stored
- `Pattern` (id, softObservation Hebrew, supportingMomentIds, confidence 0–1, decay, dismissed bool, updatedAt ISO 8601).
- Local-first source of truth; optional Supabase sync.

## Edge Cases
- Insufficient data (first ~week): warm "not yet" state, never fabricate a pattern.
- Low confidence: keep hidden rather than risk a wrong label.
- Dismissed pattern: hide and lower signal; never argue back.
- Offline: render cached patterns; recompute on next sync.
- Sensitive inference: suppress anything that could read as diagnosis or judgement.
- Long RTL observation text: reflow, never clip; tap targets ≥44px (Ch. 100).

## Build Requirements
- `PatternsScreen`, `PatternCard`, `SupportingMoments` link, Tailwind, RTL, light/dark, mobile-first.
- `/api/pattern` compute; confidence-thresholded rendering; dismissal writes back.
- Zustand + local store; optional Supabase; PWA cache.
- Effort: M–L.

## Definition of Done
- [ ] Patterns shown only above confidence, always in tentative Hebrew.
- [ ] Each pattern links to its supporting Moments.
- [ ] No diagnosis, label, personality type, score, or chart of metrics.
- [ ] "Not enough yet" state is warm, never empty/blank.
- [ ] Dismissal lowers signal gracefully; RTL + light/dark verified.
