# 77 — Asset Pipeline

> The five-stage path every image travels: brief → generate → quality gate → tag → store as `Asset`.

## Purpose
This chapter defines the assembly line that turns a need for a picture into a trusted, tagged, reusable `Asset`. No image reaches a user except through this pipeline. It exists so that quality, style consistency, and the absolute no-text rule are enforced by process, not by memory — every category (Ch. 78–86) plugs into the same five stages.

## User Experience
Invisible to the user by design. They only ever see stage-5 output: a finished image that already matches the Volume 07 language and already has clear negative space for the app's live Hebrew text. The pipeline's job is that the user never notices it exists.

## Game Mechanic
Five deterministic stages, each with a pass/fail boundary:

1. **Brief** — a request specifying category, mood, subject, target aspect ratio(s), and where the negative-space zone must sit. Assembled from the Moment/screen need.
2. **Generate** — the brief is merged with the Ch. 76 standing preamble and the category prompt template, sent to Grok; N candidates returned.
3. **Quality Gate** — every candidate runs the Ch. 87 checklist (no text, negative space present, on-style, safe, correct aspect/resolution). Failures rejected; on total failure, regenerate with an adjusted brief.
4. **Tag** — accepted image is tagged: category, mood, palette, subject, light quality, safe-zone position, styleVersion.
5. **Store as Asset** — persisted as a versioned `Asset` (master + derivatives), referenced by `MomentTemplate` / screen.

A master **brief template** feeding stage 1:

```
BRIEF
  category: <masterpiece|moment|people|home|object|light|texture|social|video>
  intent: <the human feeling this image should hold>
  subject: <what is depicted, human scale>
  palette: warm, muted, timeless
  light: soft warm natural light, low contrast
  negative_space: <top|bottom|left|right|center> — keep low-detail for live text
  aspect_ratios: [<e.g. 9:16, 1:1>]
  exclude: any text, letters, words, Hebrew, numerals, logos, UI
```

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library
- Shared Humanity
- Settings (asset debug, internal only)

## Visual Assets Needed
All nine categories pass through this identical pipeline; per-category prompt templates live in Ch. 78–86.

## AI Logic
Grok performs stage 2 only. Not reflection/challenge/pattern. Claude may author the brief's `intent` line and the Hebrew alt-text at stage 4, but never the image. The Quality Gate is deterministic checks plus a Grok-independent no-text detector.

## Data Stored
- `Asset` (id, category, uri, derivatives[], aspectRatio, resolution, colorProfile, safeZone, tags[], styleVersion, grokPromptHash, qualityGateStatus, createdAt ISO 8601).
- Brief and rejected candidates retained short-term for audit, then purged. Masters in Supabase Storage; delivery derivatives cached local-first.

## Edge Cases
- All candidates fail Gate → auto-regenerate up to a retry cap, then flag for human review.
- Duplicate near-identical asset → dedupe on `grokPromptHash` + perceptual hash.
- Offline generation request → queue brief, serve neutral fallback meanwhile.
- Long-text RTL overlay needs more room → brief must widen the negative-space zone.
- Style version bump → re-run affected assets through Gate.

## Build Requirements
Brief-assembly service, Grok client, Quality Gate module (Ch. 87), tagging service, Supabase Storage + CDN, perceptual-hash dedupe, retry/queue worker. Effort: L.

## Definition of Done
- [ ] Every image is created only via brief → generate → gate → tag → store.
- [ ] No image bypasses the Quality Gate.
- [ ] Every stored `Asset` carries full tags, safeZone, and styleVersion.
- [ ] Rejected candidates never surface to users.
- [ ] Offline requests fall back gracefully to a neutral asset.
