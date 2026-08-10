# Migration prospectus — "mood — חדר הבקרה" (Base44) → this repo (native code)

**Goal:** rebuild the Base44 control-room app as first-class code in this repo so
the operator works from here, with full control, better performance, and no
platform limits — and so the LLM generation runs through **our keyless Cowork
bridge** instead of a paid vendor.

**Decision taken:** scaffold + this prospectus first; approve the plan before
building the bulk.

---

## 1 · What the app is (measured, not guessed)

A full **brand content-operations platform** for MOOD:

| Surface | Count | Notes |
|---|---|---|
| Data models (entities) | **60** · 1048 fields | full map in [`ENTITIES.md`](./ENTITIES.md) |
| Active screens | **~20** | (43 files, but many are tabs/legacy redirects — see §4) |
| Business-logic libs (`base44/shared/*.ts`) | **25** | already TypeScript — ports near 1:1 |
| Serverless functions | **~50** | thin wrappers over `shared/` (incl. ~15 test harnesses) |
| Scheduled workflows | **5** | Nightly, CalendarQueue, FounderPost, CompetitorScan, TrendBrain |

**The pipeline it runs:** Sources → Brand/Facts → Generate (hooks · carousels ·
stories · articles · campaigns · viral visuals) → Quality/Claims firewall →
Approvals → Ready → Publish to channels → Measure → Learn → Scale winners.

**Why it's very migratable:** the hard logic already lives in portable
`shared/*.ts` (`llmGeneration` 12KB · `claimsFirewall` 14KB · `decisionQuality`
19KB · `editorial` 22KB · `publishing` 13KB · `readinessGate` 11KB ·
`campaignFactory` 10KB · `experiments` 11KB · `automationPolicy` 8KB …).
Base44's SDK is only the data + auth + hosting shell around it.

---

## 2 · Target architecture in this repo

Same repo, same stack we already run (Next 14 · TS · Tailwind · our auth/tenancy):

| Base44 concept | → | Repo target |
|---|---|---|
| `@base44/sdk` entities (`Entity.list/filter/create/update`) | → | Supabase (Postgres) tables + a typed data-access layer `lib/cr/db/*` (one generated repo per entity, same method names → minimal page edits) |
| `base44/shared/*.ts` (business logic) | → | `lib/cr/*` — ported near 1:1 (already TS) |
| `base44/functions/*` (serverless) | → | `app/api/cr/*` route handlers (thin, call `lib/cr/*`) |
| `base44/workflows/*` (schedules) | → | scheduled runs (cron) hitting `app/api/cr/jobs/*` |
| React-Router pages (`src/pages/*.jsx`) | → | `app/(control-room)/*` App-Router routes (shadcn/ui already compatible — same Radix components) |
| Base44 auth + `User` | → | existing `lib/auth` + `lib/tenancy` (Admin/Manager/Viewer already exist) |
| **LLM in `llmGeneration.ts`** | → | **our `lib/mvpCoworkBridge` keyless path** (no key, no spend) — the vendor call becomes a Cowork task |
| Publishing / OAuth / channels | → | real integrations — **deferred to a late wave** (needs channel credentials) |
| Stripe (present in deps) | → | repo already defines plans (`lib/tenancy/billingHooks`, `mvpPlans`) — wire later |

Data-access shim strategy: generate `lib/cr/db/<Entity>.ts` exposing
`list/filter/get/create/update/remove` with the **same signatures** the pages
already call, so porting a page is mostly: swap the import, convert JSX→TSX,
drop into an App-Router file. This is what keeps the 20-screen port bounded.

---

## 3 · The 25 business-logic libs (the real value — port first)

`llmGeneration · claimsFirewall · decisionQuality · editorial · publishing ·
readinessGate · campaignFactory · experiments · automationPolicy ·
operationalSafety · recipes · exportCenter · measurement · customer360 ·
syncBrandProfile · approvalGate · syntheticClassifier · auditTrail · wizard ·
brandCenter · quickReview · sourceIntake · visualJob · variants · stuckApprovals`

These are the engines. Porting them (they're already TS, no Base44 SDK inside
the pure ones) gives us the product's brain before any screen is built.

---

## 4 · The ~20 active screens (from the real router)

`WorkCenter (/) · Pipeline (approvals·quality·publish·distribution tabs) ·
ContentHub (blog·seo tabs) · Performance (growth·market tabs) · PublishMe ·
QuickReview · Calendar · BrandCenter · BrandFacts · Recipes · ExportCenter ·
SourceIntake · Variants · CampaignPackages · CampaignBuilder · ViralStudio ·
FinalAssets(+detail) · Library (media·products) · MoodQuiz · SystemChecks ·
Settings · Login/Register/Forgot/Reset`

(Blog, SEO, Growth, MarketIntel, Approvals, Quality, Publish, Distribution,
Studio, Campaign, Media, Products are **tabs** inside the consolidated pages
above — not separate builds.)

---

## 5 · Phased plan (each wave ends green: typecheck · build · verifiers)

- **Wave A — skeleton (this approval):** Supabase schema for all 60 entities +
  the generated `lib/cr/db/*` data-access layer + app shell/nav + route stubs
  for the 20 screens + auth wired. Nothing functional yet — the frame stands.
- **Wave B — the brain:** port the 25 `shared/*.ts` libs to `lib/cr/*` + the
  core generate functions as `app/api/cr/*`, with **LLM → Cowork bridge**.
- **Wave C — the core loop (screens):** SourceIntake → Create/PublishMe →
  QuickReview/Pipeline(approvals+quality) → FinalAssets. The daily driver.
- **Wave D — intelligence:** BrandCenter/Facts · Recipes · Campaigns ·
  ViralStudio · Performance/Measurement · Experiments · Calendar.
- **Wave E — automation & integrations:** the 5 workflows as cron; publishing/
  OAuth to real channels; Stripe. (Needs credentials — your input.)

Data migration of existing Base44 **records** (not just schema) is a separate,
optional step in Wave A once the schema stands — export via the Base44 MCP,
import into Supabase.

---

## 6 · Honest risks / unknowns

- **Publishing integrations** (Instagram/etc. OAuth + `publishToConnection`)
  need real channel credentials — that's why they're last.
- **LLM parity:** routing generation through the Cowork bridge means premium
  output is fulfilled as Cowork tasks (no spend) rather than instant vendor
  calls — matches your "no key, no waste" directive.
- **Scale:** ~20 screens + 25 libs + 60 tables is multi-session. Each wave is
  independently shippable and green, so it's never all-or-nothing.
- **Existing data:** we migrate schema first; moving live records is opt-in.

---

## 7 · What I'll scaffold on approval (Wave A, concretely)

1. `supabase/cr-schema.sql` — 60 tables, tenant-scoped, indexed.
2. `lib/cr/db/*` — generated typed repositories (Base44-compatible method names).
3. `app/(control-room)/layout.tsx` + nav + route stubs for the 20 screens.
4. Auth/tenancy wired to the existing providers.
5. Green build + a `verify-cr-schema` check.

**Everything stays on branch `claude/mood-creative-os-v1-i4Mfv`, additive to the
existing app — the current MVP + Cowork bridge keep working.**
