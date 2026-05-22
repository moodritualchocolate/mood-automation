/**
 * LIVE PRESENCE LAYER (Phase 128 — Wave 9: Manifestation Architecture)
 *
 * The layer that makes the runtime feel present rather than logged.
 * It reads how recently the runtime last ticked and turns that into a
 * sense of presence — breathing, slow, held, dormant — so a viewer
 * knows whether they are watching something alive right now.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export type Breath = 'steady' | 'slow' | 'shallow' | 'held' | 'none';

export interface LivePresenceViewModel {
  present: boolean;
  is_breathing: boolean;
  last_tick_ms_ago: number;
  last_seen: string;
  breath: Breath;
  statement: string;
}

function humaniseAge(ms: number): string {
  if (ms < 0) return 'just now';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function buildLivePresenceLayer(snap: RuntimeSnapshot): LivePresenceViewModel {
  const os = snap.os;
  if (!os || os.uptime === 0) {
    return {
      present: false, is_breathing: false, last_tick_ms_ago: 0, last_seen: 'never',
      breath: 'none',
      statement: 'the runtime has never ticked — there is no presence to feel',
    };
  }

  const last_tick_ms_ago = Math.max(0, snap.capturedAt - os.updatedAt);
  const minutes = last_tick_ms_ago / 60000;

  let breath: Breath;
  if (os.operationalPosture === 'hibernating') breath = 'held';
  else if (minutes > 60 * 12) breath = 'none';
  else if (minutes > 60) breath = 'slow';
  else if (os.coordinationEMA < 5) breath = 'shallow';
  else breath = 'steady';

  const is_breathing = breath === 'steady' || breath === 'shallow';

  return {
    present: true,
    is_breathing,
    last_tick_ms_ago,
    last_seen: humaniseAge(last_tick_ms_ago),
    breath,
    statement: breath === 'none'
      ? `the runtime has gone quiet — last tick ${humaniseAge(last_tick_ms_ago)}`
      : breath === 'held'
        ? 'the runtime is hibernating — breath held'
        : `the runtime is breathing ${breath} — last tick ${humaniseAge(last_tick_ms_ago)}`,
  };
}
