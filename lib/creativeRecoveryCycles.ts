/**
 * CREATIVE RECOVERY CYCLES (Phase 37 — Cognitive Energy Management / Wave 4)
 *
 * Models the campaign's RECOVERY rhythm — the cooldown windows a
 * campaign needs between intensities. A campaign that never rests
 * loses the contrast that makes any single banner land.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface CreativeRecoveryReading {
  /** 0..10 — how much the campaign needs a recovery window now. */
  recovery_need: number;
  /** True when a silence / cooldown is recommended before the next output. */
  recommend_cooldown: boolean;
  /** Hours since the campaign's last natural pause. */
  hours_since_pause: number;
  notes: string[];
}

export interface CreativeRecoveryInput {
  trail: EmotionalTraceEntry[];
}

const HEAVY = new Set(['collapse', 'fatigue', 'numbness', 'paralysis', 'pressure']);

export function readCreativeRecoveryCycles(input: CreativeRecoveryInput): CreativeRecoveryReading {
  const { trail } = input;
  const notes: string[] = [];

  if (trail.length < 3) {
    return {
      recovery_need: 0, recommend_cooldown: false, hours_since_pause: 0,
      notes: ['creative recovery: campaign too young to need a recovery cycle'],
    };
  }

  // A "pause" is a gap of >= 36h between consecutive banners.
  const sorted = [...trail].sort((a, b) => b.createdAt - a.createdAt);
  let hours_since_pause = 0;
  let consecutiveRun = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapH = (sorted[i].createdAt - sorted[i + 1].createdAt) / 3600000;
    if (gapH >= 36) break;
    consecutiveRun += 1;
  }
  hours_since_pause = round1((sorted[0].createdAt - sorted[Math.min(consecutiveRun, sorted.length - 1)].createdAt) / 3600000);

  // The recent run's emotional weight — a long run of heavy banners
  // needs recovery more than a long run of varied ones.
  const recentRun = sorted.slice(0, consecutiveRun + 1);
  const heavyShare = recentRun.filter((t) => HEAVY.has(t.family)).length / Math.max(1, recentRun.length);

  let recovery_need = 0;
  if (consecutiveRun >= 6) recovery_need += 5;
  else if (consecutiveRun >= 4) recovery_need += 3;
  if (heavyShare >= 0.7) recovery_need += 3;
  recovery_need = clamp10(round1(recovery_need));

  const recommend_cooldown = recovery_need >= 6;

  notes.push(`creative recovery: need ${recovery_need}/10 — ${consecutiveRun + 1}-banner run, heavy share ${round1(heavyShare)}`);
  if (recommend_cooldown) notes.push('creative recovery: recommend a cooldown / silence window before the next output');

  return { recovery_need, recommend_cooldown, hours_since_pause, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
