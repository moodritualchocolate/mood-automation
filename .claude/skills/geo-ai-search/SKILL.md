---
name: geo-ai-search
description: Generative Engine Optimization (GEO) / AI-search optimization — making a site's content get surfaced and CITED by AI answer engines (ChatGPT/OpenAI, Perplexity, Google AI Overviews & Gemini, Claude, Bing Copilot), not just ranked in classic search. Load when asked about GEO, AI search, "get cited by ChatGPT/Perplexity", answer-engine optimization, llms.txt, AI crawlers, or making content citable/extractable. Complements (does not replace) classic SEO in the web-quality skill.
---

# GEO — Generative Engine Optimization

Classic SEO gets you ranked in a list of blue links. **GEO gets your brand quoted inside the answer** an AI gives when someone asks about your category. Different game, different tactics. Use this alongside `web-quality` (which covers traditional SEO).

## How answer engines pick sources (the model to optimize for)
An LLM answer engine retrieves candidate passages, then synthesizes an answer citing a few. You win by being the **most extractable, self-contained, authoritative, and unambiguous** passage on the question. Optimize for *being quoted*, not for keyword density.

## Tactics — ranked by impact

### 1. Answer-first, extractable structure (highest impact)
- Shape headings as the **questions users ask** (`## מה זה שוקולד פונקציונלי?`), then answer in the **first 1–2 sentences** — direct, self-contained, no "as mentioned above".
- Each paragraph must stand alone (an engine may lift it out of context). No pronoun chains that break when extracted.
- Use **definition sentences**: "X is a Y that does Z." Engines love these.
- Add **FAQ blocks**, comparison **tables**, and short lists — highly liftable formats.

### 2. Entity clarity
- Name the brand, product, and attributes **explicitly and consistently** — never rely on "it/this/the product".
- Establish the entity with **schema.org JSON-LD**: `Organization`, `Product`, `FAQPage`, `Article`, `BreadcrumbList`, with `sameAs` links to socials/press. This is how engines disambiguate who you are.

### 3. Authority & citation signals
- Cite **primary sources**, include **real numbers/data**, name experts/founders, and **date** claims. Engines prefer passages that look sourced.
- Be the **primary source** for facts about your own product (formula, ingredients, usage) — own the canonical answer.

### 4. Technical extractability
- **Allow the AI crawlers** you want to be seen by (robots.txt / meta): `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Bingbot`. Blocking them accidentally = invisible to that engine. (Blocking is a valid *choice* — just make it deliberate.)
- Ship **server-rendered / static content** (SSR/SSG). Many AI crawlers don't execute JS well — content that only appears after client-side JS may never be seen. This is a direct reason to prefer Astro/Next SSR over pure client SPA for content pages.
- Publish an **`llms.txt`** (and optionally `llms-full.txt`) at the root: a clean markdown map of your key pages/answers for LLM consumption.
- Clean **semantic HTML** (`<article>`, `<h1-3>`, `<dl>`, `<table>`), fast load (GEO rewards the same speed `web-quality` measures).

### 5. Freshness
- Show and update `dateModified`; keep answers current. Stale pages lose citations.

## Measurement
- Track referral traffic from `chat.openai.com` / `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com` in analytics.
- Periodically **ask the engines** your target questions and check whether the brand is cited and correctly described.

## MOOD note
- Hebrew-market GEO: own the answers to "מה זה שוקולד פונקציונלי?", "תחליף לקפה של אחר הצהריים", "איך נרדמים כשהמוח לא נכבה" — the ritual/coffee-alternative/sleep questions, per SKU (Energy/Relax/Sleep, never Focus on web).
- Founders (נדב יצחקי, מתיאס דומינגז), chocolatier **רונן אפללו — World Chocolate Champion 2022 / אלוף השוקולד העולמי 2022**, and the Reg Max™ formula are entity facts to state explicitly and schema-tag (the 2022 title is a strong, citable authority signal).

## Anti-patterns
- Keyword stuffing (classic-SEO thinking — engines ignore it).
- Walls of text with no extractable units.
- Content locked behind client-side JS / interactions.
- Blocking AI crawlers by accident.
- Vague, source-less claims — they don't get cited.

## Gate
1. Does each key page answer a real question in its first 2 sentences?
2. Are passages self-contained and liftable?
3. JSON-LD entity schema present and correct?
4. Server-rendered content, intended crawlers allowed, `llms.txt` present?
5. Claims dated and sourced?
