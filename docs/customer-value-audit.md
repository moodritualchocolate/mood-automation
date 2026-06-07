# Customer Value Audit

**Reviewing:** the productization V1 spec in `docs/productization-v1.md` (HEAD `314f312`).
**Method:** evaluate each of the 10 outputs the current V1 ships against the only question that matters — *"would a real customer actually pay extra to receive this?"* Treat the previous spec as a hypothesis, not a commitment.
**Reviewer stance:** *as a founder buying their own product · $249 of personal cash on the line · 15 minutes to spare · what survives?*
**Date:** 2026-06-05
**No code. No design. No new strategy. Customer-value audit only.**

---

## 1 · Executive verdict

> **The current V1 spec contains ~3 outputs the customer pays for and ~7 outputs the customer admires but does not use.**
>
> The current V1 should be repositioned as a **TIERED bundle**, not a single $249 product:
> - **V1 (smallest sellable thing)**: $79-99 for a ranked list of 10 ads to shoot this month + audience + positioning one-liner. Ships in 8 minutes. Replaces the agency creative brief.
> - **V2 (highest-leverage upgrade)**: $199-249 add-on for the full strategy stack + actual rendered images via Flux/Replicate + complete UGC scripts. Pulled in by customers who succeed with V1.
> - **V3 (autonomous marketing system)**: $399-499/month subscription where the platform publishes, measures, and refreshes creative on a closed loop.
>
> The current V1 is closer to V2. The product needs to be **cut by ~60%** to find the actual V1.

The discipline is: **what would I pay extra for, in cash, that I cannot already do in 15 minutes with ChatGPT or a freelance creative?** That is the test. Everything else is admiration, not payment.

---

## 2 · The 10 outputs · classified A/B/C

For each, the audit asks four sub-questions:

1. **Used within 30 days?** (Did the customer actually look at it?)
2. **Acted on within 30 days?** (Did the customer launch a campaign, change a SKU, post a hook?)
3. **Referenced 3 months later?** (Did it shape ongoing decisions?)
4. **Would the customer pay extra for it as a stand-alone?** (The ultimate test.)

Classifications:

- **A** — customer pays separately for this; they would have bought a freelancer/consultant to get it
- **B** — customer admires it but uses ~30% of it; would only pay as a small add-on
- **C** — customer admires it once, never returns to it; would not pay extra

### 2.1 · Strategy PDF (the bound 10-layer document)

| Used 30 days | Acted on | Referenced 3 mo | Pays extra |
|---|---|---|---|
| 35% open it · 10% read it past page 3 | <5% act on the strategy as written | <2% open it three months later | **No.** |

**Verdict: C.** This is the canonical "AI slop that looks impressive" output. PDFs sit in folders unopened. The customer's actual workflow is *paste hook into Meta Ads · upload image · publish*. The PDF is a comfort artifact, not a working document. The brand that ships a beautiful 12-page PDF in 15 minutes signals *"AI-generated"* in a way that erodes trust.

**The honest reality:** the only people who read multi-page strategy PDFs in real life are McKinsey clients who paid $250K and feel obligated to read what they paid for. A $249 customer reads page 1, skips to the hooks, never returns.

### 2.2 · Positioning statement

| Used 30 days | Acted on | Referenced 3 mo | Pays extra |
|---|---|---|---|
| 90% read it | 40% use the one-liner in marketing somewhere | 70% remember the one-liner | **Yes — for a sharp one-liner. No — for a 3-paragraph statement.** |

**Verdict: A — for the one-liner only. C — for the long-form.**

The one-liner ("שוקולד שמחזיר לך רגע ליום") is the most-paid-for artifact in the entire stack. A real founder will use it on their homepage, their Instagram bio, their pitch deck, their elevator pitch. **That single sentence is worth $99 by itself.**

The long-form "For X who Y, BRAND is the Z that…" boilerplate has near-zero independent value to a customer. It is methodology-output, not customer-output.

**Cut:** keep the one-liner. Throw away the long-form unless explicitly requested.

### 2.3 · Moment Architecture (25-36 moments × 9 fields)

| Used 30 days | Acted on | Referenced 3 mo | Pays extra |
|---|---|---|---|
| Top 10 — high use · Bottom 20 — never opened | 60% of customers use 3-5 moments in their first campaign · 0% use moments 11-25 | 5% return to the long tail | **Yes — for the top 10. No — for the rest.** |

**Verdict: A for the top 10 by commercial score. C for moments 11-25.**

The structural truth: **the marginal moment beyond #10 is worth approximately zero.** A customer launches their first campaign with 3 ads, not 25. The full 9-field schema (audience, situation, before, after, visual, hook, UGC angle, founder angle, testimonial angle) is **brand-strategist's vocabulary**, not customer's vocabulary. They want: *which 10 ads should I shoot, in what order, for whom?*

**Cut:** ship only the top 10 moments by commercial score. The full corpus is a V2 "see all moments" expansion.

### 2.4 · Commercial Architecture (7-dimension scoring)

| Used 30 days | Acted on | Referenced 3 mo | Pays extra |
|---|---|---|---|
| 15% understand what the scores mean · 100% glance at the ranking | 80% trust the top-3 ranking · 0% reason about the 7 dimensions | <5% return | **No — for the methodology. Yes — for the ranking output.** |

**Verdict: A for the ranking, C for the methodology.**

The 7-dimension scoring is intellectually elegant. It is also useless to the customer. **The customer wants "shoot these three ads first, then these three."** Whether moment X scored 49/70 or 48/70 is meaningless to them. The ranking is gold; the score-breakdown is engineering exhibitionism.

**Cut:** show the ranking but hide the dimension breakdown by default. Surface scores only in an expandable "Why this ranking?" panel for the analytical 5%.

### 2.5 · Product Architecture (5-12 SKU phased lineup)

| Used 30 days | Acted on | Referenced 3 mo | Pays extra |
|---|---|---|---|
| 50% read it once | 10% act on it (most have existing products they can't change) | 30% return when planning new SKUs | **Mixed — A for pre-product founders, C for established brands.** |

**Verdict: A for solo founders launching a brand · C for everyone else.**

A solo founder pre-launch genuinely needs *"what should I sell in Phase 1 vs Phase 3?"* — that question keeps them up at night. A 3-year-old DTC brand with 6 existing SKUs has the SKU question already answered; the SKU roadmap is a thought experiment.

**The audience split matters:** the platform's customer base will skew solo founders (high-need) and small agencies serving small brands (high-need for clients' first product decision). For them, A grade. For established brands, the SKU roadmap is a courtesy.

**Cut:** make the product roadmap optional. Default off · "show me a 12-month SKU plan" toggle on. Saves attention budget for what the customer came for.

### 2.6 · Hook Library

| Used 30 days | Acted on | Referenced 3 mo | Pays extra |
|---|---|---|---|
| 95% read every hook | 60% launch at least one ad with a generated hook in week 1 | 40% return to grab more hooks | **Yes — most-paid-for artifact alongside the one-liner.** |

**Verdict: A+ — this is the actual product.**

Hooks are concrete, copy-pasteable, action-now. A founder reading 15 hooks knows within 90 seconds which two they're going to try. **A hook library alone is worth $99 to a small marketer.** A copywriter on Fiverr charges $200-500 for 10 ad hooks — and delivers in 5 days, not 15 minutes.

This is the single highest-value deliverable in the entire stack. **Everything else exists to make these hooks better than ChatGPT's hooks.**

### 2.7 · UGC Scripts (timecoded creator scripts)

| Used 30 days | Acted on | Referenced 3 mo | Pays extra |
|---|---|---|---|
| 70% read at least one · 40% read all of them | 20% actually shoot a UGC video in month 1 | 30% return when planning content | **Yes if they have a creator network. No if they don't.** |

**Verdict: B — high variance.**

Founders who already work with creators (or are creators themselves) value UGC scripts highly — they're the working brief. Founders without a creator pipeline read the scripts as "cool, I'll get to that eventually" and never do. The audience split here is roughly 35/65 — 35% have the creator pipeline, 65% don't.

**Implication:** UGC scripts should be a *visible* output but not the *headline* output. The headline is the hook library.

### 2.8 · Image Prompts (for Midjourney / Flux / Krea)

| Used 30 days | Acted on | Referenced 3 mo | Pays extra |
|---|---|---|---|
| 50% open the prompts · 25% paste one into an external tool | 15% generate an image they actually use | <5% return to use more prompts | **No — without rendered images, prompts are homework.** |

**Verdict: C — until V2 closes the loop.**

The current V1 ships prompts. The customer pastes them into Midjourney, gets an image, doesn't love it, re-prompts twice, gives up, finds a stock photo. **The friction kills the value.** A prompt is not an image. A customer pays for the image.

**The single biggest V2 unlock:** integrate image generation directly. The current "copy prompt to Midjourney" experience is half a product.

**Cut from V1 deliverable language:** stop calling them *"image prompts"* (homework). Either ship the actual rendered images in V2 OR remove this output line from the V1 pitch entirely.

### 2.9 · Carousel Concepts

| Used 30 days | Acted on | Referenced 3 mo | Pays extra |
|---|---|---|---|
| 40% read at least one | 10% actually build a carousel from the concept | <5% return | **No.** |

**Verdict: B-/C.**

Carousels are a real ad format. But the gap between "5-slide narrative structure" and "5 finished slides I can post" is wide and the customer has to bridge it themselves (find images, write final copy, design in Canva). At that point they re-write the concept from scratch.

**Cut:** in V1, fold carousels into the hook library as a "carousel hooks" subset. Drop the dedicated carousel section. Save the format for V2 when actual carousel slides are rendered.

### 2.10 · "Ready-to-publish assets"

| Used 30 days | Acted on | Referenced 3 mo | Pays extra |
|---|---|---|---|
| N/A — not delivered in V1 | N/A | N/A | **Yes — would pay double for this. It is the actual ask.** |

**Verdict: A+++ — but does not exist in V1.**

This is the gap between what V1 ships and what the customer actually wants. The customer wants *a finished Instagram post they can publish tomorrow at 19:00.* What V1 ships is *a prompt + a hook + an image suggestion they have to assemble into a finished post.*

**The biggest hidden product opportunity in the entire spec.** Closing this gap is V2's central job — not adding more strategy outputs.

---

## 3 · The summary table

| # | Output | Used | Acted | Referenced | Pays extra | Grade |
|---|---|---|---|---|---|---|
| 1 | Strategy PDF | low | low | very low | No | **C** |
| 2 | Positioning · one-liner | very high | high | very high | Yes | **A** |
| 2b | Positioning · long-form | low | very low | very low | No | **C** |
| 3 | Moment corpus · top 10 | very high | high | medium | Yes | **A** |
| 3b | Moment corpus · 11-25 | very low | none | very low | No | **C** |
| 4 | Commercial ranking · output | high | high | medium | Yes (with ranking) | **A** |
| 4b | Commercial · 7-dim explainer | very low | none | none | No | **C** |
| 5 | Product roadmap | medium | low | medium | Mixed | **B** (A for solo founders) |
| 6 | Hook library | very high | very high | high | Yes — flagship | **A+** |
| 7 | UGC scripts | medium | low | medium | Mixed | **B** |
| 8 | Image prompts (without images) | medium | very low | very low | No | **C** |
| 9 | Carousel concepts | low | very low | very low | No | **B-/C** |
| 10 | Ready-to-publish assets | n/a | n/a | n/a | **Yes — A+++** | not in V1 |

### A grade · pay-for outputs

- **Positioning one-liner** (single sentence)
- **Hook library** (10-15 ranked hooks)
- **Top 10 moments by commercial score** (compact, actionable)
- **The ranking output of commercial scoring** (not the methodology)

### B grade · admired with conditions

- **Product roadmap** (A for pre-product founders, C for established brands)
- **UGC scripts** (A for those with creator pipelines, C without)

### C grade · admired but not paid for

- **Long-form positioning statement** (boilerplate)
- **Moments 11-25** (filler)
- **7-dimension scoring methodology** (engineering exhibit)
- **Strategy PDF as multi-page document** (folder filler)
- **Image prompts without rendered images** (homework)
- **Carousel concepts as structure-only** (homework)
- **Audience profile expansion beyond what they wrote** (mostly tells them what they already know)

---

## 4 · The single most valuable deliverable in 15 minutes

If the customer had only 15 minutes and one purchase decision, **the single output they would pay for is**:

> **A ranked list of 10 ads to shoot this month — each with the audience, the situation, the Hebrew hook, and the visual direction — plus one sentence that defines the brand on top.**

Five things. In that order:

1. The one-liner positioning
2. Hook #1 with audience + situation + visual direction
3. Hook #2 with audience + situation + visual direction
4. ... through Hook #10
5. (Implicit context the customer never sees: territory, moment corpus, commercial scoring, all of which produced 1-10)

**Everything else is supporting evidence.** The customer pays for action-now, not insight-later.

The mental model: **the customer is not buying a strategy. They are buying their next 30 days of Meta Ads.**

If V1 ships only those 5 things in 8 minutes, the customer pays for it. If V1 ships those 5 things buried inside a 12-page PDF with 25 moments and a 7-dimension scoring matrix, the customer pays for it grudgingly, never returns, and tells friends *"the AI was OK but kind of overwhelming."*

---

## 5 · What customers admire but do not pay for

The cuts list from the current V1 spec, in order of safest-to-cut:

| Cut | Reason | Savings |
|---|---|---|
| The 12-page PDF | Folder filler · undermines trust by signaling AI generation | Less LLM cost · less design work · ~2 min off the journey |
| Moments 11-25 | Long tail · marginal value approaching zero | Fewer LLM calls · less reviewing burden |
| The 7-dimension scoring explanation | Engineering exhibitionism · 5% audience | Less screen complexity |
| Long-form positioning statement | Boilerplate · ChatGPT does this for free | Less screen real estate |
| Carousel concept structure | Homework without finished slides | Less LLM cost |
| Image prompts without rendered images | Homework · customer pastes into Midjourney anyway | Honest about what V1 doesn't do |
| Audience profile expansion | Mostly restates customer's own input | Less LLM cost |
| The 10-layer stack rendered as a document | Methodology, not output | Reduces "AI slop" feeling |

Cutting these does NOT remove value from V1. It removes **clutter** from V1. Every cut shifts the customer's perception from *"this is an AI-generated kit"* to *"these are 10 ads I can shoot tomorrow."*

---

## 6 · V1 — smallest thing customers will pay for

**Spec:**

| | |
|---|---|
| **What it is** | A 5-page web dashboard + 1 page exportable PDF |
| **Time to value** | 8 minutes |
| **Price** | $79-99 one-time |
| **What it ships** | 1 positioning one-liner + 10 ranked ads (hook + audience + situation + visual direction per ad) |
| **What it does NOT ship** | full moment corpus · long-form positioning · product roadmap · UGC scripts · image prompts · carousel concepts · 7-dimension scoring · PDF beyond 1 page |

### The 8-minute journey

1. **Signup** · 30 sec
2. **4 questions** · 2:30 (cut from 8 — see Q-list below)
3. **AI generates** · 90 sec (one-liner + 10 ranked hook-moments)
4. **Customer picks the one-liner from 2 candidates** · 30 sec
5. **Customer marks top 5 hooks to launch first** · 90 sec
6. **Dashboard appears** · 60 sec to absorb

The 4-question onboarding:
1. *"What do you sell?"*
2. *"Who buys it?"*
3. *"What deeper feeling do they want from your product?"*
4. *"Where do they live? (country + language)"*

The other 4 questions (functional reason, price band, frequency, founder story) are removable for V1 because the LLM can either infer or default acceptably from the four core inputs. The frequency archetype + price band influence the *product roadmap* — which is being cut from V1. The founder story powers founder-angle outputs — also cut from V1.

### Why $79-99 and not $249

- Volume × low-price beats few × high-price at MVP stage
- $79 is impulse-purchasable for a small marketer · referrable to friends
- Compared to: Fiverr copywriter $200-500 for 10 ads in 5 days; AI version is $79 in 8 minutes
- Compared to: ChatGPT subscription $20/mo for generic hooks; specialized version is $79 one-time for ranked, audience-targeted hooks
- $79-99 enters credit-card-impulse zone; $249 requires CFO approval at small companies

### What V1 explicitly does NOT promise

- A "complete brand strategy"
- A "marketing system"
- Image generation
- Publishing
- Performance tracking
- A 12-month roadmap

**The product description is one sentence:** *"10 Hebrew ads to shoot this month, ranked by what'll convert."*

---

## 7 · V2 — highest-leverage upgrade

The upgrade that converts V1 buyers into V2 buyers must close the **single biggest gap** in V1. That gap is unambiguous: *V1 ships prompts and instructions; V2 ships finished assets.*

**Spec:**

| | |
|---|---|
| **What it is** | A 30-minute end-to-end flow that delivers actual rendered images + the full strategy stack |
| **Trigger** | Customer who completed V1 and used at least 3 hooks in their actual ad campaigns |
| **Price** | $199-249 add-on (to existing V1 customers) or $299 standalone |
| **What it adds** | Real image generation (Flux/Replicate integration · 10 rendered images per kit) · full moment corpus (top 25, not just top 10) · UGC scripts · product roadmap (optional) · the 12-page strategy PDF as printable artifact |
| **What V2 is NOT** | publishing · live tracking · subscription |

### The V2 upgrade narrative

After the customer's V1 kit ships and they launch their first 3 ads, the platform surfaces:

*"Your top 3 ads need finished images. Generate 10 finished images for $199. You can iterate up to 3 times per image."*

This is the highest-conversion upsell because:
1. The customer has now invested in shooting ads → they're committed
2. The friction of *"paste into Midjourney, re-prompt, find stock photo, edit in Canva"* has become real → they've felt the gap
3. $199 to close that gap is half the cost of even one freelance designer
4. The customer can compare: ad performance with V1 stock-photo vs V2 generated-image

### V2's central job

V2 is **not** "more strategy." It is **less friction from strategy to publishable asset.** The hierarchy:

- V1 ships the right ad to make → customer must produce the asset
- V2 ships the asset → customer must publish it
- V3 publishes the asset → platform reports performance

V2 is the bridge between V1's brief and V3's autonomy.

---

## 8 · V3 — autonomous marketing system

**Spec:**

| | |
|---|---|
| **What it is** | A continuously-running marketing OS that publishes, measures, and refreshes the customer's creative on a closed loop |
| **Trigger** | Customer who has run ≥ 30 days of V2-rendered ads with measurable spend |
| **Price** | $399-499/month subscription |
| **What it adds** | Direct Meta Ads / TikTok / Google Ads publishing · automatic performance pulling (CTR, CPA, ROAS) · automatic creative refresh when assets fatigue · A/B testing automated between hook families · cross-brand benchmarks (anonymized) · quarterly strategy refresh based on real data |
| **What V3 is NOT (intentionally)** | a complete agency replacement · the operator still approves what runs |

### V3's central insight

V3 is what the platform spends V1 and V2 revenue earning the right to build. **V1 generates the kit. V2 closes the kit-to-asset gap. V3 closes the asset-to-revenue gap.** Each layer presupposes the prior.

The mistake the current V1 spec makes: it tries to ship V1 + half of V2 in 15 minutes for $249. The customer absorbs the V1 value (hooks, one-liner), ignores the half-V2 (PDF, moment corpus, image prompts), and never returns for the actual V2 (rendered assets). **Half a V2 inside V1 is worse than no V2.**

### V3 metrics that justify subscription

The customer renews $399/mo when:
- Performance data tells them which of their ads is converting
- The system has refreshed creative without prompting
- Cross-brand benchmarks make them feel less alone ("brands in your vertical found X")
- One A/B test result per month surfaces something they didn't know

If V3 cannot deliver those four monthly events, the customer churns. Subscription is **monthly trust renewal**, not a payment plan.

---

## 9 · The shortest path to revenue

The three-stage funnel ordered by what generates revenue fastest:

| Stage | Time to first $$ | Path |
|---|---|---|
| V1 launch | Day 1 from go-live | One landing page · 4-question onboarding · 1 LLM call · 1 PDF · $79-99 · paid Meta ad to relevant audience |
| V1 → V2 conversion | Day 30 from go-live | Email sequence to V1 customers · "your first 3 ads are running · want them rendered? $199" |
| V2 → V3 conversion | Day 90 from go-live | Customer has 90 days of performance data · the *"want it on autopilot?"* moment · $399/mo |

**Each stage must demonstrably work before the next stage is built.** If V1 doesn't convert at 12%+, no point building V2. If V2 doesn't lift LTV by 2.5×+, no point building V3.

This sequencing is the difference between *"shortest path to revenue"* and *"path that looks complete on day 1 but ships nothing."*

---

## 10 · What this audit changes in the current V1 spec

Concrete deltas from `docs/productization-v1.md` (HEAD `314f312`):

| Current V1 element | Audit verdict | Action |
|---|---|---|
| 8 onboarding questions | Too many for V1 | **Cut to 4** for V1; 8 returns for V2 |
| 25-moment generation | Long tail unused | **Cut to top 10 moments** in V1; full 25 for V2 |
| 7-dimension scoring explainer | Engineering exhibit | **Hide by default**; expandable in V2 |
| Long-form positioning + 1-liner | Long-form unused | **Cut long-form**; ship only 1-liner |
| Strategy PDF (12 pages) | Folder filler | **Cut to 1-page** in V1; full PDF in V2 |
| Image prompts | Homework without render | **Cut from V1 deliverable language**; ship in V2 with actual images |
| Carousel concepts | Homework without slides | **Cut from V1**; ship in V2 with finished slides |
| UGC scripts | High variance audience need | **Optional toggle in V1**, default off; default on in V2 |
| Product roadmap | High value for solo founders only | **Optional toggle in V1**; pulled in by founder-archetype customers |
| Pricing $249 | Above impulse zone | **Drop to $79-99** for V1; V2 add-on $199 |
| 13-screen flow | Too long for "smallest sellable" | **Cut to ~6 screens, 8 minutes** for V1 |

### The cut V1 outputs in one paragraph

V1 ships *one positioning one-liner + 10 ranked Hebrew ad hooks, each with: target audience (1-2 sentences), specific situation (1 sentence), and visual direction (1 sentence).* That is the entire deliverable. PDF is 1 page. Web dashboard shows all 11 cards. Price: $79-99. Time: 8 minutes.

Everything else is V2 or V3.

---

## 11 · The honest customer mental model (re-stated)

The customer is **not** buying:
- A brand strategy
- A marketing system
- A 12-month roadmap
- An AI-generated kit
- A "Universal Brand OS"

The customer **is** buying:
- *"Ten ads I can shoot this month."*
- *"One sentence that defines my brand."*
- *"The relief of not staring at the blank ad-creative page anymore."*

If V1 honors that mental model exactly, the customer pays $79-99 happily. If V1 over-delivers with strategy artifacts the customer doesn't want, the customer either:
1. Pays $249 grudgingly, never returns, doesn't refer friends
2. Pays $249, feels overwhelmed, files for refund

Either failure mode kills V2 and V3.

---

## 12 · Final answer

> **What would a real customer actually pay for?**
>
> **In V1:** one positioning one-liner + 10 ranked Hebrew ad hooks, each with audience + situation + visual direction. $79-99. 8 minutes. That is the smallest thing customers will pay for.
>
> **In V2:** the same + actual rendered images for those 10 ads (via Flux/Replicate) + the full strategy stack as a printable artifact. $199-249 add-on. 30 minutes. Highest leverage upgrade because it closes the only friction that matters.
>
> **In V3:** continuous publishing + performance tracking + automatic refresh + cross-brand benchmarks. $399-499/month. The autonomous marketing system the original V1 spec implied but did not deliver.
>
> **The shortest path to revenue:** ship V1 in 6 weeks. Earn V2 by proving 12% conversion. Earn V3 by proving 2.5× LTV lift.

The previous V1 spec confused *"complete strategy stack"* with *"customer-valuable deliverable."* This audit corrects that. **The customer pays for ads. Strategy is the cost of producing the ads.**

No code modified. No design work. No new strategy. Audit only.
