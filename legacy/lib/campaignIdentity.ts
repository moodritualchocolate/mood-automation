/**
 * CAMPAIGN IDENTITY ENGINE (Phase 7)
 *
 * Campaigns must evolve like living emotional systems. The brand
 * voice should become RECOGNIZABLE WITHOUT THE LOGO.
 *
 * Reads from:
 *  - the emotional trace (lib/humanMemory.ts) — what truths/tensions
 *  - the campaign-memory-v2 (lib/campaignMemoryV2.ts) — what cores covered
 *  - the object-emotion store (lib/objectEmotionMemory.ts) — motifs
 *  - the rhythm + aftertaste records
 *
 * Produces:
 *   - dominantEmotionalVoice         — name of the cluster the campaign
 *                                      keeps coming back to
 *   - silenceLoudnessBalance         — '-1..+1', negative = silent
 *   - visualRestraintScore           — mean restraint across shipped banners
 *   - objectMotifs                   — top 5 named motifs ("coffee cup → exhaustion")
 *   - emotionalThemes                — top 3 emotional themes
 *   - humanContradictions            — recurring tension phrases
 *   - atmosphereContinuity           — banner-to-banner DNA distance avg
 *   - pacingIdentity                 — dominant emotional pacing
 *   - typographyVoice                — dominant dominance + posture
 *   - recognisability                — 0..10 — would this campaign be
 *                                      recognised without a logo
 *   - directorNote                   — one-line brand-director read
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { CampaignMemoryV2Report } from './campaignMemoryV2';
import type { ObjectMotif } from './objectEmotionMemory';
import type { ReferenceDNA } from './referenceDNA';

export interface CampaignIdentity {
  dominantEmotionalVoice: string | null;
  silenceLoudnessBalance: number;
  visualRestraintScore: number;
  objectMotifs: string[];
  emotionalThemes: string[];
  humanContradictions: string[];
  atmosphereContinuity: number;
  pacingIdentity: string | null;
  typographyVoice: string | null;
  recognisability: number;
  directorNote: string;
}

export interface CampaignIdentityInput {
  trail: EmotionalTraceEntry[];
  campaignMemoryV2: CampaignMemoryV2Report;
  motifs: ObjectMotif[];
  /** Optional — per-banner DNA snapshots for atmosphere continuity. */
  dnaTrail?: ReferenceDNA[];
}

export function synthesiseCampaignIdentity(input: CampaignIdentityInput): CampaignIdentity {
  const { trail, campaignMemoryV2, motifs, dnaTrail } = input;

  if (trail.length < 2) {
    return {
      dominantEmotionalVoice: null,
      silenceLoudnessBalance: 0,
      visualRestraintScore: 0,
      objectMotifs: [],
      emotionalThemes: [],
      humanContradictions: [],
      atmosphereContinuity: 0,
      pacingIdentity: null,
      typographyVoice: null,
      recognisability: 0,
      directorNote: 'campaign too short to have an identity yet',
    };
  }

  // Dominant emotional voice = top emotional core from CampaignMemoryV2.
  const dominantEmotionalVoice = campaignMemoryV2.coresCovered[0]?.core ?? null;

  // Silence/loudness — derived from typography dominance distribution in trail.facts.
  const dominances = trail
    .map((t) => t.facts?.typographyDominance)
    .filter(Boolean) as string[];
  const silent = dominances.filter((d) => d === 'absent' || d === 'whisper').length;
  const loud = dominances.filter((d) => d === 'loud' || d === 'timestamp').length;
  const silenceLoudnessBalance = dominances.length > 0
    ? (silent - loud) / dominances.length
    : 0;

  // Visual restraint — DNA luxury_restraint mean if we have it, else 0.6.
  const visualRestraintScore = dnaTrail && dnaTrail.length > 0
    ? avg(dnaTrail.map((d) => d.luxury_restraint))
    : 0.6;

  // Object motifs — top 5 by appearances.
  const objectMotifs = motifs
    .slice()
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, 5)
    .filter((m) => m.motifLabel)
    .map((m) => `${m.motifLabel!} (${m.appearances}× across ${Object.keys(m.emotionalCoreCounts).length} cores)`);

  // Emotional themes — top 3 cores covered.
  const emotionalThemes = campaignMemoryV2.coresCovered.slice(0, 3).map((c) => `${c.core} (×${c.count})`);

  // Human contradictions — top 5 tension phrases used.
  const humanContradictions = campaignMemoryV2.tensionsAlreadySaid.slice(0, 5);

  // Atmosphere continuity — average banner-to-banner DNA distance.
  // Lower distance = more continuity. Convert to a 0..10 where higher = better.
  let atmosphereContinuity = 5;
  if (dnaTrail && dnaTrail.length >= 3) {
    const distances: number[] = [];
    for (let i = 1; i < dnaTrail.length; i++) {
      distances.push(dnaDistanceLocal(dnaTrail[i - 1], dnaTrail[i]));
    }
    const meanDist = avg(distances);
    // Healthy band: 0.10–0.22 (matches atmosphereConsistency.ts banding).
    if (meanDist >= 0.10 && meanDist <= 0.22) atmosphereContinuity = 10;
    else if (meanDist < 0.08) atmosphereContinuity = 5;        // too tight = template
    else if (meanDist > 0.30) atmosphereContinuity = 3;        // too wide = chaos
    else atmosphereContinuity = 7;
  }

  // Pacing identity — dominant pacing in the trail's reaction curves.
  const pacingCounts: Record<string, number> = {};
  for (const t of trail) {
    const r = t.reaction.at_1s;
    pacingCounts[r] = (pacingCounts[r] ?? 0) + 1;
  }
  const pacingIdentity = Object.entries(pacingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Typography voice — dominant typography dominance + (qualitative) posture.
  const dominanceCounts: Record<string, number> = {};
  for (const d of dominances) dominanceCounts[d] = (dominanceCounts[d] ?? 0) + 1;
  const topDom = Object.entries(dominanceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const typographyVoice = topDom ?? null;

  // Recognisability — composite of:
  //   - has a dominant voice?            (0..3)
  //   - has consistent typography?       (0..2)
  //   - has stable atmosphere?           (0..3)
  //   - has accumulated object motifs?   (0..2)
  let recognisability = 0;
  if (dominantEmotionalVoice) recognisability += 3;
  if (topDom && (dominanceCounts[topDom] ?? 0) / dominances.length >= 0.5) recognisability += 2;
  if (atmosphereContinuity >= 7) recognisability += 3;
  if (objectMotifs.length >= 2) recognisability += 2;
  recognisability = Math.min(10, recognisability);

  const directorNote = buildIdentityNote({
    dominantEmotionalVoice, silenceLoudnessBalance, visualRestraintScore, recognisability, typographyVoice,
  });

  return {
    dominantEmotionalVoice,
    silenceLoudnessBalance,
    visualRestraintScore,
    objectMotifs,
    emotionalThemes,
    humanContradictions,
    atmosphereContinuity,
    pacingIdentity,
    typographyVoice,
    recognisability,
    directorNote,
  };
}

function buildIdentityNote(args: {
  dominantEmotionalVoice: string | null;
  silenceLoudnessBalance: number;
  visualRestraintScore: number;
  recognisability: number;
  typographyVoice: string | null;
}): string {
  const { dominantEmotionalVoice, silenceLoudnessBalance, visualRestraintScore, recognisability, typographyVoice } = args;
  if (!dominantEmotionalVoice) return 'campaign has not formed an identity yet';
  const parts: string[] = [];
  parts.push(`voice: ${dominantEmotionalVoice}`);
  if (silenceLoudnessBalance > 0.3) parts.push('quiet-dominant');
  else if (silenceLoudnessBalance < -0.3) parts.push('loud-dominant');
  if (visualRestraintScore > 0.7) parts.push('restraint-heavy');
  if (typographyVoice) parts.push(`type: ${typographyVoice}`);
  parts.push(`recognisability ${recognisability}/10`);
  return parts.join(' · ');
}

function avg(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function dnaDistanceLocal(a: ReferenceDNA, b: ReferenceDNA): number {
  const keys = Object.keys(a) as Array<keyof ReferenceDNA>;
  let d = 0;
  for (const k of keys) d += Math.abs(a[k] - b[k]);
  return d / keys.length;
}
