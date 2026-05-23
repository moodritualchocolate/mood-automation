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
import { readSilenceEngine, type SilenceEngineReading } from './silenceEngine';

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

export interface DeepCognitionViewModel {
  /** True when at least one Wave 10–16 layer has persistent state. */
  any_layer_present: boolean;
  /** The deepest layers, in stack order. */
  layers: DeepCognitionLayer[];
  /** The unified silence engine reading — the central distinction the
   *  user identified as defining a civilization-scale intelligence. */
  silence: SilenceEngineReading;
  /** A one-line statement summarising the deep cognition state. */
  statement: string;
}

function gauge(label: string, value: number, max: number, tone: Tone, display?: string): Gauge {
  return { label, value, max, display: display ?? `${value}/${max}`, tone };
}

function toneFor(score: number): Tone {
  if (score >= 7) return 'good';
  if (score >= 4) return 'warn';
  return 'bad';
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

  const any_layer_present = layers.length > 0;
  const statement = !any_layer_present
    ? 'the deepest layers have not yet drawn breath'
    : `${layers.length} deep cognition layer(s) visible · ${silence.directive}`;

  return { any_layer_present, layers, silence, statement };
}
