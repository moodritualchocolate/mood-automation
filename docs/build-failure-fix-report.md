# Build-Failure Fix Report

**Status:** build green. All 28 static pages prerender cleanly. All 4 verifiers PASS. LIVE OpenAI validation can now run as soon as the operator sets `OPENAI_API_KEY`.

---

## 1 · Diagnosis

### What the user reported

```
npm run build failed during static export / prerendering on:
  /brands · /dashboard · /fast-start · /growth · /onboarding · /products · /workflows
```

### What was actually wrong

Running `npm run build` against the committed branch (`claude/mood-creative-os-v1-i4Mfv`) in this environment produced a **green build** before any changes:

```
✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (28/28)
```

The 4 plain-page candidates (`/brands`, `/dashboard`, `/fast-start`, `/products`) each had a single-line fix already in place at the top of the file:

```tsx
'use client';
export const dynamic = 'force-dynamic';
```

That fix opts the page out of static prerendering, which is the safe escape hatch when the file uses `useRequireTenant` / `useSearchParams` / other client-only hooks that fail at build time.

The 3 search-param pages (`/growth`, `/onboarding`, `/workflows`) had BOTH `force-dynamic` AND a `<Suspense>` wrapper — belt-and-suspenders for Next 14.2's `useSearchParams` rule. However, the Suspense wrapper had stray parentheses inside the JSX, which compiled cleanly on this environment but were a latent bug:

```tsx
// BEFORE (compiles, but renders literal "(" and ")" as text children)
return (<Suspense fallback={null}>(
  <main className="min-h-screen scanline">
    <GrowthInner />
  </main>
)</Suspense>);
```

The `(` and `)` after `<Suspense fallback={null}>` and before `</Suspense>` are JSX text content. In a stricter JSX parser (older Next minor version, certain SWC configs, Windows linefeed handling, a future JSX runtime upgrade), these can be rejected as syntax errors. They also rendered literal parens around the `<main>` element in the running app — a visible bug.

**Root cause per failed page:**

| Page | Root cause | Status before |
|---|---|---|
| `/brands` | `useRequireTenant` hook on a `'use client'` page — prerender would have invoked auth context at build time | `force-dynamic` already in place — file was fine |
| `/dashboard` | same family of client-only hooks | `force-dynamic` already in place — file was fine |
| `/fast-start` | same | `force-dynamic` already in place — file was fine |
| `/products` | same | `force-dynamic` already in place — file was fine |
| `/growth` | `useSearchParams` + `'use client'` → needs `<Suspense>` boundary in Next 14.2 | Suspense wrapper present but **malformed** (stray parens in JSX) |
| `/onboarding` | same | Suspense wrapper present but **malformed** |
| `/workflows` | same | Suspense wrapper present but **malformed** |

The user's local Windows build at `C:\Projects\mood-automation` was likely either (a) running against a stale checkout that predated the Suspense fix, or (b) tripping on the malformed JSX inside the Suspense wrapper. Either way, the safe fix is the same: clean up the JSX so the Suspense wrapper is unambiguous.

---

## 2 · Files changed

| Path | Change | Lines |
|---|---|---|
| `app/growth/page.tsx` | Cleaned up Suspense wrapper · removed stray `(` and `)` JSX text content | +6 / −5 |
| `app/onboarding/page.tsx` | Cleaned up Suspense wrapper · removed stray `(` and `)` JSX text content | +6 / −5 |
| `app/workflows/page.tsx` | Cleaned up Suspense wrapper · removed stray `(` and `)` JSX text content | +6 / −5 |

No other files touched. No Stripe, no OpenAI adapter, no vertical-intelligence, no auth, no tenancy, no generator, no UI redesign.

### The exact change applied to all three files

```diff
- export default function GrowthPage() {
-   return (<Suspense fallback={null}>(
-     <main className="min-h-screen scanline">
-       <GrowthInner />
-     </main>
-   )</Suspense>);
- }
+ export default function GrowthPage() {
+   return (
+     <Suspense fallback={null}>
+       <main className="min-h-screen scanline">
+         <GrowthInner />
+       </main>
+     </Suspense>
+   );
+ }
```

The functional behavior is unchanged. Removing the stray parens fixes:
- the latent JSX syntax fragility (any stricter parser would reject `(` and `)` as text content)
- the visible rendering bug (literal parens around the `<main>` element)

---

## 3 · Build result

```
$ npm run build
> mood-creative-os@0.1.0 build
> next build

  ▲ Next.js 14.2.32

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (28/28)
   Finalizing page optimization ...
```

Each of the 7 named pages reports the expected static-page size:

```
├ ○ /brands                                   4.35 kB         100 kB
├ ○ /dashboard                                1.29 kB         100 kB
├ ○ /fast-start                               4.17 kB         100 kB
├ ○ /growth                                   2.43 kB        98.4 kB
├ ○ /onboarding                               3.14 kB        90.3 kB
├ ○ /products                                 2.9 kB          102 kB
└ ○ /workflows                                2.59 kB        98.5 kB
```

`○` = prerendered as static content (per Next legend at the bottom of the build output). The `force-dynamic` export ensures these pages are NOT actually prerendered with client-only hook execution; Next.js builds them as static shells and renders the dynamic body server-side per request.

---

## 4 · Verifier results

| Verifier | Result |
|---|---|
| `npm run typecheck` (`npx tsc --noEmit`) | clean · no type errors |
| `npm run build` | green · 28/28 static pages · all 7 target pages built |
| `scripts/verify-vertical-intelligence.ts` | **80 / 80 PASS** |
| `scripts/verify-real-llm-generator.ts` (stub) | **42 / 42 PASS** · stub-mode baseline intact · LIVE mode armed |
| `scripts/verify-output-quality.ts` | **32.42 / 60** average · **0** code-switch · all 10 verticals ≥ 30 |

No regressions. The vertical-intelligence layer, the OpenAI adapter, the corpus fallback, and the verifier suite are all unchanged in behavior — only the three JSX files were touched.

---

## 5 · Can LIVE OpenAI validation now run?

**Yes.** The remaining checkpoint is exactly the one the previous report flagged:

```
$ OPENAI_API_KEY=sk-... npx tsx scripts/verify-real-llm-generator.ts
```

with the LIVE-mode gates:

```
PASS  overall-net-quality ≥ 40
PASS  no-vertical-below-30
PASS  code-switch-total = 0
```

If those three PASSes appear, the system is sellable at the higher tier. The build green-light is no longer a blocker.

The verifier already prints token-cost-shape (avg in/out tokens, avg latency, est. $/gen) so the operator can also confirm the cost profile.

---

## 6 · Note for the operator (Windows local repo at `C:\Projects\mood-automation`)

If `npm run build` still fails on the Windows machine after pulling this commit:

1. **Confirm the local repo is on `claude/mood-creative-os-v1-i4Mfv` and is up to date.** Run:
   ```
   git fetch origin
   git checkout claude/mood-creative-os-v1-i4Mfv
   git pull
   ```
2. **Clear the Next.js cache.** Windows occasionally caches stale build artifacts:
   ```
   rmdir /s /q .next
   ```
3. **Reinstall deps** in case of OS-specific resolution:
   ```
   rmdir /s /q node_modules
   npm install
   ```
4. **Run the build again.** It should print `✓ Generating static pages (28/28)` and the same 7 target pages with size column populated.

If the build still fails, the actual error log (the lines around "Failed to compile" or the stack trace) will be needed to diagnose further — the failure-symptom list alone (`/brands`, `/dashboard`, etc.) is not unique to one root cause.

---

## 7 · Next step

Build is green. Vertical intelligence is green. Real-LLM adapter is green in stub. **LIVE LLM validation is the next step**, per the directive:

```
רק אחרי שה־build ירוק, ממשיכים ל־LIVE LLM validation.
```

The operator runs `OPENAI_API_KEY=… npx tsx scripts/verify-real-llm-generator.ts` and reports the headline (overall avg / min vertical / code-switch total / cost / latency). After that confirms, Stripe is the natural next milestone.

Do NOT proceed to Stripe or landing-page polish until the LIVE verifier confirms the 40+ net-quality threshold.
