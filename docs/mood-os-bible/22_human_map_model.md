# 22 — Human Map Model

> The living, non-diagnostic model of a person that every part of MOOD reads from and writes to — soft signals only, never labels.

## Purpose
The Human Map is MOOD's understanding of the user. It exists so every Daily Moment, Challenge, reflection, and pattern can feel personal. Its defining rule: it **never diagnoses, judges, or labels**. It holds only soft `Trait` signals (0–1) with confidence and decay, so it stays humble, current, and correctable.

## User Experience
Users almost never see the Map as data. They feel it: Moments that fit, challenges pitched at the right courage, reflections that name something quietly true. If a user ever glimpses the Map (a soft "self-portrait" view), it reads as poetry, not a report: "לאחרונה נראה שקרבה חשובה לך." ("Lately, closeness seems to matter to you.") — always tentative, always kind, always editable. There are no percentages shown, no types, no "you are an introvert." The user can always say "זה לא אני" ("that's not me") and the signal softens.

## Game Mechanic
- The Map is a collection of `Trait` objects across families: strengths (Ch. 23), growth areas (Ch. 24), fears (Ch. 25), social courage (Ch. 26), energy patterns (Ch. 27), emotional preferences, challenge readiness, comfort zones.
- Each `Trait`: `{ id, family, kind, signal: 0–1, confidence: 0–1, decayRate, evidence[], updatedAt }`.
- Writes: Discovery seeds; Attempts, JournalEntries, and choices update signals via bounded nudges (max ±0.1 per event).
- Decay: unreinforced signals drift toward 0.5 (neutral) over time so the Map never ossifies.
- Reads: Moment selection, Challenge Generator, Pattern Recognition all consume signals with confidence weighting.

## Screens Needed
- Discovery Flow (seeds it)
- Today / Daily Moment (reads it)
- Patterns (softly reflects it)
- Settings / Privacy (view, export, reset the Map)

## Visual Assets Needed
- Light and Texture assets for any "self-portrait" visualization (abstract, textless).
- Masterpiece assets if the Map is ever surfaced as an evolving artwork.

## AI Logic
Used by Reflection, Challenge, and Pattern engines (Ch. 06) as **input context**, not as a classifier. Guardrails: engines receive soft signals + confidence and must phrase everything tentatively; the Copy Linter blocks diagnostic or absolute language. Claude never assigns a type; it only responds to leanings. Low-confidence signals are down-weighted so the AI never over-claims.

## Data Stored
- `HumanMap` — `{ userId, traits: Trait[], version, updatedAt }`.
- `Trait` as above, with `evidence[]` referencing `Attempt`/`JournalEntry` ids (not raw content).
- Local-first (Zustand, autosave, BroadcastChannel across tabs); optional Supabase `human_maps` sync, user-owned and exportable.

## Edge Cases
- Cold start → all signals 0.5, confidence low; Moments stay universal.
- Contradictory evidence → keep both, lower confidence, never force a resolution.
- User rejects a signal → immediate soften + confidence drop; logged as correction.
- Offline → all reads/writes local; sync on reconnect.
- Privacy: user can export or fully delete the Map; deletion is honored locally and in Supabase.
- Never expose raw numbers as judgments; long Hebrew RTL text must wrap.

## Build Requirements
- `humanMap` Zustand slice + reducer for bounded nudges and decay.
- `applyDecay()` scheduled job (client-side, on open).
- Supabase `human_maps` table with row-level security (user-owned).
- Export/reset endpoints; correction logging.
- Effort: ~5–6 dev days (core of the product).

## Definition of Done
- [ ] All signals are 0–1 floats with confidence + decay; no categorical fields exist.
- [ ] No diagnosis, type, or label is ever stored or shown.
- [ ] Nudges are bounded and decay runs on each session.
- [ ] User can view (as poetry), correct, export, and delete the Map.
- [ ] Works offline; syncs securely when signed in.
