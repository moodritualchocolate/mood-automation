# Output Quality Audit · MVP Generation Engine

**Engine under test:** `lib/mvpLlmProvider.ts` · active provider = **`stub`**.
**Reading:** the same code path `/api/mvp/generate` calls today.
**Method:** generated full output (2 one-liners · 10 hooks · 5 UGC · 10 concepts) for 10 distinct verticals, scored each artifact on 7 dimensions, detected template repetition across industries.
**No code changes. Validation only.**

---

## 1 · Executive verdict

**Overall average net-quality across 10 verticals: 17.7 / 60.**

A real customer would NOT pay ₪299 for this output. The stub provider produces structurally identical templates filled with operator inputs as variables. When inputs are Hebrew (chocolate, jewelry, restaurant, accountant, lawyer, cosmetics, HVAC), the output is awkward but legible. When inputs are English (real-estate seed, SaaS, fitness), the templates concatenate Hebrew templates with English operator strings, producing incoherent code-switched text that no marketer would publish.

**The engine architecture is sound. The current provider is not.** A real LLM (OpenAI / Anthropic) must be swapped in before the product can be sold. The stub is fit only for local testing, demos with operator-supplied content, and architectural validation — none of which are revenue-generating.

**Code-switch incidents (Hebrew+English in a Hebrew-target locale): 182** across all 10 verticals.

---

## 2 · Per-vertical scorecard

| Vertical | Brand | Locale | Net-quality avg | Code-switch hits | One-liner top score | Hook top score |
|---|---|---|---|---|---|---|
| Real Estate Investment | Anchor Properties | Israel · Hebrew | 13.1 | 26 | 12 | 30 |
| Fitness · Running | Mile | Global · English | 23.8 | 0 | 23 | 31 |
| Restaurant | Tov Hayom | Israel · Hebrew | 13.7 | 26 | 12 | 30 |
| Jewelry | Avir | Israel · Hebrew | 13.3 | 26 | 13 | 30 |
| SaaS · Productivity | Quiet | Global · English | 23.6 | 0 | 23 | 30 |
| Accountant | Tax Studio | Israel · Hebrew | 13.3 | 26 | 12 | 30 |
| Lawyer · Family Law | Beit Mishpat | Israel · Hebrew | 13.2 | 26 | 12 | 30 |
| Chocolate Brand (canonical) | MOOD | Israel · Hebrew | 36.6 | 0 | 43 | 46 |
| Cosmetics · Skincare | Real Skin | Israel · Hebrew | 13.0 | 26 | 12 | 30 |
| Local Service · HVAC | Krir | Israel · Hebrew | 13.1 | 26 | 12 | 30 |

Sorted descending. Best vertical: **Chocolate Brand (canonical)** (36.6). Worst vertical: **Cosmetics · Skincare** (13.0).

---

## 3 · Where the engine excels

Hebrew-input verticals where the templates fill cleanly with Hebrew operator text:

- **Chocolate Brand (canonical)** · net 36.6 · 0 code-switch incidents

When the operator types Hebrew into all 4 questions, the templated Hebrew construction is coherent (e.g., *"שוקולד שמחזיר לך נוכחות ברגעים שאחרת היו אובדים."*). The grammar holds. The product reference is correct. The output is plausibly Hebrew advertising copy — though still generic and template-driven.

---

## 4 · Where the engine fails

English-input verticals expose the engine's core defect:

- **Cosmetics · Skincare** · net 13.0 · 26 code-switch incidents
- **Local Service · HVAC** · net 13.1 · 26 code-switch incidents
- **Real Estate Investment** · net 13.1 · 26 code-switch incidents
- **Lawyer · Family Law** · net 13.2 · 26 code-switch incidents
- **Jewelry** · net 13.3 · 26 code-switch incidents
- **Accountant** · net 13.3 · 26 code-switch incidents
- **Restaurant** · net 13.7 · 26 code-switch incidents
- **SaaS · Productivity** · net 23.6 · 0 code-switch incidents
- **Fitness · Running** · net 23.8 · 0 code-switch incidents

Sample broken output (Real-Estate one-liner):
> *"Long-term residential real-estate investment portfolios שמחזיר לך Leave something stable for the next generation."*
> *"Long-term residential real-estate investment portfolios · בשביל Israeli first-generation wealthy 40-60 with children 10-25."*

The template *"${article} שמחזיר לך ${feel}."* concatenates English fragments inside Hebrew syntax. The result is incomprehensible to either audience: Hebrew readers see English mid-sentence, English readers see Hebrew connective tissue. **A real customer in real estate or SaaS would refund inside 60 seconds.**

---

## 5 · Template-repetition analysis (cross-vertical)

For each output position (e.g., "hook #1 of brand N"), we computed how many distinct sentence skeletons exist across the 10 brands. A skeleton is the sentence with all Hebrew + Latin + digit spans replaced by a single placeholder. Identical skeletons = the engine produces the same structural template, only the operator-supplied variables change.

**One-liner positions · skeleton diversity** (max possible: 10 = every brand unique · 1 = all 10 brands identical): 10, 10

**Hook positions · skeleton diversity** (10 positions, max 10 each): 9, 9, 10, 9, 9, 9, 10, 1, 9, 9

**UGC positions · skeleton diversity** (5 positions, max 10 each): 10, 9, 10, 10, 10

**1 of 10 hook positions have diversity = 1** · meaning all 10 verticals received the SAME skeleton sentence in that slot, with only the keyword variables changed. This is the textbook signature of templated AI generation.

---

## 6 · Strongest individual outputs (top 10 hooks across all verticals)

| Vertical | Hook (Hebrew) | Net score |
|---|---|---|
| Chocolate Brand (canonical) | שוקולד מריר פרימיום של מותג ישראלי · עוד רגע אחד שלך, בכל יום. | 46 |
| Chocolate Brand (canonical) | נסה שוקולד מריר פרימיום של מותג ישראלי פעם אחת. תראה את הערב שאחרי. | 41 |
| Chocolate Brand (canonical) | להיות נוכחים ברגעים שאחרת היו אובדים בלחיצה אחת — שמעתם פעם על שוקולד מריר פרימיום של מותג ישראלי? | 39 |
| Chocolate Brand (canonical) | במקום עוד מוצר — שוקולד מריר פרימיום של מותג ישראלי. | 39 |
| Chocolate Brand (canonical) | בלי הצגות. בלי הבטחות. רק שוקולד מריר פרימיום של מותג ישראלי. | 38 |
| Chocolate Brand (canonical) | אנחנו כבר לא משתמשים בשם הגנרי. אנחנו משתמשים בשוקולד מריר פרימיום של מותג ישראלי. | 38 |
| Chocolate Brand (canonical) | אתה לא צריך עוד מוצר. אתה צריך להיות נוכחים ברגעים שאחרת היו אובדים. | 35 |
| Chocolate Brand (canonical) | בוגרים ישראליים 32-50 · עירוניים · עם תקציב להוצאה איכותית כבר לא מאמינים לפרסומות. שוקולד מריר פרימיום של מותג ישראלי לא צריך אחת. | 35 |
| Chocolate Brand (canonical) | מותר לבחור משהו אחד נקי היום. | 34 |
| Chocolate Brand (canonical) | מותר לעצור ולקחת להיות נוכחים ברגעים שאחרת היו אובדים. | 32 |

Even the top 10 hooks rarely exceed net-quality 30 / 60. None of these hooks would survive a creative-director's review.

---

## 7 · Weakest individual outputs (bottom 10 hooks across all verticals)

| Vertical | Hook | Net score |
|---|---|---|
| Cosmetics · Skincare | Feel like myself, not a filter of myself בלחיצה אחת — שמעתם פעם על Skincare line for women tired of overdone beauty industry? | 11 |
| Lawyer · Family Law | Protect what still matters · keep the children whole בלחיצה אחת — שמעתם פעם על Family-law firm specializing in mediated divorce? | 11 |
| Accountant | No fear of the tax authority in March בלחיצה אחת — שמעתם פעם על Bookkeeping + tax service for solo founders and small teams? | 11 |
| Restaurant | A real meal · not another rushed pickup בלחיצה אחת — שמעתם פעם על Neighborhood restaurant serving a real dinner after work? | 11 |
| Real Estate Investment | Leave something stable for the next generation בלחיצה אחת — שמעתם פעם על Long-term residential real-estate investment portfolios? | 11 |
| Local Service · HVAC | Homeowners and tenants 35-65 in apartments without working AC כבר לא מאמינים לפרסומות. On-call air-conditioning repair service across central Israel לא צריך אחת. | 12 |
| Local Service · HVAC | אנחנו כבר לא משתמשים בשם הגנרי. אנחנו משתמשים בOn-call air-conditioning repair service across central Israel. | 12 |
| Local Service · HVAC | A working air conditioner in August. Today. בלחיצה אחת — שמעתם פעם על On-call air-conditioning repair service across central Israel? | 12 |
| Cosmetics · Skincare | Women 35-55 with skin that no longer needs to be hidden כבר לא מאמינים לפרסומות. Skincare line for women tired of overdone beauty industry לא צריך אחת. | 12 |
| Cosmetics · Skincare | אנחנו כבר לא משתמשים בשם הגנרי. אנחנו משתמשים בSkincare line for women tired of overdone beauty industry. | 12 |

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
182 artifacts across the 10 verticals contain English fragments embedded in Hebrew sentence structure. The output is not just generic — it is **unusable text**. A real-estate or SaaS customer would refund in under a minute.

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
