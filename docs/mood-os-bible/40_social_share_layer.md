# 40 — Social Share Layer

> The Social Share layer offers anonymous belonging — a beautiful shareable image and a quiet Ripple stat — with no likes, no profiles, and no comparison.

## Purpose
This layer lets a Moment connect the user to a wider human field without any social-media mechanics. It provides two things: an optional, text-safe shareable artwork the user can send outward, and a Ripple sense of shared humanity ("others chose a small act of courage too"). It serves belonging while strictly refusing likes, followers, profiles, or comparison.

## User Experience
As the final, optional layer of a Moment, the user may see a soft line of belonging: "8,412 אנשים בחרו היום מעשה קטן של אומץ" ("8,412 people also chose a small act of courage today"). No names, no faces, no ranking. If they wish, they can share the Moment's artwork outward — a clean image with no baked text — via the OS share sheet. There is nothing to receive back: no likes, no comments, no comparison. It feels like standing quietly beside strangers, not performing for them.

## Game Mechanic
Renders in slot 9 (always last) when `MomentTemplate.layers.socialShare` is true. Two independent affordances: (1) **Ripple** — reads an aggregate `RippleStat` (anonymous count for the day/category); (2) **Share** — exports the artwork `Asset` to the native share sheet. Sharing is outbound only; MOOD ingests no likes, no responses, no social graph. Both are optional and carry no reward.

## Screens Needed
- Shared Humanity
- Today / Daily Moment
- Moment Detail

## Visual Assets Needed
- Social/Share assets (clean, shareable artwork), Moment assets, Masterpiece assets
- Light assets, Texture assets
Absolutely NO text baked into shared images — no Hebrew, no numbers; any overlaid line is rendered live and stripped from the exported image.

## AI Logic
Not AI-generated content. `RippleStat` aggregates come from anonymous server-side counts (no per-user attribution). Any belonging copy is drawn from Tone-Guardrail-approved templates and passes the Copy Linter (blocks comparison/competition framing). Never rank, never compare individuals.

## Data Stored
- `RippleStat`: `{ id, date, category, count }` (aggregate, anonymous)
- Local: `shared` boolean per `DailyMoment` (for the user's own reference only)
No social graph, no likes, no identities stored. Copy Hebrew; timestamps ISO 8601. Local-first; aggregates via Supabase, fully anonymized.

## Edge Cases
- Offline: Ripple shows last cached aggregate or hides gracefully; share still works with local artwork.
- Low counts / new category: show a warm generic belonging line, never a lonely "1 person."
- Privacy: sharing never includes the user's Reflection or Journal — artwork only, opt-in.
- No baked text in exports — verify the exported image has zero text.
- RTL: belonging copy renders right-to-left; exported image is text-free.

## Build Requirements
`SocialShareLayer` gated on the flag: Ripple reader for `RippleStat` and a Share button using the Web Share API exporting the text-free `Asset`. Anonymous aggregate endpoint (Supabase). Effort: medium.

## Definition of Done
- [ ] Ripple shows anonymous aggregate belonging, never names or ranks.
- [ ] Share exports a text-free artwork image only, opt-in.
- [ ] No likes, profiles, comments, or comparison exist anywhere.
- [ ] Reflection/Journal are never included in a share.
- [ ] Hebrew belonging copy renders RTL in light and dark.
