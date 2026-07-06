# 11 — Challenge System

> Three real-world invitations — Easy, Medium, Brave — where success means trying, never the outcome.

## Purpose
The Challenge System is **station 5** of the Core Loop and the bridge from screen to life. It turns a Moment's insight into a small, doable act in the real world. It exists to grow courage gently, one attempt at a time, and it is the reason MOOD asks the user to *leave the app and live* (station 6). Its defining rule: **success = trying, not achieving.**

## User Experience
On **Challenge Selection** the user sees the same Challenge offered at three intensities. Example for a "reach out" Moment:
- **Easy (קל):** "שלח/י הודעה קצרה לאדם אחד" ("send one short message to someone").
- **Medium (בינוני):** "התקשר/י לשיחה של דקה" ("make a one-minute call").
- **Brave (אמיץ):** "הצע/י להיפגש פנים אל פנים" ("suggest meeting in person").
The user picks the level that fits *today*, or declines warmly. Copy frames it: "לא צריך להצליח, צריך רק לנסות" ("you don't need to succeed, only to try"). Then the app steps back — "נתראה בערב" ("see you this evening").

## Game Mechanic
- **Structure:** one `Challenge` per Moment with three `ChallengeLevel`s (easy|medium|brave).
- **States:** `offered → chosen(level) → live → resolved(tried|not_tried)`. Choosing creates an `Attempt`.
- **Success rule:** resolution is binary tried/not-tried, recorded at Evening Journal (station 7). Outcome quality is never asked or scored.
- **Readiness:** level offering is weighted by the "challenge readiness" and "comfort zone" `Trait` signals, but all three levels are always selectable — the app suggests, never restricts.
- **Escalation:** brave attempts gently, slowly raise readiness signal; declines never lower it punitively.

## Screens Needed
- Today / Daily Moment
- Challenge Selection
- Evening Check-in (resolution)

## Visual Assets Needed
- Moment assets, People assets, Object assets, Light assets (level imagery, warm and inviting). No text baked in; level labels are live RTL text.

## AI Logic
- **Challenge Generator** (Claude) produces the three real-world levels in Hebrew from: Moment theme, `HumanMap` readiness signals, and `Memory Engine` history (avoid repeats, respect prior declines).
- Guardrails: challenges must be safe, legal, low-cost, non-humiliating, and never coercive; nothing that risks harm. Never diagnose. All output passes Tone Guardrails + **Copy Linter** and a safety filter.

## Data Stored
- `Challenge` (id, momentId, themeHe, generatedAt ISO 8601).
- `ChallengeLevel[]` (level, textHe).
- `Attempt` (id, userId, challengeId, level, status: pending|tried|not_tried, chosenAt, resolvedAt).
Local-first; optional Supabase sync. Copy Hebrew.

## Edge Cases
- **Declined:** valid; no penalty, no "you skipped."
- **Chosen but unresolved by night:** `Attempt` stays `pending`, ages to `not_tried` with kind framing — never "you failed."
- **Safety-sensitive theme:** safety filter downgrades/omits Brave, offers support copy.
- **Offline:** generation falls back to template's pre-authored Hebrew level scaffolds.
- **RTL/long-text:** level cards reflow; no truncation of the action.
- **Accessibility:** clear focus order, reduced-motion.

## Build Requirements
- `ChallengeSelection` component (three-level layout, decline affordance).
- `/api/challenge` (generate + safety + linter) with offline scaffold fallback.
- `Attempt` lifecycle in Zustand; resolution wired to Evening Journal.
- Effort: L.

## Definition of Done
- [ ] Every Challenge offers exactly three levels; all always selectable.
- [ ] Choosing creates an `Attempt`; resolution is tried/not_tried only.
- [ ] No outcome, quality, or score is ever requested.
- [ ] Decline and unresolved never produce shame/fail copy.
- [ ] Safety filter blocks unsafe/coercive challenges.
- [ ] Offline scaffolds work; RTL + accessibility verified.
