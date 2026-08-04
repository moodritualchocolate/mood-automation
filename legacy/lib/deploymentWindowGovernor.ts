/**
 * DEPLOYMENT WINDOW GOVERNOR (Phase 205 — Wave 12: Autonomous Action Architecture)
 *
 * There is a right window to deploy and many wrong ones. This governor
 * reads whether the current window is open, narrowing, or closed —
 * and refuses to force an action through a closed window.
 */

export type DeploymentWindow = 'open' | 'narrowing' | 'closed';

export interface DeploymentWindowReading {
  window: DeploymentWindow;
  /** True when the action may be deployed in this window. */
  window_permits_deployment: boolean;
  window_note: string;
  notes: string[];
}

export interface DeploymentWindowInput {
  /** True when the moment is ripe (Wave 11). */
  timingRipe: boolean;
  /** True when the moment has been missed. */
  timingMissed: boolean;
  /** True when silence is enforced. */
  silenceEnforced: boolean;
  /** True when the audience is ready. */
  audienceReady: boolean;
}

export function readDeploymentWindowGovernor(input: DeploymentWindowInput): DeploymentWindowReading {
  const { timingRipe, timingMissed, silenceEnforced, audienceReady } = input;
  const notes: string[] = [];

  const window: DeploymentWindow =
    silenceEnforced || timingMissed ? 'closed' :
    !audienceReady ? 'narrowing' :
    timingRipe ? 'open' :
    'narrowing';

  const window_permits_deployment = window === 'open';

  const window_note =
    window === 'open' ? 'the deployment window is open — the action may ship'
    : window === 'narrowing' ? 'the window is narrowing — deploy soon and lightly, or wait'
    : silenceEnforced ? 'the window is closed by enforced silence — no deployment'
    : 'the window is closed — the moment has passed';

  notes.push(`deployment window governor: ${window} — ${window_note}`);
  return { window, window_permits_deployment, window_note, notes };
}
