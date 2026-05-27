/**
 * REFLECTION ENGINE (pure, observational)
 *
 * Performs structured reflection over the system's observations.
 * The engine generates QUESTIONS, not answers. It asks why a pattern
 * may have emerged, what assumptions may be false, what tensions
 * coexist, what observations remain unresolved, what hidden factors
 * may exist. It NEVER concludes certainty.
 *
 * STRICT CONTRACT:
 *   - no autonomous conclusions
 *   - no prediction
 *   - no winner selection
 *   - phrasing: "why did ___?", "could it be that ___?", "what if ___?"
 */

export interface ReflectionInput {
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
  drift?: { observations?: Array<{
    overallCreativeHealth?: number;
    trustErosionDrift?: number;
    persuasionVariance?: number;
    narrativeStability?: number;
    emotionalDiversity?: number;
  }> } | null;
  contradictions?: { contradictions?: Array<{ key: string; severity: number }> } | null;
  ambiguities?: { ambiguities?: Array<{ zone: string; severity: number }> } | null;
  humanTruth?: { feltHumanScore?: number; signals?: { dignity?: number; vulnerability?: number } } | null;
}

export interface ReflectionQuestion {
  category: 'pattern-origin' | 'assumption-doubt' | 'tension-coexistence' |
            'competing-explanation' | 'unresolved-observation' |
            'hidden-factor' | 'invisible-dynamic' | 'metric-illusion';
  question: string;
  prompts: string[];
  /** 0..10 — how strongly this question is supported by the data. */
  weight: number;
}

export interface ReflectionReading {
  totalQuestions: number;
  reflections: ReflectionQuestion[];
  /** 0..10 — overall reflective depth of the current observation. */
  reflectiveDepth: number;
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — reflection generates QUESTIONS, not answers. ' +
  'The engine never concludes certainty. Uncertainty is preserved, never collapsed.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeReflections(input: ReflectionInput): ReflectionReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const driftObs = input.drift?.observations ?? [];
  const contradictions = input.contradictions?.contradictions ?? [];
  const ambiguities = input.ambiguities?.ambiguities ?? [];
  const reflections: ReflectionQuestion[] = [];

  // 1. Pattern origin — why did a recurring outcome emerge?
  const outcomeCounts = new Map<string, number>();
  for (const o of outcomes) {
    const k = o.downstreamOutcome ?? 'unlabeled';
    outcomeCounts.set(k, (outcomeCounts.get(k) ?? 0) + 1);
  }
  for (const [outcome, count] of outcomeCounts) {
    if (count >= 3) {
      reflections.push({
        category: 'pattern-origin',
        question: `why did "${outcome}" recur ${count} times?`,
        prompts: [
          'what conditions were shared across those records?',
          'what was true at those moments that was not true elsewhere?',
          'could the pattern be reading something the metrics do not show?',
        ],
        weight: r1(clamp10(count * 1.5)),
      });
    }
  }

  // 2. Assumption doubt — when high engagement coexists with no trust.
  const meanRetention = avg(outcomes.map((o) => o.metrics?.retention ?? 0));
  const trustFormCount = outcomes.filter((o) => o.downstreamOutcome === 'trust-formation').length;
  if (meanRetention >= 0.5 && outcomes.length >= 4 && trustFormCount / outcomes.length < 0.25) {
    reflections.push({
      category: 'assumption-doubt',
      question: 'is high retention being read as engagement when it could be attention without consent?',
      prompts: [
        'are we measuring time-on-content as if it equals interest?',
        'could the same retention figures coexist with growing distrust?',
        'what would we need to see to confirm engagement is voluntary?',
      ],
      weight: r1(clamp10(meanRetention * 10 - trustFormCount * 2)),
    });
  }

  // 3. Tension coexistence — surface the strongest existing contradiction
  for (const c of contradictions.slice(0, 3)) {
    reflections.push({
      category: 'tension-coexistence',
      question: `how can "${c.key}" be simultaneously true?`,
      prompts: [
        'what would resolving this tension cost?',
        'could keeping both sides alive be the honest reading?',
        'what is the audience experiencing that the metrics cannot show?',
      ],
      weight: r1(c.severity),
    });
  }

  // 4. Competing explanation — for ambiguous zones
  for (const a of ambiguities.slice(0, 3)) {
    reflections.push({
      category: 'competing-explanation',
      question: `what explanations could account for the ambiguity in "${a.zone}"?`,
      prompts: [
        'is this ambiguity an artifact of measurement, or a real coexistence?',
        'what context would a human use to disambiguate?',
        'what could we observe that the engine cannot?',
      ],
      weight: r1(a.severity),
    });
  }

  // 5. Unresolved observation — recovery patterns with uneven recovery
  const meanHealth = avg(driftObs.map((o) => o.overallCreativeHealth ?? 5));
  const trustErosion = avg(driftObs.map((o) => Math.abs(o.trustErosionDrift ?? 0)));
  if (meanHealth >= 6 && trustErosion >= 2) {
    reflections.push({
      category: 'unresolved-observation',
      question: 'why does overall health stay healthy while trust still erodes?',
      prompts: [
        'could health be measuring breadth while trust measures depth?',
        'is the system being healthy for the wrong reasons?',
        'what would health that protects trust look like?',
      ],
      weight: r1(clamp10(trustErosion * 2 + (meanHealth - 5))),
    });
  }

  // 6. Hidden factor — non-trivial number of outcomes labeled 'unlabeled'
  const unlabeledCount = outcomes.filter((o) => o.downstreamOutcome === 'unlabeled').length;
  if (unlabeledCount >= 3) {
    reflections.push({
      category: 'hidden-factor',
      question: `what is happening in the ${unlabeledCount} records the labeling pass could not name?`,
      prompts: [
        'are these records ambiguous, or is the labeling vocabulary too narrow?',
        'could there be a downstream effect the current labels do not see?',
      ],
      weight: r1(clamp10(unlabeledCount)),
    });
  }

  // 7. Invisible dynamic — high dignity + high felt-human but trust still drifts
  const dignity = input.humanTruth?.signals?.dignity ?? -1;
  const feltHuman = input.humanTruth?.feltHumanScore ?? -1;
  if (dignity >= 6 && feltHuman >= 6 && trustErosion >= 2) {
    reflections.push({
      category: 'invisible-dynamic',
      question: 'why does trust drift even when the content reads dignified and felt-human?',
      prompts: [
        'could the issue be cadence rather than content?',
        'could the issue be context rather than craft?',
        'is the trust signal measuring something the felt-human signal cannot see?',
      ],
      weight: r1(clamp10(trustErosion * 2)),
    });
  }

  // 8. Metric illusion — when conversion is high but emotional resonance is rare
  const conversionShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'conversion-spike').length / outcomes.length;
  const resonanceShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'emotional-resonance').length / outcomes.length;
  if (conversionShare >= 0.3 && resonanceShare <= 0.1 && outcomes.length >= 4) {
    reflections.push({
      category: 'metric-illusion',
      question: 'if conversion is the dominant outcome, what is conversion actually measuring here?',
      prompts: [
        'is the audience choosing the product or being pushed toward it?',
        'what would conversion look like if trust were the limiting factor?',
      ],
      weight: r1(clamp10(conversionShare * 10)),
    });
  }

  reflections.sort((a, b) => b.weight - a.weight || a.question.localeCompare(b.question));

  const reflectiveDepth = reflections.length === 0
    ? 0
    : r1(clamp10(
      Math.max(...reflections.map((r) => r.weight)) * 0.5 +
      avg(reflections.map((r) => r.weight)) * 0.5,
    ));

  return {
    totalQuestions: reflections.length,
    reflections,
    reflectiveDepth,
    reasonCodes: [
      `reflections:${reflections.length}`,
      `reflective-depth:${reflectiveDepth}/10`,
      ...reflections.slice(0, 5).map((r) => `${r.category}:${r.weight}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
