# 61 — User Safety

> When a person is in real distress, MOOD stops being a game — it gently steps back, never pretends to be therapy, and points toward real human help. And it protects their data as if it were their own diary.

## Purpose
MOOD invites emotional honesty, so it will sometimes meet real pain — including signals of crisis or self-harm. This chapter defines how MOOD responds safely and how it protects privacy. Two non-negotiables: MOOD is never a substitute for a therapist or crisis service, and the user's inner life is private by default. Handling this well is a matter of genuine human safety, not product polish.

## User Experience
If a Journal entry or input carries distress or self-harm signals, MOOD softens completely. It does not analyze, diagnose, or challenge. It responds with warmth and offers real-world human resources. Example: "נשמע שכואב לך עכשיו. אתה לא לבד, ויש אנשים אמיתיים שאפשר לדבר איתם" ("it sounds like you're hurting right now — you're not alone, and there are real people you can talk to"), followed by clearly-presented local helpline options (e.g. ער"ן / SAHAR in Israel) and an emergency number. MOOD never says "I understand" as a therapist would; it hands off.

## Game Mechanic
A safety classifier scans user free-text (Journal, inputs). On a distress/self-harm signal it raises a `SafetyFlag`, suspends challenge/reflection generation for that entry, and shows the Safety response with resources. The day's game state pauses gracefully — no streak effect, no penalty, no "task" framing. The user can dismiss and continue whenever ready.

## Screens Needed
- Evening Check-in
- Privacy
- Settings
- A dedicated Safety response surface (overlay) with resources

## Visual Assets Needed
- Light assets only (calm, warm, non-alarming)
No text baked into images; all safety copy and resource links render in the live RTL text layer.

## AI Logic
Detection uses a conservative classifier (deterministic rules + **Claude API** `claude-opus-4-8` for nuance) tuned to over-refer rather than miss. On a flag, AI generation is **halted** for that context — the app shows hand-authored, reviewed Hebrew safety copy and vetted resources, never model-improvised counseling. AI must never diagnose (Ch. 55), assess risk level to the user, or act as therapist. Fallbacks and resource lists are curated by humans and localized.

## Data Stored
- `SafetyFlag` { id, entityId, signalType, handledAt (ISO 8601) } — minimal, local-first, never used for personalization or profiling.
- Distress content is **not** synced to cloud by default and never used to train or rank.
Privacy: local-first ownership; Journal and reflections stay on-device unless the user explicitly opts into Supabase sync. Data export and full delete are available in Settings; deletion purges entries, indexes (Ch. 59), and flags.

## Edge Cases
- False positive: user can dismiss; err on showing support anyway.
- Offline: safety copy + resource list ship in-app so they work with no network.
- Repeated distress: keep offering resources calmly; never escalate tone or nag.
- Minors / regional laws: localized resources and appropriate handling per region.
- Data request: honor export/delete fully, including safety flags.

## Build Requirements
- Safety classifier with a bias toward referral; halts generation on flag.
- Curated, localized resource list bundled offline (helplines, emergency numbers).
- Local-first storage; explicit opt-in for cloud sync; export + delete flows.
- Effort: high; correctness- and safety-critical, human-reviewed copy.

## Definition of Done
- [ ] Distress/self-harm signals halt AI generation and show reviewed safety copy.
- [ ] Real human resources (localized helplines + emergency) are always reachable, including offline.
- [ ] MOOD never diagnoses, assesses risk to the user, or acts as therapy.
- [ ] Distress content is not synced or used for personalization by default.
- [ ] Export and full delete purge entries, indexes, and safety flags.
