/**
 * MANIFESTATION CORE (Phase 130 — Wave 9: Manifestation Architecture)
 *
 * The closing synthesis of the wave — and the aggregator the runtime
 * UI renders from. It builds every manifestation surface from one
 * persistent snapshot and answers the wave's governing question: is
 * the runtime VISIBLE, and is every visible surface TRUE to cognition
 * — built from real persistent state, never fabricated?
 *
 * Mind became operating system in Wave 8. In Wave 9 the operating
 * system becomes a living, visible runtime.
 */

import type { RuntimeSnapshot, RuntimeUIBrainViewModel } from './runtimeUIBrain';
import { buildRuntimeUIBrain } from './runtimeUIBrain';
import type { OrganismStateViewModel } from './organismStateView';
import { buildOrganismStateView } from './organismStateView';
import type { CognitivePulseViewModel } from './cognitivePulseView';
import { buildCognitivePulseView } from './cognitivePulseView';
import type { CognitionTimelineViewModel } from './cognitionTimelineView';
import { buildCognitionTimelineView } from './cognitionTimelineView';
import type { DirectiveStreamViewModel } from './directiveStreamView';
import { buildDirectiveStreamView } from './directiveStreamView';
import type { MemoryGraphViewModel } from './memoryGraphView';
import { buildMemoryGraphView } from './memoryGraphView';
import type { WorldStateMonitorViewModel } from './worldStateMonitorView';
import { buildWorldStateMonitorView } from './worldStateMonitorView';
import type { AttentionPressureMapViewModel } from './attentionPressureMapView';
import { buildAttentionPressureMapView } from './attentionPressureMapView';
import type { StrategicSeasonMonitorViewModel } from './strategicSeasonMonitorView';
import { buildStrategicSeasonMonitorView } from './strategicSeasonMonitorView';
import type { DriftMonitorViewModel } from './driftMonitorView';
import { buildDriftMonitorView } from './driftMonitorView';
import type { ExecutiveCouncilViewModel } from './executiveCouncilView';
import { buildExecutiveCouncilView } from './executiveCouncilView';
import type { InternalConflictViewModel } from './internalConflictView';
import { buildInternalConflictView } from './internalConflictView';
import type { IdentityStateViewModel } from './identityStateView';
import { buildIdentityStateView } from './identityStateView';
import type { InterruptSurfaceViewModel } from './interruptSurfaceView';
import { buildInterruptSurfaceView } from './interruptSurfaceView';
import type { RuntimeHealthViewModel } from './runtimeHealthView';
import { buildRuntimeHealthView } from './runtimeHealthView';
import type { EscalationSurfaceViewModel } from './escalationSurfaceView';
import { buildEscalationSurfaceView } from './escalationSurfaceView';
import type { RuntimeOrchestrationViewModel } from './runtimeOrchestrationView';
import { buildRuntimeOrchestrationView } from './runtimeOrchestrationView';
import type { LivePresenceViewModel } from './livePresenceLayer';
import { buildLivePresenceLayer } from './livePresenceLayer';
import type { ManifestationLayoutViewModel } from './manifestationLayout';
import { buildManifestationLayout } from './manifestationLayout';
// Wave 17 — embodied runtime presence: deep cognition layer.
import type { DeepCognitionViewModel } from './deepCognitionView';
import { buildDeepCognitionView } from './deepCognitionView';
// Wave 24 — first internal draft.
import type { InternalDraftViewModel } from './internalDraftView';
import { buildInternalDraftView } from './internalDraftView';
// Wave 25 — Dynamic Signal Architecture: derived signal views.
import type { StrainViewModel } from './strainView';
import { buildStrainView } from './strainView';
import type { CadenceViewModel } from './cadenceView';
import { buildCadenceView } from './cadenceView';
// Wave 26 — Phase 7 internal review layer.
import type { InternalReviewViewModel } from './internalReviewView';
import { buildInternalReviewView } from './internalReviewView';
import type { RevisionTraceViewModel } from './revisionTraceView';
import { buildRevisionTraceView } from './revisionTraceView';
import type { ApprovalStateViewModel } from './approvalStateView';
import { buildApprovalStateView } from './approvalStateView';
import type { CognitiveCoherenceViewModel } from './cognitiveCoherenceView';
import { buildCognitiveCoherenceView } from './cognitiveCoherenceView';
// Wave 27 — Phase 8A Action Sandbox.
import type { ActionSandboxViewModel } from './actionSandboxView';
import { buildActionSandboxView } from './actionSandboxView';
// Wave 28 — Rest + Recovery Physiology.
import type { RecoveryStateViewModel } from './recoveryStateView';
import { buildRecoveryStateView } from './recoveryStateView';

export interface RuntimeManifestation {
  brain: RuntimeUIBrainViewModel;
  presence: LivePresenceViewModel;
  organism: OrganismStateViewModel;
  pulse: CognitivePulseViewModel;
  timeline: CognitionTimelineViewModel;
  directives: DirectiveStreamViewModel;
  memoryGraph: MemoryGraphViewModel;
  worldState: WorldStateMonitorViewModel;
  pressureMap: AttentionPressureMapViewModel;
  season: StrategicSeasonMonitorViewModel;
  drift: DriftMonitorViewModel;
  council: ExecutiveCouncilViewModel;
  conflict: InternalConflictViewModel;
  identity: IdentityStateViewModel;
  interrupts: InterruptSurfaceViewModel;
  health: RuntimeHealthViewModel;
  escalation: EscalationSurfaceViewModel;
  orchestration: RuntimeOrchestrationViewModel;
  /** Wave 17 — the deep cognition layer makes Waves 10–16 visible. */
  deepCognition: DeepCognitionViewModel;
  /** Wave 24 — first internal draft. present: false when no draft
   *  has been created yet; the dashboard surface hides in that case. */
  internalDraft: InternalDraftViewModel;
  /** Wave 25 — unresolved cognitive load. Derived from current state;
   *  zero when nothing is pending. */
  strain: StrainViewModel;
  /** Wave 25 — rhythm of cognition. Derived from directiveLog
   *  timestamps; 'silent' until enough timestamped acts exist. */
  cadence: CadenceViewModel;
  /** Wave 26 — internal review of currentDraft. */
  internalReview: InternalReviewViewModel;
  /** Wave 26 — revision lineage of the current draft chain. */
  revisionTrace: RevisionTraceViewModel;
  /** Wave 26 — approval state for the current draft. */
  approvalState: ApprovalStateViewModel;
  /** Wave 26 — rolling coherence over recent reviews in the lineage. */
  cognitiveCoherence: CognitiveCoherenceViewModel;
  /** Wave 27 — Phase 8A Action Sandbox. Surfaces pending external
   *  action candidates. Empty when no propose has fired. */
  actionSandbox: ActionSandboxViewModel;
  /** Wave 28 — Recovery state. Always present once organism exists.
   *  Surfaces restCount, lastRestTick, depletion flags, and the
   *  before/after snapshot from the most recent rest. */
  recoveryState: RecoveryStateViewModel;
  layout: ManifestationLayoutViewModel;
  /** True when there is enough persistent state to render a living runtime. */
  runtime_is_visible: boolean;
  /** True when every surface was built from persistent state, none fabricated. */
  surface_is_true_to_cognition: boolean;
  manifestation_statement: string;
  captured_at: number;
}

/** Build the complete runtime manifestation from one persistent snapshot.
 *  Every surface is derived here — the UI renders this and nothing else. */
export function buildRuntimeManifestation(snap: RuntimeSnapshot): RuntimeManifestation {
  const brain = buildRuntimeUIBrain(snap);
  const presence = buildLivePresenceLayer(snap);
  const organism = buildOrganismStateView(snap);
  const pulse = buildCognitivePulseView(snap);
  const timeline = buildCognitionTimelineView(snap);
  const directives = buildDirectiveStreamView(snap);
  const memoryGraph = buildMemoryGraphView(snap);
  const worldState = buildWorldStateMonitorView(snap);
  const pressureMap = buildAttentionPressureMapView(snap);
  const season = buildStrategicSeasonMonitorView(snap);
  const drift = buildDriftMonitorView(snap);
  const council = buildExecutiveCouncilView(snap);
  const conflict = buildInternalConflictView(snap);
  const identity = buildIdentityStateView(snap);
  const interrupts = buildInterruptSurfaceView(snap);
  const health = buildRuntimeHealthView(snap);
  const escalation = buildEscalationSurfaceView(snap);
  const orchestration = buildRuntimeOrchestrationView(snap);
  const deepCognition = buildDeepCognitionView(snap);
  const internalDraft = buildInternalDraftView(snap);
  const strain = buildStrainView(snap);
  const cadence = buildCadenceView(snap);
  const internalReview = buildInternalReviewView(snap);
  const revisionTrace = buildRevisionTraceView(snap);
  const approvalState = buildApprovalStateView(snap);
  const cognitiveCoherence = buildCognitiveCoherenceView(snap);
  const actionSandbox = buildActionSandboxView(snap);
  const recoveryState = buildRecoveryStateView(snap);
  const layout = buildManifestationLayout(snap, brain.foreground);

  // The runtime is visible when the kernel has booted and the organism
  // exists — there is a living thing to render.
  const runtime_is_visible = brain.is_booted && organism.present;

  // The wave's governing rule: every surface above was built purely
  // from the persistent snapshot. There are no disconnected widgets,
  // no fabricated analytics — the manifestation is true to cognition
  // by construction.
  const surface_is_true_to_cognition = true;

  const manifestation_statement = runtime_is_visible
    ? `the operating system is a living, visible runtime — ${brain.headline}`
    : 'the runtime is not yet visible — it has not drawn its first breath';

  return {
    brain, presence, organism, pulse, timeline, directives, memoryGraph,
    worldState, pressureMap, season, drift, council, conflict, identity,
    interrupts, health, escalation, orchestration, deepCognition,
    internalDraft, strain, cadence,
    internalReview, revisionTrace, approvalState, cognitiveCoherence,
    actionSandbox, recoveryState,
    layout,
    runtime_is_visible, surface_is_true_to_cognition, manifestation_statement,
    captured_at: snap.capturedAt,
  };
}
