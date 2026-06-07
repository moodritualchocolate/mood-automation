# Productization V1

**Source:** `docs/universal-brand-os.md` (the 10-layer framework).
**Goal:** convert the framework into a SaaS product a non-technical operator can complete in under 15 minutes — from signup to a downloaded marketing kit.
**Method:** screen-by-screen design of an 8-step journey. For each step: what the screen shows, what inputs are collected, what data is produced, what the user does, what the AI does, and how long it takes.
**Date:** 2026-06-05
**No code. No UI implementation. No new strategy. Product design only.**

---

## 0 · The 15-minute promise

The customer journey from *"I signed up"* to *"I received a complete marketing system"* must fit inside **15 minutes**. Any step that pushes total time over 15 minutes is removed from V1.

Target time-budget per step:

| Step | Name | Target time |
|---|---|---|
| 1 | Account creation | 0:30 |
| 2 | Brand onboarding (8 questions) | 4:00 |
| 3 | Strategy generation (automated) | 2:00 |
| 4 | Operator review | 5:00 |
| 5 | Creative generation (automated) | 2:00 |
| 6 | Export / deliverable | 1:30 |
| **Total** | | **15:00** |

Steps 7 (tracking) and 8 (learning) are **not** in V1's 15 minutes. They are post-delivery features. V1 ships the kit; V2 closes the feedback loop.

---

## 1 · Step 1 — Account Creation

**Screen:** single form, vertical layout, max 4 fields visible.

| Field | Input type | Required | Validation |
|---|---|---|---|
| Email | email | yes | format check + uniqueness |
| Password | password | yes | ≥ 12 chars |
| Display name | text | yes | non-empty |
| Brand name | text | yes | non-empty |

**Outputs:**
- `user` record (id, email, password_hash, display_name, created_at)
- `brand` record (id, user_id, name, created_at, status = `pre-onboarding`)
- `session` (cookie set)

**Stored data:**
```
users:    { user_id, email, password_hash, display_name, created_at }
brands:   { brand_id, user_id, name, created_at, status }
sessions: { session_id, user_id, expires_at }
```

**User actions:** type 4 fields, click *"Create my brand"*

**AI actions:** none

**Target time:** 30 seconds

**Exit state:** logged in, brand record created, redirected to Step 2.

---

## 2 · Step 2 — Brand Onboarding (8 questions)

The hardest design problem in the whole product. The Universal Brand OS requires 8 inputs. A non-technical operator must supply them without seeing the words *positioning*, *moment*, *commercial scoring*, or *category*.

**Strategy:** one question per screen. Progressive disclosure. Each question has a friendly example shown inline. *Back* button always available. The operator never sees a 30-field form.

### Screen 2.1 — "What do you sell?"

**Prompt:** *"In one short sentence — what does your business sell?"*

**Input:** text area, max 200 chars

**Examples shown** (rotating, plain text, lifestyle-broad):
- *"Premium dark chocolate."*
- *"Long-term real estate portfolios."*
- *"Running shoes for adults returning to running."*
- *"Productivity software that protects focus."*

**Stored:** `brand.artifact`

**Time:** ~30 seconds

### Screen 2.2 — "Who buys it?"

**Prompt:** *"Who is your customer? Describe them in 1-2 sentences."*

**Input:** text area, max 300 chars

**Examples shown:**
- *"Adults 32-50, urban, parents, with disposable income."*
- *"First-generation wealthy Israelis 40-60 with children 10-25."*
- *"30-50 year olds who used to run but stopped during career or family years."*

**Stored:** `brand.audience_seed`

**Time:** ~40 seconds

### Screen 2.3 — "Why do they buy it?"

**Prompt:** *"What's the practical reason someone buys this?"*

**Input:** short text, max 150 chars

**Examples shown:**
- *"A daily reset after a long day."*
- *"To set up an inheritance for their kids."*
- *"To start running again without injury."*

**Stored:** `brand.functional_reason`

**Time:** ~30 seconds

### Screen 2.4 — "What's the deeper reason?"

**Prompt:** *"Underneath that, what do they really want? What's the emotional payoff?"*

**Input:** short text, max 200 chars

**Examples shown:**
- *"To be present in moments they would otherwise miss."*
- *"To leave something stable for the next generation."*
- *"To feel like a runner again, not someone who used to run."*

**Stored:** `brand.emotional_outcome`

**Time:** ~40 seconds

### Screen 2.5 — "Where do your customers live?"

**Prompt:** *"Where is your audience? Pick the closest match."*

**Input:** two dropdowns — country + primary language

**Examples shown:** no — dropdowns are self-explanatory

**Stored:** `brand.cultural_context` (e.g., `"Israel · Hebrew"`)

**Time:** ~15 seconds

### Screen 2.6 — "What does it cost?"

**Prompt:** *"What's the price range for what you sell?"*

**Input:** radio buttons
- *"Less than $25 / ₪90"* → low
- *"$25-$100 / ₪90-₪370"* → mid
- *"$100-$500 / ₪370-₪1,850"* → high
- *"More than $500 / ₪1,850+"* → very-high

**Stored:** `brand.price_band`

**Time:** ~10 seconds

### Screen 2.7 — "How often do they buy?"

**Prompt:** *"How often does the same customer come back?"*

**Input:** radio buttons
- *"Once. It's a big decision."* → one-time
- *"Sometimes. A few times a year."* → occasional
- *"Often. Every month or so."* → recurring
- *"They subscribe."* → subscription

**Stored:** `brand.frequency_archetype`

**Time:** ~10 seconds

### Screen 2.8 — "Tell us your story (optional)"

**Prompt:** *"What made you start this brand? Skip if you'd rather not say."*

**Input:** text area, max 600 chars, **skippable**

**Examples shown:** *(only on hover or click)*
- *"I spent ten years in rooms I don't remember…"*
- *"My parents lost everything in '08…"*
- *"I stopped running at 33 and tried to start again at 41…"*

**Stored:** `brand.founder_origin_story` (optional · powers Layer 7 founder fields)

**Time:** ~60 seconds (skippable)

---

**Step 2 total: ~4 minutes**

**Step 2 stored data shape:**
```
brand_inputs: {
  brand_id,
  artifact,           // string
  audience_seed,      // string
  functional_reason,  // string
  emotional_outcome,  // string
  cultural_context,   // string
  price_band,         // enum
  frequency_archetype,// enum
  founder_origin_story // string · nullable
}
```

**Exit state:** "Generate my strategy →" button → Step 3.

---

## 3 · Step 3 — Strategy Generation (AUTOMATED)

**Screen:** full-screen loading state. No back button.

**What the operator sees:** a sequence of progress messages that show meaningful work is happening, in their language:

```
✓ Reading your brand     (instant)
○ Finding the category you can own…             (0:00-0:20)
○ Mapping who really buys this…                 (0:20-0:35)
○ Naming the emotional payoff…                  (0:35-0:50)
○ Choosing your emotional territory…            (0:50-1:05)
○ Writing your positioning…                     (1:05-1:25)
○ Discovering 20-30 moments your customer lives in…  (1:25-1:50)
○ Scoring each moment for commercial value…     (1:50-2:00)
○ Designing your product lineup…                (2:00-2:10)
```

The operator never sees the words *Layer 2*, *Layer 7*, etc. The status is in customer language.

**Inputs to AI:** the 8 brand inputs from Step 2.

**AI actions** (parallel where possible):
- **Layer 2 (LLM):** generate 3 category-to-own candidates · 1 category-to-avoid list
- **Layer 3 (LLM):** expand audience seed into full audience profile (positive + negative)
- **Layer 4 (LLM):** derive functional-problem · emotional-problem · positive-desire · identity-avoidance
- **Layer 5 (LLM):** generate 3 emotional-territory candidates with tense + posture
- **Layer 6 (LLM):** generate 3 positioning variants (long-form, one-liner, 3-second test)
- **Layer 7 (LLM):** generate 25 moments × 9 fields, clustered into 4-5 life-context groups
- **Layer 8 (deterministic rule engine):** score every moment on 7 commercial dimensions
- **Layer 9 (deterministic rule engine):** generate 5-12 SKU recommendations across 3 phases, scaled to `price_band` and `frequency_archetype`

**Outputs:** complete strategy stack object stored under the brand.

**Stored data:**
```
strategy_stacks: {
  stack_id, brand_id, version, created_at, generated_at,
  layer_2: {...}, layer_3: {...}, layer_4: {...},
  layer_5_candidates: [...], layer_6_candidates: [...],
  layer_7_moments: [...], layer_8_scoring: [...],
  layer_9_skus: [...],
  status: 'awaiting_review'
}
```

**Target time:** 2 minutes (parallel LLM calls + deterministic functions)

**Exit state:** automatic transition to Step 4. No operator input.

---

## 4 · Step 4 — Operator Review

This is the only step where the operator influences strategic choices. **It is also the step that prevents the product from being "ChatGPT in a wrapper."** Without this audit, the output is generic.

Designed as **4 sub-screens, each with one specific decision**. Operator cannot proceed without each decision; *no* "skip review" path.

### Screen 4.1 — Choose your territory

**Shows:** 3 candidate emotional territories side-by-side as cards.

Each card displays:
- The owned phrase (large)
- The tense posture (small label)
- 2-3 sentences explaining what this territory means in their brand
- 1 example positioning sentence that would result

**Operator action:** click one card. Or: *"None of these — regenerate"* button (regenerates with one extra LLM call).

**Stored:** `chosen_territory_id`

**Time:** ~60 seconds

### Screen 4.2 — Approve your positioning

**Shows:** the positioning derived from the chosen territory. Three things visible:
- The long-form positioning statement (4-5 lines)
- The one-line brand definition (the customer-facing sentence)
- The 3-second test (what the customer reads first)

**Operator action:**
- Inline-edit the one-liner (text field)
- Click *"Approve and continue"*
- Or *"Show me alternatives"* (load next 2 candidates already generated)

**Stored:** `chosen_positioning_text` (the edited or accepted text)

**Time:** ~90 seconds

### Screen 4.3 — Pick your top moments

**Shows:** 25 moment cards in a grid, pre-sorted by commercial score (highest at top).

Each moment card shows:
- Cluster label (e.g., *"Family transition"*)
- Situation (one sentence)
- Hook (one line)
- Commercial score badge (e.g., *"49/70"*)

**Operator action:**
- Each card has three buttons: **Keep · Maybe · Remove**
- A "Keep my top 15" auto-action button (selects the 15 highest-scoring)
- "Add a moment I lived" button (text area · operator adds one moment manually · system fits it into the schema)

**Default state:** top 15 moments pre-marked "Keep" so a fast operator can skip and move on.

**Stored:** `moment_grading: { moment_id: 'keep'|'maybe'|'remove' }`

**Time:** ~180 seconds

### Screen 4.4 — Approve your product lineup

**Shows:** 3 phased columns (Launch / Growth / Expansion), each containing 2-5 proposed SKU cards.

Each SKU card shows:
- SKU name
- Format (pouch / slab / box / subscription / etc.)
- Target price band (system-suggested)
- 2-3 moments this SKU serves (badges)

**Operator action:**
- Each SKU has **Keep / Remove** buttons
- Inline-edit suggested price
- *"Generate my creative kit →"* button at the bottom

**Stored:** `sku_grading: { sku_id: 'keep'|'remove', edited_price: number }`

**Time:** ~70 seconds

---

**Step 4 total: ~5 minutes**

**Exit state:** *"Generate my creative kit"* button → Step 5.

---

## 5 · Step 5 — Creative Generation (AUTOMATED)

**Screen:** loading state, same pattern as Step 3.

```
○ Writing hooks for moment 1 of 15…             (0:00-0:30)
○ Drafting UGC scripts for top 10 moments…      (0:30-0:50)
○ Composing image prompts for top 8 moments…    (0:50-1:15)
○ Building carousel concepts for top 5…         (1:15-1:35)
○ Assembling your kit…                          (1:35-2:00)
```

**AI actions** (parallel):
- For each *kept* moment (up to 15):
  - 3 hook variants in operator's primary language
  - 1 UGC script (15-25 seconds, timecoded)
- For top 10 moments by commercial score:
  - 1 image prompt + 1 negative prompt
- For top 5 moments by hospitality + impulse score:
  - 1 carousel concept with 5 slides
- For 3 moments (highest gift / hospitality / subscription scores):
  - 1 founder narrative angle
  - 1 testimonial angle

**Stored data:**
```
creative_kits: {
  kit_id, brand_id, stack_id, created_at,
  moments: [
    {
      moment_id, hooks: [..3 hooks..], ugc_script: {...},
      image_prompt?: {...}, video_prompt?: {...},
      carousel?: {...}, founder_angle?: {...}, testimonial?: {...}
    },
    ... ~15 moments total
  ]
}
```

**Target time:** 2 minutes (parallel LLM calls)

**Exit state:** automatic transition to Step 6.

---

## 6 · Step 6 — Your Kit (Export & Deliverable)

This is the customer's *"I received it"* moment. **The screen that makes the product feel real.**

**Screen:** dashboard with the deliverable, organized for an operator who is in a hurry.

### Layout (top to bottom)

**Hero:**
- Brand name + one-line positioning (large)
- Single button: *"Download the full kit (PDF)"*

**Tab 1: Strategy summary** *(default tab)*
- The 10-layer stack rendered as a readable document, not raw data
- Section headers: Brand · Category · Audience · Desire · Territory · Positioning · Moments · Commercial · Products
- Each section has a *"copy this"* button
- The full positioning paragraph + the one-line + the 3-second test all visible

**Tab 2: Moments**
- All kept moments as cards
- Sortable by commercial score · cluster · alphabetical
- Each card expands to show the full 9-field schema

**Tab 3: Creative kit**
- Per moment, all generated assets in a single card:
  - The 3 hooks (each with copy button)
  - The UGC script (copy button + duration label)
  - The image prompt + negative prompt (copy button per item)
  - Carousel concept (if generated)
  - The founder + testimonial angle (if generated)
- Per-asset "Mark as used" toggle (for Step 7 manual tracking)

**Tab 4: Products**
- The 5-12 SKU phased lineup as a table
- Recommended phase + recommended price
- Editable

### Outputs the operator takes away

| Output | Format | How it's delivered |
|---|---|---|
| **The Strategy PDF** | 8-12 page PDF, branded, ready to send to a designer / co-founder / agency | One-click download |
| **The Hook library** | All hooks in a single Notion-pasteable or copy-as-text view | Per-hook copy button |
| **The Image prompts** | Each prompt + negative prompt in copy-ready blocks, plus one-click links to common image tools (Midjourney, Krea, Flux on Replicate) — **the tool is launched in a new tab with the prompt pre-pasted where the URL supports it** | Per-prompt button |
| **The UGC scripts** | Timecoded, copy-ready, in operator's primary language | Per-script copy button |
| **The Product roadmap** | Editable table the operator can export to CSV | Download CSV button |

### Critical design rule for Step 6

**Nothing in this screen sends emails, posts to social media, or charges payment processors.** V1 is *generation + export*. The operator manually publishes via their own tools. No integrations in V1.

**Target time on this screen:** 90 seconds to "feel done" · operator typically returns to this dashboard later for deeper exploration.

**Exit state:** the kit is now permanent on the operator's account. Step 7 (Tracking) becomes available as a tab.

---

## 7 · Step 7 — Tracking (V1: MANUAL · V2: AUTOMATED)

**V1 implementation:** simple manual marking. No API integrations.

**Screen:** the "Creative kit" tab from Step 6, but each asset now has:
- A status pill: `Not used` / `Used` / `Published`
- A performance label: `Strong` / `Average` / `Weak` (operator-marked, optional)
- A free-text note field (~140 chars)

**Operator action:** as the operator runs the actual ad campaigns externally, they come back to the dashboard and mark which assets they used and how they performed.

**Stored data:**
```
creative_performance: {
  asset_id, status, performance, note, updated_at
}
```

**No AI actions in V1 tracking.**

**V2 plans** (out of scope for MVP):
- Meta Ads API integration (auto-pull spend / CTR / CPA per asset)
- Google Analytics integration
- Shopify / Wix / WooCommerce integration (auto-pull sales)
- Manual upload of campaign reports
- Slack / email notifications when assets perform above/below threshold

---

## 8 · Step 8 — Learning (V2+ · NOT IN MVP)

**The vision:** performance feedback from Step 7 modifies the engine. Moments whose creative performed well boost in future strategy stacks (same brand or anonymized cross-brand). Moments whose creative consistently failed drop in commercial weighting.

**V2 mechanics (deferred):**
- Per-moment performance score updates the brand's `layer_8_scoring`
- A "Refresh my strategy" button regenerates layers 5-10 with the updated weights
- Cross-brand learning is opt-in only and surfaces as benchmarks ("brands in your vertical found X moment performed best")
- Quarterly "strategy refresh" prompts the operator to re-run with new performance data

**V1 has none of this.** The platform must ship with the customer understanding *"this is your starting kit · come back when you want a refresh"* rather than *"this is a live strategy."*

---

## 9 · The Minimum Viable Product (what must ship)

**Required for V1:**

| Step | V1 status |
|---|---|
| 1 · Account creation | **REQUIRED** |
| 2 · Brand onboarding (8 questions) | **REQUIRED** |
| 3 · Strategy generation | **REQUIRED** — full stack |
| 4 · Operator review (4 screens) | **REQUIRED** |
| 5 · Creative generation | **REQUIRED** — hooks + UGC + image prompts at minimum |
| 6 · Export (PDF + copy buttons) | **REQUIRED** |
| 7 · Manual tracking | **REQUIRED** — minimal "mark as used + performance" |
| 8 · Learning | **NOT IN V1** |

**Explicitly NOT in V1 (defer to V2+):**

- Live image generation inside the product (operator copies prompts to external tools)
- Live video generation
- Direct publishing to Meta / TikTok / Instagram / Google Ads
- Performance API integrations (Meta Ads, GA, Shopify)
- Team accounts / multi-user workspaces (single user per account in V1)
- Custom branding / white-label
- Public API / Zapier integration
- Subscription billing (V1 is one-time purchase only)
- Multi-language UI (V1 ships in English with target-audience-language creative output)
- Analytics dashboard with charts
- Brand-asset upload (logo / photos / brand book) — V1 is generation-only

**Each removed item is removed because:**
1. It would push total time over 15 minutes, OR
2. It would push development cost over the MVP budget, OR
3. The operator can solve it externally without losing the core value (e.g., they paste image prompts into Midjourney themselves)

---

## 10 · MVP screen inventory

The MVP has exactly **13 screens.** That's all.

| # | Screen | Type | Duration |
|---|---|---|---|
| 1 | Signup | form | 0:30 |
| 2-9 | Onboarding questions (8) | wizard, one Q each | 4:00 |
| 10 | Strategy generation loading | progress | 2:00 |
| 11 | Review · Territory (Screen 4.1) | choose 1 of 3 | 1:00 |
| 12 | Review · Positioning (Screen 4.2) | edit + approve | 1:30 |
| 13 | Review · Moments (Screen 4.3) | keep/remove grid | 3:00 |
| 14 | Review · Products (Screen 4.4) | approve lineup | 1:10 |
| 15 | Creative generation loading | progress | 2:00 |
| 16 | Your kit dashboard (Step 6) | dashboard with tabs | 1:30 |

Total: **15 screens / 16:40** (close to budget; tightenable).

If a screen budget is tighter, the four review screens (11-14) collapse to **one paginated review page** with internal tabs — saving 4 screen transitions.

---

## 11 · Pricing model

**V1 pricing recommendation:** one-time purchase, no subscription.

| Tier | Price | What's included |
|---|---|---|
| **Single Brand Kit** | **$249 one-time** | One full strategy stack + creative kit + PDF + 90 days of access to refresh creative |
| ~~Subscription tier~~ | n/a in V1 | Defer until retention data exists |
| ~~Team tier~~ | n/a in V1 | Defer until single-user version stabilizes |

**Why one-time, not subscription:**

- V1 has no learning loop (Step 8 deferred). Without performance feedback driving strategy refresh, monthly recurring value is hard to justify.
- One-time purchase positions the product against the **$5K-$50K strategy consultant** the customer would otherwise hire. $249 vs $5K is the conversion frame.
- Subscription billing infrastructure is excluded from V1 to keep dev cost down. Adding Stripe billing for subscriptions can wait until V1 has 100 paying customers and a measurable retention curve.

**Refresh path (built into the $249):** the operator can re-generate creative (Step 5) up to 3 more times within 90 days against the same strategy stack. This handles the *"the first round wasn't quite right"* case without making the product feel like a one-shot.

**Upsell path (V2):** when subscription ships, the upsell is *"strategy refresh + new moment generation every quarter"* at $49/mo. The original $249 customer is offered a $99 first-year subscription as conversion.

---

## 12 · What "success" looks like at MVP

The MVP succeeds if:

1. **15-minute completion rate ≥ 60%.** Of customers who reach the signup page, 60%+ make it all the way to the kit dashboard within 15 minutes.
2. **PDF download rate ≥ 80%** of customers who reach Step 6.
3. **NPS ≥ 50** on the post-kit survey ("would you recommend this to another founder?").
4. **Conversion from free-preview to $249 ≥ 12%** (assuming a free strategy preview to drive funnel volume).
5. **Refresh-usage rate ≥ 30%** within 90 days (operators returning to regenerate creative).

If those five metrics hold, the platform has product-market fit at the MVP level and can invest in V2 (integrations + learning loop + subscription).

If they miss, the failure modes to diagnose:
- 15-min completion < 50% → onboarding too long → reduce 8 questions to 6 by merging price+frequency, cultural+language
- Download rate < 70% → PDF doesn't feel valuable → improve PDF design / add an *"email this to my team"* button
- NPS < 40 → strategy output is generic → improve Layer 7 LLM constraint quality
- Conversion < 8% → price too high or preview reveals too much → A/B test $149 vs $349
- Refresh-usage < 20% → operators are using the kit elsewhere and not coming back → add an outbound nudge email after 14 days

---

## 13 · The 15-minute promise, audited

Going back to the time budget, here's what the operator actually experiences:

```
00:00 → sees signup page
00:30 → account created · sees Q1 ("what do you sell?")
02:00 → finishes the 4 free-text questions
03:30 → finishes the 4 short-answer / radio questions
04:30 → clicks "generate my strategy"
06:30 → strategy stack appears · sees territory choice
07:30 → picks a territory
09:00 → edits + approves positioning
12:00 → completes moment grading
13:10 → approves product lineup · clicks "generate creative"
15:10 → kit dashboard appears
15:40 → downloads PDF · screen marked complete
```

The 15-minute window is met with 40 seconds to spare for a paced operator. A fast operator finishes in 12 minutes. A slow operator overruns to 18-22 minutes but still completes (no hard timeout).

**No part of the journey is fast for novelty. Every minute is doing real work.**

---

## 14 · What the customer thinks they bought

The customer walks away with a deliverable they understand:

1. **A document they can email to a designer.** (The Strategy PDF.)
2. **A list of one-line hooks they can paste into Meta Ads Manager.** (The hook library.)
3. **A list of image prompts they can paste into Midjourney.** (The image prompts.)
4. **A list of UGC scripts they can hand to a creator.** (The UGC scripts.)
5. **A 12-month product roadmap they can show their co-founder.** (The SKU lineup.)

**They do not think they bought "AI strategy."** They think they bought *the document a strategy consultant would have written for them*, but in 15 minutes and for $249 instead of 6 weeks and $25K.

The product's job is to honor that perception.

---

## 15 · Final answer

> **What is the minimum version that can be sold for money?**
>
> A 13-screen, 15-minute web flow that:
> 1. Collects 8 inputs from the customer.
> 2. Generates a 10-layer strategy stack automatically.
> 3. Requires operator approval on 4 focused decisions.
> 4. Generates hooks + UGC scripts + image prompts + product roadmap.
> 5. Exports the result as a downloadable PDF + copy-pasteable assets.
>
> **Price: $249 one-time.** No subscription, no integrations, no team accounts, no real-time image generation, no performance tracking automation. Three creative regenerations within 90 days are included.
>
> The customer walks away thinking they bought *the document a strategy consultant would have produced* — not *"AI-generated marketing."*

That is V1. Everything else is V2 or later.

No code modified. No engine refactor. No UI implementation. Product design only.
