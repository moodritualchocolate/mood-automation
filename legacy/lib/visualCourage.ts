/**
 * VISUAL COURAGE ENGINE
 *
 * Teaches the system that sometimes the strongest creative is:
 *   - almost empty
 *   - very quiet
 *   - uncomfortable
 *   - under-explained
 *   - product-light
 *   - anti-ad
 *   - documentary
 *   - imperfect
 *   - emotionally unresolved
 *
 * "The system should not always optimize toward MORE."
 *
 * The engine decides, BEFORE generation, whether this banner is one of
 * the rare ones that earns radical restraint. The choice is biased by:
 *   - the cultural moment (quiet-luxury, anti-hustle, etc. favor courage)
 *   - the asset job (atmosphere, anti-ad, no-product favor courage)
 *   - the campaign rhythm (if the campaign has been loud, courage rises)
 *   - the state family (paralysis/numbness benefit from radical quiet)
 *
 * When courage fires, the Creative Director receives an override:
 *   restraintFloor lifts to 0.85, typography dominance forced to
 *   'whisper' or 'absent', secondary line dropped, CTA quieted.
 */

import type { MemorySnapshot, HumanState } from '@/core/types';
import type { CulturalMomentId } from './culturalIntelligence';
import type { AssetJob } from './campaignDecision';

export interface CourageDecision {
  courageous: boolean;
  level: 'none' | 'restrained' | 'radical';
  reason: string;
  overrides: {
    restraintFloor: number | null;
    forceDominance: 'whisper' | 'absent' | null;
    dropSecondary: boolean;
    forceCtaQuiet: boolean;
  };
}

export interface CourageInput {
  state: HumanState;
  job: AssetJob;
  culturalMoment: CulturalMomentId;
  memory: MemorySnapshot;
  seed?: number;
}

export function decideCourage(input: CourageInput): CourageDecision {
  const { state, job, culturalMoment, memory, seed = Date.now() } = input;

  // Pressure to be courageous starts as a small base and grows from
  // multiple signals.
  let pressure = 0.10;

  // Family pressure — paralysis/numbness/collapse benefit from radical quiet.
  if (state.family === 'paralysis') pressure += 0.20;
  if (state.family === 'numbness') pressure += 0.18;
  if (state.family === 'collapse') pressure += 0.12;

  // Job pressure — atmosphere, anti-ad, no-product want courage.
  if (job === 'atmosphere' || job === 'anti-ad' || job === 'no-product') pressure += 0.25;
  if (job === 'curiosity') pressure += 0.10;

  // Cultural moment pressure.
  const courageMoments: CulturalMomentId[] = ['quiet-luxury', 'anti-hustle', 'tired-of-optimization', 'wellness-skepticism'];
  if (courageMoments.includes(culturalMoment)) pressure += 0.18;

  // Campaign rhythm pressure — if the last 3 banners were loud, courage rises.
  const recentLoudCount = (memory.recentTypographyDominances ?? [])
    .slice(0, 3)
    .filter((d) => d === 'loud' || d === 'timestamp')
    .length;
  if (recentLoudCount >= 2) pressure += 0.20;

  // Anti-fatigue — if courage hasn't been chosen recently, raise its odds.
  const recentCourage = (memory.recentCourageLevels ?? []).slice(0, 4);
  const radicalRecently = recentCourage.filter((c) => c === 'radical').length;
  if (radicalRecently === 0 && (memory.totalBanners ?? 0) >= 3) pressure += 0.08;
  if (radicalRecently >= 2) pressure -= 0.25; // anti-fatigue the other way

  const rng = mulberry32(seed);
  const dice = rng();

  let level: CourageDecision['level'] = 'none';
  if (dice < pressure - 0.15) level = 'radical';
  else if (dice < pressure) level = 'restrained';

  // Job-job override: if the job DEMANDS courage, ensure at least restrained.
  if ((job === 'atmosphere' || job === 'anti-ad' || job === 'no-product') && level === 'none') {
    level = 'restrained';
  }

  const reason = buildReason(level, state, job, culturalMoment, recentLoudCount);

  return {
    courageous: level !== 'none',
    level,
    reason,
    overrides: overridesFor(level),
  };
}

function overridesFor(level: CourageDecision['level']): CourageDecision['overrides'] {
  switch (level) {
    case 'none':
      return { restraintFloor: null, forceDominance: null, dropSecondary: false, forceCtaQuiet: false };
    case 'restrained':
      return { restraintFloor: 0.78, forceDominance: 'whisper', dropSecondary: true, forceCtaQuiet: true };
    case 'radical':
      return { restraintFloor: 0.88, forceDominance: 'absent', dropSecondary: true, forceCtaQuiet: true };
  }
}

function buildReason(
  level: CourageDecision['level'],
  state: HumanState,
  job: AssetJob,
  moment: CulturalMomentId,
  recentLoudCount: number,
): string {
  if (level === 'none') return 'no courage required — this banner can speak normally';
  const reasons: string[] = [];
  if (job === 'atmosphere' || job === 'anti-ad' || job === 'no-product') reasons.push(`job "${job}" demands restraint`);
  if (state.family === 'paralysis' || state.family === 'numbness') reasons.push(`state family "${state.family}" benefits from radical quiet`);
  if (recentLoudCount >= 2) reasons.push('campaign rhythm has been loud — courage is a balance move');
  if (moment === 'quiet-luxury' || moment === 'anti-hustle') reasons.push(`cultural moment "${moment}" wants restraint`);
  if (!reasons.length) reasons.push('courage chosen as variety against recent banners');
  return `${level} courage — ${reasons.join('; ')}`;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
