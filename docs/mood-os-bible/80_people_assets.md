# 80 — People Assets

> Human presence rendered with warmth and anonymity — faces and figures that feel like anyone, and everyone.

## Purpose
People assets bring human intimacy into MOOD without ever depicting a real, identifiable person. They carry the emotional core of many Moments — a hand, a shoulder, a figure at a window — so the user feels human company without being shown a stranger's specific face. Anonymity is a feature: the image should feel like it could be about the user's own life.

## User Experience
The user sees a warmly lit human presence that suggests feeling rather than identity — often partial, turned, soft-focused, or gently abstracted. It reads as tender and universal. Over reserved negative space, the app renders the live Hebrew title. Example live title: "לא לבד" ("not alone"). The person in the image is no one in particular, which is exactly why it can be about the user.

## Game Mechanic
People assets supply the human subject inside a Moment asset or stand alone for connection-themed Moments and Shared Humanity. Selection favors ambiguity of identity, age-appropriate framing, and diverse yet non-specific representation. Never used to imply a diagnosis or judgment about the user.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Shared Humanity
- Living Library

## Visual Assets Needed
People assets (primary), composited with Light and Texture; framed within Moment or Home scenes.

## Grok Prompt Template
```
[Grok | category: people]
A timeless, painterly-photographic image of an anonymous human presence
  holding <intent: a tender human feeling>. Partial, turned-away, soft
  focus or gently abstracted so no individual is identifiable — a hand,
  a silhouette, a shoulder, a figure at a distance. Warm natural light,
  low contrast, fine grain, muted timeless palette, intimate human scale,
  universal and dignified. Reserve calm NEGATIVE SPACE in the
  <top|bottom> third, low-detail, for a live text layer added later.
NEGATIVE: text, letters, words, Hebrew, numerals, watermark, logo, UI,
  identifiable real person, recognizable celebrity, direct sharp face
  focus, minors in sensitive context, gore, explicit content, brand marks.
```

## Output Specs
- **Aspect ratios:** 9:16 (primary), 4:5 (Library), 1:1 (Detail/Shared Humanity).
- **Resolution:** master ≥ 2048×3641 (9:16).
- **Format:** PNG master; AVIF/WebP derivatives.
- **Color:** sRGB, warm muted palette; skin tones natural and diverse, never stylized to a single type.
- **Safe negative-space zone:** ≥ 30% of height, low contrast, clear of the figure for legible RTL overlay.

## AI Logic
Grok generation only. Identity-anonymity and safe-framing enforced by prompt + a stricter Ch. 87 safety pass. No demographic inference from Human Map is ever rendered. Claude authors Hebrew alt-text.

## Data Stored
- `Asset` (category="people", anonymity flag, framing tags, safeZone, styleVersion). Masters in Supabase Storage; derivatives cached local-first.

## Edge Cases
- Face too identifiable → reject at Gate, regenerate softer.
- Any minor in a sensitive context → hard reject.
- Representation skew over the library → monitor and rebalance tags.
- Offline → cached asset renders locally.
- Long RTL text → wider safe-zone variant.

## Build Requirements
People-asset library with anonymity + framing tags, stricter safety Gate, representation-balance audit. Effort: M.

## Definition of Done
- [ ] No identifiable real people; anonymity verified at Gate.
- [ ] No text baked in; live RTL text in reserved negative space.
- [ ] Safe-content pass enforced (no sensitive minors, no explicit).
- [ ] Diverse, dignified representation across the library.
- [ ] Aspect/resolution/format specs met.
