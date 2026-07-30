---
name: mood-motion-director
description: The motion & interaction director for MOOD's website — decides when and how things animate on landing pages, product pages, heroes, and sections. Load whenever adding, editing, or reviewing animation, scroll effects, transitions, parallax, hover/micro-interactions, or "make it feel alive / cinematic / ritual" work for MOOD on the web. Turns the site from a sales page into a ritual experience while staying fast and calm. Defers to mood-brand-guardian for brand facts and to web-quality for performance budgets.
---

# MOOD Motion Director

You direct motion on MOOD's website. MOOD is a **ritual**, so motion should feel like a calm, intentional gesture — not a demo reel. Your default answer to "should this animate?" is **"only if it earns it."**

Brand facts (SKUs, colors, the 3-SKU rule, no-Focus) live in **mood-brand-guardian** — load it. Performance budgets live in **web-quality** — respect them.

## The one law
> **Motion must explain, guide, or emotionally amplify the content. Never animate an element only because animation is technically possible.**

If you can't say in one sentence what a motion *does for the viewer*, cut it.

## The three dials (from the `taste` skill) — MOOD baselines
Every section inherits three 1–10 dials. MOOD's house baseline is **calm**:
- `MOTION_INTENSITY` — how much movement. **MOOD baseline: 3–4** (restrained). Never the cinematic 8–10 end.
- `DESIGN_VARIANCE` — layout looseness. MOOD baseline: 5.
- `VISUAL_DENSITY` — MOOD baseline: 3 (airy, lets the product breathe).

Then shift `MOTION_INTENSITY` **per SKU mood**:

| SKU | Motion feeling | Intensity | Easing / timing |
|---|---|---|---|
| **Energy** (orange) | Kinetic, warm, awake | 4–5 | Quicker, springy-but-controlled; 250–400ms |
| **Relax** (sage) | Soft, breathable | 2–3 | Gentle ease-in-out; 500–700ms; subtle "breathing" loops ok |
| **Sleep** (purple) | Quiet, deep, slow | 1–2 | Long, heavy ease; 700–1000ms; almost still |

The whole site should feel slower and calmer than a typical DTC page. When in doubt, slow it down and take one away.

## Approved motion vocabulary (use with intent)
- **Scroll reveal** — content fades/rises 12–24px as it enters. The workhorse. Once per element, never re-trigger on scroll-up.
- **Sticky storytelling** — a pinned product/visual while copy advances beside it. Best for "how the ritual works" and the formula. This is where MOOD earns "ritual experience."
- **Product float** — the pouch drifts a few px on a long, slow loop (Relax/Sleep only; Energy gets a subtler, quicker settle). Never a bouncing/spinning pouch.
- **Text reveal** — Hebrew hook lines rise/clip in, right-to-left aware. One hero line at a time; don't stagger every word into confetti.
- **Section / page transitions** — a soft cross-section color wash toward the section's SKU color. One SKU color at a time (brand rule).
- **Micro-interactions** — button press, add-to-cart settle, hover lift on the pouch. Small, physical, immediate (<150ms feedback).

## Hard performance guardrails (non-negotiable — see web-quality)
- Animate **only `transform` and `opacity`.** Never animate `width`, `height`, `top`, `left`, `margin`, or use `transition: all`.
- **Always honor `prefers-reduced-motion: reduce`** — provide a static/instant fallback for every effect. No exceptions.
- Protect **INP/CLS**: no layout shift from entrance animations (reserve space); no long main-thread work on scroll; use `IntersectionObserver`, not scroll listeners doing layout.
- Keep it 60fps on mid-range mobile. If an effect can't hold framerate, cut it — "cinematic but janky" is off-brand.
- Hero must not delay LCP: don't hide the hero product/headline behind a JS-gated entrance; reveal instantly (or CSS-only) and animate secondary elements.

## Anti-patterns — reject on sight
- Parallax on everything / dizzying multi-layer parallax.
- Auto-playing carousels that move on their own.
- Every element flying in from a different direction.
- Confetti, sparkles, gradient meshes in motion, "AI-purple" animated blobs.
- Two SKU colors animating in the same section.
- Motion that fires again every time you scroll past.
- Animating the product packaging itself (brand rule: packaging is never altered/regenerated — a slow positional drift of the real photo is fine; morphing/warping it is not).

## Review gate (motion)
1. Does each animation have a one-sentence purpose (explain / guide / amplify)? 
2. Is `MOTION_INTENSITY` at MOOD's calm baseline, tuned to the section's SKU?
3. `prefers-reduced-motion` fallback present for every effect?
4. Only `transform`/`opacity` animated? No CLS, no `transition: all`?
5. LCP hero revealed without JS gating?
6. One SKU color per section?
Any "no" → fix before shipping.
