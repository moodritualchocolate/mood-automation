/**
 * COGNITIVE BOUNDARY ENGINE (pure, observational)
 *
 * Names WHERE THE SYSTEM'S UNDERSTANDING ENDS. Each boundary is
 * an explicit declaration of "we do not know yet" — the engine
 * treats epistemic humility as a feature, not a defect.
 *
 * STRICT CONTRACT:
 *   - never invents knowledge to cover a gap
 *   - never collapses unknown into a guess
 *   - phrasing: "we do not yet have enough observations to…"
 */

export interface BoundaryInput {
  outcomes?: { outcomes?: Array<{
    audienceSegment?: string;
    creativeFingerprint?: string;
    emotionalSignature?: string;
    narrativeSignature?: string;
    downstreamOutcome?: string;
  }> } | null;
  drift?: { observations?: Array<{ overallCreativeHealth?: number }> } | null;
  consequences?: { episodes?: Array<{ downstreamOutcome?: string }> } | null;
  confidence?: { axes?: Array<{ axis: string; level: string; sampleSize: number }> } | null;
  recoveryEvents?: Array<{ spentInCollapse?: number }>;
}

export interface Boundary {
  zone: string;
  reason: string;
  severity: number;             // 0..10 — how confidently we can say we don't know
  description: string;
}

export interface CognitiveBoundaryReading {
  totalBoundaries: number;
  boundaries: Boundary[];
  /** 0..10 — overall epistemic humility. */
  knownUnknownsScore: number;
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  '"We do not know yet" is intelligence. The boundary engine never fills ' +
  'epistemic gaps with guesses; it names them.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }

// ─── main ─────────────────────────────────────────────────────

export function computeCognitiveBoundaries(input: BoundaryInput): CognitiveBoundaryReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const driftObs = input.drift?.observations ?? [];
  const consequenceEps = input.consequences?.episodes ?? [];
  const axes = input.confidence?.axes ?? [];
  const recoveryEvents = input.recoveryEvents ?? [];

  const boundaries: Boundary[] = [];

  // 1. insufficient observation depth — outcomes too few
  if (outcomes.length < 12) {
    boundaries.push({
      zone: 'observation depth',
      reason: `only ${outcomes.length} outcome record(s)`,
      severity: r1(clamp10(10 - outcomes.length / 1.5)),
      description: 'we do not yet have enough outcome observations to make stable claims',
    });
  }

  // 2. unstable confidence — multiple axes at low/moderate
  const unstableAxes = axes.filter((a) => a.level === 'low' || a.level === 'moderate').map((a) => a.axis);
  if (unstableAxes.length >= 2) {
    boundaries.push({
      zone: 'observational confidence',
      reason: `${unstableAxes.length} axis(es) below stable confidence`,
      severity: r1(clamp10(unstableAxes.length * 1.5)),
      description: `confidence has not stabilized on: ${unstableAxes.slice(0, 4).join(', ')}`,
    });
  }

  // 3. contradictory recovery patterns — recoveries with vastly different
  // collapse-spent durations.
  if (recoveryEvents.length >= 2) {
    const spent = recoveryEvents.map((e) => e.spentInCollapse ?? 0);
    const span = Math.max(...spent) - Math.min(...spent);
    if (span >= 4) {
      boundaries.push({
        zone: 'recovery cadence',
        reason: `recovery durations vary widely (range ${span})`,
        severity: r1(clamp10(span * 0.7)),
        description: 'the system has recovered before, but the time-to-recovery does not yet form a stable shape',
      });
    }
  }

  // 4. unresolved emotional tension — many emotional signatures with no
  // dominant outcome
  const sigOutcomes = new Map<string, Set<string>>();
  for (const o of outcomes) {
    const sig = (o.emotionalSignature ?? '').toLowerCase();
    if (!sig) continue;
    if (!sigOutcomes.has(sig)) sigOutcomes.set(sig, new Set());
    sigOutcomes.get(sig)!.add(o.downstreamOutcome ?? 'unlabeled');
  }
  const unresolvedSigs = Array.from(sigOutcomes.entries()).filter(([, s]) => s.size >= 3).length;
  if (unresolvedSigs >= 1 && outcomes.length >= 6) {
    boundaries.push({
      zone: 'emotional resolution',
      reason: `${unresolvedSigs} emotional signature(s) with 3+ distinct outcomes`,
      severity: r1(clamp10(unresolvedSigs * 3)),
      description: 'how specific emotional signatures resolve is not yet a settled question',
    });
  }

  // 5. incomplete cultural continuity — few episodes available
  if (consequenceEps.length < 8) {
    boundaries.push({
      zone: 'cultural continuity',
      reason: `only ${consequenceEps.length} consequence episode(s)`,
      severity: r1(clamp10(10 - consequenceEps.length / 1.5)),
      description: 'how patterns survive across time is not yet observable at the scale required',
    });
  }

  // 6. weak symbolic recurrence — few outcomes per creative fingerprint
  const fpCounts = new Map<string, number>();
  for (const o of outcomes) {
    const fp = (o.creativeFingerprint ?? '').toLowerCase();
    if (!fp) continue;
    fpCounts.set(fp, (fpCounts.get(fp) ?? 0) + 1);
  }
  const repeatedFingerprints = Array.from(fpCounts.values()).filter((c) => c >= 2).length;
  if (fpCounts.size >= 4 && repeatedFingerprints <= 1) {
    boundaries.push({
      zone: 'symbolic recurrence',
      reason: `${repeatedFingerprints} of ${fpCounts.size} fingerprint(s) appear more than once`,
      severity: r1(clamp10(10 - repeatedFingerprints * 2)),
      description: 'most creative fingerprints have appeared only once; recurring resonance has not yet been measured',
    });
  }

  // 7. non-repeatable outcomes — labels appearing exactly once
  const outcomeCounts = new Map<string, number>();
  for (const o of outcomes) {
    const k = o.downstreamOutcome ?? 'unlabeled';
    outcomeCounts.set(k, (outcomeCounts.get(k) ?? 0) + 1);
  }
  const singletonLabels = Array.from(outcomeCounts.values()).filter((c) => c === 1).length;
  if (singletonLabels >= 3) {
    boundaries.push({
      zone: 'outcome repeatability',
      reason: `${singletonLabels} outcome label(s) appear only once`,
      severity: r1(clamp10(singletonLabels)),
      description: 'several outcomes have happened only once; repeatability cannot yet be asserted',
    });
  }

  // 8. drift not yet measurable
  if (driftObs.length < 6) {
    boundaries.push({
      zone: 'drift trajectory',
      reason: `only ${driftObs.length} drift observation(s)`,
      severity: r1(clamp10(10 - driftObs.length * 1.5)),
      description: 'drift trajectory has not yet had enough observations to form a stable trend',
    });
  }

  boundaries.sort((a, b) => b.severity - a.severity || a.zone.localeCompare(b.zone));

  const knownUnknownsScore = boundaries.length === 0
    ? 0
    : r1(clamp10(
      Math.max(...boundaries.map((b) => b.severity)) * 0.5 +
      (boundaries.reduce((a, b) => a + b.severity, 0) / boundaries.length) * 0.5,
    ));

  return {
    totalBoundaries: boundaries.length,
    boundaries,
    knownUnknownsScore,
    reasonCodes: [
      `boundaries:${boundaries.length}`,
      `known-unknowns:${knownUnknownsScore}/10`,
      ...boundaries.slice(0, 5).map((b) => `${b.zone}:${b.severity}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
