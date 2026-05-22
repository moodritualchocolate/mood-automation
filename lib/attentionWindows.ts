/**
 * ATTENTION WINDOWS (Phase 38 — Temporal Intelligence / Wave 4)
 *
 * Maps the hour of the day to the audience's attention state — the
 * doomscroll window, the morning rush, the loneliness hours, the
 * evening collapse. The same banner lands differently at 07:30 and
 * at 23:50.
 */

export type AttentionWindow =
  | 'morning-rush' | 'mid-morning-focus' | 'afternoon-dip'
  | 'evening-collapse' | 'doomscroll-window' | 'loneliness-hours' | 'dead-of-night';

export interface AttentionWindowsReading {
  window: AttentionWindow;
  hour: number;
  /** 0..10 — how receptive the audience is to a quiet, true banner. */
  receptivity_to_truth: number;
  /** 0..10 — how vulnerable the audience emotionally is right now. */
  emotional_vulnerability: number;
  notes: string[];
}

export interface AttentionWindowsInput {
  /** Epoch ms; defaults to now. */
  now?: number;
}

export function readAttentionWindows(input: AttentionWindowsInput = {}): AttentionWindowsReading {
  const now = input.now ?? Date.now();
  const hour = new Date(now).getHours();
  const notes: string[] = [];

  let window: AttentionWindow;
  let receptivity_to_truth: number;
  let emotional_vulnerability: number;

  if (hour >= 6 && hour < 9) {
    window = 'morning-rush';
    receptivity_to_truth = 4;        // bracing for the day, low patience
    emotional_vulnerability = 4;
  } else if (hour >= 9 && hour < 13) {
    window = 'mid-morning-focus';
    receptivity_to_truth = 5;
    emotional_vulnerability = 3;
  } else if (hour >= 13 && hour < 16) {
    window = 'afternoon-dip';
    receptivity_to_truth = 7;        // the post-lunch collapse — receptive
    emotional_vulnerability = 6;
  } else if (hour >= 16 && hour < 20) {
    window = 'evening-collapse';
    receptivity_to_truth = 7;
    emotional_vulnerability = 6;
  } else if (hour >= 20 && hour < 23) {
    window = 'doomscroll-window';
    receptivity_to_truth = 8;        // the feed is open, the guard is down
    emotional_vulnerability = 7;
  } else if (hour >= 23 || hour < 1) {
    window = 'loneliness-hours';
    receptivity_to_truth = 9;        // most receptive, most vulnerable
    emotional_vulnerability = 9;
  } else {
    window = 'dead-of-night';
    receptivity_to_truth = 6;
    emotional_vulnerability = 8;
  }

  notes.push(`attention window: ${window} (hour ${hour}) — receptivity ${receptivity_to_truth}/10, vulnerability ${emotional_vulnerability}/10`);
  return { window, hour, receptivity_to_truth, emotional_vulnerability, notes };
}
