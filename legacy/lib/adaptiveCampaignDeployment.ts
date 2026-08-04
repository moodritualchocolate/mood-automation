/**
 * ADAPTIVE CAMPAIGN DEPLOYMENT (Phase 184 — Wave 12: Autonomous Action Architecture)
 *
 * The campaign does not deploy at one fixed intensity. This module
 * sets the deployment mode — full, measured, minimal, or paused — to
 * the state of the world and the organism's remaining restraint.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export type DeploymentMode = 'full' | 'measured' | 'minimal' | 'paused';

export interface AdaptiveDeploymentReading {
  deployment_mode: DeploymentMode;
  /** True when deployment intensity is genuinely matched to conditions. */
  deployment_is_adaptive: boolean;
  deployment_note: string;
  notes: string[];
}

export interface AdaptiveDeploymentInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — recovery time owed to the audience. */
  audienceRecoveryDebt: number;
  /** 0..10 — restraint still available. */
  restraintBudget: number;
}

export function readAdaptiveCampaignDeployment(input: AdaptiveDeploymentInput): AdaptiveDeploymentReading {
  const { worldState, audienceRecoveryDebt, restraintBudget } = input;
  const notes: string[] = [];

  const strain = (worldState.collective_exhaustion + worldState.attention_chaos) / 2;

  const deployment_mode: DeploymentMode =
    audienceRecoveryDebt >= 8 || restraintBudget <= 1 ? 'paused' :
    strain >= 7 || audienceRecoveryDebt >= 6 ? 'minimal' :
    strain >= 4.5 ? 'measured' :
    'full';

  // Deployment is adaptive when intensity falls as strain/debt rise.
  const deployment_is_adaptive =
    !((deployment_mode === 'full' && (strain >= 7 || audienceRecoveryDebt >= 6)));

  const deployment_note =
    deployment_mode === 'paused' ? 'deployment paused — the audience is owed recovery, restraint is spent'
    : deployment_mode === 'minimal' ? 'minimal deployment — a strained world gets the lightest possible touch'
    : deployment_mode === 'measured' ? 'measured deployment — present, but not pressing'
    : 'full deployment — conditions allow the campaign to move at full intensity';

  notes.push(`adaptive campaign deployment: ${deployment_mode} — ${deployment_note}`);
  return { deployment_mode, deployment_is_adaptive, deployment_note, notes };
}
