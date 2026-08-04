/**
 * CAMPAIGN DECISION LAYER — asset job picker.
 *
 * Decided BEFORE generation. The spec's rule:
 *   "Not every asset should have the same job."
 *
 * The job shapes what the Creative Director optimizes for. The
 * meta-critic enforces it as a hard constraint at approval time —
 * a "no-product" job that approves a banner with a visible product
 * is a contradiction the system refuses.
 *
 * Jobs:
 *   sell        — direct, product visible, CTA prominent
 *   validate    — emotional truth front, product as evidence
 *   interrupt   — visual impact (loud OR radically quiet)
 *   educate     — editorial, longer copy, single-idea page
 *   curiosity   — withholds something — the viewer has to lean in
 *   atmosphere  — mood only, no clear "ask"
 *   no-product  — explicit zero product in the frame
 *   anti-ad     — looks like editorial, not commercial
 *
 * Distribution: across a campaign the engine rotates jobs so the
 * audience never receives the same job two times in a row, and
 * frequent jobs (sell, validate) make room for rare ones
 * (atmosphere, anti-ad, no-product).
 */

import type { CampaignMode, MemorySnapshot } from '@/core/types';

export const ASSET_JOBS = [
  'sell',
  'validate',
  'interrupt',
  'educate',
  'curiosity',
  'atmosphere',
  'no-product',
  'anti-ad',
] as const;
export type AssetJob = (typeof ASSET_JOBS)[number];

export interface JobDecision {
  job: AssetJob;
  rationale: string;
  /** Concrete constraints the Creative Director honours. */
  constraints: {
    productMustBeAbsent: boolean;
    ctaShouldBeQuiet: boolean;
    restraintFloor: number | null;   // minimum restraint (null = no constraint)
    restraintCeiling: number | null;
    preferDominance: Array<'absent' | 'whisper' | 'editorial' | 'loud' | 'timestamp'>;
    forbidDominance: Array<'absent' | 'whisper' | 'editorial' | 'loud' | 'timestamp'>;
  };
}

export interface DecideJobInput {
  memory: MemorySnapshot;
  campaignMode: CampaignMode | null;
  seed?: number;
}

const BASE_DISTRIBUTION: Record<AssetJob, number> = {
  sell:        1.2,
  validate:    1.5,
  interrupt:   1.0,
  educate:     0.7,
  curiosity:   0.9,
  atmosphere:  0.8,
  'no-product':0.6,
  'anti-ad':   0.7,
};

const MODE_BIAS: Partial<Record<CampaignMode, Partial<Record<AssetJob, number>>>> = {
  Editorial:        { educate: 1.6, 'anti-ad': 1.4, atmosphere: 1.2 },
  Documentary:      { validate: 1.4, atmosphere: 1.3, curiosity: 1.2 },
  Performance:      { sell: 1.6, interrupt: 1.4, validate: 1.2 },
  Emotional:        { validate: 1.6, atmosphere: 1.3, curiosity: 1.2 },
  Minimal:          { 'no-product': 1.6, atmosphere: 1.4, 'anti-ad': 1.3 },
  Aggressive:       { interrupt: 1.7, sell: 1.3 },
  Luxury:           { atmosphere: 1.5, 'anti-ad': 1.4, 'no-product': 1.3 },
  'Product-focused':{ sell: 1.6, validate: 1.3, educate: 1.2 },
};

export function decideAssetJob(input: DecideJobInput): JobDecision {
  const { memory, campaignMode, seed = Date.now() } = input;
  const jobsRecent = ((memory.recentJobs ?? []) as AssetJob[]).slice(0, 6);
  const jobCounts = memory.jobFatigue ?? {};

  const scored: Array<{ job: AssetJob; score: number }> = ASSET_JOBS.map((job) => {
    let score = BASE_DISTRIBUTION[job];
    score *= MODE_BIAS[campaignMode ?? 'Editorial']?.[job] ?? 1;

    // Recent-usage fatigue: the more recently used, the more strongly penalised.
    const recencyIdx = jobsRecent.indexOf(job);
    if (recencyIdx === 0) score *= 0.1;       // last banner — strongly avoid repeat
    else if (recencyIdx === 1) score *= 0.4;
    else if (recencyIdx === 2) score *= 0.7;

    // Long-term distribution: jobs used many times overall get a soft cap.
    const long = jobCounts[job] ?? 0;
    if (long >= 4) score *= 0.5;
    if (long >= 7) score *= 0.3;

    return { job, score };
  });

  const total = scored.reduce((a, b) => a + b.score, 0);
  const rng = mulberry32(seed);
  let pick = rng() * total;
  let chosen: AssetJob = scored[0].job;
  for (const s of scored) {
    if ((pick -= s.score) <= 0) {
      chosen = s.job;
      break;
    }
  }

  return { job: chosen, rationale: rationaleFor(chosen, jobsRecent, jobCounts), constraints: constraintsFor(chosen) };
}

function rationaleFor(job: AssetJob, recent: readonly AssetJob[], counts: Record<string, number>): string {
  const reasons: string[] = [];
  if (!recent.length) reasons.push('campaign just started — picking a job that opens the rhythm');
  else if (recent[0] === job) reasons.push('we are repeating — this is a fallback selection');
  else if ((counts[job] ?? 0) <= 1) reasons.push(`job "${job}" has been under-used (${counts[job] ?? 0}× total)`);
  else reasons.push(`job "${job}" rotates against recent "${recent[0]}"`);
  return reasons.join('; ');
}

function constraintsFor(job: AssetJob): JobDecision['constraints'] {
  switch (job) {
    case 'sell':
      return {
        productMustBeAbsent: false,
        ctaShouldBeQuiet: false,
        restraintFloor: null,
        restraintCeiling: 0.7,
        preferDominance: ['editorial', 'loud'],
        forbidDominance: ['absent'],
      };
    case 'validate':
      return {
        productMustBeAbsent: false,
        ctaShouldBeQuiet: true,
        restraintFloor: 0.55,
        restraintCeiling: null,
        preferDominance: ['editorial', 'whisper'],
        forbidDominance: ['loud'],
      };
    case 'interrupt':
      return {
        productMustBeAbsent: false,
        ctaShouldBeQuiet: false,
        restraintFloor: null,
        restraintCeiling: null,
        // interrupt can be loud OR radically quiet — both are interruptions
        preferDominance: ['loud', 'timestamp', 'absent'],
        forbidDominance: ['whisper'],
      };
    case 'educate':
      return {
        productMustBeAbsent: false,
        ctaShouldBeQuiet: true,
        restraintFloor: 0.55,
        restraintCeiling: null,
        preferDominance: ['editorial'],
        forbidDominance: ['loud', 'absent'],
      };
    case 'curiosity':
      return {
        productMustBeAbsent: false,
        ctaShouldBeQuiet: true,
        restraintFloor: 0.6,
        restraintCeiling: null,
        preferDominance: ['whisper', 'editorial'],
        forbidDominance: ['loud'],
      };
    case 'atmosphere':
      return {
        productMustBeAbsent: false,
        ctaShouldBeQuiet: true,
        restraintFloor: 0.75,
        restraintCeiling: null,
        preferDominance: ['absent', 'whisper'],
        forbidDominance: ['loud', 'timestamp'],
      };
    case 'no-product':
      return {
        productMustBeAbsent: true,
        ctaShouldBeQuiet: true,
        restraintFloor: 0.65,
        restraintCeiling: null,
        preferDominance: ['whisper', 'editorial', 'timestamp'],
        forbidDominance: [],
      };
    case 'anti-ad':
      return {
        productMustBeAbsent: false,
        ctaShouldBeQuiet: true,
        restraintFloor: 0.75,
        restraintCeiling: null,
        preferDominance: ['editorial', 'absent'],
        forbidDominance: ['loud'],
      };
  }
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
