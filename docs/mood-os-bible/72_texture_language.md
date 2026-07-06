# 72 — Texture Language

> The tactile surface of MOOD — grain, weave, paper, skin, wood — that makes every image feel touchable and hand-made.

## Purpose
Texture Language defines the material feel of MOOD imagery: the softness of linen, the tooth of paper, warmth of wood, the film grain over it all. It exists so images feel physical and hand-touched rather than digital and slick, deepening intimacy and reinforcing the timeless, painterly-photographic finish that unifies the whole Library.

## User Experience
The user feels MOOD as much as sees it. On **Today / Daily Moment** surfaces look touchable — a worn tabletop, a soft blanket, steam and grain in the air. Backgrounds carry a gentle texture that quiets busy areas and cradles the Hebrew text without stealing from it (e.g. "החום של הבד" — "the warmth of the cloth"). Nothing looks plastic, flat, or over-rendered.

## Game Mechanic
Texture Language serves loop station 4 by making Moments feel real enough to touch, and by providing calm textured fields for the text layer. Fixed texture rules:
- **Surfaces:** natural materials — wood, linen, paper, ceramic, skin, glass, water.
- **Finish:** fine analog grain + subtle painterly brush feel over the photograph.
- **Contrast:** texture is felt, never noisy; it must not reduce text legibility.
- **Depth:** near textures crisp, far textures soft (pairs with Ch. 67 focus).
- **Function:** textured negative space becomes the quiet backdrop for app text (Ch. 73).

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library
- Patterns

## Visual Assets Needed
- Texture assets (primary), Masterpiece assets, Moment assets, Home assets, Object assets, Light assets. No text baked into any image.

## AI Logic
Injects texture tokens into Grok: `natural material surfaces, fine analog grain, subtle painterly brush finish, tactile, soft`. Negative prompt: `no plastic sheen, no digital flatness, no HDR gloss, no noisy over-detail, no text`. Texture supports mood; it never encodes information or copy.

## Data Stored
`Asset.styleTokens`: `surfaceMaterials[]`, `grainProfile`, `brushFinish`, `textureContrast`. `negativeSpaceRegion` often lands on a calm textured field. Local-first; optional Supabase sync.

## Edge Cases
- Plastic/CGI sheen → reject, add material tokens.
- Texture so busy it drops text contrast → reduce, regenerate.
- Uniform flat areas that look digital → add subtle grain.
- Dark mode: verify texture doesn't crush to noise on dark UI.

## Build Requirements
- `texture-tokens.ts` material + grain presets.
- Text-contrast QA over the negative-space region.
- Effort: S.

## Definition of Done
- [ ] Surfaces read as real, touchable materials with subtle grain.
- [ ] No plastic, CGI, or HDR-gloss finishes.
- [ ] Texture never drops overlaid Hebrew text below AA contrast.
- [ ] Textured negative space reads calm, not noisy.
