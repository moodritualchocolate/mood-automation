---
name: content-calendar
description: >
  Turn a brand's goals into a concrete short-form content calendar — content pillars, a posting
  cadence, and a dated slate that maps each slot to a specific angle, format, hook, and the asset it
  needs — then group the slate into efficient production batches. Use this skill whenever the user
  wants a content plan or calendar, asks "what should we post this month", "plan my content", "give me
  a posting schedule", "how often should we post", "batch these", "build a content plan around the
  launch", or needs to turn scattered ideas into a repeatable slate. Trigger it proactively when the
  user has proven a winning angle and needs volume, or when a launch/date is approaching and there's no
  plan. Brand-agnostic: reads brand, launch dates, platforms, and audience from the project, sources
  angles from `trend-scout`, and hands batches to the video pipeline / `campaign-builder`.
---

# Content Calendar

Consistency beats intensity. One great video is luck; a **repeatable system that ships good videos on
a cadence** is how a brand compounds an audience. Sporadic posting starves the algorithm and the
audience; a plan turns strategy into shipped output and makes production efficient by batching similar
work. This skill builds that plan — not a vague "post 3x/week", but a dated slate where every slot
already knows what it is.

## Step 1 — Inputs

Establish, from project instructions or a short exchange:
- **Goal & phase** — pre-launch buzz, launch, sustain, sale? (e.g. MOOD launches 12.8 — pre-launch is
  a countdown arc.) The goal shapes the mix.
- **Platforms & cadence** — where, and how often *realistically sustainable*. Better to hold a
  cadence you can keep than to burn out. A tight, consistent 3/week beats a heroic 7 that collapses.
- **Key dates** — launch, drops, holidays, cultural moments to trend-jack.

## Step 2 — Define content pillars (the repeatable buckets)

Don't invent every post from scratch — define **3–5 pillars** the audience will recognize, and rotate
them. A healthy short-form mix balances reach, trust, and conversion:
- **Contrarian / education** — the bold claim, the myth-bust (reach + authority).
- **Product / craft** — the thing itself, made desirable (conversion).
- **Founder / behind-the-scenes** — trust and story (connection).
- **Trend-jack** — riding a current format/sound (reach; sourced from `trend-scout`).
- **Community / UGC / testimonial** — social proof (trust; grows post-launch).

Name the pillars for *this* brand and note roughly what share of the calendar each gets.

## Step 3 — Build the dated slate

Lay out the calendar so every slot is already briefed — this is what makes it executable:

```
# Content Calendar — {brand} · {month/phase}
Cadence: {e.g. Reels ×3/wk} · Pillars: {…}
| Date  | Platform | Pillar        | Angle (from trend-scout)        | Format          | Hook (on-screen)        | Asset needed        | Status |
|-------|----------|---------------|---------------------------------|-----------------|-------------------------|---------------------|--------|
| 12.1  | Reel     | Contrarian    | "everyone adds caffeine…"       | HyperFrames     | "25 מ״ג. וזה מספיק."     | (built)             | ✅     |
| 12.3  | Reel     | Trend-jack    | absurdist substitution          | footage         | "— קפה. — לא, זה."       | founder clip        | 🎬     |
| …     |          |               |                                 |                 |                         |                     |        |
```

- Pull the **angles from `trend-scout`** so the slate rides current trends, not evergreen guesses.
- For a launch, structure an **arc** (tease → build → reveal → sustain), not random posts — the dates
  should tell a story toward the launch day.
- Mark each slot's **asset dependency** honestly (already built / needs footage / needs product
  photo), because that drives the next step.

## Step 4 — Batch for production efficiency

The calendar's hidden value is **batching**: group slots by how they're made so you produce many at
once instead of context-switching per post.
- Group all **HyperFrames/product-led** pieces → one production sprint (they reuse the same project +
  brand assets; `campaign-builder` spins format variants 9:16 / 1:1 / 4:5 from one composition).
- Group all **footage-led** pieces → one shoot day.
- Group all **captions/hashtags** → one `caption-seo` pass across the slate.

State the batches explicitly so the user can execute a week of content in one sitting.

## Output & handoffs

Deliver the pillars + the dated slate table + the batch groupings. Then hand off:
- Angles/gaps → `trend-scout`   ·   Scripts → `scriptwriter`   ·   Production → HyperFrames / the
  video pipeline   ·   Variants → `campaign-builder`   ·   Copy → `caption-seo`   ·   After posting →
  `performance-analyst`, whose lessons feed the *next* calendar.

Rules:
- **Every slot is briefed** (angle + format + hook + asset), never a bare "post something".
- **Sustainable cadence over heroic cadence** — plan what will actually ship.
- **Batch explicitly** — an unbatched calendar is a wish list; a batched one is a production plan.
- The calendar is a living loop: revisit it with `performance-analyst`'s data and double down on what
  the numbers reward.
