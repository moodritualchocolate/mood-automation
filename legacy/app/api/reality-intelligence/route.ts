/**
 * GET /api/reality-intelligence
 *
 * Read-only observatory composing all reality-attachment analyzers.
 * Never auto-optimizes, never auto-selects winners, never modifies
 * any other memory. Returns the full historical picture from
 * outcome memory.
 */

import { NextResponse } from 'next/server';
import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { buildPerformanceDNA } from '@lib/performanceDNA';
import { buildDecayIntelligence } from '@lib/decayIntelligence';
import { buildHookLifecycle } from '@lib/hookLifecycleEngine';
import { buildAudienceSegmentReport } from '@lib/audienceSegmentMemory';
import { buildEmotionalResponseMap } from '@lib/emotionalResponseMap';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const mem = await createOutcomeMemoryStore().read().catch(() => null);
  const outcomes = mem?.outcomes ?? [];

  const performanceDNA = buildPerformanceDNA(outcomes);
  const decay = buildDecayIntelligence(outcomes);
  const hooks = buildHookLifecycle(outcomes);
  const audience = buildAudienceSegmentReport(outcomes);
  const emotional = buildEmotionalResponseMap(outcomes);

  return NextResponse.json({
    totalOutcomes: outcomes.length,
    performanceDNA,
    decayIntelligence: {
      totalPatterns: decay.totalPatterns,
      patternsByStage: decay.patternsByStage,
    },
    longTermPerformers: decay.longTermPerformers,
    fastBurnPatterns: decay.fastBurnPatterns,
    recoveryWindows: decay.recoveryWindows,
    hookLifecycle: hooks,
    audienceSegments: audience,
    emotionalResponseMap: emotional,
    advisoryNotice:
      'Observatory only — reality intelligence describes what historically ' +
      'happened. The system never auto-optimizes, never auto-selects winners.',
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `performance-correlations:${performanceDNA.traitCorrelations.length}`,
      `decay-patterns:${decay.totalPatterns}`,
      `hooks:${hooks.length}`,
      `audience-segments:${audience.segments.length}`,
      `emotional-signatures:${emotional.signatureSummaries.length}`,
    ],
  });
}
