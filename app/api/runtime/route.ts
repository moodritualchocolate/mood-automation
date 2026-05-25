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
  evolveOSFromPassiveTick,
} from '@lib/index';
import { createCognitiveLineageStore } from '@lib/cognitiveLineage';
import { createTemporalMemoryStore } from '@lib/temporalMemory';
import { createPurposeMemoryStore } from '@lib/purposeMemory';
import { applyHibernationDecay } from '@lib/purposeEngine';
import { createContradictionMemoryStore } from '@lib/contradictionMemory';
import { createSelfModelMemoryStore } from '@lib/selfModelMemory';
import { createMetaCognitiveStore } from '@lib/metaCognitive';
import { createCognitiveGovernanceStore } from '@lib/cognitiveGovernance';
import { createConsequenceMemoryStore } from '@lib/consequenceMemory';
import { createInternalEcologyStore } from '@lib/internalEcologyMemory';
import { createResourceEconomyStore } from '@lib/resourceEconomyMemory';
import { createEnvironmentMemoryStore } from '@lib/environmentMemory';
import { createMissionContinuityStore } from '@lib/missionContinuityMemory';
import { createHistoricalMemoryStore } from '@lib/historicalMemory';
import { createCounterfactualMemoryStore } from '@lib/counterfactualMemory';
import { classifyConsciousness, applyPassiveMetabolism } from '@lib/consciousnessView';
import type { RuntimeSnapshot } from '@lib/index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Wave 19 — passive runtime tick. The OS store is the only writer
  // on this route; every other store stays strictly read-only.
  const osStore = createOSRuntimeStore();

  const [
    organism, osPre, civilization, worldState, runtimeBook,
    coupling, strategicFuture, execution, feedback,
    liveCoupling, sovereignIdentity, generativePresence,
    protectionMemory, contradictionScars, weatherLog, pressureGateway,
    cognitiveLineage,
  ] = await Promise.all([
    createOrganismCoreStore().read(),
    osStore.read(),
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
    // ─── Wave 26 — Phase 7 internal review lineage ──
    createCognitiveLineageStore().read(),
  ]);

  // ─── Wave 30 — temporal memory (parallel-safe; small file) ──
  const temporalMemory = await createTemporalMemoryStore().read();
  // ─── Wave 31 — purpose memory ─────────────────────────────────
  const purposeStore = createPurposeMemoryStore();
  let purposeMemory = await purposeStore.read();
  // ─── Wave 32 — contradiction memory ───────────────────────────
  const contradictionMemory = await createContradictionMemoryStore().read();
  // ─── Wave 33 — self-model memory ──────────────────────────────
  const selfModel = await createSelfModelMemoryStore().read();
  // ─── Wave 34 — meta-cognitive reliability ─────────────────────
  const metaCognitive = await createMetaCognitiveStore().read();
  // ─── Wave 35 — cognitive governance ───────────────────────────
  const cognitiveGovernance = await createCognitiveGovernanceStore().read();
  // ─── Wave 36 — consequence memory ─────────────────────────────
  const consequenceMemory = await createConsequenceMemoryStore().read();
  // ─── Wave 37 — internal ecology ───────────────────────────────
  const internalEcology = await createInternalEcologyStore().read();
  // ─── Wave 38 — resource economy ───────────────────────────────
  const resourceEconomy = await createResourceEconomyStore().read();
  // ─── Wave 39 — environmental reality ──────────────────────────
  const environment = await createEnvironmentMemoryStore().read();
  // ─── Wave 40 — mission continuity ─────────────────────────────
  const missionContinuity = await createMissionContinuityStore().read();
  // ─── Wave 42 — historical memory ──────────────────────────────
  const historicalMemory = await createHistoricalMemoryStore().read();
  // ─── Wave 43 — counterfactual memory ──────────────────────────
  const counterfactualMemory = await createCounterfactualMemoryStore().read();

  // The passive tick. Advances only os.uptime and os.seasonAge — no
  // directive, no posture change, no coordination shift, no archive
  // mutation. Rate-limited internally by MIN_PASSIVE_TICK_MS.
  let os = evolveOSFromPassiveTick(osPre);
  let organismCurrent = organism;
  const tickedThisCall = os.uptime !== osPre.uptime;

  // Wave 29 — passive metabolism. After the passive tick, if the
  // organism is in idle / recovering / hibernating state and the new
  // uptime is a metabolism-interval boundary, apply tiny adjustments
  // to stress (organism), fragmentation + coordinationEMA (OS). Never
  // touches energy (rest's job) and never adds directive entries
  // (metabolism is physiological, not cognitive).
  if (tickedThisCall) {
    const classification = classifyConsciousness(os, organismCurrent);
    const metabolism = applyPassiveMetabolism(os, organismCurrent, classification);
    if (metabolism) {
      os = metabolism.os;
      organismCurrent = metabolism.organism;
      await Promise.all([osStore.save(os), createOrganismCoreStore().save(organismCurrent)]);
    } else {
      await osStore.save(os);
    }
    // Wave 31 — hibernation slow-decay for purpose memory. Only fires
    // when consciousness is hibernating AND the passive tick produced
    // a metabolism step (the same boundary the rest of metabolism
    // honors). Tiny fatigue reduction across active goals only.
    if (classification === 'hibernating') {
      const decayed = applyHibernationDecay(purposeMemory, Date.now(), os.uptime);
      if (decayed) {
        purposeMemory = decayed;
        await purposeStore.save(purposeMemory);
      }
    }
  }

  const snapshot: RuntimeSnapshot = {
    organism: organismCurrent,
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
    cognitiveLineage,
    temporalMemory,
    purposeMemory,
    contradictionMemory,
    selfModel,
    metaCognitive,
    cognitiveGovernance,
    consequenceMemory,
    internalEcology,
    resourceEconomy,
    environment,
    missionContinuity,
    historicalMemory,
    counterfactualMemory,
    capturedAt: Date.now(),
  };

  return Response.json(buildRuntimeManifestation(snapshot));
}
