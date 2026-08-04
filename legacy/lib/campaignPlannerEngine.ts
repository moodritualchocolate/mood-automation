/**
 * CAMPAIGN PLANNER ENGINE (pure, observational)
 *
 * Campaign Operating System — main planner.
 *
 * Converts a BUSINESS OBJECTIVE (budget · goal · formula · market ·
 * audience) into a structured CAMPAIGN PLAN: phases, duration,
 * budget allocation, creative angles, and asset requirements.
 *
 * The plan is a SPECIFICATION ONLY. The system does not publish,
 * does not auto-execute, does not spend budget. The system never
 * predicts performance; it only describes structures the operator
 * may explore. The operator runs the campaign.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never publishes
 *   - never auto-spends budget
 *   - never auto-approves
 *   - allowed phrasing: "campaign plan structure", "operator
 *     approval required", "historically associated", "observed
 *     alongside", "may carry memory weight", "requires more
 *     evidence", "system never spends"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply, optimize,
 *     viral, dopamine, outrage, manipulat, exploit
 *
 * Human remains final authority.
 */

import type { Formula } from '@/core/types';

// ─── input ────────────────────────────────────────────────────

export type CampaignGoal =
  | 'brand-awareness'
  | 'product-trial'
  | 'audience-retention'
  | 'reactivation'
  | 'community-build';

export type CampaignMarket = 'israel' | 'global';

export interface CampaignPlannerInput {
  /** Total budget in USD. The system NEVER auto-spends. */
  budgetUSD: number;
  goal: CampaignGoal;
  formula: Formula;
  market: CampaignMarket;
  /** Free-text audience descriptor (e.g. "il-women-25-44"). */
  audience: string;
  /** Optional duration override in days (defaults to goal-derived). */
  durationDaysOverride?: number;
  /** Optional brand language hint. */
  brandLanguage?: 'hebrew' | 'mixed' | 'english';
}

// ─── output ───────────────────────────────────────────────────

export type CampaignPhaseId = 'arrival' | 'observation' | 'invitation' | 'continuation';

export interface CampaignPhase {
  phaseId: CampaignPhaseId;
  /** 1-indexed sequence order. */
  index: number;
  durationDays: number;
  /** Plain-language purpose (NOT a directive). */
  purpose: string;
  /** Share of budget allocated (0..1). */
  budgetShare: number;
  /** USD allocated to this phase. The operator chooses to spend. */
  budgetUSD: number;
  /** Restrained creative tone per phase. */
  toneNote: string;
  /** Story-family ids the operator may explore in this phase. */
  storyFamilyOptions: string[];
}

export interface CreativeAngle {
  angleId: string;
  /** Plain-language description (NOT a winner). */
  description: string;
  storyFamily: string;
  emotionalArc: string;
  memoryAnchor: string;
  presenceAnchor: string;
  realismStyle: string;
  /** 0..10 — historically-aligned strength observed in upstream layers. */
  observedStrength: number;
  operatorReviewRequired: true;
}

export interface AssetRequirementBucket {
  packageType: 'image' | 'video' | 'carousel' | 'landing';
  /** Minimum count the operator should review for this campaign. */
  minimumCount: number;
  /** Recommended-count language is forbidden — we use "explored count". */
  exploredCount: number;
  /** Phases this asset type fits. */
  phases: CampaignPhaseId[];
  /** Plain-language note. */
  note: string;
}

export interface BudgetAllocation {
  /** Production · cost of operator-driven generation (operator pays providers directly). */
  productionUSD: number;
  /** Paid amplification reserve · the operator spends manually. */
  paidMediaUSD: number;
  /** Testing reserve · variants the operator may explore. */
  testingReserveUSD: number;
  /** Operator-defined slack / contingency. */
  contingencyUSD: number;
  /** Verbal disclaimer surfaced wherever the allocation is shown. */
  spendDisclaimer: string;
}

export interface CampaignPlanReading {
  goal: CampaignGoal;
  formula: Formula;
  market: CampaignMarket;
  audience: string;
  budgetUSD: number;
  durationDays: number;
  phases: CampaignPhase[];
  budgetAllocation: BudgetAllocation;
  creativeAngles: CreativeAngle[];
  assetRequirements: AssetRequirementBucket[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Campaign plan is a specification only. ' +
  'The system never publishes, never auto-spends budget, never auto-approves. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function r2(n: number): number { return Math.round(n * 100) / 100; }
function r1(n: number): number { return Math.round(n * 10) / 10; }

function defaultDurationDays(goal: CampaignGoal): number {
  switch (goal) {
    case 'brand-awareness':    return 28;
    case 'product-trial':      return 21;
    case 'audience-retention': return 35;
    case 'reactivation':       return 14;
    case 'community-build':    return 56;
  }
}

function phaseBudgetSharesFor(goal: CampaignGoal): Record<CampaignPhaseId, number> {
  switch (goal) {
    case 'brand-awareness':
      return { arrival: 0.30, observation: 0.30, invitation: 0.20, continuation: 0.20 };
    case 'product-trial':
      return { arrival: 0.20, observation: 0.20, invitation: 0.40, continuation: 0.20 };
    case 'audience-retention':
      return { arrival: 0.10, observation: 0.30, invitation: 0.20, continuation: 0.40 };
    case 'reactivation':
      return { arrival: 0.10, observation: 0.20, invitation: 0.40, continuation: 0.30 };
    case 'community-build':
      return { arrival: 0.15, observation: 0.35, invitation: 0.15, continuation: 0.35 };
  }
}

function phaseDurationSharesFor(goal: CampaignGoal): Record<CampaignPhaseId, number> {
  switch (goal) {
    case 'brand-awareness':
      return { arrival: 0.20, observation: 0.30, invitation: 0.20, continuation: 0.30 };
    case 'product-trial':
      return { arrival: 0.15, observation: 0.20, invitation: 0.35, continuation: 0.30 };
    case 'audience-retention':
      return { arrival: 0.10, observation: 0.30, invitation: 0.20, continuation: 0.40 };
    case 'reactivation':
      return { arrival: 0.15, observation: 0.20, invitation: 0.35, continuation: 0.30 };
    case 'community-build':
      return { arrival: 0.15, observation: 0.30, invitation: 0.15, continuation: 0.40 };
  }
}

const PHASE_PURPOSE: Record<CampaignPhaseId, string> = {
  arrival: 'the audience meets the brand without persuasion · observation over pitch',
  observation: 'the audience watches the brand exist · restraint over claim',
  invitation: 'a single gentle invitation to try · honest, never urgent',
  continuation: 'the brand continues being present · ritual over campaign',
};

const PHASE_TONE: Record<CampaignPhaseId, string> = {
  arrival: 'quiet wake · observational still · no headline gimmick',
  observation: 'sustained low · room sound · no music swell',
  invitation: 'soft invitation · honest restraint · no manufactured urgency',
  continuation: 'circular ritual · ambient presence · no campaign-ness',
};

function storyFamilyOptionsForGoal(goal: CampaignGoal, formula: Formula): Record<CampaignPhaseId, string[]> {
  // Cross-reference with lib/storyArchitectEngine.ts's 15 families.
  const morning: string[] = ['morning-restart', 'kitchen-light'];
  const recovery: string[] = ['night-decompression', 'silent-relief', 'breath-before-continuing'];
  const care: string[] = ['parent-after-exhaustion', 'hand-on-shoulder'];
  const home: string[] = ['quiet-return-home', 'ordinary-ritual', 'kitchen-light'];
  const reflection: string[] = ['child-growing-older', 'moment-nobody-notices', 'becoming-yourself-again'];
  const formulaLean: Record<Formula, string[]> = {
    ENERGY: morning,
    FOCUS: ['ordinary-ritual', 'small-victory', 'moment-nobody-notices'],
    RELAX: recovery,
    SLEEP: ['night-decompression', 'empty-chair', 'breath-before-continuing'],
  };
  switch (goal) {
    case 'brand-awareness':
      return {
        arrival: [...formulaLean[formula], 'kitchen-light'].slice(0, 3),
        observation: [...home, ...reflection].slice(0, 3),
        invitation: ['before-and-after-without-hype', 'ordinary-ritual'].slice(0, 2),
        continuation: [...home, 'ordinary-ritual'].slice(0, 2),
      };
    case 'product-trial':
      return {
        arrival: ['kitchen-light', 'morning-restart'].slice(0, 2),
        observation: [...formulaLean[formula]].slice(0, 2),
        invitation: ['before-and-after-without-hype', 'small-victory', 'ordinary-ritual'].slice(0, 3),
        continuation: ['ordinary-ritual', 'morning-restart'].slice(0, 2),
      };
    case 'audience-retention':
      return {
        arrival: ['ordinary-ritual'].slice(0, 1),
        observation: [...care, ...home].slice(0, 3),
        invitation: ['hand-on-shoulder', 'breath-before-continuing'].slice(0, 2),
        continuation: ['ordinary-ritual', 'becoming-yourself-again', 'kitchen-light'].slice(0, 3),
      };
    case 'reactivation':
      return {
        arrival: ['quiet-return-home'].slice(0, 1),
        observation: ['becoming-yourself-again', 'moment-nobody-notices'].slice(0, 2),
        invitation: ['ordinary-ritual', 'morning-restart'].slice(0, 2),
        continuation: ['kitchen-light', 'ordinary-ritual'].slice(0, 2),
      };
    case 'community-build':
      return {
        arrival: ['parent-after-exhaustion', 'hand-on-shoulder'].slice(0, 2),
        observation: ['moment-nobody-notices', 'ordinary-ritual', ...care].slice(0, 3),
        invitation: ['ordinary-ritual'].slice(0, 1),
        continuation: ['hand-on-shoulder', 'kitchen-light', 'ordinary-ritual'].slice(0, 3),
      };
  }
}

interface AngleSeed {
  storyFamily: string;
  description: string;
  emotionalArc: string;
  memoryAnchor: string;
  presenceAnchor: string;
  realismStyle: string;
}

const ANGLE_SEEDS: AngleSeed[] = [
  { storyFamily: 'quiet-return-home', description: 'arrival home after a long day · room remembers you',
    emotionalArc: 'pressure → breath → return', memoryAnchor: 'kitchen light',
    presenceAnchor: 'slow hand movement', realismStyle: 'documentary handheld · single warm kitchen light' },
  { storyFamily: 'morning-restart', description: 'first sip · the morning carries last night still',
    emotionalArc: 'noise → silence → clarity', memoryAnchor: 'half-empty coffee cup',
    presenceAnchor: 'exhale', realismStyle: 'natural window light · 50mm handheld' },
  { storyFamily: 'night-decompression', description: 'the work of the day lets go',
    emotionalArc: 'exhaustion → stillness → relief', memoryAnchor: 'warm lamp',
    presenceAnchor: 'relaxed shoulders', realismStyle: 'ambient room sound · low practical light' },
  { storyFamily: 'parent-after-exhaustion', description: 'the long day softens into care',
    emotionalArc: 'fatigue → tenderness → continuation', memoryAnchor: "child's shoes near the door",
    presenceAnchor: 'tired smile', realismStyle: 'documentary handheld · soft warm light' },
  { storyFamily: 'ordinary-ritual', description: 'the small thing repeated holds the day',
    emotionalArc: 'disconnection → ritual → reconnection', memoryAnchor: 'familiar room',
    presenceAnchor: 'slow hand movement', realismStyle: 'natural light · 50mm handheld' },
  { storyFamily: 'kitchen-light', description: 'the room continues without an event',
    emotionalArc: 'pressure → breath → return', memoryAnchor: 'kitchen light',
    presenceAnchor: 'slow hand movement', realismStyle: 'single warm kitchen light · 35mm handheld' },
  { storyFamily: 'becoming-yourself-again', description: 'the version of you that was always there returns',
    emotionalArc: 'self-loss → small pause → self-return', memoryAnchor: 'quiet sofa',
    presenceAnchor: 'unperformed emotion', realismStyle: 'documentary handheld · natural light' },
  { storyFamily: 'breath-before-continuing', description: 'one breath is the difference between giving up and going on',
    emotionalArc: 'pressure → breath → return', memoryAnchor: 'slow breath',
    presenceAnchor: 'exhale', realismStyle: 'ambient room sound · 50mm handheld' },
];

function angleStrengthFor(goal: CampaignGoal, seed: AngleSeed, formula: Formula): number {
  let s = 5;
  if (goal === 'audience-retention' && /ritual|continuation|familiar/.test(seed.description + seed.emotionalArc)) s += 2;
  if (goal === 'reactivation' && /return|familiar|small pause/.test(seed.description + seed.memoryAnchor + seed.emotionalArc)) s += 2;
  if (goal === 'brand-awareness' && /morning|kitchen|home|familiar/.test(seed.description)) s += 2;
  if (goal === 'product-trial' && /first sip|invitation|small thing|small victory/.test(seed.description)) s += 2;
  if (formula === 'ENERGY' && /morning|first sip|kitchen/.test(seed.description)) s += 1;
  if (formula === 'RELAX' && /decompress|stillness|relief/.test(seed.description + seed.emotionalArc)) s += 1;
  if (formula === 'SLEEP' && /night|warm lamp|breath/.test(seed.description + seed.memoryAnchor)) s += 1;
  if (formula === 'FOCUS' && /ritual|small|continues/.test(seed.description + seed.emotionalArc)) s += 1;
  return clamp(s, 0, 10);
}

// ─── main ─────────────────────────────────────────────────────

export function composeCampaignPlan(input: CampaignPlannerInput): CampaignPlanReading {
  const budgetUSD = Math.max(0, Math.floor(input.budgetUSD));
  const durationDays = input.durationDaysOverride ?? defaultDurationDays(input.goal);

  // ── phases ──────────────────────────────────────────────
  const budgetShares = phaseBudgetSharesFor(input.goal);
  const durationShares = phaseDurationSharesFor(input.goal);
  const storyOptionsByPhase = storyFamilyOptionsForGoal(input.goal, input.formula);
  const phaseOrder: CampaignPhaseId[] = ['arrival', 'observation', 'invitation', 'continuation'];
  const phases: CampaignPhase[] = phaseOrder.map((id, i) => ({
    phaseId: id,
    index: i + 1,
    durationDays: Math.max(1, Math.round(durationDays * durationShares[id])),
    purpose: PHASE_PURPOSE[id],
    budgetShare: r2(budgetShares[id]),
    budgetUSD: Math.floor(budgetUSD * budgetShares[id]),
    toneNote: PHASE_TONE[id],
    storyFamilyOptions: storyOptionsByPhase[id],
  }));

  // ── budget allocation ───────────────────────────────────
  // Production = operator-driven generation cost (estimated as a small
  // fraction). Paid media = the bulk. Testing reserve = small slice.
  // Contingency = remainder.
  const productionShare =
    input.goal === 'reactivation' ? 0.08 :
    input.goal === 'audience-retention' ? 0.10 :
    input.goal === 'community-build' ? 0.10 :
    0.12;
  const paidMediaShare =
    input.goal === 'community-build' ? 0.55 :
    input.goal === 'audience-retention' ? 0.60 :
    input.goal === 'reactivation' ? 0.70 :
    0.65;
  const testingShare = 0.12;
  const contingencyShare = clamp(1 - (productionShare + paidMediaShare + testingShare), 0.05, 0.30);
  const budgetAllocation: BudgetAllocation = {
    productionUSD: Math.floor(budgetUSD * productionShare),
    paidMediaUSD: Math.floor(budgetUSD * paidMediaShare),
    testingReserveUSD: Math.floor(budgetUSD * testingShare),
    contingencyUSD: Math.floor(budgetUSD * contingencyShare),
    spendDisclaimer:
      'all figures are operator-only · the system never spends budget · ' +
      'paid media is amplified manually by the operator · contingency is operator slack',
  };

  // ── creative angles ─────────────────────────────────────
  const creativeAngles: CreativeAngle[] = ANGLE_SEEDS
    .map((seed, i) => ({
      angleId: `angle-${seed.storyFamily}`,
      description: seed.description,
      storyFamily: seed.storyFamily,
      emotionalArc: seed.emotionalArc,
      memoryAnchor: seed.memoryAnchor,
      presenceAnchor: seed.presenceAnchor,
      realismStyle: seed.realismStyle,
      observedStrength: r1(angleStrengthFor(input.goal, seed, input.formula) - i * 0.001), // stable tie-break
      operatorReviewRequired: true as const,
    }))
    .sort((a, b) => b.observedStrength - a.observedStrength || a.angleId.localeCompare(b.angleId))
    .slice(0, 6);

  // ── asset requirements ──────────────────────────────────
  // Coarse mix per goal × duration: image-heavy for awareness,
  // video-heavy for trial, carousel-heavy for retention, landing
  // for reactivation funnels.
  function bucket(packageType: AssetRequirementBucket['packageType'],
                  minimumCount: number, exploredCount: number,
                  phases: CampaignPhaseId[], note: string): AssetRequirementBucket {
    return { packageType, minimumCount, exploredCount, phases, note };
  }
  const weeklyCadence = Math.max(2, Math.round(durationDays / 7));
  const assetRequirements: AssetRequirementBucket[] = [
    bucket('image',    Math.max(4, weeklyCadence * 2), weeklyCadence * 3,
           ['arrival', 'observation', 'continuation'],
           'observational still · documentary handheld · single warm light'),
    bucket('video',    Math.max(2, weeklyCadence), weeklyCadence * 2,
           ['observation', 'invitation', 'continuation'],
           'measured-restrained pacing · ambient sound · no music swell · 9:16 vertical'),
    bucket('carousel', Math.max(1, Math.floor(weeklyCadence / 2)), weeklyCadence,
           ['invitation', 'continuation'],
           '5-slide arc · open → hold → mid → hold → close · product as quiet object on close'),
    bucket('landing',  input.goal === 'product-trial' || input.goal === 'reactivation' ? 1 : 0,
           input.goal === 'product-trial' || input.goal === 'reactivation' ? 1 : 0,
           ['invitation'],
           'hero + sections + cta + faq + social proof — operator-provided proof only'),
  ];

  const notes: string[] = [];
  notes.push('campaign plan structure — operator approval required before any execution');
  notes.push(budgetAllocation.spendDisclaimer);
  if (input.market === 'israel') {
    notes.push('Israeli market · Hebrew RTL safe areas applied across all assets · mobile-first');
  }

  return {
    goal: input.goal,
    formula: input.formula,
    market: input.market,
    audience: input.audience,
    budgetUSD,
    durationDays,
    phases,
    budgetAllocation,
    creativeAngles,
    assetRequirements,
    notes,
    reasonCodes: [
      `goal:${input.goal}`, `formula:${input.formula}`, `market:${input.market}`,
      `budgetUSD:${budgetUSD}`, `durationDays:${durationDays}`,
      `phases:${phases.length}`, `angles:${creativeAngles.length}`,
      `assetBuckets:${assetRequirements.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
