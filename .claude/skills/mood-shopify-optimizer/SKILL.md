---
name: mood-shopify-optimizer
description: Build and optimize MOOD's Shopify store — theme sections (Liquid / Online Store 2.0), product & collection page CRO, checkout, app discipline, performance, metafields, RTL Hebrew, and Shopify-specific SEO. Load when moving MOOD from prototype to Shopify, building or editing the theme, optimizing PDPs/collections, or improving store speed/conversion. Defers to mood-brand-guardian for brand, mood-conversion-storyteller for narrative, web-quality for performance, and geo-ai-search for discoverability.
---

# MOOD Shopify Optimizer

For taking MOOD from prototype to a live, fast, on-brand, high-converting Shopify store. Brand facts, motion, narrative, and performance budgets live in their own skills — load them; this skill owns the **Shopify-specific** layer.

## Architecture — build it the Shopify-native way
- Use **Online Store 2.0**: JSON templates + sections + blocks + theme settings. Merchant-editable, no code changes for content tweaks.
- **Prefer native theme sections over page-builder apps.** Page builders (and most apps) inject JS/Liquid that tanks performance and fights the brand system. Every app is a liability until proven otherwise.
- Structure PDP/collection/home as composable sections so the `mood-conversion-storyteller` arc (Curiosity→Recognition→Desire→Proof→Ritual→Purchase) maps to reorderable blocks.

## Performance discipline (the #1 Shopify failure mode)
- **App sprawl is the enemy.** Each app adds render-blocking JS/CSS. Audit every app: does it earn its performance cost? Remove or replace with native.
- Lazy-load below-fold images/sections; use Shopify's responsive `image_url` with `width`/`srcset`; serve modern formats.
- Measure with **web-quality** (LCP/CLS/INP). A "cinematic" MOOD store must still pass CWV — motion via `mood-motion-director` (transform/opacity, reduced-motion).
- Defer non-critical third-party scripts (reviews, analytics, chat).

## Product page (PDP) CRO
- Above the fold: one SKU color on cream, correct `mood` logo, **real product photography** (never altered/AI packaging — brand rule), Hebrew-native hook.
- Sticky **Add-to-Cart on mobile**; clear single primary action.
- Ritual framing over spec-dump: lead with the moment (16:30 / evening / night), specs (70%, 30×7g, ~25mg) as Proof lower down.
- Reviews (e.g. Judge.me / Loox) placed at **Proof**, once real; pre-launch use founder honesty, not fake reviews.
- Subscription UX (if used): honest, easy to cancel, no dark patterns; soft CTAs only ("אולי הגיע הזמן"), never "BUY NOW".

## Structured data with metafields
- Store the functional data as **metafields**: Reg Max™ formula, ingredients, ritual moments, caffeine per square, SKU line/color. Reusable across theme + feeds + `geo-ai-search` schema.
- Drive `Product`/`FAQPage` JSON-LD from metafields for SEO + AI-search citability.

## RTL Hebrew + locale
- Confirm the theme genuinely supports **RTL** (not just translated strings) — test every section. Heebo/Assistant per brand.
- ILS pricing/format; free-shipping threshold and shipping clarity in Hebrew.

## Checkout
- Shopify checkout is largely fixed (esp. non-Plus) — **don't over-customize**; use native. Make shipping cost, free-shipping threshold, and timing obvious *before* checkout to cut abandonment.

## Shopify SEO / GEO
- Clean product URLs; avoid duplicate collection-filter URLs (canonical/`noindex` the facets); product schema from metafields; fast SSR content for AI crawlers (see `geo-ai-search`).

## Anti-patterns — reject
- Installing an app when a native section would do.
- Page-builder bloat that breaks CWV or the brand system.
- Altering/regenerating product packaging images (brand rule).
- Mixing two SKU colors on one page; showing Focus on the web (3 web SKUs only).
- Hard-sell CTAs, fake urgency, fabricated reviews.

## Gate
1. Native sections over apps? Every app justified on performance?
2. PDP passes CWV (web-quality) and brand gate (mood-brand-guardian)?
3. Sticky mobile ATC, ritual-first, single SKU color, real photos?
4. Metafields drive structured data + schema?
5. RTL Hebrew verified across sections; ILS + shipping clarity?
6. Checkout native and friction low?
