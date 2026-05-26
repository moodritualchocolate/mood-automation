/**
 * AMBIGUITY LAYER (pure, observational)
 *
 * Detects INTERPRETIVE AMBIGUITY: situations where the same data
 * supports multiple plausible interpretations. The engine never
 * picks one; it names them all.
 *
 * STRICT CONTRACT:
 *   - never collapses multiple interpretations into one
 *   - never used to gate generation
 *   - phrasing: "multiple interpretations possible" / "could be read as"
 */

export interface AmbiguityInput {
  outcomes?: { outcomes?: Array<{
    audienceSegment?: string;
    emotionalSignature?: string;
    narrativeSignature?: string;
    visualStyle?: string;
    downstreamOutcome?: string;
    persuasionIntensity?: number;
    realismLevel?: number;
    metrics?: { retention?: number; saves?: number; comments?: number; shares?: number; bounceRate?: number };
  }> } | null;
  archetypes?: { recognized?: Array<{ key: string; label: string; occurrences: number }> } | null;
  symbolicResonance?: { symbols?: Array<{ symbol: string; resonance: number; occurrences: number }> } | null;
  cultural?: {
    segments?: Array<{ segment: string; signature?: Record<string, number> }>;
  } | null;
}

export interface Ambiguity {
  zone: string;
  /** Interpretations are documented; the engine does not pick one. */
  interpretations: string[];
  severity: number;             // 0..10 — how strong the ambiguity is
  description: string;
}

export interface AmbiguityReading {
  totalAmbiguities: number;
  ambiguities: Ambiguity[];
  interpretationVariance: number;  // 0..10 — overall ambiguity load
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — ambiguities name MULTIPLE INTERPRETATIONS that the data ' +
  'supports simultaneously. The engine never picks one. Both readings stand.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeAmbiguities(input: AmbiguityInput): AmbiguityReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const archetypes = input.archetypes?.recognized ?? [];
  const symbols = input.symbolicResonance?.symbols ?? [];
  const ambiguities: Ambiguity[] = [];

  // 1. emotional-signals point in different directions
  // Detect when same emotionalSignature received both positive and negative outcomes.
  const sigOutcomes = new Map<string, Set<string>>();
  for (const o of outcomes) {
    const sig = (o.emotionalSignature ?? '').toLowerCase();
    if (!sig) continue;
    if (!sigOutcomes.has(sig)) sigOutcomes.set(sig, new Set());
    sigOutcomes.get(sig)!.add(o.downstreamOutcome ?? 'unlabeled');
  }
  for (const [sig, outcomesSet] of sigOutcomes) {
    if (outcomesSet.size >= 3) {
      ambiguities.push({
        zone: `emotional-signature "${sig}"`,
        interpretations: Array.from(outcomesSet),
        severity: r1(clamp10(outcomesSet.size * 2)),
        description: `emotional signature "${sig}" received ${outcomesSet.size} distinct downstream outcomes`,
      });
    }
  }

  // 2. audience behavior unstable per segment
  const segOutcomes = new Map<string, string[]>();
  for (const o of outcomes) {
    const s = o.audienceSegment ?? 'unspecified';
    if (!segOutcomes.has(s)) segOutcomes.set(s, []);
    segOutcomes.get(s)!.push(o.downstreamOutcome ?? 'unlabeled');
  }
  for (const [seg, labels] of segOutcomes) {
    const counts = new Map<string, number>();
    for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
    // If no single outcome dominates ≥50%, the segment is unstable.
    const max = Math.max(0, ...counts.values());
    if (labels.length >= 4 && max / labels.length < 0.4) {
      ambiguities.push({
        zone: `audience "${seg}" behavior`,
        interpretations: Array.from(counts.entries()).map(([k, v]) => `${k} (${v})`),
        severity: r1(clamp10(10 - (max / labels.length) * 10)),
        description: `audience "${seg}" shows mixed downstream outcomes; no single reading dominates`,
      });
    }
  }

  // 3. cultural resonance unclear — segments diverge sharply on the same dimension
  if (input.cultural?.segments && input.cultural.segments.length >= 2) {
    // Pick first numeric signature key as proxy for divergence.
    const segs = input.cultural.segments;
    const sigKeys = segs[0].signature ? Object.keys(segs[0].signature) : [];
    for (const key of sigKeys.slice(0, 4)) {
      const values = segs
        .map((s) => s.signature?.[key])
        .filter((v): v is number => typeof v === 'number');
      if (values.length < 2) continue;
      const range = Math.max(...values) - Math.min(...values);
      if (range >= 6) {
        ambiguities.push({
          zone: `cultural dimension "${key}"`,
          interpretations: segs.map((s) =>
            `${s.segment}: ${typeof s.signature?.[key] === 'number' ? s.signature[key] : 'n/a'}`),
          severity: r1(clamp10(range)),
          description: `"${key}" varies sharply across segments (range ${r1(range)})`,
        });
      }
    }
  }

  // 4. symbolic interpretation inconsistency — symbols with very mixed
  // dominantOutcome distribution. Approximation via the symbol module's
  // resonance + occurrences.
  for (const s of symbols) {
    if (s.occurrences >= 4 && s.resonance >= 3 && s.resonance <= 7) {
      ambiguities.push({
        zone: `symbol "${s.symbol}"`,
        interpretations: [
          `resonance ${s.resonance}/10 (mid-band — could be supportive or saturated)`,
          `${s.occurrences} occurrence(s) (could be familiar or overused)`,
        ],
        severity: r1(clamp10(10 - Math.abs(s.resonance - 5))),
        description: `symbol "${s.symbol}" lives in the mid-band where both readings are plausible`,
      });
    }
  }

  // 5. archetype overlap — same content fitting many archetypes.
  if (archetypes.length >= 3 && outcomes.length > 0) {
    const overlap = archetypes.reduce((a, ar) => a + ar.occurrences, 0) / outcomes.length;
    if (overlap >= 0.8) {
      ambiguities.push({
        zone: 'archetype overlap',
        interpretations: archetypes.slice(0, 4).map((a) => a.label),
        severity: r1(clamp10(overlap * 10)),
        description: `multiple archetypes co-occur in the same content; no single figure dominates`,
      });
    }
  }

  // 6. unclear emotional identity — high persuasion + high realism (mixed signal)
  const meanPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const meanRealism = avg(outcomes.map((o) => o.realismLevel ?? 5));
  if (meanPersuasion >= 6 && meanRealism >= 6) {
    ambiguities.push({
      zone: 'emotional identity',
      interpretations: [
        'observational documentary register',
        'optimized persuasion register',
      ],
      severity: r1(clamp10(Math.min(meanPersuasion, meanRealism))),
      description: 'content combines high persuasion intensity with high realism — both registers are present',
    });
  }

  ambiguities.sort((a, b) => b.severity - a.severity || a.zone.localeCompare(b.zone));

  const interpretationVariance = ambiguities.length === 0
    ? 0
    : r1(clamp10(
      Math.max(...ambiguities.map((a) => a.severity)) * 0.5 +
      avg(ambiguities.map((a) => a.severity)) * 0.5,
    ));

  return {
    totalAmbiguities: ambiguities.length,
    ambiguities,
    interpretationVariance,
    reasonCodes: [
      `ambiguities:${ambiguities.length}`,
      `interpretation-variance:${interpretationVariance}/10`,
      ...ambiguities.slice(0, 5).map((a) => `${a.zone}:${a.severity}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
