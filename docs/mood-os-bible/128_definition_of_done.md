# 128 — Definition of Done (Product)

> A single, testable product-level bar that MOOD as a whole must clear before it is allowed to ship — not per-feature checklists, but the standard for the finished experience.

## Purpose
Each chapter carries its own Definition of Done; this chapter defines when the *product* is done. It is the release gate that aggregates tone, loop integrity, privacy, safety, and accessibility into one pass/fail standard, run alongside the Ch. 129 Final Audit. If any item here fails, MOOD does not ship, regardless of feature completeness.

## User Experience
Invisible to users — but everything they feel depends on it. The product-level DoD guarantees that whatever screen a person lands on, the experience is calm, in correct Hebrew RTL, never judgmental, and works offline. A tester should be able to live a full day of MOOD, including "didn't try," and never once feel scored, shamed, or exposed.

## Game Mechanic
The product is "done" only when every phase (Ch. 122–127) has passed its own DoD **and** the whole product clears the cross-cutting bar below. It is a binary gate: all items pass or the release is blocked. Ownership: the program lead runs it; the Final Audit (Ch. 129) verifies it independently.

## Screens Needed
- All Volume 09 screens must exist and pass: Splash, Onboarding, Discovery Flow, Today / Daily Moment, Challenge Selection, Evening Check-in, Living Library, Moment Detail, Patterns, Shared Humanity, Settings, Privacy, Accessibility.

## Visual Assets Needed
- Every asset category (Ch. 07/08) required for shipped screens is present and passes the no-baked-text rule: Moment, Masterpiece, People, Home, Object, Light, Texture, Social/Share, Video keyframes.

## AI Logic
Every AI surface (Reflection, Challenge, Pattern, Memory — Ch. 06 / Ch. 54) must pass Tone Guardrails and the Copy Linter, with working offline fallbacks. Never-diagnose and success-equals-attempt rules must hold on every generated output sampled in review.

## Data Stored
- Every shared entity (`User`, `HumanMap`, `Trait`, `Moment`, `DailyMoment`, `Challenge`, `ChallengeLevel`, `Attempt`, `JournalEntry`, `LibraryItem`, `Pattern`, `RareMoment`, `Chapter`, `RippleStat`, `Asset`, `Reflection`) persists local-first, syncs optionally, and survives offline/reopen.

## Edge Cases
The DoD explicitly covers: first run, offline, skipped days (no penalty), abandoned/"didn't try" challenges, empty states, safety-flagged content, long RTL text, and accessibility — each verified as a passing case, not an afterthought.

## Build Requirements
A written, versioned product-DoD checklist owned by the program lead, run before every release and re-run by the Final Audit. No new build; it is process.

## Definition of Done (the product-level checklist)
- [ ] **Core loop:** a full turn (Discovery → Moment → Challenge → Live → Journal → Library → Pattern → Ripple) completes end to end.
- [ ] **Local-first:** the entire loop works offline; no feature hard-requires an account.
- [ ] **Tone:** no banned concepts anywhere — no streak, score, XP, level, leaderboard, "fail," "should"-shame, diagnosis, or label. The word "cards" never appears in user-facing copy.
- [ ] **Success framing:** every outcome, including "didn't try," is unpunished and framed around the attempt.
- [ ] **Language:** all user-facing copy is Hebrew RTL, correct in light and dark; the Bible itself remains English.
- [ ] **No baked-in image text:** every asset is text-free; all copy is a live text layer.
- [ ] **Safety:** generated challenges pass the safety filter; sensitive content handled gently.
- [ ] **Privacy:** local-first data ownership; Ripple is anonymous; delete/export honored.
- [ ] **Accessibility:** screen-reader, contrast, motion-reduction, and keyboard support verified.
- [ ] **Coverage:** every Volume 09 screen exists and functions; every phase DoD (Ch. 122–127) passes.
- [ ] **Audit:** Ch. 129 Final Audit signed off with zero open blockers.
