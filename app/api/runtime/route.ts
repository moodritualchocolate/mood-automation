/**
 * GET /api/runtime — the runtime manifestation.
 *
 * Wave 9. Loads every persistent runtime store, assembles one
 * snapshot, and builds the complete manifestation the /runtime
 * dashboard renders. The UI is never given raw state and never
 * fabricates — every visible surface is derived here, from cognition.
 */

import {
  createOrganismCoreStore,
  createOSRuntimeStore,
  createCivilizationArchiveStore,
  createWorldStateEngineStore,
  createRuntimeMemoryStore,
  buildRuntimeManifestation,
} from '@lib/index';
import type { RuntimeSnapshot } from '@lib/index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [organism, os, civilization, worldState, runtimeBook] = await Promise.all([
    createOrganismCoreStore().read(),
    createOSRuntimeStore().read(),
    createCivilizationArchiveStore().read(),
    createWorldStateEngineStore().read(),
    createRuntimeMemoryStore('energy').read(),
  ]);

  const snapshot: RuntimeSnapshot = {
    organism,
    os,
    civilization,
    worldState,
    runtime: runtimeBook,
    capturedAt: Date.now(),
  };

  return Response.json(buildRuntimeManifestation(snapshot));
}
