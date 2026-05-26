/**
 * GET /api/cultural-memory
 *
 * Read-only observatory composing all cultural-memory analyzers.
 * Never used for stereotyping, segmentation-for-exploitation,
 * political optimization, or tribal manipulation.
 */

import { NextResponse } from 'next/server';
import {
  computeCulturalMemory, type CulturalInput, type OutcomeSubset,
} from '@lib/culturalMemoryEngine';
import { computeSymbolicResonance } from '@lib/symbolicResonanceEngine';
import { computeArchetypeRecognition } from '@lib/archetypeRecognition';
import { computeRitualBehaviors } from '@lib/ritualBehaviorEngine';
import { computeGenerationalEmotionMap } from '@lib/generationalEmotionMap';
import { createOutcomeMemoryStore } from '@lib/outcomeMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const mem = await createOutcomeMemoryStore().read().catch(() => null);
  const input: CulturalInput = {
    outcomes: mem as OutcomeSubset | null,
  };

  const cultural   = computeCulturalMemory(input);
  const symbols    = computeSymbolicResonance(input);
  const archetypes = computeArchetypeRecognition(input);
  const rituals    = computeRitualBehaviors(input);
  const generational = computeGenerationalEmotionMap(input);

  return NextResponse.json({
    culturalPatterns: cultural,
    symbolicResonance: symbols,
    archetypes,
    rituals,
    generationalSignals: generational,
    collectiveMemory: cultural.collectiveMemory,
    emotionalPersistence: cultural.emotionalPersistence,
    trustFormationPatterns: {
      symbolsWithTrustFormation: symbols.symbols.filter((s) => s.trustFormationCount >= 1),
      archetypesWithTrust: archetypes.recognized.filter((a) => a.effects.trust >= 1),
    },
    fatigueDifferences: {
      archetypesCausingFatigue: archetypes.recognized.filter((a) => a.effects.fatigue >= 1),
      collapsedSymbols: cultural.collapsedSymbols,
    },
    realismPreference: cultural.segments.map((s) => ({
      segment: s.segment,
      realismPreference: s.signature.realismPreference,
    })),
    advisoryNotice:
      'Observatory only — cultural memory describes collective emotional cognition. ' +
      'NEVER used for manipulation, tribal optimization, or political persuasion.',
    reasonCodes: [
      ...cultural.reasonCodes.slice(0, 4),
      ...symbols.reasonCodes.slice(0, 3),
      ...archetypes.reasonCodes.slice(0, 2),
      ...rituals.reasonCodes.slice(0, 2),
      ...generational.reasonCodes.slice(0, 2),
    ],
  });
}
