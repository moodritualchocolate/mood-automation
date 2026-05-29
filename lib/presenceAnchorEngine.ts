/**
 * PRESENCE ANCHOR ENGINE (pure, observational)
 *
 * Proposes candidate HUMAN MICRO-PRESENCE anchors. The system must
 * avoid influencer posing — these anchors are unperformed.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never selects a "best" anchor
 *   - never names a "winner"
 *   - allowed phrasing only
 */

// ─── input ────────────────────────────────────────────────────

export interface PresenceAnchorInput {
  presence?: {
    presenceScore?: number;
    stillnessWeight?: number;
    authenticityWeight?: number;
    imperfectionSignature?: number;
    vulnerabilitySignals?: number;
    emotionalBreathing?: number;
    listeningSignals?: number;
    syntheticPressure?: number;
    /** per-dimension signals 0..10 */
    signals?: {
      eyeContactStability?: number;
      hesitation?: number;
      breathingSpace?: number;
      stillness?: number;
      vulnerability?: number;
      emotionalRestraint?: number;
      awkwardness?: number;
      imperfection?: number;
      emotionalTiming?: number;
      listeningPresence?: number;
      humanFatigueVisibility?: number;
      emotionalOpenness?: number;
      selfConsciousnessTraces?: number;
      nonPerformativeBehavior?: number;
    };
  } | null;
}

// ─── output ───────────────────────────────────────────────────

export interface PresenceAnchor {
  anchorId: string;
  description: string;
  alignment: number;
  observation: string;
  reasonCodes: string[];
}

export interface PresenceAnchorReading {
  anchors: PresenceAnchor[];
  dominantAnchors: string[];
  /** 0..10 — risk that observed presence signatures appear posed. */
  influencerPosingRisk: number;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Presence anchors are exploratory structures only. ' +
  'The operator remains the creative authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function get(v: number | undefined, d = 0): number { return v ?? d; }

interface AnchorSpec {
  anchorId: string;
  description: string;
  score: (s: NonNullable<NonNullable<PresenceAnchorInput['presence']>['signals']>, p: NonNullable<PresenceAnchorInput['presence']>) => number;
}

const SPECS: AnchorSpec[] = [
  { anchorId: 'eye-contact-avoided',  description: 'eye contact avoided',
    score: (s) => 10 - get(s.eyeContactStability, 5) + get(s.selfConsciousnessTraces) * 0.3 },
  { anchorId: 'tired-smile',          description: 'tired smile',
    score: (s) => get(s.humanFatigueVisibility) * 0.6 + get(s.vulnerability) * 0.4 },
  { anchorId: 'small-pause-before-speaking', description: 'small pause before speaking',
    score: (s, p) => get(s.hesitation) * 0.5 + get(p.stillnessWeight) * 0.5 },
  { anchorId: 'slow-hand-movement',   description: 'slow hand movement',
    score: (s, p) => get(p.stillnessWeight) * 0.7 + get(s.emotionalRestraint) * 0.3 },
  { anchorId: 'exhale',               description: 'exhale',
    score: (s, p) => get(s.breathingSpace) * 0.6 + get(p.emotionalBreathing) * 0.4 },
  { anchorId: 'looking-away',         description: 'looking away',
    score: (s) => get(s.selfConsciousnessTraces) * 0.6 + get(s.vulnerability) * 0.4 },
  { anchorId: 'quiet-nod',            description: 'quiet nod',
    score: (s, p) => get(s.listeningPresence) * 0.6 + get(p.listeningSignals) * 0.4 },
  { anchorId: 'relaxed-shoulders',    description: 'relaxed shoulders',
    score: (s, p) => get(p.stillnessWeight) * 0.6 + get(s.emotionalRestraint) * 0.4 },
  { anchorId: 'imperfect-posture',    description: 'imperfect posture',
    score: (s, p) => get(s.imperfection) * 0.6 + get(p.imperfectionSignature) * 0.4 },
  { anchorId: 'honest-fatigue',       description: 'honest fatigue',
    score: (s) => get(s.humanFatigueVisibility) * 0.7 + get(s.emotionalOpenness) * 0.3 },
  { anchorId: 'unperformed-emotion',  description: 'unperformed emotion',
    score: (s) => get(s.nonPerformativeBehavior) * 0.7 + get(s.emotionalOpenness) * 0.3 },
];

// ─── main ─────────────────────────────────────────────────────

export function computePresenceAnchors(input: PresenceAnchorInput): PresenceAnchorReading {
  const p = input.presence ?? {};
  const s = (p.signals ?? {}) as NonNullable<NonNullable<PresenceAnchorInput['presence']>['signals']>;

  const anchors: PresenceAnchor[] = SPECS.map((spec) => {
    const alignment = r1(clamp10(spec.score(s, p as NonNullable<PresenceAnchorInput['presence']>)));
    return {
      anchorId: spec.anchorId,
      description: spec.description,
      alignment,
      observation: alignment >= 6
        ? `${spec.description} may carry presence weight — historically associated with felt-real presence`
        : alignment > 0
        ? `${spec.description} observed alongside the outputs — requires more evidence`
        : `${spec.description} not observed in current window`,
      reasonCodes: [`alignment:${alignment}`],
    };
  });

  const dominantAnchors = anchors.slice()
    .sort((a, b) => b.alignment - a.alignment || a.anchorId.localeCompare(b.anchorId))
    .slice(0, 5)
    .map((a) => a.anchorId);

  // Influencer-posing risk — elevated when synthetic pressure is high.
  const influencerPosingRisk = r1(clamp10(get(p.syntheticPressure)));

  const notes: string[] = [];
  if (influencerPosingRisk >= 6) {
    notes.push('influencer-posing risk observed alongside the outputs — exploration of more performed framings requires more evidence');
  }
  const anyHigh = anchors.some((a) => a.alignment >= 6);
  if (anyHigh) {
    notes.push('one or more presence anchors may carry presence weight in this window');
  } else {
    notes.push('presence anchors appear muted in this window — requires more evidence');
  }

  return {
    anchors,
    dominantAnchors,
    influencerPosingRisk,
    notes,
    reasonCodes: [
      `dominant:${dominantAnchors.join('|')}`,
      `posingRisk:${influencerPosingRisk}`,
      ...anchors.map((a) => `${a.anchorId}:${a.alignment}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
