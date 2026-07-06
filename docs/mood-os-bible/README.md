# MOOD OS — The Complete Game Bible

> **MOOD is a Human Experience Game.**
> The user opens MOOD once per day to meet one small human moment, understand
> something about themselves, choose a real-world challenge, live it, and slowly
> build a living library of their life.

**Core promise:** every day MOOD helps the user feel —
> *"Someone noticed something small about my life that I never knew how to say."*

This folder is the single source of truth for building MOOD. It is written so a
full studio team — product, design, art, AI, and engineering — can build the
entire product from these files alone. Read the [Table of Contents](./TABLE_OF_CONTENTS.md)
for the full chapter map.

---

## What MOOD is (and is not)

MOOD is **not** a card game, **not** a wellness app, **not** a journal app, and
**not** social media. It is a new category: a daily, single-player-first game of
being human, with an anonymous layer of shared belonging (the **Ripple**).

- **One Daily Moment** — timeless artwork + a tiny title + a living reflection,
  plus an optional invitation and an optional challenge.
- **Three challenge levels** — Easy / Medium / Brave. **Success = trying**, never
  the outcome. There is no "you failed."
- **Evening Journal** — the user returns to record what happened and how it felt.
- **Living Library** — every Moment becomes part of a personal archive.
- **Pattern Engine** — gently reflects patterns over time, never diagnosing.
- **Ripple** — anonymous shared humanity. No likes, no profiles, no comparison.

---

## The Core Loop (memorize this)

1. **Discovery** — learn the user through playful choices, not questionnaires.
2. **Human Map** — an evolving, non-diagnostic map of the person.
3. **Daily Ritual** — one Daily Moment per day.
4. **Moment** — artwork + title + reflection + optional invitation + challenge.
5. **Challenge** — Easy / Medium / Brave. Success is the attempt.
6. **Live** — the user leaves the app and lives it in the real world.
7. **Evening Journal** — tried / didn't try, what happened, how it felt, learned.
8. **Living Library** — the Moment joins the personal archive.
9. **Pattern Engine** — gentle, non-judgmental reflection of patterns.
10. **Ripple / Shared Humanity** — anonymous belonging.

Every chapter in this Bible connects back to this loop.

---

## Non-Negotiable Product Rules

| Rule | Meaning |
|------|---------|
| **Hebrew, RTL** | The product UI is Hebrew, right-to-left. The Bible is written in English; all *user-facing copy examples* are shown in Hebrew. |
| **No text in images** | Grok-generated art carries **no text of any kind** (never Hebrew). All text is a live app layer over negative space. |
| **No "cards"** | Never say "cards" in user-facing copy. Use: **Moment, Daily Moment, Living Library, Journal, Ripple, Challenge**. |
| **Never judge / diagnose / punish** | No clinical labels, no scores, no shame. |
| **No streaks, no guilt, no "you failed"** | Skipping a day costs nothing. |
| **Progress ≠ points** | Progress is library growth, reflections, patterns, emotional chapters, rare moments, and courage history. |

---

## How the Bible is organized

Twelve volumes, 129 numbered chapters, plus these top-level guides:

- **[README.md](./README.md)** — this file.
- **[TABLE_OF_CONTENTS.md](./TABLE_OF_CONTENTS.md)** — every chapter, linked.
- **[CODEX_BUILD_PLAN.md](./CODEX_BUILD_PLAN.md)** — build order + task plan for the engineering agent (Codex).
- **[GROK_ASSET_BRIEF.md](./GROK_ASSET_BRIEF.md)** — the full visual asset brief for Grok.
- **[CLAUDE_CREATIVE_DIRECTOR.md](./CLAUDE_CREATIVE_DIRECTOR.md)** — how Claude acts as the AI creative director (copy, reflections, challenges, guardrails).

| Vol | Title | Chapters |
|-----|-------|----------|
| 01 | Founder Master Prompt | 01–05 |
| 02 | Game Design Bible | 06–18 |
| 03 | Discovery & Human Map | 19–29 |
| 04 | Moments | 30–40 |
| 05 | Challenge Engine | 41–53 |
| 06 | AI & Psychology | 54–64 |
| 07 | Visual Language | 65–75 |
| 08 | Visual Asset Pipeline for Grok | 76–87 |
| 09 | UX & Screens | 88–100 |
| 10 | Social & Virality | 101–109 |
| 11 | Technical Bible | 110–120 |
| 12 | Production Roadmap | 121–129 |

---

## Every chapter uses the same structure

Purpose · User Experience · Game Mechanic · Screens Needed · Visual Assets Needed
· AI Logic · Data Stored · Edge Cases · Build Requirements · Definition of Done.

---

## Tech alignment (same studio, same stack)

Next.js 14 (App Router) + TypeScript + Tailwind (mobile-first, RTL, light/dark) ·
Zustand (autosave, realtime across tabs) · **local-first** with optional Supabase
(Postgres + Auth + Realtime + Storage) · **Claude API** for reflections, challenges
and patterns · **Grok** for visual assets · PWA. See Volume 11.

---

## Start here

1. Read Volume 01 (Vision) → Volume 02 (Game Design).
2. Skim Volume 09 (Screens) for the shape of the app.
3. Engineers: go to **CODEX_BUILD_PLAN.md** and Volume 11–12.
4. Artists: go to **GROK_ASSET_BRIEF.md** and Volumes 07–08.
5. AI/copy: go to **CLAUDE_CREATIVE_DIRECTOR.md** and Volume 06.
