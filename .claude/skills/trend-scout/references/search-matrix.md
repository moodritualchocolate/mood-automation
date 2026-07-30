# Search Matrix

A bank of query templates for the four-lens sweep. Substitute `{category}`, `{market}`, `{audience}`,
`{platform}`, `{month}`, `{year}` before firing. Fire several in parallel; you rarely need all of
them. Always keep the date terms — they're what force fresh results.

## Lens 1 — Platform formats & sounds

- `trending {platform} formats {month} {year} short form video hooks`
- `viral {platform} trends {month} {year} editing style audio sounds`
- `best short form video hooks {year} scroll stopping first 3 seconds`
- `{platform} meme format {month} {year} template`
- `short form video length {year} what performs 30 vs 60 seconds`

## Lens 2 — Niche / category shift

- `{category} trends {year} viral products {market}`
- `{category} gen z {year} what's popular`
- `viral {category} {month} {year} social media`
- `{category} flavor / feature trends {year}` *(swap flavor↔feature for the domain)*
- `{category} market growth {year} consumer trends`

## Lens 3 — Competitors

- `{category} brands competitors {year}`
- `best {category} brands {market} {year}`
- `{category} brand marketing positioning {year} gen z`
- `{leading competitor} vs alternatives {year}`
- `{category} pricing {market} {year}` *(for the competitor table's price column)*

## Lens 4 — Audience & culture

- `{audience} trends {month} {year} {market}`
- `what {audience} cares about {year} social`
- `{market} social media trends {month} {year}`
- `{audience} pain points {category} {year}`

## Market notes

- **`WebSearch` is US-weighted.** For a non-US market, (a) put the market name and, where useful, the
  local language in the query, and (b) `WebFetch` a couple of local publications/retailers directly
  for pricing, brand names, and cultural specifics the US index misses.
- **Hebrew / Israel example:** run both an English market-named query (`… Israel {year}`) and a
  native-language query (`… {category in Hebrew} {year}`) — they surface different sources. Local
  retailers and news sites are good `WebFetch` targets for real competitor names and prices.
- **Recency check:** if a source isn't dated within ~3 months, treat it as background, not "now".
  Re-search with `{month} {year}` or "this week/this month" to pull current material.

## Turning searches into the brief

- Deduplicate across lenses — the same trend often shows up in two searches; that's a strong signal,
  note it as high-confidence.
- Prefer **named** specifics (a brand, a sound, a creator, a format name) over abstractions — they're
  what make the brief actionable and credible.
- Keep every source URL as you go; the brief must cite them.
