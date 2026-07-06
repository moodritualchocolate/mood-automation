# 76 — Grok Role

> Grok is MOOD's single visual engine: it generates every image and video keyframe in the product, while Claude owns all copy and logic — and no image ever contains baked-in text.

## Purpose
MOOD splits generation cleanly along one line: **Claude writes, Grok paints.** Grok is the sole source of every `Asset` — the artwork behind a Moment, the light and texture overlays, the share images, the video keyframes. This separation keeps the visual language coherent (one engine, one style contract) and protects the most important rule in the product: text lives in the app, never in the picture. This chapter fixes Grok's role, its boundaries, and the standing instructions every prompt inherits.

## User Experience
The user never sees Grok, never sees a prompt, never sees a loading spinner tied to generation. They meet only the finished result: a full-bleed, timeless, painterly-photographic image on the Today / Daily Moment screen, warm and quiet, with room for the live Hebrew text the app renders on top. Example live title layered by the app: "רגע קטן של אור" ("a small moment of light"). The image feels made for that person; the words feel spoken to them. Neither leaks the machinery behind it.

## Game Mechanic
Grok is invoked only through the pipeline (see Ch. 77), never ad hoc. Every request carries: a category (Ch. 78–86), the Volume 07 visual language, a required negative-space zone, and a hard negative-prompt banning all text. Grok returns candidate images; the Quality Gate (Ch. 87) accepts or rejects. Accepted output becomes an `Asset` with tags. Claude and Grok never share a call — copy is composited live at render time, never generated into the pixels.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library
- Shared Humanity

## Visual Assets Needed
All nine categories: Masterpiece, Moment, People, Home, Object, Light, Texture, Social/Share, Video keyframes. Every one from Grok, painterly-photographic, warm light, negative space, human intimacy. NEVER any text — and never Hebrew — baked into an image.

## AI Logic
Not a reflection/challenge/pattern engine — Grok is **visual only**. Standing system preamble injected into every generation:

```
ENGINE: Grok (visual generation only)
STYLE: timeless, painterly-photographic, warm natural light, soft grain,
  intimate human scale, generous negative space, muted warm palette.
COMPOSITION: reserve one low-detail, low-contrast negative-space zone for
  a live text layer added later by the app.
HARD NEGATIVE: no text, no letters, no words, no captions, no watermark,
  no logo, no signage, no Hebrew, no numerals, no UI, no borders.
SAFETY: no minors in sensitive contexts, no gore, no explicit content,
  no identifiable real people, no brand marks.
```

## Data Stored
- `Asset` (id, category, uri, aspectRatio, resolution, colorProfile, safeZone, styleVersion, tags, grokPromptHash, qualityGateStatus). Local-first cache of delivery derivatives; masters in Supabase Storage.

## Edge Cases
- Text hallucinated into image → hard reject at Gate, regenerate.
- Generation offline/unavailable → serve a pre-approved neutral Texture asset, never a blank.
- Style drift across model versions → pin `styleVersion`, re-audit on upgrade.
- Accessibility: every `Asset` still needs a Claude-authored Hebrew alt-text string (copy, not image).

## Build Requirements
Grok generation client, prompt-assembly service injecting the standing preamble, negative-prompt enforcement, Supabase Storage for masters, CDN for WebP/AVIF derivatives. Effort: M.

## Definition of Done
- [ ] Grok is the only image/video generator wired in.
- [ ] Standing preamble + text-ban negative prompt injected on every call.
- [ ] Every accepted image passes the no-text Quality Gate.
- [ ] Claude owns all copy; no text is ever generated into pixels.
- [ ] Each `Asset` stored with category, tags, safeZone, styleVersion.
