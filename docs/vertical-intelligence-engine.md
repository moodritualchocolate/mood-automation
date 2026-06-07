# Vertical Intelligence Engine

**Source diagnosis:** `docs/output-quality-audit.md` (HEAD `7267e08`). Net-quality across 10 verticals averaged **17.7 / 60**. Only MOOD chocolate scored acceptably (36.6). Every other vertical produced generic Hebrew filler with industry-keyword absence — zero *"מס"* in accountant hooks, zero *"גירושין"* in lawyer hooks, zero *"מזגן"* in HVAC hooks.

**Diagnosis:** the generator has no industry knowledge. It has one general-purpose Hebrew chocolate-flavored template kit. Swapping a stub for a real LLM will improve fluency but will NOT solve industry-specificity unless the LLM is fed industry knowledge as part of its prompt.

**This document designs the knowledge layer that does that.** No code changes. Design only.

---

## 1 · The architectural shift

### Current flow (broken for non-chocolate verticals)

```
brand_input (4 answers)
        ↓
   mvpGenerate(input)
        ↓
   Hebrew chocolate-template fill-in-the-blanks
        ↓
   Generic output
```

### Target flow

```
brand_input (4 answers)
        ↓
[A] Vertical Intelligence  →  vertical-specific knowledge
        ↓                       (fears · desires · objections · 
                                 moments · ad formats · proven hooks)
[B] Audience Intelligence  →  audience-specific refinement
        ↓                       (demographic · psychographic · 
                                 buying triggers for this segment)
[C] Creative Generation    →  LLM with the assembled context
        ↓
   Industry-native output
```

Each block has a single, narrow responsibility. **The LLM only enters at block C**, and it inherits the constraints + vocabulary of blocks A + B. The deterministic intelligence layers are the moat. The LLM is the fluency engine.

---

## 2 · The vertical-intelligence schema

Every vertical record is a structured object the LLM consumes as system context. The schema is identical across verticals; the content is industry-specific. The 10-vertical seed corpus below defines the schema by example.

```yaml
vertical:
  id:                  string             # 'real-estate-investment' etc.
  displayName:         string             # human-readable
  primaryLocale:       string             # Hebrew | English | mixed
  
  audience_archetypes:                    # 2-4 distinct buyer types
    - id:              string
      label:           string
      demographic:     string             # age · life stage · location · income
      psychographic:   string             # values · attitudes · world view
      identifyingBehavior: string         # what they DO that proves they're this audience
      audienceNOT:     string             # the negative definition

  fears:               string[]           # 5-8 specific fears
  desires:             string[]           # 5-8 specific desires
  buyingTriggers:      string[]           # 5-8 events that cause a purchase decision
  objections:          string[]           # 5-8 reasons they don't buy
  commonSituations:                       # 8-15 real-life contexts the brand is relevant to
    - id:              string
      label:           string
      situation:       string             # 1-2 sentence description
      buyingMode:      enum: acute / planned / gift
  
  bestPerformingAdFormats:                # ranked by typical performance for this vertical
    - format:          string             # 'founder-explainer-video' | 'testimonial' | etc.
      whyItWorks:      string
  
  contentThemes:       string[]           # 6-10 narrative themes
  emotionalTerritory:                     # 2-3 candidate territories
    - phrase:          string
      tense:           string
      explanation:     string
  
  provenHookFamilies:                     # which hook types actually convert in this vertical
    - family:          enum: identity / authority / pain-mirror / contrast / 
                              urgency / permission / curiosity / social-proof /
                              warning / transparency / sensory / invitation
      whyItWorks:      string
      exampleHookHebrew: string           # 1-2 illustrative hooks
      exampleHookEnglish: string
  
  vocabulary:                             # industry-specific vocabulary
    required:          string[]           # words that MUST appear in ad copy to feel industry-native
    forbidden:         string[]           # words that signal an outsider wrote it
  
  legalConstraints:    string[]           # what cannot be promised
  refundExpectation:   string             # what customers expect when the work is wrong
```

The `vocabulary.required` and `vocabulary.forbidden` lists are the strongest defense against the generic-AI risk surfaced in the previous audit. A real-estate ad without the word *"נכס"*, *"דירה"*, or *"בניין"* anywhere is not a real-estate ad; the LLM call is constrained to use them.

---

## 3 · The 10-vertical seed corpus

Each vertical is filled at three depths: minimal (15-20 lines), standard (40-60 lines), or deep (80+ lines). For V1 implementation, the seed corpus needs every vertical at **standard depth**. The chocolate vertical (already deep from the MOOD work) sets the bar.

### 3.1 · Real Estate Investment

| Field | Content |
|---|---|
| **id** | `real-estate-investment` |
| **primary locale** | Hebrew + English bilingual |

**Audience archetypes**

| id | label | demographic | psychographic |
|---|---|---|---|
| `first-gen-wealthy` | First-Generation Wealthy | 40-60 · Israeli · liquid net worth ₪3M+ · 2-3 kids age 10-25 | Saw parents struggle · doesn't trust the stock market · wants visible/touchable assets · legacy over yield |
| `near-retirement-planner` | Near-Retirement Planner | 55-70 · senior professional · downsizing · about to inherit | Wants predictable monthly income · refuses 60% stocks/40% bonds advice · skeptical of brokers |
| `second-gen-inheritor` | Second-Generation Inheritor | 32-48 · just received family wealth · doesn't know how to manage real estate · sometimes the surviving spouse | Doesn't want to lose what their parent built · scared of property management · wants white-glove service |

**Fears**
- Losing wealth in a market crash they can't see coming
- Being seen as the sucker who fell for a real-estate fund
- Their kids inheriting paper assets that dissolve
- Property managers stealing from them
- Buying at the peak (market timing anxiety)
- Becoming the family member who lost it all
- Being audited on undeclared rental income

**Desires**
- Visible, touchable wealth their grandchildren can point to
- Monthly income they don't have to think about
- Being the family member who set everyone up
- Sleeping soundly without market-cycle anxiety
- Being respected by their CPA / banker / spouse
- Outlasting themselves through what they built

**Buying triggers**
- Parent dies and inheritance comes in
- House just sold (cash sitting in account)
- Big bonus or exit · liquidity event
- Approaching 50 and asking "what now"
- Spouse retired
- Child turned 18 and started asking about money
- Read a Bank of Israel housing-crisis article that scared them

**Objections**
- Too high entry cost (₪500K-2M minimum is a real barrier)
- "I don't trust property managers"
- The market is already at its peak
- "I should just buy ETFs"
- "I don't have time to be a landlord"
- "I don't want my name on a building" (privacy / IRA / tax)
- Lock-up period (illiquidity fear)

**Common situations**

| id | label | situation |
|---|---|---|
| `signing-day` | Signing day | Spouse and CFO sign the deed for a building that will be in the family for 30+ years |
| `first-rent-cheque` | First monthly statement | Statement arrives, the income is real, the relief is physical |
| `child-walkthrough` | Child sees the building | 17-year-old child sees the building parent purchased "for the family" for the first time |
| `inheritance-conversation` | Telling the kids the plan | Sitting with adult children at a Shabbat table explaining the asset structure |
| `funeral-week` | Settling an estate cleanly | The 30 days after a parent dies — the assets are tangible, not paper |
| `liquidity-event` | Post-exit decision | Founder just took home ₪15M from a company sale and asking "what do I do" |
| `cpa-meeting` | The annual tax meeting | The CPA confirms the structure protected the family from a tax event |
| `pre-investment-call` | First sales call | A skeptical buyer testing the operator with hard questions |

**Best-performing ad formats**

1. **Founder Loom-style explainer** (60-180 sec) · the founder explaining the model honestly
2. **Multi-generational testimonial** · parent + adult child both speak
3. **Before-and-after wealth visualization** · same family on signing day + 5 years later
4. **Concrete-vs-paper contrast** · "this building vs your ETF"
5. **Educational long-form** · "how I built generational wealth without a stock account"

**Content themes**
Family legacy · multi-generational wealth · concrete vs paper assets · sleeping at night · "I'd rather own a building than a stock" · the post-retirement income · what we leave to our children · the wealth your CPA doesn't see · 30-year holding · the building that's still standing in 30 years

**Emotional territory candidates**
- *"The thing that's still standing in 30 years"* · future-protective
- *"What you leave behind that doesn't dissolve"* · permanence
- *"Your name on something real"* · pride

**Proven hook families**

| Family | Why it works | Example Hebrew |
|---|---|---|
| **authority** | Buyers will not trust a 28-year-old founder. Operator authority signals are mandatory. | *"אחרי 22 שנים בנדל״ן ישראלי, למדתי דבר אחד."* |
| **contrast** | "Paper vs real" is the most-converted frame in this vertical. | *"תיק מניות נופל. בניין לא."* |
| **pain-mirror** | First-gen wealthy fear *"my kids will lose it all."* Naming it converts. | *"דאגת לכספים שלך כל החיים. עכשיו אתה דואג שהם לא ימוסו אחריך."* |
| **invitation** | Long sales cycles need warm invitations, not closes. | *"בוא נדבר על הבניין הזה."* |
| **social-proof** | Naming actual families that hold the assets (with permission) | *"34 משפחות ישראליות מחזיקות איתנו לפחות 5 שנים."* |

**Vocabulary**
- **Required**: *"נכס"*, *"דירה"*, *"בניין"*, *"שכירות"*, *"דורות"*, *"יציבות"*, *"ירושה"*, *"קרן"*, *"החזקה"*, *"תיק נכסים"*
- **Forbidden**: *"הזדמנות"*, *"רווח מהיר"*, *"הכפלת ההון"*, *"השקעת חלומות"*, *"הפיכת ההון פי X"*, *"מבצע"* (these signal sketchy real-estate operators)

**Legal constraints**: cannot promise yield · cannot promise no loss · cannot use "guaranteed" · disclosure requirements per Israeli securities law.

**Refund expectation**: there is no refund culture in this vertical — purchase decisions are slow and considered. The brand's job is to never enter a deal the customer would regret.

---

### 3.2 · Accountant

| Field | Content |
|---|---|
| **id** | `accountant-small-business` |
| **primary locale** | Hebrew |

**Audience archetypes**

| id | label | demographic | psychographic |
|---|---|---|---|
| `solo-founder-pre-employees` | Solo founder · pre-team | 28-45 · Israeli · revenue ₪200K-1M · עוסק מורשה or חברה בע״מ | Wants someone to handle "the boring part" · finance-illiterate but smart · just got their first 6-figure month and is panicking |
| `scaling-smb` | Scaling SMB | 32-55 · revenue ₪1M-15M · 3-30 employees | Has an existing bookkeeper · realizes they need real strategic CPA · pre-investor or pre-exit |
| `personal-tax-complex` | Wealthy individual w/ complex tax | 40-65 · has assets abroad · multiple income streams · maybe immigrated to/from Israel | Wants to sleep well in March · paying expensive lawyers + needs an accountant to coordinate |

**Fears**
- Tax authority audit · they've heard horror stories
- Missing a deadline and getting fined
- Bad books costing them in an investor due-diligence
- Looking unprofessional to investors / partners
- An incompetent accountant making it worse than no accountant
- "What if my numbers are wrong and I don't know?"

**Desires**
- Clean books they can show any banker / investor / partner without panic
- Sleeping in March
- Being a "real business," not a hobbyist
- Someone who calls them in November to flag year-end opportunities
- Being told "you're doing this right" by a professional

**Buying triggers**
- Just got a letter from מס הכנסה (audit notice, missed filing)
- Last accountant left or was incompetent
- Company crossed ₪500K annual revenue threshold (legally bigger reporting)
- Planning to raise · investor wants to see books
- Life event triggering tax complexity (divorce, inheritance, aliyah, exit)
- Bookkeeper made a major mistake (resigned bookkeeper hand-off catastrophe)

**Objections**
- "My brother-in-law does this for free"
- "I have a bookkeeper, that's enough"
- "I'll deal with it after tax season"
- "I can do it myself with תיקי הוצאות"
- "All accountants are the same"
- "₪2K/month is too expensive"

**Common situations**
- **March panic** (השלמת דוחות שנתיים)
- **Pre-investor due-diligence** (data-room preparation)
- **Year-end** (שיחת סוף שנה in November)
- **New-employee setup** (תלוש משכורת ראשון)
- **VAT-quarter** (כל 3 חודשים)
- **Audit notice arrival** (the מכתב from שלטונות המס)
- **Pre-aliyah / pre-yerida** tax planning conversation

**Best-performing ad formats**
1. **Pain-mirror educational post** ("the 7 mistakes solo founders make every March")
2. **Founder explainer Loom** (the CPA explaining what they do · 90-180 sec)
3. **Client testimonial · numbers focused** ("they saved me ₪47K I didn't know I was owed")
4. **Checklist content** ("pre-audit checklist · 9 items")
5. **Warning-style hook** ("if your books look like this, your audit is coming")

**Content themes**
Tax-season survival · audit-proofing · scaling without bookkeeping pain · pre-exit cleanup · the November year-end conversation · what your last accountant didn't tell you · ה-ICA (Israeli accounting authority) updates · expenses you can actually deduct

**Emotional territory**
- *"No fear of the tax authority in March"* · present-tense relief
- *"Books you can show anyone"* · pride / control
- *"The accountant who calls you in November"* · trust

**Proven hook families**

| Family | Why it works | Example Hebrew |
|---|---|---|
| **warning** | The audit threat is real · invoking it converts | *"אם הספרים שלך נראים ככה, יש לך עד יוני."* |
| **checklist** | The accountant audience loves enumerable proof | *"7 הוצאות שעוסקים מורשים שוכחים לדווח."* |
| **pain-mirror** | Solo founders feel ashamed of bad books | *"אתה לא לבד. רוב היזמים לא יודעים מה לעשות במרץ."* |
| **authority** | Years of experience matter here | *"רואה חשבון 18 שנה. 400 תיקים. הנה מה שאני יודע."* |
| **transparency** | The vertical has a trust deficit · transparent pricing breaks through | *"₪1,800 לחודש. כל המיסים. הכל כלול."* |

**Vocabulary**
- **Required**: *"מס"*, *"חשבונאות"*, *"חשבונית"*, *"דיווח"*, *"מאזן"*, *"מס הכנסה"*, *"ביטוח לאומי"*, *"מע״מ"*, *"עוסק מורשה"*, *"חברה בע״מ"*, *"דוח שנתי"*
- **Forbidden**: *"שלמה"*, *"קסם"*, *"מהפכה"*, *"חיסכון מטורף"*, *"₪50,000 בלי לעבוד"*, *"חינם"* (all signal sketchy "accountant" promotions)

**Legal constraints**: cannot promise tax savings · cannot guarantee audit outcomes · must disclose certification status · must not advise on regulated investments.

**Refund expectation**: high · clients fire fast when work feels sloppy.

---

### 3.3 · Lawyer · Family Law

| Field | Content |
|---|---|
| **id** | `lawyer-family-law` |
| **primary locale** | Hebrew |

**Audience archetypes**

| id | label | demographic | psychographic |
|---|---|---|---|
| `divorcing-parent-mediation` | Divorcing parent · prefers mediation | 35-55 · married 8-22 years · 1-3 kids · usually the one who initiates | Wants minimal harm to children · doesn't want a courtroom war · fears being financially destroyed |
| `divorcing-spouse-served` | Spouse who was served | 32-58 · spouse filed first · partly in shock · partly relieved | Wants to not lose the kids · wants competent representation fast · scared of looking weak |
| `pre-divorce-planning` | Considering separation | 32-55 · still cohabiting · hasn't told anyone · researching | Will not commit to a lawyer until they decide · needs trust-building before the call |
| `prenup-pre-marriage` | Pre-marriage pre-nup | 28-45 · second marriage or significant assets · wedding within 12 months | Wants protection without insulting the partner · process matters |

**Fears**
- Losing custody / time with the kids
- Losing the family home
- Being financially destroyed
- Being publicly humiliated
- Their ex hiring a "better" / more aggressive lawyer
- Being painted as the bad parent
- Their kids never recovering

**Desires**
- Keep the kids whole · keep the parenting relationship alive
- Keep the house (or fair settlement)
- Come out with dignity
- Move forward · stop bleeding emotionally + financially
- Be a good parent through this · model how to handle hard things

**Buying triggers**
- Got served divorce papers
- Spouse just confessed an affair
- Third therapy session collapsed
- Realized they're being financially controlled / hidden assets
- Child explicitly asked them to make it stop
- One parent moved out / sleep on the couch threshold crossed
- A friend's divorce went badly · they don't want that

**Objections**
- "It's too expensive · I'll do mediation alone"
- "My friend says I don't even need a lawyer · I can use a template"
- "I want it amicable · a lawyer will escalate"
- "My ex won't agree to mediation"
- "I'm not ready · I need time"
- "I don't want a divorce yet · I need to understand options"

**Common situations**

| id | label | situation |
|---|---|---|
| `first-consultation` | The 1:1 consultation | Anonymous initial call · the lawyer earns trust in 20 minutes |
| `day-after-deciding` | Day after deciding | The 24 hours after the partner has said "I want a divorce" · the call comes that day |
| `sitting-with-kids-who-dont-know` | Telling the kids | The week leading up to telling the children · the parent rehearsing the conversation |
| `signing-mediation-agreement` | Mediation signing day | The day the negotiated agreement is ratified · the relief is physical |
| `post-court-collapse` | When mediation failed | The week the mediation collapsed and court is now the path |
| `prenup-discussion-with-fiance` | Discussing the pre-nup | The conversation that goes wrong if handled wrong |

**Best-performing ad formats**
1. **Empathy-first founder video** (no selling · the lawyer naming the audience's fear)
2. **Educational explainer** ("what mediation actually looks like") · trust-building
3. **Anonymous client testimonial** (audio · with permission · faces obscured)
4. **Long-form thread** explaining a hard truth (e.g., "what the court actually decides about kids")
5. **Process-transparency post** ("here is what happens from your first call")

**Content themes**
Protecting children · mediation > court · financial protection · the post-divorce life · co-parenting through · pre-nups that don't insult · the conversation no one prepares you for · keeping the kids whole · dignity in chaos

**Emotional territory**
- *"Protect what still matters"* · present-tense protective
- *"Keep the children whole"* · child-focused permanence
- *"Dignity, even now"* · pride-protection

**Proven hook families**

| Family | Why it works | Example Hebrew |
|---|---|---|
| **empathy** | The audience is in pain · the lawyer must lead with seeing them | *"אם את קוראת את זה, את כבר החלטת."* |
| **authority** | Years + cases · this audience demands experience | *"אחרי 14 שנה בייצוג נשים בגירושין, למדתי דבר אחד."* |
| **child-focused** | Children are the universal motivator in this vertical | *"הילדים זוכרים איך זה טופל."* |
| **permission** | Many fear they're "wrong" to want the divorce | *"מותר לך להחליט שזה נגמר."* |
| **transparency** | The lawyer's process explained openly creates trust | *"הפגישה הראשונה אצלי נמשכת שעה. אני אומר לך אם אני יכול לעזור."* |

**Vocabulary**
- **Required**: *"גירושין"*, *"גישור"*, *"ילדים"*, *"משמורת"*, *"הסכם"*, *"זכויות"*, *"בית הדין"*, *"רכוש משותף"*, *"מזונות"*, *"משפחה"*
- **Forbidden**: *"קל"*, *"מהיר"*, *"כיף"*, *"זול"*, *"לבד"*, *"בלי כאב"* (all signal incompetence in this vertical · divorce is never easy/quick)

**Legal constraints**: cannot guarantee outcomes · cannot promise the kids · must use careful language about ongoing cases · advertising regulations per לשכת עורכי הדין.

**Refund expectation**: not refund-driven · client retention is the metric · clients fire fast when the lawyer doesn't return calls.

---

### 3.4 · Fitness · Running (Returning Runners)

| Field | Content |
|---|---|
| **id** | `fitness-returning-runners` |
| **primary locale** | English-first · Hebrew secondary |

**Audience archetypes**

| id | label | demographic | psychographic |
|---|---|---|---|
| `post-kids-comeback` | Post-kids comeback runner | 32-45 · 1-3 kids · ran 5K-half-marathon in 20s/30s · 2-5 year break | Wants identity back · scared of injury · embarrassed of slowness |
| `post-injury-comeback` | Post-injury return | 28-50 · serious injury 1-3 years ago · cleared by PT · scared of re-injury | Wants to run "smart" · trusts gradual buildup · skeptical of branded recovery products |
| `40-plus-restart` | 40+ restart | 40-55 · never serious about fitness but now feels they need to be · birthday-triggered | Conservative on time investment · wants the simplest possible plan |
| `medical-flag` | Medical-flag return | 35-60 · doctor said "you should exercise" · scared and motivated in equal parts | Will not call themselves an "athlete" · wants doctor-approved tone |

**Fears**
- Injury (especially knee)
- Being slow / publicly embarrassed
- Being too old to start
- Gaining weight back
- Letting themselves down (again)
- Kids seeing them quit
- Not being able to keep up with their group

**Desires**
- Feel like themselves again
- Finish a race
- Not be tired
- Be present in body
- Be the parent their kids think they are
- Run without thinking · just go out and run

**Buying triggers**
- Birthday with a 0 or 5
- Medical checkup with bad news
- Friend just ran a marathon (social-proof + envy)
- Saw a photo of themselves they didn't recognize
- Kid said "you used to be fast"
- New year (January 1-15 spike · September second spike)
- Garmin / Apple Watch reveal a fitness score drop

**Objections**
- "My knees aren't what they used to be"
- "I don't have time"
- "I tried before and quit"
- "These shoes are too expensive"
- "I'll just walk"
- "I'm too old"
- "I don't even own running shoes anymore"

**Common situations**
- **First lace-up** (the morning of the first run · 06:00-07:00)
- **2nd-week quit moment** (the day after a missed run when the doubt is loudest)
- **First 5K** (race day · first finish line in years)
- **Race-day kit assembly** (the night before)
- **Injury recovery** (the slow return after a stress fracture)
- **Long-run morning** (Saturday 06:00 · weekly ritual)
- **Post-run shower** (the 30 minutes when identity rebuilds)
- **Doctor-told-me-to-exercise** week 1

**Best-performing ad formats**
1. **Real-runner UGC** (35-50 year old runner · not a model · honest delivery)
2. **Identity transformation** (before/after IDENTITY not weight)
3. **Founder running** (the founder of the brand running themselves · raw)
4. **Educational form-fix** (60-sec form tip from a coach)
5. **Race-day story** (UGC from a 5K / half-marathon finish line)

**Content themes**
Comeback runner · age-appropriate running · injury prevention · pace-irrelevance · running with kids · weekend long-run · the "becoming a runner again" story · what to wear · what to eat · what to do when you want to quit · running through life events (divorce / death / new job)

**Emotional territory**
- *"The first mile back"* · present-tense reclaim
- *"You're a runner. You just forgot."* · identity-mirror
- *"Running again, not starting"* · dignity

**Proven hook families**

| Family | Why it works | Example |
|---|---|---|
| **identity** | The audience LOST an identity · the hook gives it back | *"You're a runner. You just forgot for a minute."* |
| **permission** | They're ashamed of starting over · permission unlocks the buy | *"You're not slow. You're starting."* |
| **authority** | A coach / founder with race history converts | *"After 14 marathons and 1 stress fracture, here's what I do differently."* |
| **pain-mirror** | The first mile is universal pain · naming it lands | *"The first 200 meters are the hardest. Then it gets easier."* |
| **invitation** | This vertical converts on warm invitations, not hard CTAs | *"Lace up tomorrow. We'll be here."* |

**Vocabulary**
- **Required**: `run`, `runner`, `mile`, `kilometer`, `pace`, `comeback`, `lace up`, `5K`, `half-marathon`, `recovery`, `Saturday long run`
- **Forbidden**: `crush it`, `beast mode`, `no excuses`, `transformation`, `fat-burning`, `shredded`, `gains` (all signal hardcore fitness culture this audience escaped)

**Legal constraints**: cannot promise weight loss · cannot promise injury prevention · health-claim language is regulated.

**Refund expectation**: high during first 30 days (returning runners often quit and want refund) · low after they've completed a first 5K with the shoes.

---

### 3.5 · Restaurant

| Field | Content |
|---|---|
| **id** | `restaurant-neighborhood-dinner` |
| **primary locale** | Hebrew |

**Audience archetypes**

| id | label | demographic | psychographic |
|---|---|---|---|
| `tired-post-work-couple` | Tired post-work couple | 28-45 · cohabiting or married · both work full days · 2-4× weekly dine-out budget | Wants a real meal · doesn't want to cook · doesn't want a loud sceney place |
| `parents-on-date-night` | Parents on date night | 32-50 · parents · 1×/month or rarer date night · babysitter constraint | Wants the night to count · short timeframe · they cannot waste 2 hours on bad food |
| `corner-table-regulars` | Regulars who want to be known | 35-65 · live or work locally · go to the same restaurant 1-3×/month | Wants to be recognized · likes the same table · trust the chef |
| `out-of-town-visitor-host` | Hosting out-of-town guests | 30-55 · diverse age · entertaining family or business guests | Wants restaurant choice to reflect well on them · stakes are higher than usual |

**Fears**
- Bad meal · embarrassing for guests
- Loud crowd · cannot have a real conversation
- Slow service · evening ruined
- Disappointed date · social cost
- Expensive disappointment · ₪400 wasted
- Uncomfortable atmosphere (wrong music / lighting / vibe)

**Desires**
- A real evening · 90 minutes that feels like a break
- Being treated like a regular
- Food that reminds them of something (grandmother / travel / childhood)
- Ending the day with something real, not "fed"
- Quiet enough to talk · warm enough to relax

**Buying triggers**
- Anniversary · birthday · special occasion
- Finished a hard week (Thursday/Friday booking spike)
- Partner needs cheering · drama at home
- Friends visiting · need to impress
- Just finished a project / closed a deal
- Weather (cold rainy nights drive cozy-restaurant searches)

**Objections**
- "Too expensive for a Tuesday"
- "Too far from home"
- "I don't know what to order"
- "What if it's not what I expected"
- "I'd rather eat at home"
- "We can't get a table at the time we want"

**Common situations**
- **Thursday 19:30 booking** (week-winding-down)
- **Friday 13:30 lunch** (slow workday close)
- **Anniversary at the corner table** (the chef knows)
- **Birthday with extended family** (12 people · cake brought out · staff sings)
- **Post-deal celebration** (founder closing a sale, takes the team)
- **Sunday afternoon family lunch** (3 generations)
- **First date with someone serious** (the stakes are real)

**Best-performing ad formats**
1. **Food porn close-ups** (single plate · slow rotation · steam visible)
2. **Chef-on-camera** (chef plating · explaining the dish · 30 sec)
3. **The dining room scene** (wide shot · candlelit · people talking · no faces)
4. **Regular's testimonial** (a known local explaining why they keep coming back)
5. **The reservation page / availability scarcity** ("Friday 19:30 last table")

**Content themes**
Ingredient sourcing · chef's story · the specific dish · the atmosphere · regulars · the chef's mother's recipe · seasonal menus · pre-show / post-show dining · the table you always sit at

**Emotional territory**
- *"The corner table is waiting"* · invitation-warm
- *"A real meal · not another rushed pickup"* · ritual
- *"The bread comes out at 19:30"* · sensory anchoring

**Proven hook families**

| Family | Why it works | Example Hebrew |
|---|---|---|
| **sensory** | Restaurant ads convert through sensory copy, not benefits | *"הלחם יוצא מהתנור ב-19:30."* |
| **invitation** | Restaurants must invite, not pitch | *"השולחן בפינה ממתין לך."* |
| **chef-led** | Founder-as-chef converts in this vertical | *"אני מבשל את זה כמו שאמא שלי בישלה."* |
| **scarcity** | Reservation availability scarcity moves bookings | *"שלוש שולחנות בערב חמישי. שאר השבוע מלא."* |
| **regular** | Social-proof through known regulars | *"רחל אוכלת אצלנו כל יום ראשון מאז שפתחנו."* |

**Vocabulary**
- **Required**: *"שולחן"*, *"מסעדה"*, *"שף"*, *"ארוחה"*, *"לחם"*, *"מנה"*, *"יין"*, *"הזמנה"*, *"ערב"*, *"שירות"*
- **Forbidden**: *"מהיר"*, *"זול"*, *"ב-X שקלים בלבד"*, *"דיל"*, *"מבצע"*, *"חבילה משפחתית"* (all signal fast-food / chain restaurants, not what this vertical needs)

**Legal constraints**: none beyond food-safety disclosure · allergen labeling required.

**Refund expectation**: extremely low · customers rarely return for refund but never come back if disappointed.

---

### 3.6 · SaaS · Productivity

| Field | Content |
|---|---|
| **id** | `saas-productivity-focus` |
| **primary locale** | English-first |

**Audience archetypes**

| id | label | demographic | psychographic |
|---|---|---|---|
| `knowledge-worker-individual` | Individual knowledge worker | 28-45 · engineer / designer / writer / consultant · works in Slack/Teams 6+ hrs/day · already paying for ≥ 2 productivity SaaS | Believes they used to be smarter · attributes decline to "distraction" · feels guilty about phone use |
| `creator-pro` | Creator / solo professional | 25-42 · works from home · monetizes content · ships their own work | Income depends on focus · distraction has direct $ cost · willing to pay for tools that work |
| `team-lead-small` | Small-team lead | 32-48 · manages 3-12 people · responsible for team output | Wants team-level focus · willing to pay $50-200/seat/mo · needs admin / SSO |

**Fears**
- Shipping less than peers
- Being unable to focus when it matters
- Burning out
- Falling behind in their field
- Being seen as inefficient by their boss / clients
- Becoming the "always-on" version of themselves

**Desires**
- Deep work · 2-hour focus blocks daily
- Shipping more (one less Slack day = one extra hour of work)
- Clearer head · less afternoon fog
- Weekends off (work doesn't bleed into Saturday)
- Craftsman-pride · the work has depth again

**Buying triggers**
- Missed deadline · noticed they can't focus anymore
- Bad performance review
- Saw a colleague's screen using the product
- Podcast mention by trusted host
- Twitter screenshot from a trusted creator
- Burnout signal (couldn't read a chapter at night)

**Objections**
- "I have Notion / RescueTime already"
- "I don't want another tool"
- "I can't trust it with my data"
- "My company won't approve it"
- "I'll install it and forget to use it"
- "$14/month is a lot for one tool"

**Common situations**
- **09:00 Monday Slack overwhelm** (the week starting on the wrong foot)
- **14:00 Wednesday focus loss** (post-lunch fog)
- **Sunday-anxiety** (work-bleed into weekend)
- **Final hour of workday** (the trying-to-finish-one-thing window)
- **Pre-meeting prep** (the 20 minutes before a deep call)
- **Post-meeting recovery** (the 25 minutes you lose to Slack catchup)
- **Friday afternoon ship window** (the "I said I'd send this today")

**Best-performing ad formats**
1. **Product demo video** (10-30 sec · single feature · no talking head)
2. **Before/after Slack screenshot** (notification chaos → clean)
3. **Founder using product** (founder on their own laptop · real screen)
4. **Creator tweet quote** (real X/Twitter screenshot · attributed)
5. **Case study with numbers** ("Joe shipped 40% more after 30 days")

**Content themes**
Deep work · focus protection · notification-free · the hour you got back · craftsmanship · shipping > busyness · async > meetings · single-purpose tools · the boring tool that works

**Emotional territory**
- *"The hour you got back"* · past-conditional reclaim
- *"Software that protects you"* · trust
- *"Build with depth again"* · craftsman pride

**Proven hook families**

| Family | Why it works | Example |
|---|---|---|
| **pain-mirror** | Knowledge workers self-diagnose accurately · mirroring converts | *"You opened Slack 47 times today."* |
| **ROI** | Numbers convert in B2B SaaS | *"The 2-hour daily focus block you've been missing."* |
| **authority** | Founder-coder authority is strongest in dev/SaaS | *"I built this because I shipped 2× more after I made it."* |
| **social-proof** | Creator and dev testimonials are gold | *"Used daily by 14,000 indie devs."* |
| **anti-marketing** | This audience is allergic to corporate-speak · plainness wins | *"It blocks notifications. That's the whole product."* |

**Vocabulary**
- **Required**: `focus`, `deep work`, `notifications`, `slack`, `inbox`, `shipping`, `block`, `craft`, `flow state`, `interrupts`
- **Forbidden**: `productivity hack`, `10x productivity`, `crush your day`, `peak performance`, `unlock your potential`, `gamechanger`, `revolutionary` (all signal hustle-culture content this audience escaped)

**Legal constraints**: data privacy claims must be substantiated · cannot claim "blocks 100% of distractions" without basis.

**Refund expectation**: high · most SaaS offers 14-30 day money-back · expect 5-10% refund rate on trial conversions.

---

### 3.7 · HVAC · Local Service

| Field | Content |
|---|---|
| **id** | `hvac-local-service` |
| **primary locale** | Hebrew |

**Audience archetypes**

| id | label | demographic |
|---|---|---|
| `homeowner-emergency` | Homeowner · AC just died | 30-65 · own apartment or house · AC suddenly broken · 30°C+ outside |
| `landlord-managing-multiple` | Landlord · multiple units | 35-65 · owns 2-8 rental units · needs a reliable on-call HVAC contact |
| `pre-summer-prep` | Pre-summer planner | 35-65 · early May · proactive about checking the AC before chamsin |
| `new-tenant` | New tenant moving in | 25-45 · just signed a lease · AC in apartment is questionable |

**Fears**
- Being scammed by an opportunist technician
- Technician not showing up at the promised time
- Paying for an unnecessary repair (false-positive diagnosis)
- Being stuck without AC in a 40°C heatwave
- Being upsold a whole-unit replacement when a service would do
- Tenant complaining and threatening lease break

**Desires**
- A working air conditioner in August · today
- Fast service (same-day if possible)
- Honest pricing (no surprises)
- Technician who explains what they did
- Job done right the first time

**Buying triggers**
- AC just broke (the most urgent buying trigger in the corpus)
- Heatwave forecast (3-day lead time)
- Monthly electricity bill spiked
- Home renovation completing
- New tenant moving in
- AC making weird noises / weak output

**Objections**
- Price (too expensive vs handyman cousin)
- Trust (every neighborhood has a technician horror story)
- Availability (will they actually come today)
- "It's just a bit hot · I can wait"

**Common situations**
- **38°C day with broken AC** (the emergency)
- **Pre-summer service** (May)
- **Post-renovation install** (new ducts / new system)
- **Landlord-tenant call-out** (tenant calls landlord · landlord calls Krir)
- **Saturday morning slow leak discovery** (water dripping from AC)
- **Pre-summer-vacation departure prep** (leaving the AC working before flying out)

**Best-performing ad formats**
1. **WhatsApp screenshot testimonial** ("Krir came in 90 minutes · ₪450 · done")
2. **Technician-on-the-job** (technician at customer's apartment · honest)
3. **Before/after temperature** (apartment thermometer at 31° → 24°)
4. **Transparent pricing post** ("our prices · no surprises")
5. **Review-screenshot collage** (Google reviews · WhatsApp messages · stars)

**Content themes**
Same-day service · fixed-price quote · before-summer prep · trustworthy technicians · "we'll tell you if you don't actually need a repair"

**Emotional territory**
- *"A working air conditioner in August. Today."* · present-tense urgent relief
- *"You'll know the price before the visit"* · transparency-trust
- *"We show up when we say we will"* · competence

**Proven hook families**

| Family | Why it works | Example Hebrew |
|---|---|---|
| **urgency** | The vertical's defining emotion is heat-driven urgency | *"38° מחר. אל תחכי."* |
| **transparency** | The vertical has a trust deficit · price-up-front converts | *"₪450 לטיפול סטנדרטי. תדעי את המחיר לפני שאני יוצא."* |
| **social-proof** | Reviews convert · this is a Google Maps vertical | *"147 ביקורות החודש. תקראי."* |
| **competence** | "I know what I'm doing" beats "we love your home" | *"שלושים שנה בשטח. בודק את המזגן ביום אחד."* |
| **invitation** | Pre-summer is the planned buyer · invitations work | *"שירות לפני הקיץ — ₪280 בלבד עד 15 ביוני."* |

**Vocabulary**
- **Required**: *"מזגן"*, *"טיפול"*, *"תיקון"*, *"קיץ"*, *"חום"*, *"דירה"*, *"טכנאי"*, *"שירות"*, *"מחיר"*, *"אחריות"*
- **Forbidden**: *"מהפכה"*, *"מבצע מטורף"*, *"חינם"*, *"50% הנחה"*, *"לחיים"* (all signal sketchy ad-driven companies, not real technicians)

**Legal constraints**: must disclose technician certification · cannot guarantee repair without diagnosis · warranty terms must be clear.

**Refund expectation**: rare · customers want re-service, not refund · trust is everything.

---

### 3.8 · Cosmetics · Skincare

| Field | Content |
|---|---|
| **id** | `cosmetics-skincare-anti-overdone` |
| **primary locale** | Hebrew |

**Audience archetypes**

| id | label | demographic | psychographic |
|---|---|---|---|
| `tired-of-overdone` | Tired of overdone | 35-55 · women · had a 7-step routine that didn't deliver | Wants 3 honest products · skeptical of influencer beauty · finished with filters |
| `post-pregnancy-reset` | Post-pregnancy reset | 30-42 · 6-18 months postpartum · skin changed | Doesn't want her old products · needs different texture / honesty about hormones |
| `perimenopause-shift` | Perimenopause shift | 42-55 · skin/hair/body shifting · suddenly buying different products | Wants someone to acknowledge the phase · won't tolerate anti-aging marketing |
| `minimalist-young` | Minimalist young | 25-35 · 3 products max · "less is more" · willing to pay more for less | Reads ingredient lists · supports indie brands · suspicious of celebrity collabs |

**Fears**
- Wasting money on stuff that doesn't work
- Looking older (but won't admit they care)
- Breakouts / sensitivity reaction
- Being seen as trying too hard (vain)
- Greenwashing — being lied to about "natural"
- Becoming the version of themselves they don't recognize in the mirror

**Desires**
- Skin that looks like skin (not a filter)
- Clear (or accepted) skin
- Simplicity (3 products, not 12)
- Time back (5-minute routine, not 20)
- Feeling like themselves
- Honest ingredients

**Buying triggers**
- Birthday with 0 or 5
- Breakout / sudden change in skin
- Post-pregnancy / postpartum (3-12 months)
- Post-divorce / post-breakup reset
- Friend recommendation (high-trust)
- Noticed in photo
- Perimenopause shift

**Objections**
- Too expensive
- "I already have a routine"
- Sensitive skin · scared to try
- "Doesn't actually work"
- Greenwashing skepticism
- "Another brand · who needs it"

**Common situations**
- **Morning bathroom routine** (06:30-07:30)
- **Evening cleanse** (22:00-23:00)
- **Pre-event prep** (wedding · job interview · date)
- **Post-shower face dry** (the 2-min moisture window)
- **Packing for trip** (3-product carry-on selection)
- **Sunday slow morning** (the only time to do the "full" routine)

**Best-performing ad formats**
1. **Founder skin reveal** (founder's own skin · no makeup · honest delivery)
2. **Ingredient explainer** (what's actually in it · why · 30-90 sec)
3. **Before/after careful** (realistic · same lighting · same angle · 3 weeks apart)
4. **UGC honest review** (real customer · no script)
5. **Day-in-routine** (5-minute routine demo · single take)

**Content themes**
Real skin · ingredient honesty · simplicity · age-positive (not anti-aging) · less-is-more · post-pregnancy skin · perimenopausal skin · the products you don't need

**Emotional territory**
- *"Feel like myself, not a filter of myself"* · authenticity-reclaim
- *"Real skin · not perfect skin"* · acceptance
- *"Three products. Not twelve."* · simplicity

**Proven hook families**

| Family | Why it works | Example Hebrew |
|---|---|---|
| **anti-marketing** | This audience escaped Sephora-marketing · plainness converts | *"47 מוצרים שאת לא צריכה."* |
| **ingredient-truth** | Ingredient transparency builds trust | *"מה באמת בקרם הלחות שלך?"* |
| **real-photo** | "No filter" claim converts when proven | *"בלי פילטר. בלי תיקונים. הפנים שלי."* |
| **pain-mirror** | Skin shame is universal · naming it lands | *"גם אני שכחתי איך נראה העור שלי."* |
| **founder-story** | Founder skin journey converts | *"בניתי את זה כי הפסקתי לסבול את הפנים שלי בעצמי."* |

**Vocabulary**
- **Required**: *"עור"*, *"פנים"*, *"קרם"*, *"שמן"*, *"לחות"*, *"רכיב"*, *"שגרה"*, *"חומרים פעילים"*, *"טבעי"*, *"קוסמטיקה"*
- **Forbidden**: *"קסם"*, *"נס"*, *"מהפכה"*, *"בלעדי"*, *"חידוש פורץ דרך"*, *"זוהר ניצחי"*, *"אנטי-אייג'ינג"* (all signal mass-market beauty industry this audience escaped)

**Legal constraints**: cosmetic-claim regulations · cannot promise medical results · ingredient disclosure required.

**Refund expectation**: medium · 30-day satisfaction guarantee is standard in this category.

---

### 3.9 · Jewelry

| Field | Content |
|---|---|
| **id** | `jewelry-fine-self-purchase` |
| **primary locale** | Hebrew |

**Audience archetypes**

| id | label | demographic | psychographic |
|---|---|---|---|
| `self-purchase-milestone` | Self-purchase milestone | 32-55 · women · marking a personal milestone (promotion · divorce · 40th) | Wants to mark moment without explanation · doesn't need permission · buys when she decides |
| `gift-significant-partner` | Significant partner gift | 35-60 · partner buying for spouse · anniversary / significant event | Wants the gift to "be right" · scared of the wrong choice · willing to be guided |
| `gift-to-daughter-mother` | Gift to daughter / mother | 40-65 · marking a daughter's wedding / mother's milestone | Wants something to be passed down · cares about quality + meaning |

**Fears**
- Looking gauche / showy
- Paying too much for not enough
- The gift not received well
- Being seen as trying to show off
- Making a memory of the wrong moment
- The piece breaking / being lost

**Desires**
- Mark a moment that won't be marked otherwise
- Be remembered (for the giver)
- Feel like the gift was right
- Pass something down to children
- Wear something meaningful daily
- Self-respect through a small artifact

**Buying triggers**
- Anniversary (10, 15, 20, 25, 50)
- Birthday with 0 or 5
- Birth of a child
- Self-promotion / job change / business sale
- Pre-trip (souvenir to self)
- Achievement (degree · book published · race finished)

**Objections**
- "Too expensive"
- "I don't wear much jewelry"
- "I'm not a 'jewelry person'"
- "They won't like it" (gift)
- "I don't know what they'd want"
- "It'll feel ostentatious"

**Common situations**
- **Self-purchase after a milestone** (the morning after a promotion · alone)
- **Gift-shopping for partner** (the week before anniversary · with constraint)
- **Wearing it out for the first time** (the first event after acquisition)
- **Handing it down** (mother → daughter at engagement)
- **Self-purchase post-divorce** (reclaiming agency through a small object)

**Best-performing ad formats**
1. **Founder-as-designer** (showing the design process · sketches · hands at work)
2. **Piece in real-life context** (worn at a meaningful moment · not in a studio)
3. **Close-up sensory** (light catching the metal · texture · 5-sec slow zoom)
4. **Gift-recipient reaction** (real moment of receiving · with permission)
5. **Owner story** ("the day she wore it to her own promotion")

**Content themes**
Heirloom · self-marking · craftsmanship · sustainability sourcing · "she bought it for herself" · the daughter's wedding piece · what's worth passing down

**Emotional territory**
- *"Mark the moment that nobody else marked for you"* · self-significance
- *"Worth passing down"* · permanence
- *"She bought it for herself"* · agency

**Proven hook families**

| Family | Why it works | Example Hebrew |
|---|---|---|
| **significance** | The vertical sells meaning, not metal | *"היום היא ענדה אותה לקידום שלה."* |
| **craft** | Process transparency builds trust | *"12 שעות עבודה ביד. כל חתיכה."* |
| **permission** | Self-purchase needs permission | *"היא קנתה אותה לעצמה."* |
| **heirloom** | Multi-generation framing converts | *"היא תעבור הלאה."* |
| **founder-designer** | Designer-as-founder authority | *"אני מעצבת את זה כאילו אני אענוד את זה."* |

**Vocabulary**
- **Required**: *"תכשיט"*, *"טבעת"*, *"שרשרת"*, *"עגיל"*, *"זהב"*, *"כסף"*, *"יהלום"*, *"מתנה"*, *"דור"*, *"עיצוב"*, *"יחיד במינה"*
- **Forbidden**: *"בלינג"*, *"מבריק"*, *"זוהר"*, *"מבצע פסח"*, *"בלעדי"*, *"וי איי פי"* (all signal mass-market jewelry / mall vendors)

**Legal constraints**: precious-metal labeling · gemstone disclosure · sourcing claims must be substantiated.

**Refund expectation**: low · jewelry rarely returned · but customers who feel they overpaid never recommend.

---

### 3.10 · Chocolate Brand (MOOD canonical)

Already deep from prior architecture documents. Summary form for completeness — full version lives in `docs/moment-architecture.md` + `docs/positioning-architecture-v1.md`.

| Field | Content (compressed) |
|---|---|
| **id** | `chocolate-presence-tools` |
| **primary locale** | Hebrew |
| **Audience archetypes** | Presence-Aware Israeli Adult (32-50 · presence-aware · works full or hybrid · disposable income) |
| **Fears** | Losing one's own life one zoned-out hour at a time · being absent at family meals · the days blurring |
| **Desires** | Be present on purpose · reclaim the moments · keep what was almost lost |
| **Buying triggers** | Pre-Friday-lunch · pre-kids-asleep · pre-date-night · post-coffee-realization · pre-gym · pre-presentation |
| **Common situations** | 36 moments across A-J clusters (see `docs/moment-architecture.md`) |
| **Best ad formats** | Documentary 50mm photography · still-life · couple-on-couch · post-bedtime-hallway · UGC kitchen-counter |
| **Emotional territory** | The moment you almost lost (past-conditional → present-tense reclaim) |
| **Proven hooks** | truth-mirror · permission · pattern-break · antidote · invitation · curiosity |
| **Vocabulary required** | שוקולד · קקאו · ריבוע · רגע · נוכחות · בית · יום · שקט · מותר |
| **Vocabulary forbidden** | מהפכה · בלינג · ענקי · אנרגיה (the SKU formulas only · not adjectives) · אבקה · נוסטרופיק · ביוהאקינג |

---

## 4 · The redesigned generation flow

```
[A] Brand Input               (operator's 4 onboarding answers)
        ↓
    detectVertical()          deterministic + LLM-assist:
        ↓                     match operator's artifact string to one
                              of N vertical records (closest-match + confirm)
        ↓
[B] Vertical Intelligence     loads the full vertical record
        ↓                     (fears · desires · objections · moments ·
                              ad formats · hook families · vocabulary)
        ↓
[C] Audience Intelligence     refines the vertical's audience archetypes
        ↓                     against the operator's audience input
                              (which archetype is this brand actually for?)
        ↓
[D] Context Assembly          packages vertical + audience + 4 inputs
        ↓                     into a system-prompt + few-shot examples
        ↓
[E] LLM Generation            single structured-output call · LLM is
        ↓                     constrained by vocabulary + hook families
                              + emotional territory · NOT writing freely
        ↓
[F] Output Validation         deterministic check:
        ↓                       · required vocabulary present
                                · forbidden vocabulary absent
                                · locale matches operator input
                                · hook family distribution matches
                                  vertical's proven hook families
        ↓                     re-run on validation failure (1 retry)
        ↓
[G] Library Persistence       2/10/5/10 shape · matches V1 contract
```

### 4.1 · `detectVertical()`

Two-stage:

1. **Deterministic match attempt** — keyword scan on `artifact` against each vertical's `required_vocabulary` (presence of *"מזגן"* → HVAC · presence of *"שוקולד"* → chocolate · presence of *"נדל״ן"* → real estate · etc.).
2. **LLM tie-break** — if no clean keyword hit, single short LLM call: *"Which of the following 10 verticals best matches this brand description? Reply with the vertical ID only."*

If confidence is low, the onboarding UI asks the operator to confirm: *"Is your business closest to: Real Estate / Accountant / Lawyer / Fitness / Restaurant / SaaS / HVAC / Cosmetics / Jewelry / Chocolate / Other?"*

### 4.2 · Audience Intelligence

Per vertical, the engine has 2-4 audience archetypes. After verticalId is determined, the engine runs a small LLM call to match the operator's `audience` string to the closest archetype. The result becomes a **refined audience profile** that combines:

- The vertical archetype's demographic / psychographic skeleton
- The operator's specific words about their audience
- The vertical's industry-specific buying triggers + objections for this archetype

### 4.3 · Context Assembly (the actual prompt construction)

The LLM never sees the operator's raw inputs as the primary signal. It sees:

```
SYSTEM:
You are a senior creative director who has worked in {vertical.displayName}
for 15+ years. You know what converts for {audience.label}. You write
in {primaryLocale}. You use these required words at least once in
every output: {vocabulary.required}. You NEVER use these words:
{vocabulary.forbidden}.

The brand's emotional territory is: {chosenTerritory.phrase}.
The brand's customer fears: {top-3-fears}.
The brand's customer desires: {top-3-desires}.
The brand's proven hook families for this audience:
{proven-hook-families-with-examples}.
The brand's common situations: {top-5-moments}.

USER:
Here is the brand:
  - Sells: {operator.artifact}
  - For: {operator.audience}
  - Deeper desire: {operator.emotional}
  - Locale: {operator.locale}

Generate exactly 2 positioning one-liners, 10 hooks, 5 UGC scripts,
10 image concepts.
Each hook must be from a distinct family.
At least 6 of the 10 hooks must use the required vocabulary.
Return JSON schema: {...}.
```

The LLM is now constrained to write industry-native copy because the vocabulary, the territory, and the hook families are pre-loaded as constraints.

### 4.4 · Output Validation

Deterministic post-checks (in TypeScript, no LLM):

| Check | Pass condition |
|---|---|
| `required-vocab` | Each generated section includes ≥ 1 word from `vertical.vocabulary.required` |
| `forbidden-vocab` | No section includes any word from `vertical.vocabulary.forbidden` |
| `locale-match` | If `locale = Hebrew`, no Latin-letter spans > 4 chars except whitelisted (brand names, units) |
| `hook-family-spread` | The 10 hooks cover ≥ 4 distinct hook families |
| `vertical-keyword-density` | At least one industry-specific term appears in 6+ of the 10 hooks |

If validation fails, one retry with the failure detail added to the prompt: *"Previous output failed: missing vocabulary X. Try again."*

---

## 5 · Why this works

The previous engine produced templated Hebrew with operator variables substituted. The output failed because **the engine had no industry knowledge to substitute INSTEAD of operator variables.**

This design changes the substitution. The engine no longer fills `${artifact}` into pre-written Hebrew templates. The engine assembles a real-estate-specific OR accountant-specific OR HVAC-specific system prompt that tells the LLM: *"You are a 15-year real-estate creative director. You use these words. You don't use these words. You serve this audience. You write these hook families. Now write me a kit for THIS specific brand."*

The LLM does the actual creative work. The vertical intelligence layer ensures the work happens in the right key.

### Predicted impact on the output-quality audit metrics

| Metric | Stub provider (current) | Real LLM + vertical intelligence |
|---|---|---|
| Overall net-quality / 60 | 17.7 | 42-50 (target) |
| Vertical-specific keyword presence in hooks | 0-10% | 70-90% |
| Cross-vertical template repetition | 60% (6 of 10 hook positions identical skeleton) | < 10% (each vertical generates its own copy from its own context) |
| Code-switching incidents | 182 / 270 artifacts | < 5 / 270 |
| Industries where engine excels | 1 of 10 (chocolate, Hebrew input) | 8-10 of 10 (each vertical has its own intelligence record) |
| Industries where engine fails | 9 of 10 | 0-2 (long-tail verticals not yet in the seed corpus) |

---

## 6 · The seed corpus is the moat

10 vertical records · ~80-120 lines each = ~1,000-1,200 lines of structured knowledge. That is the product.

The LLM API call is a commodity. The vertical knowledge base is the differentiator. Three implications:

### 6.1 · Knowledge base updates quarterly from real campaign data

When the platform has 100+ paying customers running real ads, each vertical's intelligence record absorbs proof:
- Which hook families actually converted for real-estate customers → boost their weight
- Which forbidden words slipped through and tanked an ad → add to the forbidden list
- Which moments converted unexpectedly → promote into the canonical situations

This is the V3 learning loop expressed at the right altitude.

### 6.2 · Verticals are the product roadmap

Adding the 11th vertical (e.g., dental clinic) is a 4-6 hour content-research task by the founder. Each new vertical multiplies addressable market. The roadmap is verticals, not features.

### 6.3 · The 10-vertical seed corpus is opinionated, not exhaustive

For V1, only the 10 verticals in this document are supported. An operator whose brand doesn't fit any of the 10 sees:

> *"Your brand doesn't match one of our supported industries yet (real estate · accountant · lawyer · fitness · restaurant · SaaS · HVAC · cosmetics · jewelry · chocolate). We'll add yours within 90 days · enter your email."*

This is a feature, not a bug. The platform promises industry-native output. If it can't deliver that for a given vertical, it should refuse the customer rather than ship generic content.

---

## 7 · Implementation order (when build resumes · not now)

When implementation resumes — explicitly NOT in this turn — the order is:

1. Encode the 10 vertical records as YAML in `lib/verticals/*.yaml` (one file per vertical · easier to edit than TS)
2. Build `lib/verticalIntelligence.ts` loader + `detectVertical()` function
3. Build `lib/audienceIntelligence.ts` archetype-matcher
4. Build `lib/promptAssembly.ts` — the context-assembly layer
5. Replace `mvpGenerate()` in `lib/mvpLlmProvider.ts` with the LLM-call path (OpenAI or Anthropic) that uses assembled context
6. Build `lib/outputValidation.ts` — the deterministic validation layer
7. Wire the new flow into `lib/mvpGenerationEngine.ts`
8. Re-run `scripts/verify-output-quality.ts` against all 10 verticals · target net-quality ≥ 40 / 60

No new UI. No new API surface. The 4 existing routes (`/api/mvp/onboard`, `/generate`, `/selection`, `/library`) work unchanged. The change is **what happens inside `mvpGenerate()`**.

---

## 8 · What this design refuses to do

To stay honest about scope:

- It does not address sub-vertical specialization (e.g., dermatology vs general cosmetics) · that's V2 verticals
- It does not address multi-language generation in non-Hebrew/English markets · that's V2 i18n
- It does not address the operator's own brand voice mixed into the vertical voice · that's V2 brand-voice-tuning
- It does not address performance feedback yet · that's V3 learning loop
- It does not address competitive differentiation within a vertical · that's V2 brand-positioning
- It does not eliminate generic LLM output entirely · the LLM will sometimes still produce average copy · the validation layer + retry catches the worst cases but not all of them

---

## 9 · Final answer to the directive

> **Make outputs feel written by someone inside the industry · not by a generic AI.**

The answer is structured knowledge per vertical, not a better LLM. The LLM is constrained — vocabulary required, vocabulary forbidden, hook families pre-selected, emotional territory pre-defined, audience archetype pre-matched. The LLM writes within that frame. The frame is industry-specific. The output sounds industry-native because the constraints were industry-native.

10 vertical records is the V1 seed corpus. Each record is structured the same way. Adding the 11th, 25th, 100th vertical is content work, not engineering work. The platform's moat is the depth and accuracy of the vertical knowledge base. The LLM API is rented.

This is the design. Implementation is a separate phase. No code, no UI, no API changes were made in this document.
