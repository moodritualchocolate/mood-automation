/**
 * GET /api/runtime — the runtime manifestation.
 *
 * Wave 9 brought the operating system to the surface. Wave 17
 * extends the surface to embody Waves 10–16 — the deeper cognition
 * layers (reality coupling, strategic future, autonomous action,
 * reality feedback, live coupling, sovereign identity, generative
 * presence) and the unified Silence Engine.
 *
 * Every visible surface is derived from persistent state — never
 * fabricated.
 */

import {
  createOrganismCoreStore,
  createOSRuntimeStore,
  createCivilizationArchiveStore,
  createWorldStateEngineStore,
  createRuntimeMemoryStore,
  createRealityCouplingStore,
  createStrategicFutureStore,
  createExecutionStore,
  createFeedbackStore,
  createLiveCouplingStore,
  createSovereignIdentityStore,
  createGenerativePresenceStore,
  createProtectionMemoryStore,
  createContradictionScarsStore,
  createWeatherLogStore,
  createPressureGatewayStore,
  buildRuntimeManifestation,
} from '@lib/index';
import type { RuntimeSnapshot } from '@lib/index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [
    organism, os, civilization, worldState, runtimeBook,
    coupling, strategicFuture, execution, feedback,
    liveCoupling, sovereignIdentity, generativePresence,
    protectionMemory, contradictionScars, weatherLog, pressureGateway,
  ] = await Promise.all([
    createOrganismCoreStore().read(),
    createOSRuntimeStore().read(),
    createCivilizationArchiveStore().read(),
    createWorldStateEngineStore().read(),
    createRuntimeMemoryStore('energy').read(),
    // ─── Wave 10–16 stores — added in Wave 17 ──────────────────
    createRealityCouplingStore().read(),
    createStrategicFutureStore().read(),
    createExecutionStore().read(),
    createFeedbackStore().read(),
    createLiveCouplingStore().read(),
    createSovereignIdentityStore().read(),
    createGenerativePresenceStore().read(),
    // ─── Wave 17 — runtime continuity + 17.7 external pressure gateway ──
    createProtectionMemoryStore().read(),
    createContradictionScarsStore().read(),
    createWeatherLogStore().read(),
    createPressureGatewayStore().read(),
  ]);

  const snapshot: RuntimeSnapshot = {
    organism,
    os,
    civilization,
    worldState,
    runtime: runtimeBook,
    coupling,
    strategicFuture,
    execution,
    feedback,
    liveCoupling,
    sovereignIdentity,
    generativePresence,
    protectionMemory,
    contradictionScars,
    weatherLog,
    pressureGateway,
    capturedAt: Date.now(),
  };

  return Response.json(buildRuntimeManifestation(snapshot));
}
