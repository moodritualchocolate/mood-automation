/**
 * COUNTERFACTUAL COGNITION ENGINE
 *
 * Deterministic, read-only multi-path CREATIVE STRATEGY simulation.
 * For each candidate alternate governing brain, projects what kind
 * of campaign would have emerged — concrete campaign archetype,
 * creative direction shift, audience emotional shift, and seven
 * impact axes (trust · fatigue · durability · conversion · long-term
 * brand · creative · emotional).
 *
 * THE ENGINE IS NOT:
 *   asking "what intelligence could I have been"
 * THE ENGINE IS:
 *   asking "what persuasive structure would likely emerge if a
 *           different cognitive priority dominated this campaign"
 *
 * STRICTLY:
 *   - no autonomous generation branching
 *   - no automatic creative rewriting
 *   - no orchestration mutation / self-modification
 *   - no strategy replacement
 *   - simulation-only output
 *   - same inputs → same projections
 *
 * Imports: only data types. No critic/pipeline imports.
 */

import type { AdStrategyAssessment } from './adStrategyEngine';
import type { CulturalPerception } from './culturalPerceptionEngine';
import type { CrossBrainConflict } from './crossBrainConflictEngine';
import type {
  CognitiveWeightEvolution, CognitiveSystem,
} from './cognitiveWeightEvolution';
import { ALL_COGNITIVE_SYSTEMS } from './cognitiveWeightEvolution';
import type { ExecutiveGovernance } from './executiveGovernanceEngine';
import type { IdentityContinuity } from './identityContinuityEngine';
import type { StrategicOutcomeIntelligence } from './strategicOutcomeIntelligence';

// ─── taxonomy ──────────────────────────────────────────────────

export type CampaignArchetype =
  | 'high-trust-documentary'
  | 'aggressive-performance'
  | 'quiet-authority'
  | 'emotion-first'
  | 'novelty-surge'
  | 'premium-restraint'
  | 'fatigue-safe'
  | 'viral-instability'
  | 'high-curiosity-hook-heavy'
  | 'proof-driven-authority'
  | 'audience-mirror'
  | 'culture-synchronized';

export const ALL_CAMPAIGN_ARCHETYPES: CampaignArchetype[] = [
  'high-trust-documentary', 'aggressive-performance', 'quiet-authority',
  'emotion-first', 'novelty-surge', 'premium-restraint',
  'fatigue-safe', 'viral-instability', 'high-curiosity-hook-heavy',
  'proof-driven-authority', 'audience-mirror', 'culture-synchronized',
];

// ─── projection shape ─────────────────────────────────────────

export interface CounterfactualProjection {
  /** The cognitive brain assumed to have led this counterfactual run. */
  alternateLeader: CognitiveSystem;
  /** Concrete campaign archetype the projection would have become. */
  counterfactualCampaignArchetype: CampaignArchetype;
  /** Plain-language description of the archetype. */
  archetypeDescription: string;

  // The 7 required impact axes ─────────────────────────────────
  /** Description of how the creative direction would have shifted. */
  creativeDirectionShift: string;
  /** Description of the audience-emotional axis shift. */
  audienceEmotionalShift: string;
  /** -10 (severe loss) .. +10 (compounding gain). */
  trustImpact: number;
  /** -10 (relieves fatigue) .. +10 (adds fatigue). */
  fatigueImpact: number;
  /** -10 (erodes durability) .. +10 (compounds durability). */
  durabilityImpact: number;
  /** Description of how the conversion approach would have shifted. */
  conversionStyleShift: string;
  /** Description of the long-term brand effect. */
  longTermBrandEffect: string;

  // Meta scores ────────────────────────────────────────────────
  /** 0..10 — how different from the actual shipped campaign. */
  divergenceFromActual: number;
  /** 0..10 — how realistic this counterfactual is given the
   *  current contextual evidence (legitimacy + cognitive weight). */
  plausibility: number;

  reasonCodes: string[];
}

// ─── output shape ──────────────────────────────────────────────

export interface CounterfactualCognition {
  actualLeader: CognitiveSystem | null;
  actualArchetype: CampaignArchetype | null;

  projections: CounterfactualProjection[];
  highImpactPaths: CounterfactualProjection[];
  lowDivergencePaths: CounterfactualProjection[];

  trustOptimizedPath: CounterfactualProjection | null;
  durabilityOptimizedPath: CounterfactualProjection | null;
  fatigueAwarePath: CounterfactualProjection | null;

  /** archetype → average divergence across projections. */
  divergenceMap: Record<string, number>;

  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

export interface CounterfactualCognitionInput {
  strategy?: AdStrategyAssessment | null;
  conflict?: CrossBrainConflict | null;
  culturalPerception?: CulturalPerception | null;
  cognitiveWeight?: CognitiveWeightEvolution | null;
  identityContinuity?: IdentityContinuity | null;
  executiveGovernance?: ExecutiveGovernance | null;
  strategicOutcome?: StrategicOutcomeIntelligence | null;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function clampImpact(n: number): number { return clamp(-10, 10, Math.round(n * 10) / 10); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

// ─── archetype assignment per (leader × context) ──────────────

interface ArchetypeMatch {
  archetype: CampaignArchetype;
  description: string;
}

function archetypeForLeader(
  leader: CognitiveSystem,
  i: CounterfactualCognitionInput,
): ArchetypeMatch {
  const c = i.culturalPerception;
  const strat = i.strategy;
  const trustClimate = c?.trustClimate ?? 5;
  const audienceNumbness = c?.audienceNumbness ?? 3;
  const noveltyScore = c?.noveltyScore ?? 5;
  const overPerformed = c?.dominantSignals.includes('over-performed') ?? false;
  const trustFragile = c?.dominantSignals.includes('trust-fragile') ?? false;

  switch (leader) {
    case 'trust':
      return trustFragile
        ? { archetype: 'high-trust-documentary', description: 'documentary realism, restrained voice, explicit credibility signals' }
        : { archetype: 'premium-restraint', description: 'premium aesthetic with restrained pacing — quiet but credible' };

    case 'strategy':
      if (strat && (strat.urgencyLevel >= 6 || strat.creativeConstraints.ctaStrength >= 6) && trustClimate <= 5) {
        return { archetype: 'aggressive-performance', description: 'high-CTA performance push, urgency-led close' };
      }
      if (strat && strat.proofNeed === 'high') {
        return { archetype: 'proof-driven-authority', description: 'authoritative proof-led campaign with explicit evidence' };
      }
      return { archetype: 'aggressive-performance', description: 'conversion-led push with stronger CTA than current run' };

    case 'culture':
      return c && (c.emotionalDrift.movingToward.length + c.emotionalDrift.movingAwayFrom.length) >= 2
        ? { archetype: 'culture-synchronized', description: 'campaign tracking active emotional-cultural drift' }
        : { archetype: 'audience-mirror', description: 'reflecting current audience emotional state without amplifying it' };

    case 'novelty':
      return trustClimate >= 6
        ? { archetype: 'novelty-surge', description: 'novelty-forward exploration under stable trust ground' }
        : { archetype: 'viral-instability', description: 'novelty-forward variant with unstable foundation — high reach but trust-thin' };

    case 'fatigue':
      return audienceNumbness >= 6
        ? { archetype: 'fatigue-safe', description: 'minimal stimulation, deliberately quieter cadence' }
        : { archetype: 'quiet-authority', description: 'restrained pacing protecting against future fatigue' };

    case 'quality':
      return strat && strat.proofNeed === 'high'
        ? { archetype: 'proof-driven-authority', description: 'integrity-first variant with proof line in foreground' }
        : { archetype: 'premium-restraint', description: 'quality-led restraint — copy integrity over reach' };

    case 'emotion':
      return audienceNumbness <= 4
        ? { archetype: 'emotion-first', description: 'emotional resonance dominates — empathy / narrative anchor' }
        : { archetype: 'audience-mirror', description: 'softened emotional reflection to avoid further numbing' };

    case 'authenticity':
      return overPerformed
        ? { archetype: 'quiet-authority', description: 'authenticity-forward retreat from performance-coded patterns' }
        : { archetype: 'audience-mirror', description: 'authentic reflection of audience truth — observational tone' };

    case 'restraint':
      return overPerformed
        ? { archetype: 'quiet-authority', description: 'restraint-led campaign — silence as positioning' }
        : { archetype: 'premium-restraint', description: 'minimal output footprint — fewer hooks, more space' };

    case 'proof':
      return { archetype: 'proof-driven-authority', description: 'evidence-forward — proof line load-bearing' };

    case 'performance-memory':
      return { archetype: 'aggressive-performance', description: 'patterns that historically converted — repeat what worked' };

    case 'policy':
      return { archetype: 'fatigue-safe', description: 'cautious policy-aware variant — slower, safer pace' };

    default:
      return { archetype: 'audience-mirror', description: 'undefined leader → reflective baseline' };
  }
}

// ─── per-archetype impact + shift descriptors ─────────────────

interface ArchetypeImpactProfile {
  trust: number;
  fatigue: number;
  durability: number;
  creativeDirectionShift: string;
  audienceEmotionalShift: string;
  conversionStyleShift: string;
  longTermBrandEffect: string;
}

const ARCHETYPE_PROFILES: Record<CampaignArchetype, ArchetypeImpactProfile> = {
  'high-trust-documentary': {
    trust: 4, fatigue: -1, durability: 4,
    creativeDirectionShift: 'shift toward documentary observation, hand-held framing, less designed typography',
    audienceEmotionalShift: 'audience moves from being-sold-to → being-observed-with',
    conversionStyleShift: 'soft inquiry replacing urgency-led close — long-form trust before ask',
    longTermBrandEffect: 'brand equity compounds slowly; conversion lags but resilience deepens',
  },
  'aggressive-performance': {
    trust: -4, fatigue: 3, durability: -4,
    creativeDirectionShift: 'shift toward loud typography, high hook-intensity, foreground product',
    audienceEmotionalShift: 'audience moves from interest → defensive pressure-response',
    conversionStyleShift: 'urgency-led close with hard CTA — short-term lift, fast-decay attention',
    longTermBrandEffect: 'short-term metrics improve while long-term brand trust erodes',
  },
  'quiet-authority': {
    trust: 3, fatigue: -3, durability: 3,
    creativeDirectionShift: 'shift toward minimal typography, negative space, single focal point',
    audienceEmotionalShift: 'audience moves from over-stimulated → curiosity-engaged',
    conversionStyleShift: 'restrained CTA — the silence does the work',
    longTermBrandEffect: 'category-defining positioning accumulates; opt-out from attention war',
  },
  'emotion-first': {
    trust: 1, fatigue: 1, durability: 1,
    creativeDirectionShift: 'shift toward emotional core, body-language framing, internal-voice tone',
    audienceEmotionalShift: 'audience moves from cognitive → embodied recognition',
    conversionStyleShift: 'feeling-anchored close — converts on resonance, not pressure',
    longTermBrandEffect: 'emotional permanence in memory; effectiveness varies with cultural moment',
  },
  'novelty-surge': {
    trust: 0, fatigue: -1, durability: 1,
    creativeDirectionShift: 'shift toward unexpected composition, novel hook architecture',
    audienceEmotionalShift: 'audience moves from familiar → genuinely surprised',
    conversionStyleShift: 'curiosity-led pull — converts via "wait, what is this?"',
    longTermBrandEffect: 'short-term distinctiveness wins; depends on follow-through to compound',
  },
  'premium-restraint': {
    trust: 3, fatigue: -2, durability: 3,
    creativeDirectionShift: 'shift toward editorial restraint, typography-as-design, whitespace dominant',
    audienceEmotionalShift: 'audience moves from being-targeted → being-included',
    conversionStyleShift: 'discovery-led close — fewer asks, higher quality of yes',
    longTermBrandEffect: 'positions the brand above the category noise floor',
  },
  'fatigue-safe': {
    trust: 1, fatigue: -4, durability: 2,
    creativeDirectionShift: 'shift toward quieter pacing, lower stimulation density',
    audienceEmotionalShift: 'audience moves from saturated → recovering',
    conversionStyleShift: 'patient close — conversion deferred to lower-fatigue surface',
    longTermBrandEffect: 'protects audience welcome; trades volume for sustainability',
  },
  'viral-instability': {
    trust: -3, fatigue: -1, durability: -4,
    creativeDirectionShift: 'shift toward attention-grabbing novelty without trust scaffolding',
    audienceEmotionalShift: 'audience moves from neutral → suspicious-but-curious',
    conversionStyleShift: 'reach-led close — high impressions, low durable conversion',
    longTermBrandEffect: 'fast saturation cycle; brand may need recovery period after',
  },
  'high-curiosity-hook-heavy': {
    trust: -1, fatigue: 1, durability: -1,
    creativeDirectionShift: 'shift toward dense hooks, layered curiosity gaps, multiple entry points',
    audienceEmotionalShift: 'audience moves from passive → actively decoding',
    conversionStyleShift: 'pull-through close — converts the curious, loses the tired',
    longTermBrandEffect: 'distinctive voice if hooks land; cognitive load if they don\'t',
  },
  'proof-driven-authority': {
    trust: 4, fatigue: 1, durability: 4,
    creativeDirectionShift: 'shift toward evidence-foreground, proof line carrying composition',
    audienceEmotionalShift: 'audience moves from skeptical → being-shown-the-evidence',
    conversionStyleShift: 'evidence-led close — credibility before persuasion',
    longTermBrandEffect: 'audience builds explicit reasons to trust; word-of-mouth compounds',
  },
  'audience-mirror': {
    trust: 2, fatigue: 0, durability: 2,
    creativeDirectionShift: 'shift toward observational truth, no overlaid frame',
    audienceEmotionalShift: 'audience moves from being-targeted → seeing-themselves',
    conversionStyleShift: 'recognition-led close — the audience sells to itself',
    longTermBrandEffect: 'durable resonance through emotional accuracy',
  },
  'culture-synchronized': {
    trust: 1, fatigue: -1, durability: 2,
    creativeDirectionShift: 'shift toward present-moment cultural cues, native to the current drift',
    audienceEmotionalShift: 'audience moves from outside-context → inside-the-moment',
    conversionStyleShift: 'timing-led close — converts on cultural alignment',
    longTermBrandEffect: 'high relevance now; requires re-anchoring as culture moves',
  },
};

// ─── divergence + plausibility ────────────────────────────────

function divergenceBetween(
  actualLeader: CognitiveSystem | null,
  actualArchetype: CampaignArchetype | null,
  projection: CounterfactualProjection,
): number {
  // Base: 5 if leader differs, 0 if same.
  let d = actualLeader === projection.alternateLeader ? 0 : 5;
  // Archetype differs adds 3.
  if (actualArchetype !== projection.counterfactualCampaignArchetype) d += 3;
  // Magnitude of impacts adds up to 2.
  const impactMag = (Math.abs(projection.trustImpact) +
                     Math.abs(projection.fatigueImpact) +
                     Math.abs(projection.durabilityImpact)) / 3;
  d += clamp(0, 2, impactMag / 4);
  return clamp10(d);
}

function plausibilityOf(
  leader: CognitiveSystem,
  i: CounterfactualCognitionInput,
): number {
  // Base on cognitive weight + governance legitimacy of this leader.
  const cw = i.cognitiveWeight;
  const gov = i.executiveGovernance;
  let base = 5;
  if (cw) {
    const weight = cw.weights[leader] ?? 5;
    base += (weight - 5) * 0.4;
  }
  if (gov) {
    const role = gov.governanceRoles.find((r) => r.system === leader);
    if (role) base += (role.contextualLegitimacy - 5) * 0.3;
    // Shadow executives are PLAUSIBLE — they've earned predictive trust.
    if (gov.shadowExecutives.some((s) => s.system === leader)) base += 1.5;
    // Currently suppressed but historically high → plausible counterfactual.
    if (gov.suppressedAuthorities.some((s) => s.system === leader)) base += 1;
  }
  return clamp10(base);
}

// ─── per-projection compute ───────────────────────────────────

function buildProjection(
  alternateLeader: CognitiveSystem,
  i: CounterfactualCognitionInput,
  actualLeader: CognitiveSystem | null,
  actualArchetype: CampaignArchetype | null,
): CounterfactualProjection {
  const match = archetypeForLeader(alternateLeader, i);
  const profile = ARCHETYPE_PROFILES[match.archetype];
  const reasons: string[] = [
    `leader:${alternateLeader}`,
    `archetype:${match.archetype}`,
  ];

  // Modulate impacts by the live cultural context.
  const c = i.culturalPerception;
  let trustImpact = profile.trust;
  let fatigueImpact = profile.fatigue;
  let durabilityImpact = profile.durability;

  if (c) {
    // Existing trust climate amplifies aggressive/erosive paths.
    if (match.archetype === 'aggressive-performance' && c.trustClimate <= 4) {
      trustImpact -= 2; durabilityImpact -= 2;
      reasons.push('amplified: aggressive under already-fragile trust');
    }
    // Fatigue-safe + currently fatigued = even higher relief.
    if (match.archetype === 'fatigue-safe' && c.audienceNumbness >= 6) {
      fatigueImpact -= 2; durabilityImpact += 1;
      reasons.push('amplified: fatigue-safe under high numbness');
    }
    // Trust-led under fragile trust → larger trust compounding.
    if (match.archetype === 'high-trust-documentary' && c.trustClimate <= 4) {
      trustImpact += 1; durabilityImpact += 1;
      reasons.push('amplified: trust-led under trust collapse');
    }
    // Novelty-surge under low novelty era → bigger durability lift.
    if (match.archetype === 'novelty-surge' && c.noveltyScore <= 4) {
      durabilityImpact += 1;
      reasons.push('amplified: novelty into low-novelty context');
    }
    // Viral-instability under fragmenting trust → further trust loss.
    if (match.archetype === 'viral-instability' && c.trustClimate <= 4) {
      trustImpact -= 1; durabilityImpact -= 1;
      reasons.push('amplified: viral under already-fragile trust');
    }
  }

  // Strategy proofNeed=high makes proof-driven path stronger.
  if (match.archetype === 'proof-driven-authority' && i.strategy?.proofNeed === 'high') {
    trustImpact += 1; durabilityImpact += 1;
    reasons.push('amplified: proof-led matches high proofNeed');
  }

  const projection: CounterfactualProjection = {
    alternateLeader,
    counterfactualCampaignArchetype: match.archetype,
    archetypeDescription: match.description,
    creativeDirectionShift: profile.creativeDirectionShift,
    audienceEmotionalShift: profile.audienceEmotionalShift,
    trustImpact: clampImpact(trustImpact),
    fatigueImpact: clampImpact(fatigueImpact),
    durabilityImpact: clampImpact(durabilityImpact),
    conversionStyleShift: profile.conversionStyleShift,
    longTermBrandEffect: profile.longTermBrandEffect,
    divergenceFromActual: 0,        // filled below
    plausibility: round1(plausibilityOf(alternateLeader, i)),
    reasonCodes: reasons,
  };
  projection.divergenceFromActual = round1(
    divergenceBetween(actualLeader, actualArchetype, projection),
  );
  return projection;
}

// ─── candidate leaders ────────────────────────────────────────

function pickAlternateLeaders(
  i: CounterfactualCognitionInput,
  actualLeader: CognitiveSystem | null,
): CognitiveSystem[] {
  // Prefer: shadow executives + suppressed authorities + top dominant
  // alternates + named contextual leaders. Always exclude actualLeader.
  const set = new Set<CognitiveSystem>();
  const gov = i.executiveGovernance;
  if (gov) {
    for (const s of gov.shadowExecutives) set.add(s.system);
    for (const s of gov.suppressedAuthorities) set.add(s.system);
    for (const s of gov.contextualLeadershipRules) set.add(s.leader);
  }
  // Add the top-weighted non-actual systems if we have room.
  const cw = i.cognitiveWeight;
  if (cw) {
    for (const d of cw.dominantSystems) {
      if (d.system !== actualLeader) set.add(d.system);
    }
  }
  // Fallback — ensure at least 4 alternates from the full system list.
  if (set.size < 4) {
    for (const s of ALL_COGNITIVE_SYSTEMS) {
      if (s === actualLeader) continue;
      set.add(s);
      if (set.size >= 4) break;
    }
  }
  // Remove actualLeader if it snuck in.
  if (actualLeader) set.delete(actualLeader);
  return Array.from(set).slice(0, 6);
}

// ─── main ──────────────────────────────────────────────────────

export function computeCounterfactualCognition(
  input: CounterfactualCognitionInput,
): CounterfactualCognition {
  const reasonCodes: string[] = [];
  const actualLeader = input.executiveGovernance?.dominantGovernanceStructure.primaryExecutive ?? null;
  const actualArchetype = actualLeader
    ? archetypeForLeader(actualLeader, input).archetype
    : null;

  // 1. Candidate alternate leaders.
  const alternates = pickAlternateLeaders(input, actualLeader);

  // 2. Build projections.
  const projections: CounterfactualProjection[] = alternates.map((leader) =>
    buildProjection(leader, input, actualLeader, actualArchetype),
  );

  // 3. Rank slices.
  const sortedByImpactMag = [...projections].sort((a, b) => {
    const ma = Math.abs(a.trustImpact) + Math.abs(a.fatigueImpact) + Math.abs(a.durabilityImpact);
    const mb = Math.abs(b.trustImpact) + Math.abs(b.fatigueImpact) + Math.abs(b.durabilityImpact);
    return mb - ma;
  });
  const highImpactPaths = sortedByImpactMag.slice(0, 3);

  const lowDivergencePaths = [...projections]
    .sort((a, b) => a.divergenceFromActual - b.divergenceFromActual)
    .slice(0, 3);

  const trustOptimizedPath = projections.length > 0
    ? projections.reduce((best, p) => p.trustImpact > best.trustImpact ? p : best)
    : null;
  const durabilityOptimizedPath = projections.length > 0
    ? projections.reduce((best, p) => p.durabilityImpact > best.durabilityImpact ? p : best)
    : null;
  const fatigueAwarePath = projections.length > 0
    ? projections.reduce((best, p) => p.fatigueImpact < best.fatigueImpact ? p : best)
    : null;

  // 4. Divergence map per archetype.
  const divergenceMap: Record<string, number> = {};
  const archetypeAcc = new Map<CampaignArchetype, { sum: number; count: number }>();
  for (const p of projections) {
    const cur = archetypeAcc.get(p.counterfactualCampaignArchetype) ?? { sum: 0, count: 0 };
    archetypeAcc.set(p.counterfactualCampaignArchetype, {
      sum: cur.sum + p.divergenceFromActual,
      count: cur.count + 1,
    });
  }
  for (const [arch, { sum, count }] of archetypeAcc.entries()) {
    divergenceMap[arch] = round1(sum / Math.max(1, count));
  }

  reasonCodes.push(
    `actualLeader:${actualLeader ?? 'none'}`,
    `actualArchetype:${actualArchetype ?? 'none'}`,
    `projections:${projections.length}`,
    `archetypes:${Object.keys(divergenceMap).length}`,
  );

  return {
    actualLeader,
    actualArchetype,
    projections,
    highImpactPaths,
    lowDivergencePaths,
    trustOptimizedPath,
    durabilityOptimizedPath,
    fatigueAwarePath,
    divergenceMap,
    reasonCodes,
  };
}

// ─── export the lookup so memory / view can re-derive when needed
export function describeArchetype(arch: CampaignArchetype): string {
  return ARCHETYPE_PROFILES[arch].longTermBrandEffect;
}
