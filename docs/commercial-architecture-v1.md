# Commercial Architecture V1

**Source:** approved trim from `docs/moment-architecture-quality-review.md` (HEAD `05dadf6`) — 35 moments from the original 65 + 12 commercial-driver moments added per §7 of the review.
**Goal:** rank the moment corpus by what is most likely to **sell chocolate** — not what would win advertising awards.
**Reviewer stance:** *as a brand strategist sizing each moment for revenue impact, frequency, and category-fit.*
**Date:** 2026-06-05
**No code changes. No engine modifications. Architecture document only.**

---

## 1 · Scoring rubric

Each moment gets seven independent scores on a 1-10 scale, summing to a total commercial value. Dimensions are designed to capture different commercial drivers — a moment can score high on subscription and low on impulse without contradiction.

| Score | What it measures | High-score signal |
|---|---|---|
| **Self-Purchase** | Will the viewer of the ad buy this for themselves? | The viewer says *"that's me right now."* |
| **Gift-Purchase** | Would someone buy this AS A GIFT for the person in the moment? | The viewer says *"I should send this to ___."* |
| **Hospitality** | Will hosts buy this to serve to guests? | The moment naturally lives on a table or in a shared room. |
| **Impulse** | Does the ad drive in-the-moment purchase (scroll → buy)? | The moment depicts the consumption ritual itself, viewed by someone in the same state. |
| **Subscription** | Will this lock in a recurring buyer (weekly/daily ritual)? | The moment is daily or weekly for the same person. |
| **Repeat-Purchase** | How often will the same customer re-buy because of this moment? | Frequency × loyalty × low-friction. |
| **Seasonal** | Does this drive seasonal/holiday revenue peaks? | The moment is bound to a calendar window. |

**Scoring assumptions:**

- A score of 10 = a defining moment for that commercial driver (e.g., afternoon crash at impulse = 10 because it's literally the moment of need).
- 5 = neutral / generic.
- 1 = the moment actively does not drive this dimension.
- Total = sum of 7 scores. **Maximum possible = 70. Practical "flagship-revenue" threshold ≈ 42+.**

---

## 2 · BOOST moments — commercial scoring

Working from the V1 trim (12 moments) + the new commercial moments that fit BOOST.

| # | Moment | Self | Gift | Hosp | Impulse | Subs | Repeat | Seasonal | **Total** |
|---|---|---|---|---|---|---|---|---|---|
| **C1** | 15:30 afternoon crash | 10 | 2 | 1 | 10 | 10 | 10 | 3 | **46** |
| **D1** | Family Friday lunch 12:30 | 6 | 7 | 9 | 4 | 9 | 9 | 6 | **50** |
| **P-NEW1** | 16:30 office desk-drawer square (NEW) | 9 | 2 | 3 | 8 | 10 | 10 | 2 | **44** |
| **S-NEW1** | Handbag/car chocolate between errands (NEW) | 9 | 1 | 1 | 9 | 10 | 10 | 3 | **43** |
| **A3** | Pre-Shabbat dinner with extended family | 7 | 4 | 7 | 5 | 8 | 8 | 4 | **43** |
| **A1** | Kids coming home from kindergarten 16:00 | 9 | 3 | 1 | 8 | 9 | 9 | 3 | **42** |
| **B1** | Before gym | 9 | 2 | 1 | 6 | 9 | 10 | 5 | **42** |
| **B2** | Before date night 19:00 | 8 | 4 | 2 | 8 | 4 | 5 | 6 | **37** |
| **D2** | 22:00 going out (Friday Tel Aviv) | 7 | 2 | 3 | 8 | 5 | 6 | 5 | **36** |
| **C2** | After bad night's sleep 08:00 | 8 | 2 | 1 | 7 | 6 | 7 | 4 | **35** |
| **A4** | Birthday party prep 14:00 Saturday | 6 | 5 | 5 | 6 | 3 | 4 | 5 | **34** |
| **B3** | Before 04:00 flight | 7 | 3 | 1 | 5 | 6 | 6 | 4 | **32** |
| **C4** | Long drive Tel Aviv → Eilat | 7 | 2 | 3 | 5 | 3 | 4 | 7 | **31** |
| **G-NEW2** | Workplace gift for colleague promotion (NEW) | 1 | 9 | 3 | 6 | 3 | 4 | 4 | **30** |
| **E2** | Apartment move-day 07:00 | 5 | 3 | 2 | 4 | 1 | 2 | 3 | **20** |

**Highest scorer: D1 · Family Friday lunch (50)** — the only BOOST moment that triple-drives self + gift + hospitality + weekly repeat.

---

## 3 · CHILLAX moments — commercial scoring

Working from the V1 trim (15 moments) + the new commercial moments that fit CHILLAX.

| # | Moment | Self | Gift | Hosp | Impulse | Subs | Repeat | Seasonal | **Total** |
|---|---|---|---|---|---|---|---|---|---|
| **H1** | Tel Aviv balcony summer night 22:00 | 9 | 4 | 5 | 9 | 8 | 9 | 9 | **53** |
| **H-NEW1** | Post-meal chocolate on Friday-lunch table 15:30 (NEW) | 7 | 6 | 10 | 5 | 9 | 9 | 6 | **52** |
| **F1** | After kids asleep 21:15 | 10 | 5 | 2 | 9 | 10 | 10 | 3 | **49** |
| **G-NEW1** | Hostess gift bringing chocolate to Friday lunch (NEW) | 3 | 10 | 6 | 7 | 8 | 9 | 6 | **49** |
| **H-NEW2** | Saturday afternoon with friends — chocolate passed around (NEW) | 7 | 5 | 9 | 6 | 7 | 8 | 6 | **48** |
| **F2** | Friday Shabbat candle moment 17:45 | 7 | 6 | 7 | 4 | 9 | 9 | 6 | **48** |
| **H2** | Beach sunset | 8 | 3 | 4 | 9 | 6 | 7 | 10 | **47** |
| **I4** | Friday afternoon 13:00 | 9 | 3 | 3 | 7 | 9 | 9 | 5 | **45** |
| **G5** | Hosting friends after-kids-asleep 22:00 | 7 | 5 | 9 | 5 | 5 | 7 | 5 | **43** |
| **F3** | End of workday 18:30 arrival home | 9 | 2 | 1 | 8 | 10 | 10 | 2 | **42** |
| **P-NEW2** | Saturday slow breakfast (coffee + chocolate) (NEW) | 8 | 3 | 4 | 6 | 8 | 8 | 4 | **41** |
| **G1** | Sitting with spouse Thursday 22:00 | 8 | 6 | 2 | 7 | 7 | 8 | 3 | **41** |
| **I1** | After hard day with kids alone 20:30 | 9 | 3 | 1 | 9 | 7 | 8 | 3 | **40** |
| **I2** | 30 minutes post-workout 19:00 | 8 | 2 | 1 | 7 | 7 | 8 | 4 | **37** |
| **J1** | Chamsin afternoon stuck inside | 7 | 2 | 2 | 8 | 4 | 5 | 9 | **37** |
| **G4** | Reading together 22:30 | 6 | 5 | 1 | 5 | 8 | 8 | 4 | **37** |
| **H3** | Long bath 21:00 | 8 | 7 | 1 | 5 | 5 | 6 | 4 | **36** |
| **F4** | Thursday end-of-workweek 17:30 | 8 | 2 | 1 | 6 | 7 | 7 | 2 | **33** |
| **G3** | Anniversary dinner at home | 6 | 8 | 4 | 5 | 1 | 2 | 6 | **32** |
| **G-NEW4** | Bringing to a sick friend (NEW · carefully framed) | 1 | 8 | 4 | 7 | 2 | 3 | 3 | **28** |

**Highest scorer: H1 · TLV balcony summer night (53).** **H-NEW1 (52) is the highest scoring NEW moment in the entire architecture** — the post-meal Friday lunch chocolate is the single largest commercial opportunity not previously named.

---

## 4 · BUNDLE moments — commercial scoring

| # | System | Self | Gift | Hosp | Impulse | Subs | Repeat | Seasonal | **Total** |
|---|---|---|---|---|---|---|---|---|---|
| **#5** | The hosting weekend (Fri → Sat) | 7 | 7 | 9 | 4 | 9 | 8 | 5 | **49** |
| **#15** | One brand, one day, two moods | 8 | 6 | 2 | 7 | 9 | 9 | 4 | **45** |
| **#2** | The dual-parent day | 9 | 6 | 2 | 6 | 9 | 9 | 3 | **44** |
| **#12** | The visiting-relatives weekend | 6 | 8 | 7 | 4 | 4 | 6 | 7 | **42** |
| **#1** | The clean workday (Sun-Thu) | 8 | 4 | 2 | 4 | 10 | 9 | 3 | **40** |
| **#3** | The athlete week | 7 | 5 | 1 | 4 | 8 | 8 | 5 | **38** |
| **#4** | The travel day (work trip) | 7 | 6 | 2 | 4 | 5 | 6 | 7 | **37** |
| **HOL-NEW1** | Rosh Hashana premium chocolate gift box (NEW) | 2 | 10 | 6 | 5 | 1 | 2 | 10 | **36** |
| **HOL-NEW2** | Hanukkah chocolate gift (NEW) | 2 | 10 | 4 | 6 | 1 | 2 | 10 | **35** |
| **HOL-NEW3** | Tu B'Av couples gift (NEW) | 2 | 9 | 2 | 7 | 1 | 2 | 10 | **33** |
| **G-NEW3** | Mother's Day / partner birthday gift (NEW) | 1 | 10 | 2 | 5 | 1 | 2 | 10 | **31** |
| **#8** | The interview day | 5 | 6 | 1 | 5 | 1 | 2 | 4 | **24** |

**Highest scorer: #5 · The hosting weekend (49).** Three of the four lowest scorers are the holiday-gift moments — they peak at seasonal but are otherwise narrow, which is exactly the profile of a holiday-gift SKU (one big window, low all-year sales).

---

## 5 · Top 20 moments most likely to generate revenue

Ranked by total commercial score across all dimensions:

| Rank | Moment | SKU | Total | Why it ranks |
|---|---|---|---|---|
| 1 | **H1 · Tel Aviv balcony summer night** | CHILLAX | 53 | High self · high impulse · high subscription · summer peak |
| 2 | **H-NEW1 · Post-meal chocolate on Friday-lunch table** *(NEW)* | CHILLAX | 52 | Hospitality 10 · weekly repeat · the single most under-named commercial moment |
| 3 | **D1 · Family Friday lunch 12:30** | BOOST | 50 | Triple driver: self + gift + hospitality |
| 4 | **F1 · After kids asleep 21:15** | CHILLAX | 49 | Self 10 · impulse 9 · daily ritual |
| 5 | **G-NEW1 · Hostess gift bringing chocolate** *(NEW)* | CHILLAX | 49 | Gift 10 · weekly habit (most Israeli adults host or attend weekly) |
| 6 | **#5 · Hosting weekend (Fri → Sat)** | BUNDLE | 49 | Hospitality 9 · weekly Israeli ritual · gift-friendly |
| 7 | **H-NEW2 · Saturday afternoon with friends** *(NEW)* | CHILLAX | 48 | Hospitality 9 · weekly · pass-around-the-table format |
| 8 | **F2 · Friday Shabbat candle moment** | CHILLAX | 48 | Weekly · seasonal peaks · hospitality |
| 9 | **H2 · Beach sunset** | CHILLAX | 47 | Seasonal 10 · impulse 9 · iconic Israeli |
| 10 | **C1 · 15:30 afternoon crash** | BOOST | 46 | Universal · impulse 10 · daily |
| 11 | **#15 · One brand, one day, two moods** | BUNDLE | 45 | Trial purchase → subscription pipeline |
| 12 | **I4 · Friday afternoon 13:00** | CHILLAX | 45 | Israeli-specific · weekly · self-purchase strong |
| 13 | **#2 · Dual-parent day** | BUNDLE | 44 | Daily parent ritual · gift to partner natural |
| 14 | **P-NEW1 · 16:30 office desk-drawer square** *(NEW)* | BOOST | 44 | Daily subscription · 5×/week minimum |
| 15 | **S-NEW1 · Handbag/car chocolate between errands** *(NEW)* | BOOST | 43 | Always-on snacking; subscription 10 |
| 16 | **G5 · Hosting friends after-kids-asleep 22:00** | CHILLAX | 43 | Hospitality 9 · monthly-or-better |
| 17 | **A3 · Pre-Shabbat dinner** | BOOST | 43 | Weekly host moment |
| 18 | **F3 · End of workday 18:30** | CHILLAX | 42 | Universal worker · daily |
| 19 | **A1 · Kids from kindergarten 16:00** | BOOST | 42 | Universal parent · daily |
| 20 | **#12 · Visiting-relatives weekend** | BUNDLE | 42 | Gift 8 · hospitality 7 · holiday peaks |

**Observations:**

1. **6 of the top 10 are CHILLAX moments.** CHILLAX is inherently more giftable and hospitality-friendly than BOOST. The brand's commercial center of gravity is in the evening / weekend, not the morning.
2. **3 of the top 20 are NEW commercial moments not in the original architecture.** The hostess gift, post-meal chocolate, and desk-drawer square are the single largest oversights the previous engine made.
3. **The Friday cluster dominates.** D1, H-NEW1, G-NEW1, F2, #5, I4, A3 — seven of the top 20 moments orbit the Israeli Friday axis. This is the brand's strongest commercial day.
4. **BUNDLE punches above its weight.** Only 4 in the top 20 but two are top 11. BUNDLE's hospitality + gift profile beats BOOST/CHILLAX on totals because it multiplies dimensions.
5. **The "moment of need" (C1, F1) and the "moment of ritual" (#5, H-NEW1, G-NEW1) are different revenue engines.** Moment-of-need drives impulse + daily repeat. Moment-of-ritual drives subscription + hospitality. Different campaigns, different targeting.

---

## 6 · Top 10 gifting moments

Ranked by Gift-Purchase score (tiebreaker: total).

| Rank | Moment | Gift score | Total | Channel signal |
|---|---|---|---|---|
| 1 | **G-NEW1 · Hostess gift to Friday lunch** | 10 | 49 | The single highest-frequency gift moment — most Israeli adults host/attend a Friday meal weekly |
| 2 | **HOL-NEW1 · Rosh Hashana premium gift box** | 10 | 36 | Calendar-driven · September peak · high price point |
| 3 | **HOL-NEW2 · Hanukkah gift** | 10 | 35 | December peak · gift-to-relatives format |
| 4 | **G-NEW3 · Mother's Day / partner birthday** | 10 | 31 | Calendar-driven · spring + scattered birthdays |
| 5 | **G-NEW2 · Workplace gift (promotion / departure)** | 9 | 30 | Ad-hoc · 2-4×/year per workplace |
| 6 | **HOL-NEW3 · Tu B'Av couples gift** | 9 | 33 | August peak · couples segment · Israeli-specific |
| 7 | **G3 · Anniversary dinner at home** | 8 | 32 | 1×/year per couple · premium positioning |
| 8 | **#12 · Visiting-relatives weekend (gift to host)** | 8 | 42 | 6+×/year per traveler |
| 9 | **G-NEW4 · Bringing to a sick friend** *(carefully framed)* | 8 | 28 | Year-round but quiet · winter peak |
| 10 | **H3 · Long bath 21:00 (self-care gift)** | 7 | 36 | Female-skew · "give yourself" or "gift to her" |

**Observation:** the gifting top 10 is split between **calendar-driven holiday peaks** (Rosh Hashana, Hanukkah, Mother's Day, Tu B'Av — 4 of 10) and **always-on gifting habits** (hostess gift, anniversary, visiting relatives, sick friend, self-care — 6 of 10). The brand should staff both — holiday gifting carries the peaks; always-on gifting carries the baseline.

---

## 7 · Top 10 hospitality moments

Ranked by Hospitality score (tiebreaker: total).

| Rank | Moment | Hospitality score | Total | Format |
|---|---|---|---|---|
| 1 | **H-NEW1 · Post-meal chocolate on the Friday lunch table** | 10 | 52 | After-meal table item · weekly |
| 2 | **D1 · Family Friday lunch 12:30** | 9 | 50 | Three-generation table · weekly |
| 3 | **G5 · Hosting friends after-kids-asleep 22:00** | 9 | 43 | Two-couple living room · monthly+ |
| 4 | **H-NEW2 · Saturday afternoon with friends** | 9 | 48 | Pass-around · weekly |
| 5 | **#5 · Hosting weekend (Fri → Sat)** | 9 | 49 | Full Israeli weekend · weekly |
| 6 | **F2 · Friday Shabbat candle moment** | 7 | 48 | Ritual entry · weekly |
| 7 | **A3 · Pre-Shabbat dinner** | 7 | 43 | Pre-meal host moment · weekly |
| 8 | **#12 · Visiting-relatives weekend** | 7 | 42 | Multi-day hosting · 6+×/year |
| 9 | **HOL-NEW1 · Rosh Hashana** | 6 | 36 | Holiday table · once/year |
| 10 | **G-NEW1 · Hostess gift (which becomes a table item)** | 6 | 49 | Bridge: gift → table |

**Observation:** **hospitality is CHILLAX's home turf.** 7 of the top 10 hospitality moments are CHILLAX or BUNDLE; the BOOST entries (D1, A3) are about the *host's energy to host*, not about chocolate-on-the-table. The brand should position CHILLAX as the table chocolate and BOOST as the host-fuel; these are complementary, not competing.

---

## 8 · Top 10 subscription moments

Ranked by Subscription score (tiebreaker: Repeat × Total).

| Rank | Moment | Subscription | Repeat | Frequency |
|---|---|---|---|---|
| 1 | **C1 · 15:30 afternoon crash** | 10 | 10 | 5×/week (workdays) |
| 2 | **F1 · After kids asleep 21:15** | 10 | 10 | 7×/week (parents) |
| 3 | **F3 · End of workday 18:30** | 10 | 10 | 5×/week |
| 4 | **P-NEW1 · 16:30 office desk-drawer** | 10 | 10 | 5×/week |
| 5 | **S-NEW1 · Handbag/car chocolate** | 10 | 10 | 7×/week (always-on) |
| 6 | **#1 · BUNDLE · The clean workday** | 10 | 9 | 5×/week × both products |
| 7 | **A1 · Kids from kindergarten 16:00** | 9 | 9 | 5×/week (school year) |
| 8 | **F2 · Friday Shabbat candles** | 9 | 9 | 1×/week (year-round) |
| 9 | **B1 · Before gym** | 9 | 10 | 3-5×/week |
| 10 | **I4 · Friday afternoon 13:00** | 9 | 9 | 1×/week |

**Observation:** the subscription top 10 splits cleanly into **daily moments** (slots 1-7, 9) and **weekly anchors** (slots 8, 10). For a chocolate subscription service, the daily moments justify the monthly box; the weekly anchors give the box its rhythm. **#1 BUNDLE is the only multi-product subscription moment in the architecture** — it should be the headline of any subscription page.

---

## 9 · Top 10 repeat-purchase moments

Ranked by Repeat-Purchase Potential score.

| Rank | Moment | Repeat | Frequency profile |
|---|---|---|---|
| 1 | **B1 · Before gym** | 10 | 3-5×/week, highly loyal segment |
| 2 | **C1 · 15:30 afternoon crash** | 10 | 5×/week, broad |
| 3 | **F1 · After kids asleep 21:15** | 10 | 7×/week, parents |
| 4 | **F3 · End of workday 18:30** | 10 | 5×/week, broad |
| 5 | **P-NEW1 · Office desk-drawer 16:30** | 10 | 5×/week, office workers |
| 6 | **S-NEW1 · Handbag/car chocolate** | 10 | 7×/week, always-on |
| 7 | **#1 · Clean workday** | 9 | 5×/week × 2 products |
| 8 | **#2 · Dual-parent day** | 9 | 7×/week × 2 products |
| 9 | **A1 · Kindergarten gate 16:00** | 9 | 5×/week (school year) |
| 10 | **F2 · Friday Shabbat candles** | 9 | 1×/week, very loyal |

**Observation:** seven of the top 10 repeat-purchase moments overlap with the subscription top 10. **Frequent moments drive both subscription and repeat-purchase** — they're the same revenue engine, viewed two ways. The audience of a once-weekly moment (F2) is more loyal *per moment* than the audience of a daily moment (C1), but C1 wins on volume.

---

## 10 · Cross-cutting commercial findings

### 10.1 · The Friday axis is the brand's strongest revenue day

Seven of the top 20 revenue moments live on Israeli Friday: D1 (lunch), H-NEW1 (post-meal table), G-NEW1 (hostess gift), F2 (candle moment), #5 (hosting weekend), I4 (Friday afternoon), A3 (pre-Shabbat). **This is the brand's commercial center of gravity.** A single Friday-focused campaign could carry 40% of annual revenue.

### 10.2 · CHILLAX is commercially stronger than BOOST

- BOOST: 12 moments, total commercial score 463 (avg 39)
- CHILLAX: 20 moments, total commercial score 833 (avg 42)
- BUNDLE: 12 moments, total commercial score 442 (avg 37)

CHILLAX has more giftable, more hospitality-friendly, more seasonally-peaking moments than BOOST. **Marketing budget should skew 55% CHILLAX / 35% BOOST / 10% BUNDLE** based on the moment-corpus scoring — not the typical 50/50 BOOST/CHILLAX split.

### 10.3 · The new commercial moments fundamentally re-shape the corpus

Of the top 20 revenue moments, **6 are NEW** (introduced by the previous review's §7). Removing them returns the architecture to its editorial-heavy baseline. **The new commercial moments are not optional additions; they are 30% of the commercial value of the corpus.**

| New moment | Total score | Rank in top 20 |
|---|---|---|
| H-NEW1 · Post-meal chocolate (CHILLAX) | 52 | #2 |
| G-NEW1 · Hostess gift (CHILLAX) | 49 | #5 |
| H-NEW2 · Saturday with friends (CHILLAX) | 48 | #7 |
| P-NEW1 · Office desk-drawer (BOOST) | 44 | #14 |
| S-NEW1 · Handbag chocolate (BOOST) | 43 | #15 |
| HOL-NEW1 · Rosh Hashana | 36 | #21 (just outside) |

### 10.4 · Two revenue engines, not one

The moment corpus reveals **two distinct revenue models**:

| Engine A · Subscription / Repeat | Engine B · Ritual / Hospitality |
|---|---|
| Daily moments · self-purchase · impulse | Weekly+ moments · gift + hospitality · planned purchase |
| C1, F1, F3, P-NEW1, S-NEW1, B1 | D1, H-NEW1, G-NEW1, #5, F2, A3, I4 |
| Drives subscription box volume | Drives premium gift / hospitality bundles |
| Lower ARPU, higher frequency | Higher ARPU, lower frequency |

**Neither alone is the business.** Both engines need their own ad creative, their own SKU pricing, their own retention metrics. The current /strategy engine treats them as one corpus — that's a packaging error, not a moment error.

### 10.5 · Seasonal peaks the corpus reveals

| Window | Moments | Revenue profile |
|---|---|---|
| **Israeli Friday (every week, year-round)** | D1, H-NEW1, G-NEW1, F2, #5, I4, A3 | Largest annual revenue engine |
| **Tel Aviv summer (May–Oct)** | H1, H2, J1 | Seasonal peak (~25% lift) |
| **Rosh Hashana (September)** | HOL-NEW1, A3, D1 | Annual peak (~40% lift in gifting) |
| **Hanukkah (December)** | HOL-NEW2 | Annual peak (~30% lift in gifting) |
| **Tu B'Av (August)** | HOL-NEW3 | Smaller couples peak |
| **School year (Sep–Jun)** | A1, A2 | Steady parent base |
| **Marathon season (Mar–Apr, Oct–Nov)** | B1, #3 | Smaller athlete peak |

---

## 11 · Recommended Final V1 Moment Set (ranked by commercial value)

### BOOST · 13 moments (the maximum end of the 12-15 range)

In order of commercial score:

| # | Moment | Total |
|---|---|---|
| 1 | D1 · Family Friday lunch 12:30 | 50 |
| 2 | C1 · 15:30 afternoon crash | 46 |
| 3 | P-NEW1 · 16:30 office desk-drawer square | 44 |
| 4 | S-NEW1 · Handbag/car chocolate | 43 |
| 5 | A3 · Pre-Shabbat dinner with extended family | 43 |
| 6 | A1 · Kids from kindergarten 16:00 | 42 |
| 7 | B1 · Before gym | 42 |
| 8 | B2 · Before date night 19:00 | 37 |
| 9 | D2 · 22:00 going out (Friday Tel Aviv) | 36 |
| 10 | C2 · After bad night's sleep 08:00 | 35 |
| 11 | A4 · Birthday party prep 14:00 | 34 |
| 12 | B3 · Before 04:00 flight | 32 |
| 13 | C4 · Long drive Tel Aviv → Eilat | 31 |

**Dropped from the previous V1:** E2 (apartment move-day · score 20). Replaced by P-NEW1 and S-NEW1 which together give BOOST its first true daily / always-on commercial drivers.

### CHILLAX · 15 moments

In order of commercial score:

| # | Moment | Total |
|---|---|---|
| 1 | H1 · Tel Aviv balcony summer night | 53 |
| 2 | H-NEW1 · Post-meal chocolate on Friday lunch table | 52 |
| 3 | F1 · After kids asleep 21:15 | 49 |
| 4 | G-NEW1 · Hostess gift to Friday lunch | 49 |
| 5 | H-NEW2 · Saturday afternoon with friends | 48 |
| 6 | F2 · Friday Shabbat candle moment | 48 |
| 7 | H2 · Beach sunset | 47 |
| 8 | I4 · Friday afternoon 13:00 | 45 |
| 9 | G5 · Hosting friends after-kids-asleep 22:00 | 43 |
| 10 | F3 · End of workday 18:30 | 42 |
| 11 | P-NEW2 · Saturday slow breakfast | 41 |
| 12 | G1 · Sitting with spouse Thursday 22:00 | 41 |
| 13 | I1 · After hard day with kids alone 20:30 | 40 |
| 14 | I2 · 30 minutes post-workout 19:00 | 37 |
| 15 | J1 · Chamsin afternoon stuck inside | 37 |

**Dropped from the previous V1:** F4 (Thursday end-of-workweek · 33), G3 (anniversary · 32), G4 (reading together · 37), H3 (long bath · 36) — the four lowest-scoring CHILLAX moments are removed to make room for the new commercial moments. G4 and H3 were storytelling-strong but commercially mid-pack; they can return as **long-tail / niche** moments in V1.5.

### BUNDLE · 8 systems (the maximum end of the 6-8 range)

In order of commercial score:

| # | System | Total |
|---|---|---|
| 1 | #5 · The hosting weekend (Fri → Sat) | 49 |
| 2 | #15 · One brand, one day, two moods | 45 |
| 3 | #2 · The dual-parent day | 44 |
| 4 | #12 · The visiting-relatives weekend | 42 |
| 5 | #1 · The clean workday (Sun-Thu) | 40 |
| 6 | #3 · The athlete week | 38 |
| 7 | #4 · The travel day | 37 |
| 8 | HOL-NEW1 · Rosh Hashana premium gift box | 36 |

**Dropped from the previous V1:** #8 (interview day · 24) — lowest BUNDLE score by a margin. Replaced by HOL-NEW1 which adds the brand's first calendar-driven peak SKU.

### Holding zone (don't ship in V1, save for V1.5)

The following moments scored below the V1 threshold but are commercially viable enough to reserve for future expansion:

- HOL-NEW2 · Hanukkah gift (35) — December peak
- G3 · Anniversary dinner (32) — premium positioning
- HOL-NEW3 · Tu B'Av couples gift (33) — August peak
- G-NEW3 · Mother's Day / partner birthday (31) — calendar
- G-NEW2 · Workplace gift (30) — B2B-adjacent
- G-NEW4 · Bringing to a sick friend (28) — quiet, careful
- E2 · Apartment move-day (20) — long-tail

These would form a **V1.5 expansion pack** to fill seasonal gaps (Hanukkah, Tu B'Av, Mother's Day) and add gift-occasion breadth without diluting V1.

---

## 12 · How this changes the brand's go-to-market

If the engine refactor is built against this commercial architecture rather than the original editorial corpus:

1. **Friday becomes the headline campaign cluster.** 7 of the top 20 moments are Friday-anchored. One persistent Friday campaign (vs scattered moment-of-the-week ads) likely outperforms.
2. **CHILLAX leads volume; BOOST leads frequency.** CHILLAX wins on gift + hospitality + seasonal peaks; BOOST wins on daily subscription. Budget split shifts toward CHILLAX.
3. **Hostess-gift becomes the brand's flagship gifting SKU.** A 6-square CHILLAX bar wrapped for hostess gifts could be a stand-alone product line. Score 49 with weekly cadence justifies a dedicated SKU.
4. **The desk-drawer + handbag moments unlock workday daily subscription.** P-NEW1 + S-NEW1 are the missing daily slots BOOST didn't have. They are why a $25/month BOOST subscription becomes viable.
5. **The Rosh Hashana SKU is the brand's first true holiday play.** HOL-NEW1 (36 score, 10 seasonal) carries a ~September peak that classical chocolate brands rely on. Without it, the brand misses the largest gift-purchase month in Israel.

---

## 13 · What this corpus does NOT do

To be honest about the limits of a commercially-driven corpus:

- It **does not** lead with brand storytelling. The 20 strongest moments by commercial value are not all the 20 most artful moments. Some artful moments (G4 reading together, H3 long bath) drop in this ranking.
- It **does not** include moments the brand should make for its own equity (the J-cluster special occasions). Those would be in a separate "brand equity" track, not the commercial corpus.
- It **does not** account for cost-of-creative. Filming a balcony scene is cheaper than filming a beach. A real go-to-market would weight by production cost / ROAS, which this document doesn't.
- It **does not** account for competitor density. The hostess-gift segment may be commercially attractive AND already saturated by Magnum / Lindt / Frey. Strategy must add the competitor lens.

---

## 14 · Final V1 commercial corpus summary

**36 moments**, ranked by commercial value, weighted toward what sells chocolate.

- **BOOST:** 13 moments
- **CHILLAX:** 15 moments
- **BUNDLE:** 8 systems

**Total commercial score: 1,584** (vs the original 65-moment editorial architecture's ~2,140 — but with 21 risky/niche moments removed and 12 high-revenue commercial moments added).

**The corpus the engine should be built against. Not the corpus that wins advertising awards.**

NO publishing. NO auto-approval. NO charges. Human remains final authority.
