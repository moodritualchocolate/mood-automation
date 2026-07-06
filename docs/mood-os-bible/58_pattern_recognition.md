# 58 — Pattern Recognition

> Pattern Recognition gently reflects tendencies over time — soft, non-diagnostic wonderings, never conclusions about who someone is.

## Purpose
As a person accumulates Moments, Attempts, and Journal entries, small tendencies emerge. This engine surfaces them as gentle, non-judgmental reflections that deepen self-noticing (see Ch. 01 Core Loop, step 9). A Pattern is an invitation to wonder, never a verdict. It is the slow reward of the game: a life becoming a little more visible to the person living it.

## User Experience
On the Patterns screen, the user occasionally finds a soft observation. Example: "בשבועות האחרונים, נראה שרגעים של אומץ קטן קורים לך יותר בבקרים" ("in recent weeks, small acts of courage seem to happen for you more in the mornings"). Patterns are rare, warm, and phrased as "seems," "maybe," "we noticed" — never "you are." The user can dismiss any Pattern; nothing is imposed.

## Game Mechanic
Heuristics propose candidates; Claude phrases them gently. Inputs: aggregated soft `Trait` signals, `Attempt` timing/type, `JournalEntry` sentiment trends. A deterministic layer detects statistically-soft tendencies (with confidence + decay); Claude renders the one worth surfacing into non-diagnostic Hebrew. Low-confidence candidates are held back. No scores, no rankings, no "improvement" framing.

## Screens Needed
- Patterns
- Moment Detail
- Living Library

## Visual Assets Needed
- Texture assets, Light assets (quiet, contemplative backdrops)
No text baked into images; Pattern copy renders in the live RTL text layer.

## AI Logic
Engine: **Pattern Recognition** = heuristics + **Claude API** (`claude-opus-4-8`, adaptive thinking). Heuristics compute candidate `Pattern`s with confidence; Claude phrases only high-confidence, kind ones. Guardrails: never diagnose or label (Ch. 55), never assert a fixed identity, always use tentative language. Passes Tone Guardrails (Ch. 62) + Copy Linter (Ch. 63). Suppress any Pattern that could read as clinical or judgmental.

## Data Stored
- `Pattern` { id, kind, signal (0–1 float), confidence, decay, hebrewText, surfacedAt, dismissed: bool }
- Derived only from existing entities; adds no diagnostic categories.
Local-first source of truth; optional Supabase sync. Copy fields store Hebrew.

## Edge Cases
- Too little data (early days): surface nothing; show a warm empty state.
- Low confidence: hold back rather than guess.
- Negative-trend detection: never frame as decline or problem; route emotional distress signals to User Safety (Ch. 61).
- User dismisses a Pattern: respect it; decay its signal, don't re-surface soon.
- Long RTL text: one gentle observation, not a report.

## Build Requirements
- Heuristic candidate detector over local `Attempt`/`Trait`/`JournalEntry` data.
- `/api/pattern-phrasing` Claude call for the selected candidate.
- Confidence threshold + decay + dismissal handling.
- Effort: medium.

## Definition of Done
- [ ] Surfaces only high-confidence, gently-phrased Hebrew Patterns.
- [ ] Uses tentative language ("seems/maybe"), never fixed identity claims.
- [ ] Empty and low-data states show warmth, never a forced Pattern.
- [ ] Dismissals are respected and decayed.
- [ ] Passes never-diagnose, Tone Guardrails, and Copy Linter.
