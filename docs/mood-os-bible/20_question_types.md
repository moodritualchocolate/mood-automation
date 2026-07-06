# 20 — Question Types

> The small family of playful prompt formats MOOD uses to learn about a user — none of which are questionnaires.

## Purpose
Discovery needs variety so it never feels like a survey. This chapter defines the approved "question types" — really *choice formats* — that the Discovery Engine (Ch. 19) and later light re-prompts may use. The goal is to gather soft signals through instinct and taste, always leaving the user feeling curious rather than examined.

## User Experience
The user meets a gentle rotation of formats so no two feel the same. Examples of framing (Hebrew, user-facing):
- **This-or-that (visual):** "מה מושך אותך יותר?" ("What draws you more?") — two artworks.
- **Reach-toward:** "לאן היד שלך הולכת קודם?" ("Where does your hand go first?") — three objects.
- **Mood-tap:** "איזה אור מרגיש כמוך היום?" ("Which light feels like you today?").
- **Would-you-rather (soft):** "ערב שקט לבד או ערב מלא אנשים?" ("A quiet evening alone or a full one with people?").
- **Skip is always offered:** "לא בטוח/ה" ("Not sure").
No open text boxes in Discovery. No sliders labeled with judgments (never "How anxious are you?").

## Game Mechanic
- Each type is a template with 2–3 choices and a skip.
- Every choice carries a small weight vector across several `Trait` signals; no choice maps to exactly one trait or a category.
- Types are tagged by which signal families they gently probe: energy (Ch. 27), social courage (Ch. 26), comfort/fear (Ch. 25), curiosity, aesthetic preference.
- Sequencing: alternate types and signal families so the user never feels drilled on one theme.

## Screens Needed
- Discovery Flow (renders all question types)
- Onboarding (introduces the format)

## Visual Assets Needed
- Masterpiece, Moment, Object, People, and Light assets to populate choice slots (no baked text).
- Texture assets for neutral backgrounds.

## AI Logic
Not AI-driven — question types are authored templates with a fixed weighting config, chosen for transparency and safety. Claude is not used to generate Discovery prompts, because we require deterministic, tone-audited copy. Copy Linter (Ch. 06) validates every prompt string against banned framings (no "should", no clinical terms, no judgment).

## Data Stored
- `QuestionTemplate` — `{ id, type, choices[], signalWeights, version }` (config, not per-user).
- Per answer on `DiscoverySession.choices[]` — `{ templateId, choiceId | skipped, at }`.
- Resulting nudges applied to `HumanMap.Trait[]` (soft 0–1, low confidence).
- Local-first; optional Supabase sync.

## Edge Cases
- Repeated skips of one type → down-weight that type's future frequency, never flag the user.
- RTL and long Hebrew glosses must not clip; choices stack on narrow screens.
- Accessibility: each visual choice needs an alt description; format announced to screen readers.
- Offline: all templates bundled locally.
- Never present a type that implies a diagnosis or a "correct" instinct.

## Build Requirements
- `<QuestionRenderer>` switching on `type`.
- Versioned `question-templates.json` with signal weightings.
- Unit tests asserting every template passes the Copy Linter and touches ≥2 signal families.
- Effort: ~2–3 dev days.

## Definition of Done
- [ ] At least 5 distinct question types implemented and rotating.
- [ ] No open-ended or clinical prompts exist.
- [ ] Every prompt string passes the Copy Linter.
- [ ] Each choice affects a weight vector, never a single label.
- [ ] Skip present on every question.
