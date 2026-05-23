/**
 * LIVE IMPACT DETECTOR (Phase 293 — Wave 14: Live Civilization Coupling)
 *
 * Detects, in real time, whether the organism's existence is
 * demonstrably changing reality — the deepest question of Wave 14.
 */

export interface LiveImpactDetectionReading {
  /** True when reality has demonstrably changed because the brand existed. */
  reality_demonstrably_changed: boolean;
  /** 0..10 — strength of the detected impact. */
  impact_strength: number;
  reality_change_summary: string;
  notes: string[];
}

export interface LiveImpactDetectionInput {
  trustVelocityPositive: boolean;
  meaningCarried: boolean;
  narrativeIsSpreading: boolean;
  brandIsPresent: boolean;
}

export function readLiveImpactDetector(input: LiveImpactDetectionInput): LiveImpactDetectionReading {
  const { trustVelocityPositive, meaningCarried, narrativeIsSpreading, brandIsPresent } = input;
  const notes: string[] = [];

  const signalCount = [trustVelocityPositive, meaningCarried, narrativeIsSpreading, brandIsPresent].filter(Boolean).length;
  const impact_strength = round1(signalCount * 2.5);
  const reality_demonstrably_changed = signalCount >= 3;

  const reality_change_summary = !reality_demonstrably_changed
    ? 'reality is unchanged this cycle — the brand spoke but reality did not move'
    : narrativeIsSpreading && meaningCarried
      ? 'a piece of meaning is being carried into reality by people who were not the brand'
      : trustVelocityPositive
        ? 'trust moved toward the brand this cycle — a small but real change in the field'
        : 'the brand is demonstrably present in a place it was not before';

  notes.push(`live impact detector: ${reality_demonstrably_changed ? 'reality CHANGED' : 'reality unchanged'} (${impact_strength}/10)`);
  return { reality_demonstrably_changed, impact_strength, reality_change_summary, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
