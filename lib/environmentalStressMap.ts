/**
 * ENVIRONMENTAL STRESS MAP (Phase 42 — World-State Executive Brain / Wave 4)
 *
 * Maps the structural environmental stressors the audience is living
 * inside — economic pressure and digital overload. These are not
 * moods; they are the pressure systems the moods form within.
 */

import type { IngestedSignal } from './realityIngestion';

export interface EnvironmentalStressReading {
  economic_pressure: number;        // 0..10
  digital_overload: number;         // 0..10
  environmental_stress: number;     // 0..10 — composite
  notes: string[];
}

export interface EnvironmentalStressInput {
  ingestedSignals: IngestedSignal[];
}

const ECONOMIC_RX = /\b(money|rent|bills|afford|expensive|cost of living|paycheck|debt|raise|layoff|fired|broke)\b|(כסף|שכר דירה|יוקר המחיה|פיטורים)/i;
const DIGITAL_RX = /\b(notification|scroll|feed|screen|app|inbox|tabs|online|phone|doomscroll|overstimulated)\b|(התראות|מסך|פיד|אונליין)/i;

export function readEnvironmentalStress(input: EnvironmentalStressInput): EnvironmentalStressReading {
  const { ingestedSignals } = input;
  const notes: string[] = [];
  const total = Math.max(1, ingestedSignals.length);

  let economicHits = 0, digitalHits = 0;
  for (const s of ingestedSignals) {
    if (ECONOMIC_RX.test(s.text)) economicHits += 1;
    if (DIGITAL_RX.test(s.text)) digitalHits += 1;
  }

  const economic_pressure = round1(clamp10(4 + (economicHits / total) * 14));
  // Digital overload runs structurally high in modern life.
  const digital_overload = round1(clamp10(5.5 + (digitalHits / total) * 12));
  const environmental_stress = round1((economic_pressure + digital_overload) / 2);

  notes.push(`environmental stress: economic ${economic_pressure}/10, digital overload ${digital_overload}/10`);
  return { economic_pressure, digital_overload, environmental_stress, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
