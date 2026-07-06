# GROK_ASSET_BRIEF — Visual Asset Production for MOOD

> This is the standing brief for **Grok**, the visual asset engine of MOOD.
> Grok produces **all** imagery and video keyframes. Claude never generates
> visuals; Grok never writes copy or product logic. Read Volumes 07 (Visual
> Language) and 08 (Asset Pipeline) for the full detail — this file is the
> operational summary and hard rules.

---

## The One Absolute Rule

**NO TEXT OF ANY KIND INSIDE ANY IMAGE. NEVER ANY HEBREW.**

Every asset must leave clean **negative space** where the app renders the live
Hebrew text layer (title + reflection). If a generated image contains letters,
numbers, glyphs, signage, watermarks, or logo text — it is **rejected**. No
exceptions. See Ch. 75 and Ch. 87.

---

## The MOOD Look (in one paragraph)

Timeless, painterly-photographic. Warm, natural, directional light — golden hour,
window light, candlelight. Human intimacy over spectacle: hands, a shoulder, a
back turned to the light, a quiet home. Muted, filmic color; soft grain; gentle
depth of field. Emotionally warm, never clinical, never corporate, never
stock-photo. Every frame should feel like a remembered moment, not an
advertisement. Generous negative space. See Ch. 65–74.

---

## Global Generation Defaults

- **Style tokens (prepend to every prompt):**
  `timeless painterly photography, warm natural directional light, filmic muted
  color, soft film grain, shallow depth of field, intimate human scale,
  generous negative space, no text, no letters, no watermark, no signage`
- **Negative prompt (append to every prompt):**
  `text, letters, words, hebrew, captions, watermark, logo text, signage, ui,
  numbers, subtitles, meme text, harsh flash, hdr, oversaturation, stock-photo
  look, plastic skin, distorted hands`
- **Aspect ratios:** portrait **4:5** and **9:16** for Moment/phone; **1:1** for
  Ripple/share; **16:9** for video keyframes. Always keep a clear text-safe zone
  (top third OR bottom third) empty.
- **Resolution:** ≥ 2048px on the long edge; deliver 2x for retina.
- **Format:** master as PNG/WEBP lossless; app ships compressed WEBP/AVIF.
- **Color:** sRGB. Keep a consistent warm LUT across a release set.

---

## Asset Categories (map to Volume 08)

| Category | Chapter | Use | Aspect | Text-safe zone |
|----------|---------|-----|--------|----------------|
| Masterpiece | 78 | Hero / splash / rare moments | 4:5, 9:16 | bottom third |
| Moment | 79 | Daily Moment artwork | 4:5 | bottom third |
| People | 80 | Human intimacy (never faces as "models") | 4:5 | side/bottom |
| Home | 81 | Domestic warmth, belonging | 4:5, 16:9 | bottom |
| Object | 82 | Small meaningful objects | 1:1, 4:5 | around subject |
| Light | 83 | Pure light/atmosphere backgrounds | 9:16 | full-flexible |
| Texture | 84 | Paper, fabric, grain overlays | 1:1 | full |
| Social/Share | 85 | Ripple share images | 1:1, 9:16 | center-safe |
| Video keyframes | 86 | Motion in/out frames | 16:9, 9:16 | bottom |

---

## Per-Asset Prompt Skeleton

```
[STYLE TOKENS], [subject & emotion in one clause], [light description],
[composition + where the negative/text-safe space is], [mood word].
--ar <ratio>  --no [NEGATIVE PROMPT]
```

Example (Moment asset, social courage theme — no text, ever):
```
timeless painterly photography, warm natural directional light, filmic muted
color, soft film grain, shallow depth of field, generous negative space —
two strangers about to speak at a sunlit café counter, seen from behind,
warm afternoon window light, wide empty warm wall on the lower third for text,
tender and hopeful. --ar 4:5
--no text, letters, words, hebrew, watermark, signage, ui, numbers, faces-to-camera
```

---

## Quality Gate (every asset must pass — Ch. 87)

- [ ] **No text / letters / numbers / signage anywhere** in the frame.
- [ ] Clear, uncluttered **text-safe negative space** in the correct third.
- [ ] On-style: warm, filmic, intimate, timeless (not stock, not corporate).
- [ ] Correct aspect ratio and ≥ 2048px long edge.
- [ ] Safe, humane content — no distress, no shame imagery, no risky acts, no
      identifiable minors, no explicit content. Aligns with challenge safety.
- [ ] Hands/anatomy clean; skin natural (not plastic).
- [ ] Color consistent with the current release LUT.
- [ ] Tagged with `Asset` metadata (theme, category, aspect, safe-zone, palette).

An asset that fails any box is regenerated, never shipped.

---

## Handoff

Approved assets are stored via **Asset Management** (Ch. 117) with metadata, then
bound to `MomentTemplate`s. The app overlays Hebrew text at runtime — which is
exactly why the image must stay silent.
