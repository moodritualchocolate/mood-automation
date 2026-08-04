/**
 * COPY-QUALITY POLICY PREFLIGHT
 *
 * Thin route-side adapter. Decides at /api/generate request-time
 * whether to default-fill the `copyQualityRefusalEnabled` flag when
 * the caller omitted it. EXPLICIT request values ALWAYS win — the
 * preflight only fires for `undefined`.
 *
 * Reuses computeCopyQualityPolicy (no duplicate engine) by
 * synthesizing minimal-but-safe inputs from what's known before the
 * pipeline runs: formula, campaignMode, brutality, and the latest
 * persisted ad-strategy memory.
 *
 * Synchronous compute. The only async work is reading the persisted
 * strategy memory; this is wrapped so a read failure degrades to
 * "policy-default off" rather than blocking the request.
 */

import type { CampaignMode, Formula } from '@/core/types';
import { CAMPAIGN_MODES, FORMULAS } from '@/core/types';
import type { AdStrategyAssessment } from './adStrategyEngine';
import type {
  AdStrategyMemoryState, AudienceArchetype, CampaignRole,
} from './adStrategyMemory';
import {
  computeCopyQualityPolicy, type PolicyBand,
} from './copyQualityPolicy';
import { createAdStrategyMemoryStore } from './adStrategyMemory';

// ─── mode → preflight defaults ────────────────────────────────
//
// Mirrors the strategy engine's tendencies, not its full logic. These
// are deliberate pre-pipeline approximations — the per-attempt policy
// computed inside the pipeline still runs with real data and will
// produce a sharper picture in the banner.

const MODE_DEFAULTS: Record<CampaignMode, {
  proofNeed: 'low' | 'medium' | 'high';
  defaultRole: CampaignRole;
  defaultAudience: AudienceArchetype;
}> = {
  'Editorial':       { proofNeed: 'medium', defaultRole: 'trust_builder',    defaultAudience: 'overworked_professional' },
  'Documentary':     { proofNeed: 'high',   defaultRole: 'trust_builder',    defaultAudience: 'wellness_skeptic' },
  'Performance':     { proofNeed: 'medium', defaultRole: 'product_proof',    defaultAudience: 'high_performer' },
  'Emotional':       { proofNeed: 'low',    defaultRole: 'emotional_mirror', defaultAudience: 'emotionally_drained_adult' },
  'Minimal':         { proofNeed: 'low',    defaultRole: 'awareness',        defaultAudience: 'office_worker' },
  'Aggressive':      { proofNeed: 'low',    defaultRole: 'conversion_push',  defaultAudience: 'office_worker' },
  'Luxury':          { proofNeed: 'medium', defaultRole: 'trust_builder',    defaultAudience: 'founder_creator' },
  'Product-focused': { proofNeed: 'high',   defaultRole: 'product_proof',    defaultAudience: 'office_worker' },
};

const AUTO_DEFAULT = {
  proofNeed: 'medium' as const,
  defaultRole: 'awareness' as CampaignRole,
  defaultAudience: 'office_worker' as AudienceArchetype,
};

const SAFE_FALLBACK_FORMULA: Formula = 'ENERGY';

/** Resolve a possibly-unknown campaign mode to a known one, or null
 *  to mean "AUTO". Never throws. Returns a tag describing whether the
 *  input was honored or coerced so the audit trail can record it. */
function resolveCampaignMode(
  raw: CampaignMode | null | undefined,
): { mode: CampaignMode | null; coerced: boolean; originalLabel: string | null } {
  if (raw === null || raw === undefined) {
    return { mode: null, coerced: false, originalLabel: null };
  }
  if ((CAMPAIGN_MODES as readonly string[]).includes(raw as string)) {
    return { mode: raw as CampaignMode, coerced: false, originalLabel: raw as string };
  }
  return { mode: null, coerced: true, originalLabel: String(raw) };
}

/** Resolve a possibly-unknown formula to a known one. Unknown values
 *  fall back to ENERGY (the V1 ship target). Never throws. */
function resolveFormula(
  raw: Formula | null | undefined,
): { formula: Formula; coerced: boolean; originalLabel: string | null } {
  if (raw === null || raw === undefined) {
    return { formula: SAFE_FALLBACK_FORMULA, coerced: true, originalLabel: null };
  }
  if ((FORMULAS as readonly string[]).includes(raw as string)) {
    return { formula: raw as Formula, coerced: false, originalLabel: raw as string };
  }
  return { formula: SAFE_FALLBACK_FORMULA, coerced: true, originalLabel: String(raw) };
}

// ─── output shape ─────────────────────────────────────────────

export type PreflightSource = 'explicit-true' | 'explicit-false' | 'policy-default';

export interface CopyQualityPolicyPreflight {
  /** True ⇔ the route applied a policy-based default (request omitted
   *  the flag). False when the explicit value was honored. */
  applied: boolean;
  /** Where the final flag value came from. */
  source: PreflightSource;
  /** Final value of copyQualityRefusalEnabled after preflight. */
  enabled: boolean;
  policyBand: PolicyBand;
  confidence: number;
  reasonCodes: string[];
}

// ─── minimal strategy synthesis ───────────────────────────────

function synthesizeMinimalStrategy(
  campaignMode: CampaignMode | null,
  memory: AdStrategyMemoryState | null,
): AdStrategyAssessment {
  // Defensive lookup: an unknown campaignMode (e.g. case-mismatched
  // input from a caller) must never crash the preflight. Fall back
  // to AUTO_DEFAULT silently — the resolveCampaignMode caller logs
  // the coercion in reasonCodes.
  const md = (campaignMode && MODE_DEFAULTS[campaignMode]) || AUTO_DEFAULT;
  // Use the memory's running trustDebt — that's the realistic
  // pre-pipeline starting point for this layer.
  const trustDebt = memory?.trustDebt ?? 0;
  return {
    primaryAudience: md.defaultAudience,
    secondaryAudience: null,
    emotionalWound: 'preflight-placeholder',
    hiddenDesire: 'preflight-placeholder',
    surfaceObjection: 'preflight-placeholder',
    deeperObjection: 'preflight-placeholder',
    trustBarrier: 'preflight-placeholder',
    campaignRole: md.defaultRole,
    recommendedAngle: '[preflight] minimal synthesis from mode',
    forbiddenAngle: 'preflight-none',
    persuasionMode: 'observational',
    storyShape: 'mirror',
    proofNeed: md.proofNeed,
    urgencyLevel: 3,
    repetitionRisk: 0,
    brandRisk: 0,
    trustDebt,
    strategicDepth: 5,
    confidence: 5,
    reasonCodes: ['preflight-synthesis'],
    creativeConstraints: {
      hookIntensity: 5, productVisibility: 5, textAmount: 'minimal',
      ctaStrength: 4, emotionalDirectness: 5, proofRequirement: md.proofNeed,
      criticStrictnessRecommendation: 'baseline',
    },
  };
}

// ─── main ──────────────────────────────────────────────────────

export interface PreflightInput {
  /** Whether the request explicitly set copyQualityRefusalEnabled. */
  explicitFlag: boolean | undefined;
  formula: Formula;
  campaignMode: CampaignMode | null;
  brutality: number;
  /** Optional pre-fetched memory; otherwise the helper reads it. */
  strategyMemory?: AdStrategyMemoryState | null;
}

/** Safe degraded return used whenever the preflight cannot complete
 *  for any reason. Architecture rule: preflight is advisory; it must
 *  never crash generation. recommendedEnabled=false is the safe
 *  default (the pipeline still runs; the flag simply stays off). */
function safeDegraded(reasonCodes: string[]): CopyQualityPolicyPreflight {
  return {
    applied: true,
    source: 'policy-default',
    enabled: false,
    policyBand: 'off',
    confidence: 0,
    reasonCodes,
  };
}

export async function runCopyQualityPolicyPreflight(
  input: PreflightInput,
): Promise<CopyQualityPolicyPreflight> {
  // 1. Explicit value wins — short-circuit, no policy compute.
  if (input.explicitFlag === true) {
    return {
      applied: false, source: 'explicit-true', enabled: true,
      policyBand: 'off', confidence: 10,
      reasonCodes: ['request set copyQualityRefusalEnabled=true; preflight skipped'],
    };
  }
  if (input.explicitFlag === false) {
    return {
      applied: false, source: 'explicit-false', enabled: false,
      policyBand: 'off', confidence: 10,
      reasonCodes: ['request set copyQualityRefusalEnabled=false; preflight skipped'],
    };
  }

  // 2. Defensive normalization — never trust raw inputs.
  // Unknown formula → ENERGY safe profile. Unknown mode → AUTO.
  const fallbackCodes: string[] = [];
  const resolvedMode = resolveCampaignMode(input.campaignMode);
  if (resolvedMode.coerced) {
    fallbackCodes.push(
      `preflight:unknown-campaignMode-coerced-to-AUTO[${resolvedMode.originalLabel}]`,
    );
  }
  const resolvedFormula = resolveFormula(input.formula);
  if (resolvedFormula.coerced) {
    fallbackCodes.push(
      `preflight:unknown-formula-coerced-to-${SAFE_FALLBACK_FORMULA}[${resolvedFormula.originalLabel}]`,
    );
  }

  // 3. Omitted → compute policy from minimal-but-safe inputs.
  // Whole compute block is wrapped: any unexpected throw degrades to
  // safe "off" rather than crashing /api/generate.
  try {
    let memory: AdStrategyMemoryState | null = input.strategyMemory ?? null;
    if (!memory) {
      try {
        memory = await createAdStrategyMemoryStore().read();
      } catch {
        // degrade gracefully — empty memory means policy will lean off.
        memory = null;
      }
    }

    const strategy = synthesizeMinimalStrategy(resolvedMode.mode, memory);
    const recommendation = computeCopyQualityPolicy({
      formula: resolvedFormula.formula,
      campaignMode: resolvedMode.mode,
      brutality: input.brutality,
      strategy,
      strategyMemory: memory,
      copyQuality: null,           // unknown pre-pipeline
      longitudinal: null,          // not joined at preflight time
    });

    return {
      applied: true,
      source: 'policy-default',
      enabled: recommendation.recommendedEnabled,
      policyBand: recommendation.policyBand,
      confidence: recommendation.confidence,
      reasonCodes: [
        'preflight:omitted-flag',
        ...fallbackCodes,
        ...recommendation.reasonCodes.slice(0, 8),
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return safeDegraded([
      'preflight:omitted-flag',
      ...fallbackCodes,
      `preflight:exception-degraded-to-off[${message.slice(0, 120)}]`,
    ]);
  }
}
