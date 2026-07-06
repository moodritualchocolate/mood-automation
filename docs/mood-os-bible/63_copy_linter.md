# 63 — Copy Linter

> The Copy Linter is the automated gate that blocks banned words and shame framings before any copy reaches a user — the deterministic backstop behind Tone Guardrails.

## Purpose
Tone is judgment; token safety must be certain. The Copy Linter is a deterministic filter that guarantees forbidden vocabulary and framings can never ship, regardless of what any model generates. It is the last, non-negotiable check in the copy pipeline (see Ch. 62 for voice, Ch. 55 for never-diagnose). If the linter fails a string, that string does not display — period.

## User Experience
Invisible when working: the user simply never encounters gamified, clinical, or shaming language. There is no "streak lost," no "score," no "you failed," no diagnosis. Every word they read has passed the gate.

## Game Mechanic
Runs on every AI-generated and hand-authored string before display and before storage as user-facing copy. On a match, the string is rejected and the engine either regenerates (up to N attempts) or serves a vetted fallback. The linter checks both an exact/normalized token blocklist and pattern rules (regex + phrase matching, RTL/Hebrew-aware).

### Banned tokens and patterns (non-exhaustive, enforced)
Gamification: `streak`, `fail`, `failed`, `failure`, `score`, `points`, `XP`, `level`, `levels`, `leaderboard`, `rank`, `win`, `lose`, `badge`, `combo`, and Hebrew equivalents (e.g. רצף, ניקוד, נקודות, ניצחת, הפסדת).
Clinical/labeling: `diagnose`, `diagnosis`, `disorder`, `symptom`, `condition`, `syndrome`, and disorder-as-label uses (e.g. "your anxiety," "you're depressed") and Hebrew equivalents (אבחון, הפרעה, סימפטום, תסמונת).
Coercion/shame: `you should`, `you must`, `you have to`, `you failed`, `don't be lazy`, guilt/shame framings ("you missed again," "why didn't you"), and Hebrew equivalents (אתה חייב, אתה צריך, נכשלת, למה לא).
The word `card`/`cards` (forbidden per product decisions) in user-facing copy.
Pattern rules also flag: imperative "must/should" constructions, outcome-praise ("well done, you succeeded"), and streak/counter phrasing.

## Screens Needed
Applies to all copy surfaces (Today, Challenge Selection, Evening Check-in, Patterns, Living Library). Not a user-visible screen itself.

## Visual Assets Needed
None.

## AI Logic
Not AI-driven itself — it is a deterministic enforcement layer over all **Claude API** (`claude-opus-4-8`) outputs. It cannot be bypassed by any engine. When it rejects copy, it triggers regeneration with a stricter Ch. 64 prompt or a fallback. Shares its blocklist with Ch. 55 (clinical) and Ch. 62 (tone).

## Data Stored
- `LintResult` { copyId, blockedTokens[], matchedPatterns[], action (regenerate|fallback|pass), lintedAt (ISO 8601) }
- Versioned blocklist + pattern rules (config, not user data).
Local-first audit; optional Supabase sync for QA.

## Edge Cases
- False positive (legitimate word): maintain an allowlist of safe contexts; err toward blocking.
- Hebrew morphology/RTL: normalize niqqud, prefixes, and inflections before matching.
- Regeneration loop: cap attempts; fall back after N to guarantee delivery.
- New banned term discovered: hot-update the versioned blocklist.
- Offline: linter and blocklist run fully on-device.

## Build Requirements
- Deterministic linter module (normalized token match + regex/phrase patterns), Hebrew- and RTL-aware.
- Versioned, hot-updatable blocklist shared with Ch. 55/62.
- Pipeline hook running before every display and copy store.
- Effort: medium; test coverage across Hebrew inflections.

## Definition of Done
- [ ] Every string passes the linter before display or storage.
- [ ] All listed banned tokens and patterns (EN + Hebrew) are blocked.
- [ ] Rejections regenerate or fall back — copy is always delivered clean.
- [ ] Blocklist is versioned, hot-updatable, and shared with Ch. 55/62.
- [ ] Runs on-device/offline with Hebrew-aware normalization.
