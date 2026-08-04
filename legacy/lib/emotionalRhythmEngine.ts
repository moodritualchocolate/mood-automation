/**
 * EMOTIONAL RHYTHM ENGINE (pure, observational)
 *
 * Understands emotional pacing. NOT persuasion. NOT hooks. NOT
 * attention hacking.
 *
 * The system must understand: sometimes less emotion creates more
 * emotion.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never names a "best" rhythm
 *   - never optimizes for engagement
 *   - allowed phrasing: "may carry emotional weight",
 *     "historically associated", "observed alongside",
 *     "requires more evidence", "exploratory rhythm structure",
 *     "operator review required"
 *   - forbidden: generate, publish, execute, launch, deploy, run,
 *     winner, best, recommended, selected, chosen, optimal,
 *     predict, will-rise/fall/happen/be/perform, auto-apply,
 *     optimize, viral, dopamine, outrage, manipulat
 */

// ─── loose structural subsets ────────────────────────────────

export interface RhythmInputSceneHint {
  sceneId?: string;
  sourceStoryName?: string;
  sceneType?: string;
  silenceAllocation?: string;
  emotionalWeight?: number;
  restraintLevel?: number;
}

export interface RhythmInputStoryHint {
  blueprintId?: string;
  storyName?: string;
  emotionalArc?: string;
  alignment?: number;
}

export interface RhythmInputWorld {
  emotionalExhaustion?: number;
  emotionalOverload?: number;
  stimulationSaturation?: number;
  anxietyClimate?: number;
  simplicityCraving?: number;
  attentionFragmentation?: number;
}

export interface RhythmInputPresence {
  stillnessWeight?: number;
  emotionalBreathing?: number;
  syntheticPressure?: number;
  signals?: Record<string, number>;
}

export interface RhythmInputImprint {
  imprintStrength?: number;
  scenePermanence?: number;
}

export interface EmotionalRhythmInput {
  scenes?: RhythmInputSceneHint[];
  stories?: RhythmInputStoryHint[];
  world?: RhythmInputWorld | null;
  presence?: RhythmInputPresence | null;
  imprint?: RhythmInputImprint | null;
}

// ─── output ───────────────────────────────────────────────────

export interface RhythmProfile {
  tension: number;
  release: number;
  breathingRoom: number;
  pause: number;
  silence: number;
  restraint: number;
  emotionalDensity: number;
  emotionalSpacing: number;
  anticipation: number;
  reflection: number;
}

export interface TensionPoint {
  moment: string;
  alignment: number;
  observation: string;
}

export interface ReleasePoint {
  moment: string;
  alignment: number;
  observation: string;
}

export interface BreathingMoment {
  moment: string;
  alignment: number;
  observation: string;
}

export interface RhythmSilenceMoment {
  moment: string;
  alignment: number;
  observation: string;
}

export type PacingProfile = 'slow-grounded' | 'measured-restrained' | 'observational-still' | 'energetic-restrained';
export type RestraintProfile = 'maximal-restraint' | 'measured-restraint' | 'limited-restraint';

export interface EmotionalRhythmReading {
  rhythmProfile: RhythmProfile;
  tensionMap: TensionPoint[];
  releaseMap: ReleasePoint[];
  breathingMoments: BreathingMoment[];
  silenceMoments: RhythmSilenceMoment[];
  emotionalDensity: number;
  pacingProfile: PacingProfile;
  restraintProfile: RestraintProfile;
  dominantRhythmSignals: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Emotional rhythm structures are exploratory observations only. ' +
  'The operator remains the creative authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function get(v: number | undefined, d = 0): number { return v ?? d; }
function getDef(v: number | undefined, d = 5): number { return v ?? d; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeEmotionalRhythm(input: EmotionalRhythmInput): EmotionalRhythmReading {
  const scenes = input.scenes ?? [];
  const stories = input.stories ?? [];
  const w = input.world ?? {};
  const pr = input.presence ?? {};
  const mi = input.imprint ?? {};

  const meanWeight = avg(scenes.map((s) => get(s.emotionalWeight)));
  const meanRestraint = avg(scenes.map((s) => get(s.restraintLevel)));

  // tension — pressure observed in the world + scene-level weight.
  const tension = clamp10(
    get(w.anxietyClimate) * 0.4 +
    get(w.attentionFragmentation) * 0.3 +
    meanWeight * 0.3,
  );

  // release — stillness + breathing + restraint.
  const release = clamp10(
    get(pr.stillnessWeight) * 0.4 +
    get(pr.emotionalBreathing) * 0.3 +
    meanRestraint * 0.3,
  );

  // breathingRoom — direct presence signal + simplicity craving.
  const breathingRoom = clamp10(
    get(pr.emotionalBreathing) * 0.6 +
    getDef(w.simplicityCraving, 5) * 0.4,
  );

  // pause — sustained restraint + stillness.
  const pause = clamp10(
    meanRestraint * 0.5 +
    get(pr.stillnessWeight) * 0.5,
  );

  // silence — proxy via scene silenceAllocation tokens.
  const silenceLeaning = scenes.length === 0 ? 0 :
    scenes.filter((s) => /silen|near.silent|entire/.test((s.silenceAllocation ?? '').toLowerCase())).length / scenes.length;
  const silence = clamp10(silenceLeaning * 6 + get(pr.stillnessWeight) * 0.4);

  // restraint — composite.
  const restraint = clamp10(
    meanRestraint * 0.5 +
    get(pr.signals?.emotionalRestraint) * 0.3 +
    getDef(w.simplicityCraving, 5) * 0.2,
  );

  // emotionalDensity — overload + stimulation + low restraint.
  const emotionalDensity = clamp10(
    get(w.emotionalOverload) * 0.4 +
    get(w.stimulationSaturation) * 0.3 +
    Math.max(0, 6 - meanRestraint) * 0.3,
  );

  // emotionalSpacing — inverse of density.
  const emotionalSpacing = clamp10(10 - emotionalDensity * 0.7 + breathingRoom * 0.3);

  // anticipation — sustained low motion + held silence (NOT hype).
  const anticipation = clamp10(
    silence * 0.4 +
    pause * 0.4 +
    get(mi.scenePermanence) * 0.2,
  );

  // reflection — scene permanence + presence stillness + restraint.
  const reflection = clamp10(
    get(mi.scenePermanence) * 0.4 +
    get(pr.stillnessWeight) * 0.3 +
    restraint * 0.3,
  );

  const rhythmProfile: RhythmProfile = {
    tension:           r1(tension),
    release:           r1(release),
    breathingRoom:     r1(breathingRoom),
    pause:             r1(pause),
    silence:           r1(silence),
    restraint:         r1(restraint),
    emotionalDensity:  r1(emotionalDensity),
    emotionalSpacing:  r1(emotionalSpacing),
    anticipation:      r1(anticipation),
    reflection:        r1(reflection),
  };

  // tensionMap — surface scene-level tension descriptors.
  const tensionMap: TensionPoint[] = scenes.slice(0, 5).map((s, i) => {
    const a = r1(clamp10(get(s.emotionalWeight) * 0.6 + tension * 0.4));
    return {
      moment: s.sourceStoryName ?? `scene-${i + 1}`,
      alignment: a,
      observation: a >= 6
        ? 'tension structure may carry emotional weight — observed alongside the scene'
        : 'tension structure observed alongside the scene — requires more evidence',
    };
  });

  // releaseMap — pair each scene with a release moment.
  const releaseMap: ReleasePoint[] = scenes.slice(0, 5).map((s, i) => {
    const a = r1(clamp10(release * 0.7 + get(s.restraintLevel) * 0.3));
    return {
      moment: `${s.sourceStoryName ?? `scene-${i + 1}`} · release`,
      alignment: a,
      observation: a >= 6
        ? 'release structure may carry emotional weight — historically associated with restraint'
        : 'release structure observed alongside the scene — requires more evidence',
    };
  });

  // breathingMoments — generic shapes drawn from scene silence allocations.
  const breathingMoments: BreathingMoment[] = [
    { moment: 'after the door closes',     alignment: r1(clamp10(release * 0.7 + tension * 0.3)) },
    { moment: 'before the first sip',      alignment: r1(clamp10(breathingRoom * 0.8 + pause * 0.2)) },
    { moment: 'in the held look',          alignment: r1(clamp10(pause * 0.7 + reflection * 0.3)) },
    { moment: 'after the small moment',    alignment: r1(clamp10(release * 0.5 + reflection * 0.5)) },
    { moment: 'between two sentences',     alignment: r1(clamp10(silence * 0.5 + pause * 0.5)) },
  ].map((b) => ({
    ...b,
    observation: b.alignment >= 6
      ? `${b.moment} may carry emotional weight — historically associated with breathing-room structures`
      : `${b.moment} observed alongside the outputs — requires more evidence`,
  }));

  // silenceMoments — pull from scenes that allocate explicit silence.
  const silenceMoments: RhythmSilenceMoment[] = scenes.slice(0, 5).map((s, i) => {
    const a = r1(clamp10(silence * 0.7 + pause * 0.3));
    return {
      moment: `${s.sourceStoryName ?? `scene-${i + 1}`} · silence: ${s.silenceAllocation ?? 'majority silence'}`,
      alignment: a,
      observation: a >= 6
        ? 'silence allocation may carry emotional weight — historically associated with remembrance-oriented moments'
        : 'silence allocation observed alongside the scene — requires more evidence',
    };
  });

  // pacing profile
  const pacingProfile: PacingProfile =
    silence >= 7 && pause >= 6 ? 'observational-still' :
    restraint >= 7 ? 'slow-grounded' :
    restraint >= 5 ? 'measured-restrained' :
                     'energetic-restrained';

  // restraint profile
  const restraintProfile: RestraintProfile =
    restraint >= 7 ? 'maximal-restraint' :
    restraint >= 4 ? 'measured-restraint' :
                     'limited-restraint';

  // dominant rhythm signals — top 3 by magnitude.
  const dominantRhythmSignals = Object.entries(rhythmProfile)
    .map(([k, v]) => [k, v as number] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  notes.push(`exploratory rhythm structure — pacing appears ${pacingProfile.replace(/-/g, ' ')}`);
  if (rhythmProfile.silence >= 6) notes.push('silence allocation observed alongside the outputs — historically associated with remembrance-oriented moments');
  if (rhythmProfile.emotionalSpacing >= 7) notes.push('emotional spacing observed alongside the outputs — may carry emotional weight');
  if (rhythmProfile.emotionalDensity >= 7) notes.push('emotional density appears elevated — operator review required');
  if (stories.length === 0 && scenes.length === 0) {
    notes.push('no source scenes or stories provided — requires more evidence');
  }

  return {
    rhythmProfile,
    tensionMap,
    releaseMap,
    breathingMoments,
    silenceMoments,
    emotionalDensity: rhythmProfile.emotionalDensity,
    pacingProfile,
    restraintProfile,
    dominantRhythmSignals,
    notes,
    reasonCodes: [
      `pacing:${pacingProfile}`,
      `restraint:${restraintProfile}`,
      ...Object.entries(rhythmProfile).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
