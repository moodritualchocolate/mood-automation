/**
 * CULTURAL TIMING ENGINE (Phase 38 — Temporal Intelligence / Wave 4)
 *
 * Reads the BROADER cultural moment — collective tension, anxiety
 * cycles, periods when an audience psychologically cannot receive a
 * given emotional register. Some weeks the culture cannot take
 * softness; some weeks it cannot take intensity.
 */

export type CulturalPeriod =
  | 'calm' | 'low-grade-anxiety' | 'high-collective-stress' | 'collective-exhaustion';

export interface CulturalTimingReading {
  period: CulturalPeriod;
  /** 0..10 — how much the culture can receive softness right now. */
  can_receive_softness: number;
  /** 0..10 — how much the culture can receive intensity right now. */
  can_receive_intensity: number;
  /** True when the culture cannot emotionally receive the candidate. */
  timing_blocked: boolean;
  notes: string[];
}

export interface CulturalTimingInput {
  /** 0..10 — collective tension (from the world-state; defaults mid). */
  collectiveTension?: number;
  /** 0..10 — collective exhaustion (from the world-state; defaults mid). */
  collectiveExhaustion?: number;
  /** The emotional register the candidate banner carries. */
  candidateRegister: 'soft' | 'intense' | 'neutral';
}

export function readCulturalTiming(input: CulturalTimingInput): CulturalTimingReading {
  const collectiveTension = input.collectiveTension ?? 5;
  const collectiveExhaustion = input.collectiveExhaustion ?? 5;
  const { candidateRegister } = input;
  const notes: string[] = [];

  let period: CulturalPeriod;
  if (collectiveTension >= 7 && collectiveExhaustion >= 7) period = 'collective-exhaustion';
  else if (collectiveTension >= 7) period = 'high-collective-stress';
  else if (collectiveTension >= 4.5) period = 'low-grade-anxiety';
  else period = 'calm';

  // In high stress, the culture cannot receive intensity; in
  // exhaustion, it cannot receive demanding softness either.
  const can_receive_intensity = round1(clamp10(10 - collectiveTension * 0.9));
  const can_receive_softness = round1(clamp10(10 - collectiveExhaustion * 0.55));

  let timing_blocked = false;
  if (candidateRegister === 'intense' && can_receive_intensity < 4) timing_blocked = true;
  if (candidateRegister === 'soft' && can_receive_softness < 3) timing_blocked = true;

  notes.push(`cultural timing: ${period} — can receive softness ${can_receive_softness}/10, intensity ${can_receive_intensity}/10`);
  if (timing_blocked) {
    notes.push(`cultural timing: the culture psychologically cannot receive a "${candidateRegister}" banner right now`);
  }

  return { period, can_receive_softness, can_receive_intensity, timing_blocked, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
