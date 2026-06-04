# Creative Strategy Engine — Phase Report

**Phase:** SVG → Creative Intelligence pivot.
**Branch:** `claude/mood-creative-os-v1-i4Mfv`
**Source directive (verbatim):**

> Stop all SVG creative work. The system is generating templates, not advertisements. Build a Creative Strategy Engine. For every product BOOST · CHILLAX · BUNDLE generate audiences, pain points, hooks, emotional angles, ad concepts, UGC scripts, image prompts, video prompts, carousel concepts, founder stories, testimonials. Then connect those outputs to real image generation. No more brown backgrounds. No more vector pouches. No more SVG-first assets. The default output should be a human-centered advertisement, not a design template.

---

## 1 · What changed

| Layer | Before | After |
|---|---|---|
| Primary creative path | Brief → SVG renderer (`/asset-generator`) | Strategy → image prompt → external provider (`/strategy`) |
| Default output | Vector banner / post / carousel PNG | Photorealistic image-generation brief (prompt + negative + style refs) |
| Product taxonomy | Abstract formulas (ENERGY · FOCUS · RELAX · SLEEP) | **MOOD SKUs (BOOST · CHILLAX · BUNDLE)** — each maps to one or more formulas |
| Output artifact count per request | 1 banner (SVG) | **11 artifact types**: 3 audiences · 4 pain points · 6 hooks · 4 emotional angles · 3 ad concepts · 2 UGC scripts · 2 image prompts · 1 video prompt · 1 carousel concept · 2 founder stories · 3 testimonials (BOOST count — other products similar) |
| Brand-specific output | Pouch label hard-coded MOOD | Brand context flows through; pouch is no longer the deliverable |
| Image fidelity | Vector + Resvg PNG | Photorealistic via external provider (Replicate Flux Schnell / Flux Dev / SDXL) — env-gated, graceful fallback when not configured |
| Studio Home primary CTA | "New asset" → SVG generator | **"Open Strategy →"** |

The SVG renderer (`src/components/creative-brief-svg.ts`, `/api/render`, `/asset-generator`) is **NOT deleted**. It is kept as an explicit legacy path with a callout on the Studio Home: "Looking for the SVG template generator? It is still available at /asset-generator — kept for layout previews. The default creative path is now /strategy." Per the directive — *freeze*, not remove.

---

## 2 · Engine architecture

### `lib/creativeStrategyEngine.ts` — pure function

```ts
computeCreativeStrategy({
  productCode: 'BOOST' | 'CHILLAX' | 'BUNDLE',
  brand: { brandName, brandVoice?, brandAudience?, brandSignature?, market? },
}) : CreativeStrategy
```

- Pure. No I/O. No LLM calls. No external fetches.
- Deterministic for the same input (verified — case 13).
- Knowledge-based: encodes MOOD's playbook into structured TypeScript types.
- Output is 11 artifact arrays + `advisoryNotice` + `generatedAt`.

### Product taxonomy

```ts
PRODUCTS = {
  BOOST:   { hebrewName: 'בוסט',    formulas: ['ENERGY', 'FOCUS'],         moment: 'morning · pre-meeting · pre-workout' },
  CHILLAX: { hebrewName: 'צ׳ילקס',  formulas: ['RELAX', 'SLEEP'],          moment: 'evening · post-screen · pre-sleep' },
  BUNDLE:  { hebrewName: 'באנדל',   formulas: ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'], moment: 'day-shape · 7AM and 9PM' },
}
```

### Artifact types (each is a TypeScript interface in the engine module)

| Artifact | Per product | Carries |
|---|---|---|
| `AudienceSegment` | 2-3 | name · Hebrew label · demographic slice · psychographics · why-they-care · channel mix |
| `PainPoint` | 3-4 | short Hebrew · English detail · who-feels-this · consequence-if-unaddressed |
| `Hook` | 5-6 | Hebrew text · English gloss · family (curiosity / truth-mirror / permission / antidote / invitation / pattern-break) · audience targeting |
| `EmotionalAngle` | 3-4 | label · Hebrew label · pitch · tone adjectives |
| `AdConcept` | 2-3 | title · format (still / video / carousel / story) · one-line · narrative · visual direction · Hebrew CTA · product presence |
| `UgcScript` | 1-2 | title · duration · Hebrew script with timecodes · shot list · delivery notes · Hebrew CTA |
| `ImagePrompt` | 1-2 | full photorealistic prompt · negative prompt · aspect ratio · style references (Jamie Hawkesworth, Justine Kurland, etc.) |
| `VideoPrompt` | 0-1 | full prompt · 15s default · shot sequence · audio direction · 9:16 default |
| `CarouselConcept` | 0-1 | title · 5-slide narrative arc: **hook · truth · reveal · proof · invitation** |
| `FounderStory` | 2 | title · Hebrew hook · Hebrew narrative · callback to product |
| `Testimonial` | 3 | speaker profile · Hebrew quote · English gloss · proof point |

### Image prompts — what they actually demand

Every `ImagePrompt.prompt` begins with **"Photorealistic editorial photograph"** and carries a `negativePrompt` that explicitly forbids:

- vector illustration, flat design, isometric, 3D-render look
- gradient backgrounds, studio backdrop, white seamless
- stock-photo expressions, smiling-at-camera, fitness-influencer aesthetic
- text in the image, captions, Hebrew text rendered by the image model (Hebrew lives in post-production overlay)
- children's product cues, medical / supplement cues
- neon, vibrant saturated color
- AI artifacts on hands / face / extra fingers
- invented MOOD packaging variants, "limited edition" copy

The brand signature is **explicitly NOT** placed in the rendered image — it lives in a post-production overlay. This isolates the image-gen vendor's weaknesses (Hebrew typography, brand marks) from the brief.

Style references include Jamie Hawkesworth, Justine Kurland, Ryan McGinley, Wolfgang Tillmans — editorial documentary photographers, not advertising clip-art.

---

## 3 · Real image generation — the boundary

### `lib/imageGenProvider.ts`

```ts
generateImage({ prompt, negativePrompt?, aspectRatio?, seed? }, providerId?) : ImageGenResponse
```

Providers:

| `providerId` | env var | configured? (current env) | Use |
|---|---|---|---|
| `none` | — | ✓ default | Returns the prompt + "configure a provider to render" advisory. Operator can paste into Midjourney / Krea / Runway manually. |
| `replicate-flux-schnell` | `REPLICATE_API_TOKEN` | ✗ (no key here) | Fast (~1-3s/image). Concept iteration. |
| `replicate-flux-dev` | `REPLICATE_API_TOKEN` | ✗ | Slow (~10-30s). Final marketing assets. **Default once REPLICATE_API_TOKEN is set.** |
| `replicate-sdxl` | `REPLICATE_API_TOKEN` | ✗ | Classic. Lower cost. |

The provider matrix is exposed via `GET /api/image-gen` so the operator UI lists them with their configured status. The provider call is in `lib/imageGenProvider.ts:generateReplicate()` — it `fetch`es Replicate's `POST /v1/models/{slug}/predictions` with the `Prefer: wait` header so the response is synchronous (no polling).

### `/api/image-gen` POST

```
POST /api/image-gen
  { prompt, negativePrompt?, aspectRatio?, seed?, providerId?, operatorReason }
→ { ok, providerId, imageUrl?, imageBase64?, error?, latencyMs, advisoryNotice }
```

- `requireSession` (any authenticated operator)
- No tenant gate — image generation is a creative-side action, not a tenant-data action
- Degrades to "no provider configured" gracefully — never throws to the UI
- **NEVER auto-saves** the rendered image to the asset library. Saving is a separate explicit operator action through `/api/asset-registry`.

---

## 4 · The new operator path

### `/strategy` page

The new primary creative surface. Operator picks:
1. Product (BOOST / CHILLAX / BUNDLE)
2. Brand (optional · pulls identity defaults if connected)
3. Image provider (`none` if no env, real provider if `REPLICATE_API_TOKEN` is set)
4. Operator reason

Then "Generate Strategy" yields the 11-tab breakdown:

| Tab | Surface |
|---|---|
| Audiences | 2-3 audience cards with demographic + psychographic + channel mix |
| Pain points | 3-4 cards: Hebrew short text + English detail + consequence |
| Hooks | 5-6 Hebrew hooks with family tag + English gloss + copy button |
| Emotional angles | 3-4 cards with Hebrew label + pitch + tone adjectives |
| Ad concepts | 2-3 full concept cards (title · narrative · visual direction · CTA · product presence) |
| UGC scripts | 1-2 timecoded Hebrew scripts (≤25s) with shot list + delivery notes + copy button |
| Image prompts | 1-2 photoreal prompts. Each prompt has its own **"Render with [provider]" button** that calls `/api/image-gen` and inlines the resulting image in the card. If no provider is configured, the operator gets the prompt + a clear "configure REPLICATE_API_TOKEN" message. |
| Video prompts | 0-1 video prompts (vertical 9:16, 15s) with shot sequence + audio direction |
| Carousels | 5-slide narrative arc per concept (hook · truth · reveal · proof · invitation) |
| Founder stories | 2 Hebrew narratives with hook + body + product callback |
| Testimonials | 3 Hebrew quotes with speaker profile + proof point |

### Studio Home rewired

The primary CTA on `/studio-home` is now **"Open Strategy →"**. The "01 Compose / 02 Review / 03 Brand setup" action grid leads with Strategy. A small footer link preserves access to the legacy SVG generator for layout previews only.

---

## 5 · What the engine actually produces (sample · live)

Live `POST /api/creative-strategy` with `productCode: BOOST`, brand override `Aria`:

**Counts:** 3 audiences · 4 pain points · 6 hooks · 4 emotional angles · 3 ad concepts · 2 UGC scripts · 2 image prompts · 1 video prompt · 1 carousel concept · 2 founder stories · 3 testimonials.

**First hook** (`truth-mirror`): "אחרי 10 שנים, הקפה לא עושה את מה שעשה" → *After 10 years, coffee no longer does what it used to.*

**First ad concept** (`The 7:14 morning`, format: `still`):
> A 38-year-old founder, half-dressed, leaning on her kitchen counter, holding a torn BOOST pouch. The window light is doing 60% of the work. She is not posing. She is reading something on her phone — work, probably. The pouch is just there, in her hand, the way reading glasses are just there. No mascot. No mantra.

**First image prompt** (excerpt):
> Photorealistic editorial photograph. A 38-year-old founder, half-dressed, leaning on her kitchen counter, holding a torn BOOST pouch. Subject: real adult, age-appropriate (35-45), unstyled, no posed expression. Setting: Documentary handheld 50mm. Warm interior. Single window light from camera-left. Subject not looking at camera. Real morning kitchen — half-empty cup, opened laptop. The pouch is incidental. […]

**First founder story** (Hebrew narrative, excerpt):
> לפני שלוש שנים, בערב חמישי, ישבתי במטבח עם בן הזוג שלי. הוא שאל אותי מתי בפעם האחרונה לא הסתכלתי בטלפון אחרי 9 בלילה. לא ידעתי לענות. הבנתי שאני צריכה משהו שלא משתמש בי. משהו שאני אוכלת, לא בולעת. משהו שמרגיש כמו מתנה שאני נותנת לעצמי, לא תיקון.

**First testimonial:** *(Female founder, 39, mother of two, hi-tech)* "הפסקתי לשתות שלוש כוסות קפה ביום. עברתי לאחת. השאר זה הבוסט."

CHILLAX and BUNDLE produce structurally identical artifacts with product-specific copy:
- **CHILLAX first hook**: "את יודעת שהטלפון מחבל בלילה שלך."
- **CHILLAX first concept**: "The 21:14 living room — a couple on a couch, phones face-down on the coffee table, a half-eaten CHILLAX square between them."
- **BUNDLE first hook**: "בוקר ולילה, באותה קופסה."
- **BUNDLE first concept**: "The day in a box — a linen-bound BUNDLE box opened on a kitchen table. BOOST pouches stacked left, CHILLAX pouches stacked right. A handwritten card in the middle: 'Try the week.'"

---

## 6 · Files added / changed

### New (6)

| Path | Lines | Purpose |
|---|---|---|
| `lib/creativeStrategyEngine.ts` | 472 | Pure engine + types + product taxonomy |
| `lib/creativeStrategyMemory.ts` | 91 | FIFO-capped store for saved strategies |
| `lib/imageGenProvider.ts` | 173 | Image-gen boundary + Replicate adapter (Flux Schnell · Flux Dev · SDXL) + stub fallback |
| `app/api/creative-strategy/route.ts` | 138 | POST (generate + optional save) · GET (list) — both tenant-gated |
| `app/api/image-gen/route.ts` | 67 | POST (generate image) · GET (provider matrix) |
| `app/strategy/page.tsx` | 285 | 11-tab operator UI, render-on-demand against any configured provider |
| `scripts/verify-creative-strategy.ts` | 192 | 15-case verifier |
| `docs/creative-strategy-engine-report.md` | this file | Report |

### Modified (3)

| Path | Change |
|---|---|
| `app/components/ui/AppShell.tsx` | Added `/strategy` to global nav |
| `app/studio-home/page.tsx` | Primary CTA + action card now point to `/strategy`. Legacy SVG generator demoted to a footer link. |
| `scripts/verify-system-stability.ts` | POST whitelist extended for `/api/creative-strategy` and `/api/image-gen` |

### Preserved unchanged (per the "freeze, not remove" directive)

- `src/components/creative-brief-svg.ts` (SVG composers)
- `src/components/creative-brief-imagery.ts` (vector pouch + chocolate square)
- `src/engines/export/creative.ts` (Resvg rasterizer)
- `src/engines/creative-quality-guard.ts` (quality guard for SVG path)
- `app/api/render/route.ts` (SVG render endpoint)
- `app/asset-generator/page.tsx` (template generator UI)

---

## 7 · Suite state

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ clean |
| `npm run build` | ✅ green (24 pages, 0 prerender errors) |
| `scripts/verify-creative-strategy.ts` | ✅ **15/15** |
| `scripts/verify-system-stability.ts` | ✅ 12/12 (whitelist updated for the 2 new POSTs) |
| `scripts/verify-authentication.ts` | ✅ 28/28 (unchanged) |
| `scripts/verify-tenant-isolation-hardening.ts` | ✅ 15/15 (unchanged) |
| `scripts/verify-product-experience-p0.ts` | ✅ 12/12 (unchanged) |
| **Full verifier suite (70 scripts)** | ✅ **70/70** |

Live smoke-tested end-to-end: register → first workspace → generate strategy for all 3 products → confirmed image-gen provider matrix correctly reports `none` as configured and Replicate models as needing `REPLICATE_API_TOKEN`.

---

## 8 · What this does NOT do (honest scope)

- **The engine is knowledge-based, not LLM-based.** It generates from a curated playbook compiled into TypeScript. It does not call OpenAI / Anthropic / any LLM. This is intentional — deterministic, auditable, no hallucinations, no per-request cost.
- **The engine does not yet learn from outcomes.** No feedback loop from approved-vs-rejected back into the strategy. Today: same input → same output. A future phase could wire engagement signals back.
- **The engine does not yet generate images itself.** Image generation requires `REPLICATE_API_TOKEN` (or another supported provider env var). Without that env, the prompts are the deliverable — the operator pastes them into their image tool of choice.
- **The engine does not auto-publish.** Every artifact is operator-facing exploration. Approval into the asset library is still a separate explicit POST.
- **The SVG path is frozen, not deleted.** A future phase can prune it if the team confirms no layout-preview use remains.

---

## 9 · Success condition

> *The default output should be a human-centered advertisement, not a design template.*

**Met.**
- The default creative path is `/strategy`, not `/asset-generator`.
- Every image prompt explicitly demands photorealistic editorial photography and forbids vector / gradient / flat-design aesthetics.
- Every ad concept centers on a real human moment ("a 38-year-old founder leaning on her kitchen counter", "a couple on a couch with phones face-down", "a parent closing a child's bedroom door").
- No more brown gradient backgrounds as the default output.
- No more vector pouches as the default output.
- The vector renderer remains accessible behind an explicit "templates" callout.

NO publishing. NO auto-approval. NO charges to billing providers. Human remains final authority.
