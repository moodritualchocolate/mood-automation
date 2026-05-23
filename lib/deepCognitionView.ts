/**
 * DEEP COGNITION VIEW (Wave 17 — Embodied Runtime Presence)
 *
 * The view model that finally makes Waves 10–16 visible in the
 * runtime dashboard. Before this, the deepest layers of the organism
 * — reality coupling, strategic future, autonomous action, reality
 * feedback, live coupling, sovereign identity, generative presence —
 * persisted to disk but never reached the surface.
 *
 * Embodiment, not philosophy: this module reads what the organism
 * has remembered about itself and turns it into a render the eye can
 * read in a glance.
 */

import type { RuntimeSnapshot, Tone, Gauge } from './runtimeUIBrain';
import { readSilenceEngine, type SilenceEngineReading, type SilenceDirective, type SilenceReason } from './silenceEngine';
import type { ContradictionKind } from './contradictionScarsArchive';
import type { WeatherSampleKind } from './weatherLogArchive';
import { pressureFieldMagnitude, type ExternalPressureKind } from './pressureIngestionGateway';
import { deriveTemporalCognition, type TemporalCognitionReading } from './temporalCognition';

export interface DeepCognitionLayer {
  /** Display name of the layer (e.g. "reality coupling"). */
  name: string;
  /** The wave it belongs to (10–16). */
  wave: number;
  /** A one-line statement of the layer's current state. */
  statement: string;
  /** Render-ready gauges this layer surfaces. */
  gauges: Gauge[];
  /** Overall tone — what colour the dot should be. */
  tone: Tone;
  /** True when the layer has persistent state to render. */
  present: boolean;
}

/** A historical protection — what restraint preserved at a moment in time. */
export interface ProtectionTrailEntry {
  at: number;                        // epoch ms
  ago: string;                       // human-readable: "12s ago", "3 cycles ago", etc.
  directive: SilenceDirective;
  strength: number;
  reasons: SilenceReason[];
  statement: string;
}

export interface ProtectionTrail {
  /** True when the organism has any protection history at all. */
  any_protection_history: boolean;
  /** Total protections ever recorded (monotonic, not bounded by trail length). */
  total_protections: number;
  /** Most recent N protections, oldest → newest. */
  trail: ProtectionTrailEntry[];
  /** A summary line — what this organism's restraint has shown about it. */
  summary: string;
}

/** One-word cognitive weather. The first impression of what the
 *  organism is feeling, derived from the deepest layers. Aesthetic,
 *  not analytical — but built from real state, not invented. */
export type CognitiveWeather =
  | 'awake' | 'breathing' | 'hushed' | 'restrained' | 'strained' | 'flourishing' | 'dormant';

export interface CognitiveWeatherReading {
  weather: CognitiveWeather;
  /** A one-line first impression for the page header. */
  felt_as: string;
  /** Tone the dashboard should colour the weather word in. */
  tone: Tone;
  /** Which breathing class the page should wear right now — or null. */
  breath: 'breathe-hold' | 'breathe-silent' | 'breathe-go-quiet' | null;
}

/** A render-ready snapshot of the recent weather history. The page
 *  uses this to show where the organism came from, not just where
 *  it is. */
export interface WeatherTrailDot {
  /** Index in the trail; 0 = oldest visible. */
  i: number;
  weather: WeatherSampleKind;
  /** Tone for colouring the dot. */
  tone: Tone;
  /** True when this sample coincided with a protection or a scar —
   *  used by the UI to make a sample feel weightier. */
  marked: boolean;
}

export interface WeatherTrail {
  /** The trail itself, oldest → newest, up to ~24 dots. */
  dots: WeatherTrailDot[];
  /** True when there is enough history to read a transition front. */
  has_history: boolean;
  /** A transition front, if a state change is recently in progress. */
  transition?: {
    from: WeatherSampleKind;
    to: WeatherSampleKind;
    /** A one-line description for the UI. */
    statement: string;
  };
  /** 0..1 — how heavy the memory of past restraint/scars sits on
   *  the current atmosphere. The vignette baseline is biased by this. */
  memory_pressure: number;
  /** A short summary line about temporal continuity. */
  summary: string;
}

/** A historical contradiction — a moment the organism shipped despite
 *  itself. Scars create wisdom. */
export interface ScarTrailEntry {
  at: number;
  ago: string;
  kind: ContradictionKind;
  severity: number;
  description: string;
  wisdom: string;
}

export interface ScarTrail {
  /** True when any scars are on record. */
  any_scars: boolean;
  /** Total scars ever recorded (monotonic). */
  total_scars: number;
  /** Most recent scars, oldest → newest. */
  trail: ScarTrailEntry[];
  /** A summary line — what the scar record says about the organism. */
  summary: string;
}

export interface DeepCognitionViewModel {
  /** True when at least one Wave 10–16 layer has persistent state. */
  any_layer_present: boolean;
  /** The deepest layers, in stack order. */
  layers: DeepCognitionLayer[];
  /** The unified silence engine reading — the central distinction the
   *  user identified as defining a civilization-scale intelligence. */
  silence: SilenceEngineReading;
  /** The historical record of what restraint protected — runtime continuity. */
  protectionTrail: ProtectionTrail;
  /** The dark counterpart: scars from breaches that shipped. Wisdom. */
  scarTrail: ScarTrail;
  /** The single-word felt weather of the organism right now. */
  weather: CognitiveWeatherReading;
  /** Temporal continuity for the atmosphere — where the organism
   *  came from, not just where it is. */
  weatherTrail: WeatherTrail;
  /** Wave 17.7 — the external pressure field. The organism's read
   *  of how loaded its world is right now. Pressure influences the
   *  page atmosphere as bias; it never sets the weather. */
  pressureField: PressureField;
  /** Wave 18 — what the organism remembers across time. Pure
   *  derivation across the existing archives (weather log,
   *  protection memory, contradiction scars, pressure history).
   *  Like every layer above, it perceives without writing and
   *  cannot recolour cognitive weather. */
  temporal: TemporalCognitionReading;
  /** A one-line statement summarising the deep cognition state. */
  statement: string;
}

/** A single dimensional read of external pressure — digested, never raw. */
export interface PressureDimension {
  kind: ExternalPressureKind;
  /** -1..1 — the smoothed vector. */
  vector: number;
  /** Tone for the dashboard. */
  tone: Tone;
  /** Short human label of where this pressure is now. */
  label: string;
}

export interface PressureField {
  /** True when any pressure has ever been ingested. */
  has_pressure_field: boolean;
  /** The six dimensions of external pressure, smoothed. */
  dimensions: PressureDimension[];
  /** 0..1 — total field magnitude (used as vignette bias contribution). */
  field_magnitude: number;
  /** Total readings ever ingested. */
  readings_ingested: number;
  /** Wave 17.9 — sources visibly active in the recent buffer. The
   *  dashboard renders these so the viewer can see WHICH part of
   *  the world is currently pressuring the organism. */
  active_sources: Array<{ name: string; count: number; mostRecentAt: number; }>;
  /** A short summary line for the dashboard. */
  summary: string;
}

function gauge(label: string, value: number, max: number, tone: Tone, display?: string): Gauge {
  return { label, value, max, display: display ?? `${value}/${max}`, tone };
}

function toneFor(score: number): Tone {
  if (score >= 7) return 'good';
  if (score >= 4) return 'warn';
  return 'bad';
}

function humanizeAgo(when: number, now: number): string {
  const diffMs = Math.max(0, now - when);
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/**
 * Build the cognitive weather. The single-word felt mood the
 * organism is in right now — read from the same persistent state
 * everything else reads from, never invented.
 *
 * The ladder, in priority order:
 *   dormant      — no layers have drawn breath yet
 *   go-quiet     — silence is deep and conscious
 *   hushed       — silence is being held
 *   restrained   — patience is on, no need to act
 *   strained     — pressure is high, restraint is tight
 *   flourishing  — the organism is shaping reality beautifully
 *   breathing    — present and quiet
 *   awake        — the default, alert and open
 */
function buildCognitiveWeather(
  snap: RuntimeSnapshot,
  silence: SilenceEngineReading,
  layers: DeepCognitionLayer[],
): CognitiveWeatherReading {
  if (layers.length === 0) {
    return {
      weather: 'dormant',
      felt_as: 'the deepest layers have not yet drawn breath',
      tone: 'cool',
      breath: null,
    };
  }

  // Silence wins first, because silence is the central distinction.
  if (silence.directive === 'go-quiet-now') {
    return {
      weather: 'hushed',
      felt_as: 'a held breath — the organism is consciously withholding',
      tone: 'cool',
      breath: 'breathe-go-quiet',
    };
  }
  if (silence.directive === 'be-silent') {
    return {
      weather: 'restrained',
      felt_as: 'quiet restraint — the organism is choosing not to speak',
      tone: 'cool',
      breath: 'breathe-silent',
    };
  }
  if (silence.directive === 'hold') {
    return {
      weather: 'breathing',
      felt_as: 'breathing — present, attentive, not yet ready to speak',
      tone: 'neutral',
      breath: 'breathe-hold',
    };
  }

  // Strain — if any of the load-bearing layers reports a bad tone,
  // the organism is straining.
  const anyBad = layers.some((l) => l.tone === 'bad');
  if (anyBad) {
    return {
      weather: 'strained',
      felt_as: 'strain — some layer is under pressure it cannot yet absorb',
      tone: 'warn',
      breath: null,
    };
  }

  // Flourishing — Wave 16 reports flourishing.
  const gp = snap.generativePresence;
  const flourishing = gp && gp.presenceCycles >= 2 &&
    gp.beautyMomentsCreated > gp.forcedInfluenceAttempts &&
    gp.civilizationCoherenceScore >= 7;
  if (flourishing) {
    return {
      weather: 'flourishing',
      felt_as: 'flourishing — the organism is shaping reality beautifully',
      tone: 'good',
      breath: null,
    };
  }

  return {
    weather: 'awake',
    felt_as: 'awake — open, listening, ready to act when action is right',
    tone: 'good',
    breath: null,
  };
}

const WEATHER_TONE: Record<WeatherSampleKind, Tone> = {
  awake:       'good',
  flourishing: 'good',
  breathing:   'neutral',
  restrained:  'cool',
  hushed:      'cool',
  strained:    'warn',
  dormant:     'cool',
};

/**
 * Build the weather trail. The dots are the last N weather samples;
 * the transition front fires when the last two distinct samples
 * differ; the memory pressure rises with recent scars and protections,
 * shaping how heavy the page atmosphere should feel.
 *
 * Like everything else here, this reads from persisted state only.
 * Time itself is the only thing being derived.
 */
function buildWeatherTrail(snap: RuntimeSnapshot): WeatherTrail {
  const log = snap.weatherLog ?? null;
  const samples = log?.samples ?? [];

  // Take the most recent 24 samples for the dot strip.
  const visible = samples.slice(-24);
  const dots: WeatherTrailDot[] = visible.map((s, i) => ({
    i,
    weather: s.weather,
    tone: WEATHER_TONE[s.weather] ?? 'neutral',
    marked: s.protection_recorded || s.scar_recorded,
  }));

  // Find the most recent distinct prior sample for the front.
  let transition: WeatherTrail['transition'] | undefined;
  if (samples.length >= 2) {
    const latest = samples[samples.length - 1];
    let prior: typeof latest | undefined;
    for (let i = samples.length - 2; i >= Math.max(0, samples.length - 8); i--) {
      if (samples[i].weather !== latest.weather) { prior = samples[i]; break; }
    }
    if (prior) {
      transition = {
        from: prior.weather,
        to: latest.weather,
        statement: `weather moved from ${prior.weather} to ${latest.weather}`,
      };
    }
  }

  // Memory pressure — how much the recent past presses on the
  // current atmosphere. Each scar weighs more than each protection;
  // a freshly clean window weighs nothing. Bounded at 1.0.
  const recent = samples.slice(-8);
  const scarsRecent = recent.filter((s) => s.scar_recorded).length;
  const protRecent = recent.filter((s) => s.protection_recorded).length;
  const memory_pressure = Math.min(1, scarsRecent * 0.18 + protRecent * 0.06);

  const has_history = samples.length >= 2;

  const summary = samples.length === 0
    ? 'no weather history yet — the organism is taking its first breath'
    : transition
      ? `${transition.statement} — the front is recent`
      : samples.length === 1
        ? 'one weather sample on record — continuity is just beginning'
        : `${samples.length} samples on record — the atmosphere has held`;

  return { dots, has_history, transition, memory_pressure, summary };
}

function pressureLabel(kind: ExternalPressureKind, vector: number): string {
  const sign = vector > 0.15 ? '+' : vector < -0.15 ? '−' : '·';
  const intensity = Math.abs(vector) >= 0.6 ? 'strong'
                  : Math.abs(vector) >= 0.3 ? 'present'
                  : Math.abs(vector) >= 0.1 ? 'faint' : 'still';
  // The "still" line reads as quiet rather than empty.
  return intensity === 'still' ? `${kind} · still` : `${kind} · ${sign} ${intensity}`;
}

function pressureTone(vector: number): Tone {
  const mag = Math.abs(vector);
  if (mag >= 0.6) return 'warn';
  if (mag >= 0.3) return 'cool';
  if (mag >= 0.1) return 'neutral';
  return 'neutral';
}

/** Read the external pressure field — six dimensions, all digested.
 *  Pressure is *information*, not direction; the dashboard shows it
 *  but the cognitive weather remains sovereign. */
function buildPressureField(snap: RuntimeSnapshot): PressureField {
  const gw = snap.pressureGateway ?? null;
  if (!gw) {
    return {
      has_pressure_field: false,
      dimensions: [],
      field_magnitude: 0,
      readings_ingested: 0,
      active_sources: [],
      summary: 'no external pressure ingested — the gateway is ready, waiting',
    };
  }

  const kinds: ExternalPressureKind[] = [
    'audience-fatigue', 'cultural-tension', 'attention-availability',
    'sentiment-drift', 'resonance-decay', 'trust-velocity',
  ];
  const dimensions: PressureDimension[] = kinds.map((kind) => {
    const vector = gw.smoothed[kind] ?? 0;
    return {
      kind,
      vector: Math.round(vector * 100) / 100,
      tone: pressureTone(vector),
      label: pressureLabel(kind, vector),
    };
  });

  const field_magnitude = pressureFieldMagnitude(gw);
  const readings_ingested = gw.readingsIngested;

  // Distinct sources in the recent buffer, with reading counts and
  // most-recent timestamps. The dashboard renders these as small
  // labels so the viewer can see which part of the world is
  // currently pressuring the organism.
  const sourceMap = new Map<string, { count: number; mostRecentAt: number }>();
  for (const r of gw.recent) {
    const prev = sourceMap.get(r.source);
    if (prev) {
      prev.count += 1;
      if (r.at > prev.mostRecentAt) prev.mostRecentAt = r.at;
    } else {
      sourceMap.set(r.source, { count: 1, mostRecentAt: r.at });
    }
  }
  const active_sources = Array.from(sourceMap.entries())
    .map(([name, info]) => ({ name, count: info.count, mostRecentAt: info.mostRecentAt }))
    .sort((a, b) => b.mostRecentAt - a.mostRecentAt)
    .slice(0, 6);

  const summary = readings_ingested === 0
    ? 'pressure gateway open, no readings yet'
    : field_magnitude < 0.1
      ? `field is still — ${readings_ingested} reading(s) digested, all settled near zero`
      : field_magnitude < 0.3
        ? `low pressure across the field — ${readings_ingested} reading(s) digested`
        : field_magnitude < 0.6
          ? `moderate pressure across the field — the organism is feeling its world`
          : `loaded field — pressure is high across multiple dimensions`;

  return { has_pressure_field: true, dimensions, field_magnitude, readings_ingested, active_sources, summary };
}

function buildScarTrail(snap: RuntimeSnapshot): ScarTrail {
  const archive = snap.contradictionScars ?? null;
  const now = snap.capturedAt;
  const scars = archive?.scars ?? [];
  const total = archive?.totalScars ?? 0;

  const trail: ScarTrailEntry[] = scars.slice(-12).map((s) => ({
    at: s.at,
    ago: humanizeAgo(s.at, now),
    kind: s.kind,
    severity: s.severity,
    description: s.description,
    wisdom: s.wisdom,
  }));

  const any_scars = trail.length > 0;

  const summary = !any_scars
    ? 'no scars yet — every breach so far was caught before it shipped'
    : total <= 2
      ? `${total} scar(s) — the organism has been tested and remembers`
      : total <= 5
        ? `${total} scars — wisdom is gathering`
        : `${total} scars — a long record of breaches the organism carries with it`;

  return { any_scars, total_scars: total, trail, summary };
}

function buildProtectionTrail(snap: RuntimeSnapshot, currentSilence: SilenceEngineReading): ProtectionTrail {
  const archive = snap.protectionMemory ?? null;
  const now = snap.capturedAt;
  const events = archive?.events ?? [];
  const total = archive?.totalEvents ?? 0;

  // Build the historical trail. Newest last so the UI can render
  // it as a timeline reading downward.
  const trail: ProtectionTrailEntry[] = events.slice(-12).map((e) => ({
    at: e.at,
    ago: humanizeAgo(e.at, now),
    directive: e.directive,
    strength: e.strength,
    reasons: e.reasons,
    statement: e.statement,
  }));

  const any_protection_history = trail.length > 0;

  const summary = any_protection_history
    ? `this organism has chosen restraint ${total} time(s) — silence is not absence here, it is a record`
    : currentSilence.silence_is_the_move
      ? 'restraint is being offered now; once held it will join the record'
      : 'no restraint history yet — every choice so far has been to speak';

  return { any_protection_history, total_protections: total, trail, summary };
}

export function buildDeepCognitionView(snap: RuntimeSnapshot): DeepCognitionViewModel {
  const layers: DeepCognitionLayer[] = [];

  // ─── Wave 10 — reality coupling ──────────────────────────────
  if (snap.coupling) {
    const c = snap.coupling;
    layers.push({
      name: 'reality coupling',
      wave: 10,
      present: true,
      tone: toneFor(c.trustLevel),
      statement: c.couplingCycles === 0
        ? 'opening to reality'
        : `${c.couplingCycles} cycles · ${c.resonanceWins} resonance / ${c.stimulusWins} stimulus · ${c.silenceHonored} silence`,
      gauges: [
        gauge('trust', c.trustLevel, 10, toneFor(c.trustLevel)),
        gauge('authenticity', c.authenticityReserve, 10, toneFor(c.authenticityReserve)),
        gauge('reputation', c.reputationCredit, 10, toneFor(c.reputationCredit)),
        gauge('saturation', c.saturationMemory, 10, c.saturationMemory >= 7 ? 'bad' : 'neutral'),
      ],
    });
  }

  // ─── Wave 11 — strategic future ──────────────────────────────
  if (snap.strategicFuture) {
    const s = snap.strategicFuture;
    const compounding = s.futureCompoundedCount >= s.nowOptimizedCount;
    layers.push({
      name: 'strategic future',
      wave: 11,
      present: true,
      tone: compounding ? toneFor(s.compoundingAdvantage) : 'warn',
      statement: s.planningCycles === 0
        ? 'no strategic future yet'
        : compounding
          ? `compounding toward "${s.futureBeingCompounded}"`
          : `optimizing for now — debt ${s.strategicDebt}/10`,
      gauges: [
        gauge('compounding advantage', s.compoundingAdvantage, 10, toneFor(s.compoundingAdvantage)),
        gauge('strategic debt', s.strategicDebt, 10, s.strategicDebt >= 6 ? 'bad' : s.strategicDebt >= 3 ? 'warn' : 'good'),
        gauge('trust compounded', s.trustCompounded, 10, toneFor(s.trustCompounded)),
        gauge('patience honored', s.patienceHonored, 10, 'cool', `${s.patienceHonored}×`),
      ],
    });
  }

  // ─── Wave 12 — autonomous action ─────────────────────────────
  if (snap.execution) {
    const e = snap.execution;
    const compulsive = e.executionCycles >= 4 && e.compulsiveSignals > 0;
    layers.push({
      name: 'autonomous action',
      wave: 12,
      present: true,
      tone: compulsive ? 'bad' : toneFor(e.restraintBudget),
      statement: e.executionCycles === 0
        ? 'no action history yet'
        : `${e.actionsAuthorized} acted / ${e.actionsWithheld} withheld${e.compulsiveSignals > 0 ? ` · ${e.compulsiveSignals} compulsion(s)` : ''}`,
      gauges: [
        gauge('restraint budget', e.restraintBudget, 10, toneFor(e.restraintBudget)),
        gauge('cadence health', e.cadenceHealth, 10, toneFor(e.cadenceHealth)),
        gauge('recovery debt', e.audienceRecoveryDebt, 10, e.audienceRecoveryDebt >= 6 ? 'bad' : e.audienceRecoveryDebt >= 3 ? 'warn' : 'good'),
        gauge('actions on record', e.actionsAuthorized + e.actionsWithheld, 20, 'cool', `${e.actionsAuthorized + e.actionsWithheld}`),
      ],
    });
  }

  // ─── Wave 13 — reality feedback ──────────────────────────────
  if (snap.feedback) {
    const f = snap.feedback;
    layers.push({
      name: 'reality feedback',
      wave: 13,
      present: true,
      tone: f.trustNetGain >= 1 ? 'good' : f.trustNetGain <= -1 ? 'bad' : 'neutral',
      statement: f.feedbackCycles === 0
        ? 'no feedback ingested yet'
        : `${f.reactionsIngested} reactions · ${f.contradictionsFound} contradiction(s) · ${f.slowTruthsDetected} slow truth(s)`,
      gauges: [
        gauge('trust net gain', Math.round(f.trustNetGain * 10) / 10, 10,
          f.trustNetGain >= 1 ? 'good' : f.trustNetGain <= -1 ? 'bad' : 'neutral',
          `${f.trustNetGain >= 0 ? '+' : ''}${f.trustNetGain.toFixed(1)}`),
        gauge('resonance AUC', f.resonanceCurveAUC, 10, toneFor(f.resonanceCurveAUC)),
        gauge('meaning persistence', f.meaningPersistenceScore, 10, toneFor(f.meaningPersistenceScore)),
        gauge('slow truths', f.slowTruthsDetected, 10, 'cool', `${f.slowTruthsDetected}`),
      ],
    });
  }

  // ─── Wave 14 — live civilization coupling ───────────────────
  if (snap.liveCoupling) {
    const l = snap.liveCoupling;
    const reality_shaping = l.meaningsCarried > l.noveltyChased;
    layers.push({
      name: 'live coupling',
      wave: 14,
      present: true,
      tone: reality_shaping ? toneFor(l.realityCouplingDepth) : 'warn',
      statement: l.couplingCycles === 0
        ? 'preparing to feel reality live'
        : `${l.meaningsCarried} meaning / ${l.noveltyChased} novelty · ${l.realityChangesAttributed} reality changes`,
      gauges: [
        gauge('presence', l.presenceScore, 10, toneFor(l.presenceScore)),
        gauge('coupling depth', l.realityCouplingDepth, 10, toneFor(l.realityCouplingDepth)),
        gauge('living reputation', l.livingReputation, 10, toneFor(l.livingReputation)),
        gauge('cadence sync', l.cadenceSync, 10, toneFor(l.cadenceSync)),
      ],
    });
  }

  // ─── Wave 15 — sovereign identity ────────────────────────────
  if (snap.sovereignIdentity) {
    const i = snap.sovereignIdentity;
    const captured = i.popularityChosenOverTruth > i.truthChosenOverPopularity;
    layers.push({
      name: 'sovereign identity',
      wave: 15,
      present: true,
      tone: captured ? 'bad' : toneFor(i.sovereigntyScore),
      statement: i.preservationCycles === 0
        ? 'no identity history yet'
        : captured
          ? `captured — ${i.popularityChosenOverTruth} popularity / ${i.truthChosenOverPopularity} truth`
          : `sovereign — ${i.truthChosenOverPopularity} truth / ${i.popularityChosenOverTruth} popularity`,
      gauges: [
        gauge('sovereignty', i.sovereigntyScore, 10, toneFor(i.sovereigntyScore)),
        gauge('core integrity', i.coreIntegrityScore, 10, toneFor(i.coreIntegrityScore)),
        gauge('corruptions', i.identityCorruptions, 10, i.identityCorruptions === 0 ? 'good' : i.identityCorruptions <= 2 ? 'warn' : 'bad', `${i.identityCorruptions}`),
        gauge('drift recoveries', i.driftEventsRecovered, 10, 'cool', `${i.driftEventsRecovered}`),
      ],
    });
  }

  // ─── Wave 16 — generative civilization presence ──────────────
  if (snap.generativePresence) {
    const g = snap.generativePresence;
    const extractive = g.forcedInfluenceAttempts > g.beautyMomentsCreated;
    layers.push({
      name: 'generative presence',
      wave: 16,
      present: true,
      tone: extractive ? 'bad' : toneFor(g.civilizationCoherenceScore),
      statement: g.presenceCycles === 0
        ? 'preparing to give beautifully'
        : extractive
          ? `extractive — ${g.forcedInfluenceAttempts} forced / ${g.beautyMomentsCreated} beauty`
          : `${g.beautyMomentsCreated} beauty · ${g.hopeSeedsPlanted} hope · ${g.cynicismRepelled} repulsed`,
      gauges: [
        gauge('civilization coherence', g.civilizationCoherenceScore, 10, toneFor(g.civilizationCoherenceScore)),
        gauge('generative impact', g.generativeImpactScore, 10, toneFor(g.generativeImpactScore)),
        gauge('trust gravity', g.trustGravityAccumulated, 100, toneFor(Math.min(10, g.trustGravityAccumulated / 10)), `${g.trustGravityAccumulated}/100`),
        gauge('beauty moments', g.beautyMomentsCreated, 20, 'cool', `${g.beautyMomentsCreated}`),
      ],
    });
  }

  // ─── The unified Silence Engine — the central reading ────────
  const silence = readSilenceEngine({
    coupling: snap.coupling ?? null,
    strategicFuture: snap.strategicFuture ?? null,
    execution: snap.execution ?? null,
    feedback: snap.feedback ?? null,
    liveCoupling: snap.liveCoupling ?? null,
    generativePresence: snap.generativePresence ?? null,
    worldState: snap.worldState,
  });

  const protectionTrail = buildProtectionTrail(snap, silence);
  const scarTrail = buildScarTrail(snap);
  const weather = buildCognitiveWeather(snap, silence, layers);
  const weatherTrail = buildWeatherTrail(snap);
  const pressureField = buildPressureField(snap);
  const temporal = deriveTemporalCognition({
    weatherLog: snap.weatherLog,
    protectionMemory: snap.protectionMemory,
    contradictionScars: snap.contradictionScars,
    pressureGateway: snap.pressureGateway,
  }, snap.capturedAt);

  const any_layer_present = layers.length > 0;
  const statement = !any_layer_present
    ? 'the deepest layers have not yet drawn breath'
    : `${layers.length} deep cognition layer(s) visible · ${silence.directive} · ${protectionTrail.total_protections} protection(s) · ${scarTrail.total_scars} scar(s)`;

  return {
    any_layer_present, layers, silence, protectionTrail, scarTrail,
    weather, weatherTrail, pressureField, temporal, statement,
  };
}
