---
name: trend-scout
description: >
  Live trend, virality, and competitor research for the active brand or channel — pulls what is
  actually trending RIGHT NOW (platform formats, sounds, hooks, niche/category shifts, cultural
  moments) plus a competitor scan, and turns it into ready-to-shoot viral angles with hooks and
  source links. Use this skill whenever the user wants to find trending or viral content, research
  what's hot, do a trend report, scan competitors, find viral hooks or formats, decide what to post
  to get views, "trend-jack", or asks "what's trending", "what should we make that will pop",
  "find me something viral", "who are our competitors and what are they doing", "give me viral
  ideas". Trigger it proactively before scripting or producing any social/short-form content so the
  concept rides a real, current trend instead of a generic idea — even if the user doesn't say the
  word "trend". Brand-agnostic: it reads the active project's brand, niche, and audience from the
  project instructions, so it works for any brand, product, or channel.
---

# Trend Scout

Generic content dies in the feed. Content that rides a **current, real** trend gets distribution for
free. This skill's job is to replace guesswork and stale ideas with live evidence: what is trending
this week, what competitors are doing, where the white space is — and then hand back concrete viral
angles the user can shoot, each anchored to a source so it's defensible, not vibes.

The whole value is **recency + specificity**. A trend brief that could have been written last year is
a failure. Always search for the current month/season, name real formats/sounds/brands, and cite
links.

## Step 1 — Lock the brand context (don't skip, don't over-ask)

Before searching, know four things about who this is for:

- **Brand / product** — what it is, the category
- **Niche** — the content lane (e.g. functional food, fitness, SaaS, beauty)
- **Audience** — who you're trying to reach, and where (TikTok / Reels / Shorts / X / LinkedIn)
- **Market / language** — geography and language of the audience

Read these from the **active project's instructions** first (most brand/channel projects document
them). Only if they're genuinely missing, ask the user **one** compact question to fill the gaps —
don't interrogate. If the user already named the brand in-conversation, use that.

## Step 2 — Run the four-lens sweep (in parallel)

Trends hide in different places, so search four lenses at once rather than one generic query. Fire
these as parallel `WebSearch` calls (and `WebFetch` the 1–2 richest results per lens when a summary
isn't enough). **Always inject the current month + year** into queries — the model's default is to
search timelessly, which returns stale results.

1. **Platform formats & sounds** — what shape of content is winning right now on the audience's
   platform: trending formats, editing styles, meme templates, audio/sounds, hook patterns, ideal
   length. *(e.g. "trending TikTok Reels formats {month} {year} short form hooks")*
2. **Niche / category shift** — what's moving in the product's category: new product trends, viral
   products, flavor/feature trends, cultural conversations. *(e.g. "{category} viral trend {year}
   gen z {market}")*
3. **Competitors** — who else plays here, their positioning, their claims, their price, how they
   market. Name them. *(e.g. "{category} brands competitors {year} marketing positioning")*
4. **Audience & culture** — what the target audience is talking about, memeing, or feeling right now
   that a brand can authentically tap. *(e.g. "{audience} {market} trends {month} {year}")*

Query templates and market-specific tips live in `references/search-matrix.md` — read it when you
want more angles or the first sweep comes back thin.

**Recency discipline:** if results look older than ~3 months, re-search with a tighter date term.
Prefer sources dated within the current season. Note the date of anything you cite.

## Step 3 — Find the wedge (this is the real work)

Raw trends aren't a strategy. Cross-reference what you found:

- **Where does the brand's truth meet a rising trend?** The strongest angle is where the product is
  *genuinely* aligned with something already climbing — that's a tailwind, not a stretch.
- **What is every competitor saying the same way?** Sameness is opportunity. If the whole category
  makes one claim, the contrarian/inverted claim is often the viral one.
- **What white space is nobody occupying?** A format, a language, a sub-audience, a tone.

State the wedge in one or two sharp sentences. It should feel like a strategic call, not a summary.

## Step 4 — Deliver the Trend Brief (fixed structure)

Output exactly this shape so it's scannable and reusable. Keep it tight — evidence over prose.

```
# Trend Brief — {brand} · {month} {year}

## 📡 Trend Radar (what's hot NOW)
- {format/sound/behavior} — one line on what it is + why it's winning [source]
- … (4–7 items across the four lenses)

## 🥊 Competitor Scan
| Brand | Positioning / claim | Note (price, angle, weakness) |
(name real competitors; end with one line on the category's shared blind spot)

## 🎯 The Wedge
{1–2 sentences: where the brand's truth meets a live trend / the contrarian claim / the white space}

## 🚀 Viral Angles (each rides a real trend)
1. **{angle name}** — the concept in 1–2 lines · rides: {named trend} · ready hook: "{scroll-stopping line, in the audience's language}"
2. … (3–5 angles, ranked strongest first)

## Sources
- markdown links to everything cited
```

Rules that keep the brief useful:

- **Every viral angle names the trend it rides.** "It's funny" is not a trend; "rides the {named}
  substitution format" is.
- **Hooks are in the audience's language**, first-person and specific — not translated ad copy. If
  the market is Hebrew, the hooks are Hebrew.
- **Rank the angles.** Lead with the one with the best trend-fit × brand-truth, and say why in the
  concept line.
- **Cite sources.** No link, no claim. It's what makes the brief trustworthy and re-checkable.

## Step 5 — Hand off (offer, don't assume)

The brief is ammunition, not the finished asset. Once it's delivered, offer the natural next step and
let the user pick an angle before producing anything:

- Turn a chosen angle into a full script → the `scriptwriter` skill (or the project's scripting flow)
- Produce it as a video → `hyperframes` / the filmmaker skills
- Build a static creative → the project's banner/design skill

Do **not** jump straight to production. The point of scouting is that the user chooses the angle with
the evidence in front of them.

## Notes on tools and honesty

- This skill depends on live web access (`WebSearch` / `WebFetch`). If the environment has no web
  access, say so plainly and offer to work from the user's own knowledge instead of inventing
  trends — a fabricated trend is worse than none.
- `WebSearch` may be region-limited; when researching a non-US market, lean on market-named queries
  and `WebFetch` of local sources, and flag any gap rather than papering over it.
- Never present a stale or invented trend as current. The entire premise is *now* — protect it.
