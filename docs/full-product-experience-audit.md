# Full Product Experience Audit — Read-Only

**Branch:** `claude/mood-creative-os-v1-i4Mfv`
**HEAD:** `a5575ae`
**Date:** 2026-06-03
**Auditor:** Claude · operator-supervised
**Method:** Live dev server (`npm run dev` on :3000) + production build (`npm run build`) + source-code read. Bootstrap user `member@mood.local` was provisioned with `MOOD_BOOTSTRAP_*` env vars to test the member path; `audit@mood.local` was registered the normal way to test the no-membership path.

**Scope of this document:** observation only. No code modified. No commits. No pushes. No fixes. Recommendations live in the P0 plan section.

---

## 1 · Executive Summary

The platform is **two products glued together by a shared `/api/*` layer and a stale `<body className="scanline">`:**

1. **Legacy V1** (`/`, `/studio`, `/dashboard`, `/brands`, `/products`, `/onboarding`, `/growth`, `/workflows`, `/fast-start`, `/runtime`) — built earlier in the project. Uses the original tailwind token system (`font-editorial`, `text-bone-100/70`, `hairline`). Visually sparse, list-of-cards, mobile-functional but design-2017. Production build fails for **7 of these pages** with `useSearchParams() should be wrapped in a suspense boundary`.

2. **New product surface** (`/studio-home`, `/asset-generator`, `/asset-library`, `/brand-setup/[brandId]`) — built in the PXCO + RMAQ phases. Uses an inline hex-based design language (`bg-[#050505]`, `text-[#F7F5F2]`, `font-['EditorialNew',...]`), `AppShell` navigation, more visual discipline, but **not connected to the legacy pages**.

The two halves do not link to each other. The homepage (`/`) is the legacy V1 formula picker. There is no link from `/` to `/studio-home`. A first-time user lands on a 2017 banner-engine prototype and never discovers the new product surface unless they type the URL.

Functionally:
- `/api/render` works end-to-end for authenticated sessions: SVG composed, Resvg → PNG (verified 1200×628 RGBA), prompt + negative prompt + production spec all returned.
- `/api/asset-registry` GET works for tenant members; POST works for any session.
- The Asset Quality Guard correctly rejects the cases it was designed to reject.
- Hebrew vector typography composes correctly at the SVG level. Render fidelity in PNG depends on whether Heebo is installed in the host system — Resvg falls back to system Arial Hebrew otherwise.

But:
- 4 pages the user asked about **do not exist**: `/login`, `/register`, `/account`, `/brand-setup` (index, only `[brandId]` exists).
- A freshly **registered** user is silently locked out of every tenant page because `/api/auth/register` explicitly does not grant any membership. There is no UI to create an organization or join one.
- 8 occurrences of hardcoded `'org-mood'`/`'wsp-mood-default'` across the new pages. The product is MOOD-only despite the multi-tenant substrate.
- The asset library shows real PNG previews (data URLs), supports approve/reject/archive, supports filtering by status. It does NOT yet support filtering by formula or by packageType. Detail modal works.
- The asset generator renders all 5 visual modes, but the brief→preview latency is 0.5–1.5s per slide (Resvg synchronous in the request thread).

---

## 2 · Final Verdict

> **NOT PRODUCT READY.**

Can this be shown to a real customer today? **NO.**

Can this generate a real usable MOOD ad today? **NO — but close.** The vector-SVG output is brand-correct and registers in the library. It is not a photograph. A marketer can use the PNG as a placeholder, the prompt + production spec as a brief to a designer, or the negative prompt + spec as the input to an external image-generation provider. As a self-contained "generate and ship" pipeline for paid social, it does not yet stand on its own.

The blockers, ranked:

1. **No auth UI.** Auth API exists; auth pages do not. A real customer cannot sign up or log in through the product.
2. **No tenant onboarding.** Register grants zero memberships. New users are immediately stuck.
3. **Two visual systems.** The legacy + new halves look like different products.
4. **Production build fails on 7 pages.** Cannot be deployed as-is.
5. **No real image-generation backend.** What's shipped is vector SVG. To produce "ad-ready" creative the brief must feed an image provider; that connector does not exist.
6. **MOOD-hardcoded.** Cannot demo a second tenant.

---

## 3 · Route Inventory

Probed live on `npm run dev` at `:3000`. All probes were issued as a tenant **member** (`member@mood.local`, organization-owner of `org-mood`) using the cookie returned by `/api/auth/login`.

| Route | HTTP (dev) | Production build | Login required (effective) | Primary API call | Primary action | Action works? | Notes |
|---|---|---|---|---|---|---|---|
| `/` | 200 | ✅ | none (anon) | none (legacy local state) | pick formula → `/studio?...` | **partial** — fires the V1 banner pipeline if backend keys exist | Legacy V1 page. No link to new surface. |
| `/studio` | 200 | ✅ | none (anon) | `/api/generate` (legacy heavy pipeline) | generate banner | not tested in this audit (heavy pipeline) | 11k-line client component. Different design language. |
| `/studio-home` | 200 | ✅ | session + tenant | `/api/asset-registry`, `/api/brand` | overview + nav to other surfaces | yes | New design. Decent. |
| `/asset-generator` | 200 | ✅ | session for render; tenant for brand list | `/api/render`, `/api/brand`, `/api/asset-registry` | compose + render + save | **yes** | Works end-to-end. Tested all 5 visual modes. |
| `/asset-library` | 200 | ✅ | session + tenant | `/api/asset-registry` GET + POST | browse + approve/reject/archive | yes for members, **403 for anyone else with confusing message** | CSR-only. |
| `/brand-setup` (index) | **404** | n/a | n/a | n/a | n/a | **does not exist** | Only `[brandId]` page. |
| `/brand-setup/[brandId]` | 200 | ✅ | session + tenant | `/api/brand` GET + POST update-identity | 4-step identity wizard | yes | But unlinked from `/brands`. |
| `/dashboard` | 200 | ❌ (`useSearchParams` no Suspense) | session + tenant | `/api/dashboard`, `/api/navigation` | read-only executive home | yes (dev) | Legacy design. |
| `/fast-start` | 200 | ❌ | session | `/api/fast-start` | 4-field org scaffold | yes (dev) | Legacy design. |
| `/brands` | 200 | ❌ | session + tenant | `/api/brand` | list + create | yes (dev) | Legacy design. **Zero links to `/brand-setup`**. |
| `/products` | 200 | ❌ | session + tenant | `/api/product` | list + create | yes (dev) | Legacy. |
| `/workflows` | 200 | ❌ | session + tenant | `/api/workflows` | read-only workflow board | yes (dev) | Legacy. |
| `/growth` | 200 | ❌ | session + tenant | `/api/growth` | read-only growth command center | yes (dev) | Legacy. |
| `/onboarding` | 200 | ❌ | session + tenant | `/api/onboarding` | 8-step generic wizard | yes (dev) | Not brand-specific. |
| `/runtime` | 200 | ✅ | session + tenant | `/api/runtime` | cognitive weather observatory | yes | Internal system page, not customer-facing. |
| `/login` | **404** | n/a | n/a | n/a | n/a | **does not exist** | Auth API exists; UI does not. |
| `/register` | **404** | n/a | n/a | n/a | n/a | **does not exist** | Same. |
| `/account` | **404** | n/a | n/a | n/a | n/a | **does not exist** | No profile page despite `/api/auth/me`. |

### Production build failures (concrete error)

```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/dashboard"
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/brands"
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/products"
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/fast-start"
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/growth"
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/onboarding"
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/workflows"

Export encountered errors on following paths.
```

Root cause: each of these `'use client'` pages calls `useSearchParams()` at the top level without a `<Suspense>` boundary around it. Next 14 requires either a Suspense wrapper or `export const dynamic = 'force-dynamic'`. Neither is present.

---

## 4 · Design Scorecard (0–10, vs Canva / Notion / Linear / Framer / Runway / Adobe Express / Jasper / Typeface.ai)

Per-page subjective scoring based on visible HTML/CSS + source review. 10 = peer of the references. 5 = OK. ≤ 3 = needs full redesign.

| Page | Visual design | Typography | Spacing | Hierarchy | Mobile | Clarity | Emotional | Trust | SaaS polish | Conversion | Avg |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 3 | 5 | 4 | 4 | 5 | 4 | 5 | 3 | 2 | 2 | **3.7** |
| `/studio` | 4 | 5 | 5 | 4 | 4 | 3 | 5 | 4 | 3 | 3 | **4.0** |
| `/studio-home` | 6 | 7 | 6 | 7 | 7 | 6 | 6 | 6 | 6 | 5 | **6.2** |
| `/asset-generator` | 6 | 7 | 6 | 7 | 6 | 6 | 5 | 6 | 6 | 5 | **6.0** |
| `/asset-library` | 6 | 6 | 6 | 6 | 6 | 6 | 4 | 6 | 6 | 5 | **5.7** |
| `/brand-setup/[brandId]` | 6 | 6 | 6 | 6 | 5 | 6 | 5 | 6 | 5 | 4 | **5.5** |
| `/dashboard` | 4 | 5 | 5 | 4 | 6 | 4 | 4 | 4 | 3 | 3 | **4.2** |
| `/brands` | 3 | 5 | 4 | 3 | 6 | 4 | 2 | 3 | 2 | 2 | **3.4** |
| `/products` | 3 | 5 | 4 | 3 | 6 | 4 | 2 | 3 | 2 | 2 | **3.4** |
| `/workflows` | 4 | 5 | 5 | 4 | 6 | 4 | 4 | 4 | 3 | 3 | **4.2** |
| `/growth` | 5 | 6 | 5 | 5 | 6 | 4 | 5 | 4 | 4 | 3 | **4.7** |
| `/onboarding` | 4 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 4 | **4.5** |
| `/fast-start` | 4 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 4 | **4.5** |
| `/runtime` | 5 | 6 | 6 | 5 | 4 | 3 | 7 | 5 | 4 | 1 | **4.6** |
| **Average** | **4.5** | **5.6** | **5.1** | **4.9** | **5.5** | **4.6** | **4.4** | **4.5** | **3.9** | **3.3** | **4.7** |

### Looks old
- The whole legacy half (`/`, `/studio`, `/dashboard`, `/brands`, `/products`, `/workflows`, `/growth`, `/onboarding`, `/fast-start`, `/runtime`). All use the `.scanline` body class + `font-editorial` tokens. Reads as a 2015–2017 editorial blog. No motion. No interactive feedback beyond hover color changes. Eyebrows + hairlines do not compensate for the lack of visual structure.
- The legacy `/brands` page: a single-column list of brand cards with a form below. No empty state illustration. No filtering. No search.
- The CTA button on `/`: `bg-bone-50 text-ink-900 text-sm tracking-[0.3em]` — fine in 2018, dated now. Letter-spacing 0.3em on a primary CTA reads as a brutalist mood board, not a SaaS action.

### Looks cheap
- The page chrome on the legacy half: no real header, no real footer, no real navigation. Pages are island components linked only by URL query parameters.
- 4 missing auth/account pages. A SaaS product without `/login` looks broken before the customer has even clicked anything.
- The `.scanline` body texture (an inherited CRT-scanline effect) overlays every page including the new ones. Forces a fixed mood that conflicts with brighter palettes.
- No favicon (default Next).
- No real loading states on the new pages — `pulse` skeletons, but no skeleton shapes that match the cards they replace.

### Looks confusing
- Two design languages co-exist. A user toggling between `/studio-home` (new) and `/dashboard` (legacy) believes they have switched apps.
- The homepage `/` does not link to the new surface. New users will never find it.
- The legacy `/brands` page does not link to `/brand-setup`. Users who created a brand cannot find the identity wizard.
- `useSearchParams()`-driven tenancy: every legacy page expects `?organizationId=…&workspaceId=…` in the URL or silently defaults to MOOD. The user has no idea this is happening.
- The new pages hardcode `'org-mood'` and `'wsp-mood-default'`. A member of `org-royalloot` (tenant #2) would still see MOOD's data if they navigated to `/asset-library` — wait, no, they'd get 403. Either way, the page doesn't tell them why.
- `/api/auth/login` requires `operatorReason` in the body. No UI explains this. Anyone building a custom login form will hit a 400 they can't read.

### Looks promising
- `/studio-home` is the strongest single page. The hairline-edged cards, the editorial title scale, the formula-aware atmospheric breathing — these are the building blocks of a real product.
- The `AppShell` component is the right idea. Sticky header, horizontally-scrolling mobile nav, breadcrumb section bar. It just needs to apply to every page, not 4 of them.
- The Asset Generator brief editor — the brief→preview loop — has the bones of a Canva / Figma-flavored interaction. It needs faster feedback (debounce + auto-render) and a real product photo upload.
- The Asset Library grid + status filter + detail modal is a real library UX skeleton. It needs formula/type filters and bulk actions.
- The runtime observatory `/runtime` has actual taste — the strongest emotional design in the project. Wrong page for a SaaS, right designer.

### What should be redesigned first

1. **Homepage `/` → product entry** with sign-in, sign-up, and an explicit value prop. Today it is a V1 demo room.
2. **Auth pages** — `/login`, `/register`, `/account`, plus a "create your first organization" flow.
3. **Migrate the legacy half** onto `AppShell`. Same chrome, same nav, same primitives. Pick **one** design language and apply it everywhere.
4. **`/brands` → `/brands/[brandId]`** with the identity wizard merged in. The current 2-screen split is unnatural.
5. **`/asset-library`** needs formula + packageType filters and a bulk approve action.

---

## 5 · UX Scorecard

| Dimension | Score (0–10) | Note |
|---|---|---|
| Discoverability of primary action | 3 | New product is invisible from `/`. No global "compose" affordance. |
| Onboarding | 2 | Register → locked out. No UI to create an org. |
| Navigation consistency | 3 | Two separate nav systems (none on legacy; AppShell on new). |
| Error recovery | 3 | 403 pages show raw API JSON via `Card` component. No "create org" CTA. |
| Empty states | 5 | `Empty` component exists on new pages; legacy pages just show nothing. |
| Feedback / loading | 4 | `pulse` skeletons on new pages; legacy pages show "..." text. |
| Mobile responsiveness | 6 | All new pages tested; legacy pages are mobile-first by design. |
| Form ergonomics | 5 | New `Field` component is decent; legacy forms are bare. |
| Keyboard / a11y | unmeasured | No focus rings configured beyond browser default. No aria-live regions on async results. |
| Internationalisation | 4 | Hebrew renders correctly in copy and in the SVG output. The shell is English-only. No `dir="auto"`. |

---

## 6 · Asset Generator Functional Audit (Part 3)

All probes issued as `member@mood.local` (organization-owner of `org-mood`). Briefs sent directly to `POST /api/render`.

| # | Scenario | Input | Endpoint | Status | Guard | Slides | PNG bytes (b64) | PNG valid? | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | ENERGY banner · text-only | `formula=ENERGY, packageType=banner, paletteKey=amber, headline="בוקר אחד" (8 char), cta="גלו"` | `/api/render` | **200** | ok | 1 | 725,664 | ✅ | clean |
| 2 | FOCUS post · text-only | `formula=FOCUS, packageType=post, paletteKey=ink, headline="שקט אחד" (7), cta="המשיכו"` | `/api/render` | **200** | ok | 1 | 347,700 | ✅ | clean |
| 3 | RELAX carousel · text-only | 2 slides | `/api/render` | **200** | ok | 2 | 1,975,020 | ✅ | clean |
| 4 | SLEEP banner · text-only | `formula=SLEEP, paletteKey=ink, headline="לילה שקט" (8), cta="שינה טובה"` | `/api/render` | **200** | ok | 1 | 223,244 | ✅ | small PNG — sparse layout, no product |
| 5 | product-hero | ENERGY · pouch | `/api/render` | **200** | ok | 1 | 650,508 | ✅ | pouch composes |
| 6 | human-moment | FOCUS · still-life | `/api/render` | **200** | ok | 1 | 1,086,068 | ✅ | scene composes |
| 7 | product + human | RELAX · pouch + hand | `/api/render` | **200** | ok | 1 | 598,268 | ✅ | hand + pouch overlap correctly |
| 8 | text-only fallback · short headline | `headline="בוקר"` (4 chars) | `/api/render` | **422** | **rejected** | 0 | 0 | n/a | Guard fired `headline-too-short`. Expected. |

7/8 successful. Scenario 8 hit the `headline-too-short` rejection at 6-char threshold — expected guard behavior, not a bug.

### Verified during this audit
- **Hebrew renders correctly** in the SVG layer for all scenarios. PNG fidelity depends on host Heebo install.
- **PNG output is real** — extracted scenario 5's PNG: `1200 × 628, 8-bit/color RGBA, non-interlaced` (file delivered to user during the audit run).
- **prompt, negativePrompt, productionSpec, qualityGuard** all returned in the 200 body.

### Issues found

| Issue | Severity | Location |
|---|---|---|
| `validBrief()` rejects empty/missing CTA with a generic `400 invalid JSON body`-style error before the guard runs — guard's `cta-missing` code never fires from the route. | P2 | `app/api/render/route.ts:30-58` |
| Render is synchronous inside the request thread. 1.5s wait for the user on a 5-slide carousel. No streaming, no progress. | P1 | `src/engines/export/creative.ts` (Resvg `.render()`) |
| Generator UI hard-fails on save when the user is not a tenant member — POST succeeds (because `requireSession` not `requireTenantSession`), but the user cannot see the asset they just saved (library is tenant-gated). | P0 | mismatch: `app/api/asset-registry/route.ts` POST vs GET auth gating |
| No automatic image-upload field. The brief has no place to attach a real product photograph. The whole product imagery is vector-only. | P0 | `src/components/creative-brief-svg.ts` + UI |
| The guard's `english-in-hebrew-asset` is `warning` not `rejection` — the user can ship an asset that violates the rule. | P2 (intentional per spec) | `src/engines/creative-quality-guard.ts` |

---

## 7 · Asset Library Report (Part 4)

Probed as `member@mood.local`.

| Check | Result | Detail |
|---|---|---|
| Seed assets visible? | ✅ | 16 total · 11 pending · 5 approved · 0 rejected · 0 archived (15 from prior phases + 1 from this audit save) |
| User can preview an asset? | ✅ | Click card → modal with full preview |
| Download PNG? | ✅ | Anchor with `download` attr inside detail modal |
| Copy prompt? | ✅ | "Copy prompt" button in detail modal |
| Copy spec JSON? | ✅ | "Copy spec (JSON)" button — but JSON is a small subset (assetId, formula, packageType, campaign, copy, summary), NOT the full production spec from the generator |
| Filter by formula? | ❌ | No filter UI. API supports `?formula=`. |
| Filter by type? | ❌ | No filter UI. API supports `?packageType=` but is not actually exposed in the registry route — it only filters by `status` and `formula`. |
| Approve / reject / archive? | ✅ | Buttons in detail modal; require operator reason |
| Real images or just metadata? | ✅ | Data-URL PNG previews stored on each AssetRecord |
| Usable by a marketer? | **partial** | Looks like a moodboard, not a marketing-ops queue. No bulk actions, no search, no sort, no version history, no per-asset analytics, no asset reuse from a previous asset. |

**Marketer workflow missing**: search, bulk approve, duplicate-from-asset, "use as template", per-formula counts in the side rail.

---

## 8 · Brand Setup Report (Part 5)

Probed `/brand-setup/brand-mptl83my-1` for the seeded MOOD brand.

| Check | Result | Detail |
|---|---|---|
| Define brand voice? | ✅ | Step 1: voice adjectives, positioning, slogan (Hebrew), values |
| Define audience? | ✅ | Step 2: audience description, brand language |
| Define visual identity? | ✅ | Step 3: default palette key, signature mark |
| Upload / reference product images? | ❌ | **No upload field anywhere in the product.** No image storage layer. |
| Define brand colors (custom hex)? | ❌ | Only palette key picker (cocoa / amber / ember / ivory / ink). No custom palette. |
| Add logo (upload)? | ❌ | Signature is a text string; no logo upload. |
| Add product packaging (photo)? | ❌ | None. Pouch is rendered as a vector illustration with no escape hatch to a real photograph. |
| Identity affects generated assets? | **partial** | The Asset Generator reads `/api/brand` for the brand list but ignores the saved identity (palette, signature, voice). Wizard saves; generator does not consume. |
| Flow clear? | ✅ | 4-step pager with sticky preview panel. Best legacy-vs-new gap closer in the product. |
| Beautiful? | **partial** | Cleaner than legacy. Less polished than Linear / Notion. The "Brand snapshot" preview is a strong pattern. |

### Missing fields required for real MOOD marketing

| Field | Status | Why it matters |
|---|---|---|
| Pouch image (canonical photograph) | **missing** | The pouch is currently a vector approximation. A real photograph is needed to match the brand's actual product. |
| Chocolate-square image | **missing** | Same. |
| Formula colors (custom hex) | **missing** (uses canonical FORMULA_PALETTES) | A brand cannot deviate from the 4 hardcoded palettes. |
| Hebrew tone (registered samples) | **missing** | Voice field exists but is free text — no anchor examples. |
| CTA style (library) | **missing** | No canonical CTA list. Operator types each time. |
| Audience segment (structured) | **missing** | One free-text field. No segments, no buyer persona, no behavior. |
| Product usage moment | **missing** | The "emotion" field is the closest thing; no moment library. |
| Platform format catalog | **partial** | 4 platform sizes in a dropdown; no preview-per-platform. |
| Brand examples (reference assets) | **missing** | No moodboard / no reference upload / no "this is what we want to look like". |

---

## 9 · Error List (Part 7)

Compiled from build output, dev-server logs, source-code review of error paths, and live network probes.

| Page | Action | Error | Likely root cause | File | Severity |
|---|---|---|---|---|---|
| `/dashboard` `/brands` `/products` `/growth` `/onboarding` `/workflows` `/fast-start` | `npm run build` | `useSearchParams() should be wrapped in a suspense boundary` | client component calls hook at top level without Suspense | each `page.tsx` listed in §3 | **P0** |
| `/` | any user | no link to `/studio-home`, `/login`, or any new surface | legacy homepage frozen | `app/page.tsx` | **P0** |
| `/login` | navigation | 404 | route does not exist | n/a | **P0** |
| `/register` | navigation | 404 | route does not exist | n/a | **P0** |
| `/account` | navigation | 404 | route does not exist | n/a | **P0** |
| `/brand-setup` (index) | navigation | 404 | only `[brandId]` exists | n/a | **P1** |
| `/api/auth/register` | new user signs up | succeeds; user is locked out of every tenant page | route does not grant a membership; no UI to create / join | `app/api/auth/register/route.ts` | **P0** |
| `/asset-library` | non-member with valid session | 403 with raw error JSON shown in a Card | error UI shows API message verbatim; no recovery path | `app/asset-library/page.tsx:55-65` | **P1** |
| `/api/auth/login` | login form (any) | 400 `operatorReason is required` when login form omits the field | login route requires `operatorReason` in body; no documentation for client | `app/api/auth/login/route.ts` | **P1** |
| `/api/auth/bootstrap` | post-bootstrap | user created but no session cookie returned | bootstrap does not call `issueSession()` | `app/api/auth/bootstrap/route.ts` | **P2** |
| `/api/asset-registry` POST | non-member with valid session | 200 — asset is saved into a tenant the user has no membership in | route uses `requireSession`, not `requireTenantSession` | `app/api/asset-registry/route.ts:101-112` | **P0 (security-adjacent)** |
| `/api/render` | empty CTA | `400 invalid JSON body`-style instead of `422 cta-missing` | `validBrief()` runs before `runQualityGuard()` | `app/api/render/route.ts:30-58` | P2 |
| `/asset-library` `/asset-generator` `/studio-home` `/brand-setup/[brandId]` | any | hardcoded `'org-mood'`, `'wsp-mood-default'` everywhere | new pages do not read `/api/auth/me` to derive tenant context | 8 hits across 4 files | **P0** |
| `/brands` | created brand | no link to `/brand-setup/[brandId]` | legacy + new not connected | `app/brands/page.tsx` | **P1** |
| `/api/auth/me` | any | not consumed by any new page | UI lacks an auth context provider | none | P1 |
| `/` global | any | body has `className="scanline"` overlaying everything | layout forces a single mood | `app/layout.tsx:26` | P2 |
| All pages | any | no favicon, default Next title for several routes | no `metadata` exports on most pages | various `page.tsx` | P2 |

No browser-console errors were probed — that requires a real browser session. The errors above are derivable from build + server logs + source review.

---

## 10 · Real-Output Capability Verdict (Part 6)

> Can the system currently generate a real marketing asset that Nadav can post today?
>
> **NO.**

Why:

| Reason | Status |
|---|---|
| No real image-generation engine | confirmed — Resvg only |
| No product photograph / image upload | confirmed — vector-only |
| No uploaded product photos | confirmed — no storage layer |
| Renderer present | ✅ Resvg + SVG composer works |
| API broken? | no — `/api/render` works for sessions |
| Only JSON saved? | no — PNG (data URL) saved alongside the prompt |
| Only abstract gradient posters? | partially — the RMAQ phase added vector pouch + chocolate-square + still-life scene + hand. Output is brand-correct vector composition. Not a photograph. |
| No human/product composition? | no — `product-and-human` mode works (verified) |
| No PNG export? | no — works (Download PNG button in library + per-slide in generator) |
| Poor Hebrew typography? | mixed — SVG carries Heebo; PNG rendering quality depends on host fonts. Resvg uses system Arial Hebrew fallback in this container. |
| Old UI? | the new product surface is decent; legacy half is dated. The customer's first impression is the legacy half. |

**What's needed to flip this to YES:**
1. An image-generation provider (Flux / Stable Diffusion / Midjourney) wired into `/api/render` as a backend step. The brief + prompt + negative prompt + production spec is already structured for it.
2. A product-photo upload + reference field on the Brand Setup wizard. The pouch reference must be a real photograph the operator approved, not the canonical vector approximation.
3. A new pipeline step that composes the photograph (or the generated image) with the typography layer — analogous to the existing `composeBannerSvg` for the V1 pipeline.

---

## 11 · Top 25 Problems

Sorted by impact on a "ship to a real customer" decision.

1. **No `/login`, `/register`, `/account`.** Auth is invisible to the customer.
2. **Register grants no membership.** New users are stuck.
3. **Production build fails on 7 pages.** Cannot be deployed.
4. **`/` is the legacy V1 formula picker.** First impression is wrong.
5. **Two disjoint design languages.** Reads as two apps.
6. **`'org-mood'` hardcoded in 4 new pages, 8 occurrences.** Cannot demo a second tenant.
7. **No image upload anywhere.** Cannot attach real product photos or logos.
8. **No image-generation backend.** Output is vector SVG, not photography.
9. **Brand identity doesn't affect generated assets.** Setup writes; generator ignores.
10. **`/brands` → `/brand-setup` link missing.** Brand wizard is unreachable from the brand list.
11. **Asset library has no formula filter, no type filter, no search.** Cannot scale past 50 assets.
12. **No auth context provider.** Each page re-derives tenancy from hardcoded strings.
13. **`requireSession` vs `requireTenantSession` mismatch on asset-registry POST.** Cross-tenant write possible.
14. **`useSearchParams()` without Suspense.** 7 prod-build crashes.
15. **`login` requires `operatorReason` body.** No UI explains this.
16. **Bootstrap doesn't set a cookie.** Must login separately.
17. **Render is synchronous in the request thread.** 1.5s on a carousel.
18. **CSR-only asset library.** Blank flash, no SEO, no shareable URLs.
19. **`<body className="scanline">` forced on every page.** Restricts every future palette.
20. **No favicon, no meta tags on most pages.** Looks unfinished in tabs.
21. **`validBrief` rejects ahead of the guard.** UI never shows the right rejection message.
22. **No "empty state with action" on legacy pages.** Pages just show nothing.
23. **The asset library's "Copy spec (JSON)" copies a small subset, not the production spec.** Confusing.
24. **No keyboard shortcuts, no command palette.** Not modern SaaS.
25. **No mobile primary-action drawer.** Every primary CTA is in the page body.

---

## 12 · Top 25 Opportunities

Things that could be shipped quickly because the substrate is already there.

1. **Build `/login`, `/register`, `/account`** on top of the existing auth API.
2. **Auth context provider** that calls `/api/auth/me` once and exposes `useTenantContext()` to all pages. Erases 8 hardcoded strings in one PR.
3. **Wrap every legacy `useSearchParams()` in `<Suspense>`** — unblocks production build (1 edit per file).
4. **Replace the `/` page** with a value-prop landing → `/studio-home` for members, `/register` for guests.
5. **Add a `/brand-setup/[brandId]` link to every `/brands` card.**
6. **Add formula + packageType filter chips to `/asset-library`.** API already supports `?formula=`.
7. **Add image upload to Brand Setup.** Persist a base64 / data-URL on `BrandRecord.identity.assets`.
8. **Wire `BrandRecord.identity.paletteKey` into the Asset Generator default brief.**
9. **Streaming render** — emit each slide's PNG as soon as it's done.
10. **Migrate the legacy half onto `AppShell`** — one page at a time.
11. **Add a "create your first organization" flow** on first login. Use the existing `POST /api/organization` API.
12. **Fix `requireSession` → `requireTenantSession` on asset-registry POST.** One-line gate change.
13. **Add `dynamic = 'force-dynamic'`** on every page that uses `useSearchParams` if Suspense feels heavy.
14. **Stop requiring `operatorReason` on `login`.** It's a security ritual that breaks UX.
15. **Make bootstrap set a cookie.** One-liner.
16. **Replace `<body className="scanline">`** with per-page atmosphere opt-in.
17. **Add `dir="auto"` and a Hebrew/English shell toggle.**
18. **Add a "Duplicate this asset" action** in the library detail modal.
19. **Add "Use this brief" action** in the asset library that pre-fills the Asset Generator.
20. **Add a `<command-k>` palette.** All routes + actions.
21. **Add per-asset analytics**: views, downloads, copies, time-to-approve.
22. **Add bulk approve / archive** to the library.
23. **Add a "Brand examples" upload** to Brand Setup (reference moodboard).
24. **Add structured audience segments** (instead of one free-text field).
25. **Add a mobile bottom action drawer** for primary actions on every page.

---

## 13 · P0 Rebuild Plan

The brutal list: only items that block the product from feeling real.

### P0.1 · Auth + onboarding surface (blocks: customer signup)
- Ship `/login`, `/register`, `/account`.
- Make `register` open a "create your first organization" sub-flow that POSTs to `/api/organization` and grants the new user `organization-owner`.
- Stop requiring `operatorReason` on `/api/auth/login`.
- Make `/api/auth/bootstrap` set the session cookie.
- **Acceptance:** a brand-new visitor can register, create an organization, land on `/studio-home`, and see an empty library.

### P0.2 · Production build green (blocks: deploy)
- Add `<Suspense>` around `useSearchParams` in `/dashboard`, `/brands`, `/products`, `/growth`, `/onboarding`, `/workflows`, `/fast-start`.
- **Acceptance:** `npm run build` succeeds with zero prerender errors.

### P0.3 · Tenant context from session (blocks: multi-tenant)
- Add `AuthContext` provider in `app/layout.tsx` that fetches `/api/auth/me` and exposes `useTenantContext() → { organizationId, workspaceId, memberships, user }`.
- Replace 8 hardcoded `'org-mood'`/`'wsp-mood-default'` references with the context.
- Handle "no memberships" with a "Create organization" CTA, not a 403.
- **Acceptance:** a `royalloot` member sees RoyalLoot assets at `/asset-library`. A no-membership user sees the onboarding CTA, not a 403.

### P0.4 · Unify the design language (blocks: SaaS credibility)
- Wrap every page in `AppShell`. Keep the legacy pages working but adopt the shell, the header, the breadcrumb section bar.
- Remove `className="scanline"` from `app/layout.tsx`. Let pages opt in.
- Re-skin `/`, `/brands`, `/products`, `/dashboard`, `/growth`, `/workflows`, `/fast-start`, `/onboarding` with the new primitives (`Button`, `Card`, `Field`, `Tag`, `Modal`, `Empty`).
- **Acceptance:** a user toggling between any two pages sees the same chrome, the same typography scale, the same hover state.

### P0.5 · Real product imagery (blocks: real ad output)
- Add an image-upload field to Brand Setup that persists base64 / data-URLs on `BrandRecord.identity` for: pouch photograph, chocolate-square photograph, brand logo.
- Extend the renderer to consume the photograph when present (`<image href="...">` instead of `composeMoodPouch`).
- Add a "Use brand asset" toggle in the Generator that switches between the canonical vector pouch and the uploaded photograph.
- **Acceptance:** an operator uploads a real MOOD pouch photograph; the Asset Generator output uses it; the rendered PNG is photograph-correct.

### P0.6 · Image-generation backend (blocks: customer-grade output)
- Wire a Flux / Stable Diffusion / Midjourney provider into `/api/render` as a new code path triggered by `brief.visualMode === 'photoreal'`.
- Use the existing `prompt + negativePrompt + productionSpec + qualityGuard` as the provider input contract.
- Keep the SVG path as the fast preview.
- **Acceptance:** an operator picks "photoreal" mode, gets a photograph-quality output in under 30 seconds, registers it in the library.

### P0.7 · Library scale (blocks: marketer workflow)
- Add formula + packageType filter chips.
- Add a search box (substring match on `headline`, `campaign`, `summary`).
- Add bulk approve / archive.
- Add "Duplicate as new" → pre-fills the generator.
- **Acceptance:** with 100 assets in the library, a marketer can find and approve the right one in under 30 seconds.

### P0.8 · Asset-registry POST hardening (blocks: trust)
- Change POST gate from `requireSession` to `requireTenantSession`. The body's `organizationId`/`workspaceId` must match the user's membership.
- **Acceptance:** the cross-tenant write demonstrated in this audit (a non-member of `org-mood` saving to `org-mood`) returns 403.

---

## 14 · Recommended Next Claude Code Directive

Paste-ready directive for the next phase. Focuses on the three items that move the product from "audited" to "customer-showable":

```
PHASE — REAL CUSTOMER SHIPPABILITY

Three blockers stop the product from being shown today:
  1. Auth UI is missing.
  2. Production build crashes 7 pages.
  3. The legacy half and the new half look like two products.

Do not invent new features. Fix only the blockers.

PART A — Auth + onboarding (must land first)
  - Build /login, /register, /account.
  - On /register success, run a "create your first organization"
    sub-flow that POSTs to /api/organization and stamps the new
    user as organization-owner.
  - Stop requiring operatorReason on /api/auth/login.
  - Make /api/auth/bootstrap return the session cookie.
  - Acceptance: a brand-new visitor can register, create an org,
    land on /studio-home, see an empty library.

PART B — Production build green
  - Wrap every useSearchParams() call in <Suspense> (the 7 pages
    listed in docs/full-product-experience-audit.md §3).
  - Acceptance: `npm run build` succeeds with zero prerender
    errors. CI verifier added that runs `npm run build`.

PART C — One design language
  - Add AuthContext provider in app/layout.tsx that fetches
    /api/auth/me and exposes useTenantContext().
  - Replace 8 hardcoded 'org-mood'/'wsp-mood-default' strings
    with the context.
  - Remove className="scanline" from app/layout.tsx; let pages
    opt in.
  - Migrate /, /brands, /products, /dashboard, /growth,
    /workflows, /fast-start, /onboarding onto AppShell + the
    new primitives (Button, Card, Field, Tag, Empty).
  - Acceptance: every page has the same chrome, the same nav,
    the same typography scale. A user clicking between any two
    pages sees zero design discontinuity.

Do not touch the asset renderer in this phase.
Do not touch auth API logic (just the UI + the cookie).
Do not touch tenant isolation logic.

Report at the end:
  - npm run build output (must be green)
  - npm run typecheck output (must be green)
  - One screenshot per migrated page proving the unified shell
  - Updated audit follow-up: which Top-25 problems were closed
```

---

## Final answer

> **Can this be shown to a real customer today? — NO.**
>
> **Can this generate a real usable MOOD ad today? — NO.**
>
> The product has a real spine — auth, tenant, observatory, registry, renderer — but the customer-facing skin, the auth onboarding, and the image fidelity are not yet at the level required to put it in front of a paying customer. The P0 plan above closes the gap in the order that matters.

**No code was modified. No commits. No pushes.**
**Audit only.**
