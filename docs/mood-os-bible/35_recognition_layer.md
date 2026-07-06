# 35 — Recognition Layer

> The Recognition layer is the living Reflection itself — the few Hebrew lines that make a person feel gently and precisely seen.

## Purpose
Recognition is the emotional heart of a Moment and the layer that delivers the core promise: "someone noticed something small about my life that I never knew how to say." It is the `Reflection` copy, personalized from the Human Map and past Moments, that turns a piece of artwork into a message that feels meant for this person, today. Without it a Moment is decoration; with it, a Moment is contact.

## User Experience
Below the artwork and title, two to four soft Hebrew lines arrive. They are specific enough to feel personal, gentle enough never to expose. Example: "לפעמים את בוחרת בשקט לא כי אין לך מה לומר, אלא כי את עוד מקשיבה" ("sometimes you choose quiet not because you have nothing to say, but because you're still listening"). The user should feel recognized, not analyzed. Never a verdict, never "you are X."

## Game Mechanic
The Recognition layer renders a resolved `Reflection` in the Moment's fixed structure (Ch. 31, slot 4). Inputs: `MomentTemplate.reflectionSeed`, soft `HumanMap` signals, and Memory Engine context. Output: Hebrew copy with a warmth-checked tone. The layer has one state — present — and no interaction beyond reading; it may be saved to the Library with the Moment.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library (Reflection travels with the saved Moment)

## Visual Assets Needed
- Light assets, Texture assets (a calm ground for text over artwork)
- Moment assets (the artwork it sits on)
No text baked into images; the Reflection is a live RTL text layer with legible contrast in light/dark.

## AI Logic
Engine: **Reflection Generator** (Claude, Ch. 06). Inputs: soft signals (0–1, with confidence/decay), `moodTone`, `themes`, `reflectionSeed`, and recent `Moment`/`Attempt` memory. Guardrails: never diagnose, never label ("you have anxiety" is forbidden), never use "should"/"must", frame in tentative, gentle Hebrew. Every output passes Tone Guardrails and the Copy Linter, which blocks banned framing before ship.

## Data Stored
- `Reflection`: `{ id, dailyMomentId, copyHe, generatorVersion, toneTone, createdAt }`
- Linked to `DailyMoment`; carried into `LibraryItem`
Copy Hebrew; timestamps ISO 8601. Local-first; Supabase optional sync.

## Edge Cases
- Sparse Human Map (new user): fall back to universally gentle, non-personal Reflections.
- Generation failure/offline: use a pre-bundled tone-safe Reflection for the template.
- Distress signals in context: route to gentle, non-diagnostic supportive copy (see safety, Ch. 02).
- Over-specific risk: guardrail rejects anything that could feel exposing or accusatory.
- Long RTL copy: layout scrolls without clipping over artwork.

## Build Requirements
`RecognitionLayer` component reading `DailyMoment.reflection`. Reflection Generator endpoint (Claude) with bundled offline fallbacks. Copy Linter in the generation path. Effort: medium–high (tone quality is critical).

## Definition of Done
- [ ] Reflection renders as a live RTL layer over artwork.
- [ ] Copy is personalized from soft signals without diagnosing or labeling.
- [ ] Offline/failure fallbacks are tone-safe.
- [ ] Copy Linter blocks banned framing in the generation path.
- [ ] Hebrew Reflection renders legibly in light and dark.
