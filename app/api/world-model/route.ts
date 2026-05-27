/**
 * GET /api/world-model
 *
 * World-model observatory. Composes outcomes + drift + visual DNA +
 * narrative DNA into:
 *   - 16-dimension world-state signals
 *   - aesthetic migration reading (cyclic)
 *   - collective attention reading
 *   - civilizational mood reading (era label, never a target)
 *   - meaning pressure reading (eight pressures, 0..10)
 *
 * Each GET also appends one snapshot to the world model memory.
 *
 * STRICT CONTRACT:
 *   - GET only — no POST, no execution, no publishing
 *   - never predicts, never persuades, never steers behaviorally
 *   - never used for political segmentation
 *   - never auto-applies a pattern
 *   - never selects a "best" candidate
 */

import { NextResponse } from 'next/server';
import { computeWorldModel } from '@lib/worldModelEngine';
import { computeAestheticMigration } from '@lib/aestheticMigrationEngine';
import { computeCollectiveAttention } from '@lib/collectiveAttentionEngine';
import { computeCivilizationalMood } from '@lib/civilizationalMoodEngine';
import { computeMeaningPressure } from '@lib/meaningPressureEngine';
import { createWorldModelMemoryStore } from '@lib/worldModelMemory';
import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [outcomeMem, driftMem, visualMem, narrativeMem, priorWorldMem] = await Promise.all([
    createOutcomeMemoryStore().read().catch(() => null),
    createCreativeDriftMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createWorldModelMemoryStore().read().catch(() => null),
  ]);

  const outcomesArr = outcomeMem?.outcomes ?? [];
  const driftArr = driftMem?.observations ?? [];
  const visualArr = visualMem?.fingerprints ?? [];
  const narrativeArr = narrativeMem?.fingerprints ?? [];

  const worldInput = {
    outcomes: { outcomes: outcomesArr },
    drift: { observations: driftArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  };

  const worldReading = computeWorldModel(worldInput);
  const aestheticReading = computeAestheticMigration({
    visualDNA: { fingerprints: visualArr },
    outcomes: { outcomes: outcomesArr },
  });
  const attentionReading = computeCollectiveAttention({
    outcomes: { outcomes: outcomesArr },
    drift: { observations: driftArr },
  });
  const moodReading = computeCivilizationalMood({
    worldSignals: worldReading.signals,
    aesthetic: aestheticReading,
    attention: attentionReading,
  });
  const meaningReading = computeMeaningPressure({
    worldSignals: worldReading.signals,
    aesthetic: aestheticReading,
    attention: attentionReading,
  });

  // Persist a single composed snapshot — non-fatal on failure.
  let totalSnapshots = priorWorldMem?.totalSnapshots ?? 0;
  try {
    const store = createWorldModelMemoryStore();
    const next = await store.append({
      at: Date.now(),
      worldSignals: worldReading.signals,
      meaningPressures: meaningReading.signals,
      dominantEra: moodReading.dominantEra,
      dominantEraConfidence: moodReading.dominantEraConfidence,
      dominantWorldSignals: worldReading.dominantSignals,
      dominantMeaningPressures: meaningReading.dominantPressures,
      dominantAestheticMigrations: aestheticReading.dominantMigrations,
      dominantAttentionMovements: attentionReading.dominantMovements,
      observationCount: worldReading.totalObservations,
    });
    totalSnapshots = next.totalSnapshots;
  } catch {
    // non-fatal — observatory persistence never blocks the read view
  }

  return NextResponse.json({
    world: worldReading,
    aesthetic: aestheticReading,
    attention: attentionReading,
    mood: moodReading,
    meaning: meaningReading,
    totalSnapshots,
    advisoryNotice:
      'Observatory only — the system observes collective human movement. ' +
      'It never predicts, never persuades, never steers behaviorally, ' +
      'never auto-applies a pattern. The system observes humanity. ' +
      'It does not control it.',
  });
}
