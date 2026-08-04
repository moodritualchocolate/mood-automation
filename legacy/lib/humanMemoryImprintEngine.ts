/**
 * HUMAN MEMORY IMPRINT ENGINE (pure, observational)
 *
 * Observes signals that may create long-term emotional memory.
 * This is NOT virality. This is emotional remembrance.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never optimizes for virality
 *   - never recommends content
 *   - allowed phrasing only: "historically associated",
 *     "may carry memory weight", "observed alongside",
 *     "emotional permanence signal", "requires more evidence",
 *     "remembrance-oriented"
 *   - forbidden: prediction, viral optimization, trauma exploitation,
 *     emotional manipulation phrasing
 *
 * The system studies memory. It does not manufacture wounds.
 */

// ─── loose structural subsets ────────────────────────────────

export interface ImprintOutcomeSubset {
  outcomes?: Array<{
    at?: number;
    emotionalSignature?: string;
    narrativeSignature?: string;
    visualStyle?: string;
    cadenceState?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    downstreamOutcome?: string;
    metrics?: {
      retention?: number; saves?: number; rewatches?: number;
      shares?: number; comments?: number;
    };
  }>;
}

export interface ImprintVisualSubset {
  fingerprints?: Array<{
    silenceDensity?: string;
    realismLevel?: number;
    polishLevel?: number;
    pacingIdentity?: string;
    motionCadence?: string;
  }>;
}

export interface ImprintNarrativeSubset {
  fingerprints?: Array<{
    silenceUsage?: string;
    narrationStyle?: string;
    humanRealism?: number;
    ctaPressure?: number;
    observationalDensity?: number;
    tensionCurve?: string;
    payoffTiming?: string;
  }>;
}

export interface HumanMemoryImprintInput {
  outcomes?: ImprintOutcomeSubset | null;
  visualDNA?: ImprintVisualSubset | null;
  narrativeDNA?: ImprintNarrativeSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface RememberedMomentSignals {
  emotionalSimplicity: number;
  humanStillness: number;
  silenceWeight: number;
  symbolicClarity: number;
  imperfectRealism: number;
  restrainedDialogue: number;
  visualTenderness: number;
  unresolvedEmotion: number;
  quotePotential: number;
  ritualFamiliarity: number;
  intergenerationalResonance: number;
  nostalgicTexture: number;
  ordinaryLifeSignificance: number;
  emotionalAftertaste: number;
  identityReflection: number;
  memoryDensity: number;
}

export interface HumanMemoryImprintReading {
  totalObservations: number;
  /** 0..10 — composite imprint strength. */
  imprintStrength: number;
  rememberedMomentSignals: RememberedMomentSignals;
  /** 0..10 — composite emotional aftertaste signature. */
  emotionalAftertaste: number;
  /** 0..10 — quote durability composite. */
  quoteDurability: number;
  /** 0..10 — scene permanence composite. */
  scenePermanence: number;
  /** 0..10 — identity attachment composite. */
  identityAttachment: number;
  /** 0..10 — risk signal that observed outputs may NOT carry memory. */
  memoryRisk: number;
  /** Top 3 elevated remembrance signals by magnitude. */
  dominantImprintSignals: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system studies emotional permanence. ' +
  'It studies memory; it does not manufacture wounds.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Out = NonNullable<ImprintOutcomeSubset['outcomes']>[number];

function matches(o: Out, re: RegExp): boolean {
  const hay = ((o.emotionalSignature ?? '') + ' ' +
               (o.narrativeSignature ?? '') + ' ' +
               (o.visualStyle ?? '')).toLowerCase();
  return re.test(hay);
}

function shareOf(records: Out[], predicate: (o: Out) => boolean): number {
  if (records.length === 0) return 0;
  return records.filter(predicate).length / records.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeHumanMemoryImprint(input: HumanMemoryImprintInput): HumanMemoryImprintReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const visualFps = input.visualDNA?.fingerprints ?? [];
  const narrativeFps = input.narrativeDNA?.fingerprints ?? [];

  // ── emotional simplicity ─────────────────────────────────
  // Low persuasion + low CTA + simple emotional signatures.
  const meanPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const meanCta = avg(narrativeFps.map((f) => f.ctaPressure ?? 5));
  const simpleEmoShare = shareOf(outcomes, (o) =>
    matches(o, /simple|quiet|still|plain|home|ordinary|kitchen|morning/),
  );
  const emotionalSimplicity = clamp10(
    (10 - Math.max(0, meanPersuasion - 5)) * 0.4 +
    (10 - Math.max(0, meanCta - 5)) * 0.3 +
    simpleEmoShare * 10 * 0.3,
  );

  // ── human stillness ──────────────────────────────────────
  // Flow cadence dominance + observational density.
  const flowShare = shareOf(outcomes, (o) => o.cadenceState === 'flow');
  const meanObs = avg(narrativeFps.map((f) => f.observationalDensity ?? 5));
  const humanStillness = clamp10(flowShare * 6 + meanObs * 0.4);

  // ── silence weight ───────────────────────────────────────
  const sparseSilenceShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => f.silenceUsage === 'sparse').length / narrativeFps.length;
  const visualSilenceShare = visualFps.length === 0 ? 0 :
    visualFps.filter((f) => f.silenceDensity === 'high' || f.silenceDensity === 'mid').length / visualFps.length;
  const silenceWeight = clamp10(sparseSilenceShare * 5 + visualSilenceShare * 5);

  // ── symbolic clarity ─────────────────────────────────────
  // Recurring archetypal signatures with low ironic noise.
  const archetypeShare = shareOf(outcomes, (o) =>
    matches(o, /home|return|loss|becom|protect|wait|care|endur|forgive|memory|bench|kitchen|chair|hand|shoulder/),
  );
  const ironyShare = shareOf(outcomes, (o) => matches(o, /iron|wry|cynic|smug|sarcastic/));
  const symbolicClarity = clamp10(archetypeShare * 10 - ironyShare * 4);

  // ── imperfect realism ────────────────────────────────────
  const meanVisualRealism = avg(visualFps.map((f) => f.realismLevel ?? 5));
  const meanPolish = avg(visualFps.map((f) => f.polishLevel ?? 5));
  const imperfectRealism = clamp10(
    meanVisualRealism * 0.6 + (10 - meanPolish) * 0.4,
  );

  // ── restrained dialogue ──────────────────────────────────
  const restrainedDialogue = clamp10(
    10 - Math.max(0, meanPersuasion - 5) * 0.7 -
    Math.max(0, meanCta - 5) * 0.3,
  );

  // ── visual tenderness ────────────────────────────────────
  const tendernessShare = shareOf(outcomes, (o) =>
    matches(o, /tender|gentle|soft|warm|intimate|close|whisper|hand|shoulder|child/),
  );
  const visualTenderness = clamp10(tendernessShare * 8 + meanVisualRealism * 0.2);

  // ── unresolved emotion ───────────────────────────────────
  // Tension curve that doesn't resolve + delayed/absent payoff timing.
  const unresolvedShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) =>
      f.tensionCurve === 'sustained' || f.tensionCurve === 'unresolved' ||
      f.payoffTiming === 'absent' || f.payoffTiming === 'late',
    ).length / narrativeFps.length;
  const unresolvedEmotion = clamp10(unresolvedShare * 8);

  // ── quote potential ──────────────────────────────────────
  // Outcomes with elevated comments + saves (people repeating the line).
  const meanComments = avg(outcomes.map((o) => Math.min(1, (o.metrics?.comments ?? 0) / 10)));
  const meanSaves = avg(outcomes.map((o) => Math.min(1, (o.metrics?.saves ?? 0) / 5)));
  const quoteOutcomesShare = shareOf(outcomes, (o) =>
    matches(o, /quote|line|said|asked|remember|told|wrote|whisper/),
  );
  const quotePotential = clamp10(
    meanComments * 4 + meanSaves * 3 + quoteOutcomesShare * 5,
  );

  // ── ritual familiarity ───────────────────────────────────
  const ritualShare = shareOf(outcomes, (o) =>
    matches(o, /ritual|morning|night|coffee|tea|bedtime|home|kitchen|seasonal|sunday/),
  );
  const ritualFamiliarity = clamp10(ritualShare * 10);

  // ── intergenerational resonance ──────────────────────────
  const generationalShare = shareOf(outcomes, (o) =>
    matches(o, /parent|child|grand|family|father|mother|son|daughter|generation|legacy/),
  );
  const intergenerationalResonance = clamp10(generationalShare * 10);

  // ── nostalgic texture ────────────────────────────────────
  const nostalgicShare = shareOf(outcomes, (o) =>
    matches(o, /nostalg|childhood|memory|old|past|years ago|when i was|then|back/),
  );
  const nostalgicTexture = clamp10(nostalgicShare * 10);

  // ── ordinary-life significance ───────────────────────────
  const ordinaryShare = shareOf(outcomes, (o) =>
    matches(o, /ordinary|every|small|daily|kitchen|bus|laundry|sidewalk|grocer|chair|bench/),
  );
  const ordinaryLifeSignificance = clamp10(ordinaryShare * 8 + simpleEmoShare * 2);

  // ── emotional aftertaste ─────────────────────────────────
  // Long retention + rewatches + saves with low persuasion = aftertaste.
  const meanRetention = avg(outcomes.map((o) => o.metrics?.retention ?? 0));
  const meanRewatch = avg(outcomes.map((o) => Math.min(1, (o.metrics?.rewatches ?? 0) / 3)));
  const aftertasteRaw = meanRetention * 6 + meanRewatch * 3 +
    (10 - Math.max(0, meanPersuasion - 5)) * 0.1;
  const emotionalAftertaste = clamp10(aftertasteRaw);

  // ── identity reflection ──────────────────────────────────
  const identityShare = shareOf(outcomes, (o) =>
    matches(o, /me too|i felt|i remember|i was|i am|reminds me|like me|i used to/),
  );
  const trustFormation = shareOf(outcomes, (o) => o.downstreamOutcome === 'trust-formation');
  const identityReflection = clamp10(identityShare * 8 + trustFormation * 3);

  // ── memory density ───────────────────────────────────────
  // Composite of imprint signals.
  const memoryDensity = clamp10(
    (emotionalSimplicity + humanStillness + silenceWeight +
     symbolicClarity + imperfectRealism + restrainedDialogue +
     visualTenderness + ritualFamiliarity + ordinaryLifeSignificance +
     emotionalAftertaste) / 10,
  );

  const signals: RememberedMomentSignals = {
    emotionalSimplicity:      r1(emotionalSimplicity),
    humanStillness:           r1(humanStillness),
    silenceWeight:            r1(silenceWeight),
    symbolicClarity:          r1(symbolicClarity),
    imperfectRealism:         r1(imperfectRealism),
    restrainedDialogue:       r1(restrainedDialogue),
    visualTenderness:         r1(visualTenderness),
    unresolvedEmotion:        r1(unresolvedEmotion),
    quotePotential:           r1(quotePotential),
    ritualFamiliarity:        r1(ritualFamiliarity),
    intergenerationalResonance: r1(intergenerationalResonance),
    nostalgicTexture:         r1(nostalgicTexture),
    ordinaryLifeSignificance: r1(ordinaryLifeSignificance),
    emotionalAftertaste:      r1(emotionalAftertaste),
    identityReflection:       r1(identityReflection),
    memoryDensity:            r1(memoryDensity),
  };

  // Composite imprint strength.
  const imprintStrength = r1(clamp10(
    signals.emotionalSimplicity * 0.08 +
    signals.humanStillness * 0.08 +
    signals.silenceWeight * 0.09 +
    signals.symbolicClarity * 0.07 +
    signals.imperfectRealism * 0.08 +
    signals.restrainedDialogue * 0.06 +
    signals.visualTenderness * 0.06 +
    signals.unresolvedEmotion * 0.05 +
    signals.ritualFamiliarity * 0.07 +
    signals.intergenerationalResonance * 0.05 +
    signals.nostalgicTexture * 0.04 +
    signals.ordinaryLifeSignificance * 0.06 +
    signals.emotionalAftertaste * 0.10 +
    signals.identityReflection * 0.06 +
    signals.memoryDensity * 0.05,
  ));

  // Scene permanence: composite of stillness + tenderness + ordinary life + symbolic.
  const scenePermanence = r1(clamp10(
    (humanStillness + visualTenderness + ordinaryLifeSignificance + symbolicClarity) / 4,
  ));

  // Identity attachment composite.
  const identityAttachment = r1(clamp10(
    (identityReflection + intergenerationalResonance + ritualFamiliarity) / 3,
  ));

  // Memory risk = absence signal (lots of stimulation + persuasion + no silence).
  const burstShare = shareOf(outcomes, (o) => o.cadenceState === 'burst');
  const memoryRisk = r1(clamp10(
    burstShare * 4 +
    Math.max(0, meanPersuasion - 5) * 0.6 +
    Math.max(0, meanCta - 5) * 0.4 +
    (10 - silenceWeight) * 0.2,
  ));

  // Dominant imprint signals — top 3 by magnitude.
  const dominantImprintSignals = Object.entries(signals)
    .map(([k, v]) => [k, v as number] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  if (imprintStrength >= 6) notes.push('imprint strength may carry memory weight in observed outputs');
  else if (imprintStrength <= 3) notes.push('imprint strength appears low — requires more evidence');
  if (signals.silenceWeight >= 6) notes.push('silence weight observed alongside the outputs — historically associated with remembrance-oriented moments');
  if (signals.imperfectRealism >= 6) notes.push('imperfect realism observed alongside the outputs');
  if (signals.ritualFamiliarity >= 6) notes.push('ritual familiarity observed alongside the outputs');
  if (signals.ordinaryLifeSignificance >= 6) notes.push('ordinary-life significance observed — historically associated with emotional permanence');
  if (memoryRisk >= 6) notes.push('memory risk appears elevated — burst cadence + persuasion may suppress remembrance');
  if (notes.length === 0) notes.push('imprint signals are balanced in the current window');

  return {
    totalObservations: outcomes.length + visualFps.length + narrativeFps.length,
    imprintStrength,
    rememberedMomentSignals: signals,
    emotionalAftertaste: signals.emotionalAftertaste,
    quoteDurability: signals.quotePotential,
    scenePermanence,
    identityAttachment,
    memoryRisk,
    dominantImprintSignals,
    notes,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `visualFps:${visualFps.length}`,
      `narrativeFps:${narrativeFps.length}`,
      `imprintStrength:${imprintStrength}`,
      `memoryRisk:${memoryRisk}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
