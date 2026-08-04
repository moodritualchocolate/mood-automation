/**
 * scripts/verify-cross-brain-conflict.ts
 *
 * Deterministic verification for the Cross-Brain Conflict Engine.
 * Drives across cases A–L:
 *
 *   A · same inputs → same conflicts
 *   B · aggressive CTA + high trust debt → trust-vs-conversion
 *   C · emotional intensity + cultural fatigue → emotion-vs-fatigue
 *   D · novelty high + authenticity low → novelty-vs-authenticity
 *   E · aligned systems reduce overall tension
 *   F · conflicting systems reduce cognitive stability
 *   G · recurring conflict increases instability trend
 *   H · FIFO caps stable
 *   I · no runtime mutation (perception call leaves memory unchanged)
 *   J · no critic imports (static check)
 *   K · no external APIs (static check)
 *   L · deterministic outputs — byte-identical JSON
 *
 * Run: npx tsx scripts/verify-cross-brain-conflict.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import type { AdStrategyAssessment } from '../lib/adStrategyEngine';
import type { CopywriterOutput } from '../lib/copywriterEngine';
import type { CopyQualityAxis } from '../lib/copyQualityAdapter';
import type { CulturalPerception, CulturalSignal } from '../lib/culturalPerceptionEngine';
import {
  computeCrossBrainConflict,
} from '../lib/crossBrainConflictEngine';
import {
  createConflictMemoryStore,
  applyConflictObservation,
  createInitialConflictMemory,
  buildConflictObservation,
  CONFLICT_OBSERVATION_LIMIT,
  type ConflictObservation,
} from '../lib/conflictMemory';
import { buildConflictLongitudinalView } from '../lib/conflictLongitudinalView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('CROSS-BRAIN CONFLICT ENGINE — VERIFICATION\n');

// ─── synthetic input builders ─────────────────────────────────

function strategy(over: Partial<AdStrategyAssessment> = {}): AdStrategyAssessment {
  const baseConstraints = {
    hookIntensity: 5,
    productVisibility: 5,
    textAmount: 'minimal' as const,
    ctaStrength: 4,
    emotionalDirectness: 5,
    proofRequirement: 'medium' as const,
    criticStrictnessRecommendation: 'baseline' as const,
  };
  const base: AdStrategyAssessment = {
    primaryAudience: 'office_worker',
    secondaryAudience: null,
    emotionalWound: 'tiredness',
    hiddenDesire: 'calm',
    surfaceObjection: 'cost',
    deeperObjection: 'skepticism',
    trustBarrier: 'new-brand',
    campaignRole: 'trust_builder',
    recommendedAngle: 'baseline',
    forbiddenAngle: 'none',
    persuasionMode: 'observational',
    storyShape: 'mirror',
    proofNeed: 'medium',
    urgencyLevel: 3,
    repetitionRisk: 2,
    brandRisk: 2,
    trustDebt: 2,
    strategicDepth: 6,
    confidence: 7,
    reasonCodes: ['baseline'],
    creativeConstraints: { ...baseConstraints, ...(over.creativeConstraints ?? {}) },
    ...over,
  };
  // Re-apply merged constraints after spread (spread can clobber).
  base.creativeConstraints = { ...baseConstraints, ...(over.creativeConstraints ?? {}) };
  return base;
}

function copyQuality(over: Partial<CopyQualityAxis> = {}): CopyQualityAxis {
  return {
    copyIntegrity: 7,
    trustSafety: 7,
    dignitySafety: 8,
    repetitionConcern: 3,
    proofAdequacy: 6,
    ctaRestraint: 7,
    hebrewNaturalness: 8,
    strategicCopyFit: 7,
    warnings: [],
    reasonCodes: [],
    ...over,
  };
}

function copywriter(over: Partial<CopywriterOutput> = {}): CopywriterOutput {
  return {
    hook: 'baseline hook',
    body: 'baseline body',
    cta: 'baseline cta',
    proofLine: 'proof line',
    emotionalFrame: 'frame-a',
    persuasionTone: 'observational' as unknown as CopywriterOutput['persuasionTone'],
    urgencyStyle: 'soft',
    restraintLevel: 6,
    productPresence: 'mentioned',
    forbiddenPhrasesTriggered: [],
    repetitionSimilarity: 3,
    trustAlignment: 7,
    strategicAlignment: 7,
    dignityAlignment: 7,
    confidence: 7,
    reasonCodes: [],
    ...over,
  };
}

function culture(over: Partial<CulturalPerception> = {}): CulturalPerception {
  return {
    culturalState: 'baseline',
    dominantSignals: [],
    noveltyScore: 5,
    emotionalFreshness: 6,
    trustClimate: 7,
    aestheticFatigue: 3,
    visualNoiseLevel: 4,
    pacingFatigue: 3,
    hookSaturation: 3,
    conformityRisk: 3,
    audienceNumbness: 2,
    perceivedAuthenticity: 7,
    humanResonance: 7,
    culturalWarnings: [],
    strategicOpportunities: [],
    forbiddenDirections: [],
    emotionalDrift: { movingToward: [], movingAwayFrom: [] },
    reasonCodes: ['baseline', 'rich', 'data', 'many', 'codes', 'present'],
    ...over,
  };
}

async function main() {
  // ── A. same inputs → same conflicts ──────────────────────────
  {
    const input = {
      strategy: strategy(),
      copywriter: copywriter(),
      copyQuality: copyQuality(),
      culturalPerception: culture(),
    };
    const c1 = computeCrossBrainConflict(input);
    const c2 = computeCrossBrainConflict(input);
    check('A · same inputs → same conflicts',
      JSON.stringify(c1) === JSON.stringify(c2),
      `tension ${c1.overallTension} · stability ${c1.cognitiveStability} · active ${c1.activeConflicts.length}`);
  }

  // ── B. aggressive CTA + high trust debt → trust-vs-conversion ──
  {
    const conflict = computeCrossBrainConflict({
      strategy: strategy({
        trustDebt: 8,
        urgencyLevel: 8,
        creativeConstraints: {
          hookIntensity: 8,
          productVisibility: 6,
          textAmount: 'minimal',
          ctaStrength: 9,
          emotionalDirectness: 7,
          proofRequirement: 'medium',
          criticStrictnessRecommendation: 'baseline',
        },
      }),
      copyQuality: copyQuality({ ctaRestraint: 2, trustSafety: 3 }),
      culturalPerception: culture({
        trustClimate: 3,
        dominantSignals: ['trust-fragile', 'algorithmically-obvious'] as CulturalSignal[],
      }),
    });
    const detected = conflict.activeConflicts.find((c) => c.type === 'trust-vs-conversion');
    check('B · aggressive CTA + high trust debt → trust-vs-conversion',
      !!detected && detected.severity >= 6,
      detected ? `severity ${detected.severity} · systems ${detected.systemsInvolved.join(',')}` : 'NOT DETECTED');
  }

  // ── C. emotional intensity + cultural fatigue → emotion-vs-fatigue ──
  {
    const conflict = computeCrossBrainConflict({
      strategy: strategy({
        persuasionMode: 'empathic',
        urgencyLevel: 7,
        creativeConstraints: {
          hookIntensity: 8, productVisibility: 5, textAmount: 'minimal',
          ctaStrength: 5, emotionalDirectness: 9, proofRequirement: 'medium',
          criticStrictnessRecommendation: 'baseline',
        },
      }),
      copywriter: copywriter({ restraintLevel: 2 }),
      culturalPerception: culture({
        audienceNumbness: 8,
        emotionalFreshness: 3,
        dominantSignals: ['emotionally-numb'] as CulturalSignal[],
      }),
    });
    const detected = conflict.activeConflicts.find((c) => c.type === 'emotion-vs-fatigue');
    check('C · emotional intensity + cultural fatigue → emotion-vs-fatigue',
      !!detected && detected.severity >= 5,
      detected ? `severity ${detected.severity}` : 'NOT DETECTED');
  }

  // ── D. novelty high + authenticity low → novelty-vs-authenticity ──
  {
    const conflict = computeCrossBrainConflict({
      culturalPerception: culture({
        noveltyScore: 9,
        perceivedAuthenticity: 2,
        humanResonance: 4,
        dominantSignals: ['novel-but-unsafe'] as CulturalSignal[],
      }),
    });
    const detected = conflict.activeConflicts.find((c) => c.type === 'novelty-vs-authenticity');
    check('D · novelty high + authenticity low → novelty-vs-authenticity',
      !!detected && detected.severity >= 6,
      detected ? `severity ${detected.severity}` : 'NOT DETECTED');
  }

  // ── E. aligned systems reduce overall tension ────────────────
  {
    const aligned = computeCrossBrainConflict({
      strategy: strategy({
        trustDebt: 1, urgencyLevel: 3, brandRisk: 1, repetitionRisk: 1,
        proofNeed: 'medium', persuasionMode: 'observational',
        creativeConstraints: {
          hookIntensity: 4, productVisibility: 5, textAmount: 'minimal',
          ctaStrength: 3, emotionalDirectness: 4, proofRequirement: 'medium',
          criticStrictnessRecommendation: 'baseline',
        },
      }),
      copyQuality: copyQuality({
        copyIntegrity: 8, trustSafety: 8, dignitySafety: 8,
        ctaRestraint: 8, proofAdequacy: 7, repetitionConcern: 2,
      }),
      culturalPerception: culture({
        noveltyScore: 6, perceivedAuthenticity: 8, humanResonance: 8,
        trustClimate: 8, aestheticFatigue: 2, audienceNumbness: 2,
        pacingFatigue: 2, hookSaturation: 2, conformityRisk: 2,
        dominantSignals: ['human-resonant', 'emotionally-fresh'] as CulturalSignal[],
      }),
    });
    const conflicted = computeCrossBrainConflict({
      strategy: strategy({
        trustDebt: 8, urgencyLevel: 9, brandRisk: 7, repetitionRisk: 7,
        proofNeed: 'high', persuasionMode: 'empathic',
        creativeConstraints: {
          hookIntensity: 9, productVisibility: 5, textAmount: 'minimal',
          ctaStrength: 9, emotionalDirectness: 9, proofRequirement: 'high',
          criticStrictnessRecommendation: 'baseline',
        },
      }),
      copyQuality: copyQuality({
        copyIntegrity: 3, trustSafety: 3, dignitySafety: 3,
        ctaRestraint: 2, proofAdequacy: 2, repetitionConcern: 8,
      }),
      culturalPerception: culture({
        noveltyScore: 9, perceivedAuthenticity: 2, humanResonance: 3,
        trustClimate: 3, aestheticFatigue: 8, audienceNumbness: 8,
        pacingFatigue: 8, hookSaturation: 8, conformityRisk: 8,
        dominantSignals: ['novel-but-unsafe', 'algorithmically-obvious',
                          'aesthetic-burnout', 'trust-fragile'] as CulturalSignal[],
      }),
    });
    check('E · aligned systems reduce overall tension',
      aligned.overallTension < conflicted.overallTension && aligned.overallTension <= 4,
      `aligned=${aligned.overallTension} conflicted=${conflicted.overallTension}`);
  }

  // ── F. conflicting systems reduce cognitive stability ────────
  {
    const aligned = computeCrossBrainConflict({
      strategy: strategy(),
      culturalPerception: culture({
        humanResonance: 8, trustClimate: 8, audienceNumbness: 2,
      }),
    });
    const conflicted = computeCrossBrainConflict({
      strategy: strategy({
        trustDebt: 8, urgencyLevel: 9, persuasionMode: 'empathic',
        proofNeed: 'high',
        creativeConstraints: {
          hookIntensity: 9, productVisibility: 5, textAmount: 'minimal',
          ctaStrength: 9, emotionalDirectness: 9, proofRequirement: 'high',
          criticStrictnessRecommendation: 'baseline',
        },
      }),
      copyQuality: copyQuality({ copyIntegrity: 3, ctaRestraint: 2, trustSafety: 3 }),
      culturalPerception: culture({
        audienceNumbness: 8, aestheticFatigue: 8, trustClimate: 3,
        humanResonance: 2,
        dominantSignals: ['emotionally-numb', 'trust-fragile', 'aesthetic-burnout'] as CulturalSignal[],
      }),
    });
    check('F · conflicting systems reduce cognitive stability',
      conflicted.cognitiveStability < aligned.cognitiveStability && conflicted.cognitiveStability <= 5,
      `aligned=${aligned.cognitiveStability} conflicted=${conflicted.cognitiveStability}`);
  }

  // ── G. recurring conflict increases instability trend ────────
  {
    // Build memory with low-tension early observations and high-tension recent.
    let memory = createInitialConflictMemory();
    const baseConflict = computeCrossBrainConflict({
      strategy: strategy(),
      culturalPerception: culture(),
    });
    for (let i = 0; i < 8; i++) {
      memory = applyConflictObservation(memory, buildConflictObservation({
        at: 100 + i,
        bannerId: `g-low-${i}`,
        formula: 'ENERGY',
        campaignMode: 'Documentary',
        overallTension: baseConflict.overallTension,
        cognitiveStability: baseConflict.cognitiveStability,
        alignmentScore: baseConflict.alignmentScore,
        dominantConflict: baseConflict.dominantConflict,
        activeConflicts: baseConflict.activeConflicts,
        agreementZones: baseConflict.agreementZones,
        silentRiskCount: baseConflict.silentRisks.length,
      }));
    }
    const highConflict = computeCrossBrainConflict({
      strategy: strategy({
        trustDebt: 9, urgencyLevel: 9, persuasionMode: 'empathic',
        proofNeed: 'high',
        creativeConstraints: {
          hookIntensity: 9, productVisibility: 5, textAmount: 'minimal',
          ctaStrength: 9, emotionalDirectness: 9, proofRequirement: 'high',
          criticStrictnessRecommendation: 'baseline',
        },
      }),
      copyQuality: copyQuality({ copyIntegrity: 3, ctaRestraint: 2, trustSafety: 3 }),
      culturalPerception: culture({
        audienceNumbness: 9, aestheticFatigue: 9, trustClimate: 2,
        humanResonance: 2, noveltyScore: 9, perceivedAuthenticity: 2,
        dominantSignals: [
          'emotionally-numb', 'trust-fragile', 'aesthetic-burnout',
          'novel-but-unsafe',
        ] as CulturalSignal[],
      }),
    });
    for (let i = 0; i < 8; i++) {
      memory = applyConflictObservation(memory, buildConflictObservation({
        at: 1000 + i,
        bannerId: `g-high-${i}`,
        formula: 'ENERGY',
        campaignMode: 'Documentary',
        overallTension: highConflict.overallTension,
        cognitiveStability: highConflict.cognitiveStability,
        alignmentScore: highConflict.alignmentScore,
        dominantConflict: highConflict.dominantConflict,
        activeConflicts: highConflict.activeConflicts,
        agreementZones: highConflict.agreementZones,
        silentRiskCount: highConflict.silentRisks.length,
      }));
    }
    const view = buildConflictLongitudinalView({ memory });
    check('G · recurring conflict → instability rising',
      view.instabilityTrend === 'rising' && view.totalObservations === 16,
      `trend=${view.instabilityTrend} total=${view.totalObservations}`);
  }

  // ── H. FIFO caps stable ──────────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'conflict-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodConflictMemory = undefined;
    const store = createConflictMemoryStore(tmpDir);
    await store.reset();
    const stub: ConflictObservation = {
      at: 0,
      bannerId: 'h',
      formula: 'ENERGY',
      campaignMode: 'Documentary',
      overallTension: 5,
      cognitiveStability: 5,
      alignmentScore: 5,
      dominantConflict: null,
      activeConflicts: [],
      agreementZones: [],
      silentRiskCount: 0,
    };
    for (let i = 0; i < CONFLICT_OBSERVATION_LIMIT + 20; i++) {
      await store.append({ ...stub, at: 100 + i, bannerId: `h-${i}` });
    }
    const state = await store.read();
    check('H · FIFO cap stable at CONFLICT_OBSERVATION_LIMIT',
      state.observations.length === CONFLICT_OBSERVATION_LIMIT &&
      state.totalObservations === CONFLICT_OBSERVATION_LIMIT + 20 &&
      state.instabilityTrace.length <= 64,
      `observations=${state.observations.length}/${CONFLICT_OBSERVATION_LIMIT} total=${state.totalObservations} trace=${state.instabilityTrace.length}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodConflictMemory = undefined;
  }

  // ── I. no runtime mutation ───────────────────────────────────
  {
    const input = {
      strategy: strategy(),
      culturalPerception: culture(),
      copyQuality: copyQuality(),
      copywriter: copywriter(),
    };
    const before = JSON.stringify(input);
    computeCrossBrainConflict(input);
    computeCrossBrainConflict(input);
    const after = JSON.stringify(input);
    check('I · no runtime mutation — engine leaves inputs unchanged',
      before === after,
      `input bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports in engine sources ───────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/crossBrainConflictEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/conflictMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/conflictLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = [
      'critic', 'finalVerdict', 'tasteJudge', 'humanReaction',
      'campaignDecision', 'perceptionCritic',
    ];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    check('J · no critic imports in conflict sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── K. no external APIs ───────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/crossBrainConflictEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/conflictMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/conflictLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in conflict sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs — byte-identical view ───────────
  {
    let memory = createInitialConflictMemory();
    for (let i = 0; i < 6; i++) {
      memory = applyConflictObservation(memory, buildConflictObservation({
        at: 100 + i,
        bannerId: `l-${i}`,
        formula: 'ENERGY',
        campaignMode: 'Documentary',
        overallTension: 5 + (i % 3),
        cognitiveStability: 5,
        alignmentScore: 6,
        dominantConflict: i % 2 === 0 ? 'trust-vs-conversion' : 'novelty-vs-authenticity',
        activeConflicts: [{
          type: i % 2 === 0 ? 'trust-vs-conversion' : 'novelty-vs-authenticity',
          severity: 6,
          systemsInvolved: ['strategy', 'trust'],
          explanation: 'synthetic',
          suggestedObservation: 'observe',
        }],
        agreementZones: ['novelty + authenticity holding together'],
        silentRiskCount: 1,
      }));
    }
    const view1 = buildConflictLongitudinalView({ memory });
    const view2 = buildConflictLongitudinalView({ memory });
    check('L · deterministic — same memory → byte-identical view',
      JSON.stringify(view1) === JSON.stringify(view2),
      `recurring×${view1.recurringConflicts.length} trend=${view1.instabilityTrend}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
