/**
 * GET /api/human-presence
 *
 * Human presence observatory. Composes outcomes + visual DNA +
 * narrative DNA into presence signals + composites.
 *
 * Each GET also appends ONE snapshot to presence memory.
 *
 * STRICT CONTRACT:
 *   - GET only — no POST, no execution, no publishing
 *   - never manufactures presence
 *   - never recommends content
 */

import { NextResponse } from 'next/server';
import { computeHumanPresence } from '@lib/humanPresenceEngine';
import { createPresenceMemoryStore } from '@lib/presenceMemory';
import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [outcomeMem, visualMem, narrativeMem, priorPresenceMem] = await Promise.all([
    createOutcomeMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createPresenceMemoryStore().read().catch(() => null),
  ]);

  const outcomesArr = outcomeMem?.outcomes ?? [];
  const visualArr = visualMem?.fingerprints ?? [];
  const narrativeArr = narrativeMem?.fingerprints ?? [];

  const reading = computeHumanPresence({
    outcomes: { outcomes: outcomesArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });

  let totalSnapshots = priorPresenceMem?.totalSnapshots ?? 0;
  try {
    const store = createPresenceMemoryStore();
    const next = await store.append({
      at: Date.now(),
      presenceScore: reading.presenceScore,
      signals: reading.signals,
      stillnessWeight: reading.stillnessWeight,
      authenticityWeight: reading.authenticityWeight,
      imperfectionSignature: reading.imperfectionSignature,
      vulnerabilitySignals: reading.vulnerabilitySignals,
      emotionalBreathing: reading.emotionalBreathing,
      listeningSignals: reading.listeningSignals,
      humanityRetention: reading.humanityRetention,
      syntheticPressure: reading.syntheticPressure,
      dignityProtection: reading.dignityProtection,
      dominantPresenceSignals: reading.dominantPresenceSignals,
      observationCount: outcomesArr.length + visualArr.length + narrativeArr.length,
    });
    totalSnapshots = next.totalSnapshots;
  } catch {
    // non-fatal — presence persistence never blocks the read view
  }

  return NextResponse.json({
    presence: reading,
    authenticity: reading.authenticityWeight,
    stillness: reading.stillnessWeight,
    vulnerability: reading.vulnerabilitySignals,
    listening: reading.listeningSignals,
    dignity: reading.dignityProtection,
    humanity: reading.humanityRetention,
    totalSnapshots,
    advisoryNotice:
      'Observatory only — the system studies human presence. ' +
      'It does not manufacture authenticity.',
  });
}
