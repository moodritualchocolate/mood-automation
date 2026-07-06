# 55 — Never Diagnose

> The single hardest rule in MOOD: never diagnose, never label, never use clinical language — only notice, wonder, and invite.

## Purpose
MOOD touches emotional territory, so the risk of sounding like a diagnostic tool is real and dangerous. This chapter fixes the absolute boundary: MOOD is a Human Experience Game, not an assessment, screening, or therapeutic instrument. The user must NEVER feel measured, categorized, or told what is "wrong" with them. Getting this wrong breaks trust irreparably and creates real-world harm; getting it right is what makes the product feel safe enough to open every day.

## User Experience
The user reads copy that observes a *behavior or choice*, never a *condition*. Approved: "שמנו לב שהשבוע בחרת בעיקר ברגעים שקטים" ("we noticed you mostly chose quiet moments this week"). Forbidden: anything implying anxiety, depression, a disorder, a personality type, or a deficiency. The user should feel gently accompanied, as if a thoughtful friend said something kind and curious — never as if a system rendered a verdict.

## Game Mechanic
This is a constraint layer over every engine, not a mechanic itself. All `Trait` signals in the `HumanMap` are soft floats (0–1) with confidence and decay — they are *tendencies*, never *labels*. No signal ever renders to the user as a category. The rule: describe the observable, offer a wondering, extend an invitation. Never assert an internal state as fact.

## Screens Needed
- Today / Daily Moment
- Patterns
- Moment Detail
- Privacy

## Visual Assets Needed
None. Enforcement is linguistic. Visuals stay abstract and non-clinical (warm, painterly Grok assets; no text in images).

## AI Logic
Enforced across all Claude API engines via three mechanisms: (1) system-prompt prohibition listing banned framings; (2) the Copy Linter (Ch. 63) blocking clinical tokens (diagnose, disorder, symptom, anxiety-as-label, depression-as-label, condition); (3) required rewrite of any `Trait` reference into observational, non-labeling Hebrew. Never map soft signals to named conditions. When uncertain, the AI wonders rather than concludes.

## Data Stored
- `Trait` { key, signal (0–1 float), confidence, decay, updatedAt } — internal only, never surfaced as a label.
- Linter audit log: `{ copyId, blockedTokens[], action }`.
No diagnostic categories are ever stored. Local-first; optional Supabase sync.

## Edge Cases
- User self-labels ("אני חושב שיש לי חרדה"): AI must not confirm, deny, or assess; it responds with warmth and, if distress is present, routes to User Safety (Ch. 61).
- Ambiguous Journal text: default to the gentlest, non-clinical reading.
- Long RTL copy: rewrites must not clip or lose the non-labeling framing.
- Regeneration must re-pass the never-diagnose linter every time.

## Build Requirements
- Banned-clinical-token list shared with Copy Linter.
- System-prompt clause reused by all engines (Ch. 64).
- Trait-to-copy transformer that strips any categorical framing.
- Effort: medium; correctness-critical.

## Definition of Done
- [ ] No engine can output a diagnosis, disorder name, or clinical label.
- [ ] All `Trait` data is stored as soft signals, never categories.
- [ ] Self-labeling users receive warmth, never assessment.
- [ ] Copy Linter blocks the full clinical token list before display.
- [ ] Distress cases route to Ch. 61, never to AI counsel.
