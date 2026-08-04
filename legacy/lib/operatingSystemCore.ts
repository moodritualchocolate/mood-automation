/**
 * OPERATING SYSTEM CORE (Phase 110 — Wave 8: Operating System Genesis)
 *
 * Wave 7 made the system a living organism. Wave 8 gives that organism
 * an OPERATING SYSTEM — a kernel, a scheduler, interrupts, resource
 * allocation, process management. This module owns the OS's persistent
 * runtime state (data/runtime/os-runtime.json) and is the closing
 * synthesis of the whole wave: did this action emerge from coordinated
 * organism cognition, or from isolated process stimulation? When
 * isolated processes dominate the runtime is fragmenting; when
 * coordination dominates the organism is stabilising into an OS.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { KernelReading } from './cognitiveKernel';
import type { KernelHealthReading } from './kernelHealthMonitor';
import type { DirectiveReading } from './directiveEngine';
import type { StabilizationReading } from './autonomousRuntimeStabilization';
import { deltaForDirective } from './cognitiveSignals';
import {
  computeReviewScores, recommendationFor,
  deriveStrengths, deriveWeaknesses, deriveEvaluation,
} from './reviewScoring';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'os-runtime.json';
const DIRECTIVE_LOG_LIMIT = 80;

export type OperationalPosture =
  | 'booting' | 'observing' | 'coordinated-operation' | 'throttled'
  | 'protective-mode' | 'deep-pause' | 'hibernating';

export type StrategicSeasonName =
  | 'growth' | 'silence' | 'observation' | 'recovery'
  | 'expansion' | 'defense' | 'hibernation';

export interface DirectiveRecord {
  directive: string;
  tick: number;
  /** Wave 20 — optional richer description of what the directive means.
   *  Populated by cognitive actions (e.g. observation). Older entries
   *  written before Wave 20 simply omit this. */
  thought?: string;
  /** Wave 20 — wall-clock timestamp the directive was issued. */
  at?: number;
}

/**
 * Wave 22 — the permission window. Opened by a successful 'permit'
 * directive; closed (set to null) when an action consumes it. Wave 23
 * makes 'prepare' the first consumer.
 */
export interface PermissionWindow {
  openedAt: number;       // ms timestamp the window was opened
  permittedTick: number;  // os.uptime when permit was granted
}

/**
 * Wave 23 — internal intention state. Set by a successful 'prepare'
 * directive when a permission window is consumed. status is always
 * 'open' in Phase 5; later phases may add 'consumed' (when an action
 * verb discharges it) or 'expired' (if a TTL rule is added).
 *
 * The intention carries no creative content — no draft text, no
 * candidate output, no external target. It is the bare fact that the
 * organism has prepared internally to act, and the trace of which
 * permission opened it.
 */
export interface IntentionState {
  preparedAt: number;     // ms timestamp prepare succeeded
  preparedTick: number;   // os.uptime at prepare
  permittedTick: number;  // os.uptime of the permission that enabled it
  status: 'open';
}

/**
 * Wave 24 — the first internal artifact. Created by a successful
 * 'draft' directive, which requires an open currentIntention and
 * consumes it. The draft is bare and internal — no external target,
 * no publish path. Its body is composed deterministically from the
 * directiveLog at draft time (counts of each cognitive verb that
 * led here); its restraintTrace records the explicit constraints
 * this phase enforces.
 *
 * status is the literal 'internal' in Phase 6. kind is the literal
 * 'first-internal-draft'. Both are deliberate string-literal types
 * so future phases extending the vocabulary make a type-level
 * change rather than introducing an unbounded enum.
 */
export interface CurrentDraft {
  draftId: string;
  createdAt: number;
  createdTick: number;
  derivedFromPreparedTick: number;
  derivedFromPermittedTick: number;
  status: 'internal';
  kind: 'first-internal-draft' | 'revised-internal-draft';
  body: string;
  restraintTrace: string[];
  /** Wave 26 — set on revisions. Links to the original draft this
   *  is a revision of, plus the review that recommended revision. */
  revisedFrom?: {
    originalDraftId: string;
    basedOnReviewId: string;
    revisionNumber: number;
  };
}

/**
 * Wave 26 — internal review. Created by a successful 'review'
 * directive, which requires an open currentDraft. Scoring is purely
 * deterministic — every score derives from real persistent state at
 * review time (directiveLog counts, draft body claim parsing, lineage
 * history). No LLM judgments, no random noise.
 *
 * recommendation drives what happens next:
 *   'approved-for-approval' — the chain may proceed to 'approve'
 *   'revise-required'       — the chain must 'revise' first
 *   'refused'               — the draft is unsalvageable; chain ends
 */
export type ReviewRecommendation =
  | 'approved-for-approval'
  | 'revise-required'
  | 'refused';

export interface CurrentReview {
  reviewId: string;
  createdAt: number;
  createdTick: number;
  derivedFromDraftId: string;
  derivedFromDraftTick: number;
  status: 'internal';
  qualityScore: number;        // 0..10 — aggregate
  coherenceScore: number;      // 0..10 — body claims vs actual log counts
  restraintScore: number;      // 0..10 — discipline preserved
  contradictionScore: number;  // count of claim mismatches; 0 = clean
  depthScore: number;          // 0..10 — unique cognitive verbs used
  noveltyScore: number;        // 0..10 — body distinct from prior drafts
  evaluation: string;          // one-line summary
  weaknesses: string[];        // derived from low scores
  strengths: string[];         // derived from high scores
  recommendation: ReviewRecommendation;
}

/**
 * Wave 26 — revision metadata. Set when 'revise' fires. The revised
 * draft itself replaces currentDraft (with kind='revised-internal-draft'
 * and revisedFrom populated); this field carries the revision-event
 * metadata so the dashboard can show "revision 2 of draft X".
 */
export interface CurrentRevision {
  revisionId: string;
  createdAt: number;
  createdTick: number;
  revisionNumber: number;          // 1 = first revision of the current draft chain
  derivedFromOriginalDraftId: string;
  derivedFromPriorDraftId: string; // the draft that was just replaced
  basedOnReviewId: string;
  changes: string[];               // human-readable list of addressed weaknesses
}

/**
 * Wave 26 — approval state. Set when 'approve' fires. The verdict is
 * a literal 'internally-coherent' — approval ≠ ready-to-publish; it
 * means the cognition is internally stable. No external action follows.
 */
export interface ApprovalState {
  approvalId: string;
  approvedAt: number;
  approvedTick: number;
  approvedDraftId: string;
  basedOnReviewId: string;
  verdict: 'internally-coherent';
  scoresSnapshot: {
    qualityScore: number;
    coherenceScore: number;
    restraintScore: number;
    contradictionScore: number;
  };
  statement: string;
}

/**
 * Wave 27 — Phase 8A: Action Sandbox.
 *
 * A PendingExternalAction is the first artifact that LOOKS like an
 * external action but is NOT one. It is a sandboxed record: the
 * organism's proposal of a future external action candidate, derived
 * from an approved internal cognition. Nothing executes. No publish
 * path is invoked. No external API is called. The record sits in
 * pendingExternalActions[] until some future phase chooses to act
 * (or doesn't).
 *
 * actionType is a literal-only string. For Phase 8A the only allowed
 * value is 'prepare_external_candidate'. 'publish' and 'post' are
 * explicitly NOT in the union — adding them is a deliberate type-level
 * decision a later phase must make.
 *
 * status stays at the literal 'pending' for the entire lifetime of a
 * Phase 8A entry. A future phase introduces lifecycle transitions
 * (executed / discarded / expired) and the matching state machine.
 */
export type SandboxedActionType = 'prepare_external_candidate';

export interface PendingExternalAction {
  actionId: string;
  createdAt: number;
  createdTick: number;
  sourceDraftId: string;
  sourceReviewId: string;
  sourceApprovalId: string;
  actionType: SandboxedActionType;
  status: 'pending';
  riskLevel: 'low';                  // Sandbox is low-risk by construction
  expectedOutcome: string;
  executionCost: string;
  rollbackPlan: string;
  restraintTrace: string[];
  approvalTrace: string[];
}

// Cap for the pendingExternalActions array. FIFO eviction once exceeded.
export const PENDING_ACTIONS_LIMIT = 20;

export interface OSRuntimeState {
  bootedAt: number;
  uptime: number;                       // kernel ticks (runs) the OS has lived
  operationalPosture: OperationalPosture;
  currentSeason: StrategicSeasonName;
  seasonAge: number;                    // ticks in the current season
  directiveLog: DirectiveRecord[];
  totalInterrupts: number;
  coordinationEMA: number;              // 0..10 — running coordination score
  fragmentationStreak: number;          // consecutive fragmented ticks
  hibernationCount: number;
  /** Wave 22 — null until a 'permit' directive opens it; cleared
   *  back to null when a 'prepare' directive consumes it. */
  permissionWindow: PermissionWindow | null;
  /** Wave 23 — null until a 'prepare' directive opens an intention;
   *  cleared back to null when a 'draft' directive consumes it. */
  currentIntention: IntentionState | null;
  /** Wave 24 — null until a 'draft' directive creates the first
   *  internal artifact. The trace of which intention birthed it
   *  lives in derivedFromPreparedTick / derivedFromPermittedTick,
   *  so the intention can be nulled cleanly on consumption. */
  currentDraft: CurrentDraft | null;
  /** Wave 26 — null until a 'review' directive evaluates currentDraft.
   *  Cleared back to null when 'revise' produces a new draft (which
   *  then needs a new review). */
  currentReview: CurrentReview | null;
  /** Wave 26 — null until a 'revise' directive replaces currentDraft.
   *  Carries the revision-event metadata; the revised body itself
   *  lives in currentDraft (with revisedFrom populated). */
  currentRevision: CurrentRevision | null;
  /** Wave 26 — null until an 'approve' directive verdicts the current
   *  draft as internally coherent. Preserved across subsequent acts
   *  until a future replace. */
  currentApproval: ApprovalState | null;
  /** Wave 27 — Phase 8A Action Sandbox. Capped queue of proposed
   *  external action candidates. Each entry is a record only —
   *  nothing in this array executes. Phase 8B+ introduces lifecycle
   *  transitions; Phase 8A only writes 'pending' entries here. */
  pendingExternalActions: PendingExternalAction[];
  /** Wave 29 — Hibernation & Idle Consciousness. Counts the number
   *  of hibernating → active transitions that have ever happened.
   *  Advanced by evolveOSFromWakeTransition. 0 on initial state. */
  wakeCount?: number;
  /** Wave 29 — wall-clock time of the most recent wake-transition.
   *  Undefined until the first wake event. */
  lastWakeAt?: number;
  /** Wave 29 — os.uptime at the most recent wake-transition. */
  lastWakeTick?: number;
  updatedAt: number;
}

export function createInitialOS(): OSRuntimeState {
  return {
    bootedAt: Date.now(),
    uptime: 0,
    operationalPosture: 'booting',
    currentSeason: 'observation',
    seasonAge: 0,
    directiveLog: [],
    totalInterrupts: 0,
    coordinationEMA: 6,
    fragmentationStreak: 0,
    hibernationCount: 0,
    permissionWindow: null,
    currentIntention: null,
    currentDraft: null,
    currentReview: null,
    currentRevision: null,
    currentApproval: null,
    pendingExternalActions: [],
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodOS?: OSRuntimeState };

export interface OSRuntimeStore {
  read(): Promise<OSRuntimeState>;
  save(state: OSRuntimeState): Promise<void>;
  reset(): Promise<void>;
}

export function createOSRuntimeStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): OSRuntimeStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodOS) return g.__moodOS;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodOS = { ...createInitialOS(), ...(JSON.parse(txt) as Partial<OSRuntimeState>) };
      } catch {
        g.__moodOS = createInitialOS();
      }
      return g.__moodOS;
    },
    async save(state) {
      state.directiveLog = state.directiveLog.slice(-DIRECTIVE_LOG_LIMIT);
      state.updatedAt = Date.now();
      g.__moodOS = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodOS = undefined;
    },
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** The kernel ran one more tick — advance the persistent OS state. */
export function evolveOSFromTick(
  state: OSRuntimeState,
  args: {
    coordination: number;
    directive: string;
    posture: OperationalPosture;
    season: StrategicSeasonName;
    interrupts: number;
    fragmented: boolean;
  },
): OSRuntimeState {
  const next = { ...state, directiveLog: [...state.directiveLog] };
  next.uptime += 1;
  next.coordinationEMA = clamp10(round1(state.coordinationEMA * 0.7 + args.coordination * 0.3));
  next.operationalPosture = args.posture;
  if (args.season !== state.currentSeason) {
    next.currentSeason = args.season;
    next.seasonAge = 0;
  } else {
    next.seasonAge += 1;
  }
  next.directiveLog.push({ directive: args.directive, tick: next.uptime });
  next.totalInterrupts += args.interrupts;
  next.fragmentationStreak = args.fragmented ? state.fragmentationStreak + 1 : 0;
  if (args.directive === 'hibernate') next.hibernationCount += 1;
  return next;
}

// ─── Wave 19 — passive runtime tick (aging while observed) ──────
//
// The cognitive tick (evolveOSFromTick above) runs when the organism
// actually thinks: it pushes a directive, shifts posture, updates
// coordination. A passive tick is the lighter cousin — what runs
// when the organism is merely observed.
//
// Strictly:
//   - no directive emitted (directiveLog untouched)
//   - no operationalPosture change
//   - no currentSeason change (only seasonAge advances, because time
//     in the season passes regardless of cognition)
//   - no coordinationEMA shift
//   - no fragmentation / interrupt / hibernation counters touched
//
// A passive tick advances only the two pure time fields: uptime and
// seasonAge. Heartbeat persistence, nothing more.
//
// Rate floor: the awakening tick (uptime 0 → 1) is always taken, so
// a brand-new runtime moves out of the floor on its first observation.
// Subsequent ticks require MIN_PASSIVE_TICK_MS since the last save —
// a refresh storm therefore cannot inflate uptime past one tick per
// MIN_PASSIVE_TICK_MS regardless of how many observers are watching.

export const MIN_PASSIVE_TICK_MS = 1000;

export function evolveOSFromPassiveTick(
  state: OSRuntimeState,
  now: number = Date.now(),
): OSRuntimeState {
  if (state.uptime > 0) {
    if (now - state.updatedAt < MIN_PASSIVE_TICK_MS) return state;
  }
  return {
    ...state,
    uptime: state.uptime + 1,
    seasonAge: state.seasonAge + 1,
  };
}

// ─── Wave 30 — Temporal Memory + Strategic Patience ──────────
//
// defer is the verb that lets the organism choose to wait. It is
// not refusal — defer always succeeds. The thought is composed by
// the orchestrator from the temporal assessment (so the dashboard
// and the directive log agree on why waiting was wise).
//
// Persistence: appends a 'defer' directive, runs the standard
// applyCognitiveAct path (uptime, seasonAge, organism age via the
// orchestrator). The orchestrator separately appends a defer
// observation to temporal-memory.json.

export function evolveOSFromDefer(
  state: OSRuntimeState,
  at: number,
  thoughtSuffix: string,
): OSRuntimeState {
  return applyCognitiveAct(state, 'defer', (next) =>
    `deferred at tick ${next.uptime}: ${thoughtSuffix}`,
    at,
  );
}

// ─── Wave 29 — Hibernation & Idle Consciousness ────────────────
//
// Thresholds for the consciousness-state derivation in
// lib/consciousnessView.ts. The classifier is a pure function of
// os + organism state; these constants tune it without scattering
// magic numbers across the codebase.

/** Ticks of no cognition before the organism is considered IDLE. */
export const IDLE_AFTER_TICKS = 10;
/** Ticks of no cognition before the organism is considered HIBERNATING.
 *  Must also have low energy (≤ 4) or several rest cycles (≥ 3) and
 *  no pending external actions. */
export const HIBERNATE_AFTER_TICKS = 30;
/** Metabolism fires once every N passive ticks while non-active.
 *  At 4s dashboard polling, ≈ one metabolism step every 40s. */
export const METABOLISM_INTERVAL_TICKS = 10;

/**
 * Wave 29 — wake transition. Emitted by the orchestrator when a
 * cognition verb fires AND the consciousness state was 'hibernating'.
 * The wake-transition takes its own tick (uptime + seasonAge advance
 * once for the wake, again for the verb that follows). Only the
 * verb's organism evolve increments organism.age — the wake itself
 * is an OS-level event, not a cognitive one.
 */
export function evolveOSFromWakeTransition(
  state: OSRuntimeState,
  at: number = Date.now(),
  hibernatedForTicks: number = 0,
): OSRuntimeState {
  const next = applyCognitiveAct(state, 'wake-transition', (post) =>
    `wake-transition at tick ${post.uptime}: organism returns from ` +
    `hibernation after ${hibernatedForTicks} ticks of dormancy. ` +
    `Cognition verb follows on next tick.`,
    at,
  );
  next.wakeCount = (state.wakeCount ?? 0) + 1;
  next.lastWakeAt = at;
  next.lastWakeTick = next.uptime;
  return next;
}

// ─── Wave 20 — first cognition: observation ─────────────────────
// ─── Wave 21 — cognitive vocabulary: notice / consider / restrain ─
//
// The lightest forms of cognition. The organism observes, notices,
// considers, restrains — never inventing facts. Each cognitive verb
// shares the same persistence shape:
//
//   uptime += 1
//   seasonAge += 1
//   posture: 'booting' → 'observing' on the very first cognitive act,
//            otherwise unchanged (no jump to coordinated-operation;
//            cognition discipline before action)
//   directiveLog.push({ directive: <verb>, tick, thought, at })
//
// Each verb supplies its own thought composer. Thoughts are composed
// from values in the post-evolve state — no randomness, no fabrication.
//
// The Wave 20 observation function is preserved by name and behaviour;
// the new verbs are layered on the same internal helper so all four
// agree on persistence shape and posture rules.

type ThoughtComposer = (post: OSRuntimeState) => string;

function applyCognitiveAct(
  state: OSRuntimeState,
  directive: string,
  compose: ThoughtComposer,
  at: number,
): OSRuntimeState {
  const next = { ...state, directiveLog: [...state.directiveLog] };
  next.uptime += 1;
  next.seasonAge += 1;
  if (state.operationalPosture === 'booting') {
    next.operationalPosture = 'observing';
  }
  const thought = compose(next);
  next.directiveLog.push({ directive, tick: next.uptime, thought, at });

  // Wave 25 — DSA: coordination EMA + fragmentation streak.
  // EMA blend 0.8/0.2 so coordination doesn't whipsaw on a single act.
  // fragmentationStreak resets on any non-refused act, increments on
  // any refusal — captures runs of bad cognition for the dashboard's
  // liveness branch to react to.
  const delta = deltaForDirective(directive);
  next.coordinationEMA = clamp10(round1(
    state.coordinationEMA * 0.8 + delta.coordinationContribution * 0.2,
  ));
  next.fragmentationStreak = directive.endsWith('-refused')
    ? state.fragmentationStreak + 1
    : 0;

  return next;
}

export function evolveOSFromObservation(
  state: OSRuntimeState,
  at: number = Date.now(),
): OSRuntimeState {
  return applyCognitiveAct(state, 'observe', (next) =>
    `observed self at tick ${next.uptime}: posture ${next.operationalPosture}, ` +
    `season ${next.currentSeason}, season-age ${next.seasonAge}`,
    at,
  );
}

// Wave 21 — notice. Names one salient fact: the most recent directive
// in the log, or the absence of one. The notice itself is appended
// AFTER its thought is composed, so 'directiveLog' inside the composer
// is the prior log — what was already there when the organism noticed.
export function evolveOSFromNotice(
  state: OSRuntimeState,
  at: number = Date.now(),
): OSRuntimeState {
  return applyCognitiveAct(state, 'notice', (next) => {
    const prior = next.directiveLog;
    if (prior.length === 0) {
      return `noticed at tick ${next.uptime}: no prior directives in the log — ` +
             `this is the first cognition`;
    }
    const last = prior[prior.length - 1];
    return `noticed at tick ${next.uptime}: the last directive was '${last.directive}' ` +
           `at tick ${last.tick} — ${prior.length} prior directive${prior.length === 1 ? '' : 's'} in the log`;
  }, at);
}

// Wave 21 — consider. Holds a relation in mind: cognition density
// (cognitive acts per tick), a real ratio derived from persistent state.
export function evolveOSFromConsider(
  state: OSRuntimeState,
  at: number = Date.now(),
): OSRuntimeState {
  return applyCognitiveAct(state, 'consider', (next) => {
    const acts_after = next.directiveLog.length + 1;
    const density = next.uptime > 0
      ? Math.round((acts_after / next.uptime) * 100)
      : 0;
    return `considered at tick ${next.uptime}: ${acts_after} cognitive acts across ` +
           `${next.uptime} ticks of uptime — cognition density ${density}%`;
  }, at);
}

// Wave 21 — restrain. Names what was held back. The thought is
// explicit about the not-acting: no generation, no publishing, no
// external mutation. Restraint is recorded so the dashboard can see
// the discipline of holding.
export function evolveOSFromRestrain(
  state: OSRuntimeState,
  at: number = Date.now(),
): OSRuntimeState {
  return applyCognitiveAct(state, 'restrain', (next) =>
    `restrained at tick ${next.uptime}: did not generate, did not publish, ` +
    `did not act — cognition held without output`,
    at,
  );
}

// ─── Wave 22 — permission gate ─────────────────────────────────
//
// The first verb whose outcome depends on cognitive history. permit
// opens an internal permission window — a small persistent flag that
// later action-class verbs (Phase 5+) will require — but only if the
// discipline chain is complete: at least one observe, one notice,
// one consider, and one restrain must already exist in the directive
// log. The chain must EXIST in history; ordering is not required.
//
// On success:  directive 'permit' is logged, permissionWindow opens.
// On refusal:  directive 'permit-refused' is logged with a thought
//              naming the missing verbs. permissionWindow stays as
//              it was (still null on first run).
//
// Both branches are cognitive events — uptime and seasonAge advance,
// posture transitions out of 'booting' on the first call, organism
// age increments (from the orchestrator). Refusal is logged because
// the organism noticing the gate is closed is itself cognition.

export const REQUIRED_DISCIPLINE: ReadonlyArray<string> = [
  'observe', 'notice', 'consider', 'restrain',
];

export function disciplineMissing(state: OSRuntimeState): string[] {
  const seen = new Set(state.directiveLog.map((d) => d.directive));
  return REQUIRED_DISCIPLINE.filter((v) => !seen.has(v));
}

export function evolveOSFromPermit(
  state: OSRuntimeState,
  at: number = Date.now(),
): OSRuntimeState {
  const missing = disciplineMissing(state);

  if (missing.length > 0) {
    // Refusal — log the blocked attempt, leave permissionWindow as-is.
    return applyCognitiveAct(state, 'permit-refused', (next) =>
      `permit refused at tick ${next.uptime}: discipline chain incomplete — ` +
      `missing [${missing.join(', ')}], no permission opened`,
      at,
    );
  }

  // Success — log permit and open the window.
  const next = applyCognitiveAct(state, 'permit', (post) => {
    const counts: Record<string, number> = {};
    for (const d of post.directiveLog) counts[d.directive] = (counts[d.directive] ?? 0) + 1;
    const summary = REQUIRED_DISCIPLINE
      .map((v) => `${counts[v] ?? 0} ${v}`)
      .join(', ');
    return `permitted at tick ${post.uptime}: discipline chain complete (${summary}) — ` +
           `permission window opened`;
  }, at);

  return {
    ...next,
    permissionWindow: { openedAt: at, permittedTick: next.uptime },
  };
}

// ─── Wave 23 — first internal intention: prepare ────────────────
//
// prepare is the first verb that consumes the permission window.
// On success the organism records that it has prepared internally
// to act — without generating, publishing, or targeting anything
// external. The intention is bare: a timestamp, the tick, and a
// pointer to the permission that enabled it.
//
// On success:
//   - directive 'prepare' is logged with a thought naming the
//     consumed permission and stating no generation occurred
//   - permissionWindow is cleared (consumed — Phase 4 promised:
//     "stays open until an action consumes it")
//   - currentIntention is opened
//
// On refusal (no permission window):
//   - directive 'prepare-refused' is logged with a thought naming
//     the missing precondition (run discipline → permit first)
//   - permissionWindow and currentIntention stay as they were
//
// Both branches are cognition: uptime + seasonAge advance,
// organism.age increments (from the orchestrator), the entry
// persists in directiveLog.

export function evolveOSFromPrepare(
  state: OSRuntimeState,
  at: number = Date.now(),
): OSRuntimeState {
  const window = state.permissionWindow;

  if (!window) {
    return applyCognitiveAct(state, 'prepare-refused', (next) =>
      `prepare refused at tick ${next.uptime}: no permission window exists — ` +
      `no internal intention opened. ` +
      `Run observe → notice → consider → restrain → permit first.`,
      at,
    );
  }

  const next = applyCognitiveAct(state, 'prepare', (post) =>
    `prepared at tick ${post.uptime}: permission window from tick ${window.permittedTick} ` +
    `consumed — internal intention opened. ` +
    `No generation, no publishing, no external action.`,
    at,
  );

  return {
    ...next,
    permissionWindow: null,
    currentIntention: {
      preparedAt: at,
      preparedTick: next.uptime,
      permittedTick: window.permittedTick,
      status: 'open',
    },
  };
}

// ─── Wave 26 — Phase 7: review / revise / approve ──────────────
//
// Three verbs that operate on currentDraft and produce structured
// artifacts. Each follows the discipline-of-cognition pattern:
// refusal logged when preconditions aren't met, full state mutation
// when they are. Lineage writes (data/memory/cognitive-lineage.json)
// are handled by the orchestrator after these evolves return.

// MAX_REVISIONS_PER_DRAFT — the loop guard the user required.
// After this many revisions in a single draft chain without an
// approval, further revise calls are forced to refuse.
export const MAX_REVISIONS_PER_DRAFT = 3;

// Quality thresholds for approve. Re-checked here so approve refuses
// if the most recent review dropped below them even though it had
// been marked approvable.
export const APPROVE_MIN_COHERENCE = 6;
// A single 'restrain' in the chain gives restraintScore = 6 via
// the formula min(10, restrainCount * 2 + 4). The threshold is set
// so that a single demonstrated restraint passes; refusal fires
// only if there was zero restraint at all in the chain (score 4).
export const APPROVE_MIN_RESTRAINT = 6;

export function evolveOSFromReview(
  state: OSRuntimeState,
  at: number,
  priorDraftBodies: string[],
): OSRuntimeState {
  const draft = state.currentDraft;
  if (!draft) {
    return applyCognitiveAct(state, 'review-refused', (next) =>
      `review refused at tick ${next.uptime}: no currentDraft exists — ` +
      `nothing to evaluate. Run draft first.`,
      at,
    );
  }

  const scores = computeReviewScores(draft, state.directiveLog, priorDraftBodies);
  const recommendation = recommendationFor(scores);
  const strengths = deriveStrengths(scores);
  const weaknesses = deriveWeaknesses(scores);
  const evaluation = deriveEvaluation(scores, recommendation);

  const next = applyCognitiveAct(state, 'review', (post) =>
    `reviewed at tick ${post.uptime}: draft ${draft.draftId} → ` +
    `quality ${scores.qualityScore}/10, coherence ${scores.coherenceScore}/10, ` +
    `contradiction ${scores.contradictionScore} — ${recommendation}`,
    at,
  );

  const review: CurrentReview = {
    reviewId: `review-${at}-${next.uptime}`,
    createdAt: at,
    createdTick: next.uptime,
    derivedFromDraftId: draft.draftId,
    derivedFromDraftTick: draft.createdTick,
    status: 'internal',
    qualityScore: scores.qualityScore,
    coherenceScore: scores.coherenceScore,
    restraintScore: scores.restraintScore,
    contradictionScore: scores.contradictionScore,
    depthScore: scores.depthScore,
    noveltyScore: scores.noveltyScore,
    evaluation,
    strengths,
    weaknesses,
    recommendation,
  };

  return { ...next, currentReview: review };
}

export function evolveOSFromRevise(
  state: OSRuntimeState,
  at: number,
  revisionCountInChain: number,
): OSRuntimeState {
  const draft = state.currentDraft;
  const review = state.currentReview;

  if (!draft) {
    return applyCognitiveAct(state, 'revise-refused', (next) =>
      `revise refused at tick ${next.uptime}: no currentDraft exists.`,
      at,
    );
  }
  if (!review) {
    return applyCognitiveAct(state, 'revise-refused', (next) =>
      `revise refused at tick ${next.uptime}: no currentReview exists — ` +
      `run review before revise.`,
      at,
    );
  }
  if (review.recommendation !== 'revise-required') {
    return applyCognitiveAct(state, 'revise-refused', (next) =>
      `revise refused at tick ${next.uptime}: most recent review ` +
      `recommendation is '${review.recommendation}', not 'revise-required'.`,
      at,
    );
  }
  if (revisionCountInChain >= MAX_REVISIONS_PER_DRAFT) {
    return applyCognitiveAct(state, 'revise-refused', (next) =>
      `revise refused at tick ${next.uptime}: revision cap reached ` +
      `(${MAX_REVISIONS_PER_DRAFT}). Chain must restart with a new draft.`,
      at,
    );
  }

  const next = applyCognitiveAct(state, 'revise', (post) =>
    `revised at tick ${post.uptime}: draft ${draft.draftId} → revision ` +
    `${revisionCountInChain + 1} of ${MAX_REVISIONS_PER_DRAFT}, addressing: ` +
    `[${review.weaknesses.join(', ') || 'none'}]`,
    at,
  );

  const counts: Record<string, number> = {};
  for (const d of next.directiveLog) counts[d.directive] = (counts[d.directive] ?? 0) + 1;
  const past = (verb: string): string => ({
    observe: 'observed', notice: 'noticed', consider: 'considered',
    restrain: 'restrained', permit: 'permitted', prepare: 'prepared',
  }[verb] ?? verb);
  const phrase = (v: string) => `${counts[v] ?? 0}× ${past(v)}`;
  const body =
    `Internal draft (revision ${revisionCountInChain + 1}) born from ` +
    `disciplined cognition: ${phrase('observe')}, ${phrase('notice')}, ` +
    `${phrase('consider')}, ${phrase('restrain')}, ${phrase('permit')}, ` +
    `${phrase('prepare')}. Revised to address: ` +
    `${review.weaknesses.join(', ') || 'incomplete review'}. ` +
    `No external action taken.`;

  const originalDraftId = draft.revisedFrom?.originalDraftId ?? draft.draftId;

  const revisedDraft: CurrentDraft = {
    draftId: `draft-${at}-${next.uptime}`,
    createdAt: at,
    createdTick: next.uptime,
    derivedFromPreparedTick: draft.derivedFromPreparedTick,
    derivedFromPermittedTick: draft.derivedFromPermittedTick,
    status: 'internal',
    kind: 'revised-internal-draft',
    body,
    restraintTrace: [
      'no generation beyond internal draft',
      'no publishing',
      'no external action',
      'review weaknesses addressed',
    ],
    revisedFrom: {
      originalDraftId,
      basedOnReviewId: review.reviewId,
      revisionNumber: revisionCountInChain + 1,
    },
  };

  const revision: CurrentRevision = {
    revisionId: `revision-${at}-${next.uptime}`,
    createdAt: at,
    createdTick: next.uptime,
    revisionNumber: revisionCountInChain + 1,
    derivedFromOriginalDraftId: originalDraftId,
    derivedFromPriorDraftId: draft.draftId,
    basedOnReviewId: review.reviewId,
    changes: review.weaknesses.length > 0
      ? review.weaknesses.map((w) => `addressed: ${w}`)
      : ['no specific weaknesses — body regenerated from current state'],
  };

  return {
    ...next,
    currentDraft: revisedDraft,
    currentReview: null,
    currentRevision: revision,
  };
}

export function evolveOSFromApprove(
  state: OSRuntimeState,
  at: number,
): OSRuntimeState {
  const draft = state.currentDraft;
  const review = state.currentReview;

  if (!review) {
    return applyCognitiveAct(state, 'approve-refused', (next) =>
      `approve refused at tick ${next.uptime}: no currentReview exists.`,
      at,
    );
  }
  if (!draft) {
    return applyCognitiveAct(state, 'approve-refused', (next) =>
      `approve refused at tick ${next.uptime}: no currentDraft exists.`,
      at,
    );
  }
  if (review.recommendation !== 'approved-for-approval') {
    return applyCognitiveAct(state, 'approve-refused', (next) =>
      `approve refused at tick ${next.uptime}: review recommendation is ` +
      `'${review.recommendation}', not 'approved-for-approval'.`,
      at,
    );
  }
  if (review.contradictionScore > 0) {
    return applyCognitiveAct(state, 'approve-refused', (next) =>
      `approve refused at tick ${next.uptime}: contradictionScore ` +
      `${review.contradictionScore} must be 0.`,
      at,
    );
  }
  if (review.coherenceScore < APPROVE_MIN_COHERENCE) {
    return applyCognitiveAct(state, 'approve-refused', (next) =>
      `approve refused at tick ${next.uptime}: coherenceScore ` +
      `${review.coherenceScore} below threshold ${APPROVE_MIN_COHERENCE}.`,
      at,
    );
  }
  if (review.restraintScore < APPROVE_MIN_RESTRAINT) {
    return applyCognitiveAct(state, 'approve-refused', (next) =>
      `approve refused at tick ${next.uptime}: restraintScore ` +
      `${review.restraintScore} below threshold ${APPROVE_MIN_RESTRAINT}.`,
      at,
    );
  }

  const next = applyCognitiveAct(state, 'approve', (post) =>
    `approved at tick ${post.uptime}: draft ${draft.draftId} verdict ` +
    `internally-coherent (quality ${review.qualityScore}/10, ` +
    `coherence ${review.coherenceScore}/10). Internal only — no external action follows.`,
    at,
  );

  const approval: ApprovalState = {
    approvalId: `approval-${at}-${next.uptime}`,
    approvedAt: at,
    approvedTick: next.uptime,
    approvedDraftId: draft.draftId,
    basedOnReviewId: review.reviewId,
    verdict: 'internally-coherent',
    scoresSnapshot: {
      qualityScore: review.qualityScore,
      coherenceScore: review.coherenceScore,
      restraintScore: review.restraintScore,
      contradictionScore: review.contradictionScore,
    },
    statement:
      `draft ${draft.draftId} approved as internally-coherent at tick ` +
      `${next.uptime} — no external action follows`,
  };

  return { ...next, currentApproval: approval };
}

// ─── Wave 28 — Rest + Recovery Physiology ──────────────────────
//
// rest is the first cognitive verb that operates on the organism's
// physiology directly — restoration rather than accumulation. It is
// gated by two checks:
//
//   1. Depletion check — rest is allowed only if the organism is
//      actually depleted. At least one of:
//        energyReserves     <= REST_ENERGY_THRESHOLD     (4)
//        stressAccumulation >= REST_STRESS_THRESHOLD     (5)
//        complexityLoad     >= REST_COMPLEXITY_THRESHOLD (6)
//        fragmentationStreak >= REST_FRAGMENT_THRESHOLD  (3)
//        pendingExternalActions.length > 0 AND energyReserves <= 6
//      If none are true, refuse with 'rest is not needed'.
//
//   2. Cadence check — rest is allowed only if enough has happened
//      since the previous successful rest. The condition is OR:
//        ≥ REST_CADENCE_MIN_ACTS (3) non-rest acts since lastRestTick
//        ≥ REST_CADENCE_MIN_TICKS (10) uptime ticks since lastRestTick
//      Either condition relaxes the gate. Refusals don't game the
//      gate because rest-refused directives are excluded from the
//      act count.
//
// On success the organism's vitals shift by the user-specified
// magnitudes:
//   energyReserves      +1.2 (clamped 10)
//   stressAccumulation  -0.8 (floored 0)
//   complexityLoad      -0.6 (floored 0)
//   coordinationEMA     +0.3 (clamped 10, ADDITIVE — overrides
//                              applyCognitiveAct's EMA blend)
//   fragmentationStreak -1 (floored 0, OVERRIDES applyCognitiveAct's
//                            success-reset-to-zero)
//   restCount           +1
//   lastRestAt / lastRestTick / lastRestSnapshot set on the organism

export const REST_ENERGY_THRESHOLD = 4;
export const REST_STRESS_THRESHOLD = 5;
export const REST_COMPLEXITY_THRESHOLD = 6;
export const REST_FRAGMENT_THRESHOLD = 3;
export const REST_PENDING_ENERGY_THRESHOLD = 6;
export const REST_CADENCE_MIN_ACTS = 3;
export const REST_CADENCE_MIN_TICKS = 10;

export interface RestDepletionReason {
  energy_low: boolean;
  stress_high: boolean;
  complexity_high: boolean;
  fragmented: boolean;
  pending_with_low_energy: boolean;
}

/** Wave 34 — when adaptive thresholds are passed in, use them; otherwise
 *  baseline constants. Pre-Wave-34 callers can ignore the second arg. */
export interface AdaptiveRestThresholdsLike {
  energyLow: number;
  stressHigh: number;
  complexityHigh: number;
  fragmentHigh: number;
  pendingEnergyLow: number;
}

export function isOrganismDepleted(
  os: OSRuntimeState,
  organism: { energyReserves: number; stressAccumulation: number; complexityLoad: number },
  thresholds?: AdaptiveRestThresholdsLike,
): RestDepletionReason {
  const t = thresholds ?? {
    energyLow: REST_ENERGY_THRESHOLD,
    stressHigh: REST_STRESS_THRESHOLD,
    complexityHigh: REST_COMPLEXITY_THRESHOLD,
    fragmentHigh: REST_FRAGMENT_THRESHOLD,
    pendingEnergyLow: REST_PENDING_ENERGY_THRESHOLD,
  };
  return {
    energy_low: organism.energyReserves <= t.energyLow,
    stress_high: organism.stressAccumulation >= t.stressHigh,
    complexity_high: organism.complexityLoad >= t.complexityHigh,
    fragmented: os.fragmentationStreak >= t.fragmentHigh,
    pending_with_low_energy:
      os.pendingExternalActions.length > 0 &&
      organism.energyReserves <= t.pendingEnergyLow,
  };
}

function depletionMet(r: RestDepletionReason): boolean {
  return r.energy_low || r.stress_high || r.complexity_high ||
         r.fragmented || r.pending_with_low_energy;
}

function depletionReasons(r: RestDepletionReason): string[] {
  const reasons: string[] = [];
  if (r.energy_low) reasons.push('energyReserves low');
  if (r.stress_high) reasons.push('stressAccumulation high');
  if (r.complexity_high) reasons.push('complexityLoad high');
  if (r.fragmented) reasons.push('fragmentationStreak elevated');
  if (r.pending_with_low_energy) reasons.push('pending actions with low energy');
  return reasons;
}

export function evolveOSFromRest(
  state: OSRuntimeState,
  organism: {
    energyReserves: number;
    stressAccumulation: number;
    complexityLoad: number;
    lastRestTick?: number;
  },
  at: number = Date.now(),
  adaptiveThresholds?: AdaptiveRestThresholdsLike,
): OSRuntimeState {
  // Depletion check first — if the organism isn't depleted, rest
  // isn't needed at all and cadence is irrelevant.
  const depletion = isOrganismDepleted(state, organism, adaptiveThresholds);
  if (!depletionMet(depletion)) {
    return applyCognitiveAct(state, 'rest-refused', (next) =>
      `rest refused at tick ${next.uptime}: organism is not depleted ` +
      `enough to justify recovery (energy ${organism.energyReserves}/10, ` +
      `stress ${organism.stressAccumulation}/10, complexity ` +
      `${organism.complexityLoad}/10, fragmentation ${state.fragmentationStreak}).`,
      at,
    );
  }

  // Cadence check — OR semantic: either enough acts OR enough ticks.
  const lastRestTick = organism.lastRestTick ?? -Infinity;
  const ticksElapsed = state.uptime - lastRestTick;
  const actsElapsed = state.directiveLog.filter((d) =>
    d.tick > lastRestTick && d.directive !== 'rest' && d.directive !== 'rest-refused',
  ).length;
  const cadenceOk =
    ticksElapsed >= REST_CADENCE_MIN_TICKS ||
    actsElapsed >= REST_CADENCE_MIN_ACTS;

  if (!cadenceOk) {
    return applyCognitiveAct(state, 'rest-refused', (next) =>
      `rest refused at tick ${next.uptime}: recovery cadence not yet ` +
      `elapsed (${ticksElapsed} ticks, ${actsElapsed} non-rest acts ` +
      `since lastRestTick ${lastRestTick === -Infinity ? 'never' : lastRestTick}; ` +
      `need ${REST_CADENCE_MIN_TICKS} ticks or ${REST_CADENCE_MIN_ACTS} acts).`,
      at,
    );
  }

  // Success — apply the standard cognitive-act updates, then override
  // coordinationEMA and fragmentationStreak per spec.
  const next = applyCognitiveAct(state, 'rest', (post) =>
    `rested at tick ${post.uptime}: recovery applied — reasons [${depletionReasons(depletion).join(', ')}]. ` +
    `Internal only — no external action, no sandbox change.`,
    at,
  );

  next.coordinationEMA = clamp10(round1(state.coordinationEMA + 0.3));
  next.fragmentationStreak = Math.max(0, state.fragmentationStreak - 1);

  return next;
}

// ─── Wave 27 — Phase 8A: Action Sandbox ────────────────────────
//
// propose creates a sandboxed pending external action candidate. The
// preconditions are strict — there must be an approved cognition
// chain ending in currentApproval, and that approval must reference
// a still-current draft and review. No execution follows; the entry
// is appended to pendingExternalActions[] (capped, FIFO eviction).
//
// propose does NOT consume currentApproval. The approval represents
// an internally-coherent thought that may yield more than one external
// candidate; the discipline lives in the cognition chain (which gates
// approval), not in the proposal step. Multiple proposals may stack.
//
// All scalar fields on the action record are deterministic:
//   actionType:      'prepare_external_candidate' (only value allowed
//                     in Phase 8A)
//   status:          'pending' (no lifecycle in Phase 8A)
//   riskLevel:       'low' (sandbox is low-risk by construction; no
//                     model-driven judgment)
//   expectedOutcome: honest boilerplate naming what the sandbox does
//                    and does not do
//   executionCost:   honest boilerplate naming the zero cost
//   rollbackPlan:    honest boilerplate naming the discard semantics
//   restraintTrace:  the protections this phase enforces
//   approvalTrace:   ticks and scores of the originating chain

const SANDBOX_RESTRAINT_TRACE: ReadonlyArray<string> = [
  'no publish',
  'no post',
  'no external API call',
  'no social posting',
  'no marketing output to the outside world',
  'sandboxed — no execution',
];

export function evolveOSFromPropose(
  state: OSRuntimeState,
  at: number = Date.now(),
): OSRuntimeState {
  const draft = state.currentDraft;
  const review = state.currentReview;
  const approval = state.currentApproval;

  if (!approval) {
    return applyCognitiveAct(state, 'propose-refused', (next) =>
      `propose refused at tick ${next.uptime}: no currentApproval exists — ` +
      `external candidates may only be proposed from approved cognition.`,
      at,
    );
  }
  if (!draft || draft.draftId !== approval.approvedDraftId) {
    return applyCognitiveAct(state, 'propose-refused', (next) =>
      `propose refused at tick ${next.uptime}: currentDraft does not match ` +
      `approval.approvedDraftId — the approved draft is no longer current.`,
      at,
    );
  }
  if (!review || review.reviewId !== approval.basedOnReviewId) {
    return applyCognitiveAct(state, 'propose-refused', (next) =>
      `propose refused at tick ${next.uptime}: currentReview does not match ` +
      `approval.basedOnReviewId — the approval's review is no longer current.`,
      at,
    );
  }

  const next = applyCognitiveAct(state, 'propose', (post) =>
    `proposed at tick ${post.uptime}: candidate derived from approved draft ` +
    `${draft.draftId} (approval tick ${approval.approvedTick}, review tick ` +
    `${review.createdTick}) — actionType prepare_external_candidate, ` +
    `riskLevel low, status pending. Sandboxed — no execution.`,
    at,
  );

  const approvalTrace = [
    `originating draft tick: ${draft.createdTick}`,
    `review tick: ${review.createdTick} (recommendation ${review.recommendation})`,
    `approval tick: ${approval.approvedTick} (verdict ${approval.verdict})`,
    `review scores: quality ${review.qualityScore}/10, ` +
      `coherence ${review.coherenceScore}/10, restraint ${review.restraintScore}/10, ` +
      `contradiction ${review.contradictionScore}`,
  ];

  const action: PendingExternalAction = {
    actionId: `action-${at}-${next.uptime}`,
    createdAt: at,
    createdTick: next.uptime,
    sourceDraftId: draft.draftId,
    sourceReviewId: review.reviewId,
    sourceApprovalId: approval.approvalId,
    actionType: 'prepare_external_candidate',
    status: 'pending',
    riskLevel: 'low',
    expectedOutcome:
      'a candidate for a future external action is recorded; no execution ' +
      'follows. The entry sits in pendingExternalActions[] until a later ' +
      'phase decides what to do with it.',
    executionCost:
      'zero — Phase 8A writes a record only. No tokens spent, no API ' +
      'called, no banner shipped, no message sent.',
    rollbackPlan:
      'discard: remove the entry from pendingExternalActions. Because ' +
      'nothing executed, no external rollback is needed. The cognitive ' +
      'lineage that produced this candidate stays in cognitive-lineage.json.',
    restraintTrace: [...SANDBOX_RESTRAINT_TRACE],
    approvalTrace,
  };

  // FIFO eviction once over cap.
  const pending = [...state.pendingExternalActions, action]
    .slice(-PENDING_ACTIONS_LIMIT);

  return { ...next, pendingExternalActions: pending };
}

// ─── Wave 24 — first internal draft ─────────────────────────────
//
// draft is the first verb that consumes the currentIntention opened
// by 'prepare'. On success it creates currentDraft — the first
// internal artifact — with a body composed deterministically from
// the cognitive history that led here.
//
// On success:
//   - directive 'draft' is logged with a thought referencing the
//     prepared / permitted ticks
//   - currentIntention is cleared to null (consumed — the draft
//     itself records the trace via derivedFrom* fields, so the
//     intention field doesn't need to keep the trace)
//   - currentDraft is set with a deterministic body and restraintTrace
//   - permissionWindow is NOT touched (prepare already consumed it)
//
// On refusal (no open currentIntention):
//   - directive 'draft-refused' is logged with a thought naming the
//     missing precondition
//   - currentIntention, currentDraft, permissionWindow all unchanged
//
// Both branches are cognition: uptime + seasonAge advance,
// organism.age increments (from the orchestrator).
//
// No external archive is written. No publish path is invoked. No
// banner is generated. The body is text only — a description of the
// disciplined cognition that brought the organism here.

const PAST_TENSE: Record<string, string> = {
  observe: 'observed',
  notice: 'noticed',
  consider: 'considered',
  restrain: 'restrained',
  permit: 'permitted',
  prepare: 'prepared',
};

const DRAFT_RESTRAINT_TRACE: ReadonlyArray<string> = [
  'no generation beyond internal draft',
  'no publishing',
  'no external action',
  'intention consumed',
];

export function evolveOSFromDraft(
  state: OSRuntimeState,
  at: number = Date.now(),
): OSRuntimeState {
  const intention = state.currentIntention;

  if (!intention || intention.status !== 'open') {
    return applyCognitiveAct(state, 'draft-refused', (next) =>
      `draft refused at tick ${next.uptime}: no open currentIntention exists — ` +
      `no internal draft created. ` +
      `Run observe → notice → consider → restrain → permit → prepare first.`,
      at,
    );
  }

  const next = applyCognitiveAct(state, 'draft', (post) =>
    `drafted at tick ${post.uptime}: first internal artifact created from intention ` +
    `(prepared tick ${intention.preparedTick}, permitted tick ${intention.permittedTick}) — ` +
    `intention consumed. Internal only — no generation, no publishing, no external action.`,
    at,
  );

  // Deterministic body — counts of each disciplined-cognition verb
  // in the directiveLog as of this draft. Past-tense forms match the
  // user's example phrasing; counts make the body actually derived
  // from history rather than a fixed string.
  const counts: Record<string, number> = {};
  for (const d of next.directiveLog) counts[d.directive] = (counts[d.directive] ?? 0) + 1;
  const phrase = (verb: string) =>
    `${counts[verb] ?? 0}× ${PAST_TENSE[verb]}`;
  const body =
    `Internal draft born from disciplined cognition: ` +
    `${phrase('observe')}, ${phrase('notice')}, ${phrase('consider')}, ` +
    `${phrase('restrain')}, ${phrase('permit')}, ${phrase('prepare')}. ` +
    `No external action taken.`;

  return {
    ...next,
    currentIntention: null,
    currentDraft: {
      draftId: `draft-${at}-${next.uptime}`,
      createdAt: at,
      createdTick: next.uptime,
      derivedFromPreparedTick: intention.preparedTick,
      derivedFromPermittedTick: intention.permittedTick,
      status: 'internal',
      kind: 'first-internal-draft',
      body,
      restraintTrace: [...DRAFT_RESTRAINT_TRACE],
    },
  };
}

// ─── Phase 110 — the closing synthesis ─────────────────────────

export interface OperatingSystemReading {
  /** The operating system's overall posture. */
  os_state: OperationalPosture;
  /** True when cognition is coordinated by the kernel. */
  runtime_is_coordinated: boolean;
  /** True when isolated processes dominate — the runtime is fragmenting. */
  runtime_is_fragmenting: boolean;
  /** 0..10 — overall runtime coordination. */
  coordination_score: number;
  /** Kernel ticks the OS has lived. */
  uptime: number;
  /** A one-line statement of the operating system's living state. */
  os_statement: string;
  notes: string[];
}

export interface OperatingSystemInput {
  state: OSRuntimeState;
  kernel: KernelReading;
  health: KernelHealthReading;
  directive: DirectiveReading;
  stabilization: StabilizationReading;
  /** True when a single process is driving the run without kernel coordination. */
  isolatedProcessStimulation: boolean;
}

export function readOperatingSystemCore(input: OperatingSystemInput): OperatingSystemReading {
  const { state, kernel, health, directive, stabilization, isolatedProcessStimulation } = input;
  const notes: string[] = [];

  let coordination_score = 0;
  coordination_score += kernel.coordination_score * 0.4;
  coordination_score += health.overall_health * 0.35;
  coordination_score += (stabilization.runtime_stable ? 2.5 : 0);
  coordination_score -= state.fragmentationStreak * 0.8;
  coordination_score = clamp10(round1(coordination_score));

  const runtime_is_fragmenting =
    isolatedProcessStimulation ||
    health.identity_fragmentation ||
    state.fragmentationStreak >= 3 ||
    coordination_score < 4;

  const runtime_is_coordinated = !runtime_is_fragmenting && coordination_score >= 6;

  const os_state: OperationalPosture =
    directive.directive === 'hibernate' ? 'hibernating' :
    kernel.kernel_state === 'protected-mode' ? 'protective-mode' :
    directive.directive === 'pause' || directive.directive === 'silence' ? 'deep-pause' :
    kernel.kernel_state === 'throttled' ? 'throttled' :
    kernel.kernel_state === 'booting' ? 'booting' :
    'coordinated-operation';

  const os_statement = runtime_is_fragmenting
    ? `the runtime is fragmenting — ${isolatedProcessStimulation ? 'isolated processes are driving cognition without the kernel' : 'cognition has lost coordination'}`
    : `the operating system is coordinating cognition continuously — ${os_state}, coordination ${coordination_score}/10, uptime ${state.uptime} ticks`;

  notes.push(`operating system core: ${os_state} (coordination ${coordination_score}/10) — ${os_statement}`);
  return {
    os_state, runtime_is_coordinated, runtime_is_fragmenting,
    coordination_score, uptime: state.uptime, os_statement, notes,
  };
}
