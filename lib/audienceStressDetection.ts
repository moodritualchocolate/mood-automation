/**
 * AUDIENCE STRESS DETECTION (Phase 264 — Wave 14: Live Civilization Coupling)
 *
 * Stress shows up in audience signals before fatigue does. This
 * module detects rising stress in real time, so the organism can
 * back off before harm is done.
 */

export type AudienceStressLevel = 'low' | 'moderate' | 'high' | 'acute';

export interface AudienceStressReading {
  stress_level: AudienceStressLevel;
  /** 0..10 — live audience stress score. */
  stress_score: number;
  /** True when the audience is too stressed to receive another action. */
  too_stressed_to_act_on: boolean;
  notes: string[];
}

export interface AudienceStressInput {
  /** 0..10 — instantaneous emotional intensity of incoming reactions. */
  liveIntensity: number;
  /** 0..10 — collective exhaustion proxy. */
  collectiveExhaustion: number;
  /** 0..10 — variance in the sentiment field (polarised = stressed). */
  sentimentVariance: number;
}

export function readAudienceStressDetection(input: AudienceStressInput): AudienceStressReading {
  const { liveIntensity, collectiveExhaustion, sentimentVariance } = input;
  const notes: string[] = [];

  const stress_score = round1(Math.min(10, liveIntensity * 0.4 + collectiveExhaustion * 0.4 + sentimentVariance * 0.3));

  const stress_level: AudienceStressLevel =
    stress_score >= 8 ? 'acute' :
    stress_score >= 6 ? 'high' :
    stress_score >= 4 ? 'moderate' : 'low';

  const too_stressed_to_act_on = stress_level === 'acute' || stress_level === 'high';

  notes.push(`audience stress detection: ${stress_level} (${stress_score}/10)` +
    (too_stressed_to_act_on ? ' — TOO STRESSED for another action' : ''));
  return { stress_level, stress_score, too_stressed_to_act_on, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
