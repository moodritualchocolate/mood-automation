/**
 * GENERATION MUTATION PLANNER (advisory, pure)
 *
 * Pure deterministic planner. Given creative/drift/trust/fatigue
 * signals, returns concrete mutation suggestions across eight
 * categories. The planner NEVER:
 *   - runs generation
 *   - calls a model
 *   - mutates memory
 *   - rewrites prompts
 *   - applies any change itself
 *
 * Output is a structured advisory document. The operator decides
 * which (if any) mutations to apply.
 *
 * Same input → same output. Determinism is enforced by stable input
 * ranking + a fixed dispatch table.
 */

export interface MutationPlannerInput {
  // Headline drift-engine signals.
  entropy?: number;                // 0..10
  originalityPressure?: number;    // 0..10
  trustDebt?: number;              // 0..10
  persuasionCollapse?: number;     // 0..10 (high = bad — single mode dominating)
  emotionalFlattening?: number;    // 0..10 (high = bad)
  repetitionCycles?: number;       // count of recent cycle markers
  fatigueIndicators?: number;      // 0..10 from fatigue engine
  visualConvergence?: number;      // 0..10 (high = converging look)
  campaignDrift?: number;          // 0..10
  narrativeInstability?: number;   // 0..10 (high = unstable, low = good)
  formulaConvergence?: number;     // 0..10 (high = formulas merging)
  longitudinalDecline?: number;    // 0..10

  // Optional context — surfaces in rationale text.
  formula?: string;
  campaignMode?: string | null;
  brutality?: number;
}

export interface MutationSuggestion {
  mutation: string;
  rationale: string;
  intensity: number;               // 0..10 — how strongly the planner suggests this
  wouldAffect: string;
}

export interface MutationPlan {
  pacingMutations: MutationSuggestion[];
  compositionMutations: MutationSuggestion[];
  emotionalMutations: MutationSuggestion[];
  narrativeMutations: MutationSuggestion[];
  persuasionMutations: MutationSuggestion[];
  visualMutations: MutationSuggestion[];
  restraintMutations: MutationSuggestion[];
  noveltyMutations: MutationSuggestion[];

  /** Total adaptation pressure 0..10. */
  totalMutationPressure: number;
  /** Top three suggestions, drawn from any category. */
  topPriorityMutations: MutationSuggestion[];

  advisoryNotice: string;
  reasonCodes: string[];
}

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

const ADVISORY_NOTICE =
  'Advisory only — the planner suggests mutations; it never applies them. ' +
  'The operator is the final executor.';

// ─── main ─────────────────────────────────────────────────────

export function computeGenerationMutationPlan(
  input: MutationPlannerInput,
): MutationPlan {
  const plan: MutationPlan = {
    pacingMutations: [],
    compositionMutations: [],
    emotionalMutations: [],
    narrativeMutations: [],
    persuasionMutations: [],
    visualMutations: [],
    restraintMutations: [],
    noveltyMutations: [],
    totalMutationPressure: 0,
    topPriorityMutations: [],
    advisoryNotice: ADVISORY_NOTICE,
    reasonCodes: [],
  };

  const reasonCodes: string[] = [];

  // ── IF trust debt > 6 ──────────────────────────────────────
  const trustDebt = input.trustDebt ?? 0;
  if (trustDebt > 6) {
    reasonCodes.push(`trust-debt:${trustDebt}:>6`);
    plan.persuasionMutations.push({
      mutation: 'reduce CTA intensity',
      rationale: `trust debt at ${round1(trustDebt)}/10 — declarative CTA accelerates erosion`,
      intensity: clamp10(round1(trustDebt)),
      wouldAffect: 'CTA tone and command strength',
    });
    plan.persuasionMutations.push({
      mutation: 'reduce persuasion density',
      rationale: 'multiple persuasive moves per piece compounds the trust cost',
      intensity: clamp10(round1(trustDebt - 1)),
      wouldAffect: 'argument layering per banner',
    });
    plan.pacingMutations.push({
      mutation: 'increase silence intervals',
      rationale: 'silence reads as confidence; aggression reads as need',
      intensity: clamp10(round1(trustDebt - 1)),
      wouldAffect: 'beat between hook and proposition',
    });
    plan.emotionalMutations.push({
      mutation: 'increase observational framing',
      rationale: 'observed-not-pitched framing rebuilds trust',
      intensity: clamp10(round1(trustDebt)),
      wouldAffect: 'narrative posture toward the audience',
    });
    plan.visualMutations.push({
      mutation: 'prefer documentary realism',
      rationale: 'overproduced visuals amplify the perceived "sell"',
      intensity: clamp10(round1(trustDebt - 2)),
      wouldAffect: 'lighting / lens / polish choices',
    });
    plan.persuasionMutations.push({
      mutation: 'reduce direct commands',
      rationale: 'imperatives compound trust debt directly',
      intensity: clamp10(round1(trustDebt - 1)),
      wouldAffect: 'CTA and body imperative count',
    });
  }

  // ── IF repetition cycles rising ─────────────────────────────
  const repCycles = input.repetitionCycles ?? 0;
  if (repCycles >= 2) {
    reasonCodes.push(`repetition-cycles:${repCycles}`);
    plan.noveltyMutations.push({
      mutation: 'rotate hook structures',
      rationale: `${repCycles} repetition cycle marker(s) detected`,
      intensity: clamp10(round1(repCycles * 2)),
      wouldAffect: 'opening hook family selection',
    });
    plan.emotionalMutations.push({
      mutation: 'rotate emotional cadence',
      rationale: 'the system is recycling its own emphasis',
      intensity: clamp10(round1(repCycles * 1.5)),
      wouldAffect: 'opening emotional register',
    });
    plan.compositionMutations.push({
      mutation: 'forbid repeated visual symmetry',
      rationale: 'symmetric framing has become identifiable',
      intensity: clamp10(round1(repCycles * 1.5)),
      wouldAffect: 'composition geometry',
    });
    plan.compositionMutations.push({
      mutation: 'inject asymmetry',
      rationale: 'asymmetric framing is the simplest way out of the recognized rhythm',
      intensity: clamp10(round1(repCycles * 1.5)),
      wouldAffect: 'focal placement, negative-space bias',
    });
    plan.pacingMutations.push({
      mutation: 'widen pacing variance',
      rationale: 'a slower or faster opening breaks the recognized cadence',
      intensity: clamp10(round1(repCycles * 1.5)),
      wouldAffect: 'beat-to-beat rhythm',
    });
    plan.persuasionMutations.push({
      mutation: 'reduce repeated captions',
      rationale: 'captions are clustering on the same phrase family',
      intensity: clamp10(round1(repCycles * 1.5)),
      wouldAffect: 'caption vocabulary',
    });
  }

  // ── IF emotional flattening detected ────────────────────────
  const flattening = input.emotionalFlattening ?? 0;
  if (flattening >= 6) {
    reasonCodes.push(`emotional-flattening:${flattening}`);
    plan.emotionalMutations.push({
      mutation: 'increase emotional contrast',
      rationale: `single emotional register is carrying the campaign (${round1(flattening)}/10 flattening)`,
      intensity: clamp10(round1(flattening)),
      wouldAffect: 'emotional palette per run',
    });
    plan.pacingMutations.push({
      mutation: 'introduce stillness',
      rationale: 'one beat where nothing is being asked of the audience',
      intensity: clamp10(round1(flattening - 1)),
      wouldAffect: 'pacing within a single banner',
    });
    plan.emotionalMutations.push({
      mutation: 'widen narrative temperature',
      rationale: 'allow a warmer or cooler beat than the recent average',
      intensity: clamp10(round1(flattening - 1)),
      wouldAffect: 'emotional color temperature',
    });
    plan.visualMutations.push({
      mutation: 'increase human imperfection signals',
      rationale: 'imperfection introduces emotional contrast naturally',
      intensity: clamp10(round1(flattening - 2)),
      wouldAffect: 'lighting, framing, lens artifacts',
    });
  }

  // ── IF AI-looking convergence detected ─────────────────────
  const visualConv = input.visualConvergence ?? 0;
  if (visualConv >= 6) {
    reasonCodes.push(`visual-convergence:${visualConv}`);
    plan.visualMutations.push({
      mutation: 'reduce polish',
      rationale: `visual convergence at ${round1(visualConv)}/10 — output reads as synthetic`,
      intensity: clamp10(round1(visualConv)),
      wouldAffect: 'rendering polish level',
    });
    plan.visualMutations.push({
      mutation: 'inject framing imperfections',
      rationale: 'minor off-axis framing breaks the "made by machine" read',
      intensity: clamp10(round1(visualConv - 1)),
      wouldAffect: 'composition tolerances',
    });
    plan.compositionMutations.push({
      mutation: 'introduce dead-space',
      rationale: 'overproduced compositions resist negative space',
      intensity: clamp10(round1(visualConv - 1)),
      wouldAffect: 'negativeSpaceBias',
    });
    plan.visualMutations.push({
      mutation: 'increase documentary randomness',
      rationale: 'documentary realism counters synthetic familiarity',
      intensity: clamp10(round1(visualConv - 1)),
      wouldAffect: 'overall realism level',
    });
    plan.visualMutations.push({
      mutation: 'lower visual cleanliness',
      rationale: 'imperfection signals are part of the trust contract',
      intensity: clamp10(round1(visualConv - 2)),
      wouldAffect: 'polish tolerance',
    });
    plan.restraintMutations.push({
      mutation: 'reduce cinematic over-control',
      rationale: 'cinematic perfection reads as artificiality',
      intensity: clamp10(round1(visualConv - 1)),
      wouldAffect: 'camera/lens control language',
    });
  }

  // ── persuasion collapse ────────────────────────────────────
  const persuasionCollapse = input.persuasionCollapse ?? 0;
  if (persuasionCollapse >= 6) {
    reasonCodes.push(`persuasion-collapse:${persuasionCollapse}`);
    plan.persuasionMutations.push({
      mutation: 'rotate persuasion mode',
      rationale: `single persuasion mode dominating (collapse ${round1(persuasionCollapse)}/10)`,
      intensity: clamp10(round1(persuasionCollapse)),
      wouldAffect: 'strategy.persuasionMode',
    });
    plan.narrativeMutations.push({
      mutation: 'change opening argument shape',
      rationale: 'when persuasion mode does not move, the argument shape must',
      intensity: clamp10(round1(persuasionCollapse - 1)),
      wouldAffect: 'storyShape selection',
    });
  }

  // ── narrative instability ──────────────────────────────────
  const narrInstab = input.narrativeInstability ?? 0;
  if (narrInstab >= 6) {
    reasonCodes.push(`narrative-instability:${narrInstab}`);
    plan.narrativeMutations.push({
      mutation: 'hold formula and mode for next two runs',
      rationale: 'narrative is unstable across runs — let identity reconstitute',
      intensity: clamp10(round1(narrInstab - 1)),
      wouldAffect: 'run-to-run formula/mode rotation',
    });
    plan.restraintMutations.push({
      mutation: 'tighten composition discipline',
      rationale: 'narrative instability often pairs with composition drift',
      intensity: clamp10(round1(narrInstab - 2)),
      wouldAffect: 'composition guardrails',
    });
  }

  // ── formula convergence ────────────────────────────────────
  const formConv = input.formulaConvergence ?? 0;
  if (formConv >= 6) {
    reasonCodes.push(`formula-convergence:${formConv}`);
    plan.noveltyMutations.push({
      mutation: 'differentiate formula vocabularies',
      rationale: 'formulas are using overlapping audience and tone vocabularies',
      intensity: clamp10(round1(formConv)),
      wouldAffect: 'audience selection per formula',
    });
  }

  // ── longitudinal decline / general drift ───────────────────
  const decline = input.longitudinalDecline ?? 0;
  const drift = input.campaignDrift ?? 0;
  if (decline >= 5 || drift >= 5) {
    reasonCodes.push(`longitudinal-decline:${decline} campaign-drift:${drift}`);
    plan.restraintMutations.push({
      mutation: 'pause and reanchor',
      rationale: 'multi-axis decline indicates the campaign needs a directional reset',
      intensity: clamp10(round1(Math.max(decline, drift))),
      wouldAffect: 'campaign cadence — operator decision required',
    });
  }

  // ── fatigue ────────────────────────────────────────────────
  const fatigue = input.fatigueIndicators ?? 0;
  if (fatigue >= 6) {
    reasonCodes.push(`fatigue:${fatigue}`);
    plan.noveltyMutations.push({
      mutation: 'introduce one unfamiliar element',
      rationale: `predictability has elevated (${round1(fatigue)}/10 fatigue)`,
      intensity: clamp10(round1(fatigue)),
      wouldAffect: 'composition / hook / persuasion — operator picks',
    });
  }

  // ── originality pressure ───────────────────────────────────
  const orig = input.originalityPressure ?? 0;
  if (orig >= 7) {
    reasonCodes.push(`originality-pressure:${orig}`);
    plan.noveltyMutations.push({
      mutation: 'allow one structurally unfamiliar run',
      rationale: 'originality pressure has elevated past the comfortable band',
      intensity: clamp10(round1(orig)),
      wouldAffect: 'overall structural template',
    });
  }

  // ── entropy ─────────────────────────────────────────────────
  const entropy = input.entropy ?? 10;
  if (entropy <= 4) {
    reasonCodes.push(`low-entropy:${entropy}`);
    plan.noveltyMutations.push({
      mutation: 'inject one composition outside the current rhythm',
      rationale: `entropy ${round1(entropy)}/10 — diversity across axes has collapsed`,
      intensity: clamp10(round1(10 - entropy)),
      wouldAffect: 'one upcoming run',
    });
  }

  // ── compute totals ─────────────────────────────────────────
  const all: MutationSuggestion[] = [
    ...plan.pacingMutations, ...plan.compositionMutations,
    ...plan.emotionalMutations, ...plan.narrativeMutations,
    ...plan.persuasionMutations, ...plan.visualMutations,
    ...plan.restraintMutations, ...plan.noveltyMutations,
  ];
  plan.totalMutationPressure = clamp10(round1(
    all.length === 0 ? 0 : Math.max(...all.map((m) => m.intensity)),
  ));
  plan.topPriorityMutations = [...all]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3);

  // Dedupe categories deterministically — same input always produces
  // the same priority ordering. We sort each category by intensity desc.
  const sortCat = (xs: MutationSuggestion[]): MutationSuggestion[] =>
    [...xs].sort((a, b) => b.intensity - a.intensity || a.mutation.localeCompare(b.mutation));
  plan.pacingMutations       = sortCat(plan.pacingMutations);
  plan.compositionMutations  = sortCat(plan.compositionMutations);
  plan.emotionalMutations    = sortCat(plan.emotionalMutations);
  plan.narrativeMutations    = sortCat(plan.narrativeMutations);
  plan.persuasionMutations   = sortCat(plan.persuasionMutations);
  plan.visualMutations       = sortCat(plan.visualMutations);
  plan.restraintMutations    = sortCat(plan.restraintMutations);
  plan.noveltyMutations      = sortCat(plan.noveltyMutations);

  plan.reasonCodes = [
    ...reasonCodes,
    `total-pressure:${plan.totalMutationPressure}/10`,
    `total-mutations:${all.length}`,
    `top-priority:${plan.topPriorityMutations.length}`,
  ];

  return plan;
}
