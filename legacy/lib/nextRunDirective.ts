/**
 * NEXT-RUN DIRECTIVE (Phase 27 — Persistent Cognitive Runtime)
 *
 * Every generation leaves COGNITIVE instructions for the next one.
 * Not prompt instructions — instructions about what the system has
 * learned and what the next run must continue, correct, or avoid.
 *
 * The next run reads this BEFORE deciding anything. It is the thread
 * that turns a sequence of generations into one continuous mind.
 */

import type { CognitiveFieldState } from './cognitiveField';
import type { WorldModelEvolution } from './selfEvolvingWorldModel';

export interface NextRunDirective {
  generatedAt: number;
  generationIndex: number;
  avoidEmotionalTerritories: string[];
  strengthenTruths: string[];
  weakenTruths: string[];
  unresolvedTensionsToContinue: string[];
  symbolicObjectsToAvoid: string[];
  symbolicObjectsToDevelop: string[];
  desiredSilenceLevel: number;          // 0..10
  pressureToIncrease: string[];
  pressureToReduce: string[];
  ritualToExplore: string | null;
  maskingPatternToContinue: string | null;
  culturalSignalToWatch: string | null;
  productVisibilityGuidance: string;
  toneWarning: string | null;
  antiRepetitionWarning: string | null;
}

export interface GenerateNextRunDirectiveInput {
  generationIndex: number;
  field: CognitiveFieldState;
  worldModelEvolution: WorldModelEvolution;
  /** The emotional territory (state family) just used. */
  usedTerritory: string;
  /** Symbolic objects just used. */
  usedObjects: string[];
  /** Drift correction instructions from the runtime drift detector. */
  driftCorrections: string[];
  /** True when drift over-used silence / restraint. */
  driftTooMuchSilence: boolean;
  /** True when drift over-used heaviness / burnout. */
  driftTooMuchHeaviness: boolean;
}

export function generateNextRunDirective(input: GenerateNextRunDirectiveInput): NextRunDirective {
  const {
    generationIndex, field, worldModelEvolution, usedTerritory, usedObjects,
    driftCorrections, driftTooMuchSilence, driftTooMuchHeaviness,
  } = input;

  // The territory just used is discouraged next run — never forbidden,
  // but the campaign should not sit in the same place twice running.
  const avoidEmotionalTerritories = [usedTerritory];

  // Worn / overused objects become objects-to-avoid; objects that
  // gained meaning but are not worn become objects-to-develop.
  const symbolicObjectsToAvoid = [
    ...usedObjects,
    ...worldModelEvolution.retire_cliches,
  ];
  const symbolicObjectsToDevelop = field.symbolicObjects
    .filter((o) => !usedObjects.includes(o))
    .slice(0, 2);

  // Silence target: drift-corrected. If the campaign has been too
  // silent, push toward more presence; if too heavy, pull toward rest.
  let desiredSilenceLevel = 5;
  if (driftTooMuchSilence) desiredSilenceLevel = 3;
  if (driftTooMuchHeaviness) desiredSilenceLevel = 6;

  const antiRepetitionWarning = avoidEmotionalTerritories.length
    ? `the last run lived in "${usedTerritory}" — do not open there again; continue the arc, do not repeat it`
    : null;

  const toneWarning = driftTooMuchHeaviness
    ? 'the campaign is accumulating heaviness — the next banner may need lightness or ordinariness'
    : null;

  return {
    generatedAt: Date.now(),
    generationIndex: generationIndex + 1,
    avoidEmotionalTerritories,
    strengthenTruths: worldModelEvolution.strengthen_truths.slice(0, 3),
    weakenTruths: worldModelEvolution.weaken_truths.slice(0, 3),
    unresolvedTensionsToContinue: field.unresolvedTensions.slice(0, 2),
    symbolicObjectsToAvoid: Array.from(new Set(symbolicObjectsToAvoid)),
    symbolicObjectsToDevelop,
    desiredSilenceLevel,
    pressureToIncrease: worldModelEvolution.emerging_pressures.slice(0, 2),
    pressureToReduce: driftTooMuchHeaviness ? field.activePressures.slice(0, 1) : [],
    ritualToExplore: field.ritualAttachments[0] ?? null,
    maskingPatternToContinue: field.maskingPatterns[0] ?? null,
    culturalSignalToWatch: field.culturalSignals[0] ?? null,
    productVisibilityGuidance: driftCorrections.some((c) => c.includes('product'))
      ? 'rebalance product visibility — drift detected'
      : 'hold product visibility at the campaign baseline',
    toneWarning,
    antiRepetitionWarning,
  };
}

/** A fresh directive for the very first run of a campaign. */
export function emptyNextRunDirective(): NextRunDirective {
  return {
    generatedAt: Date.now(),
    generationIndex: 0,
    avoidEmotionalTerritories: [],
    strengthenTruths: [],
    weakenTruths: [],
    unresolvedTensionsToContinue: [],
    symbolicObjectsToAvoid: [],
    symbolicObjectsToDevelop: [],
    desiredSilenceLevel: 5,
    pressureToIncrease: [],
    pressureToReduce: [],
    ritualToExplore: null,
    maskingPatternToContinue: null,
    culturalSignalToWatch: null,
    productVisibilityGuidance: 'hold product visibility at the campaign baseline',
    toneWarning: null,
    antiRepetitionWarning: null,
  };
}

/** A one-line read of what the directive is asking the next run to do. */
export function describeDirective(d: NextRunDirective): string {
  if (d.generationIndex === 0) return 'no prior directive — this is the campaign\'s first run';
  const parts: string[] = [];
  if (d.avoidEmotionalTerritories.length) parts.push(`avoid "${d.avoidEmotionalTerritories.join(', ')}"`);
  if (d.unresolvedTensionsToContinue.length) parts.push(`continue ${d.unresolvedTensionsToContinue.length} tension(s)`);
  if (d.antiRepetitionWarning) parts.push('anti-repetition active');
  return parts.length ? parts.join(' · ') : 'hold course';
}
