# 25 — Fear Map

> A soft, respectful sense of what feels scary or tender to a person — held gently so MOOD never pushes too hard, never names a fear as a disorder.

## Purpose
The Fear Map is the part of the Human Map (Ch. 22) that senses where things feel risky, exposed, or tender for a user — being seen, being rejected, being alone, failing in front of others. It exists so challenges stay kind and never re-traumatize. It is **not clinical**: it holds soft signals, never diagnoses like "social anxiety disorder," never a label the user must carry.

## User Experience
The user never sees a "list of your fears." Instead, MOOD simply stays gentle where things feel tender and offers courage in small, safe steps. A Brave-level challenge near a tender edge is always optional and softly framed: "רק אם זה מרגיש נכון — אולי מבט אחד, חיוך אחד." ("Only if it feels right — maybe one glance, one smile.") The user can always choose Easy or step away, and MOOD treats that as wisdom, not failure: "לבחור לא זה גם אומץ." ("Choosing not to is also courage.")

## Game Mechanic
- Fear `Trait`s: `{ family: "fear", kind, signal: 0–1, confidence, decayRate, evidence[] }`.
- Higher signal → MOOD softens: lowers challenge intensity near that edge, adds reassurance, keeps Brave optional.
- Updated when Attempts near an edge succeed gently (signal eases) or when a user steps back (signal respected, not punished).
- Never used to withhold Moments — only to modulate challenge intensity and tone.
- Decays toward neutral so old tenderness doesn't define the user forever.

## Screens Needed
- Challenge Selection (intensity modulation)
- Today / Daily Moment (gentle framing)
- Evening Check-in (captures how an edge felt)

## Visual Assets Needed
- Moment and Light assets that feel safe, warm, and contained (textless).
- Home and Texture assets for grounding, sheltered moods.

## AI Logic
Challenge Generator (Claude) reads fear signals to cap intensity and add reassurance near tender edges; Reflection Generator uses them to stay soft. Strict guardrails: never name a fear clinically, never imply pathology, never dare or provoke ("come on, just do it" is banned). Copy Linter blocks clinical/diagnostic terms and pressure framing. **Safety flag:** if journal or attempt content suggests real distress or risk, the Challenge Generator halts challenges near that edge and surfaces gentle support resources (see Volume Safety) — MOOD never plays therapist.

## Data Stored
- Fear `Trait[]` on the `HumanMap` (soft signals only).
- `evidence[]` referencing `Attempt`/`JournalEntry` ids (references, not raw sensitive text where avoidable).
- `safetyFlag` boolean per edge when distress is detected.
- Local-first; optional Supabase sync with strict row-level security.

## Edge Cases
- New user → assume tenderness; default to gentle intensity until signals build.
- User steps back from a challenge → respect fully, no penalty, no streak break.
- Detected distress → pause pushing, offer support resources, never diagnose.
- Offline → local; safety resources available offline.
- Never expose the Fear Map as a checklist or a "phobia" label.
- RTL long-text wrapping; reassurance copy legible in dark mode.

## Build Requirements
- Fear kinds enum + intensity-modulation function in Challenge Generator.
- Distress-detection heuristic + `safetyFlag` and support-resource surface.
- Reassurance copy library (Hebrew), Copy Linter enforced.
- Effort: ~3–4 dev days incl. safety path.

## Definition of Done
- [ ] Fears stored as soft 0–1 signals with confidence + decay — no clinical labels.
- [ ] High fear signals reduce challenge intensity and keep Brave optional.
- [ ] Stepping back is never penalized and is framed as courage.
- [ ] Distress triggers a safe support path, never a diagnosis.
- [ ] All copy passes the Copy Linter and avoids pressure/clinical language.
