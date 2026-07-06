# 62 — Tone Guardrails

> Tone Guardrails hold every word MOOD says to the exact voice of the product: intimate, warm, non-judgmental, and always about the attempt — never the result.

## Purpose
The Copy Linter (Ch. 63) blocks forbidden *tokens*; Tone Guardrails govern the harder thing — *voice*. This chapter defines the felt quality of MOOD's language so every reflection, challenge, and pattern sounds like the same caring, unhurried presence. Tone is the product; a single cold or clinical sentence breaks the spell.

## User Experience
The user consistently feels spoken to by a warm friend who notices gently. The voice: quiet, curious, tender, never performative, never congratulatory about outcomes, never instructive in a "you should" way. Approved feeling: "שמנו לב… אולי… מותר לך" ("we noticed… maybe… it's okay for you"). Forbidden feeling: coaching, grading, hyping, shaming, or clinical distance. Warmth without saccharine; intimacy without intrusion.

## Game Mechanic
Every AI output passes a Tone Guardrail check before display. The guardrail evaluates against a rubric: observational (not evaluative), tentative (not asserting identity), attempt-oriented (not outcome-oriented), warm (not clinical), inviting (not commanding). Copy that fails is regenerated or replaced with a hand-authored fallback. This runs alongside the Copy Linter in the same delivery pipeline.

## Screens Needed
Applies to all copy surfaces:
- Today / Daily Moment
- Challenge Selection
- Evening Check-in
- Patterns
- Living Library

## Visual Assets Needed
None. Tone is linguistic. (Visuals carry the same warm mood via Grok Light/Texture assets, no text in images.)

## AI Logic
Enforced across all **Claude API** engines (`claude-opus-4-8`). Two mechanisms: (1) a shared system-prompt voice charter embedded in every template (Ch. 64) describing the approved voice and banned framings; (2) an automated tone-rubric pass — a lightweight Claude check plus deterministic heuristics — that scores output and rejects failures. Never diagnose (Ch. 55). On repeated failure, serve reviewed fallback copy.

## Data Stored
- `ToneReview` { copyId, rubricScores{}, passed: bool, action, reviewedAt (ISO 8601) }
- Approved voice charter (versioned config, not user data).
Local-first; audit logs optional to Supabase.

## Edge Cases
- Borderline copy: prefer regeneration; if it fails twice, use fallback.
- Long RTL text: tone must hold across full length without drifting instructive.
- Culturally sensitive phrasing: Hebrew idioms reviewed by a native speaker.
- Personalization pushing intensity: guardrails still cap tone at non-shaming.
- Offline: fallback copy is pre-vetted to the same voice charter.

## Build Requirements
- Versioned voice charter shared by all engine templates.
- Tone-rubric middleware (Claude check + heuristics) in the delivery pipeline.
- Fallback copy bundle authored to the charter.
- Effort: medium; ongoing curation.

## Definition of Done
- [ ] Every AI output passes the tone rubric before display.
- [ ] Voice is observational, tentative, attempt-oriented, warm, inviting.
- [ ] No "you should," coaching, grading, hyping, or shaming tone ships.
- [ ] Failures regenerate or fall back to charter-consistent copy.
- [ ] Charter is versioned and shared across all Ch. 64 templates.
