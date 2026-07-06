# 74 — Motion Language

> How MOOD moves — slow, breathing, almost-still — so animation deepens calm instead of demanding attention.

## Purpose
Motion Language defines every movement in MOOD: the drift of a keyframe, the fade between screens, the breath of the daily ritual. It exists so motion feels like the world quietly living, never like a UI performing. Movement must slow the user down, protect the once-a-day calm, and never introduce urgency, spectacle, or anything resembling a feed.

## User Experience
Opening MOOD feels like a slow exhale. On **Splash** and **Today / Daily Moment**, artwork breathes almost imperceptibly — light shifts, steam rises, a curtain stirs. Transitions are soft crossfades, never swipes-for-more. The Hebrew title settles in gently after the image (e.g. "לאט" — "slowly"). Nothing autoplays loudly; nothing pulls for another tap. The evening close is a slow dimming, not a dismissal.

## Game Mechanic
Motion Language serves the loop's open/close ritual (Core Loop station 4, Ch. 06) and every screen transition. Fixed motion rules:
- **Speed:** slow easing (600–1200ms); no snappy or bouncy UI motion.
- **Image motion:** subtle living-still — light, steam, fabric, water; 6–12s loops.
- **Transitions:** soft crossfade/dissolve; no aggressive slides, no infinite scroll.
- **Text entry:** copy fades in after the image, gently, RTL-aware.
- **Restraint:** motion is optional and reduced-motion respectful; stillness is the default.

## Screens Needed
- Splash
- Today / Daily Moment
- Moment Detail
- Evening Check-in
- Living Library

## Visual Assets Needed
- Video keyframes (primary), Masterpiece assets, Light assets, Texture assets. No text baked into any keyframe or frame.

## AI Logic
For animated assets, Grok generates keyframes with motion tokens: `subtle living-still motion, drifting light, rising steam, gentle fabric, slow loop, no camera shake`. Negative prompt: `no fast motion, no flashing, no text, no UI elements`. UI transitions are coded (Framer Motion / CSS), not AI-driven. Not text-generating; copy timing is handled by the app's text layer.

## Data Stored
`Asset.styleTokens` for keyframes: `motionType`, `loopDuration`, `easing`. App-level: `motionPreference` (full|reduced) on `User`. No baked text in any frame. Local-first; optional Supabase sync.

## Edge Cases
- Reduced-motion OS setting → serve still frame, disable loops.
- Motion causing text jitter → decouple text layer from image motion.
- Battery/perf on low-end devices → cap concurrent animations, prefer stills.
- Any flashing/strobe → reject (accessibility, seizure safety).
- Autoplay respect: never loud, never surprising.

## Build Requirements
- Motion system (Framer Motion + CSS) with slow-easing tokens.
- `prefers-reduced-motion` support end-to-end.
- Keyframe loop player with graceful still fallback.
- Effort: M.

## Definition of Done
- [ ] All motion uses slow easing; no bounce, snap, or infinite scroll.
- [ ] Reduced-motion users get calm stills with no lost meaning.
- [ ] No flashing/strobe anywhere; no text in any keyframe.
- [ ] Text layer stays stable and readable over living-still motion.
