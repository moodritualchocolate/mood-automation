# 31 — Moment Structure

> A Moment is a fixed core plus composable optional layers, arranged in one consistent vertical reading order from artwork to quiet close.

## Purpose
This chapter defines the internal anatomy of a Moment — which parts are mandatory, which are optional, and the order they appear in. A shared structure lets authors build `MomentTemplate`s, lets the renderer stay simple, and lets every Moment feel like the same intimate object even as its layers change day to day. Structure is the skeleton; Ch. 32 defines the metadata that hangs on it.

## User Experience
Reading top to bottom, the user experiences a Moment as a single slow scroll: artwork fills the screen, a tiny title sits over it, and as they scroll the living Reflection arrives, then a gentle invitation, then — only if present — the Challenge. Nothing competes for attention; each layer breathes. Example invitation: "אם בא לך, קח רגע לחשוב על זה" ("if you feel like it, take a moment to sit with this"). The structure always resolves to a calm close, never a call-to-action wall.

## Game Mechanic
Structure = **Core (always)** + **Layers (optional, ordered)**:
1. Artwork (`Asset`) — always
2. Title — always
3. Reflection (`Reflection`) — always
4. Recognition layer (Ch. 35) — optional
5. Invitation layer (Ch. 36) — optional
6. Challenge layer (Ch. 37) — optional
7. Journal layer (Ch. 38) — appears in the evening
8. Memory layer (Ch. 39) — optional
9. Social share layer (Ch. 40) — optional, always last

A `MomentTemplate` declares which optional layers it carries via boolean flags; the renderer walks the fixed order and skips absent layers. Layers never reorder. A Moment with only its core is valid and complete.

## Screens Needed
- Today / Daily Moment
- Moment Detail

## Visual Assets Needed
- Moment assets (core artwork)
- Light assets, Texture assets (layer separators and warmth)
No text baked into any image; layer dividers are subtle light/texture, not labeled bars.

## AI Logic
Not AI-driven for ordering — layer order is a fixed product decision, deterministic in the renderer. The *contents* of Reflection, invitation, and Challenge layers are AI-generated per their own chapters and pass the Copy Linter and Tone Guardrails.

## Data Stored
- `MomentTemplate.layers`: `{ recognition, invitation, challenge, journal, memory, socialShare }` booleans
- `DailyMoment.layerState`: per-layer resolved copy and interaction state
All copy Hebrew; timestamps ISO 8601. Local-first with optional Supabase sync.

## Edge Cases
- Core-only Moment: renders cleanly with no empty slots.
- Challenge flag on but generation failed: hide the layer, never show an error stub.
- Offline: all present layers render from local resolved state.
- Long RTL text in any layer: each layer scrolls independently without clipping.
- Accessibility: layer order matches DOM order for screen readers.

## Build Requirements
`MomentRenderer` iterates an ordered layer registry; each layer is a self-contained component with a `visible` guard. Zustand holds `layerState`. Effort: medium — the registry pattern is reused across all layer chapters (35–40).

## Definition of Done
- [ ] Fixed layer order implemented as a single registry.
- [ ] Optional layers skip cleanly when absent.
- [ ] Core-only Moment validates as complete.
- [ ] Reading order matches DOM order for accessibility.
- [ ] Hebrew RTL renders correctly across all layers, light and dark.
