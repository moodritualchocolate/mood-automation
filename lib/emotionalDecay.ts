/**
 * EMOTIONAL DECAY (Phase 15)
 *
 * Some emotional truths expire. The system must detect when a truth
 * that USED to land has become DECORATIVE culture — when it has
 * been seen so many times it produces aesthetic recognition instead
 * of lived recognition. The spec named the failure modes:
 *
 *   trendy anxiety
 *   aesthetic burnout
 *   cinematic loneliness
 *
 * The engine reads:
 *   - the truth persistence store (how many times this truth has
 *     been said)
 *   - the truth's average aftertaste over time (is it declining?)
 *   - the cultural drift detector (Phase 12) for known consumed
 *     treatments
 *
 * Decay statuses:
 *   fresh       — truth has not been said too often AND aftertaste
 *                 is holding or rising
 *   aging       — truth has been said multiple times AND aftertaste
 *                 is declining
 *   decorative  — truth has been said many times AND aftertaste has
 *                 declined significantly, OR the treatment is in
 *                 the consumed-treatments list
 */

import type { TruthPersistenceEntry } from './truthPersistence';
import type { AftertasteRecord } from './aftertaste';
import type { DriftReading as CulturalDriftReading } from './culturalDrift';

export type DecayStatus = 'fresh' | 'aging' | 'decorative';

export interface DecayReading {
  status: DecayStatus;
  /** 0..10 — higher = more decayed. */
  decay_score: number;
  /** The dominant failure if status === 'decorative'. */
  decorative_mode: 'trendy-anxiety' | 'aesthetic-burnout' | 'cinematic-loneliness' | 'overused-truth' | 'consumed-treatment' | null;
  notes: string[];
}

export interface DecayInput {
  /** The candidate's truth persistence entry (if it exists). */
  persistenceEntry: TruthPersistenceEntry | null;
  /** Recent aftertaste records for the same truth, oldest first. */
  truthAftertasteRecords?: AftertasteRecord[];
  /** Cultural drift reading for the current banner. */
  culturalDrift: CulturalDriftReading;
  /** Free-text current truth — used to detect the named decorative
   *  modes (trendy anxiety / aesthetic burnout / cinematic loneliness). */
  truthText: string;
}

export function readEmotionalDecay(input: DecayInput): DecayReading {
  const { persistenceEntry, truthAftertasteRecords = [], culturalDrift, truthText } = input;
  const notes: string[] = [];

  // ─── decay-from-overuse ──────────────────────────────────────
  let overuseDecay = 0;
  if (persistenceEntry) {
    // count >= 4 starts to read as repetition.
    if (persistenceEntry.count >= 4) overuseDecay += 2.5;
    if (persistenceEntry.count >= 6) overuseDecay += 2;
    if (persistenceEntry.count >= 9) overuseDecay += 2.5;
    if (persistenceEntry.averageAftertaste < 5 && persistenceEntry.count >= 3) overuseDecay += 1.5;
  }

  // ─── decay-from-aftertaste-trend ─────────────────────────────
  let trendDecay = 0;
  if (truthAftertasteRecords.length >= 3) {
    const sorted = truthAftertasteRecords.slice().sort((a, b) => a.shippedAt - b.shippedAt);
    const half = Math.floor(sorted.length / 2);
    const earlyAvg = sorted.slice(0, half).reduce((a, b) => a + b.residueStrength, 0) / Math.max(half, 1);
    const lateAvg = sorted.slice(half).reduce((a, b) => a + b.residueStrength, 0) / Math.max(sorted.length - half, 1);
    if (lateAvg < earlyAvg - 1.5) {
      trendDecay = Math.min(3, (earlyAvg - lateAvg) * 0.8);
      notes.push(`aftertaste declining: ${earlyAvg.toFixed(1)} → ${lateAvg.toFixed(1)} over ${sorted.length} samples`);
    }
  }

  // ─── decay-from-cultural-consumption ─────────────────────────
  let consumedDecay = 0;
  if (culturalDrift.feels_culturally_consumed) {
    consumedDecay = 3;
    notes.push(`cultural drift: treatment is in mass circulation (${culturalDrift.detected_cliches.join(', ')})`);
  }

  // ─── detect the spec's named decorative modes ────────────────
  let decorative_mode: DecayReading['decorative_mode'] = null;
  const lowerText = truthText.toLowerCase();
  if (culturalDrift.detected_cliches.includes('romanticised-exhaustion') ||
      culturalDrift.detected_cliches.includes('instagram-burnout-aesthetic')) {
    decorative_mode = 'aesthetic-burnout';
  } else if (culturalDrift.detected_cliches.includes('soft-sad-reels-loneliness')) {
    decorative_mode = 'cinematic-loneliness';
  } else if (/\b(anxious|anxiety)\b/i.test(lowerText) && consumedDecay > 0) {
    decorative_mode = 'trendy-anxiety';
  } else if (overuseDecay >= 4) {
    decorative_mode = 'overused-truth';
  } else if (consumedDecay >= 3) {
    decorative_mode = 'consumed-treatment';
  }

  const decay_score = Math.min(10, overuseDecay + trendDecay + consumedDecay);

  let status: DecayStatus;
  if (decay_score >= 6) status = 'decorative';
  else if (decay_score >= 3.5) status = 'aging';
  else status = 'fresh';

  if (status === 'decorative') notes.push(`status: decorative${decorative_mode ? ` (${decorative_mode})` : ''} — truth has become aesthetic recognition`);
  else if (status === 'aging') notes.push('status: aging — truth is heading toward decorative');
  else notes.push('status: fresh — truth is still landing as lived');

  return { status, decay_score, decorative_mode, notes };
}
