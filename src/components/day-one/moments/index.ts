// MOOD · Moment Registry.
// The engine imports Moments ONLY from here. To add Moment_00N:
//   1. create ./moment_00N.ts (metadata + challenges + reflections + asset refs)
//   2. add one line to the MOMENTS array below
//   3. (if it needs new art) add the SceneKey + renderer to the asset registry
// No engine change is ever required.

import type { Moment } from "../types";
import { moment_001 } from "./moment_001";
import { moment_002 } from "./moment_002";

export const MOMENTS: Moment[] = [moment_001, moment_002];

export function getMomentById(id: string): Moment | undefined {
  return MOMENTS.find((m) => m.id === id);
}

// Which Moment does the user meet today? Day One is always the first Moment; later
// days advance through the registry. An optional index override (used only for
// preview/testing) is honored without touching any screen logic.
export function selectMoment(dayIndex: number, override?: number | null): Moment {
  if (override != null && MOMENTS[override]) return MOMENTS[override];
  return MOMENTS[dayIndex % MOMENTS.length] ?? MOMENTS[0];
}
