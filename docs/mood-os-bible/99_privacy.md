# 99 — Privacy Screen

> Plain-language ownership: MOOD is local-first and private by default, and this screen proves it with real controls.

## Purpose
The Privacy screen exists to make MOOD's core value — *your life is yours* — concrete and controllable. It explains, in warm plain Hebrew, what is stored, what is (and isn't) shared, and gives the user real power: export, delete, and control over anonymous Ripple contribution (Ch. 97). Trust is a feature here, not fine print.

## User Experience
A calm, readable page, not a legal wall. Opening line: "הכול שמור אצלך קודם. שום דבר לא נמכר. שום דבר לא נשפט." ("everything is stored with you first. nothing is sold. nothing is judged."). Sections: "מה נשמר" ("what's stored" — Moments, journals, soft signals), "מה משותף" ("what's shared" — only anonymous aggregates, only if you choose), "מה אף פעם לא" ("what never happens" — no ads, no selling, no diagnosis). Real buttons: "ייצא את הנתונים שלי" ("export my data"), "מחק הכול" ("delete everything"), and a toggle "השתתפות אנונימית ב-Ripple" ("anonymous Ripple participation"). Delete asks a calm confirm, never guilt-trips. The feeling target: *I truly own this, and I can leave clean.*

## Game Mechanic
Control surface, not play. Actions: export (bundle local + synced data as portable JSON), delete (wipe local + request server erase), toggle Ripple contribution. States: `viewing → confirming_delete → done`. No dark patterns, no "are you sure you'll lose your streak" (there are no streaks). Deletion is honored fully and calmly.

## Screens Needed
- Privacy
- Settings
- Shared Humanity (what contribution means)

## Visual Assets Needed
- Minimal Texture/Light assets for warmth. No baked text; plain readable UI.

## AI Logic
Not AI-driven — Privacy is deterministic data control. It documents that AI (Reflection/Challenge/Pattern engines, Ch. 06) never diagnoses and that Ripple stats carry no PII, but performs no inference itself.

## Data Stored
- `UserSetting.rippleOptIn` (bool), consent + deletion request records (ISO 8601).
- Export reads all local entities (`Moment`, `JournalEntry`, `Attempt`, `HumanMap`, etc.). Delete removes them locally and issues Supabase erase if synced. Local-first; optional cloud.

## Edge Cases
- Offline delete: wipe local immediately; queue server erase for reconnect.
- Export offline: build bundle from local store, no network needed.
- Signed-out user: privacy still fully applies to local data.
- Partial sync during delete: reconcile so nothing is orphaned server-side.
- Distress-adjacent data: same protections; support links respect privacy.
- Long RTL legal-plain text / large type: reflow, tap targets ≥44px (Ch. 100).

## Build Requirements
- `PrivacyScreen`, `DataExportButton`, `DeleteEverythingFlow`, `RippleOptInToggle`, Tailwind, RTL, light/dark, mobile-first.
- Local export serializer; `/api/erase` for cloud; Zustand + BroadcastChannel; PWA offline support.
- Effort: M.

## Definition of Done
- [ ] Plain-Hebrew explanation of stored/shared/never, no legal wall.
- [ ] Working export (portable JSON) and full delete (local + cloud).
- [ ] Ripple contribution toggle actually gates Ch. 97.
- [ ] No dark patterns; delete confirm is calm, no guilt/streak framing.
- [ ] Works offline and signed-out; RTL + light/dark verified.
