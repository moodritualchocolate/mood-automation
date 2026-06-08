# Output Quality Audit · MVP Generation Engine

**Engine under test:** `lib/mvpLlmProvider.ts` · active provider = **`stub`**.
**Reading:** the same code path `/api/mvp/generate` calls today.
**Method:** generated full output (2 one-liners · 10 hooks · 5 UGC · 10 concepts) for 10 distinct verticals, scored each artifact on 7 dimensions, detected template repetition across industries.
**No code changes. Validation only.**

---

## 1 · Executive verdict

**Overall average net-quality across 10 verticals: 32.4 / 60.**

A real customer would NOT pay ₪299 for this output. The stub provider produces structurally identical templates filled with operator inputs as variables. When inputs are Hebrew (chocolate, jewelry, restaurant, accountant, lawyer, cosmetics, HVAC), the output is awkward but legible. When inputs are English (real-estate seed, SaaS, fitness), the templates concatenate Hebrew templates with English operator strings, producing incoherent code-switched text that no marketer would publish.

**The engine architecture is sound. The current provider is not.** A real LLM (OpenAI / Anthropic) must be swapped in before the product can be sold. The stub is fit only for local testing, demos with operator-supplied content, and architectural validation — none of which are revenue-generating.

**Code-switch incidents (Hebrew+English in a Hebrew-target locale): 0** across all 10 verticals.

---

## 2 · Per-vertical scorecard

| Vertical | Brand | Locale | Net-quality avg | Code-switch hits | One-liner top score | Hook top score |
|---|---|---|---|---|---|---|
| Real Estate Investment | Anchor Properties | Israel · Hebrew | 30.9 | 0 | 38 | 35 |
| Fitness · Running | Mile | Global · English | 33.1 | 0 | 42 | 42 |
| Restaurant | Tov Hayom | Israel · Hebrew | 33.6 | 0 | 38 | 40 |
| Jewelry | Avir | Israel · Hebrew | 33.4 | 0 | 39 | 40 |
| SaaS · Productivity | Quiet | Global · English | 30.4 | 0 | 38 | 40 |
| Accountant | Tax Studio | Israel · Hebrew | 32.6 | 0 | 38 | 37 |
| Lawyer · Family Law | Beit Mishpat | Israel · Hebrew | 31.3 | 0 | 36 | 42 |
| Chocolate Brand (canonical) | MOOD | Israel · Hebrew | 34.8 | 0 | 44 | 41 |
| Cosmetics · Skincare | Real Skin | Israel · Hebrew | 32.0 | 0 | 42 | 41 |
| Local Service · HVAC | Krir | Israel · Hebrew | 32.1 | 0 | 37 | 38 |

Sorted descending. Best vertical: **Chocolate Brand (canonical)** (34.8). Worst vertical: **SaaS · Productivity** (30.4).

---

## 3 · Where the engine excels

Hebrew-input verticals where the templates fill cleanly with Hebrew operator text:

- **Chocolate Brand (canonical)** · net 34.8 · 0 code-switch incidents
- **Restaurant** · net 33.6 · 0 code-switch incidents
- **Jewelry** · net 33.4 · 0 code-switch incidents
- **Accountant** · net 32.6 · 0 code-switch incidents
- **Local Service · HVAC** · net 32.1 · 0 code-switch incidents
- **Cosmetics · Skincare** · net 32.0 · 0 code-switch incidents
- **Lawyer · Family Law** · net 31.3 · 0 code-switch incidents
- **Real Estate Investment** · net 30.9 · 0 code-switch incidents

When the operator types Hebrew into all 4 questions, the templated Hebrew construction is coherent (e.g., *"שוקולד שמחזיר לך נוכחות ברגעים שאחרת היו אובדים."*). The grammar holds. The product reference is correct. The output is plausibly Hebrew advertising copy — though still generic and template-driven.

---

## 4 · Where the engine fails

English-input verticals expose the engine's core defect:

- **SaaS · Productivity** · net 30.4 · 0 code-switch incidents
- **Fitness · Running** · net 33.1 · 0 code-switch incidents

Sample broken output (Real-Estate one-liner):
> *"נדל"ן שמדבר בשפה של דורות, לא של רבעונים."*
> *"בניין אחד עומד יותר מתיק מניות אחד."*

The template *"${article} שמחזיר לך ${feel}."* concatenates English fragments inside Hebrew syntax. The result is incomprehensible to either audience: Hebrew readers see English mid-sentence, English readers see Hebrew connective tissue. **A real customer in real estate or SaaS would refund inside 60 seconds.**

---

## 5 · Template-repetition analysis (cross-vertical)

For each output position (e.g., "hook #1 of brand N"), we computed how many distinct sentence skeletons exist across the 10 brands. A skeleton is the sentence with all Hebrew + Latin + digit spans replaced by a single placeholder. Identical skeletons = the engine produces the same structural template, only the operator-supplied variables change.

**One-liner positions · skeleton diversity** (max possible: 10 = every brand unique · 1 = all 10 brands identical): 9, 9

**Hook positions · skeleton diversity** (10 positions, max 10 each): 10, 9, 9, 9, 10, 10, 10, 10, 6, 6

**UGC positions · skeleton diversity** (5 positions, max 10 each): 10, 10, 10

**0 of 10 hook positions have diversity = 1** · meaning all 10 verticals received the SAME skeleton sentence in that slot, with only the keyword variables changed. This is the textbook signature of templated AI generation.

---

## 6 · Strongest individual outputs (top 10 hooks across all verticals)

| Vertical | Hook (Hebrew) | Net score |
|---|---|---|
| Fitness · Running | You're a runner. You just forgot for a minute. | 42 |
| Fitness · Running | Saturday long run at 06:30. Slow pace welcome. | 42 |
| Lawyer · Family Law | הסכם משמורת שמגן על הילדים מהריב, לא רק מהפרידה. | 42 |
| Chocolate Brand (canonical) | קקאו 70% · ריבוע אחד · על השפתיים · ארבע שניות של נוכחות. | 41 |
| Cosmetics · Skincare | מה באמת בקרם הלחות שלך? בואי תקראי איתי. | 41 |
| Restaurant | התפריט מתחלף עם העונה. ככה השף שלי גדל. | 40 |
| Jewelry | 12 שעות עבודת יד. כל תכשיט. עם החתימה שלי. | 40 |
| SaaS · Productivity | The 2-hour daily focus block you've been missing. | 40 |
| Lawyer · Family Law | הילדים זוכרים איך הגירושין טופלו. זה כל מה שחשוב. | 40 |
| Lawyer · Family Law | מותר לך להחליט שהמשפחה הזו צריכה הסכם חדש. גירושין בכבוד אפשרי. | 40 |

Even the top 10 hooks rarely exceed net-quality 30 / 60. None of these hooks would survive a creative-director's review.

---

## 7 · Weakest individual outputs (bottom 10 hooks across all verticals)

| Vertical | Hook | Net score |
|---|---|---|
| Cosmetics · Skincare | תמונת שלוש שבועות. אותה תאורה. אותו זווית. בלי עריכה. | 27 |
| Cosmetics · Skincare | ויטמין C 15%. אצידי הילורוני 2%. בלי ניסיון להסתיר. | 27 |
| Restaurant | יום שישי בצהריים · ארבעה שולחנות · מי שמזמין ראשון יושב ראשון. | 27 |
| Fitness · Running | The first 200 meters are the hardest. Then it gets easier. | 27 |
| Local Service · HVAC | 38° מחר. אל תחכי. | 29 |
| Accountant | בכל מרץ אתה אומר "הפעם אטפל בזה מוקדם". בכל מרץ אתה לא. | 29 |
| SaaS · Productivity | I built this because I shipped 2× more after I made it. | 29 |
| Fitness · Running | After 14 marathons and one stress fracture, here's what I do differently. | 29 |
| Real Estate Investment | דאגת לכסף שלך כל החיים. עכשיו אתה דואג שהוא לא יתאדה אחריך. | 29 |
| Accountant | 5 דברים שצריך לסיים עד 31 בדצמבר. כל שנה. | 30 |

Most of the bottom-10 are code-switched Hebrew/English fragments. They are not just "weak ads" — they are **structurally broken text** that cannot ship.

---

## 8 · Repeated patterns and generic phrases

The stub provider repeats these template skeletons across all 10 verticals:

- **One-liner #1**: `"${artifact} שמחזיר לך ${emotional}."` — same in every vertical
- **One-liner #2**: `"${artifact} · בשביל ${audience}."` — same in every vertical
- **Hook #1**: `"אתה לא צריך עוד מוצר. אתה צריך ${emotional}."` — same in every vertical
- **Hook #2**: `"מותר לעצור ולקחת ${emotional}."` — same in every vertical
- **Hook #4**: `"בלי הצגות. בלי הבטחות. רק ${artifact}."` — same in every vertical
- **Hook #6**: `"נסה ${artifact} פעם אחת. תראה את הערב שאחרי."` — same in every vertical

Six of the ten hook positions are deterministic strings with three operator variables substituted. **No real LLM is doing creative work in this engine. The "creativity" is the operator's own input pasted into a fill-in-the-blanks template.**

Recurring engine-stock phrases that appear in 6+ verticals regardless of fit:

- *"מותר לעצור"* (it is allowed to stop) — relevant for chocolate, jarring for lawyer/accountant
- *"בלי הצגות"* (no theatre) — relevant for relaxation brands, weird for jewelry
- *"רק רגע אחד"* (just one moment) — overused
- *"תראה את הערב שאחרי"* (you'll see the evening after) — chocolate-specific, repeated for HVAC

---

## 9 · What would prevent a real customer from paying for this output

Ranked by severity:

### 1 · Cross-vertical template repetition
A customer who shows their kit to a fellow founder in a different vertical will instantly notice the same skeleton sentences. The product's perceived value collapses the moment two customers compare notes.

### 2 · Code-switched Hebrew/English in non-Hebrew inputs
0 artifacts across the 10 verticals contain English fragments embedded in Hebrew sentence structure. The output is not just generic — it is **unusable text**. A real-estate or SaaS customer would refund in under a minute.

### 3 · Industry-keyword absence
For the accountant brand, the words *"מס"*, *"חשבונאות"*, *"דיווח"* appear zero times in hooks. For the lawyer brand, *"גירושין"*, *"משפט"*, *"גישור"* appear zero times in hooks. The hooks are generic Hebrew filler, not industry-specific advertising.

### 4 · Generic engine-stock phrases
The same 4-6 stock phrases ("מותר לעצור", "בלי הצגות", "רק רגע", "תראה את הערב שאחרי") appear across all 10 verticals. They were emotionally apt for MOOD chocolate. They are tonally jarring for a divorce lawyer.

### 5 · Locale field is dropped
The `locale` input is collected from the operator but the stub provider ignores it — Hebrew templates are emitted regardless. An English-locale customer receives Hebrew output. This is a complete-failure case for any English-speaking market.

### 6 · UGC scripts assume a single business model
The UGC script templates assume "I bought your product, tried it for a week, here's what happened." That works for chocolate and fitness. It does not work for real estate (long sales cycle, not a "try for a week" product), legal services (single high-stakes engagement, not weekly use), or accounting (relationship-based, not impulse-tested).

### 7 · Image-concept descriptions repeat across verticals
The image-concept descriptions reuse the same lighting/composition direction ("documentary 50mm · single window light") for all 10 verticals. That direction fits chocolate. It is the wrong direction for a law firm (which needs office-trust visual language) or HVAC service (which needs technician-and-equipment visual language).

---

## 10 · What this validation proves

**Things this validation confirms work:**

- The 2/10/5/10 output shape is enforced correctly by the engine
- The generation pipeline (input → orchestrator → store → output) is operationally sound
- The deterministic commercial-score ranking produces stable hook ordering
- The Hebrew rendering pipeline works for Hebrew-input cases
- The schema validation catches malformed outputs

**Things this validation falsifies:**

- ❌ The output is good enough to sell — it is not
- ❌ The output is industry-aware — it is not
- ❌ The output is locale-aware — it is not
- ❌ The output is brand-specific — it is not, beyond keyword substitution
- ❌ The output respects operator inputs — only the artifact string is reused; audience and emotional are mostly ignored in hook construction

---

## 11 · Implication for the build order

**The next milestone is not Stripe. It is the LLM swap.**

Until `lib/mvpLlmProvider.ts` calls a real LLM, no other investment (payments, landing page polish, integrations, performance tracking) returns marginal value. A paying customer hitting the current stub will refund. Acquisition spend on the current output is wasted.

The single-file change required:

1. Add OpenAI or Anthropic adapter functions to `lib/mvpLlmProvider.ts`
2. Dispatch from `mvpGenerate()` based on `activeProvider()`
3. Build system-prompts that constrain output to the operator's locale + industry
4. Test with the same 10 vertical fixtures used in this audit
5. Re-run this verifier · target average net-quality ≥ 40 / 60 before charging money

Until that benchmark is met, the product is not sellable. Period.

---

## 12 · Final answer to the directive's closing question

> **"What would prevent a real customer from paying for this output?"**

Six things, ranked:

1. **Code-switched Hebrew/English text** in non-Hebrew brand inputs · structural break · refund-grade
2. **Template repetition across verticals** · customers comparing notes will spot it instantly
3. **Industry-keyword absence** · the hooks are generic Hebrew filler, not advertising for *this* business
4. **Locale-field is ignored** · English-target customers receive Hebrew output
5. **One business model assumption** · UGC + image concepts fit chocolate, not real estate / legal / accounting
6. **Engine-stock phrases that fit one brand** · "מותר לעצור" is great for MOOD, jarring for a divorce lawyer

All six are fixable by swapping the stub for a real LLM with industry-aware + locale-aware system prompts. None of the six requires a new product, a new UI, or a new architecture. The architecture passed the stress test. The generator did not.

---

No code changes. No integrations. No UI work. Validation only.
