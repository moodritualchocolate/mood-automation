/**
 * EXECUTION CADENCE MEMORY (Phase 208 — Wave 12: Autonomous Action Architecture)
 *
 * The organism remembers the rhythm of its own action. This module
 * reads the cadence history and reports whether the campaign has been
 * breathing — alternating action and rest — or merely flooding.
 */

export type CadencePattern = 'breathing' | 'steady' | 'flooding' | 'silent';

export interface ExecutionCadenceReading {
  cadence_pattern: CadencePattern;
  /** 0..10 — how healthy the remembered cadence is. */
  cadence_health: number;
  /** True when the campaign has been alternating action with rest. */
  campaign_is_breathing: boolean;
  notes: string[];
}

export interface ExecutionCadenceInput {
  actionsAuthorized: number;
  actionsWithheld: number;
  /** 0..10 — cadence health carried in the execution state. */
  cadenceHealth: number;
}

export function readExecutionCadenceMemory(input: ExecutionCadenceInput): ExecutionCadenceReading {
  const { actionsAuthorized, actionsWithheld, cadenceHealth } = input;
  const notes: string[] = [];

  const total = actionsAuthorized + actionsWithheld;
  const withheldShare = total > 0 ? actionsWithheld / total : 0;

  const cadence_pattern: CadencePattern =
    total === 0 ? 'silent' :
    withheldShare >= 0.3 && withheldShare <= 0.7 ? 'breathing' :
    withheldShare < 0.15 ? 'flooding' :
    'steady';

  const campaign_is_breathing = cadence_pattern === 'breathing';

  notes.push(`execution cadence memory: ${cadence_pattern} (health ${cadenceHealth}/10, ` +
    `${actionsAuthorized} acted / ${actionsWithheld} withheld)`);
  return { cadence_pattern, cadence_health: cadenceHealth, campaign_is_breathing, notes };
}
