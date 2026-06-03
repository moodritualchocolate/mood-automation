# Real Marketing Asset Quality — Phase Report

**Phase:** RMAQ (Real Marketing Asset Quality)
**Branch:** `claude/mood-creative-os-v1-i4Mfv`
**Scope:** Lift the Asset Generator from "text on a gradient" to assets that read as real MOOD marketing creative — formula-correct color, real product references (pouch + chocolate square), human still-life scenes, and a quality guard that blocks renders that don't meet the contract.

**Touched:** rendering layer + quality guard + generator UI + seeds + verifier.
**Did NOT touch:** auth, tenant isolation, security.

---

## Honest scope statement

This system renders **pure SVG composited by Resvg → PNG**. There is no AI image generation. "Real marketing asset" in this phase therefore means:

- **Vector product illustration** of the MOOD pouch (stand-up sachet with formula-correct body color, printed label band, MOOD wordmark, Hebrew formula name, English formula name, 30g net weight) and the MOOD chocolate square (4×4 grid, deep brown gradient, embossed wordmark).
- **Vector human-scene composition** (window-light radial gradient, table edge hairline, hand silhouette that wraps around the pouch in product-and-human mode).
- **Strict color discipline** — when visual mode is not `text-only-editorial`, the canvas uses the formula's canonical palette (drawn from the existing `FORMULA_COLOR_GUIDE` in `lib/brandGuardian.ts`) rather than the operator-picked arbitrary `paletteKey`.
- **A quality guard** that refuses to render text-on-gradient when the operator asked for a product, refuses English in a Hebrew asset, refuses missing CTAs, refuses unknown formulas, and warns on cliché Hebrew CTAs.

This is **not photorealism**. It is **brand-accurate, layout-correct, formula-disciplined SVG**. To move beyond this requires an image-generation provider (Stable Diffusion / Flux / Midjourney) wired in as a separate backend — out of scope for this phase.

---

## 1 · Visual modes (5)

The generator's `visualMode` field is now first-class. Renderer dispatch lives in `src/components/creative-brief-svg.ts`.

| Mode | What renders | Required fields |
|---|---|---|
| `text-only-editorial` | Gradient + Hebrew typography + signature mark. Uses the operator's chosen `paletteKey`. | headline + cta |
| `product-hero` | Large vector pouch + optional chocolate square + typography. Uses formula palette. | headline + cta + `productPresence ≠ none` |
| `human-moment` | Still-life scene (window light + table) + typography. Uses formula palette. | headline + cta |
| `product-and-human` | Hand silhouette holding the pouch + still-life scene + typography. Uses formula palette. | headline + cta + `productPresence ≠ none` |
| `carousel-story` | N slides. Each slide can override `visualMode` + `productPresence` per-slide. | per-slide headline; brief-level cta |

When `visualMode != 'text-only-editorial'`, the renderer **ignores `paletteKey`** and uses `FORMULA_PALETTES[brief.formula]`. The UI surfaces this with the label "(overridden by formula in this mode)".

---

## 2 · MOOD product references (canonical)

Defined in `src/components/creative-brief-imagery.ts` → `FORMULA_PALETTES`:

| Formula | Hebrew | bg₀ | bg₁ | product | accent | cream | Brand-guardian tokens |
|---|---|---|---|---|---|---|---|
| ENERGY | אנרגיה | `#1A0F05` | `#3A1F0A` | `#D08048` | `#FFB155` | `#F2E6D8` | amber · cream · orange |
| FOCUS | מיקוד | `#0E1418` | `#1F3038` | `#5B7C99` | `#A8C5E0` | `#E8EEF2` | slate · paper · blue-gray |
| RELAX | הרגעה | `#180A05` | `#3E1F12` | `#B5654A` | `#E0A085` | `#F2DCC4` | terracotta · amber · rose |
| SLEEP | שינה | `#0A0E1A` | `#1A2235` | `#3A4A6B` | `#7589C2` | `#D8DBE5` | navy · charcoal · indigo |

Each token family is taken straight from `lib/brandGuardian.ts:FORMULA_COLOR_GUIDE`, so an asset rendered in the formula palette automatically satisfies the existing brand-guardian "formula-colors" rule when its production spec is scanned downstream.

**Pouch geometry** (`composeMoodPouch`):
- Stand-up sachet: top heat-seal crimp + curved body + bottom gusset
- Printed label band centered on the body
- MOOD wordmark (`Times New Roman`, letter-spaced)
- Hebrew formula name (`Heebo`, in formula `product` color)
- English formula name (Helvetica, letter-spaced, muted)
- `30g · NET WT` lockup at the bottom

**Chocolate square** (`composeChocolateSquare`):
- 4×4 grid (16 cells), deep brown gradient `#28140A → #5C2E14`
- Hairline grid lines (`#1F0F06`, opacity 0.55)
- Embossed `MOOD` wordmark on the center cell
- Drop shadow + subtle top highlight strip

**Hand silhouette** (`composeHandSilhouette`):
- Forearm rising from below + thumb-wrap path
- Skin tone derived from the formula's `bg1` shaded by −20%
- Only added when `visualMode === 'product-and-human'`

**Still-life scene** (`composeStillLifeScene`):
- Window light: radial gradient from upper-left (palette cream, 22% opacity)
- Table edge: bottom 22% of canvas, dark gradient + hairline
- Added for `human-moment` and `product-and-human` modes

**No invented packaging.** No "limited edition", no "gold edition", no flavors that don't exist. The existing `INVENTED_PRODUCT_PATTERNS` in `brandGuardian.ts` already enforces this rule on prompts; the renderer enforces it by construction (it only knows how to draw the canonical MOOD pouch in the four canonical formula colors).

---

## 3 · Required creative fields

Added to `CreativeBrief`:

```ts
audience?:        string                              // operator description
emotion?:         string                              // operator descriptor
visualMode?:      'text-only-editorial' | 'product-hero' |
                  'human-moment' | 'product-and-human' | 'carousel-story'
productPresence?: 'none' | 'pouch' | 'chocolate-square' | 'pouch-and-square'
subline?:         string                              // explicit alias of `body`
platformSize?:    'banner-1200x628' | 'post-1080x1080' |
                  'story-1080x1920' | 'carousel-1080x1080'
```

All are optional for backwards compat. `body` and `subline` both work. `slides[i]` can also override `visualMode` and `productPresence` per-slide.

---

## 4 · Generator outputs

`POST /api/render` (200 OK) now returns:

| Field | Description |
|---|---|
| `rendered.slides[].pngBase64` | Final image preview, one per slide. Banner: 1200×628 · post: 1080² · carousel: N×1080² |
| `rendered.slides[].svg` | The raw composed SVG, for downstream editing |
| `prompt` | Human-readable prompt — formula, format, audience, emotion, visual mode, Hebrew copy, approved product references, slide list |
| `negativePrompt` | List of forbidden patterns (invented flavors, supplement hype, English text outside allow-list, plain-gradient-when-product-required) |
| `productionSpec` | JSON spec — formula, visualMode, productPresence, copy, formula palette hex, approvedProductReferences, slides with per-slide modes |
| `qualityGuard` | Guard finding list (warnings + rejections) |

The Asset Generator UI surfaces all five with **Copy prompt · Copy negative prompt · Copy production spec (JSON)** buttons. Each slide has its own **Download PNG** anchor.

---

## 5 · Asset Quality Guard

`src/engines/creative-quality-guard.ts` — pure validator that runs **before** rendering. `runQualityGuard(brief): QualityGuardResult`.

| Code | Level | Triggered when |
|---|---|---|
| `product-missing` | **rejection** | `visualMode ∈ {product-hero, product-and-human}` and `productPresence = 'none'` |
| `unknown-formula` | **rejection** | `formula` is not one of `ENERGY · FOCUS · RELAX · SLEEP` |
| `hebrew-required` | **rejection** | `headline`, `subline`, `cta`, or any `slides[i].headline` has no Hebrew letters |
| `english-in-hebrew-asset` | warning | Latin letters appear outside the allow-list (`MOOD`, formula names, units `g/mg/mL`) |
| `headline-too-short` | **rejection** | headline < 6 chars |
| `headline-generic-*` | warning | headline matches a cliché Hebrew CTA pattern |
| `cta-missing` / `cta-too-short` | **rejection** | CTA is empty or < 2 chars |
| `audience-missing` / `emotion-missing` | warning | descriptive fields absent — render still proceeds |

**Rejection blocks render.** `/api/render` returns `422` with the guard findings.
**Warning surfaces to operator.** The operator MAY override (the render still ships); the warnings are recorded on the asset for audit.

The guard is pure — no I/O, deterministic — so it runs identically in the renderer, the seed script, and the verifier.

---

## 6 · Three real MOOD examples

Seeded by `scripts/seed-mood-creative-os.ts` (idempotent — re-running skips already-registered records by summary signature). All three passed the guard, all three were registered as `pending`.

### A. ENERGY · product hero · banner 1200×628

| Field | Value |
|---|---|
| visualMode | `product-hero` |
| productPresence | `pouch-and-square` |
| headline (Hebrew) | בוקר אחד. בלי הצגות. |
| subline | אנרגיה מקקאו שלא צריך להתנצל. |
| cta | התחילו את הבוקר עם MOOD |
| audience | בוגרים 31-49, עירוניים, עייפים מהבטחות |
| emotion | התעוררות שקטה |
| palette | ENERGY formula palette (`#D08048` body, `#FFB155` accent) |

### B. FOCUS · human moment · post 1080×1080

| Field | Value |
|---|---|
| visualMode | `human-moment` |
| productPresence | `none` |
| headline | שקט אחד. מספיק. |
| subline | הקקאו לא מנסה לעצור אותך — הוא יושב לידך. |
| cta | הרגישו את הצלילות |
| audience | עובדי מידע, עומס קוגניטיבי גבוה |
| emotion | הרפיה ממוקדת |
| palette | FOCUS formula palette (`#5B7C99` body, `#A8C5E0` accent, slate ground) |

### C. RELAX · product + human carousel · 5 slides 1080²

| Slide | visualMode | productPresence | Hebrew headline |
|---|---|---|---|
| 01 (cover) | product-hero | pouch | שוקולד שעובד לאט |
| 02 | product-and-human | chocolate-square | יד אחת. פיסה אחת. |
| 03 | human-moment | none | הלילה נהיה רך יותר |
| 04 | product-hero | chocolate-square | יש לזה משקל |
| 05 | product-and-human | pouch | מוכנים לרגע השקט? |

All five carousel slides use the RELAX formula palette (`#B5654A` body, `#E0A085` accent, warm cocoa ground).

---

## 7 · Seed flow

```
$ npx tsx scripts/seed-mood-creative-os.ts
[render]  banner    · product-hero (ENERGY)…
[register] banner   · product-hero    → asset-…-1 · pending
[render]  post      · human-moment (FOCUS)…
[register] post     · human-moment    → asset-…-2 · pending
[render]  carousel  · carousel-story (RELAX)…
[register] carousel · carousel-story  → asset-…-3 · pending

Done — registered: 3, skipped: 0, blocked by guard: 0.
Operator approval required before any of these are published. Human remains final authority.
```

Re-running is idempotent (`registered: 0, skipped: 3`). Guard failures abort the seed with exit code 2.

---

## 8 · Verifier — `scripts/verify-real-marketing-assets.ts`

12/12 cases pass.

| # | Case |
|---|---|
| 1 | product-mode prompt includes pouch + stand-up sachet reference |
| 2 | human-mode prompt labels visualMode + formula |
| 3 | guard rejects product-mode brief with `productPresence: 'none'` |
| 4 | guard rejects English headline on Hebrew asset |
| 5 | guard rejects missing / short CTA |
| 6 | production spec carries the formula's canonical color hex |
| 7 | production spec lists `approvedProductReferences` when product is present |
| 8 | pouch SVG (MOOD wordmark + Hebrew formula) appears in banner + post |
| 9 | all three seed examples pass the Asset Quality Guard |
| 10 | negative prompt forbids invented flavors / hype / plain-gradient |
| 11 | carousel prompt records per-slide visualMode + productPresence |
| 12 | carousel slides honour their per-slide visualMode in the SVG |

---

## 9 · Verifier suite — regression check

| Suite | Result |
|---|---|
| `verify-real-marketing-assets.ts` (new) | 12/12 |
| `verify-product-experience.ts` (PXCO phase) | 10/10 |
| `verify-authentication.ts` | 28/28 |
| `verify-tenant-isolation-hardening.ts` | (was 15/15 last run — not re-run this turn, no code touched in that path) |
| `npm run typecheck` | clean |

No auth, tenant, or security file was modified.

---

## 10 · Success condition

> The system can now generate assets that look like usable marketing creatives, not only abstract editorial posters.

**Status: met within the SVG-rendering envelope.** Assets now show:
- The MOOD pouch as a vector illustration with formula-correct label band, color, and copy
- The MOOD chocolate square as a tactile vector object with grid + emboss
- Human still-life scenes (window light + table edge) for human-moment mode
- A hand wrapping around the pouch for product-and-human mode

**Honest caveat:** these are clean vector compositions, not photographs. To produce photorealistic MOOD assets the same brief + spec pipeline would feed an external image-generation provider — the brief, prompt, negative prompt, production spec, and guard rejections are all designed to be that provider's input contract. That integration is the next phase if the operator wants photorealism.

No publishing. No auto-approval. Operator approval required. Human remains final authority.
