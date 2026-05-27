/**
 * GET /api/evolution-sandbox
 *
 * Read-only sandbox observatory. Composes the five evolution-sandbox
 * analyzers + a sandbox-memory snapshot of the current run. Every
 * snapshot is a SIMULATION; nothing is executed, applied, or selected.
 *
 * This endpoint is intentionally read-only and never blocks generation.
 * The operator is the only authority that interprets the candidates.
 */

import { NextResponse } from 'next/server';
import {
  computeEvolutionSandbox,
  type CurrentFingerprint,
  type HistoricalSlices,
} from '@lib/evolutionSandboxEngine';
import { computeMutationTrajectories } from '@lib/mutationTrajectoryEngine';
import { computeCreativeSurvivability } from '@lib/creativeSurvivabilityModel';
import { computeDivergencePressure } from '@lib/divergencePressureMap';
import { computeRealityAnchors } from '@lib/realityAnchorEngine';
import {
  createEvolutionSandboxMemoryStore, recordSandboxSimulation,
  type SandboxSimulationSnapshot,
} from '@lib/evolutionSandboxMemory';

import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { computeCreativeFatigue } from '@lib/creativeFatigueEngine';
import { computeHumanTruth } from '@lib/humanTruthIntelligence';
import { computeCulturalMemory } from '@lib/culturalMemoryEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [outcomeMem, visualMem, narrativeMem, driftMem] = await Promise.all([
    createOutcomeMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createCreativeDriftMemoryStore().read().catch(() => null),
  ]);

  // Build the upstream signals the sandbox reads.
  const fatigue = computeCreativeFatigue({
    visualDNA: visualMem ? { fingerprints: visualMem.fingerprints } : null,
    narrativeDNA: narrativeMem ? { fingerprints: narrativeMem.fingerprints } : null,
  });
  const humanTruth = computeHumanTruth({
    outcomes: outcomeMem as never,
    visualDNA: visualMem as never,
    narrativeDNA: narrativeMem as never,
    drift: driftMem as never,
    copywriter: null,
    strategy: null,
  });
  const cultural = computeCulturalMemory({ outcomes: outcomeMem as never });

  // Coarse "current fingerprint" derived from the most recent visual +
  // narrative observations. Defaults are used when memory is empty.
  const lastVisual = visualMem?.fingerprints[visualMem.fingerprints.length - 1];
  const lastNarrative = narrativeMem?.fingerprints[narrativeMem.fingerprints.length - 1];
  const currentFingerprint: CurrentFingerprint = {
    formula: lastVisual?.formula,
    campaignMode: lastVisual?.campaignMode ?? null,
    realismLevel: lastVisual?.realismLevel,
    polishLevel: lastVisual?.polishLevel,
    persuasionIntensity: 5,
    cadenceState: 'normal',
    visualStyle: lastVisual?.framingFingerprint,
    emotionalSignature: lastNarrative?.emotionalCadence,
    narrativeSignature: lastNarrative?.hookFamily,
    silenceDensity: lastVisual?.silenceDensity,
    pacingIdentity: lastVisual?.pacingIdentity,
    humanRealism: lastNarrative?.humanRealism,
    ctaPressure: lastNarrative?.ctaPressure,
  };

  const history: HistoricalSlices = {
    outcomes: (outcomeMem?.outcomes ?? []).map((o) => ({
      visualStyle: o.visualStyle,
      emotionalSignature: o.emotionalSignature,
      narrativeSignature: o.narrativeSignature,
      cadenceState: o.cadenceState,
      realismLevel: o.realismLevel,
      persuasionIntensity: o.persuasionIntensity,
      downstreamOutcome: o.downstreamOutcome,
      metrics: o.metrics,
    })),
    visualFingerprints: (visualMem?.fingerprints ?? []).map((f) => ({
      framingFingerprint: f.framingFingerprint,
      polishLevel: f.polishLevel,
      realismLevel: f.realismLevel,
    })),
    narrativeFingerprints: (narrativeMem?.fingerprints ?? []).map((f) => ({
      hookFamily: f.hookFamily,
      humanRealism: f.humanRealism,
      ctaPressure: f.ctaPressure,
      silenceUsage: f.silenceUsage,
    })),
    driftObservations: (driftMem?.observations ?? []).map((o) => ({
      emotionalDiversity: o.emotionalDiversity,
      persuasionVariance: o.persuasionVariance,
      trustErosionDrift: o.trustErosionDrift,
    })),
  };

  // Run the five sandbox analyzers.
  const sandbox = computeEvolutionSandbox({
    currentFingerprint,
    history,
    adaptation: null,
    cultural: { emotionalPersistence: cultural.emotionalPersistence },
    humanTruth: {
      authenticityScore: humanTruth.authenticityScore,
      feltHumanScore: humanTruth.feltHumanScore,
      signals: {
        dignity: humanTruth.signals.dignity,
        vulnerability: humanTruth.signals.vulnerability,
        silenceTolerance: humanTruth.signals.silenceTolerance,
      },
    },
    fatigue: {
      fatigueLevel: fatigue.fatigueLevel,
      freshnessScore: fatigue.freshnessScore,
      visualFatigue: fatigue.fatigueVectors.find((v) => v.vector === 'visual')?.fatigue,
    },
  });
  const trajectories = computeMutationTrajectories(sandbox.candidateMutations);
  const survivability = computeCreativeSurvivability(sandbox.candidateMutations);
  const divergence = computeDivergencePressure(sandbox.candidateMutations);
  const realityAnchors = computeRealityAnchors(sandbox.candidateMutations);

  // Snapshot the simulation into sandbox memory. The store NEVER
  // records mutation execution — only simulation summaries.
  const snapshot: SandboxSimulationSnapshot = {
    at: Date.now(),
    candidateCount: sandbox.totalCandidates,
    creativeEntropy: sandbox.creativeEntropy,
    convergenceRisk: sandbox.convergenceRisk,
    realismRetention: sandbox.realismRetention,
    symbolicContinuity: sandbox.symbolicContinuity,
    trustStability: sandbox.trustStability,
    replayabilityEstimate: sandbox.replayabilityEstimate,
    averageFatigueProjection: sandbox.fatigueForecast.averageProjection,
    anchorPreservation: realityAnchors.overallAnchorPreservation,
    overallSurvivability: survivability.overallSurvivability,
    mutationTypes: [...sandbox.candidateMutations.map((c) => c.mutationType)].sort(),
    driftingCandidates: realityAnchors.candidatesDriftingFromAnchors,
    highRiskCandidates: survivability.highRiskMutations,
  };
  void recordSandboxSimulation(snapshot);

  const memSnapshot = await createEvolutionSandboxMemoryStore().read().catch(() => null);

  return NextResponse.json({
    sandbox,
    trajectories,
    survivability,
    divergence,
    realityAnchors,
    history: {
      totalSimulations: memSnapshot?.totalSimulations ?? 0,
      recentSimulations: (memSnapshot?.simulations ?? []).slice(-12),
    },
    advisoryNotice:
      'Simulation only — the evolution sandbox generates candidate mutations ' +
      'as parallel possibilities. Nothing executes, applies, publishes, or ' +
      'selects. The operator is the only authority.',
    reasonCodes: [
      ...sandbox.reasonCodes.slice(0, 4),
      ...trajectories.reasonCodes.slice(0, 2),
      ...survivability.reasonCodes.slice(0, 2),
      ...divergence.reasonCodes.slice(0, 2),
      ...realityAnchors.reasonCodes.slice(0, 2),
    ],
  });
}
