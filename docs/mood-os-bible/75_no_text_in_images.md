# 75 — No Text in Images

> The absolute law: no text of any kind — and never any Hebrew — is ever baked into a generated image. Every word lives in the app's text layer.

## Purpose
This is the single hardest rule in Volume 07 and it admits no exceptions. Every Grok-generated image, keyframe, and share asset must be completely free of text: no titles, no captions, no labels, no signage, no watermarks, no letters or numbers of any kind — and, above all, no Hebrew. All words are rendered by the app in a live text layer over the artwork's negative space (Ch. 73). This exists so copy stays editable, translatable, tone-linted, and RTL-correct, and so images stay timeless and reusable forever.

## User Experience
The user never sees crooked, misspelled, or foreign text painted into an image. Every Hebrew word they read — title, reflection, invitation, challenge — is crisp app-rendered type in the calm zone of the artwork (e.g. "המילים חיות מעל התמונה" — "the words live above the image"). The image is pure feeling; the app supplies the language.

## Game Mechanic
The rule governs every asset in every station of the loop. It is enforced, not trusted:
- **Generation:** every Grok prompt includes a hard negative: `no text, no letters, no words, no numbers, no captions, no signage, no watermark, no Hebrew, no any-language text`.
- **Gate:** every asset passes an automated OCR/text-detection gate before ingest.
- **Verdict:** any detected glyph → hard reject → regenerate. Zero manual overrides.
- **Coverage:** applies to books, signs, screens, clothing, packaging, keyframes, share cards.

## Screens Needed
- Applies to every screen that shows artwork: Splash, Today / Daily Moment, Moment Detail, Living Library, Shared Humanity.

## Visual Assets Needed
- Every category — Masterpiece, Moment, People, Home, Object, Light, Texture, Social/Share, Video keyframes — must be 100% text-free.

## AI Logic
This chapter is the master **guardrail** on Grok, not a generative engine. It appends the strongest negative-text prompt to every request and runs a mandatory post-generation OCR pass (multi-language, including Hebrew) plus a heuristic glyph detector. Failures never ship. The Copy Linter (Ch. 06 / Volume 06) governs the *text layer* separately; the two never mix — Grok makes images, Claude makes words, and words are only ever composited live by the app.

## Data Stored
`Asset.textFree` (bool, must be `true` to ship), `ocrScore` (detected-glyph confidence, must be ~0), `ocrLangsChecked[]` (must include `he`). Assets failing are stored as `rejected` with reason. Local-first; optional Supabase sync.

## Edge Cases
- Object/book/sign with faint letters → reject even if partial.
- Decorative squiggles OCR reads as glyphs → manual confirm, then reject or clear.
- Share/export compositing → app renders text at export time; never bake it (only the app's live layer, temporarily, for a user-initiated export).
- Non-Hebrew text (English/Latin/other) → also rejected; the rule is *all* text.
- RTL: text belongs only to the app layer, so RTL correctness is always guaranteed.

## Build Requirements
- Universal negative-text prompt injector on every Grok call.
- Mandatory OCR gate (multi-language incl. Hebrew) in the ingest pipeline.
- `rejected` asset store with reasons; no manual bypass path.
- Effort: M (blocking gate for the whole visual system).

## Definition of Done
- [ ] Every Grok prompt carries the hard no-text negative.
- [ ] Every ingested asset passes OCR with `textFree = true`, `ocrLangsChecked` includes `he`.
- [ ] Zero assets in production contain any baked text, especially Hebrew.
- [ ] All user-facing words are app-rendered in the live text layer over negative space (Ch. 73).
