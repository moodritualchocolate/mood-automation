# 29 — Recalibration

> How the Human Map stays honest over time — decaying, correcting, and re-learning so it never traps a person in an old version of themselves.

## Purpose
Recalibration is the maintenance system that keeps the Human Map (Ch. 22) humble and current. People change; the Map must too. It exists so no signal hardens into a permanent label, so users can correct anything, and so a hard season never becomes a life sentence. Recalibration is what makes the Map safe: it can always be softened, decayed, or rewritten.

## User Experience
Recalibration is mostly invisible and always gentle. Occasionally MOOD offers a light re-check via a few Visual Choices (Ch. 21): "בא לך שנכיר אותך מחדש קצת?" ("Want us to get to know you a little again?") — always optional. Anywhere a recognition appears, the user can say "זה כבר לא אני" ("that's not me anymore") and the signal softens immediately. MOOD frames change as natural: "אנשים משתנים. גם המפה שלך." ("People change. So does your map.") No penalty, no "you regressed."

## Game Mechanic
- **Decay:** on each session, unreinforced signals drift toward 0.5 (neutral) at each Trait's `decayRate`; confidence also decays.
- **Correction:** user rejection applies an immediate soften + confidence drop, logged as a `correction` in evidence.
- **Reinforcement:** fresh Attempts/JournalEntries nudge signals (bounded ±0.1) and refresh `updatedAt`.
- **Re-seed:** optional light Discovery re-run *merges* into existing signals (weighted by recency), never overwrites wholesale.
- **Conflict handling:** contradictory evidence lowers confidence rather than forcing a winner.

## Screens Needed
- Discovery Flow (optional re-run)
- Patterns (surfaces gentle change over time)
- Settings / Privacy (view, correct, export, reset the Map)

## Visual Assets Needed
- Reuses Discovery imagery (Masterpiece, Moment, People, Light, Texture) for re-checks — textless.
- No dedicated new assets.

## AI Logic
Pattern Recognition (Claude + heuristics) may notice change and phrase it kindly ("lately you've been leaning toward…"), always tentative. Guardrails: never frame change as regression or improvement toward a "correct" self; never diagnose a shift. Copy Linter blocks progress/regression scoring language. The re-seed merge is deterministic (not AI), keeping corrections auditable.

## Data Stored
- Updates to `HumanMap.Trait[]` (signal, confidence, `updatedAt`).
- `corrections[]` — `{ traitId, from, to, reason: "user_reject" | "decay" | "reseed", at }` (ISO 8601).
- `DiscoverySession` for any re-run.
- Local-first (autosave, cross-tab via BroadcastChannel); optional Supabase sync; full user export/reset honored locally and in cloud.

## Edge Cases
- Long absence → heavier decay so the Map greets a possibly-changed person humbly.
- Rapid contradictory signals → widen uncertainty, avoid whiplash in offered content.
- User resets the Map → wipe signals to neutral locally and in Supabase; keep no shadow copy.
- Offline → decay/corrections queue and sync on reconnect.
- Never surface recalibration as "you failed to maintain progress" (no streaks, no scores).
- RTL long-text; correction UI accessible.

## Build Requirements
- `applyDecay()` and `applyCorrection()` in the `humanMap` slice; run decay on session focus.
- Deterministic `reseedMerge()` combining old signals with a new `DiscoverySession`.
- Correction logging + Settings UI for view/correct/export/reset with Supabase row-level security.
- Effort: ~4 dev days.

## Definition of Done
- [ ] Unreinforced signals decay toward neutral each session; confidence decays too.
- [ ] Users can correct any signal, softening it immediately with a logged reason.
- [ ] Re-seeding merges rather than overwrites, and is deterministic/auditable.
- [ ] No signal can become a permanent label; reset fully clears the Map everywhere.
- [ ] Change is framed as natural, never as regression or failure; copy passes the Copy Linter.
