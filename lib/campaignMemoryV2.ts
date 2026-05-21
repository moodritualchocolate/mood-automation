/**
 * CAMPAIGN MEMORY ENGINE V2 (Phase 5)
 *
 * Synthesises everything the campaign brain knows into one cognition:
 *
 *   "What has this campaign already emotionally said?"
 *
 * Reads from:
 *  - the emotional trace (lib/humanMemory.ts)
 *  - the aftertaste records (lib/aftertaste.ts)
 *  - the rhythm report (lib/campaignRhythm.ts)
 *  - the engagement memory (lib/engagementMemory.ts)
 *
 * Returns:
 *  - what emotional cores have already been spoken to
 *  - which cultural moments have been used
 *  - which tensions have been said (so the next banner doesn't repeat)
 *  - which closing reactions dominate (a clue toward emotional flatness
 *    if the campaign keeps producing the same closing feeling)
 *  - a brand-director-level note on what the campaign should NEXT say
 *
 * The output is consumed by the Creative Director as a high-level
 * directive: the brand voice has covered X, Y, Z — try W next.
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { AftertasteRecord } from './aftertaste';
import type { RhythmReport } from './campaignRhythm';
import { coresForState } from './humanTruthEngine';
import type { EmotionalCoreId } from './humanTruthEngine';

export interface CampaignMemoryV2Report {
  /** Emotional cores already spoken to (with count). */
  coresCovered: Array<{ core: EmotionalCoreId; count: number }>;
  /** Which cores have NEVER been spoken to. */
  coresMissing: EmotionalCoreId[];
  /** Cultural moments used in the campaign so far. */
  culturalMomentsUsed: Array<{ id: string; count: number }>;
  /** The closing reactions the campaign has produced (dominant one named). */
  dominantClosingReaction: string | null;
  /** True when more than half of recent banners close on the same reaction
   *  — the campaign is producing one feeling too many times in a row. */
  emotionalFlatnessRisk: boolean;
  /** Tensions already said — the brain refuses to repeat a tension verbatim. */
  tensionsAlreadySaid: string[];
  /** The brand-director note on what the campaign should NEXT say. */
  directorNote: string;
  /** When > 0, this is the strength of the spec's named "what has this
   *  campaign already emotionally said?" — used by the meta-critic to
   *  pressure variety when the answer to that question is "the same
   *  thing five times". 0..10. */
  saturationScore: number;
  /** True when atmosphere is at risk of collapsing into one mood. */
  atmosphereAtRisk: boolean;
}

export interface CampaignMemoryV2Input {
  trail: EmotionalTraceEntry[];
  aftertaste: AftertasteRecord[];
  rhythm: RhythmReport;
}

const ALL_CORE_IDS: EmotionalCoreId[] = [
  'depletion','overstimulation','guilt','shame','avoidance','emotional-numbness',
  'too-tired-to-rest','digital-fatigue','doomscrolling','social-performance-exhaustion',
  'internal-contradiction','hyper-awareness','loneliness-in-public','decision-fatigue',
  'inability-to-land','overstimulated-but-flat','silent-burnout','revenge-bedtime-procrastination',
  'emotional-fragmentation','hidden-anxiety','invisible-pressure','functional-collapse','emotional-drift',
];

export function synthesiseCampaignMemoryV2(input: CampaignMemoryV2Input): CampaignMemoryV2Report {
  const { trail, aftertaste, rhythm } = input;

  // ─── coresCovered / coresMissing ──────────────────────────────
  const coreCount = new Map<EmotionalCoreId, number>();
  for (const t of trail) {
    const cores = coresForState(t.stateId);
    for (const c of cores) coreCount.set(c.id, (coreCount.get(c.id) ?? 0) + 1);
  }
  const coresCovered = Array.from(coreCount.entries())
    .map(([core, count]) => ({ core, count }))
    .sort((a, b) => b.count - a.count);
  const coresMissing = ALL_CORE_IDS.filter((c) => !coreCount.has(c));

  // ─── cultural moments ─────────────────────────────────────────
  const momentCount = new Map<string, number>();
  for (const t of trail) {
    if (t.culturalMoment) momentCount.set(t.culturalMoment, (momentCount.get(t.culturalMoment) ?? 0) + 1);
  }
  const culturalMomentsUsed = Array.from(momentCount.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);

  // ─── closing reactions & flatness ────────────────────────────
  const closings = new Map<string, number>();
  for (const t of trail.slice(0, 8)) closings.set(t.reaction.at_3s, (closings.get(t.reaction.at_3s) ?? 0) + 1);
  const closingList = Array.from(closings.entries()).sort((a, b) => b[1] - a[1]);
  const dominantClosingReaction = closingList[0]?.[0] ?? null;
  const emotionalFlatnessRisk = (closingList[0]?.[1] ?? 0) >= Math.max(3, Math.ceil(Math.min(trail.length, 8) / 2));

  // ─── tensions already said ────────────────────────────────────
  const tensionsAlreadySaid = Array.from(new Set(trail.map((t) => t.tension).filter(Boolean))).slice(0, 12);

  // ─── saturation score ────────────────────────────────────────
  // High saturation = a small number of cores carrying most of the campaign.
  let saturationScore = 0;
  if (trail.length >= 4 && coresCovered.length > 0) {
    const total = coresCovered.reduce((a, b) => a + b.count, 0);
    const topShare = coresCovered[0].count / total;
    saturationScore = clamp10((topShare - 0.35) * 20);
  }

  // ─── atmosphere risk ─────────────────────────────────────────
  const atmosphereAtRisk = emotionalFlatnessRisk || saturationScore >= 5 ||
    (rhythm.healthScore < 5 && rhythm.mostImbalanced !== null) ||
    averageResidueFalling(aftertaste);

  // ─── director note ───────────────────────────────────────────
  const directorNote = buildDirectorNote({
    coresCovered, coresMissing, dominantClosingReaction, emotionalFlatnessRisk,
    saturationScore, rhythm, atmosphereAtRisk,
  });

  return {
    coresCovered,
    coresMissing,
    culturalMomentsUsed,
    dominantClosingReaction,
    emotionalFlatnessRisk,
    tensionsAlreadySaid,
    directorNote,
    saturationScore,
    atmosphereAtRisk,
  };
}

function averageResidueFalling(records: AftertasteRecord[]): boolean {
  if (records.length < 4) return false;
  const sorted = records.slice().sort((a, b) => a.shippedAt - b.shippedAt);
  const mid = Math.floor(sorted.length / 2);
  const early = sorted.slice(0, mid);
  const late = sorted.slice(mid);
  const earlyAvg = early.reduce((a, b) => a + b.residueStrength, 0) / early.length;
  const lateAvg = late.reduce((a, b) => a + b.residueStrength, 0) / late.length;
  return lateAvg < earlyAvg - 1.5;
}

function buildDirectorNote(input: {
  coresCovered: Array<{ core: EmotionalCoreId; count: number }>;
  coresMissing: EmotionalCoreId[];
  dominantClosingReaction: string | null;
  emotionalFlatnessRisk: boolean;
  saturationScore: number;
  rhythm: RhythmReport;
  atmosphereAtRisk: boolean;
}): string {
  const { coresCovered, coresMissing, dominantClosingReaction, emotionalFlatnessRisk, saturationScore, rhythm, atmosphereAtRisk } = input;

  if (coresCovered.length === 0) return 'campaign has not spoken yet — first banner is free';

  const parts: string[] = [];
  if (emotionalFlatnessRisk && dominantClosingReaction) {
    parts.push(`campaign has produced "${dominantClosingReaction}" too many times in a row — next banner should land somewhere else`);
  }
  if (saturationScore >= 5) {
    parts.push(`single emotional core "${coresCovered[0].core}" carrying ${coresCovered[0].count}× the rest — broaden`);
  }
  if (coresMissing.length > 0 && coresCovered.length >= 3) {
    const candidate = coresMissing[Math.floor(Math.random() * coresMissing.length)];
    parts.push(`the campaign has not yet spoken to "${candidate}" — that is an option for the next banner`);
  }
  if (rhythm.mostImbalanced) {
    parts.push(`rhythm imbalance on ${rhythm.mostImbalanced}`);
  }
  if (atmosphereAtRisk) {
    parts.push('atmosphere at risk — pull restraint up, broaden the emotional surface');
  }
  if (parts.length === 0) return 'campaign rhythm looks healthy — continue without correction';
  return parts.join(' · ');
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
