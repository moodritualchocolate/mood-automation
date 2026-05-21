/**
 * TYPOGRAPHY PSYCHOLOGY ENGINE (Phase 7)
 *
 * Typography is not decoration. It is the mental state of the
 * subject made visible in the layout.
 *
 *   overstimulation       → fragmented placement, broken line breaks
 *   silence (numbness)    → restrained spacing, single short line
 *   emotional collapse    → low-position typography (sinks to bottom)
 *   tension               → compressed density, tight tracking
 *   exhaustion            → weak visual pressure (low contrast, thin weight)
 *   clarity               → clean breathing rhythm (rare in ENERGY)
 *
 * The engine returns a typography MODULATION applied on top of the
 * Phase 2 typography plan. It does not rewrite the text — it adjusts
 * the placement / spacing / weight so the typography FEELS the way
 * the subject feels.
 */

import type { CompositionPlan, CreativeDirection, HumanState, TypographyPlan } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export type TypographyPosture =
  | 'fragmented'
  | 'restrained'
  | 'sunken'
  | 'compressed'
  | 'weak-pressure'
  | 'breathing'
  | 'intruded';

export interface TypographyPsychologyPlan {
  posture: TypographyPosture;
  psychological_meaning: string;
  /** Modifications to apply to the existing TypographyPlan. */
  modulations: {
    /** Override the primary y-position (0..1) when set. */
    primaryYOverride: number | null;
    /** Multiplier on primary text size (0..1.4). */
    primarySizeMultiplier: number;
    /** Override weight when set. */
    primaryWeightOverride: number | null;
    /** Multiplier on letter-spacing in em (e.g. 1.5 = wider). */
    trackingMultiplier: number;
    /** Multiplier on leading. */
    leadingMultiplier: number;
    /** Force-drop the secondary line. */
    dropSecondary: boolean;
    /** Render the primary with a "fragmented" line-break treatment. */
    fragmentedLineBreaks: boolean;
    /** Reduce opacity of the primary to suggest weakness. */
    primaryOpacity: number;
  };
}

export interface TypographyPsychologyInput {
  state: HumanState;
  emotionalCore: EmotionalCore | null;
  direction: CreativeDirection;
  typography: TypographyPlan;
  composition: CompositionPlan;
}

export function planTypographyPsychology(input: TypographyPsychologyInput): TypographyPsychologyPlan {
  const { state, emotionalCore } = input;

  // Posture decision — emotional core takes precedence; state family is fallback.
  let posture: TypographyPosture = 'restrained';
  let meaning = 'restraint is the default voice';

  if (emotionalCore) {
    switch (emotionalCore.id) {
      case 'overstimulation':
      case 'emotional-fragmentation':
      case 'overstimulated-but-flat':
        posture = 'fragmented';
        meaning = 'attention is broken — the type breaks with it';
        break;
      case 'emotional-numbness':
      case 'emotional-drift':
      case 'too-tired-to-rest':
        posture = 'restrained';
        meaning = 'nothing is moving — the type does not move either';
        break;
      case 'depletion':
      case 'functional-collapse':
        posture = 'sunken';
        meaning = 'body sinks low — type sinks with it';
        break;
      case 'invisible-pressure':
      case 'hyper-awareness':
        posture = 'compressed';
        meaning = 'weight pressing forward — type compresses under the load';
        break;
      case 'silent-burnout':
        posture = 'weak-pressure';
        meaning = 'still functional, no longer pushing — type loses contrast';
        break;
      case 'hidden-anxiety':
        posture = 'intruded';
        meaning = 'public surface, private storm — type breaks into the frame from one edge';
        break;
      default:
        posture = 'restrained';
    }
  } else {
    // State family fallback.
    switch (state.family) {
      case 'overstimulation':
      case 'fragmentation': posture = 'fragmented'; meaning = 'attention is broken — the type breaks with it'; break;
      case 'collapse':
      case 'fatigue':       posture = 'sunken'; meaning = 'body sinks low — type sinks with it'; break;
      case 'pressure':      posture = 'compressed'; meaning = 'weight pressing forward — type compresses'; break;
      case 'numbness':
      case 'paralysis':     posture = 'restrained'; meaning = 'nothing moves — the type does not move'; break;
      case 'avoidance':     posture = 'weak-pressure'; meaning = 'subject slides away — the type loses force'; break;
      default:              posture = 'restrained';
    }
  }

  // Translate posture → modulations.
  const m = postureToModulations(posture);
  return { posture, psychological_meaning: meaning, modulations: m };
}

function postureToModulations(posture: TypographyPosture): TypographyPsychologyPlan['modulations'] {
  switch (posture) {
    case 'fragmented':
      return {
        primaryYOverride: null,
        primarySizeMultiplier: 0.95,
        primaryWeightOverride: null,
        trackingMultiplier: 1.3,
        leadingMultiplier: 1.25,
        dropSecondary: false,
        fragmentedLineBreaks: true,
        primaryOpacity: 0.92,
      };
    case 'restrained':
      return {
        primaryYOverride: null,
        primarySizeMultiplier: 1.0,
        primaryWeightOverride: 400,
        trackingMultiplier: 1.0,
        leadingMultiplier: 1.05,
        dropSecondary: true,
        fragmentedLineBreaks: false,
        primaryOpacity: 0.95,
      };
    case 'sunken':
      return {
        primaryYOverride: 0.86,       // anchor low in the frame
        primarySizeMultiplier: 0.92,
        primaryWeightOverride: 400,
        trackingMultiplier: 1.0,
        leadingMultiplier: 1.1,
        dropSecondary: true,
        fragmentedLineBreaks: false,
        primaryOpacity: 0.88,
      };
    case 'compressed':
      return {
        primaryYOverride: null,
        primarySizeMultiplier: 1.04,
        primaryWeightOverride: 600,
        trackingMultiplier: 0.75,     // tight tracking
        leadingMultiplier: 0.95,
        dropSecondary: false,
        fragmentedLineBreaks: false,
        primaryOpacity: 1.0,
      };
    case 'weak-pressure':
      return {
        primaryYOverride: null,
        primarySizeMultiplier: 0.9,
        primaryWeightOverride: 300,
        trackingMultiplier: 1.0,
        leadingMultiplier: 1.15,
        dropSecondary: true,
        fragmentedLineBreaks: false,
        primaryOpacity: 0.7,
      };
    case 'breathing':
      return {
        primaryYOverride: null,
        primarySizeMultiplier: 1.0,
        primaryWeightOverride: 400,
        trackingMultiplier: 1.15,
        leadingMultiplier: 1.25,
        dropSecondary: false,
        fragmentedLineBreaks: false,
        primaryOpacity: 0.95,
      };
    case 'intruded':
      return {
        primaryYOverride: null,
        primarySizeMultiplier: 1.0,
        primaryWeightOverride: 500,
        trackingMultiplier: 0.9,
        leadingMultiplier: 1.0,
        dropSecondary: true,
        fragmentedLineBreaks: false,
        primaryOpacity: 1.0,
      };
  }
}

/** Apply the modulations to a typography plan, returning a new plan. */
export function applyTypographyPsychology(
  typography: TypographyPlan,
  plan: TypographyPsychologyPlan,
): TypographyPlan {
  const m = plan.modulations;
  return {
    ...typography,
    primary: {
      ...typography.primary,
      size: Math.round(typography.primary.size * m.primarySizeMultiplier),
      weight: m.primaryWeightOverride ?? typography.primary.weight,
      tracking: typography.primary.tracking * m.trackingMultiplier,
      leading: typography.primary.leading * m.leadingMultiplier,
    },
    secondary: m.dropSecondary ? null : typography.secondary,
  };
}
