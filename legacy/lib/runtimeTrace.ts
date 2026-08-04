/**
 * RUNTIME TRACE (Phase 27 — Persistent Cognitive Runtime)
 *
 * Every run leaves a trace. Not logs — a trace that reads like a
 * creative director's private memory: what the system remembered,
 * what it changed, what it refused, what it approved, what evolved,
 * and what the next run must continue or avoid.
 *
 * The trace is the human-readable proof that the runtime is alive —
 * that it remembers what it believed yesterday.
 */

import type { CognitiveFieldState } from './cognitiveField';
import type { WorldModelEvolution } from './selfEvolvingWorldModel';
import type { RuntimeDriftReport } from './runtimeDriftDetector';
import type { CognitiveContinuityReading } from './cognitiveContinuityScore';
import type { NextRunDirective } from './nextRunDirective';
import type { PriorStateSummary } from './runtimeMemoryStore';

export interface RuntimeTrace {
  ts: number;
  generationIndex: number;
  remembered: string;
  changed: string;
  refused: string;
  approved: string;
  worldStateEvolved: string;
  truthStrengthened: string;
  truthWeakened: string;
  objectGainedMeaning: string;
  behaviorBecameImportant: string;
  pressureIntensified: string;
  nextRunMustAvoid: string;
  nextRunMustContinue: string;
  /** The whole thing as one human-readable paragraph. */
  director_memo: string;
}

export interface BuildRuntimeTraceInput {
  generationIndex: number;
  priorState: PriorStateSummary | null;
  field: CognitiveFieldState;
  worldModelEvolution: WorldModelEvolution;
  drift: RuntimeDriftReport;
  continuity: CognitiveContinuityReading;
  nextRunDirective: NextRunDirective;
  verdict: string;
  worldStateDescription: string;
}

export function buildRuntimeTrace(input: BuildRuntimeTraceInput): RuntimeTrace {
  const {
    generationIndex, priorState, field, worldModelEvolution, drift,
    continuity, nextRunDirective, verdict, worldStateDescription,
  } = input;

  const remembered = priorState
    ? `gen ${priorState.generationIndex}: "${priorState.dominantTruth}" in ${priorState.emotionalTerritory} — ${priorState.directorMemo}`
    : 'nothing — this is the campaign\'s first run';

  const changed = continuity.is_first_run
    ? 'the runtime opened the campaign'
    : `continuity held at ${continuity.continuity_score}/10; the campaign moved without fragmenting`;

  const refused = verdict === 'approve'
    ? 'nothing this run — the candidate cleared the bar'
    : `the runtime refused this direction (${verdict})`;

  const approved = verdict === 'approve'
    ? `"${field.dominantTruths[0] ?? 'the candidate truth'}" — emergence ${field.emergence_score}/10`
    : 'nothing approved this run';

  const worldStateEvolved = worldStateDescription;
  const truthStrengthened = worldModelEvolution.strengthen_truths[0] ?? 'no truth strengthened this run';
  const truthWeakened = worldModelEvolution.weaken_truths[0] ?? 'no truth weakened this run';
  const objectGainedMeaning = field.symbolicObjects[0] ?? 'no object carried meaning this run';
  const behaviorBecameImportant = field.behavioralLoops[0] ?? 'no behavioural loop dominated this run';
  const pressureIntensified = field.activePressures[0] ?? 'no structural pressure intensified this run';
  const nextRunMustAvoid = nextRunDirective.avoidEmotionalTerritories[0]
    ?? (drift.most_severe ?? 'nothing specific');
  const nextRunMustContinue = nextRunDirective.unresolvedTensionsToContinue[0]
    ?? 'the campaign\'s current emotional thread';

  const director_memo = buildMemo({
    generationIndex, remembered, refused, approved, worldStateEvolved,
    truthStrengthened, nextRunMustAvoid, nextRunMustContinue, drift, continuity,
  });

  return {
    ts: Date.now(),
    generationIndex,
    remembered, changed, refused, approved, worldStateEvolved,
    truthStrengthened, truthWeakened, objectGainedMeaning,
    behaviorBecameImportant, pressureIntensified,
    nextRunMustAvoid, nextRunMustContinue,
    director_memo,
  };
}

function buildMemo(args: {
  generationIndex: number;
  remembered: string;
  refused: string;
  approved: string;
  worldStateEvolved: string;
  truthStrengthened: string;
  nextRunMustAvoid: string;
  nextRunMustContinue: string;
  drift: RuntimeDriftReport;
  continuity: CognitiveContinuityReading;
}): string {
  const {
    generationIndex, remembered, refused, approved, worldStateEvolved,
    truthStrengthened, nextRunMustAvoid, nextRunMustContinue, drift, continuity,
  } = args;

  const lines: string[] = [];
  lines.push(`Gen ${generationIndex}.`);
  lines.push(`I remembered ${remembered}.`);
  if (continuity.is_first_run) {
    lines.push('There was nothing before this — I opened the campaign.');
  } else {
    lines.push(`I held continuity at ${continuity.continuity_score}/10.`);
    if (continuity.behaved_like_fresh_prompt) {
      lines.push('But I caught myself behaving like a fresh prompt — that is not allowed.');
    }
  }
  lines.push(approved.startsWith('nothing') ? `${refused}.` : `I approved ${approved}.`);
  lines.push(`The world is now ${worldStateEvolved}.`);
  if (truthStrengthened !== 'no truth strengthened this run') {
    lines.push(`The truth "${truthStrengthened}" grew a little more permanent.`);
  }
  if (drift.drift_detected) {
    lines.push(`I noticed myself drifting (${drift.most_severe}); the next run has to correct it.`);
  }
  lines.push(`Next run: do not re-open "${nextRunMustAvoid}"; continue "${nextRunMustContinue}".`);
  return lines.join(' ');
}
