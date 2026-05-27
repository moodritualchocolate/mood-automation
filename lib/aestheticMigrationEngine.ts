/**
 * AESTHETIC MIGRATION ENGINE (pure, observational)
 *
 * Observes how visual / emotional aesthetics migrate across the
 * observed window. Tracks cyclic motion: cinematic polish rise/fall,
 * documentary realism cycles, AI-looking saturation, minimalism
 * fatigue, hyper-editing exhaustion, stillness resurgence,
 * imperfection preference, retro/nostalgia migration, and emotional
 * rawness demand.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never auto-applies a style
 *   - never names a "winning" aesthetic
 *   - allowed phrasing: "observed alongside", "historically associated",
 *     "appears to be rising", "appears to be receding"
 *   - forbidden: prediction, persuasion steering, behavioral targeting,
 *     optimization, manipulation, political segmentation
 *
 * The engine understands: aesthetics move in cycles.
 */

// ─── loose structural subsets ────────────────────────────────

export interface AestheticVisualSubset {
  fingerprints?: Array<{
    at?: number;
    polishLevel?: number;       // 0..10 — cinematic polish
    realismLevel?: number;      // 0..10 — documentary realism
    aiLookSaturation?: number;  // 0..10 — synthetic/AI-look intensity
    minimalismLevel?: number;   // 0..10
    editingDensity?: number;    // 0..10 — cuts per minute proxy
    stillnessShare?: number;    // 0..1
    imperfectionLevel?: number; // 0..10 — grain / handheld / artifacts
    retroSignature?: number;    // 0..10 — analog / period reference
  }>;
}

export interface AestheticOutcomeSubset {
  outcomes?: Array<{
    at?: number;
    visualStyle?: string;
    emotionalSignature?: string;
    downstreamOutcome?: string;
    metrics?: {
      retention?: number; saves?: number; shares?: number;
      bounceRate?: number; rewatches?: number;
    };
  }>;
}

export interface AestheticMigrationInput {
  visualDNA?: AestheticVisualSubset | null;
  outcomes?: AestheticOutcomeSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface AestheticDimension {
  /** 0..10 — current intensity. */
  level: number;
  /** -10..+10 — recent migration direction. */
  migrationDirection: number;
  /** plain-language note. */
  note: string;
}

export interface AestheticMigrationReading {
  windowSize: number;
  cinematicPolish: AestheticDimension;
  documentaryRealism: AestheticDimension;
  aiLookSaturation: AestheticDimension;
  minimalismFatigue: AestheticDimension;
  hyperEditingExhaustion: AestheticDimension;
  stillnessResurgence: AestheticDimension;
  imperfectionPreference: AestheticDimension;
  retroNostalgiaMigration: AestheticDimension;
  emotionalRawnessDemand: AestheticDimension;
  /** Top three migrations by absolute direction magnitude. */
  dominantMigrations: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — aesthetics move in cycles. ' +
  'The system observes those cycles and never selects a style for the operator.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function signedClamp10(n: number): number { return Math.max(-10, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Fp = NonNullable<AestheticVisualSubset['fingerprints']>[number];

/** Split fingerprints into "earlier half" + "later half" deterministically. */
function halves<T>(xs: T[]): { early: T[]; late: T[] } {
  if (xs.length < 2) return { early: xs, late: xs };
  const mid = Math.floor(xs.length / 2);
  return { early: xs.slice(0, mid), late: xs.slice(mid) };
}

function migration(early: number[], late: number[]): number {
  return signedClamp10((avg(late) - avg(early)) * 2);
}

function describeDirection(dir: number, label: string): string {
  if (dir >= 1.5) return `${label} appears to be rising`;
  if (dir <= -1.5) return `${label} appears to be receding`;
  return `${label} appears stable in this window`;
}

type Outcome = NonNullable<AestheticOutcomeSubset['outcomes']>[number];

function matches(o: Outcome, re: RegExp): boolean {
  const hay = ((o.visualStyle ?? '') + ' ' + (o.emotionalSignature ?? '')).toLowerCase();
  return re.test(hay);
}

function shareWith(records: Outcome[], predicate: (o: Outcome) => boolean): number {
  if (records.length === 0) return 0;
  return records.filter(predicate).length / records.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeAestheticMigration(
  input: AestheticMigrationInput,
): AestheticMigrationReading {
  const fps: Fp[] = (input.visualDNA?.fingerprints ?? []).slice();
  // Sort by `at` if available so migration math is deterministic.
  fps.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const outcomes = input.outcomes?.outcomes ?? [];
  const { early, late } = halves(fps);

  // ── cinematic polish ─────────────────────────────────────
  const polishE = early.map((f) => f.polishLevel ?? 5);
  const polishL = late.map((f) => f.polishLevel ?? 5);
  const cinematicPolish: AestheticDimension = {
    level: r1(clamp10(avg(polishL))),
    migrationDirection: r1(migration(polishE, polishL)),
    note: '',
  };
  cinematicPolish.note = describeDirection(cinematicPolish.migrationDirection, 'cinematic polish');

  // ── documentary realism ──────────────────────────────────
  const realE = early.map((f) => f.realismLevel ?? 5);
  const realL = late.map((f) => f.realismLevel ?? 5);
  const documentaryRealism: AestheticDimension = {
    level: r1(clamp10(avg(realL))),
    migrationDirection: r1(migration(realE, realL)),
    note: '',
  };
  documentaryRealism.note = describeDirection(documentaryRealism.migrationDirection, 'documentary realism');

  // ── AI-looking saturation ────────────────────────────────
  const aiE = early.map((f) => f.aiLookSaturation ?? 0);
  const aiL = late.map((f) => f.aiLookSaturation ?? 0);
  const aiLookSaturation: AestheticDimension = {
    level: r1(clamp10(avg(aiL))),
    migrationDirection: r1(migration(aiE, aiL)),
    note: '',
  };
  aiLookSaturation.note = describeDirection(aiLookSaturation.migrationDirection, 'AI-look saturation');

  // ── minimalism fatigue ───────────────────────────────────
  // Minimalism fatigue = high minimalism level + falling engagement on minimal pieces.
  const minE = early.map((f) => f.minimalismLevel ?? 0);
  const minL = late.map((f) => f.minimalismLevel ?? 0);
  const minLevel = clamp10(avg(minL));
  const minimalismFatigue: AestheticDimension = {
    level: r1(minLevel),
    // Fatigue rises as minimalism stays elevated; we treat the *rise* of minimalism
    // as fatigue accumulating, and recession as relief.
    migrationDirection: r1(migration(minE, minL)),
    note: '',
  };
  minimalismFatigue.note = describeDirection(minimalismFatigue.migrationDirection, 'minimalism fatigue signature');

  // ── hyper-editing exhaustion ─────────────────────────────
  const editE = early.map((f) => f.editingDensity ?? 5);
  const editL = late.map((f) => f.editingDensity ?? 5);
  const hyperEditingExhaustion: AestheticDimension = {
    level: r1(clamp10(avg(editL))),
    migrationDirection: r1(migration(editE, editL)),
    note: '',
  };
  hyperEditingExhaustion.note = describeDirection(hyperEditingExhaustion.migrationDirection, 'hyper-editing density');

  // ── stillness resurgence ─────────────────────────────────
  const stillE = early.map((f) => (f.stillnessShare ?? 0) * 10);
  const stillL = late.map((f) => (f.stillnessShare ?? 0) * 10);
  const stillnessResurgence: AestheticDimension = {
    level: r1(clamp10(avg(stillL))),
    migrationDirection: r1(migration(stillE, stillL)),
    note: '',
  };
  stillnessResurgence.note = describeDirection(stillnessResurgence.migrationDirection, 'stillness presence');

  // ── imperfection preference ──────────────────────────────
  const impE = early.map((f) => f.imperfectionLevel ?? 0);
  const impL = late.map((f) => f.imperfectionLevel ?? 0);
  const imperfectionPreference: AestheticDimension = {
    level: r1(clamp10(avg(impL))),
    migrationDirection: r1(migration(impE, impL)),
    note: '',
  };
  imperfectionPreference.note = describeDirection(imperfectionPreference.migrationDirection, 'imperfection preference');

  // ── retro / nostalgia migration ──────────────────────────
  const retE = early.map((f) => f.retroSignature ?? 0);
  const retL = late.map((f) => f.retroSignature ?? 0);
  // Outcome-side nostalgia confirmation.
  const nostalgiaShare = shareWith(outcomes, (o) =>
    matches(o, /nostalg|childhood|memory|retro|analog|grain|vintage|old/),
  );
  const retroNostalgiaMigration: AestheticDimension = {
    level: r1(clamp10(avg(retL) * 0.6 + nostalgiaShare * 10 * 0.4)),
    migrationDirection: r1(migration(retE, retL)),
    note: '',
  };
  retroNostalgiaMigration.note = describeDirection(retroNostalgiaMigration.migrationDirection, 'retro / nostalgia signature');

  // ── emotional rawness demand ─────────────────────────────
  // Outcome-side: shares + saves on raw / documentary visual outcomes.
  const rawOutcomes = outcomes.filter((o) => matches(o, /raw|unfilter|honest|documentary|handheld|imperfect|tear|tremble/));
  const rawEngagement = rawOutcomes.length === 0 ? 0 :
    avg(rawOutcomes.map((o) => (o.metrics?.shares ?? 0) + (o.metrics?.saves ?? 0)));
  const rawnessLevel = clamp10(
    rawEngagement * 0.6 +
    (imperfectionPreference.level + documentaryRealism.level) * 0.2,
  );
  const emotionalRawnessDemand: AestheticDimension = {
    level: r1(rawnessLevel),
    migrationDirection: r1(signedClamp10(
      (imperfectionPreference.migrationDirection + documentaryRealism.migrationDirection) / 2,
    )),
    note: '',
  };
  emotionalRawnessDemand.note = describeDirection(emotionalRawnessDemand.migrationDirection, 'emotional rawness demand');

  // ── dominant migrations ──────────────────────────────────
  const dims: Array<[string, number]> = [
    ['cinematicPolish', cinematicPolish.migrationDirection],
    ['documentaryRealism', documentaryRealism.migrationDirection],
    ['aiLookSaturation', aiLookSaturation.migrationDirection],
    ['minimalismFatigue', minimalismFatigue.migrationDirection],
    ['hyperEditingExhaustion', hyperEditingExhaustion.migrationDirection],
    ['stillnessResurgence', stillnessResurgence.migrationDirection],
    ['imperfectionPreference', imperfectionPreference.migrationDirection],
    ['retroNostalgiaMigration', retroNostalgiaMigration.migrationDirection],
    ['emotionalRawnessDemand', emotionalRawnessDemand.migrationDirection],
  ];
  const dominantMigrations = dims
    .map(([k, v]) => [k, Math.abs(v)] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  // ── notes ────────────────────────────────────────────────
  const notes: string[] = [];
  if (Math.abs(cinematicPolish.migrationDirection) >= 2) notes.push(cinematicPolish.note);
  if (Math.abs(documentaryRealism.migrationDirection) >= 2) notes.push(documentaryRealism.note);
  if (aiLookSaturation.level >= 6) notes.push('AI-look saturation appears elevated in observed outcomes');
  if (stillnessResurgence.migrationDirection >= 2) notes.push('stillness presence appears to be rising — historically associated with attention recovery');
  if (imperfectionPreference.migrationDirection >= 2) notes.push('imperfection preference appears to be rising — historically associated with authenticity demand');
  if (emotionalRawnessDemand.level >= 6) notes.push('emotional rawness demand observed alongside engagement');
  if (notes.length === 0) notes.push('aesthetic signatures appear stable in this window');

  return {
    windowSize: fps.length,
    cinematicPolish,
    documentaryRealism,
    aiLookSaturation,
    minimalismFatigue,
    hyperEditingExhaustion,
    stillnessResurgence,
    imperfectionPreference,
    retroNostalgiaMigration,
    emotionalRawnessDemand,
    dominantMigrations,
    notes,
    reasonCodes: [
      `fingerprints:${fps.length}`,
      `outcomes:${outcomes.length}`,
      `polish:${cinematicPolish.level}->${cinematicPolish.migrationDirection}`,
      `realism:${documentaryRealism.level}->${documentaryRealism.migrationDirection}`,
      `ai:${aiLookSaturation.level}->${aiLookSaturation.migrationDirection}`,
      `still:${stillnessResurgence.level}->${stillnessResurgence.migrationDirection}`,
      `imperfection:${imperfectionPreference.level}->${imperfectionPreference.migrationDirection}`,
      `retro:${retroNostalgiaMigration.level}->${retroNostalgiaMigration.migrationDirection}`,
      `rawness:${emotionalRawnessDemand.level}->${emotionalRawnessDemand.migrationDirection}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
