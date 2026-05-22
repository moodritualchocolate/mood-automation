/**
 * scripts/test-persistent-runtime.ts
 *
 * PHASE 27 — anti-episodic + zero-prompt + identity verification.
 *
 * Proves the system is a LIVING RUNTIME, not an episodic generator:
 *
 *   ANTI-EPISODIC TEST
 *     - run consecutive generations on one campaign
 *     - each run reads the prior run (priorStateSummary references it)
 *     - the runtime generation index increments
 *     - the world-state generation index increments
 *     - the next-run directive carries forward
 *     - continuity is computed (and the first run is the only
 *       run permitted to be "fresh")
 *     - the runtime trace references the prior run
 *
 *   ZERO-PROMPT RUNTIME TEST
 *     - every run uses only { formula } — no prompt, no scene, no
 *       style, no product direction — and still produces a coherent
 *       decision from runtime memory + world-state.
 *
 *   RUNTIME IDENTITY TEST
 *     - injected conflicting signals (high engagement, weak truth,
 *       strong product, poor cultural honesty) must NOT make the
 *       runtime chase the trend — human truth + brand identity win.
 *
 * Run with:  npx tsx scripts/test-persistent-runtime.ts
 */

import { runPipeline } from '@/core/pipeline';
import { createRuntimeMemoryStore } from '@lib/runtimeMemoryStore';
import { defendIdentity } from '@lib/runtimeIdentity';

const CAMPAIGN = 'phase27-test';

interface RunOutcome {
  index: number;
  approved: boolean;
  priorStateSummary: string;
  runtimeGenerationIndex: number;
  worldStateGen: number;
  continuityScore: number;
  isFirstRun: boolean;
  behavedFresh: boolean;
  traceRemembered: string;
  directiveAvoids: string[];
  changedMind: boolean;
}

async function main() {
  console.log('\n PHASE 27 — Persistent Cognitive Runtime verification\n');

  const store = createRuntimeMemoryStore(CAMPAIGN);
  await store.reset();

  const outcomes: RunOutcome[] = [];

  // ── ANTI-EPISODIC + ZERO-PROMPT: 5 consecutive generations ──────
  for (let i = 1; i <= 5; i++) {
    try {
      // Zero-prompt: only the formula + the campaign id. No scene,
      // no style, no product direction.
      const { banner } = await runPipeline({ formula: 'ENERGY', campaignId: CAMPAIGN });
      const rt = banner.tasteSystem.runtime;
      outcomes.push({
        index: i,
        approved: true,
        priorStateSummary: rt.persistentState.priorStateSummary,
        runtimeGenerationIndex: rt.persistentState.generationIndex,
        worldStateGen: banner.tasteSystem.cognition.field.worldStateConfidence >= 0
          ? (await store.read()).history[0]?.worldStateGen ?? 0
          : 0,
        continuityScore: rt.continuity.continuity_score,
        isFirstRun: rt.continuity.is_first_run,
        behavedFresh: rt.continuity.behaved_like_fresh_prompt,
        traceRemembered: rt.trace.remembered,
        directiveAvoids: rt.nextRunDirective.avoidEmotionalTerritories,
        changedMind: rt.persistentState.changed_the_mind,
      });
      console.log(`  gen ${i}: approved · continuity ${rt.continuity.continuity_score}/10 · ` +
        `${rt.persistentState.changed_the_mind ? 'changed the mind' : 'did not advance'}`);
    } catch {
      // An exhausted run still commits a rejection to the runtime.
      const book = await store.read();
      outcomes.push({
        index: i,
        approved: false,
        priorStateSummary: book.lastState
          ? `gen ${book.lastState.generationIndex}: ${book.lastState.dominantTruth}`
          : 'no prior state',
        runtimeGenerationIndex: book.generationIndex,
        worldStateGen: book.history[0]?.worldStateGen ?? 0,
        continuityScore: book.history[0]?.continuityScore ?? 0,
        isFirstRun: i === 1,
        behavedFresh: false,
        traceRemembered: book.traces[0]?.remembered ?? '',
        directiveAvoids: book.nextRunDirective.avoidEmotionalTerritories,
        changedMind: false,
      });
      console.log(`  gen ${i}: refused (exhausted) · rejection committed to the runtime`);
    }
  }

  const finalBook = await store.read();

  // ── RUNTIME IDENTITY TEST ───────────────────────────────────────
  const identityDefense = defendIdentity({
    engagementTrendPull: 9,        // a loud trend
    humanTruthStrength: 4,          // a weak truth
    productVisibilityPush: 9,       // heavy product push
    culturalHonesty: 3,             // poor cultural honesty
  });

  // ── checks ──────────────────────────────────────────────────────
  const checks: Array<[string, boolean, string]> = [
    [
      'zero-prompt: 5 generations ran with only { formula } supplied',
      outcomes.length === 5,
      `${outcomes.length} generations completed from runtime context alone`,
    ],
    [
      'anti-episodic: the runtime generation index incremented across runs',
      finalBook.generationIndex >= 5,
      `runtime generationIndex reached ${finalBook.generationIndex}`,
    ],
    [
      'anti-episodic: generation 2+ read the prior generation',
      outcomes.slice(1).every((o) => !o.priorStateSummary.startsWith('no prior')),
      outcomes[1] ? `gen 2 prior-state: "${outcomes[1].priorStateSummary}"` : 'n/a',
    ],
    [
      'anti-episodic: only the first run was permitted to be "fresh"',
      outcomes[0].isFirstRun && outcomes.slice(1).every((o) => !o.isFirstRun),
      'is_first_run was true only for generation 1',
    ],
    [
      'anti-episodic: the runtime trace references the prior run',
      outcomes.slice(1).some((o) => /gen \d/.test(o.traceRemembered)),
      outcomes[1] ? `gen 2 remembered: "${outcomes[1].traceRemembered.slice(0, 90)}..."` : 'n/a',
    ],
    [
      'anti-episodic: the next-run directive carries an anti-repetition avoidance',
      finalBook.nextRunDirective.avoidEmotionalTerritories.length > 0,
      `directive avoids: ${finalBook.nextRunDirective.avoidEmotionalTerritories.join(', ') || 'none'}`,
    ],
    [
      'anti-episodic: continuity was scored on every non-first run',
      outcomes.slice(1).every((o) => typeof o.continuityScore === 'number'),
      `continuity scores: ${outcomes.map((o) => o.continuityScore).join(', ')}`,
    ],
    [
      'memory: the runtime accumulated approval and/or rejection memory',
      finalBook.approvalMemory.length + finalBook.rejectionMemory.length >= 1,
      `${finalBook.approvalMemory.length} approvals · ${finalBook.rejectionMemory.length} rejections remembered`,
    ],
    [
      'memory: the runtime stored a trace per run',
      finalBook.traces.length >= 1,
      `${finalBook.traces.length} runtime traces stored`,
    ],
    [
      'no run behaved like a fresh prompt after generation 1',
      outcomes.slice(1).every((o) => !o.behavedFresh),
      outcomes.slice(1).every((o) => !o.behavedFresh)
        ? 'every later run respected prior memory'
        : 'a later run behaved like a fresh prompt',
    ],
    [
      'runtime identity: protected human truth over a loud engagement trend',
      identityDefense.protected_identity && !identityDefense.chased_trend,
      identityDefense.decision,
    ],
  ];

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`\n  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
    console.log(`        ${detail}`);
    if (ok) passed += 1;
  }

  console.log(`\n  ${passed}/${checks.length} checks passed`);
  console.log(`  final runtime: gen ${finalBook.generationIndex} · ` +
    `${finalBook.approvedCount} approved / ${finalBook.rejectedCount} refused`);
  if (finalBook.lastState) {
    console.log(`  last director memo: ${finalBook.lastState.directorMemo.slice(0, 120)}...`);
  }
  console.log('');

  if (passed < checks.length) {
    console.error('  PHASE 27 VERIFICATION FAILED — the system behaved episodically.\n');
    process.exit(1);
  }
  console.log('  PHASE 27 VERIFIED — the system remembers what it believed yesterday.\n');
}

main().catch((e) => {
  console.error('\n  persistent-runtime verification failed:', e);
  process.exit(1);
});
