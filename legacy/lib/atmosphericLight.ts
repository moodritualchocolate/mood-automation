/**
 * ATMOSPHERIC LIGHT ENGINE (Phase 7)
 *
 * Lighting is psychology, not aesthetics.
 *
 * Maps the human state's family + cultural micro-moment + time anchor
 * to a NAMED light behavior the image brief honours:
 *
 *   fluorescent-depletion      — office at 16:30, body too tired to leave
 *   phone-glow-loneliness      — bed at 23:51, blue light on face
 *   refrigerator-isolation     — kitchen at 02:00, single cold light
 *   late-office-warmth         — one desk lamp left on, the building dark
 *   cold-morning-detachment    — pre-coffee window, grey-blue
 *   sunset-emotional-pause     — late afternoon window, warm but ambivalent
 *   sleepless-blue             — 03:00 bedroom, monitor blue without warmth
 *   overcast-flattening        — daylight without theatre, everything flat
 *   amber-doorway              — single tungsten through a doorway, all
 *                                 else in shadow — depletion-with-witness
 *   train-stutter              — passing platform lights across face
 *
 * The engine never invents a light source the scene cannot earn.
 */

import type { HumanState } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type LightBehavior =
  | 'fluorescent-depletion'
  | 'phone-glow-loneliness'
  | 'refrigerator-isolation'
  | 'late-office-warmth'
  | 'cold-morning-detachment'
  | 'sunset-emotional-pause'
  | 'sleepless-blue'
  | 'overcast-flattening'
  | 'amber-doorway'
  | 'train-stutter'
  | 'window-soft-warm'
  | 'monitor-cool-only';

export interface AtmosphericLight {
  behavior: LightBehavior;
  /** One-line direction the image brief inherits verbatim. */
  briefLine: string;
  /** The psychological state this lighting represents. */
  psychological_meaning: string;
  /** Color-temperature kelvin estimate — for downstream image providers. */
  kelvinEstimate: number;
  /** Direction count + character. */
  source: 'single' | 'mixed' | 'ambient' | 'screen';
}

const LIGHT_LIBRARY: Record<LightBehavior, Omit<AtmosphericLight, 'behavior'>> = {
  'fluorescent-depletion': {
    briefLine: 'overhead fluorescent only, even, no shadow definition — the absence of theatre, the kind of light no one chose',
    psychological_meaning: 'institutional exhaustion — the body is here because it has to be',
    kelvinEstimate: 4200,
    source: 'ambient',
  },
  'phone-glow-loneliness': {
    briefLine: 'phone is the only light source, blue across the face, the rest of the room in shadow',
    psychological_meaning: 'connection-without-presence; reachable, unreachable',
    kelvinEstimate: 7000,
    source: 'screen',
  },
  'refrigerator-isolation': {
    briefLine: 'cold light from below (an open fridge), the kitchen behind in darkness',
    psychological_meaning: 'looking for something that is not in the fridge',
    kelvinEstimate: 4000,
    source: 'single',
  },
  'late-office-warmth': {
    briefLine: 'one tungsten desk lamp lit, the rest of the open-plan dark — a small warm island in an empty floor',
    psychological_meaning: 'ambition outliving the team',
    kelvinEstimate: 3000,
    source: 'single',
  },
  'cold-morning-detachment': {
    briefLine: 'pre-7am window light, blue-grey, no sun yet, the room not warmed up',
    psychological_meaning: 'arrival not yet completed — body up, self still asleep',
    kelvinEstimate: 6000,
    source: 'ambient',
  },
  'sunset-emotional-pause': {
    briefLine: 'late afternoon window light across a room, warm but slightly accusing, long shadows',
    psychological_meaning: 'the day will end whether or not anything got done',
    kelvinEstimate: 2700,
    source: 'single',
  },
  'sleepless-blue': {
    briefLine: 'bedroom past 02:00, monitor or phone the only light, no warmth allowed in the frame',
    psychological_meaning: 'tired but wired — the day refused to end',
    kelvinEstimate: 7500,
    source: 'screen',
  },
  'overcast-flattening': {
    briefLine: 'natural daylight, overcast, no shadows worth speaking of — everything flat, like a feeling that has no word',
    psychological_meaning: 'emotional drift — not sad, not fine',
    kelvinEstimate: 6500,
    source: 'ambient',
  },
  'amber-doorway': {
    briefLine: 'a single tungsten bulb through a doorway, the room beyond bright, this room dim',
    psychological_meaning: 'someone is there, the subject has not joined yet',
    kelvinEstimate: 2900,
    source: 'single',
  },
  'train-stutter': {
    briefLine: 'passing platform lights stutter across the face — flicker rhythm, not steady illumination',
    psychological_meaning: 'transit as a state of being',
    kelvinEstimate: 4500,
    source: 'mixed',
  },
  'window-soft-warm': {
    briefLine: 'one window, soft warm afternoon light raking across the body, the rest of the room shadowed',
    psychological_meaning: 'observed, not posed — life caught at low intensity',
    kelvinEstimate: 3400,
    source: 'single',
  },
  'monitor-cool-only': {
    briefLine: 'monitor glow on face, room around the subject lit only by the screen, slight chromatic flicker',
    psychological_meaning: 'attention given to a thing that does not give attention back',
    kelvinEstimate: 6800,
    source: 'screen',
  },
};

export interface LightSelectInput {
  state: HumanState;
  emotionalCore: EmotionalCore | null;
  /** Free-form micro-moment id ('fridge-open-at-night', etc.) — optional. */
  microMomentId: string | null;
}

export function selectAtmosphericLight(input: LightSelectInput): AtmosphericLight {
  const { state, emotionalCore, microMomentId } = input;

  // Cultural micro-moment is the strongest signal — when present, it
  // names the light directly.
  if (microMomentId) {
    if (microMomentId === 'fridge-open-at-night') return wrap('refrigerator-isolation');
    if (microMomentId === 'bed-scrolling' || microMomentId === 'late-kitchen-silence') return wrap('sleepless-blue');
    if (microMomentId === 'startup-late-night') return wrap('late-office-warmth');
    if (microMomentId === 'office-fluorescent' || microMomentId === 'office-1647-brain-death') return wrap('fluorescent-depletion');
    if (microMomentId === 'train-ride-silence') return wrap('train-stutter');
    if (microMomentId === 'saturday-stillness') return wrap('window-soft-warm');
    if (microMomentId === 'reserves-fatigue' || microMomentId === 'parenting-overload') return wrap('window-soft-warm');
    if (microMomentId === 'car-after-work') return wrap('amber-doorway');
    if (microMomentId === 'no-energy-for-people') return wrap('amber-doorway');
    if (microMomentId === 'overstimulated-tabs' || microMomentId === 'zoning-out' || microMomentId === 'staring-without-processing') return wrap('monitor-cool-only');
    if (microMomentId === 'unread-whatsapp' || microMomentId === 'avoiding-messages') return wrap('phone-glow-loneliness');
  }

  // Emotional core fallback.
  if (emotionalCore) {
    if (emotionalCore.id === 'depletion' || emotionalCore.id === 'silent-burnout') return wrap('late-office-warmth');
    if (emotionalCore.id === 'doomscrolling' || emotionalCore.id === 'too-tired-to-rest' || emotionalCore.id === 'revenge-bedtime-procrastination') return wrap('sleepless-blue');
    if (emotionalCore.id === 'loneliness-in-public') return wrap('train-stutter');
    if (emotionalCore.id === 'emotional-drift' || emotionalCore.id === 'emotional-numbness') return wrap('overcast-flattening');
    if (emotionalCore.id === 'hyper-awareness' || emotionalCore.id === 'hidden-anxiety') return wrap('cold-morning-detachment');
    if (emotionalCore.id === 'digital-fatigue') return wrap('phone-glow-loneliness');
  }

  // Family fallback — the family controls warmth more than time.
  switch (state.family) {
    case 'collapse':
    case 'fatigue':       return wrap('sunset-emotional-pause');
    case 'overstimulation': return wrap('fluorescent-depletion');
    case 'numbness':
    case 'paralysis':     return wrap('overcast-flattening');
    case 'pressure':      return wrap('late-office-warmth');
    case 'fragmentation': return wrap('monitor-cool-only');
    case 'avoidance':     return wrap('cold-morning-detachment');
    default:              return wrap('window-soft-warm');
  }
}

function wrap(behavior: LightBehavior): AtmosphericLight {
  return { behavior, ...LIGHT_LIBRARY[behavior] };
}
