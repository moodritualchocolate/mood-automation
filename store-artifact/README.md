# MOOD Store — single-file build

> ## ⛔ Not cleared for launch
>
> **The 30 customer reviews in this build are invented.** The names, the wording and
> the star ratings were written to fill a layout; no real customer said any of them.
> They render with star ratings and a "verified" label, so publishing this build as
> it stands presents fabricated testimonials as genuine customer reviews.
>
> Also invented: the purchase counters — 4,208 / 5,437 / 3,892 beside the price
> on the product pages, and 2,347 on the bundle page. They read as order counts
> and are not.
>
> Replace `R` in `_reviews.py` with real, attributable reviews, then set
> `PLACEHOLDER = False` in that file. The build prints a warning until you do.
>
> Invented social proof is the only thing blocking launch. Everything else in
> the build is real: the photography, the pricing, the formulas and the
> founder's story.

`mood-store.html` is the whole site in one self-contained file: 40 routes, all images,
fonts and scripts inlined. Open it in any browser, or upload it anywhere — it has no
external dependencies.

## What's inside

| Area | Routes |
|---|---|
| Store | `#/` · `#/products` · `#/energy` · `#/relax` · `#/sleep` · `#/ritual` |
| Journal | `#/journal` + 27 article routes (`#/journal/<slug>`) |
| Info | `#/club` · `#/faq` · `#/policies` |

Routing is hash-based, so the file works from `file://` as well as from a web server.

## Rebuilding

The build reads the source pages and assets from a `public/` tree (path at the top of
`build_spa.py` as `PUB`), compresses every referenced image, inlines and de-duplicates
them, then writes `mood_store.html`.

```
python3 build_spa.py
```

- `build_spa.py` — asset pipeline, per-page overrides, cart, shared button system
- `_journal.py` — journal index, 27 article pages and the club page
- `_reviews.py` — the review block and its copy
- `articles.json` — article content extracted from the team's blog handoff

## Before going live

The 30 reviews in `_reviews.py` are **placeholder copy written for layout purposes**.
Replace them with verified customer reviews before publishing — presenting invented
testimonials as real ones is not permitted under Israeli consumer protection law.
