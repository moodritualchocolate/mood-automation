/**
 * GET /api/consequence-intelligence
 *
 * Read-only. Composes consequence-memory episodes into a unified
 * analysis: patterns, correlations, risk escalations, recovery
 * intelligence, stabilization successes, and strategic timeline.
 *
 * The endpoint never runs generation, never mutates memory, never
 * applies an adaptation. It is a historical observatory.
 */

import { NextResponse } from 'next/server';
import { createConsequenceMemoryStore } from '@lib/consequenceIntelligenceMemory';
import { buildConsequenceAnalysis } from '@lib/consequenceAnalyzer';
import { buildRecoveryIntelligence } from '@lib/recoveryIntelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const mem = await createConsequenceMemoryStore().read().catch(() => null);
  const episodes = mem?.episodes ?? [];
  const analysis = buildConsequenceAnalysis(episodes);
  const recovery = buildRecoveryIntelligence(episodes);
  return NextResponse.json({
    totalEpisodes: episodes.length,
    consequencePatterns: analysis.consequencePatterns,
    historicalCorrelations: analysis.historicalCorrelations,
    riskEscalations: analysis.riskEscalations,
    strategicTimeline: analysis.strategicTimeline,
    recoveryPatterns: recovery.recoveryPatterns,
    stabilizationSuccesses: recovery.stabilizationSuccesses,
    topRecoveryTakeaways: recovery.topRecoveryTakeaways,
    recoveryEpisodeCount: recovery.recoveryEpisodeCount,
    advisoryNotice: analysis.advisoryNotice,
    reasonCodes: [...analysis.reasonCodes, ...recovery.reasonCodes],
  });
}
