/**
 * MULTI-PERSPECTIVE ENGINE (pure, observational)
 *
 * Generates PARALLEL interpretations of the same content. The engine
 * exists because the same banner can be:
 *   - emotionally honest
 *   - emotionally manipulative
 *   - nostalgic
 *   - exhausting
 *   - comforting
 *   - overstimulating
 * depending on ritual state, culture, fatigue, timing, trust history,
 * and symbolic memory.
 *
 * STRICT CONTRACT:
 *   - never picks a single interpretation
 *   - never asserts which reading is "correct"
 *   - the operator is the interpreter of last resort
 */

export interface PerspectiveInput {
  outcomes?: { outcomes?: Array<{
    audienceSegment?: string;
    emotionalSignature?: string;
    narrativeSignature?: string;
    visualStyle?: string;
    cadenceState?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    downstreamOutcome?: string;
    metrics?: { retention?: number; saves?: number; comments?: number; shares?: number; bounceRate?: number; follows?: number; rewatches?: number };
  }> } | null;
  fatigue?: { fatigueLevel?: number } | null;
  humanTruth?: { feltHumanScore?: number; signals?: { vulnerability?: number; emotionalCoherence?: number } } | null;
  rituals?: { detected?: Array<{ key: string; emotionalAttachmentScore: number }> } | null;
}

export type PerspectiveLabel =
  | 'emotionally-honest'
  | 'emotionally-manipulative'
  | 'nostalgic'
  | 'exhausting'
  | 'comforting'
  | 'overstimulating';

export interface ContentPerspective {
  label: PerspectiveLabel;
  /** Weight 0..10 — how strongly the current context supports this
   *  reading. NEVER summed to 1; perspectives are co-active. */
  weight: number;
  contextualReason: string;
}

export interface FingerprintPerspectives {
  /** Fingerprint key — emotionalSignature|narrativeSignature combo. */
  fingerprint: string;
  occurrences: number;
  perspectives: ContentPerspective[];
  notes: string[];
}

export interface MultiPerspectiveReading {
  totalFingerprints: number;
  perspectivesByFingerprint: FingerprintPerspectives[];
  /** Across all fingerprints, where do multiple perspectives co-activate? */
  highVarianceFingerprints: FingerprintPerspectives[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — multiple interpretations are PRESERVED, never collapsed. ' +
  'The system never asserts which reading is correct.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── interpretation scoring ──────────────────────────────────

type Record = NonNullable<NonNullable<PerspectiveInput['outcomes']>['outcomes']>[number];

function scoreEmotionalHonest(recs: Record[], humanTruth: PerspectiveInput['humanTruth']): { w: number; reason: string } {
  const meanRealism = avg(recs.map((r) => r.realismLevel ?? 5));
  const meanPersuasion = avg(recs.map((r) => r.persuasionIntensity ?? 5));
  const feltHuman = humanTruth?.feltHumanScore ?? 5;
  const w = clamp10(meanRealism * 0.4 + (10 - meanPersuasion) * 0.3 + feltHuman * 0.3);
  return {
    w: r1(w),
    reason: `realism ${r1(meanRealism)}/10, persuasion ${r1(meanPersuasion)}/10, felt-human ${r1(feltHuman)}/10`,
  };
}
function scoreManipulative(recs: Record[], humanTruth: PerspectiveInput['humanTruth']): { w: number; reason: string } {
  const meanPersuasion = avg(recs.map((r) => r.persuasionIntensity ?? 5));
  const meanRealism = avg(recs.map((r) => r.realismLevel ?? 5));
  const rejections = recs.filter((r) =>
    r.downstreamOutcome === 'authenticity-rejection' ||
    r.downstreamOutcome === 'aggressive-cta-rejection',
  ).length;
  const w = clamp10(
    meanPersuasion * 0.4 +
    (10 - meanRealism) * 0.3 +
    Math.min(10, rejections * 2) * 0.3,
  );
  void humanTruth;
  return {
    w: r1(w),
    reason: `persuasion ${r1(meanPersuasion)}/10, realism ${r1(meanRealism)}/10, ${rejections} rejection(s)`,
  };
}
function scoreNostalgic(recs: Record[]): { w: number; reason: string } {
  const nostalgicShare = recs.filter((r) =>
    /nostalg|childhood|memory|parents|old|past|kitchen/.test(
      ((r.emotionalSignature ?? '') + ' ' + (r.narrativeSignature ?? '') + ' ' + (r.visualStyle ?? '')).toLowerCase(),
    ),
  ).length / Math.max(recs.length, 1);
  const w = clamp10(nostalgicShare * 10);
  return { w: r1(w), reason: `${Math.round(nostalgicShare * 100)}% of records carry nostalgic tokens` };
}
function scoreExhausting(recs: Record[], fatigue: PerspectiveInput['fatigue']): { w: number; reason: string } {
  const bounce = avg(recs.map((r) => r.metrics?.bounceRate ?? 0));
  const lowRetention = avg(recs.map((r) => 1 - (r.metrics?.retention ?? 0)));
  const fatigueLevel = fatigue?.fatigueLevel ?? 0;
  const w = clamp10(bounce * 6 + lowRetention * 2 + fatigueLevel * 0.4);
  return {
    w: r1(w),
    reason: `bounce ${r1(bounce * 10)}/10, low retention ${r1(lowRetention * 10)}/10, fatigue ${r1(fatigueLevel)}/10`,
  };
}
function scoreComforting(recs: Record[], rituals: PerspectiveInput['rituals']): { w: number; reason: string } {
  const saves = avg(recs.map((r) => r.metrics?.saves ?? 0));
  const retention = avg(recs.map((r) => r.metrics?.retention ?? 0));
  const meanRitualAttachment = avg((rituals?.detected ?? []).map((d) => d.emotionalAttachmentScore));
  const w = clamp10(
    Math.min(1, saves / 5) * 4 +
    retention * 4 +
    meanRitualAttachment * 0.2,
  );
  return {
    w: r1(w),
    reason: `saves ${r1(saves)}, retention ${r1(retention * 10)}/10, ritual attachment ${r1(meanRitualAttachment)}/10`,
  };
}
function scoreOverstimulating(recs: Record[]): { w: number; reason: string } {
  const burstShare = recs.length === 0 ? 0 :
    recs.filter((r) => r.cadenceState === 'burst').length / recs.length;
  const meanPersuasion = avg(recs.map((r) => r.persuasionIntensity ?? 5));
  const w = clamp10(burstShare * 6 + Math.max(0, meanPersuasion - 5) * 0.8);
  return {
    w: r1(w),
    reason: `burst-cadence share ${Math.round(burstShare * 100)}%, persuasion ${r1(meanPersuasion)}/10`,
  };
}

// ─── main ─────────────────────────────────────────────────────

export function computeMultiPerspective(input: PerspectiveInput): MultiPerspectiveReading {
  const outcomes = input.outcomes?.outcomes ?? [];

  // Group by fingerprint (emotional + narrative signature).
  const groups = new Map<string, Record[]>();
  for (const o of outcomes) {
    const key = `${(o.emotionalSignature ?? '').toLowerCase()}|${(o.narrativeSignature ?? '').toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(o);
  }

  const perspectivesByFingerprint: FingerprintPerspectives[] = [];
  for (const [fp, recs] of groups) {
    const eh = scoreEmotionalHonest(recs, input.humanTruth);
    const em = scoreManipulative(recs, input.humanTruth);
    const ns = scoreNostalgic(recs);
    const ex = scoreExhausting(recs, input.fatigue);
    const co = scoreComforting(recs, input.rituals);
    const ov = scoreOverstimulating(recs);
    const perspectives: ContentPerspective[] = [
      { label: 'emotionally-honest',       weight: eh.w, contextualReason: eh.reason },
      { label: 'emotionally-manipulative', weight: em.w, contextualReason: em.reason },
      { label: 'nostalgic',                weight: ns.w, contextualReason: ns.reason },
      { label: 'exhausting',               weight: ex.w, contextualReason: ex.reason },
      { label: 'comforting',               weight: co.w, contextualReason: co.reason },
      { label: 'overstimulating',          weight: ov.w, contextualReason: ov.reason },
    ];
    perspectives.sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label));
    // Notes: list the perspectives with >=4 weight as "co-active".
    const coActive = perspectives.filter((p) => p.weight >= 4).map((p) => p.label);
    const notes: string[] = [];
    if (coActive.length >= 3) {
      notes.push(`multiple interpretations are co-active: ${coActive.join(', ')}`);
    } else if (coActive.length === 2) {
      notes.push(`could be read as either ${coActive[0]} or ${coActive[1]}`);
    } else if (coActive.length === 1) {
      notes.push(`leans toward ${coActive[0]}, but other readings remain possible`);
    } else {
      notes.push('no perspective strongly supported — all readings remain possible');
    }
    perspectivesByFingerprint.push({
      fingerprint: fp || 'unsigned',
      occurrences: recs.length,
      perspectives,
      notes,
    });
  }

  perspectivesByFingerprint.sort((a, b) =>
    b.occurrences - a.occurrences ||
    a.fingerprint.localeCompare(b.fingerprint),
  );

  const highVarianceFingerprints = perspectivesByFingerprint.filter((fp) => {
    const weights = fp.perspectives.map((p) => p.weight);
    const max = Math.max(...weights);
    const second = [...weights].sort((a, b) => b - a)[1] ?? 0;
    return max >= 4 && second >= 4;
  });

  return {
    totalFingerprints: perspectivesByFingerprint.length,
    perspectivesByFingerprint,
    highVarianceFingerprints,
    reasonCodes: [
      `fingerprints:${perspectivesByFingerprint.length}`,
      `high-variance:${highVarianceFingerprints.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
