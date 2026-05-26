/**
 * REFUSAL NARRATIVE ENGINE (advisory, pure)
 *
 * Pure deterministic function. Given current creative + stability +
 * trust + drift signals, returns refusal language that sounds like
 * elite creative leadership: calm, intelligent, restrained.
 *
 * NOT poetry. NOT philosophy. NOT random metaphors. The selection is
 * driven by which signal is most pressing — every sentence is a
 * deterministic dispatch from a thresholded signal table.
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - no critic / pipeline / generation imports
 *   - no mutation of any input
 *   - never applies any refusal — only describes
 *
 * Same input → same output.
 */

export type RefusalSeverity = 'mild' | 'moderate' | 'serious' | 'severe';

export interface RefusalNarrativeInput {
  formula: string;
  campaignMode: string | null;
  brutality: number;

  stabilizationStatus?: string;
  trustDebt?: number;             // 0..10
  repetitionPressure?: number;    // 0..10
  drift?: number;                 // 0..10
  entropy?: number;               // 0..10
  narrativeStability?: number;    // 0..10
  persuasionVariance?: number;    // 0..10
  emotionalCompression?: number;  // 0..10 — saturation of most-used emotion
  identityErosion?: number;       // 0..10
  dignityErosion?: number;        // 0..10
  refusalReason?: string;
}

export interface RefusalNarrativeOutput {
  severity: RefusalSeverity;
  narrativeReason: string;
  creativeDiagnosis: string;
  strategicRisk: string;
  suggestedDirection: string;
  emotionalInterpretation: string;
  trustImpact: string;
  dignityImpact: string;
  reasonCodes: string[];
}

// ─── signal classification ─────────────────────────────────────

interface SignalRow {
  key: string;
  pressure: number;       // 0..10 — how loud this signal is
}

function rankSignals(input: RefusalNarrativeInput): SignalRow[] {
  // Each signal converted to a 0..10 "pressure" reading.
  const rows: SignalRow[] = [
    { key: 'trust-debt',            pressure: input.trustDebt            ?? 0 },
    { key: 'repetition-pressure',   pressure: input.repetitionPressure   ?? 0 },
    { key: 'drift',                 pressure: input.drift                ?? 0 },
    { key: 'emotional-compression', pressure: input.emotionalCompression ?? 0 },
    { key: 'identity-erosion',      pressure: input.identityErosion      ?? 0 },
    { key: 'dignity-erosion',       pressure: input.dignityErosion       ?? 0 },
    { key: 'persuasion-collapse',   pressure: 10 - (input.persuasionVariance ?? 5) },
    { key: 'narrative-collapse',    pressure: 10 - (input.narrativeStability ?? 5) },
    { key: 'low-entropy',           pressure: 10 - (input.entropy             ?? 5) },
    { key: 'high-brutality',        pressure: input.brutality * 10 }, // brutality 0..1
  ];
  return rows.sort((a, b) => b.pressure - a.pressure);
}

function severityOf(pressure: number): RefusalSeverity {
  if (pressure >= 8) return 'severe';
  if (pressure >= 6) return 'serious';
  if (pressure >= 4) return 'moderate';
  return 'mild';
}

// ─── narrative templates ──────────────────────────────────────
//
// Each template is a tight, restrained articulation. No metaphor for
// metaphor's sake. The voice is creative strategy leadership.

interface NarrativeTemplate {
  narrativeReason: string;
  creativeDiagnosis: string;
  strategicRisk: string;
  suggestedDirection: string;
  emotionalInterpretation: string;
  trustImpact: string;
  dignityImpact: string;
}

const TEMPLATES: Record<string, NarrativeTemplate> = {
  'trust-debt': {
    narrativeReason:
      'The campaign begins optimizing attention at the expense of trust continuity.',
    creativeDiagnosis:
      'Trust debt has compounded across recent runs; the audience reads the brand as transacting rather than relating.',
    strategicRisk:
      'Short-term conversion gains will arrive paired with long-term skepticism and reduced repeat exposure.',
    suggestedDirection:
      'Lead with observational framing. Let the product appear without performing.',
    emotionalInterpretation:
      'The audience is being asked to give before being given anything; the exchange is no longer balanced.',
    trustImpact:
      'Net negative — credibility erodes faster than persuasion compounds.',
    dignityImpact:
      'Brand dignity is starting to spend down its reserve.',
  },
  'repetition-pressure': {
    narrativeReason:
      'The system is recycling its own emphasis; the audience has seen this rhythm before.',
    creativeDiagnosis:
      'Recent generations are clustering around a small vocabulary of hooks and audience proxies.',
    strategicRisk:
      'Recognition without surprise predicts a flat conversion curve and accelerated audience fatigue.',
    suggestedDirection:
      'Rotate hook structure. Permit a slower opening. Allow a longer beat before the proposition.',
    emotionalInterpretation:
      'The work is becoming legible the moment it starts — the audience already knows where it ends.',
    trustImpact:
      'Neutral now, eroding over the next several runs if not interrupted.',
    dignityImpact:
      'Minor — predictability reads as decision-making fatigue more than aggression.',
  },
  'drift': {
    narrativeReason:
      'The creative organism has drifted from its earlier emotional center.',
    creativeDiagnosis:
      'Trajectory deltas across trust, fatigue, and narrative pattern have all moved in the same direction.',
    strategicRisk:
      'A consistent campaign voice is being replaced by run-to-run improvisation.',
    suggestedDirection:
      'Pause and reanchor against the original emotional intent before the next run.',
    emotionalInterpretation:
      'The work is being made by a different posture than it was a month ago.',
    trustImpact:
      'Slowly eroding — the audience reads inconsistency before they articulate it.',
    dignityImpact:
      'At risk if drift continues without an explicit course correction.',
  },
  'emotional-compression': {
    narrativeReason:
      'A single emotional register is being asked to carry every campaign moment.',
    creativeDiagnosis:
      'The most-used emotional frame has saturated; contrast frames have receded out of use.',
    strategicRisk:
      'Without contrast, no single emotion can land with weight — the entire palette flattens.',
    suggestedDirection:
      'Introduce stillness. Allow one beat where nothing is being asked of the audience.',
    emotionalInterpretation:
      'Every moment is performing the same emotion; the brand has only one expression left.',
    trustImpact:
      'Neutral now, but the audience will read sameness as inattention.',
    dignityImpact:
      'Moderate — repeated emotion at high intensity reads as manipulation.',
  },
  'identity-erosion': {
    narrativeReason:
      'The brand is no longer recognizable as itself across recent runs.',
    creativeDiagnosis:
      'Identity continuity scores have fragmented; the same campaign assumes different postures from one generation to the next.',
    strategicRisk:
      'A loss of recognizable identity is a loss of brand equity.',
    suggestedDirection:
      'Hold formula. Hold mode. Let identity reconstitute over the next several runs before introducing variation.',
    emotionalInterpretation:
      'The brand is in a moment of confusion about who it is for.',
    trustImpact:
      'Net negative — recognition is the precondition for trust.',
    dignityImpact:
      'Erodes when the audience begins to perceive the brand as a moving target.',
  },
  'dignity-erosion': {
    narrativeReason:
      'The composition is increasing conversion aggression while degrading perceived honesty.',
    creativeDiagnosis:
      'Dignity erosion score has elevated; restraint is being spent.',
    strategicRisk:
      'Dignity is the slowest of all brand metrics to rebuild — losses here compound.',
    suggestedDirection:
      'Reduce CTA intensity. Let the product appear in observational rather than declarative framing.',
    emotionalInterpretation:
      'The work is starting to feel like it is selling, rather than showing.',
    trustImpact:
      'Negative — audiences read selling as needing something from them.',
    dignityImpact:
      'Direct — this is the dignity axis itself eroding.',
  },
  'persuasion-collapse': {
    narrativeReason:
      'Persuasion variety has collapsed to a single mode.',
    creativeDiagnosis:
      'Recent strategy observations select the same persuasion mode across runs; the system is no longer choosing between options, it is repeating one.',
    strategicRisk:
      'A campaign with one persuasion mode reads as a campaign with one idea.',
    suggestedDirection:
      'Let an objection-breaker or trust-builder mode carry the next run.',
    emotionalInterpretation:
      'The brand is making the same argument every time, which is the same as making no argument.',
    trustImpact:
      'Eroding — single-mode persuasion is recognizable and dismissible.',
    dignityImpact:
      'Mild — reads as creative fatigue, not aggression.',
  },
  'narrative-collapse': {
    narrativeReason:
      'The narrative no longer feels observed. It feels manufactured.',
    creativeDiagnosis:
      'Recent campaign patterns repeat the same fingerprint at a high rate.',
    strategicRisk:
      'A repeated narrative is a narrative the audience can skip without reading.',
    suggestedDirection:
      'Allow one run to break the pattern. Documentary realism. No payoff.',
    emotionalInterpretation:
      'The work has become a routine the brand is performing for itself.',
    trustImpact:
      'Eroding — repetition without intention reads as automation.',
    dignityImpact:
      'Moderate — repetition at scale reads as not caring.',
  },
  'low-entropy': {
    narrativeReason:
      'The visual language is converging into synthetic familiarity.',
    creativeDiagnosis:
      'Combined diversity across formula, mode, audience and persuasion is below the safe band.',
    strategicRisk:
      'When everything looks like itself, the audience stops perceiving it.',
    suggestedDirection:
      'Inject one composition that abandons the current rhythm entirely.',
    emotionalInterpretation:
      'The work has become readable as a single artifact across multiple runs.',
    trustImpact:
      'Neutral now — the audience does not yet know what is happening.',
    dignityImpact:
      'Mild — convergence reads as conservatism, not aggression.',
  },
  'high-brutality': {
    narrativeReason:
      'This emotional pressure collapses the ritual tone into transactional urgency.',
    creativeDiagnosis:
      'Critic strictness has been pushed past the band where ritual posture survives.',
    strategicRisk:
      'High brutality applied to ritual brands reads as panic.',
    suggestedDirection:
      'Lower brutality by one band and let the critic select for restraint rather than urgency.',
    emotionalInterpretation:
      'The campaign is asking for the audience’s attention with raised voice.',
    trustImpact:
      'Negative when sustained — urgency without grounding reads as exploitation.',
    dignityImpact:
      'Moderate — urgent register erodes ritual dignity quickly.',
  },
};

const FALLBACK_TEMPLATE: NarrativeTemplate = {
  narrativeReason:
    'No single pressure signal dominates the current request — the system is operating within its observed envelope.',
  creativeDiagnosis:
    'All signals are within range. The advisory cannot identify a specific creative concern.',
  strategicRisk: 'None identified at this time.',
  suggestedDirection: 'Proceed as planned.',
  emotionalInterpretation: 'The request reads as in-character for the formula and mode.',
  trustImpact: 'Neutral.',
  dignityImpact: 'Neutral.',
};

// ─── main ─────────────────────────────────────────────────────

export function computeRefusalNarrative(
  input: RefusalNarrativeInput,
): RefusalNarrativeOutput {
  const rows = rankSignals(input);
  const top = rows[0];
  const pressure = top?.pressure ?? 0;
  const severity = severityOf(pressure);

  // Deterministic template selection. If the top pressure is too low,
  // we use the fallback (within-envelope) template.
  const template = pressure >= 4
    ? (TEMPLATES[top.key] ?? FALLBACK_TEMPLATE)
    : FALLBACK_TEMPLATE;

  const reasonCodes: string[] = [
    `severity:${severity}`,
    `top-signal:${top?.key ?? 'none'}`,
    `top-signal-pressure:${Math.round(pressure * 10) / 10}`,
  ];
  // Include the secondary signal as additional context.
  if (rows[1] && rows[1].pressure >= 4) {
    reasonCodes.push(`secondary-signal:${rows[1].key}:${Math.round(rows[1].pressure * 10) / 10}`);
  }
  if (input.refusalReason) reasonCodes.push(`underlying:${input.refusalReason}`);

  return {
    severity,
    narrativeReason: template.narrativeReason,
    creativeDiagnosis: template.creativeDiagnosis,
    strategicRisk: template.strategicRisk,
    suggestedDirection: template.suggestedDirection,
    emotionalInterpretation: template.emotionalInterpretation,
    trustImpact: template.trustImpact,
    dignityImpact: template.dignityImpact,
    reasonCodes,
  };
}
