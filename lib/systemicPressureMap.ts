/**
 * SYSTEMIC PRESSURE MAP (Phase 17)
 *
 * Maps modern systems that CAUSE recurring emotional states. The
 * earlier phases answered "what does this person feel?" Phase 17
 * answers "what machinery produces this feeling?"
 *
 * The spec named ten structural systems:
 *
 *   infinite accessibility
 *   algorithmic interruption
 *   optimization culture
 *   parenting without recovery
 *   work/home boundary collapse
 *   passive entertainment overload
 *   notification fragmentation
 *   social performance pressure
 *   productivity identity
 *   endless self-improvement loops
 *
 * The engine matches a candidate banner against this map and returns
 * which structural cause(s) are producing the emotional state. Used
 * by the meta-critic to answer the new headline question:
 *
 *   "Does this emotional state feel caused by modern systems,
 *    or merely described aesthetically?"
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type SystemicSystem =
  | 'infinite-accessibility'
  | 'algorithmic-interruption'
  | 'optimization-culture'
  | 'parenting-without-recovery'
  | 'work-home-boundary-collapse'
  | 'passive-entertainment-overload'
  | 'notification-fragmentation'
  | 'social-performance-pressure'
  | 'productivity-identity'
  | 'endless-self-improvement-loop';

export interface SystemicCauseRecord {
  id: SystemicSystem;
  mechanism: string;                  // how the system produces the feeling
  observable_symptoms: string[];      // what the camera sees when this system is at work
  emotional_outputs: string[];         // the named feelings it generates
  /** Director note — what to add to the brief so the system feels CAUSED. */
  briefHint: string;
  /** State family ids this system is most likely to produce. */
  family_anchors: string[];
  /** Emotional core ids this system is most likely to produce. */
  core_anchors: string[];
  /** State slugs this system specifically targets. */
  state_anchors: string[];
}

export const SYSTEMIC_PRESSURE_MAP: Record<SystemicSystem, SystemicCauseRecord> = {
  'infinite-accessibility': {
    id: 'infinite-accessibility',
    mechanism: 'every channel is open — slack, email, whatsapp, text, dm — all the time, on every device',
    observable_symptoms: ['phone face-up at all hours', 'lockscreen lights up at intervals', 'no off-hours'],
    emotional_outputs: ['overconnected exhaustion', 'over-responsiveness', 'inability to be unreachable'],
    briefHint: 'the room has TWO devices visible (phone + laptop, or phone + watch) — the subject is reachable on every surface',
    family_anchors: ['overstimulation', 'pressure', 'fragmentation'],
    core_anchors: ['overconnected-exhaustion', 'overstimulated-but-flat', 'invisible-pressure'],
    state_anchors: ['overconnected-exhaustion', 'constant-notifications', 'overstimulated-office'],
  },
  'algorithmic-interruption': {
    id: 'algorithmic-interruption',
    mechanism: 'every feed is engineered to interrupt thought before it completes — autoplay, infinite scroll, recommendation churn',
    observable_symptoms: ['next video already loaded', 'feed scrolled before the current item ended', 'attention pulled mid-thought'],
    emotional_outputs: ['unfinished thoughts', 'attention fragmentation', 'mid-brain interruption'],
    briefHint: 'subject is interrupted mid-action by a feed — face partially out of focus, the screen the actual subject',
    family_anchors: ['fragmentation', 'overstimulation'],
    core_anchors: ['emotional-fragmentation', 'overstimulation', 'doomscrolling', 'digital-fatigue'],
    state_anchors: ['attention-fragmentation', 'doomscroll-fatigue', 'exhausted-scrolling'],
  },
  'optimization-culture': {
    id: 'optimization-culture',
    mechanism: 'self-worth attached to measurable outputs — sleep score, focus time, steps, calorie window, screen time',
    observable_symptoms: ['wearable on wrist', 'dashboard open on phone', 'subject checking metrics about themselves'],
    emotional_outputs: ['optimization fatigue', 'self-worth-tied-to-numbers', 'guilt at the dashboard'],
    briefHint: 'a tracking surface visible in the frame (wearable, app, paper journal) — and the subject is looking at it with the wrong feeling',
    family_anchors: ['pressure', 'paralysis'],
    core_anchors: ['invisible-pressure', 'guilt', 'hyper-awareness'],
    state_anchors: ['forced-productivity', 'pressure-fatigue', 'fake-productivity'],
  },
  'parenting-without-recovery': {
    id: 'parenting-without-recovery',
    mechanism: 'between kid drop-off and kid pickup the parent never gets the room they need to refill — admin / work / errand chain',
    observable_symptoms: ['toys still visible', 'parent doing two things at once', 'no scene-cue of solo rest'],
    emotional_outputs: ['depletion without restoration', 'parent guilt', 'no recovery between shifts'],
    briefHint: 'living-room or kitchen scene where the kid is implied but not in frame — the parent has not been alone with themselves yet',
    family_anchors: ['fatigue', 'collapse'],
    core_anchors: ['depletion', 'silent-burnout', 'invisible-pressure'],
    state_anchors: ['exhausted-parenting'],
  },
  'work-home-boundary-collapse': {
    id: 'work-home-boundary-collapse',
    mechanism: 'laptops + slack on phone + flexible hours dissolve the moment when work ends — there is no off-switch',
    observable_symptoms: ['laptop on the kitchen table', 'slack visible at 21:00', 'pyjamas at the desk'],
    emotional_outputs: ['inability to land', 'silent burnout', 'home becomes office'],
    briefHint: 'the work surface is in a NON-WORK ROOM — laptop on the bed, slack open at dinner, a deck on a couch',
    family_anchors: ['pressure', 'fatigue'],
    core_anchors: ['silent-burnout', 'inability-to-land', 'too-tired-to-rest'],
    state_anchors: ['startup-burnout', 'forced-productivity', 'overwhelmed-founder'],
  },
  'passive-entertainment-overload': {
    id: 'passive-entertainment-overload',
    mechanism: 'consumption replaces decompression — the body sits still, the mind takes on more input than it had at work',
    observable_symptoms: ['evening hours spent in front of a screen', 'no quiet between work and sleep', 'background TV + phone scroll'],
    emotional_outputs: ['recovery failure', 'fake rest', 'consumption-as-coping'],
    briefHint: 'subject sat on the couch with screen on AND phone in hand — neither watched, both running',
    family_anchors: ['fatigue', 'numbness'],
    core_anchors: ['digital-fatigue', 'emotional-numbness', 'too-tired-to-rest'],
    state_anchors: ['exhausted-scrolling', 'doomscroll-fatigue'],
  },
  'notification-fragmentation': {
    id: 'notification-fragmentation',
    mechanism: 'each notification is a tiny attentional drain — the cumulative effect is the day arriving in pieces',
    observable_symptoms: ['notification stack visible', 'lockscreen full', 'subject reaching for the phone mid-other-action'],
    emotional_outputs: ['attention fragmentation', 'reflex without attention', 'low-grade anxiety'],
    briefHint: 'phone visible with multiple unread badges — and the subject is doing something else, lifting their head only when one lights up',
    family_anchors: ['fragmentation', 'overstimulation'],
    core_anchors: ['overconnected-exhaustion', 'digital-fatigue', 'hidden-anxiety'],
    state_anchors: ['constant-notifications', 'attention-fragmentation', 'too-many-tabs'],
  },
  'social-performance-pressure': {
    id: 'social-performance-pressure',
    mechanism: 'feeds + stories + reels turn personal life into ongoing public output — "what do i post" replaces "what do i do"',
    observable_symptoms: ['composing a story while at the event', 'taking the photo before living the moment', 'editing captions'],
    emotional_outputs: ['social performance exhaustion', 'connection-as-performance', 'loneliness while connected'],
    briefHint: 'subject mid-event with the phone up, framing what they have not yet experienced — the experience is the post',
    family_anchors: ['overstimulation', 'numbness'],
    core_anchors: ['social-performance-exhaustion', 'loneliness-in-public', 'hyper-awareness'],
    state_anchors: ['social-exhaustion', 'low-social-battery', 'mentally-absent'],
  },
  'productivity-identity': {
    id: 'productivity-identity',
    mechanism: 'self-worth tied to output — when nothing is being produced the person does not know who they are',
    observable_symptoms: ['work continues after work', 'restless when not productive', 'cannot tolerate idle time'],
    emotional_outputs: ['silent burnout', 'cannot rest without guilt', 'identity collapse when not working'],
    briefHint: 'subject IS the work — laptop or notebook is visible, and the subject is uncomfortable when neither is in their hands',
    family_anchors: ['pressure', 'fatigue'],
    core_anchors: ['silent-burnout', 'invisible-pressure', 'guilt'],
    state_anchors: ['startup-burnout', 'tired-ambition', 'forced-productivity'],
  },
  'endless-self-improvement-loop': {
    id: 'endless-self-improvement-loop',
    mechanism: 'every aspect of the self becomes a project — meditation app, sleep app, productivity system, focus method',
    observable_symptoms: ['multiple wellness apps visible', 'morning routine in 14 steps', 'subject reading another self-help book they will not finish'],
    emotional_outputs: ['optimization fatigue', 'never enough', 'identity as project'],
    briefHint: 'visible wellness object (book / app / journal) that has not been picked up in a week',
    family_anchors: ['pressure', 'paralysis'],
    core_anchors: ['invisible-pressure', 'hidden-anxiety', 'depletion'],
    state_anchors: ['decision-fatigue', 'creative-paralysis', 'forced-productivity'],
  },
};

export interface SystemicMatch {
  primary: SystemicCauseRecord | null;
  secondary: SystemicCauseRecord | null;
  match_strength: number;
}

export interface SystemicCauseReading {
  matched_systems: SystemicMatch;
  /** True when at least one system clearly maps to the candidate. */
  has_systemic_cause: boolean;
  /** 0..10 — how strongly the banner is grounded in a structural cause. */
  causal_clarity: number;
  /** Plain-text answer to the spec's headline question. */
  caused_by_modern_system: string;
  notes: string[];
}

export interface SystemicCauseInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function matchSystemicCause(input: SystemicCauseInput): SystemicCauseReading {
  const { state, truth, emotionalCore } = input;
  const notes: string[] = [];

  // Score every system against the candidate. Higher = stronger match.
  const scored: Array<{ system: SystemicCauseRecord; score: number }> = [];
  for (const id of Object.keys(SYSTEMIC_PRESSURE_MAP) as SystemicSystem[]) {
    const system = SYSTEMIC_PRESSURE_MAP[id];
    let score = 0;
    if (system.state_anchors.includes(state.id)) score += 5;
    if (emotionalCore && system.core_anchors.includes(emotionalCore.id)) score += 4;
    if (system.family_anchors.includes(state.family)) score += 2;
    // The truth's tokens contributing to symptom recognition.
    const truthLower = truth.truth.toLowerCase();
    for (const sym of system.observable_symptoms) {
      const tokens = sym.toLowerCase().split(/\s+/).filter((t) => t.length > 4);
      if (tokens.some((t) => truthLower.includes(t))) {
        score += 1;
        break;
      }
    }
    if (score > 0) scored.push({ system, score });
  }
  scored.sort((a, b) => b.score - a.score);

  const primary = scored[0]?.system ?? null;
  const secondary = scored[1]?.system ?? null;
  const match_strength = scored[0]?.score ?? 0;

  const has_systemic_cause = match_strength >= 4;
  // Causal clarity scales with the match strength — capped at 10.
  const causal_clarity = Math.min(10, match_strength * 1.4);

  const caused_by_modern_system = primary
    ? `caused by: ${primary.id} — ${primary.mechanism}`
    : 'no clear systemic cause — banner reads as feeling without machinery';

  if (primary) notes.push(`primary cause: ${primary.id}`);
  if (secondary && secondary.id !== primary?.id) notes.push(`secondary cause: ${secondary.id}`);
  if (!has_systemic_cause) notes.push('banner is emotionally described but structurally uncaused');

  return {
    matched_systems: { primary, secondary, match_strength },
    has_systemic_cause,
    causal_clarity,
    caused_by_modern_system,
    notes,
  };
}
