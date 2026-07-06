# 34 — Rituals

> A Ritual is the gentle daily rhythm that wraps a Moment — a morning meeting and an evening return — held together by care, never by streaks.

## Purpose
The Ritual turns a Moment from a piece of content into a practice. It gives the day a soft shape: meet the Daily Moment, carry it into the world, return in the evening. The Ritual is what makes MOOD a *once-per-day* companion rather than an app to binge. It must create rhythm without pressure, presence without obligation.

## User Experience
Morning: a quiet, optional notification invites the user to their Daily Moment — "רגע חדש מחכה לך" ("a new moment is waiting for you"). They open, meet the Moment, maybe choose a Challenge, and leave. Evening: a soft return — "איך היה היום?" ("how was today?") — opens the Journal. If they skip, the next day greets them warmly with no scolding: "טוב לראות אותך שוב" ("good to see you again"). The Ritual feels like being gently expected by someone who is never disappointed.

## Game Mechanic
Two ritual beats per day, both optional:
- **Morning beat** — a `DailyMoment` becomes available; state `unseen → seen`.
- **Evening beat** — the Journal layer opens; state `lived/seen → journaled`.

Timing is user-set (default morning 08:00, evening 20:00, local). Missing either beat has **no penalty** — no streak counter, no lost progress, nothing decays as blame. The only continuity shown is the Living Library quietly growing. There is no ritual "score."

## Screens Needed
- Today / Daily Moment
- Evening Check-in
- Settings (ritual times)

## Visual Assets Needed
- Light assets (morning warmth vs. evening calm)
- Moment assets, Texture assets
No text baked into images; ritual copy is a live RTL layer.

## AI Logic
Not primarily AI-driven — ritual timing is deterministic and user-configured. Return copy after a gap is selected from Tone-Guardrail-approved warm templates (never guilt). If a re-engagement line is generated, it passes the Copy Linter, which blocks streak/shame framing.

## Data Stored
- `User.ritual`: `{ morningTime, eveningTime, timezone, notificationsEnabled }`
- `DailyMoment.state` transitions with ISO timestamps
- Last-open timestamp (for warm return, never for penalty)
Copy Hebrew; timestamps ISO 8601. Local-first; Supabase optional sync.

## Edge Cases
- Skipped days: warm re-entry copy, absolutely no streak or guilt.
- Multiple opens per day: the same Moment, no new one forced.
- Notifications off: Ritual still works when the user opens manually.
- Timezone change / travel: recompute beats to local time.
- Offline: ritual beats and state transitions run locally.
- Accessibility: notifications respect OS quiet hours and reduced-motion.

## Build Requirements
Local scheduler for beats, PWA notifications (permission-gated). Zustand ritual slice with BroadcastChannel sync across tabs. Settings UI for times and toggle. Effort: medium.

## Definition of Done
- [ ] Morning and evening beats fire at user-set local times.
- [ ] Skipping any day produces warm copy and zero penalty.
- [ ] No streak counter or guilt framing exists anywhere.
- [ ] Only the Living Library reflects continuity.
- [ ] Hebrew ritual copy renders RTL in light and dark.
