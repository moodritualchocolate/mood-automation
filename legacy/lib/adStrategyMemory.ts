/**
 * AD STRATEGY MEMORY (Strategist Brain — Phase Next)
 *
 * Persistent strategic-advertising memory. The Ad Strategy Brain
 * decides WHY an ad should exist, WHO it's for, WHAT psychological
 * wound it targets, WHAT market pressure it answers, and WHAT
 * campaign role the output should play.
 *
 * NOT copywriting. NOT image generation. Pure strategic intelligence
 * accumulated from real generation history. Same history → same
 * strategy.
 *
 * Lives at data/memory/ad-strategy-memory.json. All histories
 * FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'ad-strategy-memory.json';

export const AUDIENCE_HISTORY_LIMIT = 32;
export const PAIN_HISTORY_LIMIT = 32;
export const DESIRE_HISTORY_LIMIT = 32;
export const OBJECTION_HISTORY_LIMIT = 32;
export const ANGLE_HISTORY_LIMIT = 48;
export const ROLE_HISTORY_LIMIT = 32;
export const FAILED_ANGLE_LIMIT = 24;
export const SUCCESS_PATTERN_LIMIT = 24;
export const RISK_HISTORY_LIMIT = 32;

// ─── archetypes + roles ────────────────────────────────────────

export type AudienceArchetype =
  | 'tired_parent'
  | 'office_worker'
  | 'founder_creator'
  | 'student_focus'
  | 'overworked_professional'
  | 'wellness_skeptic'
  | 'night_overthinker'
  | 'high_performer'
  | 'emotionally_drained_adult';

export const ALL_AUDIENCES: AudienceArchetype[] = [
  'tired_parent', 'office_worker', 'founder_creator', 'student_focus',
  'overworked_professional', 'wellness_skeptic', 'night_overthinker',
  'high_performer', 'emotionally_drained_adult',
];

export type CampaignRole =
  | 'awareness'
  | 'curiosity'
  | 'objection_breaker'
  | 'trust_builder'
  | 'conversion_push'
  | 'retargeting_memory'
  | 'ritual_education'
  | 'product_proof'
  | 'emotional_mirror'
  | 'social_share_trigger';

export const ALL_ROLES: CampaignRole[] = [
  'awareness', 'curiosity', 'objection_breaker', 'trust_builder',
  'conversion_push', 'retargeting_memory', 'ritual_education',
  'product_proof', 'emotional_mirror', 'social_share_trigger',
];

export type PersuasionMode =
  | 'narrative'
  | 'observational'
  | 'demonstrative'
  | 'empathic'
  | 'minimal'
  | 'aspirational'
  | 'specification'
  | 'confrontational';

export type StoryShape =
  | 'reveal'        // hidden truth surfaces
  | 'mirror'        // reflect what audience already feels
  | 'pivot'         // change frame mid-asset
  | 'witness'       // documentary observation
  | 'unspoken'      // negative space carries
  | 'demonstration'; // proof-by-doing

// ─── historical observation records ────────────────────────────

export interface StrategyObservation {
  at: number;
  bannerId: string;
  audience: AudienceArchetype;
  wound: string;
  desire: string;
  objection: string;
  angle: string;            // one-line angle summary
  role: CampaignRole;
  proofNeed: 'low' | 'medium' | 'high';
  urgencyLevel: number;     // 0..10
  outcome: 'pending' | 'approved' | 'refused';
}

export interface FailedAngleRecord {
  at: number;
  bannerId: string;
  angle: string;
  audience: AudienceArchetype;
  role: CampaignRole;
  reasons: string[];
}

export interface SuccessfulPatternRecord {
  at: number;
  bannerId: string;
  audience: AudienceArchetype;
  role: CampaignRole;
  persuasionMode: PersuasionMode;
  proofNeed: 'low' | 'medium' | 'high';
  strategicDepth: number;   // 0..10
}

export interface RiskSample {
  at: number;
  repetitionRisk: number;   // 0..10
  trustDebt: number;        // 0..10
  brandRisk: number;        // 0..10
}

export interface AudienceFatigueRecord {
  audience: AudienceArchetype;
  usageCount: number;
  /** EWMA-smoothed recency weight 0..1 — recently used = higher. */
  recency: number;
  lastUsedAt: number | null;
}

export interface AdStrategyMemoryState {
  audienceHistory: StrategyObservation[];
  painHistory: string[];                        // wound vocabulary used
  desireHistory: string[];                      // desire vocabulary used
  objectionHistory: string[];
  angleHistory: string[];                       // angle strings
  offerFramingHistory: string[];
  roleHistory: CampaignRole[];
  failedAngles: FailedAngleRecord[];
  successfulPatterns: SuccessfulPatternRecord[];
  repetitionRiskHistory: RiskSample[];          // capped FIFO of all three risks
  persuasionDepthHistory: number[];             // 0..10 per assessment
  /** Running brand-dignity score 0..10. Drops on aggressive low-restraint
   *  patterns; recovers on restrained/trust-builder/proof patterns. */
  brandDignityScore: number;
  /** Running trust-debt score 0..10. Rises with weak-proof + high-urgency
   *  + repetition; decays slowly otherwise. */
  trustDebt: number;
  /** Per-audience fatigue rolled forward. */
  audienceFatigue: Record<AudienceArchetype, AudienceFatigueRecord>;
  totalAssessments: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

function seedAudienceFatigue(): Record<AudienceArchetype, AudienceFatigueRecord> {
  const f: Partial<Record<AudienceArchetype, AudienceFatigueRecord>> = {};
  for (const a of ALL_AUDIENCES) {
    f[a] = { audience: a, usageCount: 0, recency: 0, lastUsedAt: null };
  }
  return f as Record<AudienceArchetype, AudienceFatigueRecord>;
}

export function createInitialAdStrategyMemory(): AdStrategyMemoryState {
  return {
    audienceHistory: [],
    painHistory: [],
    desireHistory: [],
    objectionHistory: [],
    angleHistory: [],
    offerFramingHistory: [],
    roleHistory: [],
    failedAngles: [],
    successfulPatterns: [],
    repetitionRiskHistory: [],
    persuasionDepthHistory: [],
    brandDignityScore: 7,
    trustDebt: 0,
    audienceFatigue: seedAudienceFatigue(),
    totalAssessments: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodAdStrategy?: AdStrategyMemoryState };

export interface AdStrategyMemoryStore {
  read(): Promise<AdStrategyMemoryState>;
  save(state: AdStrategyMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createAdStrategyMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): AdStrategyMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodAdStrategy) return g.__moodAdStrategy;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<AdStrategyMemoryState>;
        g.__moodAdStrategy = {
          ...createInitialAdStrategyMemory(),
          ...parsed,
          // Defensive: ensure all audience fatigue entries exist.
          audienceFatigue: {
            ...seedAudienceFatigue(),
            ...(parsed.audienceFatigue ?? {}),
          },
        };
      } catch {
        g.__moodAdStrategy = createInitialAdStrategyMemory();
      }
      return g.__moodAdStrategy;
    },
    async save(state) {
      state.audienceHistory      = state.audienceHistory.slice(-AUDIENCE_HISTORY_LIMIT);
      state.painHistory          = state.painHistory.slice(-PAIN_HISTORY_LIMIT);
      state.desireHistory        = state.desireHistory.slice(-DESIRE_HISTORY_LIMIT);
      state.objectionHistory     = state.objectionHistory.slice(-OBJECTION_HISTORY_LIMIT);
      state.angleHistory         = state.angleHistory.slice(-ANGLE_HISTORY_LIMIT);
      state.offerFramingHistory  = state.offerFramingHistory.slice(-ANGLE_HISTORY_LIMIT);
      state.roleHistory          = state.roleHistory.slice(-ROLE_HISTORY_LIMIT);
      state.failedAngles         = state.failedAngles.slice(-FAILED_ANGLE_LIMIT);
      state.successfulPatterns   = state.successfulPatterns.slice(-SUCCESS_PATTERN_LIMIT);
      state.repetitionRiskHistory = state.repetitionRiskHistory.slice(-RISK_HISTORY_LIMIT);
      state.persuasionDepthHistory = state.persuasionDepthHistory.slice(-RISK_HISTORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodAdStrategy = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodAdStrategy = undefined;
    },
  };
}
