# Build Order · MVP Implementation Spec

**No more architecture. Below is exactly what gets built, in what order. Build starts immediately after this file is written.**

---

## 1 · Exact screens (4)

| Route | Purpose | State |
|---|---|---|
| `/onboard` | 4-step wizard collecting brand inputs | new |
| `/generating` | Loading screen · polls generation status · auto-redirects to /review | new |
| `/review` | Single page — pick one-liner · mark hooks/UGC/concepts as keep/skip | new |
| `/library` | The deliverable — chosen one-liner + kept hooks + kept UGC scripts + kept image concepts | new |

Plus minor:
- `/` — root redirects authed users to `/onboard` (if no brand input yet) or `/library` (if generation complete)
- All four pages wrap in `AppShell` from `app/components/ui/AppShell.tsx`
- Tenant context via existing `useRequireTenant()` hook

**Outside V1 scope · existing pages untouched:**
- `/asset-library`, `/asset-generator`, `/strategy`, `/studio-home` — legacy SVG paths · not part of this build · not deleted, just unlinked from the new flow

---

## 2 · Exact database entities (3 stores)

All stores follow the existing FIFO + JSON-file pattern in `lib/*Memory.ts`. No SQL.

### 2.1 · `lib/mvpBrandInputMemory.ts`

```ts
interface BrandInputRecord {
  brandInputId:        string         // mvp-input-<base36>
  organizationId:      string
  workspaceId:         string
  operatorId:          string
  // The 4 inputs
  artifact:            string         // "what do you sell?"
  audience:            string         // "who buys it?"
  emotional:           string         // "deeper feeling they want?"
  locale:              string         // "country / language"
  createdAt:           number
  operatorReason:      string
}
```

FIFO cap: 256.

### 2.2 · `lib/mvpGenerationMemory.ts`

```ts
interface OneLinerCandidate {
  id: string
  text: string             // Hebrew (or locale-appropriate)
}

interface HookItem {
  id: string
  text: string             // the hook itself (Hebrew)
  audience: string         // 1-2 sentences
  situation: string        // 1 sentence
  visualDirection: string  // 1 sentence
  commercialScore: number  // 0-100 · used for ranking · NOT shown to user
}

interface UgcScriptItem {
  id: string
  title: string
  durationSec: number
  scriptHebrew: string     // full timecoded script
  shotList: string[]
  callToActionHebrew: string
}

interface ImageConceptItem {
  id: string
  title: string
  visualDescription: string  // 2-3 sentences in plain language
  forUseWith: string         // which hook this pairs with
  renderingNote: string      // optional prompt-form note for future image gen
}

interface GenerationRecord {
  generationId:        string         // mvp-gen-<base36>
  brandInputId:        string
  operatorId:          string
  organizationId:      string
  workspaceId:         string
  oneLinerCandidates:  OneLinerCandidate[]    // 2 items
  hooks:               HookItem[]             // 10 items
  ugcScripts:          UgcScriptItem[]        // 5 items
  imageConcepts:       ImageConceptItem[]     // 10 items
  status:              'generating' | 'ready' | 'failed'
  providerId:          string                 // 'stub' | 'openai' | 'anthropic'
  error?:              string
  createdAt:           number
  completedAt?:        number
}
```

FIFO cap: 128.

### 2.3 · `lib/mvpSelectionMemory.ts`

```ts
interface SelectionRecord {
  selectionId:         string
  generationId:        string
  operatorId:          string
  chosenOneLinerId:    string
  keptHookIds:         string[]
  keptUgcScriptIds:    string[]
  keptImageConceptIds: string[]
  finalizedAt:         number
  operatorReason:      string
}
```

FIFO cap: 256.

---

## 3 · Exact APIs (4 routes)

All routes use `requireSession` from `lib/auth/requireSession.ts`. All routes follow the existing operator-supervised contract (operatorReason required on writes).

### 3.1 · `POST /api/mvp/onboard` — save brand inputs

```ts
Body: {
  artifact: string
  audience: string
  emotional: string
  locale: string
  operatorReason: string
}
Returns: { brandInputId: string }
```

### 3.2 · `POST /api/mvp/generate` — trigger generation

```ts
Body: {
  brandInputId: string
  operatorReason: string
}
Returns: { generationId: string }
```

Behavior:
- Creates a generation record with status `generating`
- Kicks off async LLM call (or synchronous stub) → updates status to `ready` or `failed` when complete
- Returns immediately with the `generationId`

### 3.3 · `GET /api/mvp/generate?generationId=…` — poll status

```ts
Returns: GenerationRecord
```

Used by `/generating` page to poll for completion.

### 3.4 · `POST /api/mvp/selection` — save review choices

```ts
Body: {
  generationId: string
  chosenOneLinerId: string
  keptHookIds: string[]
  keptUgcScriptIds: string[]
  keptImageConceptIds: string[]
  operatorReason: string
}
Returns: { selectionId: string }
```

### 3.5 · `GET /api/mvp/library?selectionId=…` — read the final library

```ts
Returns: {
  selection: SelectionRecord
  generation: GenerationRecord (with only kept items)
}
```

---

## 4 · Exact generation pipeline

### 4.1 · LLM provider boundary (`lib/mvpLlmProvider.ts`)

Single abstraction. Defaults to **stub** (deterministic Hebrew content) if no API key is set. Returns real LLM output if `OPENAI_API_KEY` is set.

```ts
interface MvpGenerateInput {
  artifact:  string
  audience:  string
  emotional: string
  locale:    string
}

interface MvpGenerateOutput {
  oneLinerCandidates: OneLinerCandidate[]
  hooks:              HookItem[]
  ugcScripts:         UgcScriptItem[]
  imageConcepts:      ImageConceptItem[]
  providerId:         'stub' | 'openai' | 'anthropic'
}

async function mvpGenerate(input: MvpGenerateInput): Promise<MvpGenerateOutput>
```

Internal dispatch:
- `OPENAI_API_KEY` present → call OpenAI with structured output (JSON schema)
- `ANTHROPIC_API_KEY` present and OpenAI absent → call Anthropic
- Neither → stub provider returns deterministic placeholder content (12 hooks · 5 UGC · 10 concepts based on simple templates filled from input)

Stub provider exists because:
- Operator can install + test the product before paying for an API key
- Auto-tests don't need API keys
- Demo screenshots can be taken without consuming credits

### 4.2 · Generation engine (`lib/mvpGenerationEngine.ts`)

Pure orchestrator. Calls the LLM provider, validates the output shape, applies a deterministic commercial score to each hook (used for ranking · hidden from the user), persists the result.

```ts
async function runMvpGeneration(args: {
  brandInputId: string
  operatorId: string
  organizationId: string
  workspaceId: string
}): Promise<{ generationId: string }>
```

The engine handles:
- Fetching the brand input
- Calling `mvpGenerate()`
- Scoring each hook on a hidden 0-100 scale (weighted combination of input-match heuristics)
- Persisting the GenerationRecord (status: `ready` on success, `failed` on error)

### 4.3 · The 2-LLM-call pattern

Call 1 — Strategy → one-liner + 10 hook stubs
Call 2 — From hooks → 5 UGC scripts + 10 image concepts

Two calls keep individual prompts focused. Total wall time: 60-90 seconds at typical OpenAI gpt-4o-mini speeds.

For the stub provider, both calls return instantly with deterministic content.

---

## 5 · Exact development order

Sequential. Each step is a complete unit. Move to next step only when prior step's typecheck is clean.

| # | Step | Files touched | Verify |
|---|---|---|---|
| 1 | Memory stores · 3 files | `lib/mvpBrandInputMemory.ts` · `lib/mvpGenerationMemory.ts` · `lib/mvpSelectionMemory.ts` | `npx tsc --noEmit` clean |
| 2 | LLM provider · stub first | `lib/mvpLlmProvider.ts` | typecheck clean · unit-test the stub returns valid shapes |
| 3 | Generation engine | `lib/mvpGenerationEngine.ts` | typecheck clean |
| 4 | API · onboard | `app/api/mvp/onboard/route.ts` | typecheck clean |
| 5 | API · generate (POST + GET) | `app/api/mvp/generate/route.ts` | typecheck clean |
| 6 | API · selection | `app/api/mvp/selection/route.ts` | typecheck clean |
| 7 | API · library | `app/api/mvp/library/route.ts` | typecheck clean |
| 8 | UI · /onboard | `app/onboard/page.tsx` | typecheck clean · loads in browser |
| 9 | UI · /generating | `app/generating/page.tsx` | typecheck clean |
| 10 | UI · /review | `app/review/page.tsx` | typecheck clean |
| 11 | UI · /library | `app/library/page.tsx` | typecheck clean |
| 12 | Add MVP nav to AppShell + update root redirect | `app/components/ui/AppShell.tsx` · `app/page.tsx` | typecheck clean |
| 13 | Add MVP routes to verify-system-stability whitelist | `scripts/verify-system-stability.ts` | full suite green |
| 14 | Build + smoke test | — | `npm run build` green · `npm run typecheck` clean · end-to-end click-through works in dev |

---

## 6 · What is NOT in this build (no exceptions)

- No PDF generator
- No commercial-architecture output surfaced to UI
- No product-architecture output surfaced to UI
- No long-form strategy reports
- No image generation
- No video generation
- No publishing integrations
- No subscription billing
- No team accounts
- No multi-language UI chrome (English UI · Hebrew content output only)
- No legacy `/asset-generator`, `/asset-library`, `/strategy` page modifications (left alone for now)
- No new SVG composition
- No new verifier beyond the system-stability whitelist update
- No new e2e tests (smoke test only · later phase)

---

## 7 · Definition of done

The build is done when:

1. `npm run typecheck` clean
2. `npm run build` green
3. Full verifier suite green (with system-stability whitelist updated for the 4 new POST routes)
4. From dev server: a logged-in user can navigate `/onboard` → fill 4 answers → land on `/generating` → see status → land on `/review` → make selections → land on `/library` → see deliverable
5. The stub provider returns valid content end-to-end (without any external API key)
6. The whole flow completes in < 15 minutes (well within 8-minute target with stub)

That's the bar. Nothing else.

---

## 8 · Implementation begins immediately

The next step in this conversation is code. Following the 14-step order above.
