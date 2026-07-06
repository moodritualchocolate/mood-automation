# 117 — Asset Management

> How Grok-generated, text-free artwork is produced, validated, stored, cached, and served so every Moment loads instantly — even offline.

## Purpose
This chapter defines the lifecycle of MOOD's visual assets. Artwork carries the emotional weight of every Moment, so assets must be beautiful, timeless, and — critically — **contain no text of any kind**, since all copy is rendered live in the RTL text layer. It exists to guarantee that pipeline from Grok prompt to on-device pixel.

## User Experience
The user sees painterly-photographic artwork with warm light, negative space, and human intimacy behind each Moment. Hebrew titles and reflections float over it in a live text layer that adapts to RTL and light/dark. Images load instantly because they are cached; there is never Hebrew (or any) text baked into the picture.

## Game Mechanic
Asset lifecycle:
1. **Generate** — `/api/assets/generate` (server) calls Grok with a category prompt (no text tokens; explicit "no text, no letters" negative prompt).
2. **Validate** — automated **no-text check** (OCR/vision pass) rejects any image with detected glyphs; `Asset.hasText` must be `false`. Style/aspect checks enforce category specs.
3. **Store** — upload to Supabase Storage bucket by category (`assets/masterpiece`, `assets/moment`, `assets/people`, `assets/home`, `assets/object`, `assets/light`, `assets/texture`, `assets/social`, `assets/video`). Content-addressed path; create `Asset` row (Ch. 113).
4. **Serve** — `/api/asset/:id` returns a signed URL; responsive sizes via transform params.
5. **Cache** — Service Worker runtime-caches fetched assets; today's + near-future Moment assets are precached for offline.

## Screens Needed
- Today / Daily Moment (Masterpiece/Moment assets)
- Moment Detail, Living Library (Moment assets)
- Shared Humanity (Social assets)
- Splash (Light/Texture)

## Visual Assets Needed
All Volume 07/08 categories: **Masterpiece, Moment, People, Home, Object, Light, Texture, Social/Share, Video keyframes.** Style: timeless, painterly-photographic, warm light, negative space, human intimacy. **NEVER any text baked into an image.**

## AI Logic
Grok is the ONLY generator of visuals and is used ONLY for visuals — never user-facing language (Claude owns text). Guardrail: prompts forbid text/letters; the post-generation no-text validator is authoritative and blocks non-compliant assets from ever getting an `Asset` row.

## Data Stored
`Asset { id, category, storagePath, width, height, hasText:false }`. `MomentTemplate.assetId` and `Moment.assetId` reference it. Assets are shared/global (not per-user), read-only to clients, cached locally by the Service Worker.

## Edge Cases
- Text detected in image: reject + regenerate; never ship.
- Offline: serve cached asset; if uncached, show a neutral Light/Texture placeholder (no error).
- Slow network: progressive/blur-up load; negative-space crop keeps text layer legible.
- RTL text layer over busy art: enforce negative-space region in prompt + safe-area overlay.
- Storage/CDN outage: Service Worker cache covers today's Moment.

## Build Requirements
- `assetClient` (Grok) in Route Handlers; no-text validator (vision/OCR).
- Supabase Storage buckets per category + signed-URL helper + image transforms.
- Workbox runtime cache + precache of daily assets.
- Neutral local placeholder bundle.
- Effort: M.

## Definition of Done
- [ ] Every stored `Asset` passes the no-text validator (`hasText:false`).
- [ ] No Hebrew or any text is ever baked into an image.
- [ ] Today's Moment art is available offline via cache.
- [ ] Assets serve via signed, responsive URLs.
- [ ] Grok is used only for visuals; Claude only for text.
