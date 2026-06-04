# Product Architecture V1

**Source:** `docs/commercial-architecture-v1.md` (HEAD `52ed54f`) — 36-moment commercial corpus, ranked by total revenue value.
**Goal:** answer "What should MOOD actually sell?" — translate the moment corpus into a real packaged-goods SKU lineup, phased for launch → growth → expansion.
**Reviewer stance:** *as a CPG operator (not a software operator) sizing product complexity against commercial value.*
**Date:** 2026-06-05
**No code changes. No engine modifications. No new UI. Strategy document only.**

---

## 1 · Executive summary

> The right MOOD lineup is **2 chocolate recipes × 5 packaging formats = 12 SKUs at full expansion.** Launch ships **3 SKUs.** Growth phase adds **4 SKUs.** Expansion phase adds **5 SKUs**, three of which are seasonal-only.

Three headline answers to the directive's three questions:

| Question | Answer |
|---|---|
| Should BOOST remain one SKU? | **No — split into 2 packaging formats** (Daily Pouch · Tasting Slab) over phases. Same recipe, different formats. |
| Should CHILLAX remain one SKU? | **No — split into 3 packaging formats** (Daily Pouch · Tasting Slab · Hostess Gift Box). CHILLAX's commercial center is hospitality, which requires a shareable format the pouch cannot deliver. |
| Should BUNDLE remain one SKU? | **No — manifest as 4 boxes** (Starter Duo · Monthly Subscription · Hostess Gift Box · Rosh Hashana Premium). BUNDLE is the brand's *gifting and trial* SKU family, each with a different price point and occasion. |

The single most important commercial finding from the prior architecture: **CHILLAX's hostess-gift moment (G-NEW1 · score 49) and its post-meal table moment (H-NEW1 · score 52) are the brand's two highest-revenue opportunities and neither is served by a 30g pouch.** A pouch is a one-person format. The hospitality center of the brand requires a shareable bar and a wrapped gift box. Without those two SKUs, the brand leaves ~30-35% of its addressable revenue on the table.

---

## 2 · How the moment corpus translates to format demand

For every moment in the V1 commercial corpus, the *format the consumer needs* falls into one of four buckets:

| Format bucket | Moments it serves | What it actually is |
|---|---|---|
| **Single-square / individual** | F1 kids asleep · C1 afternoon crash · F3 end of workday · H1 TLV balcony · F2 Shabbat candles · I4 Friday afternoon · I1 hard day · I2 post-workout · J1 chamsin · A1 kindergarten · P-NEW1 desk drawer · S-NEW1 handbag · B1 gym · B2 date night · etc. | A small, individually-wrapped square or a 30g pouch of ~6 squares. Designed for one person, one moment. |
| **Shareable bar / slab** | H-NEW1 post-meal Friday lunch table · H-NEW2 Saturday with friends · D1 Friday lunch · G5 hosting friends · #5 hosting weekend | A 100-120g tasting-slab that sits on a table and gets broken into pieces by multiple adults. |
| **Wrapped gift box** | G-NEW1 hostess gift · G3 anniversary · #12 visiting relatives · #15 trial purchase · G-NEW2 workplace gift | A small premium-presentation box ($20-45 retail) ready for hand-off. The packaging IS the product. |
| **Seasonal premium box** | HOL-NEW1 Rosh Hashana · HOL-NEW2 Hanukkah · HOL-NEW3 Tu B'Av · G-NEW3 Mother's Day | Limited-window, high price-point ($40-75 retail). Heavy packaging, often with a card. |

**Distribution of the 36-moment corpus across format buckets:**

| Bucket | # of moments | % of commercial value |
|---|---|---|
| Single-square / individual | ~22 | ~52% |
| Shareable bar | ~5 | ~22% |
| Wrapped gift box | ~5 | ~18% |
| Seasonal premium box | ~4 | ~8% |

The format mix is the SKU mix. A lineup that only ships pouches captures ~52% of the corpus's revenue. A lineup that ships pouches + shareable bars + gift boxes captures ~92%. **The marginal SKU value is enormous up to format-coverage of ~3 buckets, then drops.**

---

## 3 · The 12 candidate SKUs

Each SKU is scored on 8 dimensions on a 1-10 scale.

| # | SKU | Format | Target moments | Self | Gift | Hosp | Subs | Repeat | Op-complexity | **Net commercial value** |
|---|---|---|---|---|---|---|---|---|---|---|
| **1** | BOOST · Daily Pouch | 30g sachet, ~6 single-serve | C1 · P-NEW1 · A1 · B1 · S-NEW1 · A3 · D1 | 9 | 3 | 4 | 9 | 9 | 2 | **High · daily ritual core** |
| **2** | CHILLAX · Daily Pouch | 30g sachet, ~6 single-serve | F1 · H1 · F3 · I4 · F2 · I1 · I2 · J1 | 9 | 4 | 4 | 9 | 9 | 2 | **High · daily ritual core** |
| **3** | CHILLAX · Tasting Slab | 120g shareable bar | H-NEW1 · H-NEW2 · G5 · D1 · #5 | 4 | 6 | **10** | 5 | 6 | 3 | **High · hospitality flagship** |
| **4** | BOOST · Tasting Slab | 120g shareable bar | D1 · A3 · A4 (host fuel) · #5 | 4 | 4 | 7 | 4 | 5 | 3 | Mid · weaker than CHILLAX slab |
| **5** | MOOD · Hostess Gift Box | Small premium ($20-25) · 6 BOOST + 6 CHILLAX squares + card | **G-NEW1 · G-NEW2 · G-NEW4 · #12** | 1 | **10** | 6 | 5 | 6 | 5 | **High · year-round gift flagship** |
| **6** | MOOD · Starter Duo | Trial ($15-20) · 5 BOOST pouches + 5 CHILLAX pouches | **#15 · trial / first purchase** | 8 | 6 | 3 | 4 (→ subs) | 4 | 4 | **High · acquisition driver** |
| **7** | MOOD · BOOST Monthly Box | Subscription ($25-30/mo) · 20 daily pouches + 1 slab | C1 · P-NEW1 · A1 · B1 · S-NEW1 | 9 | 2 | 2 | **10** | **10** | 6 | High · LTV machine |
| **8** | MOOD · CHILLAX Monthly Box | Subscription ($25-30/mo) · 20 daily pouches + 1 slab | F1 · F3 · H1 · I4 · I1 · F2 | 9 | 3 | 3 | **10** | **10** | 6 | High · LTV machine |
| **9** | MOOD · BUNDLE Monthly Box | Subscription ($45-50/mo) · 10 BOOST + 10 CHILLAX + 1 slab each | #1 clean workday · #2 dual-parent · #15 day-shape | 8 | 5 | 4 | **10** | 9 | 7 | High · premium LTV |
| **10** | MOOD · Rosh Hashana Premium Gift Box | Premium seasonal ($55-75) · 12 BOOST + 12 CHILLAX squares + ribbon + card | **HOL-NEW1** | 1 | **10** | 6 | 1 | 2 | **8** | High in window, dead outside |
| **11** | MOOD · Hanukkah Set | Premium seasonal ($40-55) · 8 individually-wrapped pieces | **HOL-NEW2** | 2 | **10** | 5 | 1 | 2 | 7 | High in window, dead outside |
| **12** | MOOD · Couples Box | Mid-premium ($35-45) · 2 CHILLAX slabs + card | G3 · HOL-NEW3 · G-NEW3 | 3 | 9 | 4 | 1 | 2 | 5 | Mid · gift occasions |

**Each SKU is a packaging configuration of one of two chocolate recipes** (BOOST or CHILLAX) — not a separate product. This is the key CPG cost insight: 12 SKUs do NOT mean 12 chocolate-making operations. They mean 2 batches of chocolate × ~5 packaging configurations. *Hershey's Kisses* are one chocolate, twenty-plus SKUs.

---

## 4 · Why each SKU exists (the moment justification)

### 1 · BOOST Daily Pouch
The BOOST core. Justifies subscription. Lives in handbags, desk drawers, gym bags. Justified by 7 commercial moments at score 35+ each.

### 2 · CHILLAX Daily Pouch
The CHILLAX core. Lives in nightstands, balcony tables, post-bedtime kitchens. Justified by 8 commercial moments at score 37+ each. **This is the most-purchased SKU for the brand's most loyal segment (parents of small children).**

### 3 · CHILLAX Tasting Slab
**The brand's hospitality flagship.** A 120g shareable bar designed to sit on the table after the Friday lunch (H-NEW1, score 52) and at the post-kids-asleep adults-only evening (G5, score 43). Score on Hospitality = 10. Without this SKU, the brand cannot serve its #1 hospitality moment. Period.

### 4 · BOOST Tasting Slab
Lower priority. BOOST is morning/personal; the hospitality use case for BOOST is narrower (host fuel during pre-Friday-lunch cooking — A3, score 43). **Not Phase 1 — ship after CHILLAX slab proves the format works.**

### 5 · MOOD Hostess Gift Box
**The brand's gifting flagship.** A small premium box ($20-25) designed for the operator-stated #1 gifting moment: bringing chocolate to a host's Friday lunch (G-NEW1, score 49). Weekly cadence per buyer (most Israeli adults host or attend a Friday meal weekly). Lower-priced than a holiday box; year-round availability.

### 6 · MOOD Starter Duo
**The acquisition SKU.** $15-20 entry-price for the curious. 5 BOOST pouches + 5 CHILLAX pouches = the operator-stated #15 BUNDLE moment ("try the week"). Designed to convert paid social click → first purchase → subscription. Without this SKU, the brand has nothing under $20 to advertise on Meta. Critical for paid-acquisition unit economics.

### 7 · BOOST Monthly Box
Subscription LTV play. $25-30/mo. 20 daily pouches + 1 tasting slab. Targets the heavy daily-ritual user (C1 afternoon crash, P-NEW1 desk drawer). **Requires fulfillment infrastructure** (subscription billing, packing, shipping) which is the heaviest operational lift in the lineup.

### 8 · CHILLAX Monthly Box
Same shape as BOOST Monthly. Targets parents (F1) + evening-ritual users (F3, H1, I4). **Likely the higher-volume subscription** based on commercial scoring.

### 9 · MOOD BUNDLE Monthly Box
The premium subscription. $45-50/mo. Combines BOOST + CHILLAX. Replaces single-product subscriptions for committed customers. Smaller volume than the single subscriptions but higher ARPU.

### 10 · Rosh Hashana Premium Gift Box
**Annual peak SKU.** September only. Premium price point. Targets HOL-NEW1 (score 36 with seasonal score 10). Rosh Hashana is the single largest gift-chocolate window in Israel; classical chocolate brands derive 15-25% of annual revenue from this window. Without this SKU, MOOD cedes this calendar peak.

### 11 · Hanukkah Set
December only. 8 individually-wrapped pieces (for 8 nights — a Jewish-cultural format hook that's secular enough to not exclude non-religious buyers). Smaller window than Rosh Hashana but real revenue.

### 12 · Couples Box
Tu B'Av (August) + Valentine's-adjacent + anniversaries year-round. Smaller commercial value but reinforces the brand's "two products, one couple" story (G3 anniversary, HOL-NEW3 Tu B'Av). Lower priority than the holiday boxes.

---

## 5 · Phase 1 · MVP launch (3 SKUs)

The minimum lineup that tests product-market fit without launching the heaviest operational lifts (subscription · premium gifting).

| # | SKU | Price | Format |
|---|---|---|---|
| 1 | BOOST · Daily Pouch | ₪18-22 | 30g · ~6 squares |
| 2 | CHILLAX · Daily Pouch | ₪18-22 | 30g · ~6 squares |
| 6 | MOOD · Starter Duo | ₪55-70 | 5 + 5 pouches |

**Why these three:**
- The two daily pouches **prove the recipe**. If the chocolate isn't loved, no SKU above this works.
- The Starter Duo **proves the proposition** (two products, one brand, one day-shape). Without it, the BUNDLE story is theoretical.
- All three SKUs share **one packaging line** (sachet machine + one paper sleeve for the duo) → minimal capital outlay.
- All three are **D2C-shippable** in flat-rate envelopes → no cold-chain, no boxes-in-boxes.

**What Phase 1 deliberately omits:**
- Subscription (operational complexity 6+, can be added once retention data exists from one-time orders)
- Tasting slab (requires a different chocolate-pour mold + different shelf real estate)
- Gift boxes (requires premium packaging supply chain)
- Holiday SKUs (seasonal inventory risk before brand exists)

**Phase 1 commercial coverage:**
- Captures 100% of self-purchase + impulse + daily-ritual revenue moments (~52% of total corpus value)
- Captures ~0% of hospitality and gifting (the highest-scoring single moments)
- **Estimated revenue ceiling per Phase 1 customer: ~₪80/month** (4 pouches + occasional duo)

This is the test phase. Goal is **product validation, not revenue maximization.**

---

## 6 · Phase 2 · Growth (adds 4 SKUs → 7 total)

Triggered when Phase 1 hits: (a) ≥1,000 repeat purchasers in 90 days, OR (b) NPS ≥ 50 on chocolate quality, OR (c) Meta CAC < ₪40 per purchase.

| # | SKU | Price | New capability |
|---|---|---|---|
| 3 | CHILLAX · Tasting Slab | ₪52-65 | Hospitality format · shareable bar |
| 5 | MOOD · Hostess Gift Box | ₪95-120 | Year-round gifting · wrapped presentation |
| 7 | MOOD · BOOST Monthly Box | ₪110-130/mo | Subscription · LTV pillar |
| 8 | MOOD · CHILLAX Monthly Box | ₪110-130/mo | Subscription · LTV pillar |

**Why this order:**
1. CHILLAX Tasting Slab unlocks the brand's two highest-scoring moments (H-NEW1 score 52, G5 score 43). **This is the single highest-revenue addition the brand will ever make.**
2. Hostess Gift Box unlocks G-NEW1 (score 49) — the brand's #1 gifting moment, weekly cadence. Designed to be a year-round SKU, not seasonal.
3. The two single-product Monthly Boxes are launched together (same fulfillment infrastructure, same retention playbook). Skipping BUNDLE Monthly until Phase 3 keeps the operational lift manageable.

**Phase 2 commercial coverage:**
- Adds hospitality moments (H-NEW1, H-NEW2, G5, #5 partial)
- Adds gifting moments (G-NEW1, #12)
- Adds subscription / LTV play
- Estimated revenue per Phase 2 customer: **₪200-280/month** (subscription) or **₪150-180/quarter** (gifting buyer)

This is the **revenue-pillar phase**. The hostess gift + tasting slab + subscription trio is where the brand starts to look like a real business.

---

## 7 · Phase 3 · Expansion (adds 5 SKUs → 12 total)

Triggered when Phase 2 hits: (a) subscription retention ≥ 70% at month 3, OR (b) hostess gift box velocity ≥ 200 boxes/week, OR (c) brand awareness in target audience ≥ 30%.

| # | SKU | Price | Window |
|---|---|---|---|
| 4 | BOOST · Tasting Slab | ₪52-65 | Year-round (B-tier slab) |
| 9 | MOOD · BUNDLE Monthly Box | ₪190-220/mo | Premium subscription tier |
| 10 | MOOD · Rosh Hashana Premium Gift Box | ₪240-330 | September only |
| 11 | MOOD · Hanukkah Set | ₪180-240 | December only |
| 12 | MOOD · Couples Box | ₪150-200 | Tu B'Av + anniversaries + Mother's Day |

**Why this order:**
1. BOOST Tasting Slab adds a small revenue line (host-fuel during cooking, athlete households) and proves the brand can field both recipes in shareable format.
2. BUNDLE Monthly Box adds a premium subscription tier — converts the highest-LTV CHILLAX/BOOST subscribers into BUNDLE customers without losing them.
3. Rosh Hashana Premium Gift Box is the **biggest single-window revenue opportunity in the brand calendar** (~15-25% of premium chocolate gifting in Israel happens in September). Launching before brand awareness reaches ~30% wastes inventory.
4. Hanukkah Set is the next-biggest seasonal window.
5. Couples Box is the smallest of the seasonal SKUs but reinforces the brand's two-products-one-couple narrative.

**Phase 3 commercial coverage:**
- ~92% of the moment corpus served
- Estimated revenue per Phase 3 customer: **₪400-600/year** (mix of subscription + seasonal gifts)

This is the **full-catalog phase**. By the end of Phase 3, MOOD is a multi-channel CPG brand: D2C subscription + retail-shelf eligible (the slabs) + seasonal gift retailer + e-commerce gift platform listings (Wolt, Cibus, etc.).

---

## 8 · Operational complexity ladder

Plotting the 12 SKUs on a complexity scale shows why phasing matters:

| Complexity (1-10) | SKU | What makes it hard |
|---|---|---|
| 2 | BOOST Daily Pouch · CHILLAX Daily Pouch | Single recipe · single packaging line |
| 3 | CHILLAX Tasting Slab · BOOST Tasting Slab | New mold + different wrap |
| 4 | Starter Duo | Two products in one paper sleeve |
| 5 | Hostess Gift Box · Couples Box | Multiple components + box + insert + card |
| 6 | BOOST Monthly · CHILLAX Monthly | Subscription billing + fulfillment + retention CX |
| 7 | BUNDLE Monthly · Hanukkah Set | Multi-product subscription / limited-window seasonal |
| 8 | Rosh Hashana Premium Gift Box | Premium packaging + ribbon + card + seasonal inventory risk |

**Each phase doesn't just add SKUs — it adds operational categories the brand has never run before:**

| Phase | New operational category |
|---|---|
| 1 → 2 | Premium packaging supply chain · subscription billing · subscription CX · retention metrics |
| 2 → 3 | Limited-window seasonal inventory planning · premium-priced product positioning · multi-product subscription mechanics |

If Phase 1 isn't validated, Phase 2 inventory risk is real. If Phase 2 isn't running smoothly, Phase 3 seasonal risk is brand-killing.

---

## 9 · Revenue contribution per phase (modeled)

Rough modeling assumes Israeli premium-chocolate ARPU benchmarks (Magnum, Frey, Lindt) and the moment-corpus commercial scoring.

| Phase | SKUs | Estimated annual revenue / 1,000 customers | Operational headcount needed |
|---|---|---|---|
| **Phase 1** | 3 | ~₪150K · primarily one-off pouch purchases | 1-2 (founder + ops) |
| **Phase 2** | 7 | ~₪900K · subscription LTV + hostess gift cycles | 4-6 (CX + fulfillment + marketing) |
| **Phase 3** | 12 | ~₪2.1M · full catalog + seasonal peaks | 10-14 (+ seasonal inventory planner + retail account manager) |

**Phase-to-phase revenue multiplier: ~6× from Phase 1 to Phase 2; ~2.3× from Phase 2 to Phase 3.**

The biggest revenue jump is Phase 1 → Phase 2 (the hostess box + subscription unlock). The Phase 2 → 3 jump is smaller and primarily driven by seasonal peaks, not new daily revenue.

---

## 10 · Five non-obvious findings

### 10.1 · The "Tasting Slab" is the single most undervalued SKU in the whole architecture

CHILLAX Tasting Slab alone serves H-NEW1 (52) + H-NEW2 (48) + G5 (43) + D1 (50 partial) + #5 (49 partial). One SKU, ~₪60 retail, serves five top-20 moments. **No other single SKU in the lineup serves this many top moments.** It is more commercially valuable than either daily pouch on a per-unit-sold basis (higher price point, almost equal volume potential).

### 10.2 · Subscription is not the launch product

Software-company instinct: subscription is the LTV play, ship it first. CPG reality: **subscription requires retention data the brand does not yet have.** Phase 1 must produce a 60-day repeat-purchase cohort before subscription is operationally responsible. Ship pouches first; subscription emerges from the data.

### 10.3 · The Hostess Gift Box is a year-round SKU, not a holiday SKU

The brand will be tempted to launch the gift box around Rosh Hashana 2026 and call it a "holiday SKU." This is wrong. **G-NEW1 hostess gift fires every Friday for ~3 million Israeli adults.** The Hostess Gift Box is a weekly velocity SKU. The Rosh Hashana box is a separate, premium-tier seasonal SKU. **Confusing the two products kills the year-round gift opportunity.**

### 10.4 · BOOST and CHILLAX have *different* SKU breadth requirements

This is the asymmetry the architecture forces:

- **BOOST** is self-purchase + frequency. It thrives with 2 formats (Daily Pouch + Monthly Box). Adding a tasting slab is incremental, not strategic.
- **CHILLAX** is self-purchase + hospitality + gifting. It needs 4 formats (Daily Pouch + Monthly Box + Tasting Slab + Hostess Gift Box) to capture its commercial moments.

**The brand should not pursue SKU parity between BOOST and CHILLAX.** CHILLAX naturally fields more SKUs because its commercial moments are more format-diverse.

### 10.5 · The BUNDLE story is preserved through every phase

BUNDLE never disappears as a *narrative* (one brand, two moods, full day-shape) — but it manifests as four different SKUs across phases:

- Phase 1: **Starter Duo** (cheapest trial)
- Phase 2: implied by selling BOOST Monthly + CHILLAX Monthly side-by-side (the customer can self-bundle)
- Phase 3: **BUNDLE Monthly Box** (premium subscription) + **Hostess Gift Box** (both recipes in one box) + **Rosh Hashana Premium** (both recipes in a holiday box)

**There is no single "BUNDLE SKU."** BUNDLE is a category of packaging configurations that always pair the two recipes. The brand sells the day-shape narrative; the SKUs are the proof.

---

## 11 · What this lineup looks like to the customer

**Phase 1 customer experience:**
- Visits mood.co.il, sees BOOST Pouch / CHILLAX Pouch / Starter Duo.
- Buys Starter Duo ₪60. Tries both products over 10 days.
- Re-orders ₪40 of CHILLAX Pouches.

**Phase 2 customer experience:**
- Same customer returns. Sees: Pouches + new Tasting Slabs + new Hostess Gift Box + new Subscription option.
- Subscribes to CHILLAX Monthly (₪120/mo).
- Buys a Hostess Gift Box for a friend's Friday lunch (₪110).
- Annual spend: ₪1,440 subscription + ₪400-600 in gift boxes = ₪1,840-2,040.

**Phase 3 customer experience:**
- Subscriber sees Rosh Hashana Premium Gift Box in their inbox in mid-August.
- Buys 3 as Rosh Hashana gifts (₪900).
- December: buys 2 Hanukkah Sets (₪400).
- Annual spend: subscription + gifts + seasonal = ₪3,000-4,000.

**The product architecture's revenue per customer ramps from ~₪150 (Phase 1) → ₪2,000 (Phase 2) → ₪3,500+ (Phase 3).**

---

## 12 · What MOOD should NOT sell

To define the lineup is also to define what is OUT. Five product categories the brand should resist:

### 12.1 · A chocolate "supplement" SKU
Pills. Powders. Capsules. The moment the brand sells anything that looks like a supplement, it joins the wellness category it's claiming to escape. **Hard line: no capsules, no powders, no liquids.**

### 12.2 · Other formulas (CALM, RAGE, JOY, VIBE)
The previous engine already had `INVENTED_PRODUCT_PATTERNS` forbidding these in copy. Same rule for SKUs. **Two recipes for life. BOOST and CHILLAX.**

### 12.3 · A "BOOST Kids" or "CHILLAX Kids" SKU
Even an obviously-different SKU (smaller pieces, different packaging) implies the brand is for children. **Hard line: no kid SKUs.**

### 12.4 · Co-branded SKUs with other brands
"BOOST × [coffee brand]" or "CHILLAX × [wine brand]." Dilutes the brand-as-its-own-thing positioning. Hard pass until the brand has the equity to dictate terms.

### 12.5 · Single-serve hot drink format
The temptation will be "BOOST hot chocolate sachet" because everyone makes hot chocolate. This is a different product, different supply chain, different positioning. **Defer indefinitely.**

---

## 13 · The 12-SKU lineup at a glance

| Phase | # SKUs running | New this phase | Total catalog | Cumulative complexity |
|---|---|---|---|---|
| Pre-launch | 0 | — | — | — |
| Phase 1 (Launch) | 3 | 3 | 3 | Single packaging line |
| Phase 2 (Growth) | 7 | 4 | 7 | + premium packaging + subscription infrastructure |
| Phase 3 (Expansion) | 12 | 5 | 12 | + seasonal inventory planning + retail |

The lineup the brand should sell, sequenced by what survives the operational complexity at each stage.

---

## 14 · Final answer

> **What should MOOD actually sell?**
>
> **At launch:** BOOST Daily Pouch · CHILLAX Daily Pouch · Starter Duo. (3 SKUs.)
>
> **Within 12 months:** add CHILLAX Tasting Slab · MOOD Hostess Gift Box · BOOST Monthly Box · CHILLAX Monthly Box. (7 SKUs.)
>
> **Within 24 months:** add BOOST Tasting Slab · BUNDLE Monthly Box · Rosh Hashana Premium Gift Box · Hanukkah Set · Couples Box. (12 SKUs.)
>
> **Total chocolate recipes: 2** (BOOST + CHILLAX). The lineup is the recipe × packaging × occasion matrix.
>
> **The single most strategically important SKU is CHILLAX Tasting Slab** — it serves five top-20 moments at one packaging configuration. It is also the SKU the brand will be most tempted to defer because it requires a different mold than the pouch. **Do not defer it past month 6.**

No code modified. No engine refactor. No image-gen connection. Strategy document only.
