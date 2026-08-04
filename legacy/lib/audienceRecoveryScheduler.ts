/**
 * AUDIENCE RECOVERY SCHEDULER (Phase 187 — Wave 12: Autonomous Action Architecture)
 *
 * An audience is not an inexhaustible resource. Every action draws on
 * its attention; recovery must be scheduled, not assumed. This module
 * tracks the recovery the audience is owed and whether it has been
 * given enough rest to receive the next action.
 */

export interface AudienceRecoveryReading {
  /** True when the audience has recovered enough to receive an action. */
  audience_is_ready: boolean;
  /** 0..10 — recovery time still owed to the audience. */
  recovery_owed: number;
  /** Recommended cycles of rest before the next action. */
  rest_cycles_recommended: number;
  notes: string[];
}

export interface AudienceRecoveryInput {
  /** 0..10 — recovery debt carried in the execution state. */
  recoveryDebt: number;
  /** 0..10 — current audience fatigue. */
  audienceFatigue: number;
  /** True when the world recommends silence. */
  recommendSilence: boolean;
}

export function readAudienceRecoveryScheduler(input: AudienceRecoveryInput): AudienceRecoveryReading {
  const { recoveryDebt, audienceFatigue, recommendSilence } = input;
  const notes: string[] = [];

  const recovery_owed = round1(Math.min(10, recoveryDebt * 0.6 + audienceFatigue * 0.4));
  const audience_is_ready = recovery_owed < 6 && !recommendSilence;

  const rest_cycles_recommended = recovery_owed >= 8 ? 3 : recovery_owed >= 6 ? 2 : recovery_owed >= 4 ? 1 : 0;

  notes.push(`audience recovery scheduler: ${audience_is_ready ? 'audience is ready' : 'audience needs recovery'} ` +
    `(owed ${recovery_owed}/10, rest ${rest_cycles_recommended} cycle(s))`);
  return { audience_is_ready, recovery_owed, rest_cycles_recommended, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
