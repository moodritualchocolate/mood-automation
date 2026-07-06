# 60 — Personalization

> Personalization tunes tone, pacing, and challenge readiness to each person — softly and reversibly — so MOOD feels made for them without ever boxing them in.

## Purpose
Two people should never feel like they're using the same generic app, yet no one should feel typed or predicted. This chapter defines how MOOD adapts — reflection warmth, challenge stretch, moment themes, pacing — from the evolving `HumanMap` (see Ch. on Human Map). Personalization deepens the daily feeling of being noticed while staying non-diagnostic and always reversible.

## User Experience
Over time, a cautious person receives gentler Easy challenges and softer invitations; someone hungry for stretch sees braver options surface more readily. Themes drift toward what resonates. The user can always adjust in Settings: pacing, intensity, and what MOOD may remember. Example control label: "כמה אומץ מרגיש נכון לך עכשיו?" ("how much courage feels right for you now?"). Nothing is locked; the person stays in charge.

## Game Mechanic
Personalization reads soft `Trait` signals and recent `Attempt` behavior to weight generation: challenge stretch, reflection tone, MomentTemplate selection, and pacing (how often challenges appear). All weights are soft, decaying, and adjustable. It never hardens into a "type." User overrides always win over inferred signals.

## Screens Needed
- Settings
- Today / Daily Moment
- Challenge Selection
- Discovery Flow (initial soft calibration)

## Visual Assets Needed
- Moment assets and Light assets selected by theme resonance
No text baked into images; all copy renders in the live RTL text layer.

## AI Logic
Personalization is mostly a deterministic weighting layer feeding the **Claude API** engines (`claude-opus-4-8`) via prompt parameters (tone, stretch, theme). It never produces a label or category. Guardrails: never diagnose (Ch. 55); inferred signals are tendencies, not identities; user settings override inference. Passes Tone Guardrails (Ch. 62) + Copy Linter (Ch. 63).

## Data Stored
- `Trait` soft signals (0–1, confidence, decay) — the personalization substrate.
- `PersonalizationPrefs` { pacing, intensity, memoryOptIn, updatedAt (ISO 8601) } — explicit user controls.
Local-first source of truth; optional Supabase sync.

## Edge Cases
- First run: neutral defaults; no assumptions before Discovery.
- Offline: use last-known local weights.
- Conflicting signal vs. explicit setting: the explicit setting wins.
- Rapid mood change: decay lets recent behavior gently outweigh old signals.
- Reset request: user can wipe personalization from Settings (Ch. 61).
- Accessibility: pacing/intensity controls fully keyboard- and screen-reader-operable, RTL.

## Build Requirements
- Weighting module translating `Trait` + `PersonalizationPrefs` into engine prompt params.
- Settings UI for pacing, intensity, memory opt-in, and reset.
- Decay scheduler for soft signals.
- Effort: medium.

## Definition of Done
- [ ] Reflection tone and challenge stretch adapt from soft signals.
- [ ] User settings always override inferred signals.
- [ ] No personalization output is ever a label or type.
- [ ] Reset and memory opt-out fully wipe personalization data.
- [ ] Controls are RTL and accessible; defaults are neutral on first run.
