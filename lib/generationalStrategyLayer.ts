/**
 * GENERATIONAL STRATEGY LAYER (Phase 174 — Wave 11: Strategic Future Intelligence)
 *
 * The longest horizon of all: a strategy that outlives the generation
 * that made it. This layer asks whether the organism is building
 * something that survives past its current self — or only serving the
 * generation in front of it.
 */

export interface GenerationalStrategyReading {
  /** Roughly how many generations ahead the strategy reaches. */
  generational_horizon: number;
  /** True when the strategy would outlive the current generation. */
  strategy_outlives_generation: boolean;
  generational_note: string;
  notes: string[];
}

export interface GenerationalStrategyInput {
  /** The civilization's current generation. */
  civilizationGeneration: number;
  /** 0..10 — compounding advantage being built. */
  compoundingAdvantage: number;
  /** True when identity is projected to survive the horizon. */
  identitySurvivesHorizon: boolean;
}

export function readGenerationalStrategy(input: GenerationalStrategyInput): GenerationalStrategyReading {
  const { civilizationGeneration, compoundingAdvantage, identitySurvivesHorizon } = input;
  const notes: string[] = [];

  // The horizon reaches further the more advantage compounds and the
  // more securely identity carries.
  let generational_horizon = 1;
  generational_horizon += compoundingAdvantage >= 6 ? 2 : compoundingAdvantage >= 4 ? 1 : 0;
  generational_horizon += identitySurvivesHorizon ? 1 : 0;

  const strategy_outlives_generation = generational_horizon >= 3 && identitySurvivesHorizon;

  const generational_note = strategy_outlives_generation
    ? `the strategy reaches ~${generational_horizon} generations ahead — it is building something that outlives this self`
    : !identitySurvivesHorizon
      ? 'the strategy cannot outlive the generation — the identity would not carry that far'
      : 'the strategy serves the current generation — it is not yet building past itself';

  notes.push(`generational strategy layer: horizon ~${generational_horizon} generations (now at gen ${civilizationGeneration}) — ${generational_note}`);
  return { generational_horizon, strategy_outlives_generation, generational_note, notes };
}
