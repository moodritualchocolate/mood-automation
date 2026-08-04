/**
 * CREATIVE DIRECTOR ENGINE (pure, observational)
 *
 * Composes signals from prior observatory layers (world model + memory
 * imprint + cultural memory + self-reflection + human truth + human
 * presence + supervised learning + trial outcomes) into CREATIVE
 * DIRECTIONS — observations about what kinds of story currently
 * appear historically aligned with the observed window.
 *
 * IMPORTANT:
 *   - this is NOT generation
 *   - this is NOT publishing
 *   - this is NOT execution
 *   - this layer only DESCRIBES directions
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never selects a candidate
 *   - never names a "best" or "winning" direction
 *   - allowed phrasing only:
 *       "currently appear historically aligned"
 *       "observed alongside"
 *       "historically associated"
 *       "may carry memory weight"
 *       "dignity-preserved"
 *       "requires more evidence"
 *       "appears more historically aligned than"
 *   - forbidden: generate, publish, execute, run, launch, winner,
 *     best, recommended, selected, chosen, optimal, auto-apply,
 *     predict, will (rise/fall/happen/be), optimize, manipulate,
 *     viral
 *
 * The operator remains the only authority.
 */

// ─── loose structural subsets ────────────────────────────────

export interface DirectorWorldSignals {
  /** Subset of WorldStateSignals; all 16 are optional. */
  stimulationSaturation?: number;
  trustFragility?: number;
  emotionalExhaustion?: number;
  realismDemand?: number;
  ironyDensity?: number;
  optimismDrift?: number;
  anxietyClimate?: number;
  ritualHunger?: number;
  symbolicFatigue?: number;
  authenticityDemand?: number;
  nostalgiaPressure?: number;
  lonelinessSignals?: number;
  attentionFragmentation?: number;
  emotionalOverload?: number;
  simplicityCraving?: number;
  meaningSeeking?: number;
}

export interface DirectorMemoryImprint {
  imprintStrength?: number;
  scenePermanence?: number;
  emotionalAftertaste?: number;
  identityAttachment?: number;
  memoryRisk?: number;
  dominantImprintSignals?: string[];
}

export interface DirectorCulturalMemory {
  /** 0..10 — saturation observed in cultural memory. */
  saturation?: number;
  /** 0..10 — recovery observed. */
  recovery?: number;
  /** Recent dominant cultural signals. */
  dominantSignals?: string[];
}

export interface DirectorSelfReflection {
  syntheticDrift?: number;
  humanityRetention?: number;
  manipulationCreep?: number;
  aestheticExhaustion?: number;
  restraintIntegrity?: number;
  identityCoherence?: number;
}

export interface DirectorHumanTruth {
  truthIndex?: number;
  honesty?: number;
  dignityIntegrity?: number;
}

export interface DirectorPresence {
  presenceScore?: number;
  stillnessWeight?: number;
  authenticityWeight?: number;
  imperfectionSignature?: number;
  syntheticPressure?: number;
  dignityProtection?: number;
}

export interface DirectorSupervisedLearning {
  /** Per-axis reliability summary tokens. */
  trustAligned?: number;
  fatigueAligned?: number;
  realismAligned?: number;
  symbolicAligned?: number;
  /** Mutations historically aligned. */
  alignedMutations?: string[];
  /** Mutations historically contradicted. */
  contradictedMutations?: string[];
}

export interface DirectorTrialOutcomes {
  trustFormationShare?: number;
  emotionalResonanceShare?: number;
  authenticityRejectionShare?: number;
  fatigueShare?: number;
  totalOutcomes?: number;
}

export interface CreativeDirectorInput {
  world?: DirectorWorldSignals | null;
  memoryImprint?: DirectorMemoryImprint | null;
  culturalMemory?: DirectorCulturalMemory | null;
  selfReflection?: DirectorSelfReflection | null;
  humanTruth?: DirectorHumanTruth | null;
  presence?: DirectorPresence | null;
  supervised?: DirectorSupervisedLearning | null;
  trialOutcomes?: DirectorTrialOutcomes | null;
}

// ─── output ───────────────────────────────────────────────────

export interface Direction {
  /** 0..10 — how strongly this direction appears historically aligned. */
  alignment: number;
  /** Plain-language observation (allowed-phrasing only). */
  observation: string;
  /** Reason codes — the signals that fed this direction. */
  reasonCodes: string[];
}

export interface CreativeDirections {
  narrativeDirections: Direction[];
  emotionalDirections: Direction[];
  pacingDirections: Direction[];
  realismDirections: Direction[];
  presenceDirections: Direction[];
  silenceDirections: Direction[];
  visualDirections: Direction[];
  restraintDirections: Direction[];
  documentaryDirections: Direction[];
  experimentationZones: Direction[];
  riskZones: Direction[];
}

export interface CreativeDirectorReading extends CreativeDirections {
  /** Most strongly aligned direction families. */
  dominantDirections: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Creative directions are observations. ' +
  'The operator remains the only authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function dir(alignment: number, observation: string, reasonCodes: string[]): Direction {
  return { alignment: r1(clamp10(alignment)), observation, reasonCodes };
}

// ─── main ─────────────────────────────────────────────────────

export function computeCreativeDirections(
  input: CreativeDirectorInput,
): CreativeDirectorReading {
  const w = input.world ?? {};
  const mi = input.memoryImprint ?? {};
  const cm = input.culturalMemory ?? {};
  const sr = input.selfReflection ?? {};
  const ht = input.humanTruth ?? {};
  const pr = input.presence ?? {};
  const sl = input.supervised ?? {};
  const to = input.trialOutcomes ?? {};

  const n = (v: number | undefined, d = 5): number => (v ?? d);

  // ── narrative directions ─────────────────────────────────
  const narrative: Direction[] = [];
  if (n(w.meaningSeeking) >= 6 || n(mi.scenePermanence) >= 6) {
    narrative.push(dir(
      avg([n(w.meaningSeeking), n(mi.scenePermanence)]),
      'meaning-seeking narrative currently appears historically aligned with observed window',
      [`meaning:${n(w.meaningSeeking)}`, `scenePermanence:${n(mi.scenePermanence)}`],
    ));
  }
  if (n(w.ritualHunger) >= 6) {
    narrative.push(dir(
      n(w.ritualHunger),
      'ritual-anchored narrative currently appears historically aligned with observed ritual hunger',
      [`ritualHunger:${n(w.ritualHunger)}`],
    ));
  }
  if (n(w.nostalgiaPressure) >= 6) {
    narrative.push(dir(
      n(w.nostalgiaPressure),
      'nostalgia-anchored narrative observed alongside elevated nostalgia pressure',
      [`nostalgia:${n(w.nostalgiaPressure)}`],
    ));
  }
  if (n(w.ironyDensity) >= 6 && n(w.optimismDrift) <= -2) {
    narrative.push(dir(
      n(w.ironyDensity),
      'ironic narrative appears prevalent in the observed window — requires more evidence before exploration',
      [`irony:${n(w.ironyDensity)}`, `optimismDrift:${n(w.optimismDrift)}`],
    ));
  }

  // ── emotional directions ─────────────────────────────────
  const emotional: Direction[] = [];
  if (n(w.emotionalExhaustion) >= 6 || n(w.emotionalOverload) >= 6) {
    emotional.push(dir(
      avg([n(w.emotionalExhaustion), n(w.emotionalOverload)]),
      'emotionally restrained tones currently appear historically aligned — observed alongside exhaustion signals',
      [`exhaustion:${n(w.emotionalExhaustion)}`, `overload:${n(w.emotionalOverload)}`],
    ));
  }
  if (n(w.lonelinessSignals) >= 6) {
    emotional.push(dir(
      n(w.lonelinessSignals),
      'belonging-oriented emotional notes observed alongside loneliness signals',
      [`loneliness:${n(w.lonelinessSignals)}`],
    ));
  }
  if (n(mi.emotionalAftertaste) >= 6) {
    emotional.push(dir(
      n(mi.emotionalAftertaste),
      'emotional aftertaste observed alongside the outputs — may carry memory weight',
      [`aftertaste:${n(mi.emotionalAftertaste)}`],
    ));
  }

  // ── pacing directions ────────────────────────────────────
  const pacing: Direction[] = [];
  if (n(w.attentionFragmentation) >= 6) {
    pacing.push(dir(
      n(w.attentionFragmentation),
      'slow pacing currently appears more historically aligned than burst cadence',
      [`fragmentation:${n(w.attentionFragmentation)}`],
    ));
  }
  if (n(w.simplicityCraving) >= 6) {
    pacing.push(dir(
      n(w.simplicityCraving),
      'simple pacing observed alongside elevated simplicity craving',
      [`simplicity:${n(w.simplicityCraving)}`],
    ));
  }

  // ── realism directions ───────────────────────────────────
  const realism: Direction[] = [];
  if (n(w.realismDemand) >= 6 || n(w.authenticityDemand) >= 6) {
    realism.push(dir(
      avg([n(w.realismDemand), n(w.authenticityDemand)]),
      'realism direction currently appears historically aligned — observed alongside realism and authenticity demand',
      [`realismDemand:${n(w.realismDemand)}`, `authenticityDemand:${n(w.authenticityDemand)}`],
    ));
  }
  if (n(sr.syntheticDrift) >= 6) {
    realism.push(dir(
      n(sr.syntheticDrift),
      'documentary realism appears more historically aligned than synthetic-polished framing',
      [`syntheticDrift:${n(sr.syntheticDrift)}`],
    ));
  }

  // ── presence directions ──────────────────────────────────
  const presence: Direction[] = [];
  if (n(pr.presenceScore) >= 6 || n(pr.authenticityWeight) >= 6) {
    presence.push(dir(
      avg([n(pr.presenceScore), n(pr.authenticityWeight)]),
      'human presence currently appears historically aligned with engagement signatures',
      [`presence:${n(pr.presenceScore)}`, `authenticity:${n(pr.authenticityWeight)}`],
    ));
  }
  if (n(pr.imperfectionSignature) >= 6) {
    presence.push(dir(
      n(pr.imperfectionSignature),
      'imperfection signature observed alongside the outputs',
      [`imperfection:${n(pr.imperfectionSignature)}`],
    ));
  }

  // ── silence directions ───────────────────────────────────
  const silence: Direction[] = [];
  if (n(pr.stillnessWeight) >= 5 || n(w.simplicityCraving) >= 6) {
    silence.push(dir(
      Math.max(n(pr.stillnessWeight), n(w.simplicityCraving)),
      'silence weight currently appears historically aligned — some moments may carry memory weight because they are not explained',
      [`stillness:${n(pr.stillnessWeight)}`, `simplicity:${n(w.simplicityCraving)}`],
    ));
  }

  // ── visual directions ────────────────────────────────────
  const visual: Direction[] = [];
  if (n(sr.aestheticExhaustion) >= 6) {
    visual.push(dir(
      n(sr.aestheticExhaustion),
      'visual restraint currently appears more historically aligned than aesthetic escalation',
      [`aestheticExhaustion:${n(sr.aestheticExhaustion)}`],
    ));
  }
  if (n(w.symbolicFatigue) >= 6) {
    visual.push(dir(
      n(w.symbolicFatigue),
      'low-symbol visual framing observed alongside elevated symbolic fatigue',
      [`symbolicFatigue:${n(w.symbolicFatigue)}`],
    ));
  }

  // ── restraint directions ─────────────────────────────────
  const restraint: Direction[] = [];
  if (n(sr.manipulationCreep) >= 5 || n(w.trustFragility) >= 6) {
    restraint.push(dir(
      Math.max(n(sr.manipulationCreep), n(w.trustFragility)),
      'restraint currently appears historically aligned — observed alongside trust fragility and elevated CTA / persuasion pressure',
      [`manipulationCreep:${n(sr.manipulationCreep)}`, `trustFragility:${n(w.trustFragility)}`],
    ));
  }
  if (n(ht.dignityIntegrity) >= 6) {
    restraint.push(dir(
      n(ht.dignityIntegrity),
      'dignity-preserved restraint observed alongside the outputs',
      [`dignityIntegrity:${n(ht.dignityIntegrity)}`],
    ));
  }

  // ── documentary directions ───────────────────────────────
  const documentary: Direction[] = [];
  if (n(w.authenticityDemand) >= 6 && n(w.stimulationSaturation) >= 5) {
    documentary.push(dir(
      avg([n(w.authenticityDemand), n(w.stimulationSaturation)]),
      'documentary restraint appears more historically aligned than symbolic escalation',
      [`authenticity:${n(w.authenticityDemand)}`, `stimulation:${n(w.stimulationSaturation)}`],
    ));
  }
  if (n(to.trustFormationShare) >= 0.3) {
    documentary.push(dir(
      n(to.trustFormationShare) * 10,
      'documentary-leaning frames historically aligned with trust formation in observed outcomes',
      [`trustFormationShare:${n(to.trustFormationShare)}`],
    ));
  }

  // ── experimentation zones ────────────────────────────────
  const experimentation: Direction[] = [];
  const alignedSet = sl.alignedMutations ?? [];
  for (const mut of alignedSet.slice(0, 4)) {
    experimentation.push(dir(
      6,
      `${mut} mutation historically aligned in observed window — requires more evidence`,
      [`alignedMutation:${mut}`],
    ));
  }

  // ── risk zones ───────────────────────────────────────────
  const risk: Direction[] = [];
  if (n(sr.aestheticExhaustion) >= 6) {
    risk.push(dir(
      n(sr.aestheticExhaustion),
      'aesthetic exhaustion observed alongside the outputs — exploration of more of the same may carry memory risk',
      [`aestheticExhaustion:${n(sr.aestheticExhaustion)}`],
    ));
  }
  if (n(sr.manipulationCreep) >= 5) {
    risk.push(dir(
      n(sr.manipulationCreep),
      'elevated CTA / persuasion pressure observed alongside the outputs — dignity preservation requires more evidence',
      [`manipulationCreep:${n(sr.manipulationCreep)}`],
    ));
  }
  if (n(mi.memoryRisk) >= 6) {
    risk.push(dir(
      n(mi.memoryRisk),
      'memory risk appears elevated — observed alongside burst cadence and persuasion',
      [`memoryRisk:${n(mi.memoryRisk)}`],
    ));
  }
  for (const mut of (sl.contradictedMutations ?? []).slice(0, 3)) {
    risk.push(dir(
      6,
      `${mut} mutation historically contradicted in observed outcomes`,
      [`contradictedMutation:${mut}`],
    ));
  }

  // ── dominant directions ──────────────────────────────────
  const groups: Array<[string, Direction[]]> = [
    ['narrativeDirections', narrative],
    ['emotionalDirections', emotional],
    ['pacingDirections', pacing],
    ['realismDirections', realism],
    ['presenceDirections', presence],
    ['silenceDirections', silence],
    ['visualDirections', visual],
    ['restraintDirections', restraint],
    ['documentaryDirections', documentary],
  ];
  const groupAlignment = groups.map(([name, ds]) =>
    [name, ds.length === 0 ? 0 : avg(ds.map((d) => d.alignment))] as const,
  );
  const dominantDirections = groupAlignment
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  if (dominantDirections.length === 0) {
    notes.push('creative directions appear muted in this window — requires more evidence');
  } else {
    notes.push(`${dominantDirections.join(', ')} currently appear historically aligned`);
  }
  if (risk.length > 0) {
    notes.push('one or more risk zones observed alongside the outputs');
  }
  if (n(cm.saturation) >= 6) {
    notes.push('cultural saturation observed alongside the outputs — observation only, no recommendation');
  }

  return {
    narrativeDirections: narrative,
    emotionalDirections: emotional,
    pacingDirections: pacing,
    realismDirections: realism,
    presenceDirections: presence,
    silenceDirections: silence,
    visualDirections: visual,
    restraintDirections: restraint,
    documentaryDirections: documentary,
    experimentationZones: experimentation,
    riskZones: risk,
    dominantDirections,
    notes,
    reasonCodes: [
      `dominant:${dominantDirections.join('|')}`,
      ...groupAlignment.map(([k, v]) => `${k}:${r1(v)}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
