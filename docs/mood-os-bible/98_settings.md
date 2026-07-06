# 98 — Settings

> The calm control room: appearance, the single daily reminder, language, optional cloud sync, and the doorway to Privacy and Accessibility.

## Purpose
Settings exists so the user owns how MOOD fits into their life without ever feeling managed by it. It gathers the few real controls — theme, one gentle daily reminder, language/RTL, optional account + sync — and links to Privacy (Ch. 99) and Accessibility (Ch. 100). It is deliberately small; MOOD is a ritual, not a dashboard.

## User Experience
A quiet grouped list in Hebrew. Sections: "מראה" ("appearance": light / dark / system), "התזכורת היומית" ("the daily reminder": one time, or off — never multiple nags), "שפה" ("language", Hebrew RTL default), "סנכרון וענן" ("sync & cloud": optional sign-in), "פרטיות" (link to Ch. 99), "נגישות" (link to Ch. 100). A calm footer: "MOOD שלך. אתה מחליט הכול." ("your MOOD. you decide everything."). Toggles respond softly. No notification spam options, no upsell walls, no analytics-consent dark patterns. The feeling target: *I'm in gentle control.*

## Game Mechanic
Pure configuration surface — no play mechanic. Each control writes a `UserSetting`. The daily reminder schedules at most one local notification/day. States are simple toggles/selects with immediate autosave. No gamified settings, no score, no streak.

## Screens Needed
- Settings
- Privacy
- Accessibility
- Onboarding (optional sign-in entry)

## Visual Assets Needed
- Minimal; Texture/Light assets for section warmth only. No baked text. Primarily system UI, not artwork.

## AI Logic
Not AI-driven — Settings is deterministic configuration. (Reminder timing may later be gently suggested by Pattern Recognition, but the user always decides; any suggestion copy passes the Copy Linter.)

## Data Stored
- `User` (auth optional), `UserSetting` fields: theme, reminderTime|off, language, syncEnabled, reducedMotion, textScale, contrastMode (see Ch. 100).
- Local-first source of truth; optional Supabase sync when signed in. Timestamps ISO 8601.

## Edge Cases
- No account: everything works locally; sync section explains it's optional.
- Sign-out: local data remains; clarify nothing is deleted.
- Reminder permission denied by OS: show calm explanation, don't nag.
- Offline: all settings apply locally; sync defers.
- Conflicting settings across tabs: BroadcastChannel reconciles live.
- Long RTL labels / large text: reflow, tap targets ≥44px (Ch. 100).

## Build Requirements
- `SettingsScreen`, grouped `SettingRow` components, Tailwind, RTL, light/dark, mobile-first.
- Zustand settings store, autosave, BroadcastChannel; single-reminder scheduler (local notifications / PWA).
- Optional Supabase Auth; links to Ch. 99/100.
- Effort: M.

## Definition of Done
- [ ] Theme, single daily reminder, language, and optional sync all work.
- [ ] At most one daily reminder can be scheduled; can be off.
- [ ] Links to Privacy and Accessibility present and functional.
- [ ] No upsell, no analytics dark patterns, no score/streak.
- [ ] Fully functional offline and signed-out; RTL + light/dark verified.
