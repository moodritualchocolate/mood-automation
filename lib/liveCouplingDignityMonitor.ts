/**
 * LIVE COUPLING DIGNITY MONITOR (Phase 314 — Wave 14: Live Civilization Coupling)
 *
 * Holds the brand's dignity in the live moment — refusing reactive
 * undignified behaviors the live field tends to provoke.
 */

export interface LiveCouplingDignityReading {
  /** True when live behavior is dignified. */
  dignified: boolean;
  /** A breach of dignity in the live field, if any. */
  breach: string | null;
  notes: string[];
}

export interface LiveCouplingDignityInput {
  reactingDefensively: boolean;
  joiningPileOn: boolean;
  raisingVoiceLive: boolean;
}

export function readLiveCouplingDignityMonitor(input: LiveCouplingDignityInput): LiveCouplingDignityReading {
  const { reactingDefensively, joiningPileOn, raisingVoiceLive } = input;
  const notes: string[] = [];

  let breach: string | null = null;
  if (joiningPileOn) breach = 'joining a pile-on for reach';
  else if (reactingDefensively) breach = 'reacting defensively to live criticism';
  else if (raisingVoiceLive) breach = 'raising voice to compete in the live field';

  const dignified = breach === null;

  notes.push(`live coupling dignity monitor: ${dignified ? 'dignified' : `BREACH — ${breach}`}`);
  return { dignified, breach, notes };
}
