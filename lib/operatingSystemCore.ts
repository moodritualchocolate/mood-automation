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
  kind: 'first-internal-draft';
  body: string;
  restraintTrace: string[];
}

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
