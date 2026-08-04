/**
 * EMOTIONAL RESOURCE MANAGEMENT (Phase 82 — Wave 7: Reality Organism)
 *
 * The organism's emotional intensity is a finite resource. A campaign
 * that spends its strongest emotion on every banner has nothing left
 * for the moment that matters. This module manages the emotional
 * budget — how much intensity this run may spend.
 */

export type EmotionalSpend = 'reserve' | 'modest' | 'considered' | 'full-intensity';

export interface EmotionalResourceReading {
  spend: EmotionalSpend;
  /** 0..10 — emotional intensity budget for this run. */
  intensity_budget: number;
  /** True when the organism is overspending its emotional resource. */
  overspending: boolean;
  notes: string[];
}

export interface EmotionalResourceInput {
  /** 0..10 — the organism's stress accumulation. */
  stress: number;
  /** 0..10 — how strategically worth-it this run is. */
  strategicWeight: number;
  /** 0..10 — recent emotional intensity already spent (repetition risk). */
  recentIntensity: number;
}

export function readEmotionalResourceManagement(input: EmotionalResourceInput): EmotionalResourceReading {
  const { stress, strategicWeight, recentIntensity } = input;
  const notes: string[] = [];

  // Budget — high strategic weight earns intensity; high recent
  // intensity and stress force reserve.
  let intensity_budget = strategicWeight * 0.6 - recentIntensity * 0.3 - stress * 0.15 + 3;
  intensity_budget = round1(Math.max(0, Math.min(10, intensity_budget)));

  const spend: EmotionalSpend =
    intensity_budget >= 7.5 ? 'full-intensity' :
    intensity_budget >= 5 ? 'considered' :
    intensity_budget >= 3 ? 'modest' : 'reserve';

  // Overspending — the run wants full intensity but the budget is low.
  const overspending = strategicWeight >= 7 && intensity_budget < 5 && recentIntensity >= 6;

  notes.push(`emotional resource management: ${spend} (intensity budget ${intensity_budget}/10)`);
  if (overspending) notes.push('emotional resource management: the organism is overspending its emotional resource — save intensity for the moment that matters');

  return { spend, intensity_budget, overspending, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
