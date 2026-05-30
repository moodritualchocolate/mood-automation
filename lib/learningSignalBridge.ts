/**
 * LEARNING SIGNAL BRIDGE (pure, observational)
 *
 * Phase 5 — Creative Performance Layer.
 *
 * Bridges performance reality with supervised learning + story
 * architect + asset composer. Composes observed performance signals
 * into READING ONLY — never auto-modifies, never auto-applies.
 *
 * Connects:
 *   Performance ↓ Supervised Learning ↓ Story Architect ↓ Asset Composer
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never auto-modifies any upstream system
 *   - never auto-applies any signal
 *   - allowed phrasing: "historically associated", "observed alongside",
 *     "may carry memory weight", "appears elevated", "appears suppressed",
 *     "requires more evidence", "operator review required"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply, optimize,
 *     viral, dopamine, outrage, manipulat, exploit
 *
 * Learning only. Never auto modify. Never auto apply.
 * Human remains final authority.
 */

import type { PerformanceAnalyzerReading } from './performanceAnalyzer';
import type { CreativeDNAMapReading } from './creativeDNAMap';

// ─── input ────────────────────────────────────────────────────

export interface BridgeSupervisedLearningHint {
  alignedMutations?: string[];
  contradictedMutations?: string[];
  /** Per-axis aligned counts (trust / fatigue / realism / symbolic). */
  trustAligned?: number;
  fatigueAligned?: number;
  realismAligned?: number;
  symbolicAligned?: number;
}

export interface BridgeStoryArchitectHint {
  /** Currently aligned story families per the story-architect engine. */
  dominantHumanTensions?: string[];
  /** Optional set of story blueprint ids surfaced by the architect. */
  blueprintIds?: string[];
}

export interface BridgeAssetComposerHint {
  /** Top-aligned package ids from the asset composer. */
  dominantPackageIds?: string[];
}

export interface LearningSignalBridgeInput {
  performance?: PerformanceAnalyzerReading | null;
  creativeDNA?: CreativeDNAMapReading | null;
  supervised?: BridgeSupervisedLearningHint | null;
  storyArchitect?: BridgeStoryArchitectHint | null;
  assetComposer?: BridgeAssetComposerHint | null;
}

// ─── output ───────────────────────────────────────────────────

export interface BridgeSignal {
  /** Stable signal id for cross-system reference. */
  signalId: string;
  /** Plain-language observation, allowed phrasing only. */
  observation: string;
  /** 0..10 — observed strength. */
  strength: number;
  /** Downstream layers this signal may be considered alongside —
   *  the bridge NEVER auto-applies. */
  consideredBy: Array<'supervised-learning' | 'story-architect' | 'asset-composer'>;
  reasonCodes: string[];
}

export interface LearningSignalBridgeReading {
  bridgeSignals: BridgeSignal[];
  /** Cross-system summary lines for the panel. */
  notes: string[];
  /** Recommendations are NEVER produced. We surface "explorations the
   *  operator may consider" — never a winner / never a directive. */
  operatorExplorations: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Learning signal bridge is observational only. It never auto-modifies ' +
  'any upstream system. It never auto-applies any signal. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }

// ─── main ─────────────────────────────────────────────────────

export function composeLearningSignalBridge(
  input: LearningSignalBridgeInput,
): LearningSignalBridgeReading {
  const perf = input.performance;
  const dna = input.creativeDNA;
  const sup = input.supervised ?? {};
  const story = input.storyArchitect ?? {};
  const asset = input.assetComposer ?? {};

  const bridgeSignals: BridgeSignal[] = [];
  const operatorExplorations: string[] = [];

  // ── performance → supervised learning ────────────────────
  if (perf) {
    const ind = perf.indicators;

    if (ind.fatigueIndicator.level >= 6) {
      bridgeSignals.push({
        signalId: 'perf-fatigue-elevated',
        observation: 'performance fatigue indicator appears elevated — historically associated with rest-leaning supervised mutations',
        strength: r1(clamp10(ind.fatigueIndicator.level)),
        consideredBy: ['supervised-learning', 'story-architect'],
        reasonCodes: [`fatigue:${ind.fatigueIndicator.level}`],
      });
      operatorExplorations.push(
        'operator may explore restraint-leaning story families historically associated with audience fatigue — operator review required',
      );
    }

    if (ind.trustIndicator.migrationDirection >= 2) {
      bridgeSignals.push({
        signalId: 'perf-trust-rising',
        observation: 'trust indicator appears to be rising — historically associated with realism-leaning mutations',
        strength: r1(clamp10(ind.trustIndicator.level)),
        consideredBy: ['supervised-learning', 'story-architect', 'asset-composer'],
        reasonCodes: [`trustMigration:${ind.trustIndicator.migrationDirection}`],
      });
      operatorExplorations.push(
        'operator may explore continuation of documentary-realism story structures — requires more evidence',
      );
    }

    if (ind.attentionIndicator.migrationDirection <= -2) {
      bridgeSignals.push({
        signalId: 'perf-attention-receding',
        observation: 'attention indicator appears to be receding — historically associated with pacing-leaning mutations',
        strength: r1(clamp10(Math.abs(ind.attentionIndicator.migrationDirection))),
        consideredBy: ['supervised-learning', 'asset-composer'],
        reasonCodes: [`attentionMigration:${ind.attentionIndicator.migrationDirection}`],
      });
    }

    if (ind.retentionIndicator.level >= 6) {
      bridgeSignals.push({
        signalId: 'perf-retention-strong',
        observation: 'retention indicator appears elevated — historically associated with watch-time-leaning story structures',
        strength: r1(clamp10(ind.retentionIndicator.level)),
        consideredBy: ['story-architect', 'asset-composer'],
        reasonCodes: [`retention:${ind.retentionIndicator.level}`],
      });
    }

    // Historically-associated patterns surfaced by the analyzer.
    for (const p of perf.historicallyAssociatedPatterns) {
      bridgeSignals.push({
        signalId: `perf-pattern-${p.patternId}`,
        observation: p.description,
        strength: r1(clamp10(p.strength)),
        consideredBy: ['supervised-learning', 'story-architect'],
        reasonCodes: [`pattern:${p.patternId}`, `evidence:${p.evidenceCount}`],
      });
    }
  } else {
    bridgeSignals.push({
      signalId: 'perf-absent',
      observation: 'no performance observations available — requires more evidence',
      strength: 0,
      consideredBy: ['supervised-learning', 'story-architect', 'asset-composer'],
      reasonCodes: ['performance:null'],
    });
  }

  // ── creative DNA map → story architect / asset composer ──
  if (dna) {
    const hookAxis = dna.axes.find((a) => a.axis === 'hook');
    if (hookAxis && hookAxis.dominantTokens.length > 0) {
      bridgeSignals.push({
        signalId: 'dna-hook-observed',
        observation: `hooks historically associated with engagement: ${hookAxis.dominantTokens.join(' · ')} — observation only, never recommended`,
        strength: r1(clamp10(hookAxis.tokens[0]?.observedStrength ?? 0)),
        consideredBy: ['story-architect', 'asset-composer'],
        reasonCodes: [`hooks:${hookAxis.dominantTokens.join('|')}`],
      });
    }
    const silenceAxis = dna.axes.find((a) => a.axis === 'silenceRatio');
    if (silenceAxis && silenceAxis.dominantTokens.length > 0) {
      bridgeSignals.push({
        signalId: 'dna-silence-observed',
        observation: `silence ratios historically associated with engagement: ${silenceAxis.dominantTokens.join(' · ')} — operator review required`,
        strength: r1(clamp10(silenceAxis.tokens[0]?.observedStrength ?? 0)),
        consideredBy: ['asset-composer'],
        reasonCodes: [`silence:${silenceAxis.dominantTokens.join('|')}`],
      });
    }
    const visualAxis = dna.axes.find((a) => a.axis === 'visualStyle');
    if (visualAxis && visualAxis.dominantTokens.length > 0) {
      bridgeSignals.push({
        signalId: 'dna-visual-observed',
        observation: `visual styles historically associated with engagement: ${visualAxis.dominantTokens.join(' · ')} — operator review required`,
        strength: r1(clamp10(visualAxis.tokens[0]?.observedStrength ?? 0)),
        consideredBy: ['asset-composer'],
        reasonCodes: [`visual:${visualAxis.dominantTokens.join('|')}`],
      });
    }
  }

  // ── supervised learning hints ─────────────────────────────
  if (sup.alignedMutations && sup.alignedMutations.length > 0) {
    bridgeSignals.push({
      signalId: 'supervised-aligned',
      observation: `mutations historically aligned in supervised learning: ${sup.alignedMutations.join(' · ')} — observation only, never recommended`,
      strength: r1(clamp10(sup.alignedMutations.length * 1.5)),
      consideredBy: ['story-architect', 'asset-composer'],
      reasonCodes: [`alignedMutations:${sup.alignedMutations.join('|')}`],
    });
  }
  if (sup.contradictedMutations && sup.contradictedMutations.length > 0) {
    bridgeSignals.push({
      signalId: 'supervised-contradicted',
      observation: `mutations historically contradicted in supervised learning: ${sup.contradictedMutations.join(' · ')} — operator review required`,
      strength: r1(clamp10(sup.contradictedMutations.length * 1.5)),
      consideredBy: ['story-architect', 'asset-composer'],
      reasonCodes: [`contradictedMutations:${sup.contradictedMutations.join('|')}`],
    });
  }

  // ── story architect / asset composer cross-references ────
  if (story.dominantHumanTensions && story.dominantHumanTensions.length > 0) {
    bridgeSignals.push({
      signalId: 'story-tensions-observed',
      observation: `dominant human tensions currently observed: ${story.dominantHumanTensions.slice(0, 3).join(' · ')} — operator review required`,
      strength: r1(clamp10(story.dominantHumanTensions.length * 1.5)),
      consideredBy: ['asset-composer'],
      reasonCodes: [`tensions:${story.dominantHumanTensions.length}`],
    });
  }
  if (asset.dominantPackageIds && asset.dominantPackageIds.length > 0) {
    bridgeSignals.push({
      signalId: 'asset-packages-observed',
      observation: `top-aligned asset packages observed: ${asset.dominantPackageIds.slice(0, 3).join(' · ')} — observation only, never recommended`,
      strength: r1(clamp10(asset.dominantPackageIds.length * 2)),
      consideredBy: ['asset-composer'],
      reasonCodes: [`packages:${asset.dominantPackageIds.length}`],
    });
  }

  // ── notes ────────────────────────────────────────────────
  const notes: string[] = [];
  notes.push('learning signals are observational — never auto-applied to upstream systems');
  if (bridgeSignals.length > 0) {
    notes.push(`${bridgeSignals.length} learning signal(s) historically associated with the observed window`);
  }
  if (operatorExplorations.length === 0) {
    operatorExplorations.push('no operator explorations surfaced — requires more evidence');
  }

  return {
    bridgeSignals,
    notes,
    operatorExplorations,
    reasonCodes: [
      `signals:${bridgeSignals.length}`,
      `explorations:${operatorExplorations.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
