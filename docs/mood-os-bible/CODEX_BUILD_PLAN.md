# CODEX_BUILD_PLAN — Engineering Build Order for MOOD

> This is the ordered build plan for the engineering agent (**Codex**) and the
> studio's developers. It turns the Bible into a sequenced set of buildable
> tasks. It does **not** replace the chapters — each task points to the chapters
> that specify it. Build in the order below; each phase has entry/exit criteria.

**Do not build ahead of the spec.** If a chapter and this plan disagree, the
chapter wins and this plan is corrected.

---

## Stack (fixed — see Volume 11)

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**, mobile-first,
  **RTL Hebrew** default, light/dark, PWA.
- **Zustand** for state: autosave + realtime across tabs (BroadcastChannel).
- **Local-first**: fully functional offline via local storage; **Supabase**
  (Postgres + Auth + Realtime + Storage) is the optional cloud-sync layer.
- **Claude API** (Anthropic) for Reflection / Challenge / Pattern generation.
- **Grok** for all visual assets (offline pipeline, not runtime).

---

## Global Build Rules

1. **Data layer first, UI second.** All screens read/write through one data
   layer (`lib/store` ↔ `lib/supabase`) so the UI never knows the source. (Ch.110, 115)
2. **Tone is enforced in code.** The **Copy Linter** (Ch. 63) runs in CI and
   blocks banned tokens (`streak`, `fail`, `failed`, `score`, `points`, `xp`,
   `level`, `leaderboard`, `diagnose`, …). No streak/score fields exist in the
   schema (Ch. 113).
3. **Safety is a gate, not a feature.** Challenge Safety (Ch. 52) and User Safety
   (Ch. 61) filters must exist before any generated challenge is shown.
4. **No image ships with text.** Asset ingest validates against the Quality Gate
   (Ch. 87).
5. Every merged task must satisfy the chapter's **Definition of Done**.

---

## Build Order

### Phase 0 — Foundations (scaffold)
- Init Next.js 14 + TS + Tailwind + RTL + light/dark + PWA. (Ch. 111)
- Zustand store, autosave, BroadcastChannel sync, local-first persistence. (Ch. 115)
- Data model types for the full schema (Ch. 113) — even if only some are used yet.
- Copy Linter as a lint rule + CI check. (Ch. 63)
- App shell, routing, splash. (Ch. 88, 110)
- **Exit:** app boots offline, RTL, themable, linter green, empty screens route.

### Phase 1 — One Perfect Moment (Ch. 122)
- Today / Daily Moment screen with a single hand-crafted `MomentTemplate`
  (artwork + Hebrew title + reflection). (Ch. 91, 30–32)
- Challenge Selection: one Easy/Medium/Brave ladder, success = trying. (Ch. 92, 11, 42, 53)
- Evening Check-in journal writing a `JournalEntry`. (Ch. 93, 12)
- Moment saved to Living Library (single item). (Ch. 13, 94)
- **No accounts required** — local-first only.
- **Exit:** a user can live the full loop for one Moment, offline, with zero scores/streaks.

### Phase 2 — Discovery Engine (Ch. 123)
- Onboarding + Discovery Flow: playful visual choices, not questionnaires. (Ch. 89, 90, 19–21)
- Build the `HumanMap` from soft `Trait` signals (0–1, confidence, decay). (Ch. 22–29)
- Adaptive profile + recalibration. (Ch. 28, 29)
- **Exit:** Human Map exists and influences Moment/challenge selection; never labels the user.

### Phase 3 — Challenge Engine (Ch. 124)
- Challenge Generator via Claude, gated by Safety filters. (Ch. 57, 52, 61)
- Full difficulty ladders across categories (social, confidence, kindness,
  boundary, creativity). (Ch. 43–51)
- Attempt tracking (`Attempt`), success-as-trying language everywhere. (Ch. 53)
- Reflection Generator for living reflections. (Ch. 56, 64)
- **Exit:** personalized, safe challenges + Hebrew reflections generate and pass Tone Guardrails.

### Phase 4 — Living Library & Patterns (Ch. 125)
- Full Living Library (archive, Moment Detail). (Ch. 13, 94, 95)
- Progress without scores: chapters, courage history, rare moments. (Ch. 14, 15)
- Weekly Story, Monthly Chapter, Year Review. (Ch. 16–18)
- Pattern Engine + Patterns screen (gentle, non-diagnostic). (Ch. 58, 96)
- **Exit:** the archive tells the user's story with zero metrics/gamification.

### Phase 5 — Social Ripple (Ch. 126)
- Anonymous Shared Humanity (`RippleStat`) + Shared Humanity screen. (Ch. 97, 103, 108)
- Share images (no text baked; app renders overlay). (Ch. 102, 85)
- Friend Challenges, Group Moments, Weekly Shared Story, Pay It Forward. (Ch. 104–107)
- No likes / profiles / comparison / dark patterns. (Ch. 101, 109)
- **Exit:** belonging without vanity metrics; all anti-dark-pattern checks pass.

### Phase 6 — Full Release (Ch. 127)
- Supabase cloud sync, Auth, RLS, Storage, Asset Management. (Ch. 112–117)
- AI Integration hardening, rate limits, caching, safety review. (Ch. 118, 61)
- Accessibility, Privacy screen, Settings. (Ch. 98–100, 116)
- Testing + Release pipeline. (Ch. 119, 120)
- **Exit:** passes the Final Audit (Ch. 129) and product Definition of Done (Ch. 128).

---

## Task Checklist Template (use per chapter)

```
- [ ] Read chapter NN and its cross-refs
- [ ] Implement data (schema/store) per Ch.113/115
- [ ] Implement UI per Volume 09 screen chapter
- [ ] Wire AI per Volume 06 (guardrails + linter)
- [ ] Bind assets per Volume 08 (quality gate)
- [ ] Handle listed Edge Cases
- [ ] Meet the chapter's Definition of Done
- [ ] Copy Linter + Tone Guardrails green in CI
```
