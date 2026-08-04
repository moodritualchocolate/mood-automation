/**
 * IDENTITY SUSTENANCE MONITOR (Phase 381 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Identity needs sustenance — moments of expressing itself fully.
 * This monitor flags when sustenance has been missing.
 */

export interface IdentitySustenanceMonitorReading {
  sustained: boolean;
  cycles_since_full_expression: number;
  notes: string[];
}

export interface IdentitySustenanceMonitorInput {
  fullExpressionThisCycle: boolean;
  priorCyclesSinceExpression: number;
}

export function readIdentitySustenanceMonitor(input: IdentitySustenanceMonitorInput): IdentitySustenanceMonitorReading {
  const { fullExpressionThisCycle, priorCyclesSinceExpression } = input;
  const notes: string[] = [];

  const cycles_since_full_expression = fullExpressionThisCycle ? 0 : priorCyclesSinceExpression + 1;
  const sustained = cycles_since_full_expression <= 3;

  notes.push(`identity sustenance monitor: ${sustained ? 'sustained' : 'STARVING'} (${cycles_since_full_expression} cycles since full expression)`);
  return { sustained, cycles_since_full_expression, notes };
}
