/**
 * INTERNAL CONFLICT VIEW (Phase 122 — Wave 9: Manifestation Architecture)
 *
 * The runtime is never fully at peace with itself. This module
 * surfaces the live tensions inside the organism: optimization
 * against identity, the unhealed scars, the fragmentation in the
 * kernel. It is the conflict viewer — the runtime arguing with itself,
 * made visible.
 */

import type { RuntimeSnapshot, Tone } from './runtimeUIBrain';

export interface InternalConflict {
  conflict: string;
  /** 0..10 — how sharp the tension is. */
  intensity: number;
  tone: Tone;
}

export interface InternalConflictViewModel {
  present: boolean;
  conflicts: InternalConflict[];
  /** 0..10 — the runtime's overall internal tension. */
  tension_level: number;
  at_peace: boolean;
  statement: string;
}

export function buildInternalConflictView(snap: RuntimeSnapshot): InternalConflictViewModel {
  const { civilization, os, organism } = snap;
  const conflicts: InternalConflict[] = [];

  if (civilization) {
    const total = civilization.optimizationWins + civilization.identityWins;
    if (total >= 4) {
      const optShare = civilization.optimizationWins / total;
      if (optShare > 0.45) {
        conflicts.push({
          conflict: `optimization vs identity — optimization has won ${civilization.optimizationWins}:${civilization.identityWins}`,
          intensity: Math.min(10, Math.round(optShare * 12)),
          tone: optShare > 0.6 ? 'bad' : 'warn',
        });
      }
    }
    const activeScars = civilization.scars.filter((s) => !s.healed);
    if (activeScars.length > 0) {
      conflicts.push({
        conflict: `${activeScars.length} unhealed scar(s) — "${activeScars[0].wound}"`,
        intensity: Math.min(10, activeScars.reduce((m, s) => Math.max(m, s.severity), 0)),
        tone: 'warn',
      });
    }
  }
  if (os && os.fragmentationStreak >= 1) {
    conflicts.push({
      conflict: `the runtime is fragmenting — ${os.fragmentationStreak} consecutive fragmented tick(s)`,
      intensity: Math.min(10, os.fragmentationStreak * 3),
      tone: 'bad',
    });
  }
  if (organism && organism.stressAccumulation >= 6 && organism.consecutiveActions >= 5) {
    conflicts.push({
      conflict: 'the organism is acting through accumulated stress without rest',
      intensity: Math.min(10, organism.stressAccumulation),
      tone: 'warn',
    });
  }

  const tension_level = conflicts.length
    ? Math.round((conflicts.reduce((s, c) => s + c.intensity, 0) / conflicts.length) * 10) / 10
    : 0;
  const at_peace = conflicts.length === 0;

  return {
    present: true, conflicts, tension_level, at_peace,
    statement: at_peace
      ? 'the runtime is at peace with itself — no internal conflict active'
      : `${conflicts.length} internal conflict(s) — tension ${tension_level}/10`,
  };
}
