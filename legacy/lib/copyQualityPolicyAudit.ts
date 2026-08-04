/**
 * COPY-QUALITY POLICY AUDIT TRAIL
 *
 * Persistent governance memory. One entry per generation attempt
 * recording the full picture of what the policy recommended, what the
 * preflight did, what the request did, and what the pipeline shipped.
 *
 * STRICTLY ADVISORY / OBSERVATIONAL:
 *   - does NOT gate generation
 *   - does NOT modify finalVerdict, critic logic, or brutality semantics
 *   - audit write FAILURE is non-fatal (caller swallows)
 *   - audit write happens AFTER verdict + copyQuality exist
 *
 * Lives at data/memory/copy-quality-policy-audit.json. FIFO-capped at
 * 100 entries.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CampaignMode, Formula } from '@/core/types';
import type { PolicyBand } from './copyQualityPolicy';
import type { PreflightSource } from './copyQualityPolicyPreflight';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'copy-quality-policy-audit.json';

export const POLICY_AUDIT_LIMIT = 100;

// ─── enums ─────────────────────────────────────────────────────

/** Classifies how policy and request interacted on this run. */
export type PolicyOverrideType =
  | 'auto-applied'           // request omitted, preflight enabled it
  | 'left-disabled'          // request omitted, preflight left it off
  | 'explicit-override-true' // request explicitly set true
  | 'explicit-override-false'// request explicitly set false (policy did not recommend on)
  | 'recommended-only';      // policy recommended on, but explicit-false overrode it

export type OutcomeVerdict =
  | 'approve' | 'reject-image' | 'reject-concept' | 'reject-taste' | null;

// ─── entry shape ───────────────────────────────────────────────

export interface PolicyAuditEntry {
  id: string;
  at: number;
  formula: Formula;
  campaignMode: CampaignMode | null;
  brutality: number;
  /** What the request set for copyQualityRefusalEnabled. */
  requestedFlag: boolean | undefined;
  /** What the preflight returned. */
  preflightRecommendedEnabled: boolean;
  preflightSource: PreflightSource;
  /** Final value used by the pipeline. */
  finalAppliedEnabled: boolean;
  overrideType: PolicyOverrideType;
  policyBand: PolicyBand;
  confidence: number;
  suggestedIntegrityThreshold: number;
  suggestedBrutalityThreshold: number;
  reasonCodes: string[];
  /** Outcome verdict from finalVerdict.verdict; null if unavailable. */
  outcomeVerdict: OutcomeVerdict;
  outcomeReasons: string[];
  /** Copy-quality axes — null when copyQuality is missing. */
  copyIntegrity: number | null;
  trustSafety: number | null;
  dignitySafety: number | null;
  repetitionConcern: number | null;
}

export interface PolicyAuditState {
  entries: PolicyAuditEntry[];
  totalEntries: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialPolicyAuditState(): PolicyAuditState {
  return {
    entries: [],
    totalEntries: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── override classification ───────────────────────────────────

export interface OverrideClassifierInput {
  requestedFlag: boolean | undefined;
  /** What the in-pipeline policy engine recommended. Preferred source
   *  because it's computed with full data; falls back to preflight
   *  recommendation when the engine signal isn't present. */
  policyRecommendsEnabled: boolean;
  finalAppliedEnabled: boolean;
}

export function classifyOverride(input: OverrideClassifierInput): PolicyOverrideType {
  const { requestedFlag, policyRecommendsEnabled, finalAppliedEnabled } = input;
  if (requestedFlag === true) return 'explicit-override-true';
  if (requestedFlag === false) {
    return policyRecommendsEnabled ? 'recommended-only' : 'explicit-override-false';
  }
  // requestedFlag undefined → preflight controls
  return finalAppliedEnabled ? 'auto-applied' : 'left-disabled';
}

// ─── deterministic id ──────────────────────────────────────────

/** Deterministic ID: ts + formula + mode + attempt index. */
export function buildAuditId(
  at: number, formula: string, campaignMode: string | null, attempt: number,
): string {
  const mode = campaignMode ?? 'auto';
  return `pa-${at}-${formula}-${mode}-${attempt}`;
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodPolicyAudit?: PolicyAuditState };

export interface PolicyAuditStore {
  read(): Promise<PolicyAuditState>;
  append(entry: PolicyAuditEntry): Promise<PolicyAuditState>;
  save(state: PolicyAuditState): Promise<void>;
  reset(): Promise<void>;
}

export function createPolicyAuditStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): PolicyAuditStore {
  const filePath = path.join(dir, FILE);
  const store: PolicyAuditStore = {
    async read() {
      if (g.__moodPolicyAudit) return g.__moodPolicyAudit;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodPolicyAudit = {
          ...createInitialPolicyAuditState(),
          ...(JSON.parse(txt) as Partial<PolicyAuditState>),
        };
      } catch {
        g.__moodPolicyAudit = createInitialPolicyAuditState();
      }
      return g.__moodPolicyAudit;
    },
    async append(entry) {
      const cur = await store.read();
      const next: PolicyAuditState = {
        entries: [...cur.entries, entry].slice(-POLICY_AUDIT_LIMIT),
        totalEntries: cur.totalEntries + 1,
        firstUpdatedAt: cur.firstUpdatedAt ?? entry.at,
        updatedAt: entry.at,
      };
      await store.save(next);
      return next;
    },
    async save(state) {
      state.entries = state.entries.slice(-POLICY_AUDIT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodPolicyAudit = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodPolicyAudit = undefined;
    },
  };
  return store;
}

// ─── safe writer (non-blocking on failure) ────────────────────

export interface RecordAuditInput {
  at: number;
  formula: Formula;
  campaignMode: CampaignMode | null;
  brutality: number;
  attempt: number;
  requestedFlag: boolean | undefined;
  preflightRecommendedEnabled: boolean;
  preflightSource: PreflightSource;
  finalAppliedEnabled: boolean;
  policyBand: PolicyBand;
  confidence: number;
  suggestedIntegrityThreshold: number;
  suggestedBrutalityThreshold: number;
  reasonCodes: string[];
  /** What the in-pipeline policy recommended. Used to distinguish
   *  recommended-only from explicit-override-false. */
  policyRecommendsEnabled: boolean;
  outcomeVerdict: OutcomeVerdict;
  outcomeReasons: string[];
  copyIntegrity: number | null;
  trustSafety: number | null;
  dignitySafety: number | null;
  repetitionConcern: number | null;
}

/** Build an audit entry from the in-flight inputs. Pure — no I/O. */
export function buildAuditEntry(input: RecordAuditInput): PolicyAuditEntry {
  const overrideType = classifyOverride({
    requestedFlag: input.requestedFlag,
    policyRecommendsEnabled: input.policyRecommendsEnabled,
    finalAppliedEnabled: input.finalAppliedEnabled,
  });
  return {
    id: buildAuditId(input.at, input.formula, input.campaignMode, input.attempt),
    at: input.at,
    formula: input.formula,
    campaignMode: input.campaignMode,
    brutality: input.brutality,
    requestedFlag: input.requestedFlag,
    preflightRecommendedEnabled: input.preflightRecommendedEnabled,
    preflightSource: input.preflightSource,
    finalAppliedEnabled: input.finalAppliedEnabled,
    overrideType,
    policyBand: input.policyBand,
    confidence: input.confidence,
    suggestedIntegrityThreshold: input.suggestedIntegrityThreshold,
    suggestedBrutalityThreshold: input.suggestedBrutalityThreshold,
    reasonCodes: input.reasonCodes.slice(0, 12),
    outcomeVerdict: input.outcomeVerdict,
    outcomeReasons: input.outcomeReasons.slice(0, 8),
    copyIntegrity: input.copyIntegrity,
    trustSafety: input.trustSafety,
    dignitySafety: input.dignitySafety,
    repetitionConcern: input.repetitionConcern,
  };
}

/** Convenience: build entry + persist. Swallows write errors so
 *  generation is never blocked. Returns the entry that was written
 *  (or attempted) for the caller. */
export async function recordPolicyAudit(input: RecordAuditInput): Promise<PolicyAuditEntry> {
  const entry = buildAuditEntry(input);
  try {
    await createPolicyAuditStore().append(entry);
  } catch {
    // non-fatal: audit write must not block generation
  }
  return entry;
}
