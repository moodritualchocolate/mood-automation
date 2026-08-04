/**
 * STRATEGIC SIMULATION VIEW (Wave 36)
 *
 * Dashboard view model for consequence memory. Surfaces:
 *   - the most recent simulation's three horizon endpoints
 *   - survivability + critical-region flag per horizon
 *   - status banding (clear / cautionary / critical / nonviable)
 *   - the verb cost map: top-impact verbs by recent budget consumption
 *
 * Hidden until at least one simulation has been recorded.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  ConsequenceMemoryState, SimulationRecord, SimulatedState, VerbCostStat,
} from './consequenceMemory';
import { simulationPressureFromConsequence } from './strategicSimulation';

export interface HorizonView {
  label: '+5' | '+20' | '+50';
  horizonSteps: number;
  endState: SimulatedState;
  survivability: number;
  enteredCritical: boolean;
}

export interface VerbCostEntry {
  verb: string;
  samples: number;
  avgBudgetImpact: number;
  avgReliabilityImpact: number;
  avgTensionImpact: number;
}

export interface StrategicSimulationViewModel {
  present: boolean;
  status: 'clear' | 'cautionary' | 'critical' | 'nonviable';
  /** When the recursive-weighting pressure is non-zero (i.e. long-
   *  horizon survivability < 0.7) we surface it for inspection. */
  feedbackPressure: number;
  horizons: HorizonView[];
  topCostVerbs: VerbCostEntry[];
  totalSimulations: number;
  statement: string;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

export function buildStrategicSimulationView(snap: RuntimeSnapshot): StrategicSimulationViewModel {
  const cm = snap.consequenceMemory ?? null;
  if (!cm || cm.recentSimulations.length === 0) {
    return {
      present: false,
      status: 'clear',
      feedbackPressure: 0,
      horizons: [],
      topCostVerbs: [],
      totalSimulations: 0,
      statement: 'no strategic simulation recorded yet — projections begin with the first cognitive event',
    };
  }

  const last = cm.recentSimulations[cm.recentSimulations.length - 1];
  const horizons: HorizonView[] = [
    { label: '+5',  horizonSteps: last.horizons.short.horizonSteps,
      endState: last.horizons.short.endState,
      survivability: last.horizons.short.survivability,
      enteredCritical: last.horizons.short.enteredCritical },
    { label: '+20', horizonSteps: last.horizons.medium.horizonSteps,
      endState: last.horizons.medium.endState,
      survivability: last.horizons.medium.survivability,
      enteredCritical: last.horizons.medium.enteredCritical },
    { label: '+50', horizonSteps: last.horizons.long.horizonSteps,
      endState: last.horizons.long.endState,
      survivability: last.horizons.long.survivability,
      enteredCritical: last.horizons.long.enteredCritical },
  ];

  const longSurv = last.horizons.long.survivability;
  const anyCritical = last.horizons.short.enteredCritical
    || last.horizons.medium.enteredCritical
    || last.horizons.long.enteredCritical;
  const status: StrategicSimulationViewModel['status'] =
    longSurv < 0.3 ? 'nonviable' :
    longSurv < 0.5 ? 'critical' :
    longSurv < 0.7 || anyCritical ? 'cautionary' :
                      'clear';

  // The same composite formula governance uses for recursive weighting.
  const feedbackPressure = simulationPressureFromConsequence(cm);

  const topCostVerbs: VerbCostEntry[] = Object.entries(cm.verbCostMap)
    .map(([verb, stat]: [string, VerbCostStat]) => ({
      verb,
      samples: stat.samples,
      avgBudgetImpact: stat.avgBudgetImpact,
      avgReliabilityImpact: stat.avgReliabilityImpact,
      avgTensionImpact: stat.avgTensionImpact,
    }))
    .sort((a, b) => Math.abs(b.avgBudgetImpact) - Math.abs(a.avgBudgetImpact))
    .slice(0, 8);

  const statement = (() => {
    if (status === 'nonviable') {
      return `long-horizon trajectory NONVIABLE — survivability ${longSurv.toFixed(2)} at +50 (${horizons[2].enteredCritical ? 'entered critical region' : 'no critical incursion'})`;
    }
    if (status === 'critical') {
      return `long-horizon trajectory CRITICAL — survivability ${longSurv.toFixed(2)} at +50; feedback pressure ${feedbackPressure.toFixed(2)} pushing governance to restrict`;
    }
    if (status === 'cautionary') {
      return `long-horizon trajectory cautionary — survivability ${longSurv.toFixed(2)} at +50; recursive weighting active (pressure ${feedbackPressure.toFixed(2)})`;
    }
    return `trajectory clear across all horizons — long-survivability ${longSurv.toFixed(2)}, no recursive pressure applied`;
  })();

  return {
    present: true,
    status,
    feedbackPressure,
    horizons,
    topCostVerbs,
    totalSimulations: cm.totalSimulations,
    statement,
  };
}
