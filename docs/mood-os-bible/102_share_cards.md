# 102 — Share Cards

> A shareable Ripple image is a small, beautiful, text-light gift a user can send to one person — internally we export it as a "share card", but in the UI it is only ever a shareable Ripple image.

## Purpose
When a Moment truly lands, a person wants to hand it to someone they love. This chapter defines that artifact. Note on naming: **"share card" is a technical/export term used only in code and asset pipelines. In all user-facing copy it is a "shareable Ripple image" — never called a card** (see contract: the word "cards" is banned in UI). Its purpose is generosity and beauty, not reach or self-promotion.

## User Experience
From a Moment Detail or the evening reflection, the user may tap "לשתף רגע" ("share a moment"). They see a preview of a composed image: the Moment artwork, generous negative space, and a short live-rendered Hebrew line, e.g. "מצאתי היום רגע קטן. חשבתי עלייך." ("I found a small moment today. I thought of you."). By default it carries no name, no handle, no app-branded pressure. The user sends it through their own channels (WhatsApp, Messages) to a chosen person. Nothing is posted publicly from inside MOOD. The feeling is: giving a hand-picked postcard, not broadcasting.

## Game Mechanic
Export composes an image at share time from an `Asset` + a live text layer. States: `preview → composed → exported`. The user controls whether any attribution appears (default: none). No counter tracks how many were sent or opened. The artifact is a leaf — it never links back into a public feed because none exists.

## Screens Needed
- Moment Detail
- Evening Check-in
- Shared Humanity

## Visual Assets Needed
- Social/Share assets (the composed backgrounds)
- Masterpiece assets and Moment assets (source artwork)
- Light and Texture assets
Grok generates artwork with **no baked text**; the Hebrew caption is composited by the app at export in an RTL-safe live layer.

## AI Logic
Reflection Generator (Claude, Ch. 06) may propose the optional one-line caption from the Moment; the user can edit or clear it. Guardrails: outcome-agnostic, warm, no shame, no "should". Copy Linter validates the caption before export. Image selection is deterministic (matches the Moment's `Asset`), not AI-driven.

## Data Stored
`ShareCard { id, momentId, assetId, captionHe, attribution: none|firstNameOptIn, createdAt }` (internal/export entity name). Copy fields Hebrew; timestamps ISO 8601. Composed image is ephemeral by default (not stored server-side unless the user saves it to their Living Library). Local-first; optional Supabase Storage only on explicit save.

## Edge Cases
- Long Hebrew caption: text layer wraps/scales; never overflows the artwork.
- RTL punctuation and mixed digits render correctly.
- Offline: composition works locally; export uses the local asset.
- User clears caption: image ships beautifully with zero text.
- Accessibility: exported image includes alt text; preview is screen-reader labeled.

## Build Requirements
Canvas/serverless image composer; RTL text-layer renderer; Social/Share asset set; save-to-Library hook. Medium effort. Never introduce a public feed or open-count.

## Definition of Done
- [ ] UI copy never uses the word "card" — always "shareable Ripple image".
- [ ] No baked text in source artwork; caption is a live RTL layer.
- [ ] Default export carries no identity and no counter.
- [ ] Caption passes Copy Linter before export.
- [ ] Works offline and renders in light and dark.
