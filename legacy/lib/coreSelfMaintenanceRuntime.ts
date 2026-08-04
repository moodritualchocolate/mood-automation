/**
 * CORE SELF MAINTENANCE RUNTIME (Phase 390 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The background maintenance process that keeps core identity healthy.
 */

export interface CoreSelfMaintenanceRuntimeReading {
  /** True when maintenance is running this cycle. */
  maintenance_running: boolean;
  notes: string[];
}

export interface CoreSelfMaintenanceRuntimeInput {
  cyclesSinceMaintenance: number;
}

export function readCoreSelfMaintenanceRuntime(input: CoreSelfMaintenanceRuntimeInput): CoreSelfMaintenanceRuntimeReading {
  const { cyclesSinceMaintenance } = input;
  const notes: string[] = [];

  const maintenance_running = cyclesSinceMaintenance >= 3;

  notes.push(`core self maintenance runtime: ${maintenance_running ? 'running' : 'standby'} (${cyclesSinceMaintenance} cycles since last)`);
  return { maintenance_running, notes };
}
