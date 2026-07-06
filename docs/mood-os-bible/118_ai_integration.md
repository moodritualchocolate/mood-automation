# 118 — AI Integration

> How Claude is wired into MOOD as invisible, guardrailed infrastructure — server-only keys, Hebrew output, hard fallbacks, and a never-diagnose contract.

## Purpose
This chapter is the engineering contract for AI. It specifies exactly how the Reflection Generator, Challenge Generator, Pattern Recognition, and Memory Engine (Volume 06) call Claude, how outputs are constrained, and how the app stays calm and working when AI is slow, offline, or wrong. It exists so AI reliably delivers the core promise — "someone noticed something small about my life" — without ever becoming a judge.

## User Experience
The user never meets an AI. No chatbot, no persona, no typing dots. They simply find today's Hebrew reflection, three challenge levels, and the occasional gentle pattern. Example: "שמנו לב שברגעים שקטים אתה מוצא אומץ" ("we noticed that in quiet moments you find courage"). Warm, specific, RTL, never clinical.

## Game Mechanic
Request path (server-only): client → Route Handler → `aiClient(Claude)` → guardrails → response.
- **Model**: Claude API, `claude-opus-4-8`, adaptive thinking; streaming for long output.
- **Engines**:
  - *Reflection Generator* — inputs: current `MomentTemplate`, `HumanMap` traits, recent `Attempt`/`JournalEntry` sentiment via **Memory Engine**; output: Hebrew `Reflection`.
  - *Challenge Generator* — output: three `ChallengeLevel`s (easy/medium/brave), real-world, outcome-agnostic.
  - *Pattern Recognition* — Claude + heuristics over history → soft `Pattern` (signal+confidence), gentle Hebrew summary.
- **Guardrails (two layers, both mandatory)**: (1) system prompt forbidding diagnosis, labels, and banned framings; (2) deterministic **Copy Linter** blocking banned tokens (streak/fail/score/diagnose/should/shame) before any text ships.
- **Reliability**: retry once on guardrail rejection or timeout; then serve hand-authored Hebrew fallback with HTTP 200.

## Screens Needed
- Today / Daily Moment (reflection + challenge)
- Challenge Selection
- Patterns
- Settings (AI/privacy controls)

## Visual Assets Needed
None from Claude — it produces text only. Visuals come from Grok (Ch. 117). AI copy renders in the live RTL text layer; no text baked into images.

## AI Logic
This chapter *is* the AI logic hub. Never diagnose, never label, never infer protected attributes. Minimal context passed (privacy, Ch. 116); prompts not persisted against identity beyond regeneration. Grok is never used for language; Claude is never used for images.

## Data Stored
Outputs: `Reflection`, `ChallengeLevel.promptHe`, `Pattern.summaryHe`, each with `engineVersion` + `createdAt`. Soft signals only for traits/patterns. Local-first; optional Supabase sync. Distress → `JournalEntry.safetyFlag` handling below.

## Edge Cases
- Offline / timeout / 429: cached or bundled fallback Hebrew copy; loop never blocks.
- Guardrail rejection twice: fallback, log for review, never show raw model text.
- Empty `HumanMap` (first run): universal warm copy assuming nothing.
- `safetyFlag` distress: route to support copy (User Safety), halt challenge escalation, AI does not counsel.
- Hallucinated outcome/score language: caught by Copy Linter, regenerated.

## Build Requirements
- `lib/server/aiClient.ts`: Claude wrapper (retry, timeout, streaming, model pin).
- Guardrail middleware (system prompt + Copy Linter) on every text path; client mirror linter as last defense.
- Fallback Hebrew copy bundle shipped with app.
- Endpoints `/api/reflection`, `/api/challenge`, `/api/pattern` (Ch. 114).
- Effort: M.

## Definition of Done
- [ ] Every AI output passes Tone Guardrails + Copy Linter before display.
- [ ] All user-facing AI copy is Hebrew RTL.
- [ ] Offline/failure paths serve fallback copy, never an error.
- [ ] Never-diagnose enforced in system prompt AND linter (tested).
- [ ] No API key reachable from the client; Grok never generates text.
