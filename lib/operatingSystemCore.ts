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
  | 'booting' | 'coordinated-operation' | 'throttled'
  | 'protective-mode' | 'deep-pause' | 'hibernating';

export type StrategicSeasonName =
  | 'growth' | 'silence' | 'observation' | 'recovery'
  | 'expansion' | 'defense' | 'hibernation';

export interface DirectiveRecord { directive: string; tick: number; }

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
