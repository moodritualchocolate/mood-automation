/**
 * EXECUTIVE COGNITIVE GOVERNANCE ENGINE
 *
 * Deterministic, read-only. Models hierarchy BETWEEN brains —
 * not which is correct, but which repeatedly EARNS contextual
 * leadership, stabilizes the system, or destabilizes it.
 *
 * Distinguishes between dominance, legitimacy, stabilization,
 * suppression, contextual leadership, and dangerous over-centralization.
 * A brain may dominate without being stabilizing. A suppressed brain
 * may repeatedly predict collapse correctly.
 *
 * STRICTLY:
 *   - no automatic generation mutation / runtime authority enforcement
 *   - no autonomous orchestration / self-modification
 *   - no critic / verdict / brutality mutation
 *   - no external APIs / model calls
 *   - same inputs → same governance reading
 *
 * Imports: only data types. No critic/pipeline imports.
 */

import type { CulturalPerception } from './culturalPerceptionEngine';
import type { CrossBrainConflict } from './crossBrainConflictEngine';
import type {
  CognitiveWeightEvolution, CognitiveSystem,
} from './cognitiveWeightEvolution';
import { ALL_COGNITIVE_SYSTEMS } from './cognitiveWeightEvolution';
import type { IdentityContinuity } from './identityContinuityEngine';
import type { QualityLongitudinalView } from './qualityLongitudinalView';

// ─── taxonomy ──────────────────────────────────────────────────

export type GovernanceRole =
  | 'executive'
  | 'stabilizer'
  | 'challenger'
  | 'trust-guardian'
  | 'novelty-driver'
  | 'identity-preserver'
  | 'fatigue-regulator'
  | 'cultural-adapter'
  | 'fragmentation-risk'
  | 'suppressed-authority'
  | 'shadow-executive'
  | 'temporary-dominant';

// ─── output shape ──────────────────────────────────────────────

export interface DominantGovernanceStructure {
  primaryExecutive: CognitiveSystem | null;
  supportingSystems: CognitiveSystem[];
  suppressedSystems: CognitiveSystem[];
  explanation: string;
}

export interface GovernanceRoleEntry {
  system: CognitiveSystem;
  role: GovernanceRole;
  authority: number;            // 0..10 — current weighted influence
  stability: number;            // 0..10 — inverse of variance in memory
  contextualLegitimacy: number; // 0..10 — how well role fits conditions
  explanation: string;
}

export interface AuthorityTransitionEntry {
  fromSystem: CognitiveSystem;
  toSystem: CognitiveSystem;
  recencyAt: number;
}

export interface SuppressedAuthorityEntry {
  system: CognitiveSystem;
  suppressionScore: number;
  historicalLegitimacy: number;
  reason: string;
}

export interface ShadowExecutiveEntry {
  system: CognitiveSystem;
  predictiveAccuracy: number;   // 0..10 — historical correlation with non-collapse
  reason: string;
}

export interface GovernanceConflictEntry {
  systems: CognitiveSystem[];
  severity: number;
  explanation: string;
}

export interface PatternEntry {
  pattern: string;
  recurrence: number;
}

export interface ContextualLeadershipRule {
  condition: string;
  leader: CognitiveSystem;
  rationale: string;
}

export interface AuthorityCollapseRisk {
  system: CognitiveSystem;
  riskScore: number;
  reason: string;
}

export interface ExecutiveOverreachRisk {
  system: CognitiveSystem;
  overreachScore: number;
  reason: string;
}

export interface AuthorityDriftEntry {
  system: CognitiveSystem;
  historicalAuthority: number;
  recentAuthority: number;
  drift: number;
}

export interface GovernancePressure {
  trustPressure: number;
  noveltyPressure: number;
  adaptationPressure: number;
  fragmentationPressure: number;
}

export interface ExecutiveGovernance {
  governanceStability: number;
  executiveLegitimacy: number;
  authorityFragmentation: number;
  adaptiveBalance: number;

  dominantGovernanceStructure: DominantGovernanceStructure;
  governanceRoles: GovernanceRoleEntry[];

  authorityTransitions: AuthorityTransitionEntry[];
  suppressedAuthorities: SuppressedAuthorityEntry[];
  shadowExecutives: ShadowExecutiveEntry[];
  governanceConflicts: GovernanceConflictEntry[];

  stabilizationPatterns: PatternEntry[];
  destabilizationPatterns: PatternEntry[];

  contextualLeadershipRules: ContextualLeadershipRule[];

  authorityCollapseRisks: AuthorityCollapseRisk[];
  executiveOverreachRisks: ExecutiveOverreachRisk[];

  governancePressure: GovernancePressure;

  longTermAuthorityDrift: AuthorityDriftEntry[];
  behavioralGovernanceFingerprint: PatternEntry[];

  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

/** Minimal history context the engine needs. Pass `null` when no
 *  memory exists yet. */
export interface GovernanceHistoryContext {
  /** EWMA of authority per cognitive system. */
  authorityEwma: Partial<Record<CognitiveSystem, number>>;
  /** Variance per system across the recent window. */
  variance: Partial<Record<CognitiveSystem, number>>;
  /** How many times each system was primary executive. */
  executiveCounts: Partial<Record<CognitiveSystem, number>>;
  /** How many times each system was a stabilizer. */
  stabilizerCounts: Partial<Record<CognitiveSystem, number>>;
  /** How many times each system was suppressed but the run avoided
   *  collapse — used to detect shadow executives. */
  shadowEmergenceCounts: Partial<Record<CognitiveSystem, number>>;
  /** Per-system count of consecutive runs as primary executive — the
   *  raw signal for over-centralization. */
  consecutiveExecutiveRuns: Partial<Record<CognitiveSystem, number>>;
  /** Last-seen authority transitions (recent tail). */
  recentTransitions: AuthorityTransitionEntry[];
  /** Stabilization / destabilization pattern counts. */
  stabilizationPatternCounts?: Record<string, number>;
  destabilizationPatternCounts?: Record<string, number>;
  /** Recurring behavioral governance fingerprint counts. */
  governanceFingerprintCounts?: Record<string, number>;
  /** Total observations the memory contains. */
  observationCount: number;
  /** Recent fragmentation trace average. */
  recentFragmentation?: number;
  /** Recent stability trace average. */
  recentStability?: number;
}

export interface ExecutiveGovernanceInput {
  cognitiveWeight?: CognitiveWeightEvolution | null;
  conflict?: CrossBrainConflict | null;
  culturalPerception?: CulturalPerception | null;
  identityContinuity?: IdentityContinuity | null;
  qualityLongitudinal?: QualityLongitudinalView | null;
  /** Reserved for the not-yet-built layers — accept any opaque shape
   *  so wiring lands cleanly when they ship. */
  counterfactual?: unknown;
  metaCognitiveReflection?: unknown;
  history?: GovernanceHistoryContext | null;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

function authorityOf(cw: CognitiveWeightEvolution | null | undefined, s: CognitiveSystem): number {
  return cw ? (cw.weights[s] ?? 5) : 5;
}
function isDominant(cw: CognitiveWeightEvolution | null | undefined, s: CognitiveSystem): boolean {
  return cw ? cw.dominantSystems.some((d) => d.system === s) : false;
}
function isSuppressed(cw: CognitiveWeightEvolution | null | undefined, s: CognitiveSystem): boolean {
  return cw ? cw.suppressedSystems.some((d) => d.system === s) : false;
}

// ─── per-system role assignment ───────────────────────────────

interface RoleScore {
  role: GovernanceRole;
  score: number;
  explanation: string;
}

/** Enumerate candidate roles for `system`, scored. The highest-score
 *  role wins. Deterministic — no randomness. */
function candidateRoles(
  system: CognitiveSystem,
  i: ExecutiveGovernanceInput,
  primaryExecutive: CognitiveSystem | null,
  authority: number,
  stability: number,
): RoleScore[] {
  const out: RoleScore[] = [];
  const cw = i.cognitiveWeight;
  const c = i.culturalPerception;
  const conflict = i.conflict;
  const identity = i.identityContinuity;
  const history = i.history;
  const dominant = isDominant(cw, system);
  const suppressed = isSuppressed(cw, system);
  const variance = history?.variance?.[system] ?? 0;
  const shadowCount = history?.shadowEmergenceCounts?.[system] ?? 0;
  const executiveCount = history?.executiveCounts?.[system] ?? 0;
  const consecutive = history?.consecutiveExecutiveRuns?.[system] ?? 0;
  const involvedInConflicts = conflict
    ? conflict.activeConflicts.some((cc) => cc.systemsInvolved.includes(system))
    : false;

  // ── executive: this run's primary executive (fallback label
  //               when no more-specific functional role applies) ──
  if (system === primaryExecutive) {
    out.push({ role: 'executive', score: 80,
      explanation: `current primary executive — authority ${round1(authority)}/10, stability ${round1(stability)}/10` });
  }

  // ── fragmentation-risk: dominant + high variance OR fragmentation ──
  if (dominant && (variance >= 4 || (cw && cw.cognitiveFragmentation >= 6))) {
    out.push({ role: 'fragmentation-risk', score: 100,
      explanation: `dominant but volatile — variance ${round1(variance)}, fragmentation ${cw ? round1(cw.cognitiveFragmentation) : 0}/10` });
  }

  // ── temporary-dominant: dominant but high variance, no history yet ──
  if (dominant && variance >= 2 && variance < 4 && executiveCount <= 2) {
    out.push({ role: 'temporary-dominant', score: 60,
      explanation: `dominant this run but unstable — variance ${round1(variance)}` });
  }

  // ── trust-guardian: trust system under trust pressure ───────
  // Higher priority than 'executive' — the function (guarding trust)
  // describes the system's role better than its position.
  if (system === 'trust' && c && c.trustClimate <= 5 && authority >= 6) {
    out.push({ role: 'trust-guardian', score: 95,
      explanation: `trust system holding under fragile climate (${round1(c.trustClimate)}/10)` });
  }

  // ── novelty-driver: novelty system in novelty-rich era ──────
  if (system === 'novelty' && c && c.noveltyScore >= 6 && authority >= 5) {
    out.push({ role: 'novelty-driver', score: 90,
      explanation: `novelty driving exploration (novelty ${round1(c.noveltyScore)}/10)` });
  }

  // ── fatigue-regulator: fatigue system under fatigue ─────────
  if (system === 'fatigue' && c && (c.aestheticFatigue + c.audienceNumbness) / 2 >= 6 && authority >= 5) {
    out.push({ role: 'fatigue-regulator', score: 90,
      explanation: `fatigue system engaged under audience saturation` });
  }

  // ── cultural-adapter: culture system in active cultural drift ──
  if (system === 'culture' && c &&
      (c.emotionalDrift.movingToward.length + c.emotionalDrift.movingAwayFrom.length) >= 2 &&
      authority >= 5) {
    out.push({ role: 'cultural-adapter', score: 88,
      explanation: `culture brain tracking active emotional drift` });
  }

  // ── stabilizer: high weight + low variance + low tension ────
  // Generic — wins for non-executive systems with calm authority.
  if (authority >= 6 && variance < 2 && conflict && conflict.overallTension <= 4) {
    out.push({ role: 'stabilizer', score: 75,
      explanation: `high authority ${round1(authority)}/10 + low variance ${round1(variance)} + calm tension` });
  }

  // ── identity-preserver: high authority + high identity stability ──
  if (authority >= 6 && identity && identity.identityStability >= 7) {
    out.push({ role: 'identity-preserver', score: 72,
      explanation: `authority steady while identity stability holds (${round1(identity.identityStability)}/10)` });
  }

  // ── shadow-executive: suppressed + historically predictive ──
  if (suppressed && shadowCount >= 3) {
    out.push({ role: 'shadow-executive', score: 78,
      explanation: `suppressed now but historically present during non-collapse runs (×${shadowCount})` });
  }

  // ── suppressed-authority: in suppressed list + non-trivial historical authority
  const ewmaAuth = history?.authorityEwma?.[system] ?? 0;
  if (suppressed && ewmaAuth >= 5) {
    out.push({ role: 'suppressed-authority', score: 60,
      explanation: `suppressed this run but historically influential — ewma ${round1(ewmaAuth)}/10` });
  }

  // ── challenger: actively in conflict, not dominant ──────────
  if (involvedInConflicts && !dominant) {
    out.push({ role: 'challenger', score: 55,
      explanation: `disagreeing productively in active conflicts` });
  }

  return out;
}

/** Pick the single highest-scoring role for the system. */
function pickRole(
  system: CognitiveSystem,
  i: ExecutiveGovernanceInput,
  primaryExecutive: CognitiveSystem | null,
  authority: number,
  stability: number,
): { role: GovernanceRole; explanation: string } | null {
  const candidates = candidateRoles(system, i, primaryExecutive, authority, stability);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return { role: candidates[0].role, explanation: candidates[0].explanation };
}

// ─── primary executive selection ──────────────────────────────

function selectPrimaryExecutive(
  i: ExecutiveGovernanceInput,
): CognitiveSystem | null {
  const cw = i.cognitiveWeight;
  if (!cw || cw.dominantSystems.length === 0) return null;
  // Highest weight × confidence among dominant systems.
  const ranked = cw.dominantSystems.slice().sort((a, b) => {
    const sa = a.weight * 0.7 + a.confidence * 0.3;
    const sb = b.weight * 0.7 + b.confidence * 0.3;
    if (sb !== sa) return sb - sa;
    return a.system.localeCompare(b.system);
  });
  return ranked[0].system;
}

// ─── contextual leadership rules ──────────────────────────────

function buildContextualRules(
  i: ExecutiveGovernanceInput,
): ContextualLeadershipRule[] {
  const out: ContextualLeadershipRule[] = [];
  const c = i.culturalPerception;
  const identity = i.identityContinuity;

  if (c && c.trustClimate <= 4) {
    out.push({
      condition: `trust climate fragile (${round1(c.trustClimate)}/10)`,
      leader: 'trust',
      rationale: 'trust-guardian role earned when belief erodes',
    });
  }
  if (c && c.audienceNumbness >= 6) {
    out.push({
      condition: `audience fatigue active (${round1(c.audienceNumbness)}/10)`,
      leader: 'culture',
      rationale: 'cultural brain reads saturation more accurately than conversion brains',
    });
  }
  if (c && c.noveltyScore <= 4) {
    out.push({
      condition: `low novelty era (${round1(c.noveltyScore)}/10)`,
      leader: 'authenticity',
      rationale: 'when novelty stalls, authenticity earns leadership',
    });
  }
  if (c && (c.dominantSignals.includes('over-performed') || c.dominantSignals.includes('algorithmically-obvious'))) {
    out.push({
      condition: 'over-performance signals active',
      leader: 'restraint',
      rationale: 'restraint legitimacy rises when attention-pushing patterns lose effect',
    });
  }
  if (identity && identity.identityFragmentation >= 6) {
    out.push({
      condition: `identity fragmentation high (${round1(identity.identityFragmentation)}/10)`,
      leader: 'culture',
      rationale: 'cultural read provides external anchor while internal identity reorders',
    });
  }
  return out.slice(0, 6);
}

// ─── stabilization / destabilization patterns ────────────────

function deriveStabilizationPatterns(
  history: GovernanceHistoryContext | null | undefined,
): PatternEntry[] {
  if (!history?.stabilizationPatternCounts) return [];
  return Object.entries(history.stabilizationPatternCounts)
    .map(([pattern, recurrence]) => ({ pattern, recurrence }))
    .filter((r) => r.recurrence >= 2)
    .sort((a, b) => b.recurrence - a.recurrence)
    .slice(0, 5);
}

function deriveDestabilizationPatterns(
  history: GovernanceHistoryContext | null | undefined,
): PatternEntry[] {
  if (!history?.destabilizationPatternCounts) return [];
  return Object.entries(history.destabilizationPatternCounts)
    .map(([pattern, recurrence]) => ({ pattern, recurrence }))
    .filter((r) => r.recurrence >= 2)
    .sort((a, b) => b.recurrence - a.recurrence)
    .slice(0, 5);
}

function deriveBehavioralFingerprints(
  history: GovernanceHistoryContext | null | undefined,
): PatternEntry[] {
  if (!history?.governanceFingerprintCounts) return [];
  return Object.entries(history.governanceFingerprintCounts)
    .map(([pattern, recurrence]) => ({ pattern, recurrence }))
    .filter((r) => r.recurrence >= 2)
    .sort((a, b) => b.recurrence - a.recurrence)
    .slice(0, 6);
}

// ─── governance conflicts (per-pair) ──────────────────────────

const CONFLICT_PAIRS: Array<[CognitiveSystem, CognitiveSystem, string]> = [
  ['strategy', 'trust', 'strategy vs trust — conversion vs preservation'],
  ['strategy', 'culture', 'strategy vs culture — internal goal vs external climate'],
  ['novelty', 'authenticity', 'novelty vs authenticity — exploration vs honesty'],
  ['novelty', 'fatigue', 'novelty vs fatigue — push vs let-rest'],
  ['quality', 'novelty', 'quality vs novelty — integrity vs experimentation'],
  ['proof', 'emotion', 'proof vs emotion — credibility vs resonance'],
];

function deriveGovernanceConflicts(
  i: ExecutiveGovernanceInput,
): GovernanceConflictEntry[] {
  const cw = i.cognitiveWeight;
  if (!cw) return [];
  const out: GovernanceConflictEntry[] = [];
  for (const [a, b, label] of CONFLICT_PAIRS) {
    const wa = cw.weights[a] ?? 0;
    const wb = cw.weights[b] ?? 0;
    // Both systems contesting authority → conflict over governance.
    if (wa >= 6 && wb >= 6 && Math.abs(wa - wb) <= 2) {
      const severity = clamp10(Math.min(wa, wb));
      if (severity >= 6) {
        out.push({
          systems: [a, b],
          severity: round1(severity),
          explanation: `${label} — ${a} ${wa.toFixed(1)} / ${b} ${wb.toFixed(1)}`,
        });
      }
    }
  }
  return out.sort((a, b) => b.severity - a.severity).slice(0, 4);
}

// ─── shadow executive detection ───────────────────────────────

function deriveShadowExecutives(
  i: ExecutiveGovernanceInput,
): ShadowExecutiveEntry[] {
  const history = i.history;
  if (!history?.shadowEmergenceCounts) return [];
  return ALL_COGNITIVE_SYSTEMS
    .map((s) => {
      const count = history.shadowEmergenceCounts?.[s] ?? 0;
      const total = Math.max(1, history.observationCount);
      const predictive = Math.min(10, (count / total) * 10);
      if (count < 3) return null;
      return {
        system: s,
        predictiveAccuracy: round1(predictive),
        reason: `suppressed during ×${count} runs that avoided collapse — historical predictive value ${round1(predictive)}/10`,
      };
    })
    .filter((r): r is ShadowExecutiveEntry => r !== null)
    .sort((a, b) => b.predictiveAccuracy - a.predictiveAccuracy)
    .slice(0, 4);
}

// ─── suppressed authority detection ───────────────────────────

function deriveSuppressedAuthorities(
  i: ExecutiveGovernanceInput,
): SuppressedAuthorityEntry[] {
  const cw = i.cognitiveWeight;
  const history = i.history;
  if (!cw) return [];
  return cw.suppressedSystems
    .map((s) => {
      const ewma = history?.authorityEwma?.[s.system] ?? 0;
      return {
        system: s.system,
        suppressionScore: s.suppressionScore,
        historicalLegitimacy: round1(ewma),
        reason: s.reason,
      };
    })
    .filter((r) => r.historicalLegitimacy >= 3)
    .sort((a, b) => b.historicalLegitimacy - a.historicalLegitimacy)
    .slice(0, 4);
}

// ─── overreach + collapse risks ───────────────────────────────

function deriveExecutiveOverreachRisks(
  i: ExecutiveGovernanceInput,
): ExecutiveOverreachRisk[] {
  const cw = i.cognitiveWeight;
  const history = i.history;
  if (!cw || !history) return [];
  const out: ExecutiveOverreachRisk[] = [];
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    const consecutive = history.consecutiveExecutiveRuns?.[s] ?? 0;
    const executiveCount = history.executiveCounts?.[s] ?? 0;
    const total = Math.max(1, history.observationCount);
    const dominanceShare = executiveCount / total;
    if (consecutive >= 5 || dominanceShare >= 0.7) {
      const fragSignal = history.recentFragmentation ?? 0;
      const score = clamp10(consecutive * 0.6 + dominanceShare * 5 + fragSignal * 0.3);
      if (score >= 4) {
        out.push({
          system: s,
          overreachScore: round1(score),
          reason: `${s} dominated ${consecutive} consecutive runs · ${(dominanceShare * 100).toFixed(0)}% of all runs · recent fragmentation ${round1(fragSignal)}/10`,
        });
      }
    }
  }
  return out.sort((a, b) => b.overreachScore - a.overreachScore).slice(0, 3);
}

function deriveAuthorityCollapseRisks(
  i: ExecutiveGovernanceInput,
): AuthorityCollapseRisk[] {
  const cw = i.cognitiveWeight;
  const history = i.history;
  if (!cw) return [];
  const out: AuthorityCollapseRisk[] = [];
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    const current = cw.weights[s] ?? 5;
    const ewma = history?.authorityEwma?.[s] ?? current;
    const drop = ewma - current;
    if (drop >= 2) {
      const score = clamp10(drop * 1.5);
      out.push({
        system: s,
        riskScore: round1(score),
        reason: `authority dropping fast — ewma ${round1(ewma)} → current ${round1(current)}`,
      });
    }
  }
  return out.sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
}

// ─── governance pressure ──────────────────────────────────────

function deriveGovernancePressure(i: ExecutiveGovernanceInput): GovernancePressure {
  const c = i.culturalPerception;
  const cw = i.cognitiveWeight;
  return {
    trustPressure: round1(clamp10(c ? (10 - c.trustClimate) * 1.1 : 0)),
    noveltyPressure: round1(clamp10(c ? Math.abs(c.noveltyScore - 5) * 1.2 : 0)),
    adaptationPressure: round1(clamp10(cw ? cw.adaptationPressure : 0)),
    fragmentationPressure: round1(clamp10(cw ? cw.cognitiveFragmentation : 0)),
  };
}

// ─── per-system stability (from variance) ─────────────────────

function stabilityFromVariance(variance: number): number {
  // Variance 0 → stability 10; variance 6+ → stability ~0.
  return clamp10(10 - variance * 1.5);
}

// ─── contextual legitimacy ───────────────────────────────────

function legitimacyFor(
  system: CognitiveSystem,
  authority: number,
  stability: number,
  i: ExecutiveGovernanceInput,
): number {
  // Legitimacy combines: (a) authority earned in role, (b) stability,
  // (c) context-fit bonus when the brain matches current pressure.
  const c = i.culturalPerception;
  let bonus = 0;
  if (system === 'trust' && c && c.trustClimate <= 5) bonus += 1.5;
  if (system === 'culture' && c && c.audienceNumbness >= 6) bonus += 1.5;
  if (system === 'fatigue' && c && c.aestheticFatigue >= 6) bonus += 1;
  if (system === 'novelty' && c && c.noveltyScore >= 7) bonus += 1;
  if (system === 'restraint' && c &&
      (c.dominantSignals.includes('over-performed') || c.dominantSignals.includes('algorithmically-obvious'))) bonus += 1.5;
  return clamp10(authority * 0.5 + stability * 0.3 + bonus);
}

// ─── main ──────────────────────────────────────────────────────

export function computeExecutiveGovernance(
  input: ExecutiveGovernanceInput,
): ExecutiveGovernance {
  const reasonCodes: string[] = [];
  const cw = input.cognitiveWeight ?? null;

  // 1. Primary executive.
  const primaryExecutive = selectPrimaryExecutive(input);

  // 2. Per-system role assignment.
  const governanceRoles: GovernanceRoleEntry[] = [];
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    const authority = authorityOf(cw, s);
    const variance = input.history?.variance?.[s] ?? 0;
    const stability = stabilityFromVariance(variance);
    const picked = pickRole(s, input, primaryExecutive, authority, stability);
    if (!picked) continue;
    governanceRoles.push({
      system: s,
      role: picked.role,
      authority: round1(authority),
      stability: round1(stability),
      contextualLegitimacy: round1(legitimacyFor(s, authority, stability, input)),
      explanation: picked.explanation,
    });
  }
  // Sort: primary executive's row first (regardless of its role label),
  // then by contextual legitimacy descending. This keeps the panel
  // ordered "leader at the top, supporters underneath".
  governanceRoles.sort((a, b) => {
    if (a.system === primaryExecutive && b.system !== primaryExecutive) return -1;
    if (b.system === primaryExecutive && a.system !== primaryExecutive) return 1;
    if (a.role === 'executive' && b.role !== 'executive') return -1;
    if (b.role === 'executive' && a.role !== 'executive') return 1;
    return b.contextualLegitimacy - a.contextualLegitimacy;
  });

  // 3. Dominant governance structure.
  const supportingSystems: CognitiveSystem[] = governanceRoles
    .filter((r) =>
      (r.role === 'stabilizer' || r.role === 'trust-guardian' || r.role === 'identity-preserver' ||
       r.role === 'cultural-adapter' || r.role === 'fatigue-regulator' || r.role === 'novelty-driver') &&
      r.system !== primaryExecutive)
    .slice(0, 3)
    .map((r) => r.system);
  const suppressedListed: CognitiveSystem[] = governanceRoles
    .filter((r) => r.role === 'suppressed-authority' || r.role === 'shadow-executive')
    .slice(0, 3)
    .map((r) => r.system);
  const dominantGovernanceStructure: DominantGovernanceStructure = {
    primaryExecutive,
    supportingSystems,
    suppressedSystems: suppressedListed,
    explanation: primaryExecutive
      ? `${primaryExecutive} leading · supported by ${supportingSystems.join(', ') || 'no supporting brains'} · ${suppressedListed.length} system(s) historically suppressed`
      : 'no clear executive — no brain has accumulated enough authority',
  };

  // 4. Authority transitions (history tail).
  const authorityTransitions: AuthorityTransitionEntry[] =
    input.history?.recentTransitions?.slice(-6) ?? [];

  // 5. Shadow executives + suppressed authorities.
  const shadowExecutives = deriveShadowExecutives(input);
  const suppressedAuthorities = deriveSuppressedAuthorities(input);

  // 6. Governance conflicts.
  const governanceConflicts = deriveGovernanceConflicts(input);

  // 7. Stabilization / destabilization / fingerprints from memory.
  const stabilizationPatterns = deriveStabilizationPatterns(input.history);
  const destabilizationPatterns = deriveDestabilizationPatterns(input.history);
  const behavioralGovernanceFingerprint = deriveBehavioralFingerprints(input.history);

  // 8. Contextual leadership rules.
  const contextualLeadershipRules = buildContextualRules(input);

  // 9. Overreach + collapse risks.
  const executiveOverreachRisks = deriveExecutiveOverreachRisks(input);
  const authorityCollapseRisks = deriveAuthorityCollapseRisks(input);

  // 10. Long-term authority drift table.
  const longTermAuthorityDrift: AuthorityDriftEntry[] = ALL_COGNITIVE_SYSTEMS
    .map((s) => {
      const recent = round1(authorityOf(cw, s));
      const historical = round1(input.history?.authorityEwma?.[s] ?? recent);
      return {
        system: s,
        recentAuthority: recent,
        historicalAuthority: historical,
        drift: round1(recent - historical),
      };
    })
    .filter((r) => Math.abs(r.drift) >= 0.5)
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
    .slice(0, 6);

  // 11. Aggregate scalars.
  const governancePressure = deriveGovernancePressure(input);
  const authorityFragmentation = round1(clamp10(
    (cw?.cognitiveFragmentation ?? 0) * 0.5 +
    governanceConflicts.length * 1.2 +
    (input.history?.recentFragmentation ?? 0) * 0.3,
  ));
  const governanceStability = round1(clamp10(
    (cw?.globalStability ?? 5) * 0.45 +
    (10 - authorityFragmentation) * 0.35 +
    (input.history?.recentStability ?? 5) * 0.2,
  ));
  // executiveLegitimacy reflects the primary executive's legitimacy
  // regardless of whether its role label is 'executive' or a more
  // specific functional role (trust-guardian, novelty-driver, etc.).
  const primaryRole = governanceRoles.find((r) => r.system === primaryExecutive);
  const executiveLegitimacy = round1(primaryRole?.contextualLegitimacy ?? 0);
  const adaptiveBalance = round1(clamp10(
    governanceStability * 0.4 +
    (10 - governancePressure.adaptationPressure) * 0.3 +
    (10 - executiveOverreachRisks.reduce((a, r) => a + r.overreachScore, 0) / Math.max(1, executiveOverreachRisks.length)) * 0.3,
  ));

  // 12. Reason codes — audit trail.
  reasonCodes.push(
    `primaryExecutive:${primaryExecutive ?? 'none'}`,
    `governanceStability:${governanceStability}`,
    `executiveLegitimacy:${executiveLegitimacy}`,
    `authorityFragmentation:${authorityFragmentation}`,
    `adaptiveBalance:${adaptiveBalance}`,
    `roles:${governanceRoles.length}`,
    `shadow-executives:${shadowExecutives.length}`,
    `overreach-risks:${executiveOverreachRisks.length}`,
    `collapse-risks:${authorityCollapseRisks.length}`,
  );
  if (input.counterfactual !== undefined) reasonCodes.push('counterfactual-channel:provided');
  if (input.metaCognitiveReflection !== undefined) reasonCodes.push('meta-cognitive-channel:provided');
  if (input.history) reasonCodes.push(`history-observations:${input.history.observationCount}`);

  return {
    governanceStability,
    executiveLegitimacy,
    authorityFragmentation,
    adaptiveBalance,
    dominantGovernanceStructure,
    governanceRoles,
    authorityTransitions,
    suppressedAuthorities,
    shadowExecutives,
    governanceConflicts,
    stabilizationPatterns,
    destabilizationPatterns,
    contextualLeadershipRules,
    authorityCollapseRisks,
    executiveOverreachRisks,
    governancePressure,
    longTermAuthorityDrift,
    behavioralGovernanceFingerprint,
    reasonCodes,
  };
}
