/**
 * STORY ARCHITECTURE ENGINE (pure, observational)
 *
 * Proposes candidate STORY STRUCTURES — not scripts, not ads, not
 * generation. Only structural archetypes drawn from observed
 * world / imprint / presence signals.
 *
 * Story arcs:
 *   returnHome, passingTime, parentChild, exhaustion, resilience,
 *   quietVictory, ritual, waiting, memory, becoming.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never selects a candidate
 *   - never names a "winning" arc
 *   - allowed phrasing: "currently appear historically aligned",
 *     "observed alongside", "historically associated",
 *     "may carry memory weight", "requires more evidence"
 *   - forbidden: generate, publish, execute, run, launch, winner,
 *     best, recommended, selected, chosen, optimize, will, predict
 *
 * The operator remains the only authority.
 */

// ─── loose structural subsets ────────────────────────────────

export interface StoryArchInputWorld {
  ritualHunger?: number;
  meaningSeeking?: number;
  nostalgiaPressure?: number;
  lonelinessSignals?: number;
  emotionalExhaustion?: number;
  optimismDrift?: number;
  simplicityCraving?: number;
  authenticityDemand?: number;
  realismDemand?: number;
}

export interface StoryArchInputImprint {
  imprintStrength?: number;
  scenePermanence?: number;
  identityAttachment?: number;
  /** Per-archetype mythicWeight 0..10. */
  mythicWeights?: Record<string, number>;
  /** Per-ritual persistence 0..10. */
  ritualPersistence?: Record<string, number>;
}

export interface StoryArchInputPresence {
  presenceScore?: number;
  stillnessWeight?: number;
  authenticityWeight?: number;
}

export interface StoryArchitectureInput {
  world?: StoryArchInputWorld | null;
  imprint?: StoryArchInputImprint | null;
  presence?: StoryArchInputPresence | null;
}

// ─── output ───────────────────────────────────────────────────

export type StoryArcKey =
  | 'returnHome' | 'passingTime' | 'parentChild' | 'exhaustion'
  | 'resilience' | 'quietVictory' | 'ritual' | 'waiting' | 'memory'
  | 'becoming';

export interface StoryArc {
  key: StoryArcKey;
  alignment: number;
  observation: string;
  reasonCodes: string[];
}

export interface EmotionalCurve {
  /** Coarse curve label. */
  curve: 'rising-gentle' | 'sustained-low' | 'sustained-mid' | 'arc-return' | 'falling-soft' | 'circular';
  alignment: number;
  observation: string;
}

export interface SilenceMoment {
  moment: string;
  alignment: number;
}

export interface MemoryMoment {
  moment: string;
  alignment: number;
}

export interface MythicMoment {
  archetype: string;
  alignment: number;
}

export interface RealismAnchor {
  anchor: string;
  alignment: number;
}

export interface StoryArchitectureReading {
  storyArcs: StoryArc[];
  emotionalCurves: EmotionalCurve[];
  silenceMoments: SilenceMoment[];
  memoryMoments: MemoryMoment[];
  mythicMoments: MythicMoment[];
  realismAnchors: RealismAnchor[];
  dominantArcs: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Story structures are observations. ' +
  'The operator remains the only authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function n(v: number | undefined, d = 5): number { return v ?? d; }

function arc(
  key: StoryArcKey, alignment: number, observation: string, reasonCodes: string[],
): StoryArc {
  return { key, alignment: r1(clamp10(alignment)), observation, reasonCodes };
}

// ─── main ─────────────────────────────────────────────────────

export function computeStoryArchitecture(
  input: StoryArchitectureInput,
): StoryArchitectureReading {
  const w = input.world ?? {};
  const mi = input.imprint ?? {};
  const pr = input.presence ?? {};
  const myth = mi.mythicWeights ?? {};
  const ritual = mi.ritualPersistence ?? {};

  // ── story arcs ────────────────────────────────────────────
  const arcs: StoryArc[] = [];

  arcs.push(arc('returnHome',
    Math.max(n(myth.return, 0), n(myth.home, 0), n(w.lonelinessSignals) * 0.4),
    'return-home arc currently appears historically aligned with home / return archetypes',
    [`return:${n(myth.return, 0)}`, `home:${n(myth.home, 0)}`, `loneliness:${n(w.lonelinessSignals)}`],
  ));

  arcs.push(arc('passingTime',
    Math.max(n(myth.passingTime, 0), n(w.nostalgiaPressure) * 0.6),
    'passing-time arc observed alongside nostalgia pressure and passing-time archetype',
    [`passingTime:${n(myth.passingTime, 0)}`, `nostalgia:${n(w.nostalgiaPressure)}`],
  ));

  arcs.push(arc('parentChild',
    Math.max(n(myth.care, 0), n(myth.protection, 0), n(ritual.parentChild, 0)),
    'parent-child arc historically associated with care and protection archetypes',
    [`care:${n(myth.care, 0)}`, `protection:${n(myth.protection, 0)}`],
  ));

  arcs.push(arc('exhaustion',
    Math.max(n(w.emotionalExhaustion), n(ritual.workRecovery, 0)),
    'exhaustion arc observed alongside elevated emotional exhaustion',
    [`exhaustion:${n(w.emotionalExhaustion)}`, `workRecovery:${n(ritual.workRecovery, 0)}`],
  ));

  arcs.push(arc('resilience',
    Math.max(n(myth.endurance, 0), Math.max(0, n(w.optimismDrift)) + 5),
    'resilience arc observed alongside endurance archetype',
    [`endurance:${n(myth.endurance, 0)}`, `optimismDrift:${n(w.optimismDrift)}`],
  ));

  arcs.push(arc('quietVictory',
    Math.max(n(pr.stillnessWeight), n(pr.presenceScore)) * 0.7 +
    Math.max(0, n(w.optimismDrift)) * 0.3,
    'quiet-victory arc historically associated with stillness presence and soft optimism',
    [`stillness:${n(pr.stillnessWeight)}`, `presence:${n(pr.presenceScore)}`],
  ));

  // Ritual arc: pick the strongest ritual persistence signal.
  const ritualMax = Object.values(ritual).reduce((a, b) => Math.max(a, b), 0);
  arcs.push(arc('ritual',
    Math.max(n(w.ritualHunger), ritualMax),
    'ritual arc historically aligned with elevated ritual hunger and persistence',
    [`ritualHunger:${n(w.ritualHunger)}`, `ritualMax:${ritualMax}`],
  ));

  arcs.push(arc('waiting',
    Math.max(n(myth.waiting, 0), n(w.lonelinessSignals) * 0.5),
    'waiting arc observed alongside waiting archetype and loneliness signals',
    [`waiting:${n(myth.waiting, 0)}`, `loneliness:${n(w.lonelinessSignals)}`],
  ));

  arcs.push(arc('memory',
    Math.max(n(myth.memory, 0), n(mi.imprintStrength)),
    'memory arc historically aligned with memory archetype and imprint strength',
    [`memory:${n(myth.memory, 0)}`, `imprintStrength:${n(mi.imprintStrength)}`],
  ));

  arcs.push(arc('becoming',
    Math.max(n(myth.becoming, 0), n(w.meaningSeeking) * 0.7),
    'becoming arc historically associated with meaning-seeking signals',
    [`becoming:${n(myth.becoming, 0)}`, `meaning:${n(w.meaningSeeking)}`],
  ));

  // ── emotional curves ──────────────────────────────────────
  const emotionalCurves: EmotionalCurve[] = [
    {
      curve: 'sustained-low',
      alignment: r1(clamp10(Math.max(n(w.emotionalExhaustion), n(w.simplicityCraving)))),
      observation: 'sustained-low emotional curve currently appears historically aligned with exhaustion / simplicity craving',
    },
    {
      curve: 'rising-gentle',
      alignment: r1(clamp10(Math.max(0, n(w.optimismDrift)) + n(pr.stillnessWeight) * 0.5)),
      observation: 'rising-gentle curve observed alongside soft optimism drift',
    },
    {
      curve: 'arc-return',
      alignment: r1(clamp10(Math.max(n(myth.return, 0), n(myth.home, 0)))),
      observation: 'arc-return emotional curve historically associated with return / home archetypes',
    },
    {
      curve: 'falling-soft',
      alignment: r1(clamp10(Math.max(n(myth.loss, 0), n(myth.memory, 0)))),
      observation: 'falling-soft emotional curve historically associated with loss / memory archetypes',
    },
    {
      curve: 'circular',
      alignment: r1(clamp10(n(w.ritualHunger))),
      observation: 'circular emotional curve historically aligned with ritual hunger',
    },
    {
      curve: 'sustained-mid',
      alignment: r1(clamp10(n(pr.authenticityWeight))),
      observation: 'sustained-mid emotional curve observed alongside authenticity weight',
    },
  ];

  // ── silence moments ───────────────────────────────────────
  const silenceMoments: SilenceMoment[] = [
    { moment: 'breath before answer', alignment: r1(clamp10(n(pr.stillnessWeight))) },
    { moment: 'kitchen pause', alignment: r1(clamp10(n(ritual.coffee, 0) + n(ritual.morning, 0)) / 2) },
    { moment: 'unspoken reply', alignment: r1(clamp10(n(pr.stillnessWeight) * 0.7)) },
    { moment: 'window light', alignment: r1(clamp10(n(myth.waiting, 0))) },
    { moment: 'empty hallway', alignment: r1(clamp10(n(myth.loss, 0) * 0.7)) },
  ];

  // ── memory moments ────────────────────────────────────────
  const memoryMoments: MemoryMoment[] = [
    { moment: 'kitchen table at dawn', alignment: r1(clamp10(n(ritual.morning, 0) + n(ritual.food, 0)) / 2) },
    { moment: 'parent watching child', alignment: r1(clamp10(n(ritual.parentChild, 0) + n(myth.care, 0)) / 2) },
    { moment: 'wave from the doorway', alignment: r1(clamp10(n(myth.return, 0))) },
    { moment: 'last cup of the night', alignment: r1(clamp10(n(ritual.night, 0))) },
    { moment: 'hand on shoulder', alignment: r1(clamp10(n(myth.care, 0))) },
  ];

  // ── mythic moments ────────────────────────────────────────
  const mythicMoments: MythicMoment[] = Object.entries(myth)
    .map(([archetype, v]) => ({ archetype, alignment: r1(clamp10(v as number)) }))
    .sort((a, b) => b.alignment - a.alignment || a.archetype.localeCompare(b.archetype));

  // ── realism anchors ───────────────────────────────────────
  const realismAnchors: RealismAnchor[] = [
    { anchor: 'documentary handheld', alignment: r1(clamp10(n(w.realismDemand) * 0.8 + n(w.authenticityDemand) * 0.2)) },
    { anchor: 'unedited dialogue', alignment: r1(clamp10(n(pr.authenticityWeight))) },
    { anchor: 'ambient room sound', alignment: r1(clamp10(n(pr.stillnessWeight))) },
    { anchor: 'natural light', alignment: r1(clamp10(n(w.realismDemand))) },
    { anchor: 'real hands / real hours', alignment: r1(clamp10(n(w.authenticityDemand))) },
  ];

  // ── dominant arcs ─────────────────────────────────────────
  const dominantArcs = arcs.slice()
    .sort((a, b) => b.alignment - a.alignment || a.key.localeCompare(b.key))
    .slice(0, 3)
    .map((a) => a.key);

  const notes: string[] = [];
  if (dominantArcs.length === 0) {
    notes.push('story arcs appear muted in this window — requires more evidence');
  } else {
    notes.push(`${dominantArcs.join(', ')} arcs currently appear historically aligned`);
  }

  return {
    storyArcs: arcs,
    emotionalCurves,
    silenceMoments,
    memoryMoments,
    mythicMoments,
    realismAnchors,
    dominantArcs,
    notes,
    reasonCodes: [
      `dominantArcs:${dominantArcs.join('|')}`,
      ...arcs.map((a) => `${a.key}:${a.alignment}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
