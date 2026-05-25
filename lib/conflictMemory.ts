/**
 * CONFLICT MEMORY (Cross-Brain Conflict Engine — Phase Next)
 *
 * Persistent FIFO memory of internal disagreements observed per
 * generation attempt. Lets the longitudinal view detect recurring
 * tensions, rising instability, and stable agreement zones.
 *
 * STRICTLY:
 *   - read-only perception input (no runtime mutation of generation)
 *   - deterministic — append is the only mutating operation
 *   - no external APIs / model calls
 *   - write failure is non-fatal (caller swallows)
 *
 * Lives at data/memory/conflict-memory.json. FIFO-capped at 96 entries.
 *
 * Same observation stream → same memory state → same longitudinal view.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CampaignMode, Formula } from '@/core/types';
import type { ConflictType, ActiveConflict } from './crossBrainConflictEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'conflict-memory.json';

export const CONFLICT_OBSERVATION_LIMIT = 96;
export const AGREEMENT_ZONE_LIMIT = 64;
export const INSTABILITY_TRACE_LIMIT = 64;

// ─── observation shape ─────────────────────────────────────────

export interface ConflictObservation {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  overallTension: number;
  cognitiveStability: number;
  alignmentScore: number;
  dominantConflict: ConflictType | null;
  activeConflicts: Array<{
    type: ConflictType;
    severity: number;
    systemsInvolved: string[];
  }>;
  agreementZones: string[];
  silentRiskCount: number;
}

export interface InstabilityPoint {
  at: number;
  overallTension: number;
  cognitiveStability: number;
  alignmentScore: number;
  dominantConflict: ConflictType | null;
}

// ─── state ─────────────────────────────────────────────────────

export interface ConflictMemoryState {
  observations: ConflictObservation[];
  // Recurring conflict counts (lifetime — not FIFO).
  conflictTypeCounts: Record<string, number>;
  // EWMA severity per conflict type — slow drift detection.
  conflictTypeSeverityEwma: Record<string, number>;
  // Stable agreement zones — count of how often each zone appears.
  agreementZoneCounts: Record<string, number>;
  // Instability trajectory — overall tension over time.
  instabilityTrace: InstabilityPoint[];
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialConflictMemory(): ConflictMemoryState {
  return {
    observations: [],
    conflictTypeCounts: {},
    conflictTypeSeverityEwma: {},
    agreementZoneCounts: {},
    instabilityTrace: [],
    totalObservations: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── pure transform ───────────────────────────────────────────

function bumpCount(table: Record<string, number>, key: string): Record<string, number> {
  return { ...table, [key]: (table[key] ?? 0) + 1 };
}

/** EWMA: prev * 0.7 + new * 0.3. Same severity stream → same EWMA. */
function ewmaSeverity(prev: number | undefined, current: number): number {
  if (prev === undefined) return current;
  return prev * 0.7 + current * 0.3;
}

/** Apply one observation deterministically. Pure — no I/O. */
export function applyConflictObservation(
  state: ConflictMemoryState, obs: ConflictObservation,
): ConflictMemoryState {
  const nextTypeCounts = { ...state.conflictTypeCounts };
  const nextSeverityEwma = { ...state.conflictTypeSeverityEwma };
  for (const c of obs.activeConflicts) {
    nextTypeCounts[c.type] = (nextTypeCounts[c.type] ?? 0) + 1;
    nextSeverityEwma[c.type] = ewmaSeverity(state.conflictTypeSeverityEwma[c.type], c.severity);
  }
  let nextAgreement = { ...state.agreementZoneCounts };
  for (const z of obs.agreementZones) nextAgreement = bumpCount(nextAgreement, z);

  return {
    observations: [...state.observations, obs].slice(-CONFLICT_OBSERVATION_LIMIT),
    conflictTypeCounts: nextTypeCounts,
    conflictTypeSeverityEwma: nextSeverityEwma,
    agreementZoneCounts: nextAgreement,
    instabilityTrace: [...state.instabilityTrace, {
      at: obs.at,
      overallTension: obs.overallTension,
      cognitiveStability: obs.cognitiveStability,
      alignmentScore: obs.alignmentScore,
      dominantConflict: obs.dominantConflict,
    }].slice(-INSTABILITY_TRACE_LIMIT),
    totalObservations: state.totalObservations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? obs.at,
    updatedAt: obs.at,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodConflictMemory?: ConflictMemoryState };

export interface ConflictMemoryStore {
  read(): Promise<ConflictMemoryState>;
  append(obs: ConflictObservation): Promise<ConflictMemoryState>;
  save(state: ConflictMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createConflictMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): ConflictMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: ConflictMemoryStore = {
    async read() {
      if (g.__moodConflictMemory) return g.__moodConflictMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodConflictMemory = {
          ...createInitialConflictMemory(),
          ...(JSON.parse(txt) as Partial<ConflictMemoryState>),
        };
      } catch {
        g.__moodConflictMemory = createInitialConflictMemory();
      }
      return g.__moodConflictMemory;
    },
    async append(obs) {
      const cur = await store.read();
      const next = applyConflictObservation(cur, obs);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.observations    = state.observations.slice(-CONFLICT_OBSERVATION_LIMIT);
      state.instabilityTrace= state.instabilityTrace.slice(-INSTABILITY_TRACE_LIMIT);
      state.updatedAt = nowMs();
      g.__moodConflictMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodConflictMemory = undefined;
    },
  };
  return store;
}

// ─── builder helper for the route ─────────────────────────────

export function buildConflictObservation(args: {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  overallTension: number;
  cognitiveStability: number;
  alignmentScore: number;
  dominantConflict: ConflictType | null;
  activeConflicts: ActiveConflict[];
  agreementZones: string[];
  silentRiskCount: number;
}): ConflictObservation {
  return {
    at: args.at,
    bannerId: args.bannerId,
    formula: args.formula,
    campaignMode: args.campaignMode,
    overallTension: args.overallTension,
    cognitiveStability: args.cognitiveStability,
    alignmentScore: args.alignmentScore,
    dominantConflict: args.dominantConflict,
    activeConflicts: args.activeConflicts.map((c) => ({
      type: c.type, severity: c.severity, systemsInvolved: c.systemsInvolved,
    })),
    agreementZones: args.agreementZones.slice(0, 8),
    silentRiskCount: args.silentRiskCount,
  };
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordConflictObservation(
  obs: ConflictObservation,
): Promise<void> {
  try {
    await createConflictMemoryStore().append(obs);
  } catch {
    // non-fatal — conflict observation writes never block generation
  }
}
