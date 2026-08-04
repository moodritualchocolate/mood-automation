/**
 * AD STRATEGY ENGINE (Strategist Brain — Phase Next)
 *
 * Deterministic advertising strategy assessment. Given the current
 * organism + creative state (HumanState, HumanTruth, CreativeDirection,
 * CampaignMode + memory of recent angles/audiences), produces an
 * AdStrategyAssessment that decides:
 *   - which audience archetype this asset targets
 *   - which psychological wound it activates
 *   - which hidden desire it invokes
 *   - which surface and deeper objections it must navigate
 *   - which trust barrier blocks acceptance
 *   - which campaign role the creative direction fulfills
 *   - which persuasion mode + story shape + proof need apply
 *   - repetition risk against prior strategies
 *   - trust debt accrued / paid down by this assessment
 *   - brand risk, strategic depth, confidence + reason codes
 *
 * No copywriting. No image generation. No critic weakening.
 * Same history → same strategy.
 */

import type {
  AdStrategyMemoryState, AudienceArchetype, CampaignRole, PersuasionMode,
  StoryShape, StrategyObservation, FailedAngleRecord, SuccessfulPatternRecord,
  RiskSample,
} from './adStrategyMemory';
import { ALL_AUDIENCES } from './adStrategyMemory';
import type { CampaignMode, CreativeDirection, HumanState, HumanTruth } from '@/core/types';

// ─── helpers ──────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp01(n: number): number { return clamp(0, 1, n); }
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── archetype table ─────────────────────────────────────────

export interface AudienceArchetypeProfile {
  id: AudienceArchetype;
  /** Pain vocabulary the archetype recognizes. */
  pains: string[];
  /** Desire vocabulary they aspire to (often inverse of pain). */
  desires: string[];
  /** Surface objections they raise to ad claims. */
  surfaceObjections: string[];
  /** Deeper trust objections beneath the surface. */
  deeperObjections: string[];
  /** Preferred proof style. */
  proofStyle: 'witness' | 'credential' | 'metric' | 'testimony' | 'demonstration' | 'absence';
  /** Emotional temperature (0..10 — cool / clinical → hot / urgent). */
  emotionalTemperature: number;
  /** Campaign modes that resonate with this archetype. */
  allowedCampaignModes: CampaignMode[];
  /** Clichés that destroy credibility. */
  forbiddenCliches: string[];
  /** State families that strongly correlate with this archetype. */
  resonantStateFamilies: string[];
}

export const AUDIENCE_PROFILES: Record<AudienceArchetype, AudienceArchetypeProfile> = {
  tired_parent: {
    id: 'tired_parent',
    pains: ['interrupted-sleep', 'identity-erasure', 'guilt-when-resting', 'never-finished'],
    desires: ['real-rest', 'recognition', 'permission-to-pause', 'reclaimed-quiet'],
    surfaceObjections: ['no-time', 'too-expensive', 'already-tried-everything'],
    deeperObjections: ['will-judge-me-for-resting', 'guilt-blocks-acceptance', 'fear-of-selfishness'],
    proofStyle: 'witness',
    emotionalTemperature: 7,
    allowedCampaignModes: ['Editorial', 'Documentary', 'Emotional', 'Minimal'],
    forbiddenCliches: ['perfect-mother-aesthetic', 'have-it-all', 'morning-routine-fantasy'],
    resonantStateFamilies: ['exhausted', 'stretched', 'depleted', 'overwhelmed'],
  },
  office_worker: {
    id: 'office_worker',
    pains: ['focus-collapse', 'meeting-fatigue', 'screen-burn', 'invisible-output'],
    desires: ['clean-focus', 'energy-without-jitter', 'protected-deep-work'],
    surfaceObjections: ['skeptical-of-claims', 'tried-coffee-already', 'no-difference-perceived'],
    deeperObjections: ['fear-of-dependency', 'fear-of-being-fooled', 'cynicism-from-prior-marketing'],
    proofStyle: 'metric',
    emotionalTemperature: 4,
    allowedCampaignModes: ['Editorial', 'Performance', 'Minimal', 'Product-focused'],
    forbiddenCliches: ['hustle-culture', 'grind-aesthetic', 'fake-productivity-porn'],
    resonantStateFamilies: ['scattered', 'foggy', 'fragmented', 'depleted'],
  },
  founder_creator: {
    id: 'founder_creator',
    pains: ['decision-fatigue', 'isolation', 'identity-fused-with-work', 'recursive-doubt'],
    desires: ['protected-thinking', 'edge-without-burnout', 'real-rest-rare'],
    surfaceObjections: ['only-works-for-people-like-me', 'not-personalized', 'too-mainstream'],
    deeperObjections: ['fear-of-losing-edge', 'dependency-undermines-identity', 'will-it-actually-scale'],
    proofStyle: 'credential',
    emotionalTemperature: 6,
    allowedCampaignModes: ['Editorial', 'Documentary', 'Performance', 'Luxury'],
    forbiddenCliches: ['founder-mode-cliche', 'hustle-aesthetic', 'fake-vulnerability'],
    resonantStateFamilies: ['stretched', 'recursive', 'compressed', 'pressured'],
  },
  student_focus: {
    id: 'student_focus',
    pains: ['attention-fragmentation', 'exam-pressure', 'sleep-debt', 'comparison-anxiety'],
    desires: ['locked-in-focus', 'memory-retention', 'calm-under-deadline'],
    surfaceObjections: ['cost', 'parental-permission', 'works-for-others-not-me'],
    deeperObjections: ['fear-of-cheating-feeling', 'identity-as-naturally-smart', 'sustainability-doubt'],
    proofStyle: 'metric',
    emotionalTemperature: 6,
    allowedCampaignModes: ['Editorial', 'Performance', 'Minimal', 'Product-focused'],
    forbiddenCliches: ['college-stock-photography', 'fake-study-aesthetic', 'pep-rally-energy'],
    resonantStateFamilies: ['scattered', 'pressured', 'overstimulated', 'fragmented'],
  },
  overworked_professional: {
    id: 'overworked_professional',
    pains: ['weekend-collapse', 'evening-zombie', 'hidden-fatigue', 'professional-mask-cost'],
    desires: ['sustainable-output', 'private-restoration', 'dignified-energy'],
    surfaceObjections: ['no-difference', 'placebo-suspicion', 'too-good-to-be-true'],
    deeperObjections: ['fear-of-admitting-fatigue', 'identity-as-tireless', 'shame-of-needing-help'],
    proofStyle: 'credential',
    emotionalTemperature: 5,
    allowedCampaignModes: ['Editorial', 'Documentary', 'Emotional', 'Luxury'],
    forbiddenCliches: ['girlboss-aesthetic', 'self-care-sunday-cliche', 'wellness-influencer-vibe'],
    resonantStateFamilies: ['exhausted', 'compressed', 'depleted', 'masked'],
  },
  wellness_skeptic: {
    id: 'wellness_skeptic',
    pains: ['burned-by-prior-claims', 'allergic-to-marketing-language', 'tired-of-being-targeted'],
    desires: ['honest-product', 'ingredient-transparency', 'no-mysticism'],
    surfaceObjections: ['marketing-speak', 'unverified-claims', 'too-aesthetic-to-trust'],
    deeperObjections: ['identity-as-discerning', 'fear-of-being-sold-to', 'all-wellness-is-snake-oil'],
    proofStyle: 'specification' as never,  // maps to specification via persuasion override
    emotionalTemperature: 3,
    allowedCampaignModes: ['Documentary', 'Minimal', 'Product-focused'],
    forbiddenCliches: ['wellness-vibe', 'mystical-imagery', 'lifestyle-fantasy', 'soft-focus'],
    resonantStateFamilies: ['skeptical', 'guarded', 'analytical'],
  },
  night_overthinker: {
    id: 'night_overthinker',
    pains: ['3am-spiral', 'racing-thoughts', 'sleep-anxiety', 'lonely-rumination'],
    desires: ['mental-quiet', 'permission-to-stop', 'sleep-without-fear'],
    surfaceObjections: ['sleep-aids-leave-me-foggy', 'tried-meditation', 'tried-melatonin'],
    deeperObjections: ['fear-of-losing-vigilance', 'identity-as-deep-thinker', 'control-loss'],
    proofStyle: 'testimony',
    emotionalTemperature: 7,
    allowedCampaignModes: ['Emotional', 'Documentary', 'Minimal'],
    forbiddenCliches: ['lavender-sleep-aesthetic', 'spa-vibes', 'curated-evening-routine'],
    resonantStateFamilies: ['anxious', 'recursive', 'unsettled', 'wired'],
  },
  high_performer: {
    id: 'high_performer',
    pains: ['plateau', 'recovery-mismatch', 'invisible-attrition', 'edge-erosion'],
    desires: ['compounding-edge', 'recovery-as-discipline', 'measurable-gain'],
    surfaceObjections: ['untested-at-elite-level', 'placebo', 'too-mainstream-to-matter'],
    deeperObjections: ['fear-of-mediocrity', 'identity-as-self-made', 'belief-in-pain-required'],
    proofStyle: 'metric',
    emotionalTemperature: 5,
    allowedCampaignModes: ['Performance', 'Documentary', 'Luxury', 'Product-focused'],
    forbiddenCliches: ['hustle-porn', 'gym-bro-aesthetic', 'sports-drink-cliche'],
    resonantStateFamilies: ['pressured', 'compressed', 'stretched', 'plateau'],
  },
  emotionally_drained_adult: {
    id: 'emotionally_drained_adult',
    pains: ['compassion-fatigue', 'numbness', 'invisible-grief', 'social-exhaustion'],
    desires: ['being-met-without-fixing', 'quiet-restoration', 'permission-to-feel-less'],
    surfaceObjections: ['no-product-can-help', 'wrong-channel-for-this'],
    deeperObjections: ['fear-of-being-seen-needy', 'shame-around-emotional-cost', 'mistrust-of-positivity'],
    proofStyle: 'witness',
    emotionalTemperature: 8,
    allowedCampaignModes: ['Emotional', 'Documentary', 'Minimal', 'Editorial'],
    forbiddenCliches: ['toxic-positivity', 'fake-empathy', 'curated-grief'],
    resonantStateFamilies: ['drained', 'numb', 'tender', 'hollow'],
  },
};

// ─── campaign role table ─────────────────────────────────────

export interface CampaignRoleProfile {
  id: CampaignRole;
  hookIntensity: number;          // 0..10 (how hard the hook should land)
  productVisibility: number;      // 0..10 (how present the product must be)
  textAmount: 'none' | 'minimal' | 'editorial' | 'long';
  ctaStrength: number;            // 0..10
  emotionalDirectness: number;    // 0..10
  proofRequirement: 'low' | 'medium' | 'high';
  /** Recommendation only — does NOT modify critic logic. */
  criticStrictnessRecommendation: 'baseline' | 'relaxed' | 'strict';
  /** Story shapes that fit this role. */
  fittingShapes: StoryShape[];
}

export const ROLE_PROFILES: Record<CampaignRole, CampaignRoleProfile> = {
  awareness:           { id: 'awareness', hookIntensity: 5, productVisibility: 3, textAmount: 'minimal', ctaStrength: 2, emotionalDirectness: 6, proofRequirement: 'low', criticStrictnessRecommendation: 'baseline', fittingShapes: ['mirror', 'unspoken'] },
  curiosity:           { id: 'curiosity', hookIntensity: 7, productVisibility: 2, textAmount: 'minimal', ctaStrength: 1, emotionalDirectness: 4, proofRequirement: 'low', criticStrictnessRecommendation: 'baseline', fittingShapes: ['reveal', 'pivot'] },
  objection_breaker:   { id: 'objection_breaker', hookIntensity: 6, productVisibility: 5, textAmount: 'editorial', ctaStrength: 4, emotionalDirectness: 7, proofRequirement: 'high', criticStrictnessRecommendation: 'strict', fittingShapes: ['pivot', 'witness'] },
  trust_builder:       { id: 'trust_builder', hookIntensity: 4, productVisibility: 4, textAmount: 'editorial', ctaStrength: 2, emotionalDirectness: 6, proofRequirement: 'high', criticStrictnessRecommendation: 'strict', fittingShapes: ['witness', 'demonstration'] },
  conversion_push:     { id: 'conversion_push', hookIntensity: 8, productVisibility: 8, textAmount: 'editorial', ctaStrength: 9, emotionalDirectness: 5, proofRequirement: 'high', criticStrictnessRecommendation: 'baseline', fittingShapes: ['demonstration', 'pivot'] },
  retargeting_memory:  { id: 'retargeting_memory', hookIntensity: 6, productVisibility: 7, textAmount: 'minimal', ctaStrength: 7, emotionalDirectness: 4, proofRequirement: 'medium', criticStrictnessRecommendation: 'relaxed', fittingShapes: ['mirror', 'reveal'] },
  ritual_education:    { id: 'ritual_education', hookIntensity: 5, productVisibility: 6, textAmount: 'long', ctaStrength: 3, emotionalDirectness: 5, proofRequirement: 'high', criticStrictnessRecommendation: 'strict', fittingShapes: ['demonstration', 'witness'] },
  product_proof:       { id: 'product_proof', hookIntensity: 5, productVisibility: 9, textAmount: 'editorial', ctaStrength: 5, emotionalDirectness: 3, proofRequirement: 'high', criticStrictnessRecommendation: 'strict', fittingShapes: ['demonstration'] },
  emotional_mirror:    { id: 'emotional_mirror', hookIntensity: 6, productVisibility: 2, textAmount: 'minimal', ctaStrength: 1, emotionalDirectness: 9, proofRequirement: 'low', criticStrictnessRecommendation: 'baseline', fittingShapes: ['mirror', 'unspoken'] },
  social_share_trigger:{ id: 'social_share_trigger', hookIntensity: 9, productVisibility: 3, textAmount: 'minimal', ctaStrength: 2, emotionalDirectness: 7, proofRequirement: 'low', criticStrictnessRecommendation: 'baseline', fittingShapes: ['reveal', 'pivot'] },
};

// ─── assessment output ───────────────────────────────────────

export interface AdStrategyAssessment {
  primaryAudience: AudienceArchetype;
  secondaryAudience: AudienceArchetype | null;
  emotionalWound: string;
  hiddenDesire: string;
  surfaceObjection: string;
  deeperObjection: string;
  trustBarrier: string;
  campaignRole: CampaignRole;
  recommendedAngle: string;
  forbiddenAngle: string;
  persuasionMode: PersuasionMode;
  storyShape: StoryShape;
  proofNeed: 'low' | 'medium' | 'high';
  urgencyLevel: number;          // 0..10
  repetitionRisk: number;        // 0..10
  brandRisk: number;             // 0..10
  trustDebt: number;             // 0..10 (snapshot of current debt)
  strategicDepth: number;        // 0..10
  confidence: number;            // 0..10
  reasonCodes: string[];
  /** Creative constraints the role recommends — surfaced but NOT
   *  wired into critic. Future phases can consume. */
  creativeConstraints: {
    hookIntensity: number;
    productVisibility: number;
    textAmount: CampaignRoleProfile['textAmount'];
    ctaStrength: number;
    emotionalDirectness: number;
    proofRequirement: 'low' | 'medium' | 'high';
    criticStrictnessRecommendation: 'baseline' | 'relaxed' | 'strict';
  };
}

// ─── deterministic selection helpers ─────────────────────────

function pickAudience(state: HumanState, mode: CampaignMode | null, memory: AdStrategyMemoryState): {
  primary: AudienceArchetype; secondary: AudienceArchetype | null; reason: string;
} {
  // Score each archetype by:
  //   - family resonance (3 pts if state.family matches)
  //   - mode compatibility (2 pts if mode is in allowedCampaignModes)
  //   - inverse fatigue (boost less-used archetypes slightly)
  //   - label keyword overlap (1 pt per match)
  const familyLower = state.family.toLowerCase();
  const labelLower = state.label.toLowerCase();
  const scores: Array<{ id: AudienceArchetype; score: number; matchedOn: string[] }> = ALL_AUDIENCES.map((id) => {
    const profile = AUDIENCE_PROFILES[id];
    let score = 0;
    const matchedOn: string[] = [];
    for (const fam of profile.resonantStateFamilies) {
      if (familyLower.includes(fam)) { score += 3; matchedOn.push(`family:${fam}`); }
      else if (labelLower.includes(fam)) { score += 1.5; matchedOn.push(`label:${fam}`); }
    }
    if (mode && profile.allowedCampaignModes.includes(mode)) {
      score += 2; matchedOn.push(`mode:${mode}`);
    }
    // Fatigue suppression: heavily-used audience loses up to 1.5 pts.
    const fatigue = memory.audienceFatigue[id];
    if (fatigue) {
      const fatigueWeight = Math.min(1.5, fatigue.recency * 1.5);
      score -= fatigueWeight;
    }
    // Tiny pain-vocabulary fallback if no family/label match.
    if (score === 0) {
      for (const pain of profile.pains) {
        if (labelLower.includes(pain.split('-')[0])) { score += 0.5; matchedOn.push(`pain:${pain}`); break; }
      }
    }
    return { id, score, matchedOn };
  });
  scores.sort((a, b) => b.score - a.score);
  const primary = scores[0].id;
  const secondary = scores[1].score >= 2 ? scores[1].id : null;
  const reason = scores[0].matchedOn.length > 0
    ? `audience:${primary} chosen on [${scores[0].matchedOn.join(', ')}]`
    : `audience:${primary} chosen by fallback (low signal)`;
  return { primary, secondary, reason };
}

function pickCampaignRole(direction: CreativeDirection, mode: CampaignMode | null): { role: CampaignRole; reason: string } {
  const reasons: string[] = [];
  // Decision table: product role + cta + restraint + layout.
  const productRole = direction.productRole;
  const cta = direction.ctaBehavior;
  const layout = direction.layoutFamily;
  const restraint = direction.restraint;
  let role: CampaignRole = 'awareness';

  if (productRole === 'hidden' && restraint >= 0.7) {
    role = 'emotional_mirror'; reasons.push('product=hidden+highRestraint→emotional_mirror');
  } else if (productRole === 'environmental' && restraint >= 0.6) {
    role = 'awareness'; reasons.push('product=environmental+restraint→awareness');
  } else if (layout === 'timestamp-anchor') {
    role = 'ritual_education'; reasons.push('layout=timestamp-anchor→ritual_education');
  } else if (cta === 'editorial' && layout === 'editorial-page') {
    role = 'trust_builder'; reasons.push('editorialCTA+editorialLayout→trust_builder');
  } else if (productRole === 'foreground-blur' || productRole === 'partial-crop') {
    role = 'curiosity'; reasons.push(`product=${productRole}→curiosity`);
  } else if (productRole === 'desk-proof' || productRole === 'emotional-proof' || productRole === 'hand-held') {
    role = 'product_proof'; reasons.push(`product=${productRole}→product_proof`);
  } else if (cta === 'corner' || (cta === 'integrated' && restraint < 0.4)) {
    role = 'conversion_push'; reasons.push(`cta=${cta}+lowRestraint→conversion_push`);
  } else if (mode === 'Aggressive' || mode === 'Performance') {
    role = 'social_share_trigger'; reasons.push(`mode=${mode}→social_share_trigger`);
  } else if (mode === 'Documentary') {
    role = 'trust_builder'; reasons.push('mode=Documentary→trust_builder');
  } else if (cta === 'quiet' && restraint >= 0.5) {
    role = 'awareness'; reasons.push('quietCTA+midRestraint→awareness');
  } else {
    role = 'curiosity'; reasons.push('fallback→curiosity');
  }
  return { role, reason: reasons.join('; ') };
}

function pickPersuasionMode(mode: CampaignMode | null, audience: AudienceArchetype, restraint: number): PersuasionMode {
  if (mode === 'Aggressive') return 'confrontational';
  if (mode === 'Performance') return 'demonstrative';
  if (mode === 'Documentary') return 'observational';
  if (mode === 'Emotional') return 'empathic';
  if (mode === 'Minimal') return 'minimal';
  if (mode === 'Luxury') return 'aspirational';
  if (mode === 'Product-focused') return 'specification';
  if (mode === 'Editorial') return 'narrative';
  // Fallback by audience temperature.
  const temp = AUDIENCE_PROFILES[audience].emotionalTemperature;
  if (temp >= 7) return 'empathic';
  if (temp <= 3) return 'specification';
  return restraint >= 0.6 ? 'narrative' : 'observational';
}

function pickStoryShape(role: CampaignRole, restraint: number): StoryShape {
  const fitting = ROLE_PROFILES[role].fittingShapes;
  // Within fitting shapes, prefer 'unspoken' when restraint is high,
  // 'demonstration' / 'pivot' when low. Deterministic tiebreak by index.
  if (restraint >= 0.7 && fitting.includes('unspoken')) return 'unspoken';
  if (restraint >= 0.6 && fitting.includes('mirror')) return 'mirror';
  if (restraint <= 0.3 && fitting.includes('pivot')) return 'pivot';
  if (restraint <= 0.4 && fitting.includes('demonstration')) return 'demonstration';
  return fitting[0];
}

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const sa = new Set(a), sb = new Set(b);
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter += 1;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

function computeRepetitionRisk(
  angle: string, audience: AudienceArchetype, role: CampaignRole,
  layoutFamily: CreativeDirection['layoutFamily'], wound: string,
  memory: AdStrategyMemoryState,
): { risk: number; reasons: string[] } {
  const reasons: string[] = [];
  let risk = 0;
  const angleTokens = tokenize(angle);
  const recentAngles = memory.angleHistory.slice(-8);
  for (const prior of recentAngles) {
    const sim = jaccard(angleTokens, tokenize(prior));
    if (sim >= 0.55) { risk += 1.5; reasons.push(`angle-overlap:${sim.toFixed(2)}`); }
    else if (sim >= 0.35) { risk += 0.7; reasons.push(`angle-near:${sim.toFixed(2)}`); }
  }
  const sameAudience = memory.audienceHistory.slice(-6).filter((o) => o.audience === audience).length;
  if (sameAudience >= 4) { risk += 2; reasons.push(`audience-streak:${sameAudience}/6`); }
  else if (sameAudience >= 3) { risk += 1; reasons.push(`audience-cluster:${sameAudience}/6`); }
  const sameRole = memory.roleHistory.slice(-6).filter((r) => r === role).length;
  if (sameRole >= 4) { risk += 1.5; reasons.push(`role-streak:${sameRole}/6`); }
  // Wound repetition.
  const recentWounds = memory.painHistory.slice(-6);
  const woundTokens = tokenize(wound);
  let woundHits = 0;
  for (const w of recentWounds) if (jaccard(woundTokens, tokenize(w)) >= 0.5) woundHits += 1;
  if (woundHits >= 3) { risk += 1.5; reasons.push(`wound-repeat:${woundHits}/6`); }
  // CTA pressure repetition handled via role; layout repeat:
  const recentRoles = memory.roleHistory.slice(-8);
  if (recentRoles.length >= 4 && new Set(recentRoles.slice(-4)).size === 1) {
    risk += 0.5; reasons.push('role-quad-streak');
  }
  return { risk: round1(clamp10(risk)), reasons };
}

function computeTrustDebt(
  prior: number, urgency: number, productVisibility: number, ctaStrength: number,
  proofNeed: 'low' | 'medium' | 'high', proofProvided: 'low' | 'medium' | 'high',
  brandDignity: number, repetitionRisk: number, role: CampaignRole,
): { next: number; deltaReasons: string[] } {
  const reasons: string[] = [];
  let next = prior;
  // RISES
  const proofRank = { low: 0, medium: 1, high: 2 } as const;
  const proofGap = proofRank[proofNeed] - proofRank[proofProvided];
  if (urgency >= 7 && proofGap > 0) { next += 0.8; reasons.push(`urgency-without-proof:+0.8 (gap ${proofGap})`); }
  if (productVisibility >= 7 && role === 'emotional_mirror') {
    next += 0.5; reasons.push('product-loud-vs-emotional-mirror:+0.5');
  }
  if (ctaStrength >= 7 && brandDignity <= 5) {
    next += 0.5; reasons.push('cta-pressure-low-dignity:+0.5');
  }
  if (repetitionRisk >= 6) {
    next += 0.4; reasons.push(`repetition-risk-${repetitionRisk}:+0.4`);
  }
  // LOWERS
  if (proofGap <= 0 && (proofNeed === 'high' || proofNeed === 'medium')) {
    next -= 0.3; reasons.push('proof-need-respected:-0.3');
  }
  if (role === 'ritual_education') { next -= 0.3; reasons.push('ritual-education-role:-0.3'); }
  if (role === 'trust_builder')    { next -= 0.4; reasons.push('trust-builder-role:-0.4'); }
  if (role === 'emotional_mirror' && productVisibility <= 4) {
    next -= 0.3; reasons.push('mirror-with-product-secondary:-0.3');
  }
  // passive decay toward 0
  if (Math.abs(next - prior) < 0.1) { next -= 0.05; reasons.push('passive-decay:-0.05'); }
  return { next: round1(clamp10(next)), deltaReasons: reasons };
}

// ─── strategy assembly ───────────────────────────────────────

export interface AdStrategyInput {
  state: HumanState;
  truth: HumanTruth;
  direction: CreativeDirection;
  campaignMode: CampaignMode | null;
  bannerId: string;
  memory: AdStrategyMemoryState;
}

export function computeAdStrategy(input: AdStrategyInput): AdStrategyAssessment {
  const { state, truth, direction, campaignMode, memory } = input;

  // 1. audience selection
  const { primary, secondary, reason: audienceReason } = pickAudience(state, campaignMode, memory);
  const profile = AUDIENCE_PROFILES[primary];

  // 2. wound + desire — pick from profile, biased by truth tension token overlap.
  const tensionTokens = tokenize(truth.tension);
  function bestMatch(pool: string[]): string {
    let best = pool[0]; let bestSim = -1;
    for (const item of pool) {
      const sim = jaccard(tokenize(item), tensionTokens);
      if (sim > bestSim) { bestSim = sim; best = item; }
    }
    return best;
  }
  const wound = bestMatch(profile.pains);
  const desire = bestMatch(profile.desires);
  const surfaceObjection = profile.surfaceObjections[0] ?? 'no-objection';
  const deeperObjection = profile.deeperObjections[0] ?? 'no-deeper-objection';

  // 3. trust barrier — combine deeper objection with brand dignity context
  const trustBarrier = memory.brandDignityScore <= 5
    ? `brand-dignity-low + ${deeperObjection}`
    : deeperObjection;

  // 4. campaign role from direction + mode
  const { role, reason: roleReason } = pickCampaignRole(direction, campaignMode);
  const roleProfile = ROLE_PROFILES[role];

  // 5. persuasion + story
  const persuasionMode = pickPersuasionMode(campaignMode, primary, direction.restraint);
  const storyShape = pickStoryShape(role, direction.restraint);
  const proofNeed = roleProfile.proofRequirement;

  // 6. urgency from CTA + restraint
  const urgencyLevel = round1(clamp10(
    (direction.ctaBehavior === 'corner' ? 7 : direction.ctaBehavior === 'editorial' ? 5 : direction.ctaBehavior === 'integrated' ? 6 : 3)
    + (1 - direction.restraint) * 3,
  ));

  // 7. proof provided — estimated from product role
  const proofProvided: 'low' | 'medium' | 'high' =
    direction.productRole === 'hidden' || direction.productRole === 'background-object' || direction.productRole === 'foreground-blur'
      ? 'low'
      : direction.productRole === 'environmental' || direction.productRole === 'partial-crop'
        ? 'medium'
        : 'high';

  // 8. angle string — deterministic compact angle summary
  const recommendedAngle =
    `[${primary}/${role}] ${wound} → ${desire} via ${storyShape} (${persuasionMode})`;
  // 9. forbidden angle — first cliché in archetype's list
  const forbiddenAngle = profile.forbiddenCliches[0] ?? 'no-known-cliche';

  // 10. repetition risk + trust debt
  const { risk: repetitionRisk, reasons: repReasons } = computeRepetitionRisk(
    recommendedAngle, primary, role, direction.layoutFamily, wound, memory,
  );
  const { next: newTrustDebt, deltaReasons: trustDebtReasons } = computeTrustDebt(
    memory.trustDebt, urgencyLevel, roleProfile.productVisibility, roleProfile.ctaStrength,
    proofNeed, proofProvided, memory.brandDignityScore, repetitionRisk, role,
  );

  // 11. brand risk composite
  const brandRisk = round1(clamp10(
    repetitionRisk * 0.3 + newTrustDebt * 0.4
    + (urgencyLevel >= 7 && roleProfile.criticStrictnessRecommendation === 'baseline' ? 2 : 0)
    + (10 - memory.brandDignityScore) * 0.2,
  ));

  // 12. strategic depth — how deep beneath surface the strategy reaches
  const strategicDepth = round1(clamp10(
    (deeperObjection ? 3 : 0)
    + (trustBarrier.includes('brand-dignity-low') ? 1 : 2)
    + (storyShape === 'pivot' || storyShape === 'reveal' ? 2 : 1)
    + (role === 'objection_breaker' || role === 'trust_builder' || role === 'ritual_education' ? 2 : 1)
    + (proofNeed === 'high' ? 1 : 0),
  ));

  // 13. confidence — derived from signal strength of audience/wound matches
  const confidence = round1(clamp10(
    (audienceReason.includes('family:') ? 3 : 1)
    + (audienceReason.includes('mode:') ? 2 : 0)
    + (tensionTokens.length >= 2 ? 2 : 0)
    + (repetitionRisk < 5 ? 2 : 0)
    + (brandRisk < 5 ? 1 : 0),
  ));

  // 14. reason codes
  const reasonCodes: string[] = [
    audienceReason,
    `role:${role} via [${roleReason}]`,
    `wound:${wound} desire:${desire}`,
    `persuasion:${persuasionMode} shape:${storyShape}`,
    `proofNeed:${proofNeed} proofProvided:${proofProvided}`,
    `urgency:${urgencyLevel}/10`,
    ...repReasons.map((r) => `repetition[${r}]`),
    ...trustDebtReasons.map((r) => `trust[${r}]`),
    `brandDignity:${memory.brandDignityScore}/10 brandRisk:${brandRisk}/10`,
  ];

  return {
    primaryAudience: primary,
    secondaryAudience: secondary,
    emotionalWound: wound,
    hiddenDesire: desire,
    surfaceObjection,
    deeperObjection,
    trustBarrier,
    campaignRole: role,
    recommendedAngle,
    forbiddenAngle,
    persuasionMode,
    storyShape,
    proofNeed,
    urgencyLevel,
    repetitionRisk,
    brandRisk,
    trustDebt: newTrustDebt,
    strategicDepth,
    confidence,
    reasonCodes,
    creativeConstraints: {
      hookIntensity: roleProfile.hookIntensity,
      productVisibility: roleProfile.productVisibility,
      textAmount: roleProfile.textAmount,
      ctaStrength: roleProfile.ctaStrength,
      emotionalDirectness: roleProfile.emotionalDirectness,
      proofRequirement: roleProfile.proofRequirement,
      criticStrictnessRecommendation: roleProfile.criticStrictnessRecommendation,
    },
  };
}

// ─── memory write ────────────────────────────────────────────

export interface StrategyOutcomeSignal {
  at: number;
  bannerId: string;
  outcome: 'approved' | 'refused';
  refusalReasons?: string[];
}

export function recordStrategyAssessment(
  memory: AdStrategyMemoryState, assessment: AdStrategyAssessment,
  bannerId: string, at: number,
): AdStrategyMemoryState {
  // Apply audience-fatigue update: bump usage + recency for primary.
  const fatigue = { ...memory.audienceFatigue };
  const prev = fatigue[assessment.primaryAudience];
  fatigue[assessment.primaryAudience] = {
    audience: assessment.primaryAudience,
    usageCount: prev.usageCount + 1,
    recency: round2(clamp01(prev.recency * 0.85 + 0.3)),
    lastUsedAt: at,
  };
  // Decay all other audiences' recency.
  for (const id of Object.keys(fatigue) as AudienceArchetype[]) {
    if (id === assessment.primaryAudience) continue;
    fatigue[id] = { ...fatigue[id], recency: round2(clamp01(fatigue[id].recency * 0.92)) };
  }

  // Brand dignity drift: drops on confrontational / conversion_push with
  // high urgency; recovers on trust_builder / ritual_education / emotional_mirror.
  let brandDignity = memory.brandDignityScore;
  if (assessment.campaignRole === 'trust_builder')    brandDignity = round1(clamp10(brandDignity + 0.2));
  if (assessment.campaignRole === 'ritual_education') brandDignity = round1(clamp10(brandDignity + 0.15));
  if (assessment.campaignRole === 'emotional_mirror' && assessment.creativeConstraints.productVisibility <= 3) {
    brandDignity = round1(clamp10(brandDignity + 0.15));
  }
  if (assessment.persuasionMode === 'confrontational' && assessment.urgencyLevel >= 7) {
    brandDignity = round1(clamp10(brandDignity - 0.4));
  }
  if (assessment.campaignRole === 'conversion_push' && assessment.creativeConstraints.ctaStrength >= 8) {
    brandDignity = round1(clamp10(brandDignity - 0.15));
  }

  const observation: StrategyObservation = {
    at, bannerId,
    audience: assessment.primaryAudience,
    wound: assessment.emotionalWound,
    desire: assessment.hiddenDesire,
    objection: assessment.surfaceObjection,
    angle: assessment.recommendedAngle,
    role: assessment.campaignRole,
    proofNeed: assessment.proofNeed,
    urgencyLevel: assessment.urgencyLevel,
    outcome: 'pending',
  };

  const riskSample: RiskSample = {
    at,
    repetitionRisk: assessment.repetitionRisk,
    trustDebt: assessment.trustDebt,
    brandRisk: assessment.brandRisk,
  };

  return {
    ...memory,
    audienceHistory:        [...memory.audienceHistory, observation],
    painHistory:            [...memory.painHistory, assessment.emotionalWound],
    desireHistory:          [...memory.desireHistory, assessment.hiddenDesire],
    objectionHistory:       [...memory.objectionHistory, assessment.surfaceObjection],
    angleHistory:           [...memory.angleHistory, assessment.recommendedAngle],
    offerFramingHistory:    [...memory.offerFramingHistory, `${assessment.persuasionMode}:${assessment.storyShape}`],
    roleHistory:            [...memory.roleHistory, assessment.campaignRole],
    repetitionRiskHistory:  [...memory.repetitionRiskHistory, riskSample],
    persuasionDepthHistory: [...memory.persuasionDepthHistory, assessment.strategicDepth],
    trustDebt:              assessment.trustDebt,
    brandDignityScore:      brandDignity,
    audienceFatigue:        fatigue,
    totalAssessments:       memory.totalAssessments + 1,
    firstUpdatedAt:         memory.firstUpdatedAt ?? at,
    updatedAt:              at,
  };
}

export function recordStrategyOutcome(
  memory: AdStrategyMemoryState, assessment: AdStrategyAssessment,
  bannerId: string, outcome: 'approved' | 'refused',
  refusalReasons: string[] | undefined, at: number,
): AdStrategyMemoryState {
  // Update the matching observation's outcome.
  const audienceHistory = memory.audienceHistory.map((o) =>
    o.bannerId === bannerId ? { ...o, outcome } : o,
  );
  let failedAngles = memory.failedAngles;
  let successfulPatterns = memory.successfulPatterns;
  if (outcome === 'refused') {
    failedAngles = [...failedAngles, {
      at, bannerId,
      angle: assessment.recommendedAngle,
      audience: assessment.primaryAudience,
      role: assessment.campaignRole,
      reasons: refusalReasons ?? [],
    }];
  } else {
    successfulPatterns = [...successfulPatterns, {
      at, bannerId,
      audience: assessment.primaryAudience,
      role: assessment.campaignRole,
      persuasionMode: assessment.persuasionMode,
      proofNeed: assessment.proofNeed,
      strategicDepth: assessment.strategicDepth,
    }];
  }
  return {
    ...memory,
    audienceHistory, failedAngles, successfulPatterns,
    updatedAt: at,
  };
}
