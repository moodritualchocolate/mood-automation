# 127 — Phase 6 — Full Release

> Phase 6 completes the experience — RareMoments, weekly/monthly/year Chapters, full settings, and release hardening — then ships MOOD to the public.

## Purpose
Phase 6 takes the working loop from Phases 1–5 and finishes it into a product people can live with for months: the long-horizon emotional payoffs (RareMoments and Chapters), the full settings/privacy/accessibility surface, and the hardening (performance, PWA, error states) that a public launch demands. It also runs the Ch. 128 Definition of Done and Ch. 129 Final Audit as release gates.

## User Experience
The user now occasionally meets a RareMoment — a cornerstone Masterpiece artwork that marks something meaningful — and periodically receives a Chapter: a gentle weekly, monthly, and yearly reflection woven from their own history. Example: "הפרק שלך מהחודש הזה" ("your chapter from this month"). Settings, Privacy, and Accessibility are fully available. The experience feels complete, calm, and permanent.

## Game Mechanic
**Scope IN:** `RareMoment`s, `Chapter`s (weekly/monthly/year), complete Settings/Privacy/Accessibility, video keyframes for cornerstone Moments, and full release hardening.
**Scope OUT:** nothing new deferred — anything cut here is explicitly logged as post-launch backlog. This phase **implements** the remaining core-loop depth (RareMoments and Chapters extend steps 8–9) and completes every screen in Volume 09. It builds on Phases 1–5 (Ch. 122–126) end to end.
**Entry criteria:** Phase 5 exit met; full loop stable across ≥30 days of test data.
**Exit criteria:** Ch. 128 Definition of Done fully passes and Ch. 129 Final Audit is signed off with no open blockers.
**Demo goal:** a months-long test account experiences a RareMoment and a monthly Chapter that feel earned, moving, and true — then the release gate passes clean.

## Screens Needed
- Today / Daily Moment
- Living Library, Moment Detail, Patterns
- Shared Humanity
- Settings, Privacy, Accessibility
- (RareMoment and Chapter surfaces layered onto the above)

## Visual Assets Needed
- Masterpiece assets (RareMoments)
- Video keyframes (cornerstone Moments)
- Moment, Light, Texture, Social/Share assets
Grok-generated, painterly-photographic, warm. NO text baked into any image; all titles, Chapters, and captions are live RTL layers.

## AI Logic
Reflection, Challenge, and Pattern engines (Claude, Ch. 06 / Ch. 54) run at full capability with Memory Engine context. RareMoment triggering uses heuristics + gentle AI judgment on meaningful history; Chapters are Claude-composed reflections over `Pattern`/`JournalEntry` data. Guardrails unchanged: never diagnose, never label, success = attempt. All copy passes Tone Guardrails + Copy Linter.

## Data Stored
- `RareMoment` (trigger, Masterpiece `Asset`, timestamp)
- `Chapter` (period weekly|monthly|year, Hebrew reflection, sourceRefs)
- Full Settings/Privacy/Accessibility preferences
Local-first source of truth; optional Supabase sync. Hebrew strings; ISO 8601.

## Edge Cases
- Sparse history: Chapters degrade gracefully; RareMoments stay rare, never forced.
- Offline: all stored Chapters/RareMoments render locally.
- Skipped periods: no penalty; a Chapter simply covers what happened.
- Accessibility: full screen-reader, contrast, and motion-reduction support.
- Long RTL Chapters: paginate/scroll cleanly, never clip.
- Data export/delete: honored fully for release privacy compliance.

## Build Requirements
Adds `RareMomentEngine`, `ChapterEngine`, video keyframe rendering, and complete Settings/Privacy/Accessibility to the Phase 5 base. Performance/PWA/offline hardening, error boundaries, release monitoring. Next.js 14, TypeScript, Tailwind, RTL, PWA, local-first + optional Supabase. Effort: large.

## Definition of Done
- [ ] RareMoments and weekly/monthly/year Chapters ship and feel earned.
- [ ] All Volume 09 screens complete, including Settings/Privacy/Accessibility.
- [ ] Full accessibility and offline behavior verified.
- [ ] Ch. 128 Definition of Done passes; Ch. 129 Final Audit signed off.
- [ ] No banned concepts anywhere; Copy Linter passes on all copy.
- [ ] Hebrew RTL correct across every screen in light and dark.
