/**
 * EMOTIONAL SCAR ENGINE (pure, observational)
 *
 * Distinguishes emotional DEPTH from emotional HARM. Emotional depth
 * is allowed. Emotional exploitation is not.
 *
 * Classifies each window into one of four overall postures:
 *   - soft
 *   - heavy
 *   - exploitative-risk
 *   - dignity-preserved
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never recommends content
 *   - never optimizes for traumatic engagement
 *   - allowed phrasing: "historically associated", "may carry memory weight",
 *     "observed alongside", "dignity-preserved", "requires more evidence"
 *   - forbidden: viral / outrage / dopamine optimization, trauma
 *     exploitation, grief exploitation, forced sentimentality language
 */

// ─── loose structural subsets ────────────────────────────────

export interface ScarOutcomeSubset {
  outcomes?: Array<{
    emotionalSignature?: string;
    narrativeSignature?: string;
    visualStyle?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    downstreamOutcome?: string;
  }>;
}

export interface ScarNarrativeSubset {
  fingerprints?: Array<{
    emotionalCadence?: string;
    narrationStyle?: string;
    humanRealism?: number;
    ctaPressure?: number;
    observationalDensity?: number;
  }>;
}

export interface EmotionalScarInput {
  outcomes?: ScarOutcomeSubset | null;
  narrativeDNA?: ScarNarrativeSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface EmotionalScarSignals {
  softScar: number;
  reflectiveAche: number;
  unresolvedTenderness: number;
  griefPressure: number;
  nostalgiaAche: number;
  regretResonance: number;
  emotionalHeaviness: number;
  dignityPreservation: number;
  exploitationRisk: number;
}

export type ScarVerdict = 'soft' | 'heavy' | 'exploitative-risk' | 'dignity-preserved';

export interface EmotionalScarReading {
  totalObservations: number;
  signals: EmotionalScarSignals;
  verdict: ScarVerdict;
  /** Top 3 elevated scar signals. */
  dominantScarSignals: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system distinguishes emotional depth from harm. ' +
  'Emotional depth is allowed. Emotional harm is not.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Out = NonNullable<ScarOutcomeSubset['outcomes']>[number];

function matches(o: Out, re: RegExp): boolean {
  const hay = ((o.emotionalSignature ?? '') + ' ' +
               (o.narrativeSignature ?? '') + ' ' +
               (o.visualStyle ?? '')).toLowerCase();
  return re.test(hay);
}

function shareOf(records: Out[], predicate: (o: Out) => boolean): number {
  if (records.length === 0) return 0;
  return records.filter(predicate).length / records.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeEmotionalScar(input: EmotionalScarInput): EmotionalScarReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const narrativeFps = input.narrativeDNA?.fingerprints ?? [];

  const meanPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const meanCta = avg(narrativeFps.map((f) => f.ctaPressure ?? 5));
  const meanObs = avg(narrativeFps.map((f) => f.observationalDensity ?? 5));
  const meanHumanRealism = avg(narrativeFps.map((f) => f.humanRealism ?? 5));

  // ── soft scar ────────────────────────────────────────────
  const softShare = shareOf(outcomes, (o) =>
    matches(o, /soft|gentle|tender|quiet|warm|still|kindness|warmth/),
  );
  const softScar = clamp10(softShare * 8 + meanObs * 0.2);

  // ── reflective ache ──────────────────────────────────────
  const reflectiveShare = shareOf(outcomes, (o) =>
    matches(o, /reflect|thought|wonder|miss|ache|remember|notice|pause/),
  );
  const reflectiveAche = clamp10(reflectiveShare * 8 + meanObs * 0.2);

  // ── unresolved tenderness ────────────────────────────────
  const tenderShare = shareOf(outcomes, (o) =>
    matches(o, /tender|gentle|whisper|close|hand|shoulder/),
  );
  const unresolvedShare = shareOf(outcomes, (o) =>
    matches(o, /unresolved|left|open|unsaid|silent|paused|hovering|waiting/),
  );
  const unresolvedTenderness = clamp10(tenderShare * 5 + unresolvedShare * 5);

  // ── grief pressure ───────────────────────────────────────
  const griefShare = shareOf(outcomes, (o) =>
    matches(o, /grief|loss|gone|empty|absence|funeral|mourn|goodbye|last/),
  );
  const griefPressure = clamp10(griefShare * 10);

  // ── nostalgia ache ───────────────────────────────────────
  const nostalgicShare = shareOf(outcomes, (o) =>
    matches(o, /nostalg|childhood|then|years ago|old|past|miss those|remember when/),
  );
  const nostalgiaAche = clamp10(nostalgicShare * 10);

  // ── regret resonance ─────────────────────────────────────
  const regretShare = shareOf(outcomes, (o) =>
    matches(o, /regret|shoulda|should have|wish i|too late|if only|wish we/),
  );
  const regretResonance = clamp10(regretShare * 10);

  // ── emotional heaviness ──────────────────────────────────
  const heavyShare = shareOf(outcomes, (o) =>
    matches(o, /heavy|grief|loss|funeral|hospital|dying|cancer|trauma|broken/),
  );
  const emotionalHeaviness = clamp10(
    heavyShare * 7 + griefPressure * 0.3,
  );

  // ── dignity preservation ─────────────────────────────────
  // Inverse of CTA pressure + persuasion intensity on heavy emotional content.
  // High when emotional content is observed alongside restraint.
  const dignityPreservation = clamp10(
    10 - Math.max(0, meanPersuasion - 5) * 0.7 -
    Math.max(0, meanCta - 5) * 0.6 +
    meanObs * 0.2 +
    meanHumanRealism * 0.15,
  );

  // ── exploitation risk ────────────────────────────────────
  // Heavy emotional content + aggressive CTA or persuasion = exploitative.
  const aggressiveCtaRejection = shareOf(outcomes, (o) =>
    o.downstreamOutcome === 'aggressive-cta-rejection',
  );
  const traumaticEmoShare = heavyShare + griefShare;
  const persuasionOnHeavy = traumaticEmoShare * Math.max(0, meanPersuasion - 5);
  const ctaOnHeavy = traumaticEmoShare * Math.max(0, meanCta - 5);
  const exploitationRisk = clamp10(
    persuasionOnHeavy * 1.2 + ctaOnHeavy * 0.8 + aggressiveCtaRejection * 6,
  );

  const signals: EmotionalScarSignals = {
    softScar:              r1(softScar),
    reflectiveAche:        r1(reflectiveAche),
    unresolvedTenderness:  r1(unresolvedTenderness),
    griefPressure:         r1(griefPressure),
    nostalgiaAche:         r1(nostalgiaAche),
    regretResonance:       r1(regretResonance),
    emotionalHeaviness:    r1(emotionalHeaviness),
    dignityPreservation:   r1(dignityPreservation),
    exploitationRisk:      r1(exploitationRisk),
  };

  // ── verdict ──────────────────────────────────────────────
  // Priority:
  //   exploitative-risk wins if exploitationRisk >= 5
  //   heavy if emotionalHeaviness >= 6 AND not exploitative
  //   dignity-preserved if dignityPreservation >= 7 AND not exploitative
  //   soft otherwise
  let verdict: ScarVerdict;
  if (signals.exploitationRisk >= 5) verdict = 'exploitative-risk';
  else if (signals.emotionalHeaviness >= 6) verdict = 'heavy';
  else if (signals.dignityPreservation >= 7) verdict = 'dignity-preserved';
  else verdict = 'soft';

  const dominantScarSignals = Object.entries(signals)
    .map(([k, v]) => [k, v as number] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  notes.push(`observed posture appears ${verdict}`);
  if (signals.exploitationRisk >= 5) {
    notes.push('exploitation risk observed alongside heavy emotional content paired with persuasion / CTA pressure');
  }
  if (signals.dignityPreservation >= 7) notes.push('dignity-preserved signature observed alongside the outputs');
  if (signals.softScar >= 6) notes.push('soft-scar signature observed — historically associated with remembered tenderness');
  if (signals.reflectiveAche >= 6) notes.push('reflective ache observed alongside the outputs');
  if (signals.nostalgiaAche >= 6) notes.push('nostalgia ache observed alongside the outputs');
  if (signals.griefPressure >= 6 && signals.dignityPreservation < 6) {
    notes.push('grief pressure observed alongside lower dignity preservation — requires more evidence');
  }
  if (notes.length === 1) notes.push('scar signals balanced in the current window');

  return {
    totalObservations: outcomes.length + narrativeFps.length,
    signals,
    verdict,
    dominantScarSignals,
    notes,
    reasonCodes: [
      `verdict:${verdict}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
