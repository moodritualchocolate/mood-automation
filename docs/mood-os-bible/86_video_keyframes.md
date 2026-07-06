# 86 — Video Keyframes

> Still keyframes Grok generates for short, silent, looping ambient motion — breath, not spectacle.

## Purpose
Video keyframes let a Moment breathe. MOOD uses only short, silent, subtly looping motion — light drifting, dust settling, a curtain stirring — to add life without demanding attention. Grok generates the still keyframes (start/mid/end and in-betweens); motion is produced by interpolation or gentle Ken-Burns compositing. Video is always optional, never autoplaying with force, and never a place for text.

## User Experience
On Today / Daily Moment, the artwork may drift almost imperceptibly — a slow bloom of light, a faint sway — then hold. It feels alive, calm, and brief (a few-second loop, reduced-motion honored). The app renders the live Hebrew title over the same reserved negative space, which stays still and low-detail across every frame. Example live title: "נשימה" ("a breath").

## Game Mechanic
A keyframe set defines a loop: `keyframe_start → keyframe_mid → keyframe_end`, tuned to return seamlessly. Motion is minimal, low-velocity, and confined away from the text zone so the overlay never wobbles. Loops are short (~3–6s), silent, and pausable; reduced-motion falls back to a single still.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Masterpiece Moments (occasional)

## Visual Assets Needed
Video keyframes (primary), built from Moment/Light/Texture language; interpolated to motion at build time.

## Grok Prompt Template
```
[Grok | category: video-keyframe | frame: start|mid|end]
A timeless, painterly-photographic keyframe for a subtle silent loop
  holding <intent: a breathing calm>. Same scene and palette across the
  set; only a gentle low-velocity change between frames — drifting light,
  settling dust, a faint sway, a slow bloom. Soft warm light, low
  contrast, fine grain, muted timeless palette. Keep the <top|bottom>
  third STILL, low-detail NEGATIVE SPACE for a live text layer; no motion
  or detail there. Frame <start|mid|end> of the loop, seamless return.
NEGATIVE: text, letters, words, Hebrew, numerals, watermark, logo, UI,
  fast motion, camera shake, flashing, strobe, subject jumps between
  frames, harsh contrast, neon, brand marks, gore, explicit content.
```

## Output Specs
- **Aspect ratios:** 9:16 (primary), 1:1.
- **Resolution:** keyframe master ≥ 2048×3641 (9:16); output loop 1080×1920, ~24fps.
- **Format:** PNG keyframe masters; delivery MP4 (H.264/H.265) + WebM/AV1; silent (no audio track).
- **Color:** sRGB, warm muted palette; consistent white balance across all frames.
- **Safe negative-space zone:** reserved third held motionless and low-detail across every frame so the RTL overlay stays legible and stable.

## AI Logic
Grok generates stills only; interpolation/compositing is deterministic build tooling, not AI. Loop seamlessness and text-zone stillness enforced by the Ch. 87 Gate (checked per-frame and across the set). Claude authors Hebrew alt-text.

## Data Stored
- `Asset` (category="video-keyframe", loopId, frameRole start|mid|end, durationSec, safeZone, styleVersion, reducedMotionFallbackUri). Masters in Supabase Storage; delivery loops cached local-first.

## Edge Cases
- Text hallucinated in any frame → reject whole set.
- Motion enters the text zone → reject, regenerate.
- Non-seamless loop / subject jump → rebuild.
- Reduced-motion preference or offline → serve single still fallback.
- Battery/data saver → default to still.

## Build Requirements
Keyframe library with loop grouping, interpolation/compositing build step, per-frame + across-set Gate, reduced-motion fallback, silent-video encoder. Effort: M–L.

## Definition of Done
- [ ] Loops are short, silent, subtle, and seamless.
- [ ] No text in any frame; text zone stays still and low-detail.
- [ ] Reduced-motion and offline fall back to a still.
- [ ] Aspect/resolution/format/fps specs met; no audio track.
- [ ] Whole set passes the Gate together.
