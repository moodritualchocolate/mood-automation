/**
 * GET /api/human-memory-imprint
 *
 * Human Memory Imprint observatory. Composes outcomes + visual DNA +
 * narrative DNA into:
 *   - 16 remembered moment signals + imprint strength
 *   - 9 emotional scar signals + verdict
 *   - 12 ritual persistence signatures
 *   - 8 silence weight signals + index
 *   - 11 mythic archetype weights
 *
 * Each GET also appends ONE snapshot to memory-imprint memory.
 *
 * STRICT CONTRACT:
 *   - GET only — no POST, no execution, no publishing
 *   - the system studies memory; it does not manufacture wounds
 *   - never optimizes for virality
 *   - never recommends content
 */

import { NextResponse } from 'next/server';
import { computeHumanMemoryImprint } from '@lib/humanMemoryImprintEngine';
import { computeEmotionalScar } from '@lib/emotionalScarEngine';
import { computeRitualPersistence } from '@lib/ritualPersistenceEngine';
import { computeSilenceWeight } from '@lib/silenceWeightEngine';
import { computeMythicNarrative } from '@lib/mythicNarrativeEngine';
import { createMemoryImprintMemoryStore } from '@lib/memoryImprintMemory';
import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [outcomeMem, visualMem, narrativeMem, priorImprintMem] = await Promise.all([
    createOutcomeMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createMemoryImprintMemoryStore().read().catch(() => null),
  ]);

  const outcomesArr = outcomeMem?.outcomes ?? [];
  const visualArr = visualMem?.fingerprints ?? [];
  const narrativeArr = narrativeMem?.fingerprints ?? [];

  const memoryImprint = computeHumanMemoryImprint({
    outcomes: { outcomes: outcomesArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });

  const emotionalScar = computeEmotionalScar({
    outcomes: { outcomes: outcomesArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });

  const ritualPersistence = computeRitualPersistence({
    outcomes: { outcomes: outcomesArr },
  });

  const silenceWeight = computeSilenceWeight({
    outcomes: { outcomes: outcomesArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });

  const mythicNarrative = computeMythicNarrative({
    outcomes: { outcomes: outcomesArr },
  });

  // Persist one composed snapshot — non-fatal on failure.
  let totalSnapshots = priorImprintMem?.totalSnapshots ?? 0;
  try {
    const store = createMemoryImprintMemoryStore();
    const ritualPersistenceMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(ritualPersistence.rituals)) {
      ritualPersistenceMap[k] = v.persistence;
    }
    const mythicWeightsMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(mythicNarrative.archetypes)) {
      mythicWeightsMap[k] = v.mythicWeight;
    }
    const next = await store.append({
      at: Date.now(),
      imprintStrength: memoryImprint.imprintStrength,
      imprintSignals: memoryImprint.rememberedMomentSignals,
      dominantImprintSignals: memoryImprint.dominantImprintSignals,
      memoryRisk: memoryImprint.memoryRisk,
      scarVerdict: emotionalScar.verdict,
      scarSignals: emotionalScar.signals,
      ritualPersistence: ritualPersistenceMap,
      dominantRituals: ritualPersistence.dominantRituals,
      silenceWeightIndex: silenceWeight.silenceWeightIndex,
      silenceSignals: silenceWeight.signals,
      mythicWeights: mythicWeightsMap,
      overallMythicWeight: mythicNarrative.overallMythicWeight,
      dominantArchetypes: mythicNarrative.dominantArchetypes,
      observationCount: outcomesArr.length + visualArr.length + narrativeArr.length,
    });
    totalSnapshots = next.totalSnapshots;
  } catch {
    // non-fatal — imprint persistence never blocks the read view
  }

  // Top-level composed fields per the directive.
  const quoteDurability = memoryImprint.quoteDurability;
  const scenePermanence = memoryImprint.scenePermanence;
  const emotionalAftertaste = memoryImprint.emotionalAftertaste;
  const dignityProtection = emotionalScar.signals.dignityPreservation;
  // Permanence signals — surface a curated bundle of the strongest signals.
  const permanenceSignals = [
    `imprintStrength:${memoryImprint.imprintStrength}`,
    `silenceWeight:${silenceWeight.silenceWeightIndex}`,
    `mythicWeight:${mythicNarrative.overallMythicWeight}`,
    `scarVerdict:${emotionalScar.verdict}`,
    `memoryRisk:${memoryImprint.memoryRisk}`,
    ...memoryImprint.dominantImprintSignals.map((s) => `imprint:${s}`),
    ...mythicNarrative.dominantArchetypes.map((s) => `archetype:${s}`),
    ...ritualPersistence.dominantRituals.map((s) => `ritual:${s}`),
  ];

  return NextResponse.json({
    memoryImprint,
    emotionalScar,
    ritualPersistence,
    silenceWeight,
    mythicNarrative,
    quoteDurability,
    scenePermanence,
    emotionalAftertaste,
    dignityProtection,
    permanenceSignals,
    totalSnapshots,
    advisoryNotice:
      'Observatory only — the system studies emotional permanence. ' +
      'It studies memory; it does not manufacture wounds.',
  });
}
