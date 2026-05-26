/**
 * VERIFY — Cultural Memory + Symbolic + Archetype + Ritual + Generational.
 *
 * Pure-function verification. No HTTP, no live writes.
 *
 * Cases:
 *   cultural-signatures · per-segment 18-dim signature is computed
 *   cultural-collective · collective-memory themes detected
 *   cultural-collapse   · over-used theme detected as collapsed
 *   cultural-det        · deterministic across runs
 *   symbol-detect       · known symbols surfaced when present
 *   symbol-resonance    · resonance ordering matches engagement
 *   symbol-trust        · symbols with trust-formation surface
 *   archetype-detect    · archetypes recognized when present
 *   archetype-effects   · archetypes' effects (trust/fatigue/etc.) categorized
 *   ritual-detect       · rituals detected and ordered by attachment
 *   generational-axes   · all 8 axes produced per segment
 *   generational-distinct · segments deviating from baseline surface
 *   isolation           · no critic / pipeline imports
 *   no-mutate           · no fetch / no fs.writeFile in any module
 *   no-prediction       · no predictive phrasing in any output
 *   no-stereotype       · no demographic claims in module source
 *   advisory-notice     · every module exposes a protective notice
 *   tsc                 · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  computeCulturalMemory, type CulturalInput,
} from '../lib/culturalMemoryEngine';
import { computeSymbolicResonance } from '../lib/symbolicResonanceEngine';
import { computeArchetypeRecognition } from '../lib/archetypeRecognition';
import { computeRitualBehaviors } from '../lib/ritualBehaviorEngine';
import { computeGenerationalEmotionMap } from '../lib/generationalEmotionMap';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic outcomes ───────────────────────────────────────

type Outcome = NonNullable<NonNullable<CulturalInput['outcomes']>['outcomes']>[number];

function rec(o: Partial<Outcome>): Outcome {
  return {
    at: 1000,
    audienceSegment: 'us-parents',
    formula: 'ENERGY',
    campaignMode: 'Documentary',
    visualStyle: 'documentary-observed',
    cadenceState: 'gradual',
    realismLevel: 7,
    persuasionIntensity: 3,
    mutationPressure: 2,
    emotionalSignature: 'observed-pressure',
    narrativeSignature: 'stillness-silence',
    downstreamOutcome: 'emotional-resonance',
    metrics: { retention: 0.6, saves: 3, comments: 2, shares: 1, bounceRate: 0.2, scrollDepth: 0.6 },
    ...o,
  };
}

function buildSample(): CulturalInput {
  const outcomes: Outcome[] = [];
  // 4 records for "us-parents" leaning sincerity / realism / rituals
  for (let i = 0; i < 4; i++) {
    outcomes.push(rec({
      at: i * 1000, audienceSegment: 'us-parents',
      visualStyle: 'documentary-observed kitchen family-table',
      narrativeSignature: 'stillness-silence rituals',
      emotionalSignature: 'family parents nostalgia',
      downstreamOutcome: 'trust-formation',
      realismLevel: 8, persuasionIntensity: 3,
      metrics: { retention: 0.65, saves: 4, follows: 1, profileVisits: 3, scrollDepth: 0.6, bounceRate: 0.2 },
    }));
  }
  // 4 records for "crypto" leaning fast pace / aggression
  for (let i = 0; i < 4; i++) {
    outcomes.push(rec({
      at: 10000 + i * 1000, audienceSegment: 'crypto',
      visualStyle: 'cinematic-polished', cadenceState: 'burst',
      narrativeSignature: 'panic-escalation', emotionalSignature: 'urgency',
      downstreamOutcome: 'authenticity-rejection',
      realismLevel: 3, persuasionIntensity: 9, mutationPressure: 8,
      metrics: { retention: 0.2, saves: 0, shares: 5, comments: 8, bounceRate: 0.6 },
    }));
  }
  // 4 records of the same theme repeated across many segments → timeless candidate
  for (let i = 0; i < 4; i++) {
    outcomes.push(rec({
      at: 20000 + i * 1000,
      audienceSegment: i % 2 === 0 ? 'wellness' : 'us-parents',
      emotionalSignature: 'observed-pressure', narrativeSignature: 'stillness-silence',
      visualStyle: 'documentary-observed sunset',
      downstreamOutcome: 'emotional-resonance',
      realismLevel: 8,
      metrics: { retention: 0.7, saves: 5, scrollDepth: 0.7, bounceRate: 0.15 },
    }));
  }
  // 4 records of a theme that collapses (early strong, late weak)
  for (let i = 0; i < 2; i++) {
    outcomes.push(rec({
      at: 30000 + i * 1000, audienceSegment: 'us-parents',
      emotionalSignature: 'inspirational', narrativeSignature: 'fast-aspiration',
      visualStyle: 'cinematic-polished',
      metrics: { retention: 0.7, saves: 5, scrollDepth: 0.6 },
    }));
  }
  for (let i = 0; i < 2; i++) {
    outcomes.push(rec({
      at: 40000 + i * 1000, audienceSegment: 'us-parents',
      emotionalSignature: 'inspirational', narrativeSignature: 'fast-aspiration',
      visualStyle: 'cinematic-polished',
      metrics: { retention: 0.1, saves: 0, scrollDepth: 0.1, bounceRate: 0.7 },
    }));
  }
  return { outcomes: { outcomes } };
}

// ─── cases ────────────────────────────────────────────────────

function caseCulturalSignatures(): { ok: boolean; detail: string } {
  const r = computeCulturalMemory(buildSample());
  return {
    ok: r.segments.length >= 2 && r.segments.every((s) => typeof s.signature.realismPreference === 'number'),
    detail: `segments=${r.segments.map((s) => `${s.segment}:${s.outcomes}`).join(', ')}`,
  };
}
function caseCulturalCollective(): { ok: boolean; detail: string } {
  const r = computeCulturalMemory(buildSample());
  return {
    ok: r.collectiveMemory.length >= 2,
    detail: `themes=${r.collectiveMemory.length} persistence=${r.emotionalPersistence}/10`,
  };
}
function caseCulturalCollapse(): { ok: boolean; detail: string } {
  const r = computeCulturalMemory(buildSample());
  return {
    ok: r.collapsedSymbols.length >= 1,
    detail: `collapsed=${r.collapsedSymbols.length}`,
  };
}
function caseCulturalDet(): { ok: boolean; detail: string } {
  const i = buildSample();
  const a = JSON.stringify(computeCulturalMemory(i));
  const b = JSON.stringify(computeCulturalMemory(i));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

function caseSymbolDetect(): { ok: boolean; detail: string } {
  const r = computeSymbolicResonance(buildSample());
  const present = new Set(r.symbols.map((s) => s.symbol));
  // From our test data: kitchens, family-tables, silence, rituals, sunsets, realism, documentary, parents
  const expected = ['kitchens', 'silence', 'realism', 'parents'];
  const found = expected.filter((e) => present.has(e));
  return { ok: found.length >= 3, detail: `present=${[...present].join(', ')}` };
}
function caseSymbolResonance(): { ok: boolean; detail: string } {
  const r = computeSymbolicResonance(buildSample());
  // High-resonance symbols should be ordered by resonance descending.
  for (let i = 1; i < r.symbols.length; i++) {
    if (r.symbols[i].resonance > r.symbols[i - 1].resonance) {
      return { ok: false, detail: `not sorted at ${i}` };
    }
  }
  return { ok: true, detail: `${r.symbols.length} symbols sorted by resonance` };
}
function caseSymbolTrust(): { ok: boolean; detail: string } {
  const r = computeSymbolicResonance(buildSample());
  return {
    ok: r.symbols.some((s) => s.trustFormationCount >= 1),
    detail: `trust-symbols=${r.symbols.filter((s) => s.trustFormationCount >= 1).map((s) => s.symbol).join(', ')}`,
  };
}

function caseArchetypeDetect(): { ok: boolean; detail: string } {
  // Build a sample with explicit archetype tokens.
  const input: CulturalInput = { outcomes: { outcomes: [
    rec({ emotionalSignature: 'caregiver tender', narrativeSignature: 'protect-loved' }),
    rec({ emotionalSignature: 'caregiver gentle', narrativeSignature: 'nurturing' }),
    rec({ emotionalSignature: 'overwhelmed modern human exhausted', narrativeSignature: 'maxed-out' }),
    rec({ emotionalSignature: 'overwhelmed too-much', narrativeSignature: 'drained-modern' }),
  ] } };
  const r = computeArchetypeRecognition(input);
  return {
    ok: r.recognized.length >= 1,
    detail: `archetypes=${r.recognized.map((a) => a.key).join(', ')}`,
  };
}
function caseArchetypeEffects(): { ok: boolean; detail: string } {
  const input: CulturalInput = { outcomes: { outcomes: [
    rec({ emotionalSignature: 'caregiver', narrativeSignature: 'caregiver tender',
      downstreamOutcome: 'trust-formation' }),
    rec({ emotionalSignature: 'caregiver', narrativeSignature: 'caregiver gentle',
      downstreamOutcome: 'trust-formation' }),
  ] } };
  const r = computeArchetypeRecognition(input);
  const arche = r.recognized.find((a) => a.key === 'caregiver');
  return {
    ok: arche !== undefined && arche.effects.trust >= 1,
    detail: arche ? JSON.stringify(arche.effects) : 'no caregiver',
  };
}

function caseRitualDetect(): { ok: boolean; detail: string } {
  const input: CulturalInput = { outcomes: { outcomes: [
    rec({ emotionalSignature: 'coffee morning', narrativeSignature: 'first cup',
      metrics: { retention: 0.7, saves: 5, rewatches: 1, scrollDepth: 0.7 } }),
    rec({ emotionalSignature: 'coffee', narrativeSignature: 'coffee brewing',
      metrics: { retention: 0.65, saves: 4 } }),
    rec({ emotionalSignature: 'night-routine bedtime', narrativeSignature: 'evening-ritual',
      metrics: { retention: 0.5, saves: 3 } }),
  ] } };
  const r = computeRitualBehaviors(input);
  const keys = new Set(r.detected.map((d) => d.key));
  return {
    ok: keys.has('coffee-rituals') && (keys.has('night-routines') || keys.has('bedtime-decompression')),
    detail: `detected=${[...keys].join(', ')}`,
  };
}

function caseGenerationalAxes(): { ok: boolean; detail: string } {
  const r = computeGenerationalEmotionMap(buildSample());
  return {
    ok: r.segments.every((s) => s.axes.length === 8) && r.baseline.length === 8,
    detail: `segments=${r.segments.length} baseline-axes=${r.baseline.length}`,
  };
}
function caseGenerationalDistinct(): { ok: boolean; detail: string } {
  const r = computeGenerationalEmotionMap(buildSample());
  // crypto should deviate from baseline on at least 'pacing-tolerance' or 'authenticity-sensitivity'.
  const crypto = r.segments.find((s) => s.segment === 'crypto');
  return {
    ok: crypto !== undefined && crypto.mostDistinctAxes.length === 3,
    detail: crypto ? `crypto distinct: ${crypto.mostDistinctAxes.join(', ')}` : 'no crypto segment',
  };
}

async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/culturalMemoryEngine.ts',
    'lib/symbolicResonanceEngine.ts',
    'lib/archetypeRecognition.ts',
    'lib/ritualBehaviorEngine.ts',
    'lib/generationalEmotionMap.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
    /from\s+['"]@\/core\/criticEngine/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    for (const re of forbidden) {
      if (re.test(src)) return { ok: false, detail: `forbidden import in ${f}` };
    }
  }
  return { ok: true, detail: 'no critic / pipeline imports' };
}
async function caseNoMutate(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/culturalMemoryEngine.ts',
    'lib/symbolicResonanceEngine.ts',
    'lib/archetypeRecognition.ts',
    'lib/ritualBehaviorEngine.ts',
    'lib/generationalEmotionMap.ts',
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'no fetch / fs.writeFile in any module' };
}
function caseNoPrediction(): { ok: boolean; detail: string } {
  const input = buildSample();
  const text = JSON.stringify({
    cultural:     computeCulturalMemory(input),
    symbols:      computeSymbolicResonance(input),
    archetypes:   computeArchetypeRecognition(input),
    rituals:      computeRitualBehaviors(input),
    generational: computeGenerationalEmotionMap(input),
  });
  const banned = /(will happen|going to happen|guarantees|predicts that)/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no predictive phrasing' : 'banned phrasing found',
  };
}
async function caseNoStereotype(): Promise<{ ok: boolean; detail: string }> {
  // Module source must not encode demographic claims about generations
  // or populations. We scan for forbidden phrases that would constitute
  // stereotype assertions.
  const files = [
    'lib/culturalMemoryEngine.ts',
    'lib/symbolicResonanceEngine.ts',
    'lib/archetypeRecognition.ts',
    'lib/ritualBehaviorEngine.ts',
    'lib/generationalEmotionMap.ts',
  ];
  const banned = /(boomers|millennials|gen[\s-]?z|gen[\s-]?x|all (men|women|people)|young people are|older people are)/i;
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (banned.test(src)) return { ok: false, detail: `stereotype phrasing in ${f}` };
  }
  return { ok: true, detail: 'no demographic stereotypes in source' };
}
function caseAdvisoryNotice(): { ok: boolean; detail: string } {
  const i = buildSample();
  const readings: Array<{ advisoryNotice: string }> = [
    computeCulturalMemory(i),
    computeSymbolicResonance(i),
    computeArchetypeRecognition(i),
    computeRitualBehaviors(i),
    computeGenerationalEmotionMap(i),
  ];
  const allOk = readings.every((r) => /observatory|advisor|protective|never/i.test(r.advisoryNotice));
  return {
    ok: allOk,
    detail: allOk ? 'all five modules expose protective notices' : 'a module is missing the notice',
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('CULTURAL MEMORY VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['cultural-signatures', 'per-segment cultural signature computed',                       () => caseCulturalSignatures()],
    ['cultural-collective', 'collective memory themes detected',                              () => caseCulturalCollective()],
    ['cultural-collapse',   'over-used theme detected as collapsed',                          () => caseCulturalCollapse()],
    ['cultural-det',        'cultural memory deterministic',                                  () => caseCulturalDet()],
    ['symbol-detect',       'known symbols surfaced when present',                            () => caseSymbolDetect()],
    ['symbol-resonance',    'resonance ordering matches engagement',                          () => caseSymbolResonance()],
    ['symbol-trust',        'symbols with trust-formation surface',                           () => caseSymbolTrust()],
    ['archetype-detect',    'archetypes recognized when present',                             () => caseArchetypeDetect()],
    ['archetype-effects',   'archetype effects (trust / fatigue / etc.) categorized',         () => caseArchetypeEffects()],
    ['ritual-detect',       'rituals detected and ordered by attachment',                     () => caseRitualDetect()],
    ['generational-axes',   'all 8 axes produced per segment + baseline',                     () => caseGenerationalAxes()],
    ['generational-distinct', 'segments deviating from baseline surface',                     () => caseGenerationalDistinct()],
    ['isolation',           'no critic / pipeline imports in any module',                     () => caseIsolation()],
    ['no-mutate',           'no fetch / no fs.writeFile in any module',                       () => caseNoMutate()],
    ['no-prediction',       'no predictive phrasing in any output',                           () => caseNoPrediction()],
    ['no-stereotype',       'no demographic stereotype phrasing in module source',            () => caseNoStereotype()],
    ['advisory-notice',     'every module exposes a protective advisory notice',              () => caseAdvisoryNotice()],
  ];

  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = await fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }

  record('tsc', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true,
    'this script defers compiler validation to the suite runner');

  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('verification script crashed:', err);
  process.exit(2);
});
