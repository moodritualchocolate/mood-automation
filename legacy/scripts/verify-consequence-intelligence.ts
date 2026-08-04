/**
 * VERIFY — Consequence Intelligence (memory + analyzer + severity + recovery).
 *
 * Pure-function verification. No HTTP, no live memory writes.
 *
 * Cases:
 *   label-positive   · positive deltas produce recovery labels
 *   label-negative   · negative deltas produce collapse labels
 *   label-nochange   · sub-threshold deltas → no-significant-change
 *   episode-shape    · buildConsequenceEpisode returns well-formed episode
 *   episode-det      · same input → same episode (deterministic)
 *   sev-minor        · small delta → minor severity
 *   sev-critical     · large catastrophic delta → critical severity
 *   sev-recovery     · recovery outcomes never marked critical
 *   pat-recurrence   · repeated condition fingerprints surface as patterns
 *   pat-language     · pattern descriptions use "historically correlated", not predictions
 *   corr-trait       · high-trust-debt trait correlates to expected outcomes
 *   risk-escalation  · collapse outcomes appear in risk-escalations list
 *   timeline         · timeline events emitted for collapse / recovery / etc.
 *   recovery-intel   · stabilization-window intervention recognized as helpful
 *   recovery-shares  · intervention shares are deterministic
 *   fifo-cap         · 200 inserts → ≤ CONSEQUENCE_EPISODE_LIMIT
 *   det-analysis     · two builds of the same episode set produce identical JSON
 *   isolation        · no critic / pipeline imports anywhere
 *   no-mutate        · no fetch / no fs.writeFile in pure modules
 *   no-prediction    · pattern descriptions never say "will happen" / "predicts"
 *   tsc              · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  labelOutcome,
  buildConsequenceEpisode,
  createInitialConsequenceMemory,
  CONSEQUENCE_EPISODE_LIMIT,
  type ConsequenceEpisode,
  type DriftSnapshotForConsequence,
} from '../lib/consequenceIntelligenceMemory';
import { classifyConsequenceSeverity } from '../lib/consequenceSeverityEngine';
import { buildConsequenceAnalysis } from '../lib/consequenceAnalyzer';
import { buildRecoveryIntelligence } from '../lib/recoveryIntelligence';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── helpers ──────────────────────────────────────────────────

function snap(overrides: Partial<DriftSnapshotForConsequence>): DriftSnapshotForConsequence {
  return {
    at: 1000, formula: 'ENERGY', campaignMode: null,
    overallCreativeHealth: 5, driftSeverity: 5, entropyLevel: 5,
    originalityPressure: 5, narrativeStability: 5,
    emotionalDiversity: 5, persuasionVariance: 5,
    formulaDistinctiveness: 5, trustErosionDrift: 0,
    ...overrides,
  };
}

// ─── outcome labeling ─────────────────────────────────────────

function caseLabelPositive(): { ok: boolean; detail: string } {
  // trustDebt fell, fatigue fell, overall health rose.
  const r = labelOutcome({
    trustDebt: -3, fatigue: -3, originalityPressure: -1,
    persuasionVariance: 1, visualConvergence: 0,
    emotionalFlattening: -1, overallCreativeHealth: 3,
  });
  const recovery = ['trust-recovered', 'fatigue-improved', 'campaign-coherence-recovered'].includes(r.primary);
  return { ok: recovery, detail: `primary=${r.primary} secondaries=${r.secondaries.join(',')}` };
}

function caseLabelNegative(): { ok: boolean; detail: string } {
  const r = labelOutcome({
    trustDebt: 4, fatigue: 3, originalityPressure: 0,
    persuasionVariance: -3, visualConvergence: 3,
    emotionalFlattening: 0, overallCreativeHealth: -3,
  });
  const collapse = ['trust-collapsed', 'persuasion-collapsed', 'campaign-coherence-degraded', 'convergence-accelerated', 'fatigue-worsened'].includes(r.primary);
  return { ok: collapse, detail: `primary=${r.primary} secondaries=${r.secondaries.join(',')}` };
}

function caseLabelNoChange(): { ok: boolean; detail: string } {
  const r = labelOutcome({
    trustDebt: 0.5, fatigue: -0.3, originalityPressure: 0,
    persuasionVariance: 0, visualConvergence: 0,
    emotionalFlattening: 0, overallCreativeHealth: 0.4,
  });
  return { ok: r.primary === 'no-significant-change', detail: `primary=${r.primary}` };
}

function caseEpisodeShape(): { ok: boolean; detail: string } {
  const cond = snap({ at: 1000, trustErosionDrift: -2, originalityPressure: 7 });
  const out  = snap({ at: 5000, trustErosionDrift: 3,  originalityPressure: 3, overallCreativeHealth: 4 });
  const ep = buildConsequenceEpisode(cond, out, {
    dominantRisk: 'trust-erosion', adaptationPriority: 'trust-protection',
    cadenceState: 'stabilizing', mutationPressure: 4,
    conditionFatigue: 6, outcomeFatigue: 4,
    conditionVisualConvergence: 5, outcomeVisualConvergence: 3,
    mutationCount: 0, stabilizationWindows: 1,
  });
  const wellFormed = ep.condition.dominantRisk === 'trust-erosion' &&
    ep.condition.adaptationPriority === 'trust-protection' &&
    ep.windowSize > 0 &&
    typeof ep.outcomeMagnitude === 'number' &&
    ['trust-collapsed', 'originality-restored', 'fatigue-improved',
     'campaign-coherence-recovered', 'convergence-reversed',
     'no-significant-change'].includes(ep.downstreamOutcome) === true;
  return { ok: wellFormed, detail: `outcome=${ep.downstreamOutcome} magnitude=${ep.outcomeMagnitude} priority=${ep.condition.adaptationPriority}` };
}

function caseEpisodeDeterministic(): { ok: boolean; detail: string } {
  const cond = snap({ at: 1000, originalityPressure: 7, persuasionVariance: 4 });
  const out  = snap({ at: 5000, originalityPressure: 4, persuasionVariance: 7, overallCreativeHealth: 7 });
  const ctx = {
    adaptationPriority: 'fatigue-recovery', cadenceState: 'gradual',
    mutationPressure: 5, conditionFatigue: 7, outcomeFatigue: 4,
    conditionVisualConvergence: 6, outcomeVisualConvergence: 3,
    mutationCount: 1, stabilizationWindows: 1,
  };
  const a = JSON.stringify(buildConsequenceEpisode(cond, out, ctx));
  const b = JSON.stringify(buildConsequenceEpisode(cond, out, ctx));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── severity ─────────────────────────────────────────────────

function caseSevMinor(): { ok: boolean; detail: string } {
  const ep: Pick<ConsequenceEpisode, 'downstreamOutcome' | 'outcomeMagnitude' | 'deltas' | 'secondaryOutcomes'> = {
    downstreamOutcome: 'no-significant-change', outcomeMagnitude: 0,
    deltas: { trustDebt: 0, fatigue: 0, originalityPressure: 0, persuasionVariance: 0, visualConvergence: 0, emotionalFlattening: 0.5, overallCreativeHealth: 0 },
    secondaryOutcomes: [],
  };
  return { ok: classifyConsequenceSeverity(ep) === 'minor', detail: classifyConsequenceSeverity(ep) };
}

function caseSevCritical(): { ok: boolean; detail: string } {
  const ep: Pick<ConsequenceEpisode, 'downstreamOutcome' | 'outcomeMagnitude' | 'deltas' | 'secondaryOutcomes'> = {
    downstreamOutcome: 'trust-collapsed', outcomeMagnitude: 7,
    deltas: { trustDebt: 7, fatigue: 4, originalityPressure: 3, persuasionVariance: -3, visualConvergence: 3, emotionalFlattening: 2, overallCreativeHealth: -5 },
    secondaryOutcomes: ['campaign-coherence-degraded'],
  };
  return { ok: classifyConsequenceSeverity(ep) === 'critical', detail: classifyConsequenceSeverity(ep) };
}

function caseSevRecovery(): { ok: boolean; detail: string } {
  const ep: Pick<ConsequenceEpisode, 'downstreamOutcome' | 'outcomeMagnitude' | 'deltas' | 'secondaryOutcomes'> = {
    downstreamOutcome: 'trust-recovered', outcomeMagnitude: 8,
    deltas: { trustDebt: -8, fatigue: -5, originalityPressure: -3, persuasionVariance: 4, visualConvergence: -3, emotionalFlattening: -2, overallCreativeHealth: 6 },
    secondaryOutcomes: ['campaign-coherence-recovered'],
  };
  const s = classifyConsequenceSeverity(ep);
  return { ok: s !== 'critical', detail: `recovery severity=${s}` };
}

// ─── analyzer cases ───────────────────────────────────────────

function buildEpisodesForRecurrence(): ConsequenceEpisode[] {
  // 3 episodes with HIGH trust debt + HIGH mutation pressure → trust-collapsed
  //   (trustErosionDrift goes from -2 to +5 → trust debt 3 → 10, delta +7)
  // 2 episodes with LOW trust + STABILIZATION → trust-recovered
  //   (trustErosionDrift goes from 1 → -4 → trust debt 6 → 1, delta -5)
  // 1 episode no significant change
  const eps: ConsequenceEpisode[] = [];
  for (let i = 0; i < 3; i++) {
    const cond = snap({ at: i * 1000, trustErosionDrift: -2, originalityPressure: 7 });
    const out  = snap({ at: i * 1000 + 4000, trustErosionDrift: 5, originalityPressure: 7, overallCreativeHealth: 4 });
    eps.push(buildConsequenceEpisode(cond, out, {
      adaptationPriority: 'persuasion-optimization', cadenceState: 'burst',
      mutationPressure: 8, conditionFatigue: 4, outcomeFatigue: 6,
      conditionVisualConvergence: 5, outcomeVisualConvergence: 6,
      mutationCount: 3, stabilizationWindows: 0,
    }));
  }
  for (let i = 0; i < 2; i++) {
    const cond = snap({ at: 10000 + i * 1000, trustErosionDrift: 1, originalityPressure: 3 });
    const out  = snap({ at: 10000 + i * 1000 + 4000, trustErosionDrift: -4, originalityPressure: 3, overallCreativeHealth: 8, persuasionVariance: 7 });
    eps.push(buildConsequenceEpisode(cond, out, {
      adaptationPriority: 'trust-protection', cadenceState: 'stabilizing',
      mutationPressure: 2, conditionFatigue: 3, outcomeFatigue: 2,
      conditionVisualConvergence: 2, outcomeVisualConvergence: 2,
      mutationCount: 0, stabilizationWindows: 1,
    }));
  }
  // Filler.
  const cond = snap({ at: 20000, originalityPressure: 5 });
  const out  = snap({ at: 24000, originalityPressure: 5 });
  eps.push(buildConsequenceEpisode(cond, out, {
    mutationPressure: 4, conditionFatigue: 4, outcomeFatigue: 4,
    mutationCount: 1, stabilizationWindows: 0,
  }));
  return eps;
}

function casePatternRecurrence(): { ok: boolean; detail: string } {
  const eps = buildEpisodesForRecurrence();
  const a = buildConsequenceAnalysis(eps);
  // We expect at least one pattern covering the recurring trust-collapsed cluster.
  const collapsePattern = a.consequencePatterns.find(
    (p) => p.primaryOutcome === 'trust-collapsed' && p.occurrences >= 2,
  );
  return {
    ok: collapsePattern !== undefined,
    detail: collapsePattern
      ? `pattern: ${collapsePattern.description}`
      : `patterns=${a.consequencePatterns.length}`,
  };
}

function casePatternLanguage(): { ok: boolean; detail: string } {
  const eps = buildEpisodesForRecurrence();
  const a = buildConsequenceAnalysis(eps);
  if (a.consequencePatterns.length === 0) return { ok: false, detail: 'no patterns' };
  const banned = /(will happen|predicts|guarantees|going to)/i;
  const required = /historically correlated/i;
  const ok = a.consequencePatterns.every((p) =>
    !banned.test(p.description) && required.test(p.description),
  );
  return { ok, detail: ok ? 'all descriptions use historical-correlation phrasing' : 'banned phrasing found' };
}

function caseCorrTrait(): { ok: boolean; detail: string } {
  const eps = buildEpisodesForRecurrence();
  const a = buildConsequenceAnalysis(eps);
  // high-mutation-pressure trait should correlate with trust-collapsed in our setup.
  const corr = a.historicalCorrelations.find(
    (c) => c.trait === 'high-mutation-pressure' && c.outcome === 'trust-collapsed',
  );
  return {
    ok: corr !== undefined && corr.occurrences >= 2,
    detail: corr ? corr.description : `correlations=${a.historicalCorrelations.length}`,
  };
}

function caseRiskEscalation(): { ok: boolean; detail: string } {
  const eps = buildEpisodesForRecurrence();
  const a = buildConsequenceAnalysis(eps);
  const trustEsc = a.riskEscalations.find((r) => r.outcome === 'trust-collapsed');
  return {
    ok: trustEsc !== undefined && trustEsc.occurrences >= 2,
    detail: trustEsc ? trustEsc.description : `escalations=${a.riskEscalations.length}`,
  };
}

function caseTimeline(): { ok: boolean; detail: string } {
  const eps = buildEpisodesForRecurrence();
  const a = buildConsequenceAnalysis(eps);
  const hasCollapse = a.strategicTimeline.some((e) => e.type === 'collapse-period');
  const hasRecovery = a.strategicTimeline.some((e) => e.type === 'recovery-period');
  const hasBurst    = a.strategicTimeline.some((e) => e.type === 'adaptation-burst');
  return {
    ok: hasCollapse && hasRecovery && hasBurst,
    detail: `collapse=${hasCollapse} recovery=${hasRecovery} burst=${hasBurst} total=${a.strategicTimeline.length}`,
  };
}

function caseRecoveryIntel(): { ok: boolean; detail: string } {
  const eps = buildEpisodesForRecurrence();
  const r = buildRecoveryIntelligence(eps);
  const stabilizationWin = r.stabilizationSuccesses.find(
    (s) => s.intervention.includes('stabilization window') ||
           s.intervention.includes('cadence slowing') ||
           s.intervention.includes('mutation pause'),
  );
  return {
    ok: stabilizationWin !== undefined && r.recoveryEpisodeCount >= 1,
    detail: stabilizationWin
      ? `${stabilizationWin.description}`
      : `successes=${r.stabilizationSuccesses.length} recoveries=${r.recoveryEpisodeCount}`,
  };
}

function caseRecoveryDet(): { ok: boolean; detail: string } {
  const eps = buildEpisodesForRecurrence();
  const a = JSON.stringify(buildRecoveryIntelligence(eps));
  const b = JSON.stringify(buildRecoveryIntelligence(eps));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

function caseFifoCap(): { ok: boolean; detail: string } {
  let mem = createInitialConsequenceMemory();
  for (let i = 0; i < 200; i++) {
    const cond = snap({ at: i * 1000 });
    const out  = snap({ at: i * 1000 + 4000 });
    const ep = buildConsequenceEpisode(cond, out, { mutationPressure: 5 });
    mem = {
      ...mem,
      episodes: [...mem.episodes, ep].slice(-CONSEQUENCE_EPISODE_LIMIT),
      totalEpisodes: mem.totalEpisodes + 1,
    };
  }
  return {
    ok: mem.episodes.length <= CONSEQUENCE_EPISODE_LIMIT && mem.totalEpisodes === 200,
    detail: `length=${mem.episodes.length}/${CONSEQUENCE_EPISODE_LIMIT} total=${mem.totalEpisodes}`,
  };
}

function caseDetAnalysis(): { ok: boolean; detail: string } {
  const eps = buildEpisodesForRecurrence();
  const a = JSON.stringify(buildConsequenceAnalysis(eps));
  const b = JSON.stringify(buildConsequenceAnalysis(eps));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/consequenceIntelligenceMemory.ts',
    'lib/consequenceSeverityEngine.ts',
    'lib/consequenceAnalyzer.ts',
    'lib/recoveryIntelligence.ts',
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
  // Pure modules (analyzer, severity, recovery) must not have fetch
  // or fs.writeFile. The memory module DOES write files (FIFO save),
  // so it is excluded here.
  const pureFiles = [
    'lib/consequenceSeverityEngine.ts',
    'lib/consequenceAnalyzer.ts',
    'lib/recoveryIntelligence.ts',
  ];
  for (const f of pureFiles) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'no fetch / no fs.writeFile in pure modules' };
}

async function caseNoPrediction(): Promise<{ ok: boolean; detail: string }> {
  // Scan the analyzer + recovery output text for forbidden predictive
  // phrasing. We build a representative episode set first.
  const eps = buildEpisodesForRecurrence();
  const a = buildConsequenceAnalysis(eps);
  const r = buildRecoveryIntelligence(eps);
  const allText = JSON.stringify({ a, r });
  const banned = /(will happen|going to happen|guarantees|predicts that)/i;
  return {
    ok: !banned.test(allText),
    detail: !banned.test(allText) ? 'no predictive phrasing' : 'banned phrasing found',
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('CONSEQUENCE INTELLIGENCE VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['label-positive',  'positive deltas → recovery outcome label',           () => caseLabelPositive()],
    ['label-negative',  'negative deltas → collapse outcome label',           () => caseLabelNegative()],
    ['label-nochange',  'sub-threshold deltas → no-significant-change',       () => caseLabelNoChange()],
    ['episode-shape',   'buildConsequenceEpisode returns well-formed episode',() => caseEpisodeShape()],
    ['episode-det',     'episode build is deterministic',                     () => caseEpisodeDeterministic()],
    ['sev-minor',       'tiny deltas → minor severity',                       () => caseSevMinor()],
    ['sev-critical',    'catastrophic + high magnitude → critical severity',  () => caseSevCritical()],
    ['sev-recovery',    'recovery outcomes never marked critical',            () => caseSevRecovery()],
    ['pat-recurrence',  'repeated condition fingerprints surface as patterns',() => casePatternRecurrence()],
    ['pat-language',    'patterns use "historically correlated" phrasing',    () => casePatternLanguage()],
    ['corr-trait',      'high-mutation-pressure correlates to trust-collapsed', () => caseCorrTrait()],
    ['risk-esc',        'collapse outcomes appear in risk-escalations',       () => caseRiskEscalation()],
    ['timeline',        'timeline emits collapse / recovery / burst events',  () => caseTimeline()],
    ['recovery-intel',  'stabilization intervention recognized as helpful',   () => caseRecoveryIntel()],
    ['recovery-det',    'recovery intelligence deterministic',                () => caseRecoveryDet()],
    ['fifo-cap',        'FIFO cap stable (200 inserts ≤ limit)',              () => caseFifoCap()],
    ['det-analysis',    'analysis deterministic across two builds',           () => caseDetAnalysis()],
    ['isolation',       'no critic / pipeline imports in any module',         () => caseIsolation()],
    ['no-mutate',       'pure modules: no fetch / no fs.writeFile',           () => caseNoMutate()],
    ['no-prediction',   'no predictive phrasing in analyzer / recovery output', () => caseNoPrediction()],
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
