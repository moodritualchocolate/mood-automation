# Final Product Readiness Audit · Operator Walkthrough

**Branch:** `claude/mood-creative-os-v1-i4Mfv`
**HEAD:** `d525df8`
**Method:** Fresh dev server (`npm run dev`) backed by an **empty** `MOOD_MEMORY_DIR=/tmp/mood-audit-fresh` so no seeded data biased the experience. Persona: *Sarah Chen, founder of "Aria" — a Hebrew-first single-origin dark chocolate brand.* Live curl flow simulating a real browser. 15 assets actually rendered to PNG and visually examined (delivered to the user above).
**Date:** 2026-06-04

**Scope:** observation only. No code modified. No commits. No pushes. No solutions proposed.

---

## Phase 1 — Operator Walkthrough · every click documented

### Step 1 · Land on `/` (cold, guest)

**HTTP 200 · 5,813 bytes**

The initial HTML body returned by the server contains a single `<main class="min-h-[100dvh] bg-[#050505]">` with **no visible content**. The page is fully client-rendered: the `useAuth()` hook fires, decides the user is a guest, and only then renders the hero, the highlights, and the login/register CTAs.

- On fast localhost this is invisible. **On a 3G mobile this is 800 ms of black screen.**
- No skeleton, no eyebrow, no logo. Just a black void until the JS bundle (≈100 KB) executes.
- There is no `<noscript>` fallback. A user with JS disabled or a search-engine crawler sees nothing.

Once hydrated, the landing reads correctly: a hero ("A quiet creative OS for serious chocolate brands"), three highlight cards (Compose · Review · Ship), a "what's inside" bullet list, two CTAs ("Create your workspace →" + "Sign in").

**Confusion:** "Sarah" reads the hero, then sees two equally-weighted CTAs. Both go to product. Neither says what happens to her email or whether she'll be charged. There is no pricing, no demo button, no screenshot, no testimonial.

### Step 2 · Click "Get started" → `/register`

**HTTP 200 · 9,816 bytes**

A two-card flow appears:

1. **Step 1 of 2 — "Create your account"** · email · display name · password (≥ 12 chars).
2. **Step 2 of 2 — "Name your workspace"** · organization name · workspace name (defaulted to "Default Workspace").

**Click count:** 6 keystrokes for email · ~7 for password · 1 click "Continue" · 5 keystrokes for org name · 1 click "Enter Studio." 4 fields, two screens. **Reasonable.**

**Confusion:** the second step appears *after* the user has already submitted their email + password. If the operator closes the browser between step 1 and 2 (e.g., a 2FA email arrives), they get logged in but with zero memberships — they hit `/account?onboard=1` next visit. The recovery exists but is not signposted in any email or in-product banner. The operator just sees a different screen on next login with no explanation of what happened.

### Step 3 · Account creation → POST `/api/auth/register`

**HTTP 200.** Sets cookie. Returns:

```json
{ "ok": true, "user": { "userId": "user-mpz91amt-1", ... },
  "advisoryNotice": "Operator-supervised — user registered. The route NEVER grants a membership in any organization. Human remains final authority." }
```

**Confusion:** the `advisoryNotice` string is **leaked to no UI** — but it carries the safety contract. Internally we know that registration grants no membership. Externally, the user has no way to know that. The UI just transitions to step 2.

### Step 4 · First workspace → POST `/api/auth/create-first-workspace`

**HTTP 200.** Returns `organizationId: org-mpz91auu-1 · workspaceId: wsp-mpz91auu-1 · membershipId: mem-mpz91auu-1`. Auto-redirects to `/studio-home`.

**Confusion:** the new operator has no idea what `org-mpz91auu-1` means or where to see it. No "Welcome, your workspace is ready" toast. No "Tour the studio" overlay. No "Add your first brand" coachmark. The redirect just happens and dumps them onto the studio home.

### Step 5 · `/studio-home`

**HTTP 200 · 16,293 bytes** (initial HTML contains only loading skeletons — `pulse` class only).

After hydration, the studio home displays:
- Page head: "Studio · A quiet room for serious work."
- 4 counters: Total assets (0) · Pending (0) · Approved (0) · Brands (0). Each counter is a Card. The "0" is a 32-pixel editorial number with no accompanying call-to-action — it just sits there.
- 3 action cards: Compose · Review · Brand setup.
- "Latest from the library" — empty state: "The library is silent."
- "Voices the system carries" — empty state: "Set up the first brand."

**Confusion:** Sarah's first encounter with the product is a screen that says "0" four times. The empty states are tasteful but they do not guide her. The eyebrow "MOOD Creative OS" in the page head is the brand of the **vendor**, not her brand. There is no welcome message, no "Hi Sarah", no "Aria is your first project" copy.

**Ugly:** the 4 counter cards have inconsistent visual weight. Three are `Total / Pending / Approved` and the fourth is `Brands`. Pending is the only one with a status tag. The grid reads like a debug panel.

### Step 6 · Click "Brands" in the nav → `/brands`

**HTTP 200 · 10,745 bytes.**

Empty state: "Start with your first brand." Big "+ New brand" button. After hydration this is clean. Before hydration: same black flash.

### Step 7 · Click "+ New brand"

The page reveals a form. Required fields: brand name, operator reason. Optional: description. The **"Operator reason" field is exposed to the end user.** Default text: `create brand`. The operator has no idea what this field is for. The audit copy says "Required when saving." Sarah types "first brand" because she has to type something.

**Confusion:** "Operator reason" is jargon from the internal observability contract. It should be hidden in the UI or renamed "Reason for audit log (optional)" with a sensible auto-fill. Today it is **a required text field with no explanation**.

Submit. The brand appears in the list as a card.

### Step 8 · Click the brand card → `/brand-setup/[brandId]`

The 4-step wizard (Voice · Audience · Visual · Assets · Channels — actually 5 steps, the page head says "4 steps" in the audit doc but the source has 5). The pager allows free navigation, not gated.

- **Voice:** positioning (textarea), slogan (Hebrew text), voice adjectives, values. Clean.
- **Audience:** audience textarea, brand language select. Clean.
- **Visual:** 5 palette swatches (cocoa · amber · ember · ivory · ink), signature mark. Clean.
- **Assets:** dashed-border banner that says **"Upload integration: coming next"**. Operator can register asset metadata (kind + label + description) but cannot upload an image. The UI is honest about this.
- **Channels:** channels text, default CTA, default visual mode, operator reason.

**Confusion:** there are TWO "operator reason" fields in the flow now — one on step 5 of brand setup, one on every brand-list create form. The operator has been asked the same opaque question 3 times since signing up.

**Ugly:** the live preview panel on the right does NOT show the brand's palette or signature visually. It is a text-only summary card. A brand-identity wizard with no visual preview of the brand identity is a strange experience.

### Step 9 · Save identity → `/api/brand` POST `update-identity`

Works. 200. Brand record updated. No success toast — the save button just stops being busy.

### Step 10 · Click "Products" → `/products`

Empty state: "Create a brand first" — but Sarah just created a brand. The empty state is mis-keyed: it shows only when there are no brands, but here there's no product yet. The "+ New product" button does work after clicking it.

Form: brand select (only "Aria"), product name, formula select, operator reason, description. Submit. Product appears.

**Confusion:** "Why does formula matter to a chocolate product?" — there is no help text explaining that formula drives palette and label conventions. The brand wizard already captured a default palette key. The product asks for a formula. The relationship is opaque.

### Step 11 · Click "Generator" → `/asset-generator`

**HTTP 200 · 24,827 bytes.** Largest page in the product. After hydration: the brief editor on the left, preview on the right.

The brief editor is 7 sections numbered 1–7:
1. Format (banner · post · carousel)
2. Visual mode (4 options)
3. Formula · product · palette (4 controls)
4. Hebrew copy (headline · subline · CTA · signature)
5. Audience · emotion
6. Carousel slides (visible only in carousel mode)
7. Save metadata (campaign label · operator reason)

The default brief is **pre-filled with MOOD copy** ("בוקר אחד. בלי הצגות. · אנרגיה מקקאו שלא צריך להתנצל. · התחילו את הבוקר עם MOOD"). For Sarah, this is wrong:
- Her brand is Aria, not MOOD
- The signature defaults to "MOOD" (until she picks her brand)
- After she picks her Aria brand, identity defaults apply — but the existing headline/subline/CTA are NOT replaced (they're operator-touched defaults)

**Confusion:** the brand picker is in section 3 (third from top), but the brand identity influences sections 2 (visual mode), 3 (palette), 4 (CTA), and signatures. The ordering is wrong. Sarah picks the format first, then the visual mode, then has to scroll down to discover the brand picker, then has to go BACK and re-think her copy because the defaults changed.

**Ugly:** the "Brand context · applied" card only appears AFTER the brand is picked. It is a status reveal, not a guiding affordance.

### Step 12 · Click "Render preview"

**HTTP 200 · POST `/api/render`.** The server composes SVG, rasterizes via Resvg (≈600 ms), returns the PNG. The page shows the preview, the prompt, the negative prompt, the spec JSON, the quality-guard result.

**Click count for first render:** ~12 form interactions + 1 render click. 13 actions to get a first preview. Comparable to Canva. Slower than Figma templates.

**Confusion:** the preview appears below the prompt section in the right column. On a tablet (768 px) the preview is below the brief. On a phone (375 px) the preview is at the very bottom of the page — the user has to scroll past 7 sections to see what they just made.

### Step 13 · Click "Save to Library"

Works. Asset registered with `pending` status. Success state: a small Card appears with "Asset registered with status pending" and a link "Open Library →." No celebratory animation, no thumbnail of what was saved.

### Step 14 · Navigate to `/asset-library`

The library shows the just-saved asset. Filters: status (5 chips) and formula (5 chips), plus a search box. Card thumbnail uses the preview data-URL.

**Confusion:** the status chips' counts come from `/api/asset-registry`'s `counts` field. They show all-statuses count, but when filtered by status the count stays the same (because counts are global, not filtered). A user clicking "Pending" sees the right cards but the "Pending: 1" badge on the chip is misleading once they've filtered.

### Step 15 · Click the card → detail modal

Modal opens. Shows the preview at large size, the Hebrew copy panel, the operator reason text field, the approval history. Action buttons at the bottom: Close · Reject · Archive · Approve.

**Confusion:** "Operator reason" is required to approve. The operator has been asked for one 4 times now (create brand · save brand identity · save asset · approve asset). The repetition is grating.

### Step 16 · Approve

**HTTP 200.** Status flips to `approved`. The button is now disabled. Modal stays open. No toast.

### Step 17 · Export

The user clicks "Download PNG." Browser downloads the file. **Works.**

**Click count for the full first-asset flow** (sign in → render → approve → export): roughly **42 clicks/keystrokes** including all 4 operator-reason fields. With CSR loading delays factored in, **realistic time-to-first-approved-asset is 3–5 minutes**, of which ~30 seconds is rendering and ~2 minutes is filling forms and figuring out what each field means.

---

## Phase 2 — Per-Page Scorecard (1–10)

Scoring methodology: 1 = broken / internal-tool · 4 = early prototype · 6 = passable v1 · 8 = peer of Linear/Notion · 10 = peer of Framer/Linear at their best.

| Page | Visual | Mobile | UX | Trust | Paying-customer trust? | Avg | Notes |
|---|---|---|---|---|---|---|---|
| **Landing `/`** | 6 | 6 | 5 | 4 | **4** | 5.0 | Hero is OK. No screenshots, no pricing, no logos, no testimonials, no demo. Black flash on cold load. Looks like a side-project landing, not a SaaS. |
| **Login `/login`** | 6 | 6 | 7 | 6 | **6** | 6.2 | Single form on a centered card. Clean. No social login. No "forgot password." No 2FA. No SSO. Adequate for alpha. |
| **Register `/register`** | 6 | 6 | 6 | 5 | **5** | 5.6 | Two-step flow is clear but cold. No coachmark explaining what an "organization" is. No T&C / privacy link. No email verification mention. |
| **Account `/account`** | 6 | 6 | 5 | 5 | **5** | 5.4 | Profile + active workspace + org switcher. Functional. "Active workspace: org-mpz91auu-1" is a slug not a name — users see internal IDs. Sign-out is the only action. |
| **Dashboard `/dashboard`** | 5 | 6 | 4 | 5 | **4** | 4.8 | Reads `/api/dashboard` and renders 4 metric cards. The data is observatory-flavoured ("pending approvals", "longitudinal health"). For a brand-new account, all metrics are 0 — looks like a placeholder. |
| **Studio Home `/studio-home`** | 7 | 7 | 5 | 6 | **6** | 6.2 | Best legacy-vs-new bridge surface. Counter row · action cards · recent · brands. Empty-state copy is tasteful. Lacks a clear "first session" CTA. |
| **Brand Setup `/brand-setup/[brandId]`** | 6 | 6 | 5 | 6 | **5** | 5.6 | 5-step pager · sticky preview panel. Preview is text-only — no visual identity rendered. Assets step is honest about upload not being wired but feels half-finished. |
| **Generator `/asset-generator`** | 7 | 5 | 5 | 6 | **5** | 5.6 | The most ambitious page. 7-section brief editor + preview + outputs. Section ordering is confused (brand picker is buried). Mobile pushes the preview to the bottom. |
| **Library `/asset-library`** | 7 | 7 | 6 | 6 | **6** | 6.4 | Filter chips + search + grid + detail modal. Solid. Counts are global-not-filtered (misleading). No bulk actions. No version history. |
| **Brands `/brands`** | 7 | 7 | 6 | 6 | **6** | 6.4 | Re-skinned on AppShell. Each card links to brand-setup. Clean empty state. The "operator reason" field on the create form is jargon. |
| **Products `/products`** | 6 | 7 | 5 | 6 | **5** | 5.8 | Same shape as brands. Brand-select dropdown lists only the brand id text when no brands exist. |
| **Growth `/growth`** | 3 | 6 | 4 | 3 | **3** | 3.8 | **Still legacy.** Uses `scanline` body texture + 17 old design tokens. Reads like a 2015 editorial blog. Does not match the rest of the product. |
| **Workflows `/workflows`** | 3 | 6 | 4 | 3 | **3** | 3.8 | **Still legacy.** Same problem as `/growth`. Pre-AppShell. |
| **Runtime `/runtime`** | 5 | 4 | 3 | 4 | **2** | 3.6 | Internal observability surface (cognitive weather). Beautiful for what it is, **not customer-facing**. A paying customer who finds this thinks "is this for me? what am I supposed to do here?" |

**Average across 14 pages: 5.2 / 10.** Strongest: Library, Brands (6.4). Weakest: Runtime (3.6), Growth (3.8), Workflows (3.8).

**"Paying-customer trust" average: 4.5 / 10.** That is the killer number. Below 5 means the median page in the product does NOT feel like something a customer would type their credit card into.

---

## Phase 3 — Old Design System Audit

### Pages still on the legacy design system

Hardcoded by line: occurrences of `font-editorial` / `text-bone-*` / `bg-bone-*` / `COLORS.` / `SPACING.` / `className="scanline"` in `page.tsx`.

| Page | Legacy tokens | Uses AppShell? | Uses `scanline` body class? | Verdict |
|---|---|---|---|---|
| `/studio` (legacy V1) | **1,217 hits** in an 11,331-line file | No | Yes | **Legacy. Untouched.** |
| `/onboarding` | 20 hits | No | Yes | **Legacy. Build-fixed only.** |
| `/growth` | 17 hits | No | Yes | **Legacy. Build-fixed only.** |
| `/workflows` | 18 hits | No | Yes | **Legacy. Build-fixed only.** |
| `/runtime` | 7 hits | No | No | **Legacy partial.** Internal observatory. |

Five pages out of 18 user-facing pages are still on the old design system. **27 %.** For a "modern SaaS" claim, that is a coin flip on any given click.

### Pages that read as an internal tool

- `/runtime` (literal observability dashboard with "cognitive weather" copy)
- `/dashboard` (4 metric cards reading "longitudinal health 7.2" with no context for a non-engineer)
- `/workflows` (workflow approvals queue — feels like JIRA for one user)
- `/growth` (8 modules · Goals · Funnels · Campaigns · Channels · Assets · Performance · Tasks · Approvals — feels like Asana for one user)
- `/studio` (the V1 banner engine — formula picker + brutality slider — reads as a research prototype)

### Pages that would make a customer think "this is unfinished"

- `/runtime` — "what is cognitive weather"
- `/dashboard` — "why is everything zero"
- `/onboarding` — leftover wizard from V1, unconnected to anything
- `/growth` — 8 named modules that don't drill into anything
- The "operator reason" field everywhere
- Internal IDs surfaced as workspace names (`org-mpz91auu-1`)
- "Brand Setup → Assets" tab with "upload integration: coming next" banner
- The legacy `/studio` reachable from the URL bar but never linked
- The brand identity preview that doesn't preview the brand visually

---

## Phase 4 — Generated Output Audit · marketing-agency judgment

I rendered **5 banners + 5 posts + 5 carousels (with 17 carousel slides total)** as a real operator, using the live system. All 15 base assets + 17 carousel slides were delivered to the user above as PNGs.

### Banners (1200 × 628)

| # | Brief | Verdict | Why |
|---|---|---|---|
| 1 | ENERGY · product-hero · pouch | **OK to publish** | Clean editorial banner. Pouch reads as a real product. Hebrew typography works. **One bug:** the pouch hard-codes "MOOD" — Sarah's brand is "Aria." The pouch is wrong-branded. |
| 2 | FOCUS · product-and-human · pouch | **NO** | Pouch is washed out, label barely readable. Promised "hand silhouette holding the pouch" does not visually wrap — looks like two unrelated shapes overlapping. |
| 3 | RELAX · human-moment | **NO** | Promised "still-life scene (window light + table edge)" is too faint to read. The banner looks indistinguishable from a text-only banner. Marketer would ask "what mode was this?" |
| 4 | SLEEP · text-only-editorial | **OK to publish** | Clean. Editorial restraint serves SLEEP. This is the strongest text-only output. |
| 5 | ENERGY · product-and-human · chocolate-square | **NO** | Three bugs: (a) Hebrew period flips to the START of the line — "יד אחת. פיסה אחת." renders as ".יד אחת. פיסה אחת"; (b) chocolate square is microscopic, looks accidental; (c) no human figure visible at all. |

**Banner verdict: 2 of 5 publishable. 40 %.**

### Posts (1080 × 1080 Instagram)

| # | Brief | Verdict | Why |
|---|---|---|---|
| 1 | FOCUS · human-moment | **NO** | Gradient + text + tiny eyebrow. Window-light effect invisible. No scene props. A marketer would not believe this was a "human moment" composition. |
| 2 | ENERGY · product-hero · pouch | **OK** | Clean. Pouch reads. Wrong brand on label ("MOOD" not "Aria"). |
| 3 | RELAX · product-hero · chocolate-square | **NO** | Tiny chocolate square. Headline says "רגע אחד בלבד" but visual is hostile to the message — square looks like a postage stamp. |
| 4 | SLEEP · text-only-editorial | **OK** | Quiet, clean, on-brand for SLEEP. |
| 5 | FOCUS · product-and-human · pouch | **NO** | The pouch's bottom gusset is clipped by the canvas edge. The hand silhouette is barely visible. Looks broken. |

**Post verdict: 2 of 5 publishable. 40 %.**

### Carousels (1080 × 1080 slides)

| # | Brief | Slides | Verdict | Why |
|---|---|---|---|---|
| 1 | RELAX · 3 slides · mixed modes | 3 | **NO** | Slide 1 ("מסע לרגע השקט") has the headline overflowing the canvas — the leading character "מ" is clipped, and the headline crosses over the pouch illustration. Slide 2 is OK (text-only). Slide 3 (human-moment) shows no scene, just the formula eyebrow. |
| 2 | ENERGY · 3 slides | 3 | **OK** (slide 1 + slide 3 publishable; slide 2 weak) | Cover slide reads as a real product hero. Closing slide pairs pouch with a CTA. The middle slide (text-only) is fine but unremarkable. |
| 3 | FOCUS · 3 slides | 3 | **NO** | Cover has microscopic chocolate square. Middle slide is text-only and works. Closing slide ("זה עובד") in human-moment mode shows no human element. Carousel reads as three different aesthetics glued together. |
| 4 | SLEEP · 4 slides · text-only throughout | 4 | **OK** | Consistent quiet editorial across all 4 slides. The SLEEP palette saves this carousel. |
| 5 | RELAX · 4 slides | 4 | **NO** | Slide 1 has the long-headline overflow bug — text crosses through the product illustration. Slide 2 has the tiny-chocolate-square problem again. The carousel is structurally inconsistent. |

**Carousel verdict: 2 of 5 publishable. 40 %.**

### Aggregate output audit

| Type | Total tried | Publishable as a real Aria asset today | Rate |
|---|---|---|---|
| Banner | 5 | 2 | 40 % |
| Post | 5 | 2 | 40 % |
| Carousel | 5 | 2 | 40 % |
| **Total** | **15** | **6** | **40 %** |

> **Would MOOD/Aria actually publish them? NO — for the majority.**

The 40 % that pass are **either text-only-editorial OR clean product-hero with no embellishment**. The system is currently better at "quiet editorial card" than at "product hero with human moment." Anything more ambitious than text-on-gradient surfaces structural bugs (Hebrew overflow, punctuation flipping, missing scene props, wrong-branded pouch, clipped composition).

### Concrete production-blocking bugs surfaced by this run

1. **Pouch label says MOOD regardless of brand.** `composeMoodPouch()` hard-codes the "MOOD" wordmark + the formula name on the cream label band. A Sarah-from-Aria asset is rendered with MOOD's logo on the product. Brand-incorrect output.
2. **Hebrew long headlines overflow the right edge.** Carousel 1 + Carousel 5 cover slides clipped. No text-measurement → no wrap → no auto-resize.
3. **Hebrew punctuation flips to wrong end.** Banner 5: "יד אחת. פיסה אחת." rendered as ".יד אחת. פיסה אחת". Period jumped to leading position. RTL bidi handling is incomplete.
4. **Promised "human moment" scene is invisible.** Banner 3 + Post 1 + several carousel slides — the still-life scene (window-light radial gradient at 0.22 opacity + table-edge hairline) does not read as a scene. Markets as a feature, ships as a gradient.
5. **Pouch clips at canvas edges in square formats.** Post 5 — pouch gusset cut off at bottom. Composition logic uses a fixed scale, no boundary check.
6. **Chocolate-square solo composition is too small.** Multiple posts and carousels — chocolate square is ~10 % of the canvas. Should be a hero.
7. **No alignment between brand eyebrow and product eyebrow.** Banner 1: top-left says "ENERGY" (the formula) and top-right says "ARIA" (the brand signature). Two competing identifiers in the same corner band. A marketer asks "what is this — Aria branded ENERGY?"
8. **Product-and-human mode shows neither convincingly.** The hand silhouette is too abstract to read as a hand. The pouch + hand z-order produces overlap, not grip.

---

## Phase 5 — Top 50 Problems · sorted by impact

Each item is a single blocker. No solutions. Just the gap between today and "real SaaS." Sorted by **impact on a paying customer's first 10 minutes**.

### Tier 1 — Product-killing (1–10)

1. **The generated assets are vector approximations, not photographs.** A marketer cannot publish vector pouches to Instagram and expect engagement.
2. **The pouch in every render says "MOOD" — regardless of the brand the operator belongs to.** Brand-incorrect output. Aria's pouch should say "Aria," not "MOOD."
3. **Hebrew long headlines overflow the canvas right edge in carousel cover slides.** Asset is unusable when the first word is missing.
4. **Hebrew punctuation positioning is wrong — periods flip to the start of the line.** Visible in any sentence ending in `.` followed by another sentence.
5. **"Human moment" mode renders no visible human element.** Promised scene is invisible at production opacity. Markets a feature it doesn't deliver.
6. **Product imagery (pouch + chocolate square) does not accept an uploaded photograph.** The brand-setup "Assets" step is metadata-only. Operator cannot replace the vector with a real photo.
7. **No image-generation backend.** What the system actually produces is editorial SVG. There is no Flux / SD / Midjourney connector — the prompt/spec is built but not consumed.
8. **No pricing on the landing.** A customer cannot evaluate whether to register.
9. **No screenshots or examples on the landing.** A customer registers blind.
10. **No legal copy on the landing or in register.** No T&C, no privacy policy, no GDPR notice. A serious buyer cannot legally use this in production.

### Tier 2 — First-session-killing (11–25)

11. **`/runtime` is reachable and looks like a research dashboard.** A customer clicking around the URL bar will find it and think they bought research software.
12. **`/studio` (legacy V1) is reachable and looks like 2015.** Same problem. 11k-line component frozen from an earlier era.
13. **`/growth` and `/workflows` use the old design tokens + the `scanline` body texture.** Visual whiplash inside the same product.
14. **`/onboarding` is the old generic 8-step wizard.** Not the new register flow. Operators who find it are confused about which onboarding is real.
15. **No coachmarks, no product tour, no "your first asset" overlay.** A new user lands on `/studio-home` and sees four zeros.
16. **Internal IDs surfaced as workspace identifiers in `/account`** (`org-mpz91auu-1` etc.). Users see opaque slugs, not their org name.
17. **"Operator reason" field is exposed to end users on at least 4 surfaces.** It is internal jargon. Customers don't know what to type.
18. **No success toast / no confirmation after any save.** Save buttons just stop spinning.
19. **No welcome message after register.** No "Hi Sarah, here's your workspace."
20. **No email verification.** Anyone can register with any email — including typos.
21. **No password reset flow.** Locked-out users have no recourse.
22. **No 2FA / SSO.** Anyone with a stolen password is in.
23. **Black flash on every page on cold load** — landing has no SSR, just a hydration placeholder.
24. **No favicon.** Browser tab shows default Next.js Vercel icon.
25. **No meta-tags / Open Graph on the landing.** Sharing the URL produces a blank preview.

### Tier 3 — Trust-killing (26–35)

26. **Generator's "Brand context · applied" card appears AFTER the brand is picked, not before.** It is a status reveal, not a guiding affordance.
27. **Brand identity defaults don't actually replace operator-touched fields.** Pick a brand AFTER typing a headline → headline stays MOOD's default. Surprising.
28. **The brand-setup live preview is text-only.** A brand wizard with no visual preview of the brand identity feels half-shipped.
29. **Library "Pending: N" count badge is global, not filtered.** Misleading once filters apply.
30. **No bulk actions in the library** (approve all · archive all · download all).
31. **No version history per asset.** Cannot answer "what changed from v1 to v2."
32. **No "duplicate as template"** — every asset has to be composed from scratch.
33. **The brand-asset placeholder copy ("upload integration: coming next") is honest but visible to customers.** A paying customer should not see roadmap copy in the product.
34. **Asset library "Copy spec (JSON)" copies a small subset, not the full production spec returned by `/api/render`.** Inconsistent with what the generator hands the operator.
35. **No team / collaboration.** One user, one workspace. No invite flow surfaced in the UI even though the API supports membership.

### Tier 4 — Polish-killing (36–50)

36. **Mobile generator pushes preview to the bottom.** Operator scrolls past 7 form sections to see what they just made.
37. **No keyboard shortcuts. No `cmd+k` command palette.**
38. **No autosave anywhere.** A browser refresh on the generator loses everything.
39. **No undo on approve/reject** — operator decisions are committed instantly.
40. **No search across brands / products** — only in the library.
41. **Status filter chips' counts only show non-"all" counts.** "All" chip has no count.
42. **No filtering by brand in the library.** Operator with 5 brands sees one mixed grid.
43. **No filtering by date / by operator.**
44. **No empty-state illustrations** — just text + buttons.
45. **No loading skeleton shapes that match the cards they replace.** Generic pulse blocks.
46. **No optimistic UI on approve / reject.** Button spins, modal stays open, status updates after round-trip.
47. **No `prefers-reduced-motion` handling beyond CSS** — JS-driven animations don't check.
48. **No accessibility audit** — focus rings rely on browser default; no `aria-live` on async results; no keyboard trap in modals.
49. **No internationalization shell** — the chrome is English-only even when the brand language is Hebrew.
50. **No analytics on operator behavior** — the system cannot tell which assets are downloaded vs. only previewed.

---

## Summary

| Question | Answer |
|---|---|
| Can a real customer complete the journey from register → approve their first asset? | **Yes** — 42 clicks/keystrokes, ~3-5 minutes. |
| Does that asset feel like a real Aria marketing creative? | **No** — 40 % publishable rate. Pouch is mis-branded MOOD. Long Hebrew overflows. |
| Does the product feel like a 2026 SaaS to a paying customer? | **No** — average page score 5.2 / 10, paying-customer-trust 4.5 / 10. |
| What is the biggest single blocker? | **The pouch hard-codes the MOOD wordmark on every render.** Every asset for every brand is brand-incorrect from the moment the pixel hits the canvas. |
| Is anything actively *broken*? | **The build is green and the journey completes.** The "broken" parts are rendering quality and brand-correctness, not infrastructure. |

No code modified. No commits. No pushes. Audit only.
