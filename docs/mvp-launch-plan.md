# MVP Launch Plan · 30 Days

**Inputs to this document:** the full strategy + productization stack — most importantly the Customer Value Audit (`docs/customer-value-audit.md` HEAD `2b96281`) which cut the previous V1 spec from $249 / 13 screens / 15 minutes to **$79-99 / ~6 screens / 8 minutes**.
**Constraints:** 30 calendar days · 1 founder + 1 developer · no integrations · no learning · no autonomy · no enterprise.
**Goal:** ship the smallest product that can realistically reach revenue within 30 days.
**Date:** 2026-06-05
**No code. No design files. No more strategy. Implementation plan only.**

---

## 0 · The 30-day reality

Two people. One month. The thing you ship is **one landing page · one Stripe Checkout · one onboarding flow · one LLM generation pass · one kit dashboard · one PDF**. Total. Anything beyond that pushes the launch past Day 30 and the team will regret each cut delayed.

The honest constraint: **22 working days minus 4-5 days of inevitable surprises = 17-18 days of net dev velocity for 1 developer.** That's ~140 productive hours of coding. The founder runs parallel on strategy, copy, payment setup, customer outreach, and prompt engineering. Together: enough capacity to ship a tightly-scoped V1, not enough capacity to ship a tightly-scoped V1 plus *"just one more feature."*

**The two failure modes to avoid:**
1. **Scope creep.** Adding image generation "because the prompts feel incomplete." Adding subscription "because LTV matters." Adding team accounts "because the agency lead asked." Each addition kills the launch.
2. **Premature polish.** Spending Day 25 perfecting the PDF typography when there are zero paying customers. Polish belongs to Week 5+.

The single recommendation: **launch a concierge MVP on Day 7 (manual fulfillment) while building the software MVP that ships on Day 30.** Two products, same week. The concierge proves customers will pay; the software replaces the concierge once it's working.

---

## A · Exact V1 Scope

### A.1 — Five surfaces, that's all

```
1. Landing page         (one URL · one CTA)
2. Stripe Checkout      (hosted · one product)
3. Onboarding flow      (4 questions · 5 screens)
4. Generation + Review  (1 loading screen · 1 review screen)
5. Kit dashboard + PDF  (one page · download button)
```

**That's it. Five surfaces. Every screen and feature outside this list is V2 or later.**

### A.2 — Detailed scope per surface

#### 1 · Landing page

| Element | Required |
|---|---|
| Hero — *"10 Hebrew ads to launch this month. In 8 minutes. ₪299."* | yes |
| Sub-hero — one line about the brand promise | yes |
| Sample output (3 redacted hooks from a real generation) | yes |
| 3-step explanation ("answer 4 questions / AI generates / receive your kit") | yes |
| Pricing section · single tier · single button | yes |
| FAQ — 5 questions max | yes |
| Footer — privacy + terms (one-page each, lawyer-template) | yes |
| **NOT included:** testimonials carousel, blog, podcast embeds, comparison tables, founder photo gallery, video explainer | — |

**Tech:** static Next.js page on Vercel. ~1 day of dev work.

#### 2 · Stripe Checkout

| Element | Required |
|---|---|
| Single product — *"MOOD-style Brand Kit"* — ₪299 ($79) one-time | yes |
| Customer email collected at checkout | yes |
| Hebrew + English Stripe page (Stripe handles this if locale is set) | yes |
| Webhook on `checkout.session.completed` → provisions user account | yes |
| Tax handling via Stripe Tax (no custom logic) | yes |
| **NOT included:** subscription billing, multiple price points, coupon system, gift purchase, multi-currency switching, custom payment form, Apple Pay setup beyond Stripe defaults | — |

**Tech:** Stripe-hosted Checkout. No custom card forms. ~1 day of dev work + 1-3 days of Stripe approval delay (start Day 1).

#### 3 · Onboarding flow

5 screens after Stripe webhook fires.

| Screen | Input | Time |
|---|---|---|
| Welcome — *"Your kit will be ready in 8 minutes"* | none · just CTA "Begin" | 15 sec |
| Q1 — *"What do you sell?"* | text field, max 200 chars, examples shown inline | 30 sec |
| Q2 — *"Who buys it?"* | text field, max 300 chars, examples shown | 40 sec |
| Q3 — *"What deeper feeling do they want from it?"* | text field, max 200 chars, examples shown | 40 sec |
| Q4 — *"Where do your customers live?"* | country + primary language dropdowns | 15 sec |

**Total: ~2:30 of typing + 4 screen transitions.**

**NOT included:** the other 4 onboarding questions from `docs/productization-v1.md` (price band, frequency, founder story, optional brand-asset upload). Those are V2.

**Tech:** simple React form components. State saved to Postgres after each question (so a refresh recovers progress). ~2 days of dev work.

#### 4 · Generation + Review

**Generation screen** (1 loading screen):

| Element | Required |
|---|---|
| Progress messages streaming ("Mapping your audience…", "Writing hooks…", "Ranking by commercial value…") | yes |
| Total runtime cap: 90 seconds | yes |
| Fallback if LLM call fails: retry once, then show graceful error with "we'll email you when ready" | yes |
| **NOT included:** the full 10-layer progress messaging from `docs/productization-v1.md`. V1 uses 3 messages. | — |

**Review screen** (1 screen):

| Element | Required |
|---|---|
| Top: 2 candidate positioning one-liners · operator picks one (or edits inline) | yes |
| Middle: 10 hook cards · each shows hook text, target audience, situation, visual direction · operator marks each "keep" / "skip" | yes |
| Bottom: single button *"Generate my kit"* — finalizes the selection | yes |
| **NOT included:** the 4 separate review screens (territory, positioning, moments, products). All collapsed to 1 screen. | — |

**Tech:** React page with form state, 1 LLM call orchestration backend (OpenAI or Anthropic API), simple commercial-score deterministic function for ranking. ~5 days of dev work — most of which is LLM prompt engineering, not React work.

**LLM cost per generation:** ~$0.40-0.60 (one large structured-output call producing 2 positioning candidates + 10 hooks with metadata). At ₪299 ($79) price, gross margin > 99%.

#### 5 · Kit dashboard + PDF

| Element | Required |
|---|---|
| Single page showing: chosen one-liner + 10 kept hooks (each as a card with hook + audience + situation + visual direction + "copy hook" button) | yes |
| Single button: *"Download PDF (1 page)"* | yes |
| Single button: *"Email kit to a teammate"* (sends the PDF + dashboard link) | yes |
| 90-day re-access via login link emailed to customer | yes |
| **NOT included:** multi-page PDF, branded PDF templates, video generation, image generation, UGC scripts, carousels, product roadmap, performance tracking, regenerate-anytime button | — |

**Tech:** React dashboard + Puppeteer or React-PDF for the single-page export. ~3 days of dev work.

### A.3 — Database (the entire backend)

```
users:            user_id · email · created_at · stripe_customer_id
brand_inputs:     brand_id · user_id · q1_artifact · q2_audience · q3_emotional · q4_locale · created_at
generations:      generation_id · brand_id · positioning_candidates · hook_candidates · created_at
selections:       generation_id · chosen_one_liner · kept_hook_ids · finalized_at
kits:             kit_id · generation_id · pdf_url · accessed_count · last_accessed_at
```

**Five tables. That's the entire database.** Anything else is V2.

**Tech:** Postgres on Supabase (free tier handles first 500 customers). ~1 day of dev work to set up schemas and migrations.

### A.4 — Email infrastructure

| Email | Trigger |
|---|---|
| 1 · Welcome (with login link) | Stripe webhook fires |
| 2 · Kit ready (with login link) | After review finalized |
| 3 · 7-day follow-up (with feedback ask) | Cron, 7 days post-kit |
| 4 · 30-day re-engagement (with V2 teaser) | Cron, 30 days post-kit |

**Tech:** Resend or Postmark. ~1 day of dev work.

**NOT included:** drip campaigns, segment-based marketing emails, transactional UI for password resets (magic link only).

### A.5 — Auth

**Magic links only. No passwords.**

Customer arrives at the kit dashboard via email link → clicks → Supabase Auth verifies token → session set → kit visible.

**Tech:** Supabase Auth magic links. ~half a day of dev work.

**NOT included:** social login, password reset, 2FA, account deletion UI (manual DB delete for V1 if requested).

### A.6 — Total time-to-value for the customer

```
00:00  Lands on landing page
00:30  Clicks "Get my kit · ₪299"
01:30  Completes Stripe Checkout
02:00  Receives welcome email · clicks login link
02:30  Begins Q1
05:00  Finishes Q4
05:10  Sees generation loading screen
06:40  Sees review screen
08:30  Finalizes selection
08:45  Sees kit dashboard
09:30  Downloads PDF
```

**~9-10 minutes from landing-page-arrival to PDF download.** Even with payment latency this fits the spirit of the 8-minute promise.

---

## B · Features Removed (from the prior V1 spec)

The Customer Value Audit identified 12 cuts. This launch plan **enforces every one** and adds more:

| Feature | Removed because |
|---|---|
| 8 onboarding questions | Cut to 4 · save 4 screens, save 2 minutes |
| Full 25-moment corpus | Cut to top 10 ranked moments |
| 7-dimension scoring explainer | Hidden by default · not shown in V1 |
| Long-form positioning statement | Boilerplate · cut entirely |
| 12-page strategy PDF | 1 page only |
| Image prompts as standalone | Removed from V1 deliverable |
| Carousel concepts | Removed from V1 deliverable |
| UGC scripts | Removed from V1 deliverable (sound bites in hook cards instead) |
| Product roadmap | Removed from V1 |
| 4 separate review screens | Collapsed to 1 review screen |
| Email integrations | Resend only · no Mailchimp/Klaviyo |
| Multi-language UI | Hebrew + English landing only · UI English |
| Team accounts | Single-user only |
| Custom branding / white-label | Removed |
| Subscription billing | One-time ₪299 only |
| Brand-asset uploads | Removed |
| Refresh / regenerate functionality | Removed · one generation per purchase in V1 (V1.1 adds 3 regenerations) |
| Real-time chat / support intercom | Removed · email support only |
| Custom domain per brand | Removed |
| Analytics dashboard | Removed |

**Net cut:** roughly 60% of what was in the previous V1 spec. What survives is the minimum that justifies ₪299.

---

## C · Features Postponed (V2 / V3)

Captured explicitly so they cannot creep into V1:

### V2 — earned after 100 paying V1 customers + 12% V1 conversion proven

- Image generation integration (Flux/Replicate · 10 rendered images per kit)
- Full 25-moment corpus
- 12-page strategy PDF
- UGC scripts (timecoded · 3-5 scripts per kit)
- Carousel concepts (with finished slide structure)
- Product roadmap (12-month SKU plan)
- Optional brand-asset uploads
- Refresh × 3 within 90 days
- ₪699-849 add-on price point

### V3 — earned after 100 V2 customers + 2.5× LTV lift proven

- Direct Meta Ads / TikTok / Google Ads publishing
- Automatic performance pulling (CTR · CPA · ROAS)
- Automatic creative refresh when assets fatigue
- Cross-brand benchmarks (anonymized)
- Quarterly strategy refresh from real performance data
- A/B testing automation
- Team accounts + multi-user workspaces
- ₪1,499-1,799/month subscription

### Strictly forbidden in V1 (the temptation list)

- Custom domain per customer
- White-label / agency mode
- Public API
- Zapier / webhook integrations
- Shopify connector
- Notion export
- Customer support chat widget
- Account-deletion self-service UI
- Multi-currency display (Stripe handles)
- Multi-region tax (Stripe Tax handles)
- A/B testing on the landing page itself (Day 1 has one version)
- Founder Loom videos embedded on landing (Day 1 has one screenshot)

Every item above is **a temptation that breaks the 30-day budget**. None ship in V1.

---

## D · Development Order

### Concierge-MVP track (Founder · Days 1-7) — get to revenue first

The point: **prove customers will pay before software exists.** Founder does the work manually for 5-10 customers.

| Day | Founder | Output |
|---|---|---|
| 1 | Stripe Atlas / Israeli LLC setup · Stripe approval started · domain + DNS · landing page wireframe | Stripe approval in flight |
| 2 | Landing page copy written (in Notion · no code) · sample kit assembled manually for one example brand | Landing copy ready |
| 3 | Founder creates a Google Form with the 4 onboarding questions | Concierge funnel operational |
| 4 | Founder stands up a single-page landing site (Webflow/Framer) with Stripe payment-link button | Concierge V0 live |
| 5 | Founder DMs 50 Israeli founders with personal Loom: *"I'll make you 10 ads for ₪299. Reply YES if you want one."* | First sale opportunities |
| 6 | Founder personally generates 5-10 kits using LLM + manual delivery (PDF + email) | First revenue · first feedback |
| 7 | Founder collects feedback · marks the 3 outputs customers actually used · validates pricing | Pricing + value-prop confirmed |

**Concierge revenue target: 5-10 customers × ₪299 = ₪1,500-3,000 by Day 7.**

This track is what gets the team to **revenue inside the 30-day window even if the software MVP slips.**

### Software-MVP track (Developer + Founder · Days 1-30) — automate what worked

| Day | Developer | Founder (parallel) | Output |
|---|---|---|---|
| 1-2 | Repo setup · Next.js scaffold · Supabase project · Vercel deploy · domain + SSL | Stripe approval · landing copy v2 · brand visual assets (logo only) | Foundation laid |
| 3-4 | Stripe Checkout integration · webhook handler · user provisioning | LLM prompt engineering for positioning generation | Payment → user works |
| 5-7 | Magic-link auth · onboarding form (4 screens + welcome) · save-progress logic | LLM prompt engineering for hook generation + commercial-score function | First end-to-end demo (Founder fakes payment) |
| 8-10 | Generation pipeline · OpenAI/Anthropic API integration · structured-output parsing | Review screen UX wireframe · copy for each loading message | Generation works |
| 11-13 | Review screen · selection logic · finalization flow | PDF template design (1 page) · email copy for welcome + kit-ready | Review screen works |
| 14-16 | Kit dashboard · copy-to-clipboard buttons · single-page PDF export | Landing page polished v3 · FAQ written · sample kit hosted | Kit deliverable works |
| 17-18 | Email infrastructure (Resend) · welcome + kit-ready transactional emails | Sample-output redactions for landing-page screenshots | End-to-end live |
| 19-21 | Mobile-responsive polish · cross-browser testing · error handling | Run 5 internal generations with different inputs · catch quality issues | Production-ready |
| 22-24 | Bug fixes from internal QA · LLM prompt iteration based on real outputs | Beta customer outreach · invite 10 of the concierge-MVP customers to use the software flow | Software-MVP 80% quality |
| 25-26 | Final fixes from beta feedback · monitoring + error-tracking setup (Sentry free tier) | Beta customer interviews · top-3 issues prioritized | Bugs from beta closed |
| 27 | Soft launch — share with founder's network (50-200 people) | Founder personally onboards first 5 paid customers | First paid software-MVP sales |
| 28-29 | Standby for production issues · live tuning | Public launch — Twitter / LinkedIn / Israeli founder communities | Public launch live |
| 30 | Stability monitoring · backups · post-launch retro | First-week metrics review · plan Week 5 priorities | Day 30 complete |

**Two-track parallelism is the key.** The concierge track de-risks revenue; the software track de-risks scaling. **By Day 30: ~30-50 paying customers expected. ₪9,000-15,000 in revenue.**

---

## E · Revenue Model

### V1 pricing

**₪299 one-time** ($79 USD-equivalent · ~€73).

Stripe fees: ~2.9% + ₪1.50 = ~₪10 per transaction → **net ₪289 per sale**.

LLM costs: ~₪2.20 per generation (₪0.40-0.60 USD × ~3.5 NIS rate · two LLM calls per kit).

Email + hosting: ~₪0.50 per customer (Resend free tier covers first 3000 emails/month).

**Gross margin per sale: ₪286 / ₪289 ≈ 99%.**

### Why not a lower price

The Customer Value Audit suggested $79-99. ₪299 sits in that range and is **the impulse-purchase ceiling for Israeli credit-card holders**. Lower than ₪299 and the price signals low quality. Higher and it requires CFO approval at small companies.

### Why not subscription in V1

- Subscription requires retention data the brand does not yet have
- Subscription requires churn-management infrastructure (dunning, pauses, cancellations) — adds 1+ week of dev
- One-time billing positions the product against the ₪25K-100K strategy consultant the customer would otherwise hire

**Subscription is V3, not V1.**

### Revenue projection · first 30 days

| Scenario | Customers | Net revenue |
|---|---|---|
| Pessimistic (concierge only succeeds) | 10 | ₪2,890 |
| Realistic (concierge + software soft launch) | 30 | ₪8,670 |
| Optimistic (concierge + software + early WOM) | 50 | ₪14,450 |

Even the pessimistic scenario covers LLM + hosting costs by 10×. The team is paid in validation, not yet in distributable profit.

### Cost ceiling for first 30 days

| Item | Cost |
|---|---|
| Stripe Atlas / company setup | ₪1,200 one-time |
| Domain + email hosting | ₪200/yr |
| Supabase (free tier sufficient for <500 customers) | ₪0 |
| Vercel (free tier sufficient) | ₪0 |
| Resend (free tier · 3K emails/mo) | ₪0 |
| OpenAI / Anthropic credits | ₪500 (prepaid · supports ~200 generations) |
| Lawyer (privacy + terms of service templates) | ₪2,000 one-time |
| Meta Ads test budget (Days 24-30) | ₪3,000 |
| Stock photo / landing imagery | ₪500 |
| **Total** | **~₪7,400** |

**Break-even at ~26 customers.** Realistic 30-customer scenario clears break-even with ₪1,270 in pocket.

---

## F · Success Metrics

### Day 7 — concierge-MVP milestone

- 5-10 paying customers from founder outreach
- ≥ 30% of approached founders reply
- ≥ 20% of repliers convert to paid
- ≥ 80% of paid customers say *"I'd recommend this"* in 1-on-1 interview
- ≥ 60% of paid customers identify the hook library as the most valuable artifact

### Day 30 — software-MVP milestone

- 30-50 cumulative paying customers
- 60%+ complete the 8-minute flow without abandoning
- 80%+ of completers download the PDF
- < 5% refund rate (within 7 days)
- NPS ≥ 50
- Median time-to-kit ≤ 11 minutes (including review)
- ≥ 1 customer publicly posts about the kit organically (Twitter/LinkedIn)
- ≥ 1 inbound DM asking *"can you do this for my agency clients?"* (V2 signal)

### Day 60 — V2-readiness milestone

- 100 cumulative paying customers
- Top-3 V2 feature requests identified (consistent across customers)
- Refund rate stable at < 5%
- At least 5 customers ask for image generation (validates V2 image-gen play)
- At least 2 customers ask for "do this for me monthly" (validates V3 subscription play)

If these metrics hold, **V2 development begins Day 61**. If they miss, the team iterates V1 (different pricing, different copy, different audience) until they hold.

### Failure modes to diagnose

| Metric miss | Likely failure | Triage action |
|---|---|---|
| Completion rate < 50% | Onboarding too long or confusing | Cut Q3 or Q4 · re-test |
| Download rate < 70% | PDF underwhelming · or signaling AI-slop | Re-design PDF · talk to 5 customers |
| Refund rate > 8% | Output quality below promise · or expectations mis-set | Improve prompts · clarify landing-page copy |
| NPS < 40 | Output generic · doesn't feel custom | Sharpen LLM prompts with better few-shot examples |
| < 10 customers in 30 days | Distribution problem, not product problem | Shift more time to outreach · less to dev polish |

---

## G · First 100 Customers Plan

The team needs to acquire 100 paying customers — not 100 leads, 100 *payments through Stripe*. Three plays run in parallel.

### Play 1 · Founder-led outreach · 50-60 customers (Days 1-45)

The fastest, highest-trust path. Cost: founder's time only.

**Daily routine (Days 1-30 · founder):**

| Activity | Daily volume |
|---|---|
| Personalized DMs to Israeli founders (LinkedIn + Twitter + WhatsApp via warm intros) | 15-20 |
| Personal Loom video showing a sample kit | 5 (only to engaged repliers) |
| Phone calls with replies who request demo | 1-3 |
| Tweet thread / LinkedIn post about a brand insight (no pitch) | 1 every 2 days |

**Conversion math:**
- 20 DMs/day × 30 days = 600 DMs
- 25% reply rate (warm intros lift this · cold runs at 5-8%) = 150 conversations
- 30% of conversations book a demo or pay directly = 45 customers

**Realistic founder-outreach output: 40-60 customers by Day 45.**

### Play 2 · Beta cohort + reviews · 10-15 customers (Days 7-21)

Founder offers 10 free kits to high-trust founders in exchange for written reviews + permission to feature them on the landing page.

- Day 7: announce in 2-3 founder Slack communities + WhatsApp groups
- Day 8-14: deliver kits manually, collect feedback
- Day 15-21: convert ~5 of the 10 betas to paid kits for their next brand · or a friend's brand

**Realistic beta-cohort output: 5-15 paid follow-ons.**

### Play 3 · Paid Meta Ads · 30-40 customers (Days 21-60)

Once the landing page converts cleanly (Days 21+), the team turns on a controlled Meta Ads spend.

| Variable | Target |
|---|---|
| Daily ad spend | ₪150-200/day |
| Target CAC | ₪50-100 per paying customer |
| Audience | Israeli founders 28-50 · interest in "Direct-to-consumer brands" · "Marketing technology" · "Shopify owners" |
| Creative | 1 video (founder Loom) + 3 static carousels |
| Funnel | Ad → landing → Checkout → kit |

**Realistic ads-driven output: 30-40 customers by Day 60 at ₪50-100 CAC.**

### Combined funnel · target 100 customers by Day 60

```
Founder outreach     ~50
Beta cohort + WOM    ~10
Meta Ads             ~30
Organic + referral   ~10
────────────────────────
                    ~100 customers · ₪29,000 gross · ₪22,000 net revenue
                                    after Stripe fees, LLM costs, ad spend
```

This is achievable. It is not easy. The founder spends 60% of working hours on customer acquisition.

### What is NOT in the first-100-customer plan

- SEO / content marketing (90+ day lead time · too slow for the window)
- Podcast appearances (worth it but slow · plan post-100)
- Influencer partnerships (CAC unknown · risky in 30 days)
- Affiliate program (V1.5 feature · requires referral infrastructure)
- Cold email at scale (compliance risk · low conversion)
- Reddit / community posting (audience match is poor for Israeli founders)
- Press / media outreach (slow + low conversion at this stage)

---

## H · Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Stripe approval delay > 14 days | Medium | High (no payments) | Apply Day 1 · backup plan: Lemon Squeezy (15 min approval · 5% fee · acceptable Day 30 alternative) |
| LLM output quality variance | High | High | Founder spends 5+ hours/day on prompt engineering Days 3-15 · maintains a "rejected outputs" log to refine |
| Hebrew text rendering in PDF | Medium | Medium | Test from Day 14 · fallback: deliver kit via web dashboard (no PDF) for Hebrew-heavy customers |
| Refund spike | Low | High | 7-day refund window with no-questions-asked policy · monitor daily · 1 refund triggers immediate prompt review |
| Founder time spread too thin | High | High | Concierge track is the highest-ROI use of founder time · enforce a 60/40 split (60% sales, 40% support) Days 1-30 |
| Developer burnout / illness | Medium | Very High | Scope is locked Day 1 · no mid-sprint additions · 2-day buffer built into Week 4 |
| First 10 customers are dissatisfied | Medium | Very High | All concierge customers get a 1-on-1 call to walk through their kit · this surfaces issues before the software-MVP launches publicly |
| Ad spend doesn't convert | Medium | Medium | Don't spend ad budget until Day 21 (after landing page is proven by direct outreach) · cap daily spend at ₪200 until CAC is known |
| Privacy / GDPR / Israeli Privacy Protection Law compliance | Low | Medium | Lawyer-template privacy + terms · no third-party tracking beyond Stripe + Plausible (privacy-respecting analytics) |
| Server costs spike from viral launch | Very low | Low | Vercel + Supabase auto-scale · the cost ceiling at 1000 customers/day is still < ₪500/day |

---

## I · The honest pre-launch checklist

Two days before launch, run this list:

**Legal**
- [ ] Privacy policy live and linked
- [ ] Terms of service live and linked
- [ ] Refund policy clear (7-day no-questions)
- [ ] Israeli VAT (17%) handled via Stripe Tax
- [ ] Cookie consent banner (if required by region)

**Payments**
- [ ] Stripe in live mode (not test mode)
- [ ] Test purchase with founder's own card succeeds
- [ ] Webhook fires reliably (test with 5 purchases)
- [ ] Refund flow tested (do one refund through the dashboard)

**Customer experience**
- [ ] Welcome email arrives within 60 seconds of purchase
- [ ] Magic-link login works in 3 browsers (Chrome, Safari, Mobile Safari)
- [ ] PDF generates correctly for 5 different brand inputs (English + Hebrew)
- [ ] Copy buttons work for all 10 hooks
- [ ] Kit dashboard loads in < 2 seconds

**Quality**
- [ ] 10 internal generations reviewed · 7+ rated "publishable" by founder
- [ ] At least 3 different verticals tested (chocolate / SaaS / fitness)
- [ ] Hebrew rendering verified on a real Israeli customer's device

**Recovery**
- [ ] Error tracking live (Sentry)
- [ ] Email support inbox monitored (support@brand.com)
- [ ] Status page set up (statusxx.io or similar)
- [ ] Backup of production database scheduled daily

If any item is unchecked, **delay public launch by 24 hours.**

---

## J · The hard truth

The previous architecture documents proved that the *strategy* of a Universal Brand OS is robust across verticals. They did not prove that any of it sells.

**The only thing that proves it sells is a customer paying ₪299.**

The 30-day plan is designed around this single proof point. The strategy stack, the moment architecture, the commercial scoring, the product architecture, the positioning architecture, the universal framework — all of it exists to make ONE specific generation produce a kit a customer values at ₪299. If the customer pays, the strategy works. If they don't, every layer above needs to be re-examined.

**The team is not selling architecture. The team is selling a kit of 10 ads + one positioning sentence.** Every minute spent on anything else, between today and Day 30, is a minute that doesn't reach the customer.

---

## K · Final Answer

> **What is the smallest product that can realistically reach revenue within 30 days?**
>
> A single landing page · a Stripe Checkout · a 4-question onboarding · one LLM generation pass · one review screen · one kit dashboard with a 1-page PDF.
>
> **₪299 one-time. ~9 minutes from arrival to PDF download. 5 customers via concierge by Day 7. 30-50 customers via software-MVP by Day 30. 100 customers by Day 60.**
>
> Two tracks running in parallel: **concierge MVP for early revenue (Days 1-7) · software MVP for scaling (Days 1-30).** The concierge proves customers will pay; the software replaces the concierge.
>
> Everything else — image generation, video, publishing, performance tracking, learning, autonomy, subscription, team accounts, agency mode — is V2 or V3. None of it ships in the first 30 days. None of it should be promised on the landing page.
>
> The team is not selling a Universal Brand OS. The team is selling a kit of 10 Hebrew ads.

No code modified. No design files. No more strategy. Implementation plan only.
