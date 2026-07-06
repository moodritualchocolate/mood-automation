# 03 — Category Definition

> MOOD defines a new category — the Human Experience Game — a once-a-day ritual that turns self-noticing into a lived real-world act and a growing library of a life.

## Purpose
A product without a category is measured by the wrong yardstick. This chapter names MOOD's category — the **Human Experience Game** — and states its defining criteria so investors, users, and the studio judge it correctly: not by engagement minutes or mood scores, but by moments noticed and small acts of courage lived. It draws the category's borders and its unique unit of value.

## User Experience
The user experiences MOOD as a game whose board is their own life. Unlike entertainment games, the "play" happens after they close the app — in the real world. The felt category is "a game that gently plays with who I am." A first-time user's onboarding line: "זה משחק על החיים שלך — לא על מסך" ("this is a game about your life — not about a screen"). The unit the user collects is not points but noticed Moments and lived Attempts, gathered in the Living Library.

## Game Mechanic
The category is defined by five rules that separate it from adjacent products:
1. One session per day (rhythm, not retention farming).
2. Play completes in the real world (the Challenge is lived, not tapped).
3. Success = attempt, measured across three `ChallengeLevel`s (easy | medium | brave).
4. The scoreboard is a library and a Human Map, not a number.
5. Belonging is anonymous and non-comparative (Ripple).
The category's core unit of value is the **lived Attempt** attached to a **Moment**.

## Screens Needed
- Onboarding (introduces the category to a new user)
- Today / Daily Moment (the once-a-day ritual)
- Challenge Selection (the real-world play)
- Living Library (the category's true scoreboard)
- Shared Humanity (anonymous belonging)

## Visual Assets Needed
- Masterpiece assets that signal "art and meaning," positioning MOOD outside game/app visual clichés.
- Moment assets that make each day feel like a distinct human scene.
- Light and Texture assets for warmth and timelessness.
Grok-generated, no baked text, painterly-photographic, human intimacy.

## AI Logic
The category is upheld by AI behavior, not just UI: the Challenge Generator must always produce real-world, offline-livable challenges (never in-app tasks), and the Reflection Generator writes about the person, not a metric. Pattern Recognition frames growth as a story ("סיפור", chapters), never a chart of scores. Guardrails ensure no output reframes MOOD as a wellness tracker or game with points.

## Data Stored
Category-defining entities: `Moment`, `DailyMoment`, `Challenge`, `ChallengeLevel`, `Attempt`, `LibraryItem`, `HumanMap`, `Chapter` (weekly/monthly/year). The `Attempt` entity is the category's atomic unit: fields for `momentId`, `chosenLevel`, `tried` (bool), `feltNote` (Hebrew), timestamp ISO 8601. Local-first source of truth; optional Supabase sync.

## Edge Cases
- First run with no Library: category still legible via onboarding framing.
- User treats it like a to-do app: challenges must resist gamified completion pressure (no checkmark reward loop).
- Offline: real-world play is inherently offline-friendly by design.
- Long Hebrew RTL onboarding copy must not clip.
- Accessibility: category framing conveyed in screen-reader text.

## Build Requirements
Onboarding flow components, `Attempt` data model, Library aggregation. Category-consistency lint hooks (challenges must be tagged real-world). Moderate effort, concentrated in onboarding and the Attempt model.

## Definition of Done
- [ ] Onboarding communicates "Human Experience Game" without using banned framings.
- [ ] Every generated Challenge is real-world and offline-livable.
- [ ] `Attempt` records attempt (not outcome) at chosen level.
- [ ] Living Library functions as the only scoreboard.
- [ ] Category messaging verified in Hebrew RTL, light and dark.
