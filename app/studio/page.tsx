/**
 * Studio — where the generation happens and the banner is shown.
 *
 * UX architecture:
 *  - A persistent control bar (formula tabs / campaign mode / brutality /
 *    GENERATE) is ALWAYS visible at the top. The user can change
 *    selections and re-run at any moment, including after a refusal.
 *  - The first run auto-fires on mount from URL params (so links from
 *    the landing page still work). Subsequent runs are triggered by
 *    the GENERATE button.
 *  - Refusal renders as an INLINE critique block in the preview pane,
 *    with TRY AGAIN / CHANGE FORMULA / BACK TO STUDIO actions. The
 *    page never enters a dead-end state.
 *  - Runtime systems (critic, pipeline, refusal behavior) are
 *    unchanged — this is purely UX state architecture.
 *
 * The page streams events from the pipeline so the user sees:
 *  - the state being chosen
 *  - the truth being written
 *  - the direction being set
 *  - any rejections + regenerations
 *
 * Then it displays the final banner with the composed SVG + a PNG export.
 */

'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CAMPAIGN_MODES, FORMULAS,
  type Banner, type CampaignMode, type Formula, type PipelineEvent,
} from '@/core/types';
import type { AdStrategyAssessment } from '@lib/adStrategyEngine';
import type { CopywriterOutput } from '@lib/copywriterEngine';
import type { CopyQualityAxis } from '@lib/copyQualityAdapter';
import type { CopyQualityPolicyRecommendation } from '@lib/copyQualityPolicy';
import type { QualityLongitudinalView } from '@lib/qualityLongitudinalView';
import type { PolicyAuditView } from '@lib/copyQualityPolicyAuditView';
import type { CulturalPerceptionLongitudinalView } from '@lib/culturalPerceptionView';
import type { ConflictLongitudinalView } from '@lib/conflictLongitudinalView';
import type { CognitiveWeightLongitudinalView } from '@lib/cognitiveWeightLongitudinalView';
import type { IdentityContinuityLongitudinalView } from '@lib/identityContinuityLongitudinalView';
import type { ExecutiveGovernanceLongitudinalView } from '@lib/executiveGovernanceLongitudinalView';
import type { StrategicOutcomeLongitudinalView } from '@lib/strategicOutcomeLongitudinalView';
import type { CounterfactualCognitionLongitudinalView } from '@lib/counterfactualCognitionLongitudinalView';
import type { CampaignLifecycleLongitudinalView } from '@lib/campaignLifecycleLongitudinalView';
import type { BranchActivationLongitudinalView } from '@lib/branchActivationLongitudinalView';
import type { ProjectionCalibrationLongitudinalView } from '@lib/projectionCalibrationLongitudinalView';
import type { OperatorConfidencePreferenceView } from '@lib/operatorConfidencePreferenceView';
import type { OperatorCalibrationReconciliationLongitudinalView } from '@lib/operatorCalibrationReconciliationView';
import type { SystemIntegrityReport } from '@lib/systemIntegrityReport';
import type { ProductionConservativeMode } from '@lib/productionConservativeMode';
import type { PreGenerationStabilizer } from '@lib/preGenerationStabilizer';
import type { CreativeDrift } from '@lib/creativeDriftEngine';
import type { CreativeDriftLongitudinalView } from '@lib/creativeDriftLongitudinalView';
import type { CreativeFatigue } from '@lib/creativeFatigueEngine';
import type { MutationPlan } from '@lib/generationMutationPlanner';
import type { RefusalNarrativeOutput } from '@lib/refusalNarrativeEngine';
import type { AdaptationOrchestration } from '@lib/adaptationOrchestrator';
import type { SystemEnergyModel } from '@lib/systemEnergyModel';
import type { AdaptiveCadence } from '@lib/adaptiveCadenceEngine';
import type {
  ConsequencePattern, HistoricalCorrelation, RiskEscalation, TimelineEvent,
} from '@lib/consequenceAnalyzer';
import type { RecoveryPattern, StabilizationSuccess } from '@lib/recoveryIntelligence';
import type { PerformanceDNA } from '@lib/performanceDNA';
import type { PatternLifecycle } from '@lib/decayIntelligence';
import type { HookLifecycle } from '@lib/hookLifecycleEngine';
import type { AudienceSegmentReport } from '@lib/audienceSegmentMemory';
import type { EmotionalResponseMap } from '@lib/emotionalResponseMap';
import type { HumanTruthReading } from '@lib/humanTruthIntelligence';
import type { ManipulationPressureReading } from '@lib/manipulationPressureAnalyzer';
import type { AuthenticityContinuityReading } from '@lib/authenticityContinuity';
import type { SoulPreservationReading } from '@lib/soulPreservationLayer';
import type { AntiOptimizationReading } from '@lib/antiOptimizationDetector';
import type { EmotionalDignityReading } from '@lib/emotionalDignityModel';

type BrutalityLabel = 'lenient' | 'default' | 'brutal';

type StreamPayload =
  | { type: 'event'; event: PipelineEvent }
  | { type: 'banner'; banner: Banner; svg: string }
  | { type: 'error'; error: string };

const BRUTALITY_VALUES: Record<BrutalityLabel, number> = {
  lenient: 0.5, default: 0.65, brutal: 0.9,
};

export default function StudioPage() {
  return (
    <Suspense fallback={<PreviewSkeleton running={true} />}>
      <StudioInner />
    </Suspense>
  );
}

function StudioInner() {
  const router = useRouter();
  const sp = useSearchParams();

  // Selection state — initialized from URL params, mutable thereafter.
  const initialFormula = (sp.get('formula') as Formula) || 'ENERGY';
  const initialMode = (sp.get('mode') as CampaignMode | null) || null;
  const initialBrutality = (sp.get('brutality') as BrutalityLabel | null) || 'default';

  const [formula, setFormula] = useState<Formula>(initialFormula);
  const [mode, setMode] = useState<CampaignMode | null>(initialMode);
  const [brutality, setBrutality] = useState<BrutalityLabel>(initialBrutality);

  // Run trigger: increments each time the user presses GENERATE.
  // 0 → no run requested. The auto-mount effect bumps it to 1.
  const [runCounter, setRunCounter] = useState(0);

  // Stream state.
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  // Longitudinal Quality (read-only) — fetched on mount + after each run.
  const [longitudinal, setLongitudinal] = useState<QualityLongitudinalView | null>(null);
  // Policy Audit (read-only governance trail) — same lifecycle.
  const [policyAudit, setPolicyAudit] = useState<PolicyAuditView | null>(null);
  // Cultural Perception (read-only emotional weather) — same lifecycle.
  const [cultural, setCultural] = useState<CulturalPerceptionLongitudinalView | null>(null);
  // Cross-Brain Conflict (read-only internal disagreement) — same lifecycle.
  const [conflict, setConflict] = useState<ConflictLongitudinalView | null>(null);
  // Cognitive Weight Evolution (read-only authority drift) — same lifecycle.
  const [cogWeight, setCogWeight] = useState<CognitiveWeightLongitudinalView | null>(null);
  // Identity Continuity (read-only persistent selfhood) — same lifecycle.
  const [identity, setIdentity] = useState<IdentityContinuityLongitudinalView | null>(null);
  // Executive Governance (read-only internal leadership) — same lifecycle.
  const [governance, setGovernance] = useState<ExecutiveGovernanceLongitudinalView | null>(null);
  // Strategic Outcome Intelligence (read-only durable-success modeling) — same lifecycle.
  const [outcome, setOutcome] = useState<StrategicOutcomeLongitudinalView | null>(null);
  // Counterfactual Cognition (read-only multi-path campaign simulation) — same lifecycle.
  const [counterfactual, setCounterfactual] = useState<CounterfactualCognitionLongitudinalView | null>(null);
  // Campaign Lifecycle Evolution (read-only) — same lifecycle.
  const [campaignLifecycle, setCampaignLifecycle] = useState<CampaignLifecycleLongitudinalView | null>(null);
  // Branch Activation Log (human-supervised reinforcement memory) — same lifecycle.
  const [branchActivation, setBranchActivation] = useState<BranchActivationLongitudinalView | null>(null);
  // Projection Calibration (annotation-only observatory) — same lifecycle.
  const [projectionCalibration, setProjectionCalibration] = useState<ProjectionCalibrationLongitudinalView | null>(null);
  // Operator Confidence Preference (visual-overlay sliders) — same lifecycle.
  const [operatorConfidence, setOperatorConfidence] = useState<OperatorConfidencePreferenceView | null>(null);
  // Operator Calibration Reconciliation (intuition-vs-evidence observatory) — same lifecycle.
  const [operatorReconciliation, setOperatorReconciliation] = useState<OperatorCalibrationReconciliationLongitudinalView | null>(null);
  // System Integrity (stability + safety probe) — same lifecycle.
  const [systemIntegrity, setSystemIntegrity] = useState<SystemIntegrityReport | null>(null);
  // Pre-generation stability (advisory only; never auto-applies).
  const [preGenStability, setPreGenStability] = useState<{
    productionConservativeMode: ProductionConservativeMode;
    preGenerationStabilizer: PreGenerationStabilizer;
    envelopePresent: boolean;
  } | null>(null);
  // Creative drift (observatory only — never modifies generation).
  const [creativeDrift, setCreativeDrift] = useState<{
    current: CreativeDrift;
    longitudinal: CreativeDriftLongitudinalView;
  } | null>(null);
  // Creative fatigue / mutation planner / refusal narrative / DNAs — all advisory.
  const [creativeFatigue, setCreativeFatigue] = useState<CreativeFatigue | null>(null);
  const [mutationPlan, setMutationPlan] = useState<{ plan: MutationPlan; fatigueSummary: { fatigueLevel: number; freshnessScore: number; predictabilityScore: number; collapseRisk: number } } | null>(null);
  const [refusalNarrative, setRefusalNarrative] = useState<RefusalNarrativeOutput | null>(null);
  const [visualDNA, setVisualDNA] = useState<{ totalObservations: number; saturations: Record<string, { dominantToken: string | null; share: number; distinct: number }>; averageRealism: number; averagePolish: number } | null>(null);
  const [narrativeDNA, setNarrativeDNA] = useState<{ totalObservations: number; saturations: Record<string, { dominantToken: string | null; share: number; distinct: number }>; averageObservationalDensity: number; averageHumanRealism: number; averageCtaPressure: number } | null>(null);
  // Adaptation orchestrator — coordinated priority + energy + cadence.
  const [orchestration, setOrchestration] = useState<{ orchestration: AdaptationOrchestration; energy: SystemEnergyModel; cadence: AdaptiveCadence } | null>(null);
  // Human truth — ethical observatory.
  const [humanTruth, setHumanTruth] = useState<{
    authenticity: HumanTruthReading;
    manipulationPressure: ManipulationPressureReading;
    humanContinuity: AuthenticityContinuityReading;
    soulPreservation: SoulPreservationReading;
    antiOptimizationSignals: AntiOptimizationReading;
    dignitySignals: EmotionalDignityReading;
    trustVsPerformance: { gap: number; highPerformingThreat: boolean; performanceWithoutTrustCount: number };
  } | null>(null);
  // Reality intelligence — real-world outcomes attached to fingerprints.
  const [realityIntel, setRealityIntel] = useState<{
    totalOutcomes: number;
    performanceDNA: PerformanceDNA;
    longTermPerformers: PatternLifecycle[];
    fastBurnPatterns: PatternLifecycle[];
    recoveryWindows: PatternLifecycle[];
    hookLifecycle: HookLifecycle[];
    audienceSegments: AudienceSegmentReport;
    emotionalResponseMap: EmotionalResponseMap;
  } | null>(null);
  // Consequence intelligence — historical causal patterns.
  const [consequenceIntel, setConsequenceIntel] = useState<{
    totalEpisodes: number;
    consequencePatterns: ConsequencePattern[];
    historicalCorrelations: HistoricalCorrelation[];
    riskEscalations: RiskEscalation[];
    strategicTimeline: TimelineEvent[];
    recoveryPatterns: RecoveryPattern[];
    stabilizationSuccesses: StabilizationSuccess[];
    topRecoveryTakeaways: string[];
    recoveryEpisodeCount: number;
  } | null>(null);
  const mountedRef = useRef(false);

  // Auto-fire the first run when the page mounts from a URL with params.
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    setRunCounter(1);
  }, []);

  // Pipeline run effect — keyed on runCounter so each Generate triggers
  // a fresh stream. Reads the latest selection at the moment of trigger.
  useEffect(() => {
    if (runCounter === 0) return;
    let cancelled = false;
    void run();
    async function run() {
      // Reset stream state for the new run.
      setEvents([]);
      setBanner(null);
      setSvg(null);
      setError(null);
      setRunning(true);
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            formula,
            campaignMode: mode,
            brutality: BRUTALITY_VALUES[brutality],
          }),
        });
        if (cancelled) return;
        if (!res.ok || !res.body) {
          setError(`Pipeline error: ${res.status}`);
          setRunning(false);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (cancelled) return;
          buffer += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            const payload = JSON.parse(line) as StreamPayload;
            if (payload.type === 'event') {
              setEvents((prev) => [...prev, payload.event]);
            } else if (payload.type === 'banner') {
              setBanner(payload.banner);
              setSvg(payload.svg);
            } else if (payload.type === 'error') {
              setError(payload.error);
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setRunning(false);
        // Refresh the longitudinal view after the run settles (success
        // or failure). Read-only fetch; no effect on generation.
        if (!cancelled) {
          fetch('/api/quality-longitudinal', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setLongitudinal(v as QualityLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/policy-audit', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setPolicyAudit(v as PolicyAuditView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/cultural-perception', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setCultural(v as CulturalPerceptionLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/cross-brain-conflict', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setConflict(v as ConflictLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/cognitive-weight', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setCogWeight(v as CognitiveWeightLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/identity-continuity', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setIdentity(v as IdentityContinuityLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/executive-governance', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setGovernance(v as ExecutiveGovernanceLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/strategic-outcome', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setOutcome(v as StrategicOutcomeLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/counterfactual-cognition', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setCounterfactual(v as CounterfactualCognitionLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/campaign-evolution', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setCampaignLifecycle(v as CampaignLifecycleLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/branch-activation', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setBranchActivation(v as BranchActivationLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/projection-calibration', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setProjectionCalibration(v as ProjectionCalibrationLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/operator-confidence-preference?operatorId=studio', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setOperatorConfidence(v as OperatorConfidencePreferenceView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/operator-calibration-reconciliation?operatorId=studio', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setOperatorReconciliation(v as OperatorCalibrationReconciliationLongitudinalView); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/system-integrity', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setSystemIntegrity(v as SystemIntegrityReport); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/creative-drift', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setCreativeDrift(v as { current: CreativeDrift; longitudinal: CreativeDriftLongitudinalView }); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/creative-fatigue', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setCreativeFatigue(v as CreativeFatigue); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/mutation-planner', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setMutationPlan(v); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/refusal-narrative', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setRefusalNarrative(v as RefusalNarrativeOutput); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/visual-dna', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setVisualDNA(v); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/narrative-dna', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setNarrativeDNA(v); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/adaptation-orchestrator', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setOrchestration(v); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/consequence-intelligence', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setConsequenceIntel(v); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/reality-intelligence', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setRealityIntel(v); })
            .catch(() => { /* non-fatal */ });
          fetch('/api/human-truth', { cache: 'no-store' })
            .then((r) => r.ok ? r.json() : null)
            .then((v) => { if (!cancelled && v) setHumanTruth(v); })
            .catch(() => { /* non-fatal */ });
        }
      }
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runCounter]);

  // Mount-time fetch of the longitudinal view so the panel is populated
  // even on initial page load before the first run completes.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/quality-longitudinal', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setLongitudinal(v as QualityLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/policy-audit', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setPolicyAudit(v as PolicyAuditView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/cultural-perception', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setCultural(v as CulturalPerceptionLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/cross-brain-conflict', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setConflict(v as ConflictLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/cognitive-weight', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setCogWeight(v as CognitiveWeightLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/identity-continuity', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setIdentity(v as IdentityContinuityLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/executive-governance', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setGovernance(v as ExecutiveGovernanceLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/strategic-outcome', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setOutcome(v as StrategicOutcomeLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/counterfactual-cognition', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setCounterfactual(v as CounterfactualCognitionLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/campaign-evolution', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setCampaignLifecycle(v as CampaignLifecycleLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/branch-activation', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setBranchActivation(v as BranchActivationLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/projection-calibration', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setProjectionCalibration(v as ProjectionCalibrationLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/operator-confidence-preference?operatorId=studio', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setOperatorConfidence(v as OperatorConfidencePreferenceView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/operator-calibration-reconciliation?operatorId=studio', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setOperatorReconciliation(v as OperatorCalibrationReconciliationLongitudinalView); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/system-integrity', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setSystemIntegrity(v as SystemIntegrityReport); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/creative-drift', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setCreativeDrift(v as { current: CreativeDrift; longitudinal: CreativeDriftLongitudinalView }); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/creative-fatigue', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setCreativeFatigue(v as CreativeFatigue); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/mutation-planner', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setMutationPlan(v); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/refusal-narrative', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setRefusalNarrative(v as RefusalNarrativeOutput); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/visual-dna', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setVisualDNA(v); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/narrative-dna', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setNarrativeDNA(v); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/adaptation-orchestrator', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setOrchestration(v); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/consequence-intelligence', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setConsequenceIntel(v); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/reality-intelligence', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setRealityIntel(v); })
      .catch(() => { /* non-fatal */ });
    fetch('/api/human-truth', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setHumanTruth(v); })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, []);

  // Keep the URL in sync with current selection (shareable / bookmarkable)
  // WITHOUT triggering a new run.
  useEffect(() => {
    if (!mountedRef.current) return;
    const params = new URLSearchParams();
    params.set('formula', formula);
    params.set('brutality', brutality);
    if (mode) params.set('mode', mode);
    router.replace(`/studio?${params.toString()}`, { scroll: false });
  }, [formula, mode, brutality, router]);

  // Pre-generation stability check (advisory only — never gates Generate).
  // Re-fetches whenever the selection changes so the panel reflects the
  // CURRENT requested combination before the operator clicks Generate.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/pre-generation-stability', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ formula, campaignMode: mode, brutality: BRUTALITY_VALUES[brutality] }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((v) => { if (!cancelled && v) setPreGenStability(v); })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, [formula, mode, brutality]);

  function triggerRun() {
    setRunCounter((n) => n + 1);
  }

  function scrollToControls() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const svgDataUrl = useMemo(
    () => (svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : null),
    [svg],
  );

  async function downloadPng() {
    if (!banner) return;
    const res = await fetch(`/api/banner/${banner.id}/export`, { method: 'POST' });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-energy-${banner.id.slice(0, 8)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const exhausted = !running && !!error && error.toLowerCase().includes('exhausted');
  // Generic non-exhausted errors are surfaced inline too, with the same
  // recovery affordances — no full-screen takeover.
  const otherError = !running && !!error && !exhausted;

  return (
    <main className="min-h-screen flex flex-col">
      <ControlBar
        formula={formula} setFormula={setFormula}
        mode={mode} setMode={setMode}
        brutality={brutality} setBrutality={setBrutality}
        running={running}
        onGenerate={triggerRun}
      />

      <div className="flex-1 px-6 md:px-12 py-6 grid grid-cols-1 md:grid-cols-[1fr_360px] gap-10">
        <section className="flex items-start justify-center pt-6">
          {svgDataUrl ? (
            <div className="w-full max-w-[540px]">
              <img src={svgDataUrl} alt="banner" className="w-full h-auto block shadow-2xl" />
              <div className="mt-6 flex gap-3 flex-wrap">
                <button
                  onClick={downloadPng}
                  className="px-5 py-2 bg-bone-50 text-ink-900 text-xs tracking-widest font-semibold"
                >
                  EXPORT PNG
                </button>
                <button
                  onClick={triggerRun}
                  disabled={running}
                  className="px-5 py-2 border hairline text-xs tracking-widest text-bone-50 hover:bg-white/5 disabled:opacity-40"
                >
                  GENERATE ANOTHER
                </button>
                <a
                  href="/"
                  className="px-5 py-2 border hairline text-xs tracking-widest text-bone-50 hover:bg-white/5"
                >
                  BACK TO LANDING
                </a>
              </div>
            </div>
          ) : exhausted || otherError ? (
            <RefusalBlock
              exhausted={exhausted}
              errorMessage={error ?? 'unknown error'}
              onTryAgain={triggerRun}
              onChangeFormula={scrollToControls}
              onBackToStudio={() => router.push('/')}
              running={running}
            />
          ) : (
            <PreviewSkeleton running={running} />
          )}
        </section>

        <aside className="border-l hairline pl-6 md:pl-10 flex flex-col gap-6 max-h-[88vh] overflow-y-auto">
          <div>
            <div className="eyebrow">formula</div>
            <div className="mt-1 text-lg tracking-widest font-medium">{formula}</div>
            {mode && <div className="mt-1 text-xs text-bone-200/60">{mode.toUpperCase()} MODE</div>}
          </div>

          {orchestration && (
            <>
              <AdaptationOrchestratorPanel o={orchestration.orchestration} />
              <SystemEnergyPanel e={orchestration.energy} />
              <AdaptiveCadencePanel c={orchestration.cadence} />
            </>
          )}
          {consequenceIntel && <ConsequenceIntelligencePanel c={consequenceIntel} />}
          {realityIntel && <RealityIntelligencePanel r={realityIntel} />}
          {humanTruth && <HumanTruthPanel h={humanTruth} />}

          {preGenStability && (
            <>
              <ProductionConservativeModePanel
                conservative={preGenStability.productionConservativeMode}
                envelopePresent={preGenStability.envelopePresent}
              />
              <PreGenerationStabilizerPanel stab={preGenStability.preGenerationStabilizer} />
            </>
          )}
          {creativeDrift && (
            <CreativeDriftPanel
              current={creativeDrift.current}
              longitudinal={creativeDrift.longitudinal}
            />
          )}
          {refusalNarrative && <RefusalIntelligencePanel r={refusalNarrative} />}
          {creativeFatigue && <CreativeFatiguePanel f={creativeFatigue} />}
          {mutationPlan && <MutationPlannerPanel plan={mutationPlan.plan} summary={mutationPlan.fatigueSummary} />}
          {visualDNA && <VisualDNAPanel d={visualDNA} />}
          {narrativeDNA && <NarrativeDNAPanel d={narrativeDNA} />}

          {banner && (
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <Field label="STATE" value={banner.state.label} />
                <Field label="FAMILY" value={banner.state.family} />
                <Field label="TRUTH" value={banner.truth.truth} multiline />
                <Field label="TENSION" value={banner.truth.tension} />
                <Field label="HOOK" value={banner.direction.hook} multiline />
                <Field label="LAYOUT" value={banner.direction.layoutFamily} />
                <Field label="PRODUCT ROLE" value={banner.direction.productRole} />
              </div>

              <div className="border-t hairline pt-3 space-y-2">
                <div className="eyebrow">campaign brain</div>
                <Field
                  label="ASSET JOB"
                  value={`${banner.tasteSystem.campaignBrain.job.job.toUpperCase()} — ${banner.tasteSystem.campaignBrain.job.rationale}`}
                  multiline
                />
                <Field
                  label="CULTURAL MOMENT"
                  value={banner.tasteSystem.campaignBrain.culturalMoment.id}
                />
                <Field
                  label="READING"
                  value={`"${banner.tasteSystem.campaignBrain.culturalMoment.reading}"`}
                  multiline
                />
                <Field
                  label="COURAGE"
                  value={`${banner.tasteSystem.campaignBrain.courage.level.toUpperCase()} — ${banner.tasteSystem.campaignBrain.courage.reason}`}
                  multiline
                />
                <Field
                  label="RHYTHM HEALTH"
                  value={`${banner.tasteSystem.campaignBrain.rhythm.healthScore.toFixed(1)}/10 · imbalanced: ${banner.tasteSystem.campaignBrain.rhythm.mostImbalanced ?? 'none'}`}
                />
                <Field
                  label="ANTI-AI SMELL"
                  value={`${banner.tasteSystem.campaignBrain.antiAI.smell.toFixed(1)}/10 — signatures: [${banner.tasteSystem.campaignBrain.antiAI.signatures.join(', ') || 'none'}]`}
                  multiline
                />
                {banner.tasteSystem.campaignBrain.antiAI.driftSignatures.length > 0 && (
                  <Field
                    label="CAMPAIGN DRIFT"
                    value={banner.tasteSystem.campaignBrain.antiAI.driftSignatures.join(', ')}
                    multiline
                  />
                )}
                <Field
                  label="EMOTIONAL RESIDUE"
                  value={banner.tasteSystem.campaignBrain.residue}
                  multiline
                />
              </div>

              <div className="border-t hairline pt-3 space-y-2">
                <div className="eyebrow">taste system</div>
                <Field
                  label="FINAL VERDICT"
                  value={`${banner.finalVerdict.verdict} @ brutality ${banner.finalVerdict.brutality.toFixed(2)}`}
                />
                <Field
                  label="TASTE JUDGE"
                  value={`${banner.tasteSystem.judge.verdict} · composite ${banner.tasteSystem.judge.composite.toFixed(1)}/10`}
                />
                <Field
                  label="NEAREST REF"
                  value={`${banner.tasteSystem.judge.closestCategory ?? '—'} · ${banner.tasteSystem.judge.closestDistance.toFixed(2)} away`}
                />
                {banner.tasteSystem.judge.closestReference && (
                  <Field
                    label="WHY THE REF WORKS"
                    value={banner.tasteSystem.judge.closestReference.why_it_works[0] ?? '—'}
                    multiline
                  />
                )}
                <Field
                  label="HUMAN REACTION"
                  value={`0.3s ${banner.tasteSystem.reaction.at_0_3s} → 1s ${banner.tasteSystem.reaction.at_1s} → 3s ${banner.tasteSystem.reaction.at_3s}`}
                  multiline
                />
                <Field
                  label="REACTION ARC"
                  value={banner.tasteSystem.reaction.arc}
                  multiline
                />
                <Field
                  label="ENGAGEMENT"
                  value={`${banner.tasteSystem.reaction.engagementQuality.toFixed(1)}/10`}
                />
                <Field
                  label="FATIGUE"
                  value={`${banner.tasteSystem.fatigue.verdict} · ${banner.tasteSystem.fatigue.totals.toFixed(1)}/10`}
                />
                <Field
                  label="DIRECTOR DIRECTIVE"
                  value={banner.tasteSystem.evolutionAtRunStart.move}
                />
                <Field
                  label="DIRECTOR NOTE"
                  value={banner.tasteSystem.evolutionAtRunStart.narrative}
                  multiline
                />

                {banner.tasteSystem.judge.rewards.length > 0 && (
                  <div className="text-xs text-bone-200/65 leading-snug">
                    <div className="eyebrow mb-1">rewards</div>
                    <ul className="space-y-0.5">
                      {banner.tasteSystem.judge.rewards.slice(0, 5).map((d, i) => (
                        <li key={i}>+ {d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {banner.tasteSystem.judge.punishments.length > 0 && (
                  <div className="text-xs text-signal-warning/70 leading-snug">
                    <div className="eyebrow mb-1">punishments</div>
                    <ul className="space-y-0.5">
                      {banner.tasteSystem.judge.punishments.slice(0, 5).map((d, i) => (
                        <li key={i}>− {d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {banner.tasteSystem.fatigue.flags.length > 0 && (
                  <div className="text-xs text-bone-200/55 leading-snug">
                    <div className="eyebrow mb-1">fatigue flags</div>
                    <ul className="space-y-0.5">
                      {banner.tasteSystem.fatigue.flags.map((f, i) => (
                        <li key={i}>· {f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Field label="ATTEMPTS" value={String(banner.attempts)} />
              </div>

              {banner.adStrategy && <AdStrategyBrainPanel strategy={banner.adStrategy} />}
              {banner.copywriter && <CopywriterBrainPanel copy={banner.copywriter} />}
              {banner.copyQuality && <CopyQualityPanel quality={banner.copyQuality} />}
              {banner.copyQualityPolicy && (
                <CopyQualityPolicyPanel
                  policy={banner.copyQualityPolicy}
                  preflightSource={banner.copyQualityPolicyPreflight?.source ?? null}
                />
              )}
              {longitudinal && <LongitudinalQualityPanel view={longitudinal} />}
              {policyAudit && <PolicyAuditPanel view={policyAudit} />}
              {cultural && <CulturalIntelligencePanel view={cultural} />}
              {conflict && <CrossBrainConflictPanel view={conflict} />}
              {cogWeight && <CognitiveWeightEvolutionPanel view={cogWeight} />}
              {identity && <IdentityContinuityPanel view={identity} />}
              {governance && <ExecutiveGovernancePanel view={governance} />}
              {outcome && <StrategicOutcomeIntelligencePanel view={outcome} />}
              {counterfactual && <CounterfactualCognitionPanel view={counterfactual} />}
              {campaignLifecycle && (
                <CampaignEvolutionPanel
                  view={campaignLifecycle}
                  onActivate={(req) => { void activateBranch(req, setBranchActivation); }}
                />
              )}
              {branchActivation && <BranchActivationPanel view={branchActivation} />}
              {projectionCalibration && <ProjectionCalibrationPanel view={projectionCalibration} />}
              {operatorConfidence && (
                <OperatorConfidencePreferencePanel
                  view={operatorConfidence}
                  projectionCalibration={projectionCalibration}
                  onUpdate={(req) => { void updateConfidencePreference(req, setOperatorConfidence); }}
                />
              )}
              {operatorReconciliation && (
                <OperatorCalibrationReconciliationPanel view={operatorReconciliation} />
              )}
              {systemIntegrity && <SystemIntegrityPanel report={systemIntegrity} />}
            </div>
          )}

          {/* Show all read-only longitudinal panels even without a
              banner — first load / after refusal still has data. */}
          {!banner && (longitudinal || policyAudit || cultural || conflict || cogWeight || identity || governance || outcome || counterfactual || campaignLifecycle || branchActivation || projectionCalibration || operatorConfidence || operatorReconciliation || systemIntegrity) && (
            <div className="space-y-4 text-sm">
              {longitudinal && <LongitudinalQualityPanel view={longitudinal} />}
              {policyAudit && <PolicyAuditPanel view={policyAudit} />}
              {cultural && <CulturalIntelligencePanel view={cultural} />}
              {conflict && <CrossBrainConflictPanel view={conflict} />}
              {cogWeight && <CognitiveWeightEvolutionPanel view={cogWeight} />}
              {identity && <IdentityContinuityPanel view={identity} />}
              {governance && <ExecutiveGovernancePanel view={governance} />}
              {outcome && <StrategicOutcomeIntelligencePanel view={outcome} />}
              {counterfactual && <CounterfactualCognitionPanel view={counterfactual} />}
              {campaignLifecycle && (
                <CampaignEvolutionPanel
                  view={campaignLifecycle}
                  onActivate={(req) => { void activateBranch(req, setBranchActivation); }}
                />
              )}
              {branchActivation && <BranchActivationPanel view={branchActivation} />}
              {projectionCalibration && <ProjectionCalibrationPanel view={projectionCalibration} />}
              {operatorConfidence && (
                <OperatorConfidencePreferencePanel
                  view={operatorConfidence}
                  projectionCalibration={projectionCalibration}
                  onUpdate={(req) => { void updateConfidencePreference(req, setOperatorConfidence); }}
                />
              )}
              {operatorReconciliation && (
                <OperatorCalibrationReconciliationPanel view={operatorReconciliation} />
              )}
              {systemIntegrity && <SystemIntegrityPanel report={systemIntegrity} />}
            </div>
          )}

          <div>
            <div className="eyebrow mb-2">pipeline trace</div>
            <ul className="space-y-1 text-xs font-mono text-bone-200/70">
              {events.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-bone-200/40 w-20 shrink-0">{e.stage}</span>
                  <span className="flex-1 break-words">{e.message}</span>
                </li>
              ))}
              {running && <li className="text-bone-50 pulse">·</li>}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

// ─── persistent control bar ───────────────────────────────────

interface ControlBarProps {
  formula: Formula;
  setFormula: (f: Formula) => void;
  mode: CampaignMode | null;
  setMode: (m: CampaignMode | null) => void;
  brutality: BrutalityLabel;
  setBrutality: (b: BrutalityLabel) => void;
  running: boolean;
  onGenerate: () => void;
}

function ControlBar({
  formula, setFormula, mode, setMode, brutality, setBrutality,
  running, onGenerate,
}: ControlBarProps) {
  return (
    <div className="sticky top-0 z-20 bg-ink-900/95 backdrop-blur border-b hairline">
      <div className="px-6 md:px-12 py-4 flex flex-wrap items-end gap-x-8 gap-y-4">
        <a href="/" className="block shrink-0">
          <div className="eyebrow">MOOD CREATIVE OS</div>
          <div className="text-[10px] text-bone-200/50">v0.1 · studio</div>
        </a>

        <div className="flex flex-col gap-1.5">
          <div className="eyebrow">formula</div>
          <div className="flex gap-1.5">
            {FORMULAS.map((f) => (
              <button
                key={f}
                onClick={() => setFormula(f)}
                className={`px-3 py-1.5 border hairline text-[11px] tracking-widest font-medium transition-colors ${
                  formula === f ? 'bg-bone-50 text-ink-900' : 'text-bone-50 hover:bg-white/5'
                }`}
                title={f === 'ENERGY'
                  ? 'ENERGY — fully tuned formula'
                  : `${f} — operational context (pipeline gracefully degrades imperfection directives to defaults)`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="eyebrow">campaign mode</div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setMode(null)}
              className={`px-2.5 py-1 text-[10px] tracking-wider border hairline transition-colors ${
                mode === null ? 'bg-white/10 text-bone-50' : 'text-bone-50/70 hover:bg-white/5'
              }`}
            >
              AUTO
            </button>
            {CAMPAIGN_MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 text-[10px] tracking-wider border hairline transition-colors ${
                  mode === m ? 'bg-bone-50 text-ink-900' : 'text-bone-50/70 hover:bg-white/5'
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="eyebrow">brutality</div>
          <div className="flex gap-1">
            {(['lenient', 'default', 'brutal'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBrutality(b)}
                className={`px-2.5 py-1 text-[10px] tracking-wider border hairline transition-colors ${
                  brutality === b ? 'bg-bone-50 text-ink-900' : 'text-bone-50/70 hover:bg-white/5'
                }`}
              >
                {b.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={running}
          className="ml-auto px-6 py-2.5 bg-bone-50 text-ink-900 text-xs tracking-[0.3em] font-semibold disabled:opacity-50"
        >
          {running ? 'COMPOSING…' : 'GENERATE'}
        </button>
      </div>
    </div>
  );
}

// ─── inline refusal block ─────────────────────────────────────

interface RefusalBlockProps {
  exhausted: boolean;
  errorMessage: string;
  onTryAgain: () => void;
  onChangeFormula: () => void;
  onBackToStudio: () => void;
  running: boolean;
}

function RefusalBlock({
  exhausted, errorMessage, onTryAgain, onChangeFormula, onBackToStudio, running,
}: RefusalBlockProps) {
  return (
    <div className="w-full max-w-[540px]">
      <div className="aspect-[4/5] border hairline flex flex-col items-center justify-center px-10 text-center">
        <div className="text-signal-warning text-xs tracking-[0.3em] mb-4">
          {exhausted ? 'NOT GOOD ENOUGH' : 'PIPELINE ERROR'}
        </div>
        <div className="text-xs text-bone-200/65 leading-relaxed max-w-xs">
          {exhausted ? (
            <>
              The critic refused every attempt at this brutality. Either lower the brutality,
              change the campaign mode, or wait — the system is meant to refuse.
            </>
          ) : (
            <span className="font-mono text-[11px]">{errorMessage}</span>
          )}
        </div>
      </div>
      <div className="mt-5 flex gap-3 flex-wrap">
        <button
          onClick={onTryAgain}
          disabled={running}
          className="px-5 py-2 bg-bone-50 text-ink-900 text-xs tracking-widest font-semibold disabled:opacity-40"
        >
          TRY AGAIN
        </button>
        <button
          onClick={onChangeFormula}
          className="px-5 py-2 border hairline text-xs tracking-widest text-bone-50 hover:bg-white/5"
        >
          CHANGE FORMULA
        </button>
        <button
          onClick={onBackToStudio}
          className="px-5 py-2 border hairline text-xs tracking-widest text-bone-50 hover:bg-white/5"
        >
          BACK TO STUDIO
        </button>
      </div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={`mt-0.5 ${multiline ? 'leading-snug' : 'truncate'}`}>{value}</div>
    </div>
  );
}

// ─── ad strategy brain panel ──────────────────────────────────

function AdStrategyBrainPanel({ strategy: s }: { strategy: AdStrategyAssessment }) {
  const riskTone = (v: number) =>
    v >= 7 ? 'text-signal-warning' :
    v >= 4 ? 'text-bone-200/85' :
            'text-bone-200/65';

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">ad strategy brain</div>
      <Field label="PRIMARY AUDIENCE" value={s.primaryAudience} />
      {s.secondaryAudience && <Field label="SECONDARY AUDIENCE" value={s.secondaryAudience} />}
      <Field label="EMOTIONAL WOUND" value={s.emotionalWound} multiline />
      <Field label="HIDDEN DESIRE" value={s.hiddenDesire} multiline />
      <Field label="SURFACE OBJECTION" value={s.surfaceObjection} multiline />
      <Field label="DEEPER OBJECTION" value={s.deeperObjection} multiline />
      <Field label="TRUST BARRIER" value={s.trustBarrier} multiline />
      <Field label="CAMPAIGN ROLE" value={s.campaignRole.toUpperCase()} />
      <Field label="RECOMMENDED ANGLE" value={s.recommendedAngle} multiline />
      <Field label="FORBIDDEN ANGLE" value={s.forbiddenAngle} multiline />
      <Field label="PERSUASION MODE" value={`${s.persuasionMode} · ${s.storyShape}`} />
      <Field label="PROOF NEED" value={s.proofNeed} />
      <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
        <div>
          <div className="eyebrow">URGENCY</div>
          <div className={`mt-0.5 ${riskTone(s.urgencyLevel)}`}>{s.urgencyLevel.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">REPETITION RISK</div>
          <div className={`mt-0.5 ${riskTone(s.repetitionRisk)}`}>{s.repetitionRisk.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">TRUST DEBT</div>
          <div className={`mt-0.5 ${riskTone(s.trustDebt)}`}>{s.trustDebt.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">BRAND RISK</div>
          <div className={`mt-0.5 ${riskTone(s.brandRisk)}`}>{s.brandRisk.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">STRATEGIC DEPTH</div>
          <div className="mt-0.5 text-bone-200/85">{s.strategicDepth.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">CONFIDENCE</div>
          <div className="mt-0.5 text-bone-200/85">{s.confidence.toFixed(1)}/10</div>
        </div>
      </div>
      <div className="text-[10px] text-bone-200/55 leading-snug">
        <div className="eyebrow mb-1">CREATIVE CONSTRAINTS · ADVISORY</div>
        <div>hook {s.creativeConstraints.hookIntensity}/10 · product {s.creativeConstraints.productVisibility}/10 · cta {s.creativeConstraints.ctaStrength}/10 · emotional {s.creativeConstraints.emotionalDirectness}/10</div>
        <div>text: {s.creativeConstraints.textAmount} · proof: {s.creativeConstraints.proofRequirement} · critic: {s.creativeConstraints.criticStrictnessRecommendation}</div>
      </div>
      {s.reasonCodes.length > 0 && (
        <div className="text-[10px] text-bone-200/55 leading-snug">
          <div className="eyebrow mb-1">REASON CODES</div>
          <ul className="space-y-0.5">
            {s.reasonCodes.slice(0, 8).map((r, i) => (
              <li key={i} className="break-words">· {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── copywriter brain panel ───────────────────────────────────

function CopywriterBrainPanel({ copy: c }: { copy: CopywriterOutput }) {
  const riskTone = (v: number) =>
    v >= 7 ? 'text-signal-warning' :
    v >= 4 ? 'text-bone-200/85' :
            'text-bone-200/65';
  const alignTone = (v: number) =>
    v >= 7 ? 'text-bone-50/85' :
    v >= 4 ? 'text-bone-200/85' :
            'text-signal-warning';
  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">copywriter brain</div>
      <div>
        <div className="eyebrow">HOOK</div>
        <div dir="rtl" className="mt-0.5 leading-snug text-bone-50/90">{c.hook}</div>
      </div>
      <div>
        <div className="eyebrow">BODY</div>
        <div dir="rtl" className="mt-0.5 leading-snug whitespace-pre-line text-bone-50/85">{c.body}</div>
      </div>
      <div>
        <div className="eyebrow">CTA</div>
        <div dir="rtl" className="mt-0.5 leading-snug text-bone-50/85">{c.cta}</div>
      </div>
      {c.proofLine && (
        <div>
          <div className="eyebrow">PROOF LINE</div>
          <div dir="rtl" className="mt-0.5 leading-snug text-bone-200/75 italic">{c.proofLine}</div>
        </div>
      )}
      <Field label="PERSUASION TONE" value={`${c.persuasionTone} · ${c.urgencyStyle} urgency`} />
      <Field label="PRODUCT PRESENCE" value={c.productPresence} />
      <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
        <div>
          <div className="eyebrow">TRUST ALIGNMENT</div>
          <div className={`mt-0.5 ${alignTone(c.trustAlignment)}`}>{c.trustAlignment.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">STRATEGIC ALIGNMENT</div>
          <div className={`mt-0.5 ${alignTone(c.strategicAlignment)}`}>{c.strategicAlignment.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">DIGNITY ALIGNMENT</div>
          <div className={`mt-0.5 ${alignTone(c.dignityAlignment)}`}>{c.dignityAlignment.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">REPETITION SIM</div>
          <div className={`mt-0.5 ${riskTone(c.repetitionSimilarity)}`}>{c.repetitionSimilarity.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">RESTRAINT</div>
          <div className="mt-0.5 text-bone-200/85">{c.restraintLevel.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">CONFIDENCE</div>
          <div className="mt-0.5 text-bone-200/85">{c.confidence.toFixed(1)}/10</div>
        </div>
      </div>
      {c.forbiddenPhrasesTriggered.length > 0 && (
        <div className="text-[10px] text-signal-warning/85 leading-snug">
          <div className="eyebrow mb-1">FORBIDDEN PHRASES TRIGGERED</div>
          <ul className="space-y-0.5">
            {c.forbiddenPhrasesTriggered.map((p, i) => (
              <li key={i}>· {p}</li>
            ))}
          </ul>
        </div>
      )}
      {c.reasonCodes.length > 0 && (
        <div className="text-[10px] text-bone-200/55 leading-snug">
          <div className="eyebrow mb-1">REASON CODES</div>
          <ul className="space-y-0.5">
            {c.reasonCodes.slice(0, 8).map((r, i) => (
              <li key={i} className="break-words">· {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── copy quality panel ───────────────────────────────────────

function CopyQualityPanel({ quality: q }: { quality: CopyQualityAxis }) {
  const tone = (v: number, inverted = false) => {
    const good = inverted ? v <= 3 : v >= 7;
    const bad  = inverted ? v >= 7 : v <= 3;
    return good ? 'text-bone-50/85' : bad ? 'text-signal-warning' : 'text-bone-200/85';
  };
  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">copy quality · read-only signal</div>
      <Field label="COPY INTEGRITY" value={`${q.copyIntegrity.toFixed(1)}/10`} />
      <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
        <div><div className="eyebrow">TRUST SAFETY</div>
          <div className={`mt-0.5 ${tone(q.trustSafety)}`}>{q.trustSafety.toFixed(1)}/10</div></div>
        <div><div className="eyebrow">DIGNITY SAFETY</div>
          <div className={`mt-0.5 ${tone(q.dignitySafety)}`}>{q.dignitySafety.toFixed(1)}/10</div></div>
        <div><div className="eyebrow">PROOF ADEQUACY</div>
          <div className={`mt-0.5 ${tone(q.proofAdequacy)}`}>{q.proofAdequacy.toFixed(1)}/10</div></div>
        <div><div className="eyebrow">CTA RESTRAINT</div>
          <div className={`mt-0.5 ${tone(q.ctaRestraint)}`}>{q.ctaRestraint.toFixed(1)}/10</div></div>
        <div><div className="eyebrow">HEBREW NATURALNESS</div>
          <div className={`mt-0.5 ${tone(q.hebrewNaturalness)}`}>{q.hebrewNaturalness.toFixed(1)}/10</div></div>
        <div><div className="eyebrow">STRATEGIC FIT</div>
          <div className={`mt-0.5 ${tone(q.strategicCopyFit)}`}>{q.strategicCopyFit.toFixed(1)}/10</div></div>
        <div><div className="eyebrow">REPETITION CONCERN</div>
          <div className={`mt-0.5 ${tone(q.repetitionConcern, true)}`}>{q.repetitionConcern.toFixed(1)}/10</div></div>
      </div>
      {q.warnings.length > 0 && (
        <div className="text-[10px] text-signal-warning/85 leading-snug">
          <div className="eyebrow mb-1">WARNINGS</div>
          <ul className="space-y-0.5">
            {q.warnings.map((w, i) => (<li key={i}>· {w}</li>))}
          </ul>
        </div>
      )}
      {q.reasonCodes.length > 0 && (
        <div className="text-[10px] text-bone-200/55 leading-snug">
          <div className="eyebrow mb-1">REASON CODES</div>
          <ul className="space-y-0.5">
            {q.reasonCodes.slice(0, 10).map((r, i) => (
              <li key={i} className="break-words">· {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── longitudinal quality panel ───────────────────────────────

function LongitudinalQualityPanel({ view: v }: { view: QualityLongitudinalView }) {
  if (!v.present) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">longitudinal quality</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const statusTone =
    v.driftStatus === 'critical' ? 'text-signal-warning' :
    v.driftStatus === 'eroding'  ? 'text-signal-warning' :
    v.driftStatus === 'cautious' ? 'text-bone-200/85' :
    v.driftStatus === 'healthy'  ? 'text-bone-50/85' :
                                   'text-bone-200/65';

  const Spark = ({ points, invert = false }: { points: { value: number }[]; invert?: boolean }) => {
    if (points.length < 2) {
      return <span className="text-[10px] text-bone-200/30">—</span>;
    }
    const w = 80, h = 14;
    const xs = points.map((_, i) => (i / (points.length - 1)) * w);
    const ys = points.map((p) => h - (p.value / 10) * h);
    const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
    const last = points[points.length - 1].value;
    const first = points[0].value;
    const delta = last - first;
    // For "invert" axes (concern / debt), rising = bad.
    const rising = delta > 0.3;
    const falling = delta < -0.3;
    const stroke = invert
      ? rising ? '#C9A24B' : falling ? '#8AA98A' : 'rgba(247,245,242,0.55)'
      : rising ? '#8AA98A' : falling ? '#C9A24B' : 'rgba(247,245,242,0.55)';
    return <svg width={w} height={h}><path d={d} fill="none" stroke={stroke} strokeWidth="1" /></svg>;
  };

  const trendRow = (label: string, current: number | string, points: { at: number; value: number }[], invert = false) => (
    <div className="flex items-center gap-2 text-[10px] tabular-nums">
      <span className="text-bone-200/55 flex-grow">{label}</span>
      <span className="w-[60px] text-right text-bone-50/80">{current}</span>
      <Spark points={points} invert={invert} />
    </div>
  );

  const driftTone = (delta: number, invert = false) => {
    if (Math.abs(delta) < 0.2) return 'text-bone-200/55';
    const positive = delta > 0;
    return invert
      ? positive ? 'text-signal-warning' : 'text-bone-50/85'
      : positive ? 'text-bone-50/85' : 'text-signal-warning';
  };

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">longitudinal quality · brand health monitor</div>
      <div className={`text-xs ${statusTone}`}>{v.statement}</div>

      <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
        <div>
          <div className="eyebrow">TRUST DEBT</div>
          <div className="mt-0.5 text-bone-50/85">{v.trustDebtCurrent.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">BRAND DIGNITY</div>
          <div className="mt-0.5 text-bone-50/85">{v.brandDignityCurrent.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">DIGNITY EROSION</div>
          <div className="mt-0.5 text-bone-50/85">{v.dignityErosionCurrent.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">REPEATED STRUCTURES</div>
          <div className="mt-0.5 text-bone-50/85">{v.repeatedStructuresCurrent.toFixed(1)}/10</div>
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-1">
        {trendRow('trust debt',        v.trustDebtCurrent.toFixed(1),     v.trustDebtTrend, true)}
        {trendRow('brand risk',        v.brandRiskTrend.length > 0 ? v.brandRiskTrend[v.brandRiskTrend.length - 1].value.toFixed(1) : '—', v.brandRiskTrend, true)}
        {trendRow('repetition risk',   v.repetitionRiskTrend.length > 0 ? v.repetitionRiskTrend[v.repetitionRiskTrend.length - 1].value.toFixed(1) : '—', v.repetitionRiskTrend, true)}
        {trendRow('copy integrity',    v.copyIntegrityTrend.length > 0 ? v.copyIntegrityTrend[v.copyIntegrityTrend.length - 1].value.toFixed(1) : '—', v.copyIntegrityTrend)}
        {trendRow('repetition concern',v.repetitionConcernTrend.length > 0 ? v.repetitionConcernTrend[v.repetitionConcernTrend.length - 1].value.toFixed(1) : '—', v.repetitionConcernTrend, true)}
        {trendRow('proof adequacy',    v.proofAdequacyTrend.length > 0 ? v.proofAdequacyTrend[v.proofAdequacyTrend.length - 1].value.toFixed(1) : '—', v.proofAdequacyTrend)}
        {trendRow('hebrew naturalness',v.hebrewNaturalnessTrend.length > 0 ? v.hebrewNaturalnessTrend[v.hebrewNaturalnessTrend.length - 1].value.toFixed(1) : '—', v.hebrewNaturalnessTrend)}
        {trendRow('strategic copy fit',v.strategicCopyFitTrend.length > 0 ? v.strategicCopyFitTrend[v.strategicCopyFitTrend.length - 1].value.toFixed(1) : '—', v.strategicCopyFitTrend)}
      </div>

      {v.axisAverages.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">AXIS AVERAGES · RECENT VS OVERALL</div>
          <div className="flex flex-col gap-0.5">
            {v.axisAverages.map((a) => {
              const inverted = a.axis === 'repetitionConcern';
              return (
                <div key={a.axis} className="flex items-center gap-2 text-[10px] tabular-nums">
                  <span className="text-bone-200/55 flex-grow">{a.axis}</span>
                  <span className="w-[60px] text-right text-bone-50/75">recent {a.averageRecent.toFixed(1)}</span>
                  <span className="w-[60px] text-right text-bone-200/55">over {a.averageOverall.toFixed(1)}</span>
                  <span className={`w-[60px] text-right ${driftTone(a.driftRecentVsOverall, inverted)}`}>
                    {a.driftRecentVsOverall > 0 ? '+' : ''}{a.driftRecentVsOverall.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {v.audienceFatigueRanking.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">AUDIENCE FATIGUE RANKING</div>
          <div className="flex flex-col gap-0.5">
            {v.audienceFatigueRanking.map((a) => (
              <div key={a.audience} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/55 flex-grow">{a.audience}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{a.usageCount}</span>
                <span className="w-[60px] text-right text-bone-200/55">rec {a.recency.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.topForbiddenTriggers.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">TOP FORBIDDEN TRIGGERS</div>
          <div className="flex flex-col gap-0.5">
            {v.topForbiddenTriggers.map((t) => (
              <div key={t.phrase} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow break-words">{t.phrase}</span>
                <span className="w-[40px] text-right text-signal-warning/85">×{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        mirror success {(v.mirrorSuccessRate * 100).toFixed(0)}% ({v.mirrorCount}/{v.totalCopiesProduced}) ·
        strategy assessments {v.totalStrategyAssessments} ·
        quality samples {v.totalCopyQualitySamples}
      </div>
    </div>
  );
}

// ─── copy quality policy panel ────────────────────────────────

function CopyQualityPolicyPanel({
  policy: p,
  preflightSource,
}: {
  policy: CopyQualityPolicyRecommendation;
  preflightSource: 'explicit-true' | 'explicit-false' | 'policy-default' | null;
}) {
  const bandTone =
    p.policyBand === 'strict'  ? 'text-signal-warning' :
    p.policyBand === 'warn'    ? 'text-bone-50/85' :
    p.policyBand === 'observe' ? 'text-bone-200/85' :
                                 'text-bone-200/65';
  const sourceLabel =
    preflightSource === 'explicit-true'  ? 'explicit (request: true)'  :
    preflightSource === 'explicit-false' ? 'explicit (request: false)' :
    preflightSource === 'policy-default' ? 'policy default'             :
                                           null;
  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">copy quality policy · advisory</div>
      <div className="text-xs text-bone-200/65 italic">
        recommendation only — does not flip <code>copyQualityRefusalEnabled</code>.
      </div>
      {sourceLabel && (
        <div className="text-[10px] text-bone-200/55">
          policy source: <span className="text-bone-50/75">{sourceLabel}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
        <div>
          <div className="eyebrow">RECOMMENDED BAND</div>
          <div className={`mt-0.5 uppercase tracking-widest ${bandTone}`}>{p.policyBand}</div>
        </div>
        <div>
          <div className="eyebrow">RECOMMEND ENABLED?</div>
          <div className={`mt-0.5 ${p.recommendedEnabled ? 'text-bone-50/85' : 'text-bone-200/65'}`}>
            {p.recommendedEnabled ? 'yes' : 'no'}
          </div>
        </div>
        <div>
          <div className="eyebrow">CONFIDENCE</div>
          <div className="mt-0.5 text-bone-200/85">{p.confidence.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">SUGGESTED THRESHOLDS</div>
          <div className="mt-0.5 text-bone-200/85">
            {p.suggestedIntegrityThreshold > 0
              ? `integrity < ${p.suggestedIntegrityThreshold.toFixed(1)} · brutality ≥ ${p.suggestedBrutalityThreshold.toFixed(2)}`
              : '—'}
          </div>
        </div>
      </div>
      {p.reasonCodes.length > 0 && (
        <div className="text-[10px] text-bone-200/55 leading-snug">
          <div className="eyebrow mb-1">REASON CODES</div>
          <ul className="space-y-0.5">
            {p.reasonCodes.slice(0, 10).map((r, i) => (
              <li key={i} className="break-words">· {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── policy audit panel ───────────────────────────────────────

function PolicyAuditPanel({ view: v }: { view: PolicyAuditView }) {
  if (!v.present) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">policy audit · governance memory</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const verdictTone = (verdict: string | null) =>
    verdict === 'approve'         ? 'text-bone-50/85' :
    verdict === 'reject-image'    ? 'text-signal-warning/85' :
    verdict === 'reject-concept'  ? 'text-signal-warning/85' :
    verdict === 'reject-taste'    ? 'text-signal-warning/85' :
                                    'text-bone-200/55';

  const bandTone = (band: string) =>
    band === 'strict'  ? 'text-signal-warning' :
    band === 'warn'    ? 'text-bone-50/85' :
    band === 'observe' ? 'text-bone-200/85' :
                         'text-bone-200/55';

  const overrideTone = (kind: string) =>
    kind === 'auto-applied'            ? 'text-bone-50/85' :
    kind === 'explicit-override-true'  ? 'text-bone-50/85' :
    kind === 'explicit-override-false' ? 'text-bone-200/65' :
    kind === 'recommended-only'        ? 'text-signal-warning/85' :
                                         'text-bone-200/55';

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">policy audit · governance memory</div>
      <div className="text-xs text-bone-200/75">{v.statement}</div>

      <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
        <div>
          <div className="eyebrow">TOTAL AUDITED</div>
          <div className="mt-0.5 text-bone-50/85">{v.totalAudited}</div>
        </div>
        <div>
          <div className="eyebrow">REFUSAL-ENABLED RATE</div>
          <div className="mt-0.5 text-bone-50/85">{(v.refusalEnabledRate * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div className="eyebrow">AUTO-APPLIED</div>
          <div className="mt-0.5 text-bone-50/85">{v.autoAppliedCount}</div>
        </div>
        <div>
          <div className="eyebrow">EXPLICIT OVERRIDES</div>
          <div className="mt-0.5 text-bone-50/85">{v.explicitOverrideCount}</div>
        </div>
      </div>

      {v.overrideTypeBreakdown.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">OVERRIDE TYPE BREAKDOWN</div>
          <div className="flex flex-col gap-0.5">
            {v.overrideTypeBreakdown.map((row) => (
              <div key={row.overrideType} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className={`flex-grow ${overrideTone(row.overrideType)}`}>{row.overrideType}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{row.count}</span>
                <span className="w-[50px] text-right text-bone-200/55">{(row.share * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.topReasonCodes.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">TOP REASON CODES</div>
          <div className="flex flex-col gap-0.5">
            {v.topReasonCodes.map((r) => (
              <div key={r.code} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow break-words">{r.code}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.formulaPressureRanking.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">FORMULA PRESSURE RANKING</div>
          <div className="flex flex-col gap-0.5">
            {v.formulaPressureRanking.map((row) => (
              <div key={row.formula} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow">{row.formula}</span>
                <span className="w-[40px] text-right text-bone-50/75">{row.pressureScore.toFixed(2)}</span>
                <span className="w-[80px] text-right text-bone-200/55">
                  s{row.strictCount}/w{row.warnCount}/o{row.observeCount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.modeRiskRanking.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">MODE COPY RISK RANKING</div>
          <div className="flex flex-col gap-0.5">
            {v.modeRiskRanking.map((row) => (
              <div key={row.mode} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow">{row.mode}</span>
                <span className="w-[60px] text-right text-bone-50/75">
                  {row.averageCopyIntegrity !== null ? `int ${row.averageCopyIntegrity.toFixed(1)}` : '—'}
                </span>
                <span className="w-[60px] text-right text-bone-200/55">
                  {row.averageRepetitionConcern !== null ? `rep ${row.averageRepetitionConcern.toFixed(1)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.formulaIntegrityAverages.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">AVG COPY INTEGRITY BY FORMULA</div>
          <div className="flex flex-col gap-0.5">
            {v.formulaIntegrityAverages.map((row) => (
              <div key={row.formula} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow">{row.formula}</span>
                <span className="w-[40px] text-right text-bone-50/75">
                  {row.averageCopyIntegrity !== null ? row.averageCopyIntegrity.toFixed(1) : '—'}
                </span>
                <span className="w-[60px] text-right text-bone-200/55">{row.samples} samples</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.recentEntries.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">RECENT AUDIT ENTRIES</div>
          <div className="flex flex-col gap-0.5">
            {v.recentEntries.map((row) => (
              <div key={row.id} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/55 w-[42px] shrink-0">{row.formula}</span>
                <span className={`w-[58px] uppercase tracking-widest ${bandTone(row.policyBand)}`}>
                  {row.policyBand}
                </span>
                <span className={`flex-grow truncate ${overrideTone(row.overrideType)}`}>
                  {row.overrideType}
                </span>
                <span className={`w-[68px] text-right truncate ${verdictTone(row.outcomeVerdict)}`}>
                  {row.outcomeVerdict ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── cultural intelligence panel ──────────────────────────────

function CulturalIntelligencePanel({
  view: v,
}: { view: CulturalPerceptionLongitudinalView }) {
  const p = v.perception;

  if (!v.present) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">cultural intelligence · emotional weather</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const climateTone =
    p.humanResonance >= 7 ? 'text-bone-50/85' :
    p.humanResonance >= 5 ? 'text-bone-200/85' :
                            'text-signal-warning/85';
  const heatTone = (score: number, invert = false) => {
    const positive = invert ? score <= 4 : score >= 7;
    const negative = invert ? score >= 7 : score <= 4;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  const SignalChip = ({ s }: { s: string }) => {
    const isWarning =
      s === 'emotionally-numb' || s === 'over-performed' || s === 'trust-fragile' ||
      s === 'visually-exhausted' || s === 'algorithmically-obvious' ||
      s === 'aesthetic-burnout' || s === 'high-pattern-density' ||
      s === 'novel-but-unsafe' || s === 'emotionally-understimulated';
    const isGood = s === 'human-resonant' || s === 'emotionally-fresh' || s === 'trend-rising';
    const tone = isWarning ? 'text-signal-warning/85 border-signal-warning/30'
               : isGood ? 'text-bone-50/85 border-bone-50/30'
               : 'text-bone-200/75 border-bone-200/30';
    return (
      <span className={`px-1.5 py-0.5 text-[9px] tracking-widest uppercase border ${tone}`}>
        {s}
      </span>
    );
  };

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">cultural intelligence · emotional weather</div>
      <div className={`text-xs ${climateTone}`}>{v.statement}</div>

      {p.dominantSignals.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {p.dominantSignals.map((s) => <SignalChip key={s} s={s} />)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
        <div>
          <div className="eyebrow">HUMAN RESONANCE</div>
          <div className={`mt-0.5 ${heatTone(p.humanResonance)}`}>{p.humanResonance.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">TRUST CLIMATE</div>
          <div className={`mt-0.5 ${heatTone(p.trustClimate)}`}>{p.trustClimate.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">NOVELTY</div>
          <div className={`mt-0.5 ${heatTone(p.noveltyScore)}`}>{p.noveltyScore.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">EMOTIONAL FRESHNESS</div>
          <div className={`mt-0.5 ${heatTone(p.emotionalFreshness)}`}>{p.emotionalFreshness.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">AESTHETIC FATIGUE</div>
          <div className={`mt-0.5 ${heatTone(p.aestheticFatigue, true)}`}>{p.aestheticFatigue.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">AUDIENCE NUMBNESS</div>
          <div className={`mt-0.5 ${heatTone(p.audienceNumbness, true)}`}>{p.audienceNumbness.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">CONFORMITY RISK</div>
          <div className={`mt-0.5 ${heatTone(p.conformityRisk, true)}`}>{p.conformityRisk.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">AUTHENTICITY</div>
          <div className={`mt-0.5 ${heatTone(p.perceivedAuthenticity)}`}>{p.perceivedAuthenticity.toFixed(1)}/10</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
        <div>
          <div className="eyebrow">PACING FATIGUE</div>
          <div className={`mt-0.5 ${heatTone(p.pacingFatigue, true)}`}>{p.pacingFatigue.toFixed(1)}/10</div>
        </div>
        <div>
          <div className="eyebrow">HOOK SATURATION</div>
          <div className={`mt-0.5 ${heatTone(p.hookSaturation, true)}`}>{p.hookSaturation.toFixed(1)}/10</div>
        </div>
      </div>

      {(p.emotionalDrift.movingToward.length > 0 || p.emotionalDrift.movingAwayFrom.length > 0) && (
        <div className="pt-2 text-[10px]">
          <div className="eyebrow mb-1">EMOTIONAL DRIFT</div>
          {p.emotionalDrift.movingToward.length > 0 && (
            <div className="text-bone-50/75">→ moving toward: {p.emotionalDrift.movingToward.join(', ')}</div>
          )}
          {p.emotionalDrift.movingAwayFrom.length > 0 && (
            <div className="text-bone-200/55">← moving away from: {p.emotionalDrift.movingAwayFrom.join(', ')}</div>
          )}
        </div>
      )}

      {p.culturalWarnings.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">CULTURAL WARNINGS</div>
          <ul className="text-[10px] text-signal-warning/80 leading-snug space-y-0.5">
            {p.culturalWarnings.slice(0, 5).map((w, i) => <li key={i} className="break-words">· {w}</li>)}
          </ul>
        </div>
      )}

      {p.strategicOpportunities.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">OPPORTUNITY ZONES</div>
          <ul className="text-[10px] text-bone-50/80 leading-snug space-y-0.5">
            {p.strategicOpportunities.slice(0, 5).map((o, i) => <li key={i} className="break-words">· {o}</li>)}
          </ul>
        </div>
      )}

      {p.forbiddenDirections.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">FORBIDDEN DIRECTIONS</div>
          <ul className="text-[10px] text-bone-200/55 leading-snug space-y-0.5">
            {p.forbiddenDirections.slice(0, 5).map((f, i) => <li key={i} className="break-words">· {f}</li>)}
          </ul>
        </div>
      )}

      {v.aestheticCollapseZones.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">AESTHETIC COLLAPSE ZONES</div>
          <div className="flex flex-col gap-0.5">
            {v.aestheticCollapseZones.slice(0, 3).map((z) => (
              <div key={z.patternKey} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow truncate">{z.patternKey}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{z.freq}</span>
                <span className="w-[50px] text-right text-bone-200/55">{(z.share * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.platformFatigueRanking.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">PLATFORM FATIGUE RANKING</div>
          <div className="flex flex-col gap-0.5">
            {v.platformFatigueRanking.slice(0, 4).map((row) => (
              <div key={row.mode} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow">{row.mode}</span>
                <span className={`w-[40px] text-right ${heatTone(row.fatigueScore, true)}`}>
                  {row.fatigueScore.toFixed(1)}
                </span>
                <span className="w-[60px] text-right text-bone-200/55">×{row.observations}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.dyingCreativePatterns.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">DYING CREATIVE PATTERNS</div>
          <div className="flex flex-col gap-0.5">
            {v.dyingCreativePatterns.slice(0, 3).map((row) => (
              <div key={row.patternKey} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/55 flex-grow truncate">{row.patternKey}</span>
                <span className="w-[40px] text-right text-bone-50/65">×{row.freq}</span>
                <span className="w-[50px] text-right text-bone-200/55">
                  {(row.recentActivityRatio * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        observations {v.totalObservations} · quality samples {v.totalQualitySamples} ·
        policy audits {v.totalPolicyAudits}
      </div>
    </div>
  );
}

// ─── cross-brain conflict panel ───────────────────────────────

function CrossBrainConflictPanel({ view: v }: { view: ConflictLongitudinalView }) {
  const c = v.current;

  if (!v.present && !c) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">cross-brain conflict · internal cognition</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const trendTone =
    v.instabilityTrend === 'rising'  ? 'text-signal-warning' :
    v.instabilityTrend === 'falling' ? 'text-bone-50/85' :
    v.instabilityTrend === 'stable'  ? 'text-bone-200/85' :
                                       'text-bone-200/65';

  const heatTone = (score: number, invert = false) => {
    const positive = invert ? score <= 4 : score >= 7;
    const negative = invert ? score >= 7 : score <= 4;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  const SystemBar = ({ label, value }: { label: string; value: number }) => {
    const w = Math.min(100, (value / 10) * 100);
    const tone =
      value >= 7 ? 'bg-bone-50/70' :
      value >= 4 ? 'bg-bone-200/55' :
                   'bg-signal-warning/55';
    return (
      <div className="flex items-center gap-2 text-[10px] tabular-nums">
        <span className="text-bone-200/55 w-[60px] shrink-0">{label}</span>
        <div className="flex-grow h-[6px] border hairline relative">
          <div className={`absolute inset-y-0 left-0 ${tone}`} style={{ width: `${w}%` }} />
        </div>
        <span className="w-[40px] text-right text-bone-50/75">{value.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">cross-brain conflict · internal cognition</div>
      <div className={`text-xs ${trendTone}`}>{v.statement}</div>

      {c && (
        <>
          <div className="grid grid-cols-3 gap-2 text-xs tabular-nums pt-1">
            <div>
              <div className="eyebrow">TENSION</div>
              <div className={`mt-0.5 ${heatTone(c.overallTension, true)}`}>{c.overallTension.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">STABILITY</div>
              <div className={`mt-0.5 ${heatTone(c.cognitiveStability)}`}>{c.cognitiveStability.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">ALIGNMENT</div>
              <div className={`mt-0.5 ${heatTone(c.alignmentScore)}`}>{c.alignmentScore.toFixed(1)}/10</div>
            </div>
          </div>

          {c.dominantConflict && (
            <div className="text-[11px] text-signal-warning/85 tracking-wider uppercase pt-1">
              dominant: {c.dominantConflict}
            </div>
          )}

          {c.activeConflicts.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">ACTIVE CONFLICTS</div>
              <ul className="space-y-1.5">
                {c.activeConflicts.slice(0, 5).map((a) => (
                  <li key={a.type} className="text-[10px] leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate">{a.type}</span>
                      <span className={`w-[40px] text-right ${heatTone(a.severity, true)}`}>
                        {a.severity.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="text-bone-200/55 mt-0.5 break-words">{a.explanation}</div>
                    <div className="text-bone-200/45 text-[9px] mt-0.5">
                      systems: {a.systemsInvolved.join(' · ')}
                    </div>
                    <div className="text-bone-200/45 text-[9px] italic mt-0.5 break-words">
                      → {a.suggestedObservation}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            <div className="eyebrow mb-1">SYSTEM WEIGHTS</div>
            <div className="flex flex-col gap-0.5">
              <SystemBar label="strategy" value={c.systemWeights.strategy} />
              <SystemBar label="culture"  value={c.systemWeights.culture} />
              <SystemBar label="trust"    value={c.systemWeights.trust} />
              <SystemBar label="novelty"  value={c.systemWeights.novelty} />
              <SystemBar label="fatigue"  value={c.systemWeights.fatigue} />
              <SystemBar label="quality"  value={c.systemWeights.quality} />
            </div>
          </div>

          {c.agreementZones.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">AGREEMENT ZONES</div>
              <ul className="text-[10px] text-bone-50/75 leading-snug space-y-0.5">
                {c.agreementZones.slice(0, 4).map((z, i) => <li key={i} className="break-words">· {z}</li>)}
              </ul>
            </div>
          )}

          {c.unstableZones.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">UNSTABLE ZONES</div>
              <ul className="text-[10px] text-signal-warning/80 leading-snug space-y-0.5">
                {c.unstableZones.slice(0, 4).map((z, i) => <li key={i} className="break-words">· {z}</li>)}
              </ul>
            </div>
          )}

          {c.silentRisks.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">SILENT RISKS</div>
              <ul className="text-[10px] text-bone-200/55 leading-snug space-y-0.5">
                {c.silentRisks.slice(0, 4).map((z, i) => <li key={i} className="break-words">· {z}</li>)}
              </ul>
            </div>
          )}

          {(c.confidenceGradient.highConfidenceAreas.length > 0 || c.confidenceGradient.uncertainAreas.length > 0) && (
            <div className="pt-2">
              <div className="eyebrow mb-1">CONFIDENCE GRADIENT</div>
              {c.confidenceGradient.highConfidenceAreas.length > 0 && (
                <div className="text-[10px] text-bone-50/75 leading-snug">
                  <div className="text-bone-200/55 text-[9px] uppercase tracking-widest">high confidence</div>
                  <ul className="space-y-0.5">
                    {c.confidenceGradient.highConfidenceAreas.slice(0, 3).map((s, i) => <li key={i} className="break-words">· {s}</li>)}
                  </ul>
                </div>
              )}
              {c.confidenceGradient.uncertainAreas.length > 0 && (
                <div className="text-[10px] text-bone-200/55 leading-snug mt-1">
                  <div className="text-bone-200/55 text-[9px] uppercase tracking-widest">uncertain</div>
                  <ul className="space-y-0.5">
                    {c.confidenceGradient.uncertainAreas.slice(0, 3).map((s, i) => <li key={i} className="break-words">· {s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {v.recurringConflicts.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">RECURRING CONFLICTS</div>
          <div className="flex flex-col gap-0.5">
            {v.recurringConflicts.slice(0, 6).map((r) => (
              <div key={r.type} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.type}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className={`w-[50px] text-right ${heatTone(r.ewmaSeverity, true)}`}>
                  ewma {r.ewmaSeverity.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.conflictHotspots.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">CONFLICT HOTSPOTS</div>
          <div className="flex flex-col gap-0.5">
            {v.conflictHotspots.slice(0, 4).map((row) => (
              <div key={row.key} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow truncate">{row.key}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{row.count}</span>
                <span className={`w-[40px] text-right ${heatTone(row.averageSeverity, true)}`}>
                  {row.averageSeverity.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.stableAgreementZones.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">STABLE AGREEMENT ZONES</div>
          <div className="flex flex-col gap-0.5">
            {v.stableAgreementZones.slice(0, 4).map((z) => (
              <div key={z.zone} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 flex-grow truncate">{z.zone}</span>
                <span className="w-[40px] text-right text-bone-200/55">×{z.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        observations {v.totalObservations} · avg tension {v.averageTension.toFixed(1)}/10 ·
        avg stability {v.averageStability.toFixed(1)}/10 ·
        silent-risk rate {(v.silentRiskRate * 100).toFixed(0)}%
      </div>
    </div>
  );
}

// ─── cognitive weight evolution panel ─────────────────────────

function CognitiveWeightEvolutionPanel({
  view: v,
}: { view: CognitiveWeightLongitudinalView }) {
  const c = v.current;

  if (!v.present && !c) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">cognitive weight evolution · authority drift</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const trendTone =
    v.fragmentationTrend === 'rising'  ? 'text-signal-warning' :
    v.fragmentationTrend === 'falling' ? 'text-bone-50/85' :
    v.fragmentationTrend === 'stable'  ? 'text-bone-200/85' :
                                         'text-bone-200/65';

  const heatTone = (score: number, invert = false) => {
    const positive = invert ? score <= 4 : score >= 7;
    const negative = invert ? score >= 7 : score <= 4;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  const WeightBar = ({ label, value, sub }: { label: string; value: number; sub?: string }) => {
    const w = Math.min(100, (value / 10) * 100);
    const tone =
      value >= 7 ? 'bg-bone-50/70' :
      value >= 4 ? 'bg-bone-200/55' :
                   'bg-signal-warning/55';
    return (
      <div className="flex items-center gap-2 text-[10px] tabular-nums">
        <span className="text-bone-200/65 w-[100px] shrink-0 truncate">{label}</span>
        <div className="flex-grow h-[6px] border hairline relative">
          <div className={`absolute inset-y-0 left-0 ${tone}`} style={{ width: `${w}%` }} />
        </div>
        <span className="w-[36px] text-right text-bone-50/75">{value.toFixed(1)}</span>
        {sub && <span className="w-[40px] text-right text-bone-200/45 text-[9px]">{sub}</span>}
      </div>
    );
  };

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">cognitive weight evolution · authority drift</div>
      <div className={`text-xs ${trendTone}`}>{v.statement}</div>

      {c && (
        <>
          <div className="grid grid-cols-3 gap-2 text-xs tabular-nums pt-1">
            <div>
              <div className="eyebrow">STABILITY</div>
              <div className={`mt-0.5 ${heatTone(c.globalStability)}`}>{c.globalStability.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">ADAPTATION</div>
              <div className={`mt-0.5 ${heatTone(c.adaptationPressure, true)}`}>{c.adaptationPressure.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">FRAGMENTATION</div>
              <div className={`mt-0.5 ${heatTone(c.cognitiveFragmentation, true)}`}>{c.cognitiveFragmentation.toFixed(1)}/10</div>
            </div>
          </div>

          {c.dominantSystems.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">DOMINANT BRAINS</div>
              <div className="flex flex-col gap-0.5">
                {c.dominantSystems.map((d) => (
                  <div key={d.system}>
                    <WeightBar label={d.system} value={d.weight} sub={`conf ${d.confidence.toFixed(1)}`} />
                    <div className="text-bone-200/45 text-[9px] mt-0.5 ml-[108px] break-words">
                      {d.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {c.suppressedSystems.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">SUPPRESSED BRAINS</div>
              <div className="flex flex-col gap-0.5">
                {c.suppressedSystems.map((s) => (
                  <div key={s.system} className="text-[10px] tabular-nums">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-200/55 w-[100px] shrink-0 truncate">{s.system}</span>
                      <span className="text-signal-warning/75">−{s.suppressionScore.toFixed(1)}</span>
                    </div>
                    <div className="text-bone-200/45 text-[9px] ml-[108px] break-words">{s.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {c.unstableWeights.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">UNSTABLE WEIGHTS</div>
              <div className="flex flex-col gap-0.5">
                {c.unstableWeights.map((u) => (
                  <div key={u.system} className="text-[10px] tabular-nums">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-200/65 flex-grow truncate">{u.system}</span>
                      <span className={`w-[40px] text-right ${heatTone(u.volatility, true)}`}>
                        {u.volatility.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-bone-200/45 text-[9px] break-words">{u.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <div className="eyebrow mb-1">ENVIRONMENTAL SENSITIVITY</div>
            <div className="grid grid-cols-2 gap-2 text-[10px] tabular-nums">
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">fatigue</span>
                <span className={heatTone(c.environmentalSensitivity.fatigueSensitivity, true)}>
                  {c.environmentalSensitivity.fatigueSensitivity.toFixed(1)}/10
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">trust</span>
                <span className={heatTone(c.environmentalSensitivity.trustSensitivity, true)}>
                  {c.environmentalSensitivity.trustSensitivity.toFixed(1)}/10
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">novelty</span>
                <span className="text-bone-50/75">
                  {c.environmentalSensitivity.noveltySensitivity.toFixed(1)}/10
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">culture</span>
                <span className="text-bone-50/75">
                  {c.environmentalSensitivity.culturalSensitivity.toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>

          {c.contextualAuthority.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">CONTEXTUAL AUTHORITY</div>
              <ul className="space-y-1.5 text-[10px]">
                {c.contextualAuthority.map((row, i) => (
                  <li key={i} className="leading-snug">
                    <div className="text-bone-200/65 break-words">when {row.condition}</div>
                    <div className="text-bone-50/85 uppercase tracking-wider">→ {row.dominantSystem}</div>
                    <div className="text-bone-200/45 text-[9px] italic break-words">{row.reason}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.weightDrift.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">WEIGHT DRIFT (RECENT vs EWMA)</div>
              <div className="flex flex-col gap-0.5">
                {c.weightDrift.slice(0, 5).map((d) => {
                  const driftTone = d.drift > 0 ? 'text-bone-50/85' : 'text-signal-warning/75';
                  return (
                    <div key={d.system} className="flex items-center gap-2 text-[10px] tabular-nums">
                      <span className="text-bone-200/65 w-[100px] shrink-0 truncate">{d.system}</span>
                      <span className="w-[40px] text-right text-bone-200/55">{d.historicalWeight.toFixed(1)}</span>
                      <span className="w-[10px] text-bone-200/45 text-center">→</span>
                      <span className="w-[40px] text-right text-bone-50/75">{d.recentWeight.toFixed(1)}</span>
                      <span className={`w-[40px] text-right ${driftTone}`}>
                        {d.drift > 0 ? '+' : ''}{d.drift.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {v.systemDominanceRanking.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">DOMINANCE OVER TIME</div>
          <div className="flex flex-col gap-0.5">
            {v.systemDominanceRanking.slice(0, 6).map((r) => (
              <div key={r.system} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.system}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className="w-[50px] text-right text-bone-200/55">ewma {r.ewmaWeight.toFixed(1)}</span>
                <span className="w-[40px] text-right text-bone-200/45">{(r.share * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.losingAuthority.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">LOSING AUTHORITY</div>
          <div className="flex flex-col gap-0.5">
            {v.losingAuthority.map((r) => (
              <div key={r.system} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.system}</span>
                <span className="w-[40px] text-right text-bone-200/55">{r.historicalWeight.toFixed(1)}</span>
                <span className="w-[10px] text-bone-200/45 text-center">→</span>
                <span className="w-[40px] text-right text-bone-50/75">{r.recentWeight.toFixed(1)}</span>
                <span className="w-[40px] text-right text-signal-warning/75">−{r.collapseDelta.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.authorityTransitions.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">AUTHORITY TRANSITIONS</div>
          <div className="flex flex-col gap-0.5">
            {v.authorityTransitions.slice(0, 5).map((t) => (
              <div key={`${t.fromSystem}-${t.toSystem}`} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/55 flex-grow truncate">
                  <span className="uppercase tracking-wider">{t.fromSystem}</span>
                  <span className="text-bone-200/45"> → </span>
                  <span className="uppercase tracking-wider text-bone-50/75">{t.toSystem}</span>
                </span>
                <span className="w-[40px] text-right text-bone-50/75">×{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        observations {v.totalObservations} ·
        avg stability {v.averageStability.toFixed(1)}/10 ·
        avg fragmentation {v.averageFragmentation.toFixed(1)}/10 ·
        adaptation {v.averageAdaptationPressure.toFixed(1)}/10
      </div>
    </div>
  );
}

// ─── identity continuity panel ────────────────────────────────

function IdentityContinuityPanel({ view: v }: { view: IdentityContinuityLongitudinalView }) {
  const c = v.current;

  if (!v.present && !c) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">identity continuity · persistent selfhood</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const trendTone =
    v.continuityTrend === 'rising-fragmentation' ? 'text-signal-warning' :
    v.continuityTrend === 'consolidating'        ? 'text-bone-50/85' :
    v.continuityTrend === 'stable'               ? 'text-bone-200/85' :
                                                   'text-bone-200/65';

  const heatTone = (score: number, invert = false) => {
    const positive = invert ? score <= 4 : score >= 7;
    const negative = invert ? score >= 7 : score <= 4;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  const VectorBar = ({
    label, strength, persistence,
  }: { label: string; strength: number; persistence?: number }) => {
    const w = Math.min(100, (strength / 10) * 100);
    const pw = persistence !== undefined ? Math.min(100, (persistence / 10) * 100) : 0;
    const tone =
      strength >= 7 ? 'bg-bone-50/70' :
      strength >= 4 ? 'bg-bone-200/55' :
                      'bg-signal-warning/55';
    return (
      <div className="flex items-center gap-2 text-[10px] tabular-nums">
        <span className="text-bone-200/65 w-[130px] shrink-0 truncate">{label}</span>
        <div className="flex-grow h-[6px] border hairline relative">
          <div className={`absolute inset-y-0 left-0 ${tone}`} style={{ width: `${w}%` }} />
          {persistence !== undefined && (
            <div className="absolute inset-y-0 left-0 border-r border-bone-50/40" style={{ width: `${pw}%` }} />
          )}
        </div>
        <span className="w-[36px] text-right text-bone-50/75">{strength.toFixed(1)}</span>
        {persistence !== undefined && (
          <span className="w-[44px] text-right text-bone-200/45 text-[9px]">p {persistence.toFixed(1)}</span>
        )}
      </div>
    );
  };

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">identity continuity · persistent selfhood</div>
      <div className={`text-xs ${trendTone}`}>{v.statement}</div>

      {c && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
            <div>
              <div className="eyebrow">IDENTITY STABILITY</div>
              <div className={`mt-0.5 ${heatTone(c.identityStability)}`}>{c.identityStability.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">CONSISTENCY</div>
              <div className={`mt-0.5 ${heatTone(c.behavioralConsistency)}`}>{c.behavioralConsistency.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">FRAGMENTATION</div>
              <div className={`mt-0.5 ${heatTone(c.identityFragmentation, true)}`}>{c.identityFragmentation.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">ADAPTATION VELOCITY</div>
              <div className={`mt-0.5 ${heatTone(c.adaptationVelocity, true)}`}>{c.adaptationVelocity.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">CONTINUITY RISK</div>
              <div className={`mt-0.5 ${heatTone(c.continuityRisk, true)}`}>{c.continuityRisk.toFixed(1)}/10</div>
            </div>
          </div>

          {c.dominantIdentityVectors.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">DOMINANT IDENTITY VECTORS</div>
              <div className="flex flex-col gap-0.5">
                {c.dominantIdentityVectors.map((d) => (
                  <div key={d.vector}>
                    <VectorBar label={d.vector} strength={d.strength} persistence={d.persistence} />
                    <div className="text-bone-200/45 text-[9px] mt-0.5 ml-[138px] break-words">
                      {d.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {c.emergingIdentityVectors.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">EMERGING IDENTITIES</div>
              <ul className="text-[10px] text-bone-50/80 leading-snug space-y-0.5">
                {c.emergingIdentityVectors.slice(0, 3).map((e) => (
                  <li key={e.vector} className="break-words">
                    · <span className="uppercase tracking-wider">{e.vector}</span> — {e.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.collapsingIdentityVectors.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">COLLAPSING IDENTITIES</div>
              <ul className="text-[10px] text-signal-warning/75 leading-snug space-y-0.5">
                {c.collapsingIdentityVectors.slice(0, 3).map((d) => (
                  <li key={d.vector} className="break-words">
                    · <span className="uppercase tracking-wider">{d.vector}</span> — {d.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.identityContradictions.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">IDENTITY CONTRADICTIONS</div>
              <ul className="space-y-1.5 text-[10px]">
                {c.identityContradictions.map((row, i) => (
                  <li key={i} className="leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate">
                        {row.vectors.join(' ↔ ')}
                      </span>
                      <span className={`w-[40px] text-right ${heatTone(row.severity, true)}`}>
                        {row.severity.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="text-bone-200/55 mt-0.5 break-words">{row.explanation}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.contextualIdentityModes.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">CONTEXTUAL IDENTITY MODES</div>
              <ul className="space-y-1.5 text-[10px]">
                {c.contextualIdentityModes.map((row, i) => (
                  <li key={i} className="leading-snug">
                    <div className="text-bone-200/65 break-words">when {row.condition}</div>
                    <div className="text-bone-50/85 uppercase tracking-wider">→ {row.activeIdentity}</div>
                    <div className="text-bone-200/45 text-[9px] italic break-words">{row.explanation}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            <div className="eyebrow mb-1">IDENTITY PRESSURE</div>
            <div className="grid grid-cols-2 gap-2 text-[10px] tabular-nums">
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">novelty</span>
                <span className="text-bone-50/75">{c.identityPressure.noveltyPressure.toFixed(1)}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">trust</span>
                <span className={heatTone(c.identityPressure.trustPressure, true)}>
                  {c.identityPressure.trustPressure.toFixed(1)}/10
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">fatigue</span>
                <span className={heatTone(c.identityPressure.fatiguePressure, true)}>
                  {c.identityPressure.fatiguePressure.toFixed(1)}/10
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">adaptation</span>
                <span className={heatTone(c.identityPressure.adaptationPressure, true)}>
                  {c.identityPressure.adaptationPressure.toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>

          {c.longTermDrift.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">LONG-TERM DRIFT</div>
              <div className="flex flex-col gap-0.5">
                {c.longTermDrift.slice(0, 5).map((d) => {
                  const driftTone = d.drift > 0 ? 'text-bone-50/85' : 'text-signal-warning/75';
                  return (
                    <div key={d.vector} className="flex items-center gap-2 text-[10px] tabular-nums">
                      <span className="text-bone-200/65 w-[130px] shrink-0 truncate">{d.vector}</span>
                      <span className="w-[40px] text-right text-bone-200/55">{d.historical.toFixed(1)}</span>
                      <span className="w-[10px] text-bone-200/45 text-center">→</span>
                      <span className="w-[40px] text-right text-bone-50/75">{d.recent.toFixed(1)}</span>
                      <span className={`w-[40px] text-right ${driftTone}`}>
                        {d.drift > 0 ? '+' : ''}{d.drift.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {v.dominantOverTime.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">IDENTITY DOMINANCE OVER TIME</div>
          <div className="flex flex-col gap-0.5">
            {v.dominantOverTime.slice(0, 6).map((r) => (
              <div key={r.vector} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.vector}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className="w-[50px] text-right text-bone-200/55">ewma {r.ewmaStrength.toFixed(1)}</span>
                <span className="w-[40px] text-right text-bone-200/45">{(r.share * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.collapsingOverTime.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">LOSING IDENTITY</div>
          <div className="flex flex-col gap-0.5">
            {v.collapsingOverTime.slice(0, 4).map((r) => (
              <div key={r.vector} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.vector}</span>
                <span className="w-[40px] text-right text-bone-200/55">{r.historicalStrength.toFixed(1)}</span>
                <span className="w-[10px] text-bone-200/45 text-center">→</span>
                <span className="w-[40px] text-right text-bone-50/75">{r.recentStrength.toFixed(1)}</span>
                <span className="w-[40px] text-right text-signal-warning/75">−{r.decay.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.identityTransitions.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">IDENTITY TRANSITIONS</div>
          <div className="flex flex-col gap-0.5">
            {v.identityTransitions.slice(0, 5).map((t) => (
              <div key={`${t.fromVector}-${t.toVector}`} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/55 flex-grow truncate">
                  <span className="uppercase tracking-wider">{t.fromVector}</span>
                  <span className="text-bone-200/45"> → </span>
                  <span className="uppercase tracking-wider text-bone-50/75">{t.toVector}</span>
                </span>
                <span className="w-[40px] text-right text-bone-50/75">×{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.recurringBehavioralFingerprints.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">RECURRING BEHAVIORAL FINGERPRINTS</div>
          <div className="flex flex-col gap-0.5">
            {v.recurringBehavioralFingerprints.slice(0, 5).map((r) => (
              <div key={r.pattern} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow break-words">{r.pattern}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className="w-[40px] text-right text-bone-200/55">{(r.share * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.pressureOnlyVectors.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">ONLY APPEARS UNDER PRESSURE</div>
          <div className="flex flex-col gap-0.5">
            {v.pressureOnlyVectors.slice(0, 4).map((r) => (
              <div key={r.vector} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.vector}</span>
                <span className="w-[60px] text-right text-bone-200/55">pressure ×{r.pressureAppearances}</span>
                <span className="w-[50px] text-right text-bone-50/75">ratio {r.ratio.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.audienceAgnosticVectors.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">PERSISTS REGARDLESS OF AUDIENCE</div>
          <div className="flex flex-col gap-0.5">
            {v.audienceAgnosticVectors.slice(0, 4).map((r) => (
              <div key={r.vector} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 flex-grow uppercase tracking-wider truncate">{r.vector}</span>
                <span className="w-[50px] text-right text-bone-200/55">ewma {r.ewmaStrength.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        observations {v.totalObservations} ·
        avg stability {v.averageStability.toFixed(1)}/10 ·
        avg fragmentation {v.averageFragmentation.toFixed(1)}/10 ·
        avg continuity-risk {v.averageContinuityRisk.toFixed(1)}/10
      </div>
    </div>
  );
}

// ─── executive governance panel ───────────────────────────────

function ExecutiveGovernancePanel({ view: v }: { view: ExecutiveGovernanceLongitudinalView }) {
  const c = v.current;

  if (!v.present && !c) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">executive governance · internal leadership</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const trendTone =
    v.governanceTrend === 'fragmentation-rising' ? 'text-signal-warning' :
    v.governanceTrend === 'consolidating'        ? 'text-bone-50/85' :
    v.governanceTrend === 'stable'               ? 'text-bone-200/85' :
                                                   'text-bone-200/65';

  const heatTone = (score: number, invert = false) => {
    const positive = invert ? score <= 4 : score >= 7;
    const negative = invert ? score >= 7 : score <= 4;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  const roleTone = (role: string) =>
    role === 'executive'              ? 'text-bone-50 border-bone-50/40' :
    role === 'stabilizer'             ? 'text-bone-50/85 border-bone-50/30' :
    role === 'trust-guardian'         ? 'text-bone-50/85 border-bone-50/30' :
    role === 'identity-preserver'     ? 'text-bone-50/75 border-bone-50/25' :
    role === 'shadow-executive'       ? 'text-signal-warning/85 border-signal-warning/30' :
    role === 'fragmentation-risk'     ? 'text-signal-warning border-signal-warning/40' :
    role === 'executive-overreach' /* future */ ? 'text-signal-warning border-signal-warning/40' :
                                        'text-bone-200/65 border-bone-200/25';

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">executive governance · internal leadership</div>
      <div className={`text-xs ${trendTone}`}>{v.statement}</div>

      {c && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
            <div>
              <div className="eyebrow">GOV STABILITY</div>
              <div className={`mt-0.5 ${heatTone(c.governanceStability)}`}>{c.governanceStability.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">EXEC LEGITIMACY</div>
              <div className={`mt-0.5 ${heatTone(c.executiveLegitimacy)}`}>{c.executiveLegitimacy.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">AUTH FRAGMENTATION</div>
              <div className={`mt-0.5 ${heatTone(c.authorityFragmentation, true)}`}>{c.authorityFragmentation.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">ADAPTIVE BALANCE</div>
              <div className={`mt-0.5 ${heatTone(c.adaptiveBalance)}`}>{c.adaptiveBalance.toFixed(1)}/10</div>
            </div>
          </div>

          <div className="pt-2 text-[11px] leading-snug">
            <div className="eyebrow mb-1">CURRENT EXECUTIVE STRUCTURE</div>
            <div className="text-bone-50/85">
              executive: <span className="uppercase tracking-wider">{c.dominantGovernanceStructure.primaryExecutive ?? 'none'}</span>
            </div>
            {c.dominantGovernanceStructure.supportingSystems.length > 0 && (
              <div className="text-bone-200/65">
                supporting: {c.dominantGovernanceStructure.supportingSystems.join(' · ')}
              </div>
            )}
            {c.dominantGovernanceStructure.suppressedSystems.length > 0 && (
              <div className="text-bone-200/55">
                suppressed: {c.dominantGovernanceStructure.suppressedSystems.join(' · ')}
              </div>
            )}
            <div className="text-bone-200/45 text-[10px] italic mt-0.5">{c.dominantGovernanceStructure.explanation}</div>
          </div>

          {c.governanceRoles.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">GOVERNANCE ROLES</div>
              <ul className="space-y-1.5 text-[10px]">
                {c.governanceRoles.slice(0, 6).map((row) => (
                  <li key={row.system} className="leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-200/65 uppercase tracking-wider w-[100px] shrink-0 truncate">{row.system}</span>
                      <span className={`px-1.5 py-0.5 text-[9px] tracking-widest uppercase border ${roleTone(row.role)} shrink-0`}>
                        {row.role}
                      </span>
                      <span className="flex-grow" />
                      <span className="w-[40px] text-right text-bone-50/75">a {row.authority.toFixed(1)}</span>
                      <span className="w-[40px] text-right text-bone-200/55">s {row.stability.toFixed(1)}</span>
                      <span className="w-[40px] text-right text-bone-200/55">L {row.contextualLegitimacy.toFixed(1)}</span>
                    </div>
                    <div className="text-bone-200/45 text-[9px] mt-0.5 break-words">{row.explanation}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.shadowExecutives.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">SHADOW EXECUTIVES</div>
              <ul className="text-[10px] text-signal-warning/85 leading-snug space-y-0.5">
                {c.shadowExecutives.slice(0, 3).map((s) => (
                  <li key={s.system} className="break-words">
                    · <span className="uppercase tracking-wider">{s.system}</span> — {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.suppressedAuthorities.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">SUPPRESSED AUTHORITIES</div>
              <ul className="text-[10px] text-bone-200/65 leading-snug space-y-0.5">
                {c.suppressedAuthorities.slice(0, 3).map((s) => (
                  <li key={s.system} className="break-words">
                    · <span className="uppercase tracking-wider">{s.system}</span>
                    {' '}— suppression {s.suppressionScore.toFixed(1)}, historical legitimacy {s.historicalLegitimacy.toFixed(1)}/10
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.governanceConflicts.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">GOVERNANCE CONFLICTS</div>
              <ul className="space-y-1 text-[10px]">
                {c.governanceConflicts.map((row, i) => (
                  <li key={i} className="leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate">
                        {row.systems.join(' ⇄ ')}
                      </span>
                      <span className={`w-[40px] text-right ${heatTone(row.severity, true)}`}>
                        {row.severity.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="text-bone-200/55 break-words">{row.explanation}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.contextualLeadershipRules.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">CONTEXTUAL LEADERSHIP</div>
              <ul className="space-y-1.5 text-[10px]">
                {c.contextualLeadershipRules.map((row, i) => (
                  <li key={i} className="leading-snug">
                    <div className="text-bone-200/65 break-words">when {row.condition}</div>
                    <div className="text-bone-50/85 uppercase tracking-wider">→ {row.leader} leads</div>
                    <div className="text-bone-200/45 text-[9px] italic break-words">{row.rationale}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.executiveOverreachRisks.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">EXECUTIVE OVERREACH RISK</div>
              <ul className="text-[10px] text-signal-warning/85 leading-snug space-y-0.5">
                {c.executiveOverreachRisks.map((r) => (
                  <li key={r.system} className="break-words">
                    · <span className="uppercase tracking-wider">{r.system}</span>
                    {' '}({r.overreachScore.toFixed(1)}/10) — {r.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.authorityCollapseRisks.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">AUTHORITY COLLAPSE RISK</div>
              <ul className="text-[10px] text-signal-warning/75 leading-snug space-y-0.5">
                {c.authorityCollapseRisks.map((r) => (
                  <li key={r.system} className="break-words">
                    · <span className="uppercase tracking-wider">{r.system}</span>
                    {' '}({r.riskScore.toFixed(1)}/10) — {r.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            <div className="eyebrow mb-1">GOVERNANCE PRESSURE</div>
            <div className="grid grid-cols-2 gap-2 text-[10px] tabular-nums">
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">trust</span>
                <span className={heatTone(c.governancePressure.trustPressure, true)}>
                  {c.governancePressure.trustPressure.toFixed(1)}/10
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">novelty</span>
                <span className="text-bone-50/75">{c.governancePressure.noveltyPressure.toFixed(1)}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">adaptation</span>
                <span className={heatTone(c.governancePressure.adaptationPressure, true)}>
                  {c.governancePressure.adaptationPressure.toFixed(1)}/10
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">fragmentation</span>
                <span className={heatTone(c.governancePressure.fragmentationPressure, true)}>
                  {c.governancePressure.fragmentationPressure.toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>

          {c.longTermAuthorityDrift.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">LONG-TERM AUTHORITY DRIFT</div>
              <div className="flex flex-col gap-0.5">
                {c.longTermAuthorityDrift.slice(0, 5).map((d) => {
                  const driftTone = d.drift > 0 ? 'text-bone-50/85' : 'text-signal-warning/75';
                  return (
                    <div key={d.system} className="flex items-center gap-2 text-[10px] tabular-nums">
                      <span className="text-bone-200/65 w-[100px] shrink-0 truncate">{d.system}</span>
                      <span className="w-[40px] text-right text-bone-200/55">{d.historicalAuthority.toFixed(1)}</span>
                      <span className="w-[10px] text-bone-200/45 text-center">→</span>
                      <span className="w-[40px] text-right text-bone-50/75">{d.recentAuthority.toFixed(1)}</span>
                      <span className={`w-[40px] text-right ${driftTone}`}>
                        {d.drift > 0 ? '+' : ''}{d.drift.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {v.executiveRanking.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">EXECUTIVE RANKING OVER TIME</div>
          <div className="flex flex-col gap-0.5">
            {v.executiveRanking.slice(0, 6).map((r) => (
              <div key={r.system} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.system}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.executiveCount}</span>
                <span className="w-[50px] text-right text-bone-200/55">ewma {r.authorityEwma.toFixed(1)}</span>
                <span className="w-[40px] text-right text-bone-200/45">{(r.share * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.stabilizerRanking.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">STABILIZER RANKING</div>
          <div className="flex flex-col gap-0.5">
            {v.stabilizerRanking.slice(0, 5).map((r) => (
              <div key={r.system} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 flex-grow uppercase tracking-wider truncate">{r.system}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.stabilizerCount}</span>
                <span className="w-[40px] text-right text-bone-200/45">{(r.share * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.suppressionCycles.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">SUPPRESSION CYCLES</div>
          <div className="flex flex-col gap-0.5">
            {v.suppressionCycles.slice(0, 4).map((r) => (
              <div key={r.system} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.system}</span>
                <span className="w-[50px] text-right text-bone-200/55">supp ×{r.totalSuppressions}</span>
                <span className="w-[50px] text-right text-bone-50/75">shadow ×{r.shadowEmergences}</span>
                <span className="w-[40px] text-right text-bone-50/75">{r.predictiveRatio.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.authorityTransitions.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">AUTHORITY TRANSITIONS</div>
          <div className="flex flex-col gap-0.5">
            {v.authorityTransitions.slice(0, 5).map((t) => (
              <div key={`${t.fromSystem}-${t.toSystem}`} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/55 flex-grow truncate">
                  <span className="uppercase tracking-wider">{t.fromSystem}</span>
                  <span className="text-bone-200/45"> → </span>
                  <span className="uppercase tracking-wider text-bone-50/75">{t.toSystem}</span>
                </span>
                <span className="w-[40px] text-right text-bone-50/75">×{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.authorityConcentrationRanking.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">AUTHORITY CONCENTRATION</div>
          <div className="flex flex-col gap-0.5">
            {v.authorityConcentrationRanking.slice(0, 4).map((r) => (
              <div key={r.system} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.system}</span>
                <span className="w-[40px] text-right text-bone-200/55">{(r.share * 100).toFixed(0)}%</span>
                <span className="w-[40px] text-right text-bone-200/55">×{r.consecutive}</span>
                <span className={`w-[40px] text-right ${heatTone(r.concentrationScore, true)}`}>
                  {r.concentrationScore.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.recurringGovernanceStructures.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">RECURRING GOVERNANCE STRUCTURES</div>
          <div className="flex flex-col gap-0.5">
            {v.recurringGovernanceStructures.slice(0, 5).map((r) => (
              <div key={r.pattern} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow break-words">{r.pattern}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.governanceCollapsePatterns.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">GOVERNANCE COLLAPSE PATTERNS</div>
          <div className="flex flex-col gap-0.5">
            {v.governanceCollapsePatterns.slice(0, 4).map((r) => (
              <div key={r.pattern} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow break-words">{r.pattern}</span>
                <span className="w-[40px] text-right text-signal-warning/75">×{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        observations {v.totalObservations} ·
        avg stability {v.averageStability.toFixed(1)}/10 ·
        avg fragmentation {v.averageFragmentation.toFixed(1)}/10 ·
        avg legitimacy {v.averageLegitimacy.toFixed(1)}/10
      </div>
    </div>
  );
}

// ─── strategic outcome intelligence panel ─────────────────────

function StrategicOutcomeIntelligencePanel({
  view: v,
}: { view: StrategicOutcomeLongitudinalView }) {
  const c = v.current;

  if (!v.present && !c) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">strategic outcome intelligence · durable persuasion</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const trendTone =
    v.strategicTrend === 'eroding'      ? 'text-signal-warning' :
    v.strategicTrend === 'consolidating'? 'text-bone-50/85' :
    v.strategicTrend === 'stable'       ? 'text-bone-200/85' :
                                          'text-bone-200/65';

  const heatTone = (score: number, invert = false) => {
    const positive = invert ? score <= 4 : score >= 7;
    const negative = invert ? score >= 7 : score <= 4;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  const Spark = ({ points, invert = false }: { points: { value: number }[]; invert?: boolean }) => {
    if (points.length < 2) return <span className="text-[10px] text-bone-200/30">—</span>;
    const w = 80, h = 14;
    const xs = points.map((_, i) => (i / (points.length - 1)) * w);
    const ys = points.map((p) => h - (p.value / 10) * h);
    const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
    const last = points[points.length - 1].value;
    const first = points[0].value;
    const delta = last - first;
    const rising = delta > 0.3;
    const falling = delta < -0.3;
    const stroke = invert
      ? rising ? '#C9A24B' : falling ? '#8AA98A' : 'rgba(247,245,242,0.55)'
      : rising ? '#8AA98A' : falling ? '#C9A24B' : 'rgba(247,245,242,0.55)';
    return <svg width={w} height={h}><path d={d} fill="none" stroke={stroke} strokeWidth="1" /></svg>;
  };

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">strategic outcome intelligence · durable persuasion</div>
      <div className={`text-xs ${trendTone}`}>{v.statement}</div>

      {c && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
            <div>
              <div className="eyebrow">STRATEGIC STABILITY</div>
              <div className={`mt-0.5 ${heatTone(c.strategicStability)}`}>{c.strategicStability.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">TRUST DURABILITY</div>
              <div className={`mt-0.5 ${heatTone(c.trustDurability)}`}>{c.trustDurability.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">AUDIENCE RESILIENCE</div>
              <div className={`mt-0.5 ${heatTone(c.audienceResilience)}`}>{c.audienceResilience.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">NOVELTY FRAGILITY</div>
              <div className={`mt-0.5 ${heatTone(c.noveltyFragility, true)}`}>{c.noveltyFragility.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">LONG-TERM CONSISTENCY</div>
              <div className={`mt-0.5 ${heatTone(c.longTermConsistency)}`}>{c.longTermConsistency.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">STRATEGIC RISK</div>
              <div className={`mt-0.5 ${heatTone(c.strategicRisk, true)}`}>{c.strategicRisk.toFixed(1)}/10</div>
            </div>
          </div>

          {c.dominantStrategicSignatures.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">DOMINANT STRATEGIC SIGNATURES</div>
              <ul className="space-y-1.5 text-[10px]">
                {c.dominantStrategicSignatures.slice(0, 5).map((s) => (
                  <li key={s.signature} className="leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate">{s.signature}</span>
                      <span className="w-[40px] text-right text-bone-50/75">s {s.strength.toFixed(1)}</span>
                      <span className="w-[44px] text-right text-bone-200/55">p {s.persistence.toFixed(1)}</span>
                      <span className="w-[44px] text-right text-bone-50/75">d {s.durability.toFixed(1)}</span>
                    </div>
                    <div className="text-bone-200/45 text-[9px] mt-0.5 break-words">{s.explanation}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.emergingStrategicSignatures.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">EMERGING SIGNATURES</div>
              <ul className="text-[10px] text-bone-50/80 leading-snug space-y-0.5">
                {c.emergingStrategicSignatures.slice(0, 3).map((e) => (
                  <li key={e.signature} className="break-words">
                    · <span className="uppercase tracking-wider">{e.signature}</span> — {e.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.collapsingStrategicSignatures.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">COLLAPSING SIGNATURES</div>
              <ul className="text-[10px] text-signal-warning/75 leading-snug space-y-0.5">
                {c.collapsingStrategicSignatures.slice(0, 3).map((d) => (
                  <li key={d.signature} className="break-words">
                    · <span className="uppercase tracking-wider">{d.signature}</span> — {d.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.strategicContradictions.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">STRATEGIC CONTRADICTIONS · SHORT VS LONG-TERM</div>
              <ul className="space-y-1.5 text-[10px]">
                {c.strategicContradictions.map((row, i) => (
                  <li key={i} className="leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate">
                        {row.signatures.join(' ↔ ')}
                      </span>
                      <span className={`w-[40px] text-right ${heatTone(row.severity, true)}`}>
                        {row.severity.toFixed(1)}/10
                      </span>
                      <span className="w-[50px] text-right text-bone-200/55">
                        div {row.divergence.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-bone-200/55 mt-0.5 break-words">{row.explanation}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.counterfactualOutcomeComparisons.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">SHORT-TERM VS LONG-TERM DIVERGENCE</div>
              <ul className="space-y-1 text-[10px]">
                {c.counterfactualOutcomeComparisons.slice(0, 4).map((r) => (
                  <li key={r.signature} className="leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-200/65 uppercase tracking-wider flex-grow truncate">{r.signature}</span>
                      <span className="w-[44px] text-right text-bone-50/75">now {r.observedShortTerm.toFixed(1)}</span>
                      <span className="w-[10px] text-bone-200/45 text-center">·</span>
                      <span className="w-[44px] text-right text-bone-200/55">ewma {r.observedLongTerm.toFixed(1)}</span>
                      <span className={`w-[44px] text-right ${heatTone(r.divergence, true)}`}>div {r.divergence.toFixed(1)}</span>
                    </div>
                    <div className="text-bone-200/45 text-[9px] mt-0.5 break-words">{r.interpretation}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            <div className="eyebrow mb-1">STRATEGIC PRESSURE MAP</div>
            <div className="grid grid-cols-2 gap-2 text-[10px] tabular-nums">
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">trust</span>
                <span className={heatTone(c.strategicPressureMap.trustPressure, true)}>
                  {c.strategicPressureMap.trustPressure.toFixed(1)}/10
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">fatigue</span>
                <span className={heatTone(c.strategicPressureMap.fatiguePressure, true)}>
                  {c.strategicPressureMap.fatiguePressure.toFixed(1)}/10
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">novelty</span>
                <span className="text-bone-50/75">{c.strategicPressureMap.noveltyPressure.toFixed(1)}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bone-200/55 flex-grow">conversion</span>
                <span className={heatTone(c.strategicPressureMap.conversionPressure, true)}>
                  {c.strategicPressureMap.conversionPressure.toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>

          {c.longTermOutcomeDrift.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">LONG-TERM OUTCOME DRIFT</div>
              <div className="flex flex-col gap-0.5">
                {c.longTermOutcomeDrift.slice(0, 5).map((d) => {
                  const driftTone = d.drift > 0 ? 'text-bone-50/85' : 'text-signal-warning/75';
                  return (
                    <div key={d.signature} className="flex items-center gap-2 text-[10px] tabular-nums">
                      <span className="text-bone-200/65 w-[150px] shrink-0 uppercase tracking-wider truncate">{d.signature}</span>
                      <span className="w-[40px] text-right text-bone-200/55">{d.historical.toFixed(1)}</span>
                      <span className="w-[10px] text-bone-200/45 text-center">→</span>
                      <span className="w-[40px] text-right text-bone-50/75">{d.recent.toFixed(1)}</span>
                      <span className={`w-[40px] text-right ${driftTone}`}>
                        {d.drift > 0 ? '+' : ''}{d.drift.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {(v.trustAccumulationTrajectory.length >= 2 || v.fatigueAccumulationTrajectory.length >= 2) && (
        <div className="pt-2 flex flex-col gap-1">
          <div className="eyebrow mb-1">TRAJECTORIES</div>
          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span className="text-bone-200/55 flex-grow">trust accumulation</span>
            <Spark points={v.trustAccumulationTrajectory.map((p) => ({ value: p.trustDurability }))} />
          </div>
          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span className="text-bone-200/55 flex-grow">fatigue accumulation</span>
            <Spark points={v.fatigueAccumulationTrajectory.map((p) => ({ value: p.audienceNumbness }))} invert />
          </div>
          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span className="text-bone-200/55 flex-grow">strategic stability</span>
            <Spark points={v.strategicDriftTrace.map((p) => ({ value: p.strategicStability }))} />
          </div>
        </div>
      )}

      {v.longestSurvivingStructures.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">LONGEST-SURVIVING STRUCTURES</div>
          <div className="flex flex-col gap-0.5">
            {v.longestSurvivingStructures.slice(0, 5).map((r) => (
              <div key={r.signature} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 flex-grow uppercase tracking-wider truncate">{r.signature}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className="w-[50px] text-right text-bone-200/55">ewma {r.ewmaStrength.toFixed(1)}</span>
                <span className="w-[50px] text-right text-bone-50/75">stab {r.averageStabilityWhenActive.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.fastestDecayingStructures.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">FASTEST-DECAYING STRUCTURES</div>
          <div className="flex flex-col gap-0.5">
            {v.fastestDecayingStructures.slice(0, 5).map((r) => (
              <div key={r.signature} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.signature}</span>
                <span className="w-[40px] text-right text-bone-200/55">{r.historicalStrength.toFixed(1)}</span>
                <span className="w-[10px] text-bone-200/45 text-center">→</span>
                <span className="w-[40px] text-right text-bone-50/75">{r.recentStrength.toFixed(1)}</span>
                <span className="w-[40px] text-right text-signal-warning/75">−{r.decay.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.resilientGovernanceStructures.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">RESILIENT GOVERNANCE STRUCTURES</div>
          <div className="flex flex-col gap-0.5">
            {v.resilientGovernanceStructures.slice(0, 4).map((r) => (
              <div key={r.pattern} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 flex-grow break-words">{r.pattern}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className="w-[50px] text-right text-bone-200/55">stab {r.averageStability.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.resilientIdentitySignatures.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">RESILIENT IDENTITY SIGNATURES</div>
          <div className="flex flex-col gap-0.5">
            {v.resilientIdentitySignatures.slice(0, 4).map((r) => (
              <div key={r.pattern} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 flex-grow uppercase tracking-wider truncate">{r.pattern}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className="w-[50px] text-right text-bone-200/55">stab {r.averageStability.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.audienceSynchronizationPatterns.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">AUDIENCE SYNC PATTERNS · LOW NUMBNESS = SYNCED</div>
          <div className="flex flex-col gap-0.5">
            {v.audienceSynchronizationPatterns.slice(0, 4).map((r) => (
              <div key={r.pattern} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow break-words">{r.pattern}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className={`w-[50px] text-right ${heatTone(r.averageNumbness, true)}`}>
                  num {r.averageNumbness.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.strategicErosionPatterns.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">STRATEGIC EROSION PATTERNS</div>
          <div className="flex flex-col gap-0.5">
            {v.strategicErosionPatterns.slice(0, 4).map((r) => (
              <div key={r.pattern} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow break-words">{r.pattern}</span>
                <span className="w-[40px] text-right text-signal-warning/75">×{r.count}</span>
                <span className="w-[50px] text-right text-signal-warning/75">decay {r.averageDecay.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        observations {v.totalObservations} ·
        avg stability {v.averageStability.toFixed(1)}/10 ·
        avg trust durability {v.averageTrustDurability.toFixed(1)}/10 ·
        avg risk {v.averageStrategicRisk.toFixed(1)}/10
      </div>
    </div>
  );
}

// ─── counterfactual cognition panel ───────────────────────────

function CounterfactualCognitionPanel({
  view: v,
}: { view: CounterfactualCognitionLongitudinalView }) {
  const c = v.current;

  if (!v.present && !c) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">counterfactual cognition · multi-path simulation</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const trendTone =
    v.trend === 'trust-optimal-shifting'     ? 'text-bone-50/85' :
    v.trend === 'durability-optimal-shifting'? 'text-bone-50/85' :
    v.trend === 'stable'                     ? 'text-bone-200/85' :
                                               'text-bone-200/65';

  const impactTone = (n: number, invert = false) => {
    const positive = invert ? n < 0 : n > 0;
    const negative = invert ? n > 0 : n < 0;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">counterfactual cognition · multi-path simulation</div>
      <div className={`text-xs ${trendTone}`}>{v.statement}</div>

      {c && (
        <>
          <div className="text-[11px] leading-snug pt-1">
            <div className="eyebrow mb-1">ACTUAL CAMPAIGN PATH</div>
            <div className="text-bone-50/85">
              <span className="uppercase tracking-wider">{c.actualLeader ?? 'none'}</span>
              {c.actualArchetype && <span className="text-bone-200/65"> → {c.actualArchetype}</span>}
            </div>
          </div>

          {c.projections.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">COUNTERFACTUAL PATHS · WHAT COULD HAVE BEEN</div>
              <ul className="space-y-2 text-[10px]">
                {c.projections.slice(0, 5).map((p, i) => (
                  <li key={i} className="leading-snug border-l hairline pl-2">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider w-[88px] shrink-0 truncate">
                        if {p.alternateLeader}
                      </span>
                      <span className="text-bone-50/85 break-words flex-grow">→ {p.counterfactualCampaignArchetype}</span>
                      <span className="w-[44px] text-right text-bone-200/55">div {p.divergenceFromActual.toFixed(1)}</span>
                      <span className="w-[44px] text-right text-bone-200/55">plaus {p.plausibility.toFixed(1)}</span>
                    </div>
                    <div className="text-bone-200/65 mt-0.5 break-words">{p.archetypeDescription}</div>
                    <div className="text-bone-200/55 text-[9px] mt-0.5 break-words">
                      · creative: {p.creativeDirectionShift}
                    </div>
                    <div className="text-bone-200/55 text-[9px] break-words">
                      · audience: {p.audienceEmotionalShift}
                    </div>
                    <div className="text-bone-200/55 text-[9px] break-words">
                      · conversion: {p.conversionStyleShift}
                    </div>
                    <div className="text-bone-200/55 text-[9px] break-words">
                      · long-term: {p.longTermBrandEffect}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] tabular-nums mt-1">
                      <span className="text-bone-200/55">impact:</span>
                      <span className={impactTone(p.trustImpact)}>
                        trust {p.trustImpact > 0 ? '+' : ''}{p.trustImpact.toFixed(1)}
                      </span>
                      <span className={impactTone(p.fatigueImpact, true)}>
                        fatigue {p.fatigueImpact > 0 ? '+' : ''}{p.fatigueImpact.toFixed(1)}
                      </span>
                      <span className={impactTone(p.durabilityImpact)}>
                        durability {p.durabilityImpact > 0 ? '+' : ''}{p.durabilityImpact.toFixed(1)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(c.trustOptimizedPath || c.durabilityOptimizedPath || c.fatigueAwarePath) && (
            <div className="pt-2">
              <div className="eyebrow mb-1">OPTIMAL ALTERNATE PATHS</div>
              <ul className="text-[10px] leading-snug space-y-0.5">
                {c.trustOptimizedPath && (
                  <li className="break-words">
                    · <span className="text-bone-200/65">trust-optimal:</span>{' '}
                    <span className="uppercase tracking-wider text-bone-50/85">{c.trustOptimizedPath.counterfactualCampaignArchetype}</span>
                    {' '}<span className="text-bone-50/75">(trust {c.trustOptimizedPath.trustImpact > 0 ? '+' : ''}{c.trustOptimizedPath.trustImpact.toFixed(1)})</span>
                    {' '}<span className="text-bone-200/45">if {c.trustOptimizedPath.alternateLeader} led</span>
                  </li>
                )}
                {c.durabilityOptimizedPath && (
                  <li className="break-words">
                    · <span className="text-bone-200/65">durability-optimal:</span>{' '}
                    <span className="uppercase tracking-wider text-bone-50/85">{c.durabilityOptimizedPath.counterfactualCampaignArchetype}</span>
                    {' '}<span className="text-bone-50/75">(durability {c.durabilityOptimizedPath.durabilityImpact > 0 ? '+' : ''}{c.durabilityOptimizedPath.durabilityImpact.toFixed(1)})</span>
                    {' '}<span className="text-bone-200/45">if {c.durabilityOptimizedPath.alternateLeader} led</span>
                  </li>
                )}
                {c.fatigueAwarePath && (
                  <li className="break-words">
                    · <span className="text-bone-200/65">fatigue-aware:</span>{' '}
                    <span className="uppercase tracking-wider text-bone-50/85">{c.fatigueAwarePath.counterfactualCampaignArchetype}</span>
                    {' '}<span className="text-bone-50/75">(fatigue {c.fatigueAwarePath.fatigueImpact > 0 ? '+' : ''}{c.fatigueAwarePath.fatigueImpact.toFixed(1)})</span>
                    {' '}<span className="text-bone-200/45">if {c.fatigueAwarePath.alternateLeader} led</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {c.lowDivergencePaths.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">CLOSE-TO-ACTUAL PATHS</div>
              <ul className="text-[10px] leading-snug space-y-0.5">
                {c.lowDivergencePaths.slice(0, 3).map((p, i) => (
                  <li key={i} className="break-words text-bone-200/65">
                    · <span className="uppercase tracking-wider text-bone-50/75">{p.counterfactualCampaignArchetype}</span>
                    {' '}<span className="text-bone-200/45">(div {p.divergenceFromActual.toFixed(1)}, if {p.alternateLeader})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {v.recurringPathways.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">RECURRING ALTERNATE PATHS</div>
          <div className="flex flex-col gap-0.5">
            {v.recurringPathways.slice(0, 6).map((r) => (
              <div key={`${r.alternateLeader}-${r.archetype}`} className="text-[10px] tabular-nums">
                <div className="flex items-center gap-2">
                  <span className="text-bone-50/75 uppercase tracking-wider w-[88px] shrink-0 truncate">{r.alternateLeader}</span>
                  <span className="text-bone-200/65 flex-grow break-words">→ {r.archetype}</span>
                  <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] ml-[96px]">
                  <span className={impactTone(r.averageTrustImpact)}>
                    trust {r.averageTrustImpact > 0 ? '+' : ''}{r.averageTrustImpact.toFixed(1)}
                  </span>
                  <span className={impactTone(r.averageFatigueImpact, true)}>
                    fatigue {r.averageFatigueImpact > 0 ? '+' : ''}{r.averageFatigueImpact.toFixed(1)}
                  </span>
                  <span className={impactTone(r.averageDurabilityImpact)}>
                    durability {r.averageDurabilityImpact > 0 ? '+' : ''}{r.averageDurabilityImpact.toFixed(1)}
                  </span>
                  <span className="text-bone-200/45">plaus {r.averagePlausibility.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.highTrustPathways.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">HIGH-TRUST ALTERNATE PATHS</div>
          <div className="flex flex-col gap-0.5">
            {v.highTrustPathways.slice(0, 4).map((r) => (
              <div key={`t-${r.alternateLeader}-${r.archetype}`} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 uppercase tracking-wider w-[88px] shrink-0 truncate">{r.alternateLeader}</span>
                <span className="text-bone-200/65 flex-grow break-words">→ {r.archetype}</span>
                <span className="w-[40px] text-right text-bone-50/85">+{r.averageTrustImpact.toFixed(1)}</span>
                <span className="w-[30px] text-right text-bone-200/55">×{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.highDurabilityPathways.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">HIGH-DURABILITY ALTERNATE PATHS</div>
          <div className="flex flex-col gap-0.5">
            {v.highDurabilityPathways.slice(0, 4).map((r) => (
              <div key={`d-${r.alternateLeader}-${r.archetype}`} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 uppercase tracking-wider w-[88px] shrink-0 truncate">{r.alternateLeader}</span>
                <span className="text-bone-200/65 flex-grow break-words">→ {r.archetype}</span>
                <span className="w-[40px] text-right text-bone-50/85">+{r.averageDurabilityImpact.toFixed(1)}</span>
                <span className="w-[30px] text-right text-bone-200/55">×{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.fatigueRelievingPathways.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">FATIGUE-RELIEVING ALTERNATE PATHS</div>
          <div className="flex flex-col gap-0.5">
            {v.fatigueRelievingPathways.slice(0, 4).map((r) => (
              <div key={`f-${r.alternateLeader}-${r.archetype}`} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 uppercase tracking-wider w-[88px] shrink-0 truncate">{r.alternateLeader}</span>
                <span className="text-bone-200/65 flex-grow break-words">→ {r.archetype}</span>
                <span className="w-[40px] text-right text-bone-50/85">{r.averageFatigueImpact.toFixed(1)}</span>
                <span className="w-[30px] text-right text-bone-200/55">×{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.archetypeProjectionFrequency.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">ARCHETYPE PROJECTION FREQUENCY</div>
          <div className="flex flex-col gap-0.5">
            {v.archetypeProjectionFrequency.slice(0, 5).map((r) => (
              <div key={r.archetype} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow break-words">{r.archetype}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className="w-[40px] text-right text-bone-200/45">{(r.share * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(v.trustOptimizedFrequency.length > 0 || v.durabilityOptimizedFrequency.length > 0) && (
        <div className="pt-2 grid grid-cols-2 gap-3">
          {v.trustOptimizedFrequency.length > 0 && (
            <div>
              <div className="eyebrow mb-1">TRUST-OPTIMAL ARCHETYPES</div>
              <div className="flex flex-col gap-0.5">
                {v.trustOptimizedFrequency.slice(0, 4).map((r) => (
                  <div key={r.archetype} className="flex items-center gap-2 text-[10px] tabular-nums">
                    <span className="text-bone-200/65 flex-grow break-words">{r.archetype}</span>
                    <span className="w-[30px] text-right text-bone-50/75">×{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {v.durabilityOptimizedFrequency.length > 0 && (
            <div>
              <div className="eyebrow mb-1">DURABILITY-OPTIMAL ARCHETYPES</div>
              <div className="flex flex-col gap-0.5">
                {v.durabilityOptimizedFrequency.slice(0, 4).map((r) => (
                  <div key={r.archetype} className="flex items-center gap-2 text-[10px] tabular-nums">
                    <span className="text-bone-200/65 flex-grow break-words">{r.archetype}</span>
                    <span className="w-[30px] text-right text-bone-50/75">×{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        observations {v.totalObservations} ·
        recurring pathways {v.recurringPathways.length} ·
        actual-leader variety {v.actualLeaderShares.length}
      </div>
    </div>
  );
}

// ─── campaign evolution panel ─────────────────────────────────

interface ActivationRequest {
  branchName: string;
  counterfactualType: string;
  fromPhase: string;
  fromExecutive: string | null;
  fromIdentityVector: string | null;
  fromArchetype: string | null;
  predictedTrustImpact: number;
  predictedFatigueImpact: number;
  predictedDurabilityImpact: number;
  predictedRisk: number;
  predictedDurabilityPotential: number;
  baselineTrustMomentum: number;
  baselineFatiguePressure: number;
  baselineDurability: number;
  baselineCampaignHealth: number;
  operatorId: string;
  reason?: string;
}

async function activateBranch(
  req: ActivationRequest,
  setBranchActivation: (v: BranchActivationLongitudinalView | null) => void,
): Promise<void> {
  try {
    const res = await fetch('/api/branch-activation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) return;
    // Refresh the activation view so the panel reflects the new record.
    const refresh = await fetch('/api/branch-activation', { cache: 'no-store' });
    if (refresh.ok) {
      const v = await refresh.json();
      if (v) setBranchActivation(v as BranchActivationLongitudinalView);
    }
  } catch {
    /* non-fatal — activation never blocks UI */
  }
}

function CampaignEvolutionPanel({
  view: v, onActivate,
}: {
  view: CampaignLifecycleLongitudinalView;
  onActivate?: (req: ActivationRequest) => void;
}) {
  const c = v.current;

  if (!v.present && !c) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">campaign evolution · living lifecycle</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const trendTone =
    v.trend === 'compounding'            ? 'text-bone-50/85' :
    v.trend === 'fatiguing'              ? 'text-signal-warning/85' :
    v.trend === 'branch-pressure-rising' ? 'text-signal-warning/85' :
    v.trend === 'rest-needed-rising'     ? 'text-signal-warning/85' :
    v.trend === 'stable'                 ? 'text-bone-200/85' :
                                           'text-bone-200/65';

  const phaseTone = (phase: string) => {
    if (phase === 'strategically-stable' || phase === 'compounding') return 'text-bone-50 border-bone-50/40';
    if (phase === 'fatiguing' || phase === 'decaying' || phase === 'needs-rest' || phase === 'needs-branch') {
      return 'text-signal-warning border-signal-warning/40';
    }
    return 'text-bone-200/75 border-bone-200/30';
  };

  const heatTone = (score: number, invert = false) => {
    const positive = invert ? score <= 4 : score >= 7;
    const negative = invert ? score >= 7 : score <= 4;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  const Spark = ({ points, invert = false }: { points: { value: number }[]; invert?: boolean }) => {
    if (points.length < 2) return <span className="text-[10px] text-bone-200/30">—</span>;
    const w = 80, h = 14;
    const xs = points.map((_, i) => (i / (points.length - 1)) * w);
    const ys = points.map((p) => h - (p.value / 10) * h);
    const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
    const last = points[points.length - 1].value;
    const first = points[0].value;
    const delta = last - first;
    const rising = delta > 0.3;
    const falling = delta < -0.3;
    const stroke = invert
      ? rising ? '#C9A24B' : falling ? '#8AA98A' : 'rgba(247,245,242,0.55)'
      : rising ? '#8AA98A' : falling ? '#C9A24B' : 'rgba(247,245,242,0.55)';
    return <svg width={w} height={h}><path d={d} fill="none" stroke={stroke} strokeWidth="1" /></svg>;
  };

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">campaign evolution · living lifecycle</div>
      <div className={`text-xs ${trendTone}`}>{v.statement}</div>

      {c && (
        <>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-bone-200/55">phase:</span>
            <span className={`px-1.5 py-0.5 text-[10px] tracking-widest uppercase border ${phaseTone(c.currentPhase)}`}>
              {c.currentPhase}
            </span>
            <span className="text-[10px] text-bone-200/45 truncate">
              {c.dominantCampaignPattern ?? 'no dominant pattern yet'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
            <div>
              <div className="eyebrow">CAMPAIGN HEALTH</div>
              <div className={`mt-0.5 ${heatTone(c.campaignHealth)}`}>{c.campaignHealth.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">TRUST MOMENTUM</div>
              <div className={`mt-0.5 ${heatTone(c.trustMomentum)}`}>{c.trustMomentum.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">CREATIVE FRESHNESS</div>
              <div className={`mt-0.5 ${heatTone(c.creativeFreshness)}`}>{c.creativeFreshness.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">FATIGUE PRESSURE</div>
              <div className={`mt-0.5 ${heatTone(c.fatiguePressure, true)}`}>{c.fatiguePressure.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">DECAY RISK</div>
              <div className={`mt-0.5 ${heatTone(c.decayRisk, true)}`}>{c.decayRisk.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">STRATEGIC DURABILITY</div>
              <div className={`mt-0.5 ${heatTone(c.strategicDurability)}`}>{c.strategicDurability.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">BRANCH READINESS</div>
              <div className={`mt-0.5 ${heatTone(c.branchReadiness, true)}`}>{c.branchReadiness.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">AUDIENCE ROTATION NEED</div>
              <div className={`mt-0.5 ${heatTone(c.audienceRotationNeed, true)}`}>{c.audienceRotationNeed.toFixed(1)}/10</div>
            </div>
          </div>

          {(c.trustSignals.length > 0 || c.freshnessSignals.length > 0) && (
            <div className="pt-2">
              <div className="eyebrow mb-1">POSITIVE SIGNALS</div>
              <ul className="text-[10px] text-bone-50/80 leading-snug space-y-0.5">
                {c.trustSignals.concat(c.freshnessSignals).slice(0, 5).map((s, i) => (
                  <li key={i} className="break-words">· {s}</li>
                ))}
              </ul>
            </div>
          )}

          {(c.decaySignals.length > 0 || c.fatigueSignals.length > 0) && (
            <div className="pt-2">
              <div className="eyebrow mb-1">PRESSURE SIGNALS</div>
              <ul className="text-[10px] text-signal-warning/80 leading-snug space-y-0.5">
                {c.decaySignals.concat(c.fatigueSignals).slice(0, 5).map((s, i) => (
                  <li key={i} className="break-words">· {s}</li>
                ))}
              </ul>
            </div>
          )}

          {c.possibleBranches.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">POSSIBLE BRANCHES · HUMAN-SUPERVISED</div>
              <ul className="space-y-1.5 text-[10px]">
                {c.possibleBranches.slice(0, 4).map((b, i) => (
                  <li key={i} className="leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate">{b.branchName}</span>
                      <span className={`w-[40px] text-right ${heatTone(b.durabilityPotential)}`}>
                        dur {b.durabilityPotential.toFixed(1)}
                      </span>
                      <span className={`w-[40px] text-right ${heatTone(b.risk, true)}`}>
                        risk {b.risk.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-bone-200/65 mt-0.5 break-words">{b.expectedStrategicPurpose}</div>
                    <div className="text-bone-200/45 text-[9px] italic break-words">→ {b.reason}</div>
                    {onActivate && (
                      <div className="mt-1">
                        <button
                          onClick={() => onActivate({
                            branchName: b.branchName,
                            counterfactualType: b.counterfactualType,
                            fromPhase: c.currentPhase,
                            fromExecutive: null,
                            fromIdentityVector: null,
                            fromArchetype: c.dominantCampaignPattern,
                            predictedTrustImpact: b.trustImpact,
                            predictedFatigueImpact: b.fatigueImpact,
                            predictedDurabilityImpact: b.durabilityImpact,
                            predictedRisk: b.risk,
                            predictedDurabilityPotential: b.durabilityPotential,
                            baselineTrustMomentum: c.trustMomentum,
                            baselineFatiguePressure: c.fatiguePressure,
                            baselineDurability: c.strategicDurability,
                            baselineCampaignHealth: c.campaignHealth,
                            operatorId: 'studio',
                            reason: b.reason,
                          })}
                          className="px-2 py-0.5 text-[9px] tracking-widest uppercase border hairline text-bone-50/75 hover:bg-white/5"
                          title="Records the activation as a reinforcement-memory event. Does NOT change the next run."
                        >
                          Activate Branch
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="text-[9px] text-bone-200/45 italic mt-1">
                activation records a reinforcement-memory event · does NOT mutate generation
              </div>
            </div>
          )}

          {c.recommendedObservations.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">RECOMMENDED OBSERVATIONS</div>
              <ul className="text-[10px] text-bone-200/65 leading-snug space-y-0.5">
                {c.recommendedObservations.slice(0, 4).map((s, i) => (
                  <li key={i} className="break-words">· {s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 text-[11px] leading-snug">
            <div className="eyebrow mb-1">AUDIENCE EVOLUTION</div>
            <div className="text-bone-50/85">
              current: <span className="uppercase tracking-wider">{c.audienceEvolution.currentAudience ?? 'none'}</span>
              {' '}<span className="text-bone-200/55">(fatigue {c.audienceEvolution.audienceFatigue.toFixed(1)}/10)</span>
            </div>
            {c.audienceEvolution.rotationCandidate && (
              <div className="text-bone-200/65">
                candidate: <span className="uppercase tracking-wider">{c.audienceEvolution.rotationCandidate}</span>
              </div>
            )}
            <div className="text-bone-200/45 text-[10px] italic mt-0.5 break-words">{c.audienceEvolution.reason}</div>
          </div>
        </>
      )}

      {(v.campaignHealthTrace.length >= 2 || v.trustMomentumTrace.length >= 2) && (
        <div className="pt-2 flex flex-col gap-1">
          <div className="eyebrow mb-1">LIFECYCLE TRAJECTORIES</div>
          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span className="text-bone-200/55 flex-grow">campaign health</span>
            <Spark points={v.campaignHealthTrace} />
          </div>
          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span className="text-bone-200/55 flex-grow">trust momentum</span>
            <Spark points={v.trustMomentumTrace} />
          </div>
          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span className="text-bone-200/55 flex-grow">fatigue pressure</span>
            <Spark points={v.fatiguePressureTrace} invert />
          </div>
          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span className="text-bone-200/55 flex-grow">creative freshness</span>
            <Spark points={v.creativeFreshnessTrace} />
          </div>
          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span className="text-bone-200/55 flex-grow">branch readiness</span>
            <Spark points={v.branchReadinessTrace} invert />
          </div>
          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span className="text-bone-200/55 flex-grow">audience rotation need</span>
            <Spark points={v.audienceRotationTrace} invert />
          </div>
        </div>
      )}

      {v.phaseDistribution.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">PHASE DISTRIBUTION</div>
          <div className="flex flex-col gap-0.5">
            {v.phaseDistribution.slice(0, 6).map((r) => (
              <div key={r.phase} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 uppercase tracking-wider flex-grow truncate">{r.phase}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className="w-[40px] text-right text-bone-200/45">{(r.share * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.durablePatterns.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">DURABLE CAMPAIGN PATTERNS</div>
          <div className="flex flex-col gap-0.5">
            {v.durablePatterns.slice(0, 4).map((r) => (
              <div key={r.pattern} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 flex-grow break-words">{r.pattern}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{r.count}</span>
                <span className="w-[50px] text-right text-bone-50/75">{r.averageHealth.toFixed(1)}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.fragilePatterns.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">FRAGILE CAMPAIGN PATTERNS</div>
          <div className="flex flex-col gap-0.5">
            {v.fragilePatterns.slice(0, 4).map((r) => (
              <div key={r.pattern} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-signal-warning/75 flex-grow break-words">{r.pattern}</span>
                <span className="w-[40px] text-right text-bone-200/55">×{r.count}</span>
                <span className="w-[50px] text-right text-signal-warning/75">{r.averageHealth.toFixed(1)}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.audienceFatigueRanking.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">AUDIENCE FATIGUE RANKING</div>
          <div className="flex flex-col gap-0.5">
            {v.audienceFatigueRanking.slice(0, 4).map((r) => (
              <div key={r.audience} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.audience}</span>
                <span className={`w-[50px] text-right ${heatTone(r.ewmaFatigue, true)}`}>
                  {r.ewmaFatigue.toFixed(1)}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(v.compoundingSignals.length > 0 || v.restNeededSignals.length > 0) && (
        <div className="pt-2 grid grid-cols-1 gap-2">
          {v.compoundingSignals.length > 0 && (
            <div>
              <div className="eyebrow mb-1">COMPOUNDING SIGNALS</div>
              <ul className="text-[10px] text-bone-50/80 leading-snug space-y-0.5">
                {v.compoundingSignals.slice(0, 3).map((s, i) => (
                  <li key={i} className="break-words">· {s}</li>
                ))}
              </ul>
            </div>
          )}
          {v.restNeededSignals.length > 0 && (
            <div>
              <div className="eyebrow mb-1">REST-NEEDED SIGNALS</div>
              <ul className="text-[10px] text-signal-warning/80 leading-snug space-y-0.5">
                {v.restNeededSignals.slice(0, 3).map((s, i) => (
                  <li key={i} className="break-words">· {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        observations {v.totalObservations} ·
        avg health {v.averageCampaignHealth.toFixed(1)}/10 ·
        avg trust {v.averageTrustMomentum.toFixed(1)}/10 ·
        avg fatigue {v.averageFatiguePressure.toFixed(1)}/10
      </div>
    </div>
  );
}

// ─── branch activation panel ─────────────────────────────────

function BranchActivationPanel({ view: v }: { view: BranchActivationLongitudinalView }) {
  const c = v.current;

  if (!v.present && (!c || c.activationConfidence === 0)) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">branch activation log · reinforcement memory</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const trendTone =
    v.trend === 'reliability-rising'  ? 'text-bone-50/85' :
    v.trend === 'reliability-falling' ? 'text-signal-warning/85' :
    v.trend === 'reliability-stable'  ? 'text-bone-200/85' :
                                        'text-bone-200/65';

  const heatTone = (score: number, invert = false) => {
    const positive = invert ? score <= 4 : score >= 7;
    const negative = invert ? score >= 7 : score <= 4;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  const resultTone = (result: string) =>
    result === 'recovered' ? 'text-bone-50/85' :
    result === 'failed'    ? 'text-signal-warning/85' :
    result === 'mixed'     ? 'text-bone-200/65' :
                             'text-bone-200/55';

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">branch activation log · reinforcement memory</div>
      <div className={`text-xs ${trendTone}`}>{v.statement}</div>

      {c && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
            <div>
              <div className="eyebrow">ACTIVATION CONFIDENCE</div>
              <div className={`mt-0.5 ${heatTone(c.activationConfidence)}`}>{c.activationConfidence.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">HISTORICAL RELIABILITY</div>
              <div className={`mt-0.5 ${heatTone(c.historicalReliability)}`}>{c.historicalReliability.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">BRANCH TRUSTWORTHINESS</div>
              <div className={`mt-0.5 ${heatTone(c.branchTrustworthiness)}`}>{c.branchTrustworthiness.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">PREDICTION ACCURACY</div>
              <div className={`mt-0.5 ${heatTone(c.predictionAccuracy)}`}>{c.predictionAccuracy.toFixed(1)}/10</div>
            </div>
          </div>

          {c.recommendedObservations.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">RECOMMENDED OBSERVATIONS</div>
              <ul className="text-[10px] text-bone-200/65 leading-snug space-y-0.5">
                {c.recommendedObservations.slice(0, 4).map((s, i) => (
                  <li key={i} className="break-words">· {s}</li>
                ))}
              </ul>
            </div>
          )}

          {c.branchOutcomes.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">BRANCH OUTCOMES</div>
              <ul className="space-y-1.5 text-[10px]">
                {c.branchOutcomes.slice(0, 5).map((row) => (
                  <li key={row.branchName} className="leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate">{row.branchName}</span>
                      <span className="w-[40px] text-right text-bone-50/75">×{row.timesActivated}</span>
                      <span className="w-[60px] text-right text-bone-200/55">stab {row.longTermStability.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] ml-2 mt-0.5">
                      <span className={heatTone(row.trustRecoveryRate)}>trust {row.trustRecoveryRate.toFixed(1)}</span>
                      <span className={heatTone(row.fatigueRecoveryRate)}>fatigue {row.fatigueRecoveryRate.toFixed(1)}</span>
                      <span className={heatTone(row.durabilityGain)}>dur+ {row.durabilityGain.toFixed(1)}</span>
                      <span className={heatTone(row.averageDecayReduction)}>decay− {row.averageDecayReduction.toFixed(1)}</span>
                      <span className="text-bone-200/55">recovered {row.successfulRecoveries}/{row.timesActivated}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.failedBranchPatterns.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">FAILED BRANCH PATTERNS</div>
              <ul className="text-[10px] text-signal-warning/85 leading-snug space-y-0.5">
                {c.failedBranchPatterns.slice(0, 3).map((f, i) => (
                  <li key={i} className="break-words">
                    · <span className="uppercase tracking-wider">{f.branchName}</span>
                    {' '}<span>(severity {f.severity.toFixed(1)}/10)</span> — {f.failurePattern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.durableBranchPatterns.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">DURABLE BRANCH PATTERNS</div>
              <ul className="text-[10px] text-bone-50/80 leading-snug space-y-0.5">
                {c.durableBranchPatterns.slice(0, 3).map((d, i) => (
                  <li key={i} className="break-words">
                    · <span className="uppercase tracking-wider">{d.branchName}</span>
                    {' '}<span>(durability {d.durabilityScore.toFixed(1)}/10)</span> — {d.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.operatorPatterns.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">OPERATOR PATTERNS</div>
              <ul className="space-y-1 text-[10px]">
                {c.operatorPatterns.slice(0, 4).map((op) => (
                  <li key={op.operatorType} className="leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate">{op.operatorType}</span>
                      <span className="w-[60px] text-right text-bone-200/55">risk {op.riskTolerance.toFixed(1)}</span>
                      <span className="w-[60px] text-right text-bone-50/75">trust+ {op.trustBias.toFixed(1)}</span>
                      <span className="w-[60px] text-right text-bone-200/55">novelty {op.noveltyBias.toFixed(1)}</span>
                    </div>
                    <div className="text-bone-200/55 text-[9px] break-words">
                      prefers: {op.preferredBranches.slice(0, 3).join(', ') || 'none'}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.projectionAccuracy.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">SIMULATION vs REALITY ACCURACY</div>
              <div className="flex flex-col gap-0.5">
                {c.projectionAccuracy.slice(0, 5).map((p) => (
                  <div key={p.counterfactualType} className="flex items-center gap-2 text-[10px] tabular-nums">
                    <span className="text-bone-200/65 flex-grow truncate">{p.counterfactualType}</span>
                    <span className={`w-[50px] text-right ${heatTone(p.historicalAccuracy)}`}>
                      {p.historicalAccuracy.toFixed(1)}/10
                    </span>
                    <span className="w-[40px] text-right text-bone-200/55">n={p.sampleSize}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {c.activationTimeline.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">RECENT ACTIVATIONS</div>
              <ul className="space-y-1 text-[10px]">
                {c.activationTimeline.slice(0, 6).map((t, i) => (
                  <li key={i} className="leading-snug">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-200/55 uppercase tracking-wider w-[88px] shrink-0 truncate">{t.phase}</span>
                      <span className="text-bone-50/85 break-words flex-grow truncate">{t.branch}</span>
                      <span className={`w-[68px] text-right uppercase tracking-wider ${resultTone(t.result)}`}>
                        {t.result}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] ml-2">
                      <span className={t.trustDelta > 0 ? 'text-bone-50/75' : t.trustDelta < 0 ? 'text-signal-warning/75' : 'text-bone-200/55'}>
                        trust {t.trustDelta > 0 ? '+' : ''}{t.trustDelta.toFixed(1)}
                      </span>
                      <span className={t.fatigueDelta < 0 ? 'text-bone-50/75' : t.fatigueDelta > 0 ? 'text-signal-warning/75' : 'text-bone-200/55'}>
                        fatigue {t.fatigueDelta > 0 ? '+' : ''}{t.fatigueDelta.toFixed(1)}
                      </span>
                      <span className={t.durabilityDelta > 0 ? 'text-bone-50/75' : t.durabilityDelta < 0 ? 'text-signal-warning/75' : 'text-bone-200/55'}>
                        durability {t.durabilityDelta > 0 ? '+' : ''}{t.durabilityDelta.toFixed(1)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {v.operatorEvolution.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">OPERATOR EVOLUTION</div>
          <div className="flex flex-col gap-0.5">
            {v.operatorEvolution.slice(0, 4).map((op) => (
              <div key={op.operatorId} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{op.operatorId}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{op.totalActivations}</span>
                <span className="w-[60px] text-right text-bone-50/75">top {op.topBranch ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.simulationVsReality.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">SIMULATION vs REALITY (per counterfactual type)</div>
          <div className="flex flex-col gap-0.5">
            {v.simulationVsReality.slice(0, 4).map((s) => (
              <div key={s.counterfactualType} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{s.counterfactualType}</span>
                <span className="w-[60px] text-right text-bone-200/55">
                  trust pred {s.predictedAvgTrust > 0 ? '+' : ''}{s.predictedAvgTrust.toFixed(1)}
                </span>
                <span className="w-[60px] text-right text-bone-50/75">
                  real {s.measuredAvgTrust > 0 ? '+' : ''}{s.measuredAvgTrust.toFixed(1)}
                </span>
                <span className={`w-[40px] text-right ${heatTone(s.accuracyScore)}`}>
                  {s.accuracyScore.toFixed(1)}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        total activations {v.totalActivations} ·
        resolved {v.resolvedActivations} ·
        pending {v.pendingActivations}
      </div>
    </div>
  );
}

// ─── projection calibration panel ─────────────────────────────

function ProjectionCalibrationPanel({
  view: v,
}: { view: ProjectionCalibrationLongitudinalView }) {
  const c = v.current;

  if (!v.present && (!c || c.calibrations.length === 0)) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">projection calibration · annotations only</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const trendTone =
    v.trend === 'calibration-improving' ? 'text-bone-50/85' :
    v.trend === 'calibration-degrading' ? 'text-signal-warning/85' :
    v.trend === 'calibration-stable'    ? 'text-bone-200/85' :
                                          'text-bone-200/65';

  const heatTone = (score: number, invert = false) => {
    const positive = invert ? score <= 4 : score >= 7;
    const negative = invert ? score >= 7 : score <= 4;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  const Spark = ({ points, invert = false }: { points: { value: number }[]; invert?: boolean }) => {
    if (points.length < 2) return <span className="text-[10px] text-bone-200/30">—</span>;
    const w = 80, h = 14;
    const xs = points.map((_, i) => (i / (points.length - 1)) * w);
    const ys = points.map((p) => h - (p.value / 10) * h);
    const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
    const last = points[points.length - 1].value;
    const first = points[0].value;
    const delta = last - first;
    const rising = delta > 0.3;
    const falling = delta < -0.3;
    const stroke = invert
      ? rising ? '#C9A24B' : falling ? '#8AA98A' : 'rgba(247,245,242,0.55)'
      : rising ? '#8AA98A' : falling ? '#C9A24B' : 'rgba(247,245,242,0.55)';
    return <svg width={w} height={h}><path d={d} fill="none" stroke={stroke} strokeWidth="1" /></svg>;
  };

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">projection calibration · annotations only</div>
      <div className={`text-xs ${trendTone}`}>{v.statement}</div>
      <div className="text-[9px] text-bone-200/45 italic">
        observatory only — never modifies projections, never rewrites scores, never reprioritizes branches
      </div>

      {c && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
            <div>
              <div className="eyebrow">OVERALL ACCURACY</div>
              <div className={`mt-0.5 ${heatTone(c.overallAccuracy)}`}>{c.overallAccuracy.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">OVERALL CONFIDENCE</div>
              <div className={`mt-0.5 ${heatTone(c.overallConfidence)}`}>{c.overallConfidence.toFixed(1)}/10</div>
            </div>
            {c.mostReliableProjectionType && (
              <div className="col-span-2">
                <div className="eyebrow">MOST RELIABLE</div>
                <div className="mt-0.5 text-bone-50/85 uppercase tracking-wider">{c.mostReliableProjectionType}</div>
              </div>
            )}
            {c.leastReliableProjectionType && (
              <div className="col-span-2">
                <div className="eyebrow">LEAST RELIABLE</div>
                <div className="mt-0.5 text-signal-warning/85 uppercase tracking-wider">{c.leastReliableProjectionType}</div>
              </div>
            )}
          </div>

          {c.calibrations.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">PER-PROJECTION CALIBRATION</div>
              <ul className="space-y-2 text-[10px]">
                {c.calibrations.slice(0, 5).map((cal) => (
                  <li key={cal.projectionType} className="leading-snug border-l hairline pl-2">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate">
                        {cal.projectionType}
                      </span>
                      <span className={`w-[40px] text-right ${heatTone(cal.historicalAccuracy)}`}>
                        acc {cal.historicalAccuracy.toFixed(1)}
                      </span>
                      <span className="w-[44px] text-right text-bone-200/55">conf {cal.confidenceLevel.toFixed(1)}</span>
                      <span className="w-[36px] text-right text-bone-200/45">n={cal.sampleSize}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] mt-0.5">
                      <span className={heatTone(cal.trustCalibration)}>trust {cal.trustCalibration.toFixed(1)}</span>
                      <span className={heatTone(cal.fatigueCalibration)}>fatigue {cal.fatigueCalibration.toFixed(1)}</span>
                      <span className={heatTone(cal.durabilityCalibration)}>dur {cal.durabilityCalibration.toFixed(1)}</span>
                      <span className="text-bone-200/55">short {cal.shortTermAccuracy.toFixed(1)}</span>
                      <span className="text-bone-200/55">long {cal.longTermAccuracy.toFixed(1)}</span>
                      {cal.overestimationBias >= 3 && (
                        <span className="text-signal-warning/75">over+{cal.overestimationBias.toFixed(1)}</span>
                      )}
                      {cal.underestimationBias >= 3 && (
                        <span className="text-signal-warning/75">under-{cal.underestimationBias.toFixed(1)}</span>
                      )}
                    </div>
                    {cal.calibrationAnnotations.length > 0 && (
                      <ul className="mt-0.5 text-bone-200/65 text-[9px] space-y-0.5">
                        {cal.calibrationAnnotations.slice(0, 4).map((ann, i) => (
                          <li key={i} className="break-words italic">· {ann}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {v.overallAccuracyDrift.length >= 2 && (
        <div className="pt-2 flex items-center gap-2 text-[10px] tabular-nums">
          <span className="text-bone-200/55 flex-grow">calibration drift</span>
          <Spark points={v.overallAccuracyDrift.map((p) => ({ value: p.overallAccuracy }))} />
        </div>
      )}

      {v.mostAccurate.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">MOST ACCURATE PROJECTIONS</div>
          <div className="flex flex-col gap-0.5">
            {v.mostAccurate.slice(0, 4).map((r) => (
              <div key={r.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 flex-grow uppercase tracking-wider truncate">{r.projectionType}</span>
                <span className={`w-[50px] text-right ${heatTone(r.historicalAccuracy)}`}>
                  {r.historicalAccuracy.toFixed(1)}/10
                </span>
                <span className="w-[36px] text-right text-bone-200/45">n={r.sampleSize}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.leastReliable.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">LEAST RELIABLE PROJECTIONS</div>
          <div className="flex flex-col gap-0.5">
            {v.leastReliable.slice(0, 4).map((r) => (
              <div key={r.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.projectionType}</span>
                <span className={`w-[50px] text-right ${heatTone(r.historicalAccuracy)}`}>
                  {r.historicalAccuracy.toFixed(1)}/10
                </span>
                <span className="w-[36px] text-right text-bone-200/45">n={r.sampleSize}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(v.strongestShortTermPredictors.length > 0 || v.strongestLongTermPredictors.length > 0) && (
        <div className="pt-2 grid grid-cols-2 gap-3">
          {v.strongestShortTermPredictors.length > 0 && (
            <div>
              <div className="eyebrow mb-1">SHORT-TERM PREDICTORS</div>
              <div className="flex flex-col gap-0.5">
                {v.strongestShortTermPredictors.slice(0, 4).map((r) => (
                  <div key={r.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                    <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.projectionType}</span>
                    <span className="w-[44px] text-right text-bone-50/75">{r.shortTermAccuracy.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {v.strongestLongTermPredictors.length > 0 && (
            <div>
              <div className="eyebrow mb-1">LONG-TERM PREDICTORS</div>
              <div className="flex flex-col gap-0.5">
                {v.strongestLongTermPredictors.slice(0, 4).map((r) => (
                  <div key={r.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                    <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.projectionType}</span>
                    <span className="w-[44px] text-right text-bone-50/75">{r.longTermAccuracy.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {v.overconfidencePatterns.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">OVERCONFIDENCE WARNINGS</div>
          <ul className="text-[10px] text-signal-warning/85 leading-snug space-y-0.5">
            {v.overconfidencePatterns.slice(0, 3).map((p, i) => (
              <li key={i} className="break-words">
                · <span className="uppercase tracking-wider">{p.projectionType}</span> overestimates by +{p.bias.toFixed(1)}/10 ({p.axis})
              </li>
            ))}
          </ul>
        </div>
      )}

      {v.underconfidencePatterns.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">UNDERCONFIDENCE WARNINGS</div>
          <ul className="text-[10px] text-signal-warning/75 leading-snug space-y-0.5">
            {v.underconfidencePatterns.slice(0, 3).map((p, i) => (
              <li key={i} className="break-words">
                · <span className="uppercase tracking-wider">{p.projectionType}</span> underestimates by -{p.bias.toFixed(1)}/10 ({p.axis})
              </li>
            ))}
          </ul>
        </div>
      )}

      {v.perTypeDrift.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">PER-TYPE CALIBRATION DRIFT</div>
          <div className="flex flex-col gap-0.5">
            {v.perTypeDrift.slice(0, 5).map((d) => {
              const driftTone = d.drift > 0 ? 'text-bone-50/85' : d.drift < 0 ? 'text-signal-warning/75' : 'text-bone-200/55';
              return (
                <div key={d.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                  <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{d.projectionType}</span>
                  <span className="w-[40px] text-right text-bone-200/55">{d.earliest.toFixed(1)}</span>
                  <span className="w-[10px] text-bone-200/45 text-center">→</span>
                  <span className="w-[40px] text-right text-bone-50/75">{d.latest.toFixed(1)}</span>
                  <span className={`w-[40px] text-right ${driftTone}`}>
                    {d.drift > 0 ? '+' : ''}{d.drift.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {v.environmentalReliabilityMap.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">ENVIRONMENTAL RELIABILITY MAP</div>
          <div className="flex flex-col gap-0.5">
            {v.environmentalReliabilityMap.slice(0, 6).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 w-[100px] shrink-0 uppercase tracking-wider truncate">{r.projectionType}</span>
                <span className="text-bone-200/55 flex-grow truncate">@ {r.environment}</span>
                <span className={`w-[50px] text-right ${heatTone(r.reliability)}`}>
                  {r.reliability.toFixed(1)}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.simulationVsRealityDivergence.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">SIMULATION-vs-REALITY DIVERGENCE</div>
          <div className="flex flex-col gap-0.5">
            {v.simulationVsRealityDivergence.slice(0, 4).map((r) => (
              <div key={r.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.projectionType}</span>
                <span className={`w-[50px] text-right ${heatTone(r.divergence, true)}`}>
                  div {r.divergence.toFixed(1)}
                </span>
                <span className="w-[36px] text-right text-bone-200/45">n={r.sampleSize}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.projectionTrustRanking.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">PROJECTION TRUST RANKING</div>
          <div className="flex flex-col gap-0.5">
            {v.projectionTrustRanking.slice(0, 4).map((r) => (
              <div key={r.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 flex-grow uppercase tracking-wider truncate">{r.projectionType}</span>
                <span className={`w-[50px] text-right ${heatTone(r.historicalAccuracy)}`}>
                  {r.historicalAccuracy.toFixed(1)}/10
                </span>
                <span className="w-[36px] text-right text-bone-200/45">n={r.sampleSize}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        snapshots {v.totalSnapshots} · projection types tracked {c?.calibrations.length ?? 0}
      </div>
    </div>
  );
}

// ─── operator confidence preference panel ────────────────────

interface ConfidencePreferenceUpdateRequest {
  operatorId: string;
  projectionType: string;
  confidenceWeight: number;
  reasonNote?: string;
}

async function updateConfidencePreference(
  req: ConfidencePreferenceUpdateRequest,
  setOperatorConfidence: (v: OperatorConfidencePreferenceView | null) => void,
): Promise<void> {
  try {
    const res = await fetch('/api/operator-confidence-preference', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) return;
    const refresh = await fetch(
      `/api/operator-confidence-preference?operatorId=${encodeURIComponent(req.operatorId)}`,
      { cache: 'no-store' },
    );
    if (refresh.ok) {
      const v = await refresh.json();
      if (v) setOperatorConfidence(v as OperatorConfidencePreferenceView);
    }
  } catch {
    /* non-fatal — slider write never blocks UI */
  }
}

function OperatorConfidencePreferencePanel({
  view: v,
  projectionCalibration,
  onUpdate,
}: {
  view: OperatorConfidencePreferenceView;
  projectionCalibration: ProjectionCalibrationLongitudinalView | null;
  onUpdate?: (req: ConfidencePreferenceUpdateRequest) => void;
}) {
  const labelTone = (label: string) =>
    label === 'high'        ? 'text-bone-50/85' :
    label === 'medium-high' ? 'text-bone-50/75' :
    label === 'medium'      ? 'text-bone-200/75' :
    label === 'low'         ? 'text-signal-warning/85' :
                              'text-signal-warning';

  // Lookup calibration row for a given projection type to render
  // the side-by-side raw + calibration + operator-weight block.
  const calibrationByType = new Map<string, {
    historicalAccuracy: number;
    overestimationBias: number;
    underestimationBias: number;
    annotations: string[];
  }>();
  if (projectionCalibration?.current?.calibrations) {
    for (const c of projectionCalibration.current.calibrations) {
      calibrationByType.set(c.projectionType, {
        historicalAccuracy: c.historicalAccuracy,
        overestimationBias: c.overestimationBias,
        underestimationBias: c.underestimationBias,
        annotations: c.calibrationAnnotations,
      });
    }
  }

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">operator confidence preference · interpretation overlay</div>
      <div className="text-xs text-bone-200/65 italic break-words">{v.visualOnlyNotice}</div>
      <div className="text-[10px] text-bone-200/55">{v.statement}</div>

      <div className="pt-2 space-y-3">
        {v.preferences.map((p) => {
          const cal = calibrationByType.get(p.projectionType);
          return (
            <div key={p.projectionType} className="border-l hairline pl-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate text-[11px]">
                  {p.projectionType}
                </span>
                <span className={`text-[10px] tabular-nums ${labelTone(p.confidenceLabel)}`}>
                  {p.confidenceWeight}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  defaultValue={p.confidenceWeight}
                  onMouseUp={(e) => {
                    const val = parseInt((e.target as HTMLInputElement).value, 10);
                    if (!Number.isFinite(val)) return;
                    if (val === p.confidenceWeight) return;
                    onUpdate?.({
                      operatorId: p.operatorId,
                      projectionType: p.projectionType,
                      confidenceWeight: val,
                    });
                  }}
                  className="flex-grow accent-bone-50"
                  aria-label={`${p.projectionType} confidence weight`}
                />
                <span className={`w-[100px] text-right text-[9px] uppercase tracking-widest ${labelTone(p.confidenceLabel)}`}>
                  {p.confidenceLabel}
                </span>
              </div>

              <div className="text-[9px] text-bone-200/55 italic break-words">
                {p.interpretation}
              </div>

              {cal && (
                <div className="text-[9px] text-bone-200/45 leading-snug space-y-0.5">
                  <div>
                    calibration: historical accuracy {cal.historicalAccuracy.toFixed(1)}/10
                    {cal.overestimationBias >= 3 ? ` · overestimation bias +${cal.overestimationBias.toFixed(1)}` : ''}
                    {cal.underestimationBias >= 3 ? ` · underestimation bias -${cal.underestimationBias.toFixed(1)}` : ''}
                  </div>
                  {cal.annotations.length > 0 && (
                    <div className="break-words">
                      annotation: {cal.annotations[0]}
                    </div>
                  )}
                </div>
              )}
              {!cal && (
                <div className="text-[9px] text-bone-200/45 italic">
                  calibration: no resolved activations of this projection type yet
                </div>
              )}

              {p.reasonNote && (
                <div className="text-[9px] text-bone-200/55 break-words">
                  reason note: {p.reasonNote}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {v.recentHistory.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">RECENT PREFERENCE UPDATES</div>
          <ul className="text-[10px] leading-snug space-y-0.5">
            {v.recentHistory.slice(0, 6).map((h, i) => (
              <li key={i} className="break-words text-bone-200/65">
                · <span className="uppercase tracking-wider">{h.projectionType}</span>
                {' '}<span className="text-bone-50/75">{h.confidenceWeight}%</span>
                {' '}<span className="text-bone-200/45">by {h.operatorId}</span>
                {h.reasonNote && <span className="text-bone-200/55"> · {h.reasonNote}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {v.operatorSummaries.length > 1 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">OPERATOR SUMMARIES</div>
          <div className="flex flex-col gap-0.5">
            {v.operatorSummaries.slice(0, 4).map((op) => (
              <div key={op.operatorId} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{op.operatorId}</span>
                <span className="w-[50px] text-right text-bone-50/75">avg {op.averageWeight.toFixed(1)}</span>
                <span className="w-[40px] text-right text-bone-200/55">×{op.totalUpdates}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        {v.operatorId} · {v.totalUpdates} update(s)
      </div>
    </div>
  );
}

// ─── operator calibration reconciliation panel ───────────────

function OperatorCalibrationReconciliationPanel({
  view: v,
}: { view: OperatorCalibrationReconciliationLongitudinalView }) {
  const c = v.current;

  if (!v.present && (!c || c.totalReconciliations === 0)) {
    return (
      <div className="border-t hairline pt-3 space-y-2">
        <div className="eyebrow">operator vs system · reconciliation observatory</div>
        <div className="text-xs text-bone-200/65 italic break-words">{v.observationOnlyNotice}</div>
        <div className="text-xs text-bone-200/55 italic">{v.statement}</div>
      </div>
    );
  }

  const trendTone =
    v.trend === 'agreement-improving' ? 'text-bone-50/85' :
    v.trend === 'agreement-degrading' ? 'text-signal-warning/85' :
    v.trend === 'agreement-stable'    ? 'text-bone-200/85' :
                                        'text-bone-200/65';

  const heatTone = (score: number, invert = false) => {
    const positive = invert ? score <= 4 : score >= 7;
    const negative = invert ? score >= 7 : score <= 4;
    return positive ? 'text-bone-50/85'
         : negative ? 'text-signal-warning/85'
         : 'text-bone-200/65';
  };

  const relationshipTone = (rel: string) =>
    rel === 'aligned'                       ? 'text-bone-50 border-bone-50/40' :
    rel === 'improving-alignment'           ? 'text-bone-50/85 border-bone-50/30' :
    rel === 'historically-corrected'        ? 'text-bone-50/85 border-bone-50/30' :
    rel === 'operator-more-optimistic'      ? 'text-bone-200/75 border-bone-200/30' :
    rel === 'operator-more-skeptical'       ? 'text-bone-200/75 border-bone-200/30' :
    rel === 'historically-overconfident'    ? 'text-signal-warning border-signal-warning/40' :
    rel === 'historically-underconfident'   ? 'text-signal-warning border-signal-warning/40' :
    rel === 'unstable-intuition'            ? 'text-signal-warning/85 border-signal-warning/30' :
                                              'text-bone-200/65 border-bone-200/25';

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">operator vs system · reconciliation observatory</div>
      <div className="text-xs text-bone-200/65 italic break-words">{v.observationOnlyNotice}</div>
      <div className={`text-xs ${trendTone}`}>{v.statement}</div>

      {c && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
            <div>
              <div className="eyebrow">OVERALL AGREEMENT</div>
              <div className={`mt-0.5 ${heatTone(c.overallAgreement)}`}>{c.overallAgreement.toFixed(1)}/10</div>
            </div>
            <div>
              <div className="eyebrow">OVERALL DIVERGENCE</div>
              <div className={`mt-0.5 ${heatTone(c.overallDivergence, true)}`}>{c.overallDivergence.toFixed(1)}/10</div>
            </div>
          </div>

          {c.reconciliations.length > 0 && (
            <div className="pt-2">
              <div className="eyebrow mb-1">PER-PROJECTION RECONCILIATION</div>
              <ul className="space-y-2 text-[10px]">
                {c.reconciliations.slice(0, 6).map((r) => (
                  <li key={r.projectionType} className="leading-snug border-l hairline pl-2">
                    <div className="flex items-center gap-2">
                      <span className="text-bone-50/85 uppercase tracking-wider flex-grow truncate">
                        {r.projectionType}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] tracking-widest uppercase border ${relationshipTone(r.relationshipType)} shrink-0`}>
                        {r.relationshipType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] mt-0.5">
                      <span className="text-bone-200/55">system</span>
                      <span className={heatTone(r.systemConfidence)}>{r.systemConfidence.toFixed(1)}/10</span>
                      <span className="text-bone-200/45">·</span>
                      <span className="text-bone-200/55">operator</span>
                      <span className={heatTone(r.operatorConfidence)}>{r.operatorConfidence.toFixed(1)}/10</span>
                      <span className="text-bone-200/45">·</span>
                      <span className="text-bone-200/55">agreement</span>
                      <span className={heatTone(r.agreementLevel)}>{r.agreementLevel.toFixed(1)}/10</span>
                    </div>
                    {(r.operatorAccuracy.trustSensitivity > 0 ||
                      r.operatorAccuracy.fatigueSensitivity > 0 ||
                      r.operatorAccuracy.durabilitySensitivity > 0) && (
                      <div className="flex items-center gap-2 text-[9px] mt-0.5">
                        <span className="text-bone-200/55">intuition:</span>
                        <span className={heatTone(r.operatorAccuracy.trustSensitivity)}>trust {r.operatorAccuracy.trustSensitivity.toFixed(1)}</span>
                        <span className={heatTone(r.operatorAccuracy.fatigueSensitivity)}>fatigue {r.operatorAccuracy.fatigueSensitivity.toFixed(1)}</span>
                        <span className={heatTone(r.operatorAccuracy.durabilitySensitivity)}>dur {r.operatorAccuracy.durabilitySensitivity.toFixed(1)}</span>
                        <span className="text-bone-200/55">short {r.operatorAccuracy.shortTerm.toFixed(1)}</span>
                        <span className="text-bone-200/55">long {r.operatorAccuracy.longTerm.toFixed(1)}</span>
                      </div>
                    )}
                    {r.reconciliationAnnotations.length > 0 && (
                      <ul className="mt-0.5 text-bone-200/65 text-[9px] space-y-0.5">
                        {r.reconciliationAnnotations.slice(0, 3).map((ann, i) => (
                          <li key={i} className="break-words italic">· {ann}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {v.highestAgreement.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">HIGHEST AGREEMENT</div>
          <div className="flex flex-col gap-0.5">
            {v.highestAgreement.slice(0, 4).map((r) => (
              <div key={r.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-50/75 flex-grow uppercase tracking-wider truncate">{r.projectionType}</span>
                <span className={`w-[50px] text-right ${heatTone(r.agreement)}`}>
                  {r.agreement.toFixed(1)}/10
                </span>
                <span className="w-[120px] text-right text-bone-200/55 text-[9px] uppercase tracking-widest">{r.relationship}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.chronicDisagreement.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">CHRONIC DISAGREEMENT</div>
          <div className="flex flex-col gap-0.5">
            {v.chronicDisagreement.slice(0, 4).map((r) => (
              <div key={r.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.projectionType}</span>
                <span className={`w-[50px] text-right ${heatTone(r.agreement)}`}>
                  {r.agreement.toFixed(1)}/10
                </span>
                <span className="w-[120px] text-right text-signal-warning/75 text-[9px] uppercase tracking-widest">{r.relationship}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(v.strongestIntuitionDomains.length > 0 || v.weakestIntuitionDomains.length > 0) && (
        <div className="pt-2 grid grid-cols-2 gap-3">
          {v.strongestIntuitionDomains.length > 0 && (
            <div>
              <div className="eyebrow mb-1">STRONGEST INTUITION</div>
              <div className="flex flex-col gap-0.5">
                {v.strongestIntuitionDomains.slice(0, 4).map((r) => (
                  <div key={r.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                    <span className="text-bone-50/75 flex-grow uppercase tracking-wider truncate">{r.projectionType}</span>
                    <span className="w-[44px] text-right text-bone-50/75">{r.compositeAccuracy.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {v.weakestIntuitionDomains.length > 0 && (
            <div>
              <div className="eyebrow mb-1">WEAKEST INTUITION</div>
              <div className="flex flex-col gap-0.5">
                {v.weakestIntuitionDomains.slice(0, 4).map((r) => (
                  <div key={r.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                    <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{r.projectionType}</span>
                    <span className="w-[44px] text-right text-signal-warning/75">{r.compositeAccuracy.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {v.improvingAlignmentTypes.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">IMPROVING ALIGNMENT</div>
          <ul className="text-[10px] text-bone-50/80 leading-snug space-y-0.5">
            {v.improvingAlignmentTypes.slice(0, 3).map((r) => (
              <li key={r.projectionType} className="break-words">
                · <span className="uppercase tracking-wider">{r.projectionType}</span>
                {' '}<span className="text-bone-200/55">×{r.count}/{r.totalSnapshots} snapshots</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(v.overtrustPatterns.length > 0 || v.undertrustPatterns.length > 0) && (
        <div className="pt-2 grid grid-cols-2 gap-3">
          {v.overtrustPatterns.length > 0 && (
            <div>
              <div className="eyebrow mb-1">CHRONIC OVERTRUST</div>
              <ul className="text-[10px] text-signal-warning/80 leading-snug space-y-0.5">
                {v.overtrustPatterns.slice(0, 3).map((r) => (
                  <li key={r.projectionType} className="break-words">
                    · <span className="uppercase tracking-wider">{r.projectionType}</span>
                    {' '}<span className="text-bone-200/55">×{r.count}/{r.totalSnapshots}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {v.undertrustPatterns.length > 0 && (
            <div>
              <div className="eyebrow mb-1">CHRONIC UNDERTRUST</div>
              <ul className="text-[10px] text-signal-warning/75 leading-snug space-y-0.5">
                {v.undertrustPatterns.slice(0, 3).map((r) => (
                  <li key={r.projectionType} className="break-words">
                    · <span className="uppercase tracking-wider">{r.projectionType}</span>
                    {' '}<span className="text-bone-200/55">×{r.count}/{r.totalSnapshots}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {v.unstableIntuitionTypes.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">UNSTABLE INTUITION</div>
          <ul className="text-[10px] text-signal-warning/75 leading-snug space-y-0.5">
            {v.unstableIntuitionTypes.slice(0, 3).map((r) => (
              <li key={r.projectionType} className="break-words">
                · <span className="uppercase tracking-wider">{r.projectionType}</span>
                {' '}<span className="text-bone-200/55">×{r.count}/{r.totalSnapshots}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {v.divergenceHeatmap.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">DIVERGENCE HEATMAP (recent deltas, op-system)</div>
          <div className="flex flex-col gap-0.5">
            {v.divergenceHeatmap.slice(0, 5).map((row) => (
              <div key={row.projectionType} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 w-[140px] shrink-0 uppercase tracking-wider truncate">{row.projectionType}</span>
                <span className="flex-grow flex items-center gap-0.5">
                  {row.trajectory.map((d, i) => {
                    const intensity = Math.min(1, Math.abs(d) / 5);
                    const positive = d > 0;
                    const bg = d === 0 ? 'rgba(247,245,242,0.15)'
                            : positive ? `rgba(201,162,75,${0.2 + intensity * 0.6})`
                                      : `rgba(138,169,138,${0.2 + intensity * 0.6})`;
                    return (
                      <span key={i} className="inline-block w-[8px] h-[8px]"
                        style={{ background: bg }}
                        title={`Δ ${d.toFixed(1)}`}
                      />
                    );
                  })}
                </span>
                <span className={`w-[40px] text-right ${heatTone(row.averageAbsDelta, true)}`}>
                  Δ {row.averageAbsDelta.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.operatorEvolution.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">OPERATOR EVOLUTION</div>
          <div className="flex flex-col gap-0.5">
            {v.operatorEvolution.slice(0, 4).map((op) => (
              <div key={op.operatorId} className="flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-bone-200/65 flex-grow uppercase tracking-wider truncate">{op.operatorId}</span>
                <span className="w-[40px] text-right text-bone-50/75">×{op.totalSnapshots}</span>
                <span className={`w-[100px] text-right uppercase tracking-widest text-[9px] ${
                  op.recentAlignmentTrend === 'improving' ? 'text-bone-50/85' :
                  op.recentAlignmentTrend === 'degrading' ? 'text-signal-warning/85' :
                  'text-bone-200/55'}`}>
                  {op.recentAlignmentTrend}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 text-[10px] text-bone-200/55 tabular-nums">
        {v.operatorId} · {v.totalSnapshots} snapshot(s)
      </div>
    </div>
  );
}

// ─── system integrity panel ──────────────────────────────────

function SystemIntegrityPanel({ report }: { report: SystemIntegrityReport }) {
  const statusTone =
    report.overallStatus === 'stable'   ? 'text-bone-50/85' :
    report.overallStatus === 'warning'  ? 'text-bone-200/85' :
                                          'text-signal-warning';
  const safetyOk = (Object.values(report.safetyHealth) as boolean[])
    .every((v) => v === true);
  const routeOk = report.routeHealth.filter((r) => r.status === 'ok').length;
  const panelOk = report.panelHealth.filter((p) => p.status === 'ok').length;
  const memoryReadable = report.memoryHealth.filter((m) => m.exists && m.readable).length;
  const memoryCapped = report.memoryHealth.filter((m) => m.capped).length;
  const memoryExisting = report.memoryHealth.filter((m) => m.exists).length;

  const failedRoutes = report.routeHealth.filter((r) => r.status !== 'ok');
  const failedPanels = report.panelHealth.filter((p) => p.status !== 'ok');
  const cappedIssues = report.memoryHealth.filter((m) => m.exists && !m.capped);

  return (
    <div className="border-t hairline pt-3 space-y-2">
      <div className="eyebrow">system integrity · stability audit</div>
      <div className={`text-xs uppercase tracking-widest ${statusTone}`}>
        overall: {report.overallStatus}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs tabular-nums pt-1">
        <div>
          <div className="eyebrow">TYPESCRIPT</div>
          <div className={`mt-0.5 ${report.typeScriptStatus ? 'text-bone-50/85' : 'text-signal-warning'}`}>
            {report.typeScriptStatus ? 'clean' : 'failing'}
          </div>
        </div>
        <div>
          <div className="eyebrow">SAFETY</div>
          <div className={`mt-0.5 ${safetyOk ? 'text-bone-50/85' : 'text-signal-warning'}`}>
            {safetyOk ? '5/5 ok' : 'breach'}
          </div>
        </div>
        <div>
          <div className="eyebrow">ROUTES</div>
          <div className={`mt-0.5 ${routeOk === report.routeHealth.length ? 'text-bone-50/85' : 'text-signal-warning'}`}>
            {routeOk}/{report.routeHealth.length}
          </div>
        </div>
        <div>
          <div className="eyebrow">PANELS</div>
          <div className={`mt-0.5 ${panelOk === report.panelHealth.length ? 'text-bone-50/85' : 'text-signal-warning'}`}>
            {panelOk}/{report.panelHealth.length}
          </div>
        </div>
        <div>
          <div className="eyebrow">MEMORY READABLE</div>
          <div className="mt-0.5 text-bone-50/75">
            {memoryReadable}/{memoryExisting} existing
          </div>
        </div>
        <div>
          <div className="eyebrow">MEMORY CAPPED</div>
          <div className={`mt-0.5 ${memoryCapped === report.memoryHealth.length ? 'text-bone-50/85' : 'text-signal-warning'}`}>
            {memoryCapped}/{report.memoryHealth.length}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="eyebrow mb-1">SAFETY GUARANTEES</div>
        <ul className="space-y-0.5 text-[10px]">
          {([
            ['criticUntouched', 'critic untouched'],
            ['generationUntouched', 'generation untouched'],
            ['noAutonomousExecution', 'no autonomous execution'],
            ['noExternalApis', 'no external APIs'],
            ['noSelfModification', 'no self-modification'],
          ] as Array<[keyof typeof report.safetyHealth, string]>).map(([key, label]) => {
            const ok = report.safetyHealth[key];
            return (
              <li key={key} className="flex items-center gap-2 tabular-nums">
                <span className="text-bone-200/65 flex-grow">{label}</span>
                <span className={ok ? 'text-bone-50/85' : 'text-signal-warning'}>
                  {ok ? 'verified' : 'breach'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {failedRoutes.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">FAILED ROUTES</div>
          <ul className="text-[10px] text-signal-warning/85 leading-snug space-y-0.5">
            {failedRoutes.slice(0, 5).map((r) => (
              <li key={r.route} className="break-words">
                · <span className="uppercase tracking-wider">{r.route}</span> — {r.status}
                {r.issue && <span className="text-bone-200/55"> ({r.issue})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {failedPanels.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">FAILED PANELS</div>
          <ul className="text-[10px] text-signal-warning/85 leading-snug space-y-0.5">
            {failedPanels.slice(0, 5).map((p) => (
              <li key={p.panel} className="break-words">
                · <span className="uppercase tracking-wider">{p.panel}</span>
                {p.issue && <span className="text-bone-200/55"> — {p.issue}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cappedIssues.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">FIFO CAP BREACHES</div>
          <ul className="text-[10px] text-signal-warning/85 leading-snug space-y-0.5">
            {cappedIssues.slice(0, 5).map((m) => (
              <li key={m.file} className="break-words">
                · <span className="uppercase tracking-wider">{m.file}</span> — {m.issue ?? 'over cap'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.warnings.length > 0 && (
        <div className="pt-2">
          <div className="eyebrow mb-1">WARNINGS</div>
          <ul className="text-[10px] text-bone-200/55 leading-snug space-y-0.5">
            {report.warnings.slice(0, 6).map((w, i) => (
              <li key={i} className="break-words">· {w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2">
        <div className="eyebrow mb-1">MEMORY STATE</div>
        <div className="flex flex-col gap-0.5">
          {report.memoryHealth.slice(0, 8).map((m) => (
            <div key={m.file} className="flex items-center gap-2 text-[10px] tabular-nums">
              <span className="text-bone-200/65 flex-grow truncate">{m.file}</span>
              <span className={`w-[60px] text-right ${m.exists ? 'text-bone-50/85' : 'text-bone-200/45'}`}>
                {m.exists ? 'present' : 'not-yet'}
              </span>
              <span className={`w-[50px] text-right ${m.exists && !m.readable ? 'text-signal-warning' : 'text-bone-200/55'}`}>
                {m.readable ? 'readable' : '—'}
              </span>
              <span className={`w-[50px] text-right ${!m.capped ? 'text-signal-warning' : 'text-bone-200/55'}`}>
                {m.capped ? 'capped' : 'OVER'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 text-[10px] text-bone-200/55 italic">
        Before intelligence expands, stability must be proven.
      </div>
    </div>
  );
}

function PreviewSkeleton({ running }: { running: boolean }) {
  return (
    <div className="w-full max-w-[540px] aspect-[4/5] border hairline flex flex-col items-center justify-center text-xs text-bone-200/50 text-center px-8">
      <div className={running ? 'pulse' : ''}>composing…</div>
      <div className="mt-2 text-[10px] tracking-widest">HUMAN STATE → TRUTH → DIRECTION → IMAGE → TASTE</div>
    </div>
  );
}

// ─── Human Truth Panel ─────────────────────────────────────────────
// Single consolidated panel for the ethical observatory: authenticity,
// manipulation pressure, continuity, soul preservation, anti-optimization,
// emotional dignity. Human-protective — never amplifies any of these signals.
interface HumanTruthProps {
  authenticity: HumanTruthReading;
  manipulationPressure: ManipulationPressureReading;
  humanContinuity: AuthenticityContinuityReading;
  soulPreservation: SoulPreservationReading;
  antiOptimizationSignals: AntiOptimizationReading;
  dignitySignals: EmotionalDignityReading;
  trustVsPerformance: { gap: number; highPerformingThreat: boolean; performanceWithoutTrustCount: number };
}
function HumanTruthPanel({ h }: { h: HumanTruthProps }) {
  const classColor =
    h.authenticity.classification === 'felt-human' ? 'text-green-300' :
    h.authenticity.classification === 'optimized-content' ? 'text-red-400' :
    'text-amber-300';
  const pressureColor =
    h.manipulationPressure.pressureLevel === 'low' ? 'text-green-300' :
    h.manipulationPressure.pressureLevel === 'moderate' ? 'text-amber-200' :
    h.manipulationPressure.pressureLevel === 'high' ? 'text-orange-400' :
    'text-red-400';
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">human truth</div>
      <div className="text-[10px] text-bone-200/50">
        Observatory only — HUMAN-PROTECTIVE. The system never optimizes against these signals.
      </div>
      <div className="flex items-baseline gap-2">
        <span className="eyebrow">classification</span>
        <span className={`text-base font-semibold tracking-widest ${classColor}`}>
          {h.authenticity.classification.replace('-', ' ').toUpperCase()}
        </span>
      </div>
      <Field label="AUTHENTICITY" value={`${h.authenticity.authenticityScore}/10`} />
      <Field label="FELT HUMAN" value={`${h.authenticity.feltHumanScore}/10`} />
      <Field label="OVER-OPTIMIZATION RISK" value={`${h.authenticity.overOptimizationRisk}/10`} />

      <div className="border-t hairline pt-2 text-xs">
        <div className="eyebrow mb-1">authenticity signals (top 6)</div>
        {Object.entries(h.authenticity.signals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between text-bone-200/70">
              <span>{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
              <span className={v >= 7 ? 'text-green-300' : v <= 3 ? 'text-amber-300' : 'text-bone-200/80'}>{v}/10</span>
            </div>
          ))}
      </div>

      <div className="border-t hairline pt-2 text-xs">
        <div className="flex items-baseline gap-2">
          <span className="eyebrow">manipulation pressure</span>
          <span className={`tracking-widest font-medium ${pressureColor}`}>
            {h.manipulationPressure.pressureLevel.toUpperCase()}
          </span>
          <span className="text-bone-200/60 ml-auto text-[10px]">{h.manipulationPressure.pressureScore}/10</span>
        </div>
        {h.manipulationPressure.signals.slice(0, 4).map((s, i) => (
          <div key={i} className="text-bone-200/70">· {s.signal} ({s.severity}/10)</div>
        ))}
      </div>

      <div className="border-t hairline pt-2 text-xs">
        <div className="eyebrow mb-1">authenticity continuity</div>
        <div className="text-bone-200/80">
          direction: <span className="font-medium">{h.humanContinuity.direction}</span> ·
          continuity {h.humanContinuity.humanContinuityScore}/10
        </div>
        {h.humanContinuity.toneBecameSynthetic && <div className="text-amber-300/80">· tone became synthetic</div>}
        {h.humanContinuity.emotionalPacingOptimized && <div className="text-amber-300/80">· emotional pacing optimized</div>}
        {h.humanContinuity.persuasionReplacedStorytelling && <div className="text-amber-300/80">· persuasion replaced storytelling</div>}
        {h.humanContinuity.identityDriftedToPerformance && <div className="text-amber-300/80">· identity drifted to performance</div>}
      </div>

      <div className="border-t hairline pt-2 text-xs">
        <div className="eyebrow mb-1">soul preservation</div>
        <div className="flex justify-between text-bone-200/70">
          <span>integrity</span>
          <span>{h.soulPreservation.soulIntegrity}/10</span>
        </div>
        {h.soulPreservation.aiFeelingDetected && <div className="text-red-400">· AI feeling detected</div>}
        {h.soulPreservation.signals.slice(0, 4).map((s, i) => (
          <div key={i} className="text-bone-200/70 text-[10px]">· {s.signal} ({s.severity}/10)</div>
        ))}
      </div>

      <div className="border-t hairline pt-2 text-xs">
        <div className="eyebrow mb-1">anti-optimization</div>
        <div className="flex justify-between text-bone-200/70">
          <span>exploitation pressure</span>
          <span className={h.antiOptimizationSignals.exploitationPressure >= 6 ? 'text-red-400' : 'text-bone-200/80'}>
            {h.antiOptimizationSignals.exploitationPressure}/10
          </span>
        </div>
        {h.antiOptimizationSignals.performanceWithoutTrustDetected && (
          <div className="text-amber-300/80">· performance without trust detected ({h.antiOptimizationSignals.performanceWithoutTrustCount} records)</div>
        )}
        {h.antiOptimizationSignals.signals.slice(0, 4).map((s, i) => (
          <div key={i} className="text-bone-200/70 text-[10px]">· {s.pattern} ({s.severity}/10) · {s.occurrences} occurrences</div>
        ))}
      </div>

      <div className="border-t hairline pt-2 text-xs">
        <div className="eyebrow mb-1">emotional dignity</div>
        <div className="flex justify-between text-bone-200/70">
          <span>dignity score</span>
          <span className={h.dignitySignals.dignityScore <= 4 ? 'text-red-400' : 'text-bone-200/80'}>
            {h.dignitySignals.dignityScore}/10
          </span>
        </div>
        <div className="flex justify-between text-bone-200/70">
          <span>trust vs performance gap</span>
          <span className={h.trustVsPerformance.gap >= 4 ? 'text-red-400' : 'text-bone-200/80'}>
            {h.trustVsPerformance.gap}/10
          </span>
        </div>
        {h.trustVsPerformance.highPerformingThreat && (
          <div className="text-amber-300/80">· high-performing content threatening long-term trust</div>
        )}
        {Object.entries(h.dignitySignals.signals).map(([k, v]) => (
          <div key={k} className="flex justify-between text-bone-200/60 text-[10px]">
            <span>{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span><span>{v}/10</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reality Intelligence Panel ────────────────────────────────────
// Composite observatory for real-world outcomes attached to creative
// fingerprints. Performance DNA, decay timeline, hook lifecycle,
// audience segmentation, emotional response, long-term winners,
// fast-burn patterns, recovery windows.
interface RealityIntelProps {
  totalOutcomes: number;
  performanceDNA: PerformanceDNA;
  longTermPerformers: PatternLifecycle[];
  fastBurnPatterns: PatternLifecycle[];
  recoveryWindows: PatternLifecycle[];
  hookLifecycle: HookLifecycle[];
  audienceSegments: AudienceSegmentReport;
  emotionalResponseMap: EmotionalResponseMap;
}
function RealityIntelligencePanel({ r }: { r: RealityIntelProps }) {
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">reality intelligence</div>
      <div className="text-[10px] text-bone-200/50">
        Observatory only — operator-supplied outcomes. The system never auto-publishes.
      </div>
      <Field label="OUTCOMES" value={String(r.totalOutcomes)} />
      <div className="flex justify-between text-[11px] text-bone-200/60">
        <span>performance correlations {r.performanceDNA.traitCorrelations.length}</span>
        <span>hooks {r.hookLifecycle.length}</span>
        <span>segments {r.audienceSegments.segments.length}</span>
      </div>

      {r.performanceDNA.traitCorrelations.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">performance DNA</div>
          {r.performanceDNA.traitCorrelations.slice(0, 5).map((c, i) => (
            <div key={i} className="text-bone-200/70">· {c.description}</div>
          ))}
        </div>
      )}

      {r.longTermPerformers.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">long-term performers</div>
          {r.longTermPerformers.slice(0, 4).map((p, i) => (
            <div key={i} className="text-bone-200/70 font-mono text-[10px]">
              {p.fingerprint.slice(0, 50)} · {p.averageEngagement}/10 · ×{p.occurrences}
            </div>
          ))}
        </div>
      )}

      {r.fastBurnPatterns.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">fast-burn patterns</div>
          {r.fastBurnPatterns.slice(0, 3).map((p, i) => (
            <div key={i} className="text-amber-300/80 font-mono text-[10px]">
              {p.fingerprint.slice(0, 50)} · early {p.earlyEngagement} → recent {p.recentEngagement}
            </div>
          ))}
        </div>
      )}

      {r.recoveryWindows.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">recovery windows</div>
          {r.recoveryWindows.slice(0, 3).map((p, i) => (
            <div key={i} className="text-green-300/80 font-mono text-[10px]">
              {p.fingerprint.slice(0, 50)} · returned at {p.recentEngagement}/10
            </div>
          ))}
        </div>
      )}

      {r.hookLifecycle.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">hook lifecycle</div>
          {r.hookLifecycle.slice(0, 4).map((h, i) => (
            <div key={i} className="text-bone-200/70 text-[10px]">
              "{h.hook.slice(0, 50)}" · freshness {h.freshness}/10 · saturation v={h.saturationVelocity}/run
              {h.recoveryWindow && <span className="text-green-300/80"> · recovery</span>}
            </div>
          ))}
        </div>
      )}

      {r.audienceSegments.segments.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">audience segments</div>
          {r.audienceSegments.segments.slice(0, 4).map((s, i) => (
            <div key={i} className="text-bone-200/70">· {s.description}</div>
          ))}
        </div>
      )}

      {Object.values(r.emotionalResponseMap.globalResponseDistribution).some((v) => v > 0) && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">emotional response map</div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-bone-200/70 text-[10px]">
            {Object.entries(r.emotionalResponseMap.globalResponseDistribution)
              .filter(([, v]) => v > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <div key={k}>
                  <span className="text-bone-200/50">{k}</span> · {v}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Consequence Intelligence Panel ────────────────────────────────
// Historical correlation observatory: patterns, correlations, risk
// escalations, recovery wins, strategic timeline. NEVER predictive.
interface ConsequenceIntelligenceProps {
  totalEpisodes: number;
  consequencePatterns: ConsequencePattern[];
  historicalCorrelations: HistoricalCorrelation[];
  riskEscalations: RiskEscalation[];
  strategicTimeline: TimelineEvent[];
  recoveryPatterns: RecoveryPattern[];
  stabilizationSuccesses: StabilizationSuccess[];
  topRecoveryTakeaways: string[];
  recoveryEpisodeCount: number;
}
function ConsequenceIntelligencePanel({ c }: { c: ConsequenceIntelligenceProps }) {
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">consequence intelligence</div>
      <div className="text-[10px] text-bone-200/50">Observatory only — historical correlation, never prediction.</div>
      <Field label="EPISODES" value={String(c.totalEpisodes)} />
      <div className="flex justify-between text-[11px] text-bone-200/60">
        <span>patterns {c.consequencePatterns.length}</span>
        <span>correlations {c.historicalCorrelations.length}</span>
        <span>recoveries {c.recoveryEpisodeCount}</span>
      </div>
      {c.consequencePatterns.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">recurring patterns</div>
          {c.consequencePatterns.slice(0, 4).map((p, i) => (
            <div key={i} className="text-bone-200/70 mb-1">
              <div className="font-mono text-[10px] text-bone-200/50">{p.conditionFingerprint}</div>
              <div className="text-bone-200/80">{p.description}</div>
            </div>
          ))}
        </div>
      )}
      {c.historicalCorrelations.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">historical correlations</div>
          {c.historicalCorrelations.slice(0, 5).map((h, i) => (
            <div key={i} className="text-bone-200/70">· {h.description}</div>
          ))}
        </div>
      )}
      {c.riskEscalations.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">risk escalations</div>
          {c.riskEscalations.slice(0, 4).map((r, i) => (
            <div key={i} className="text-bone-200/70">
              <span className={r.averageSeverity === 'critical' ? 'text-red-400' : r.averageSeverity === 'severe' ? 'text-orange-400' : 'text-amber-300'}>
                [{r.averageSeverity}]
              </span> {r.description}
            </div>
          ))}
        </div>
      )}
      {c.topRecoveryTakeaways.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">recovery wins</div>
          {c.topRecoveryTakeaways.map((t, i) => (
            <div key={i} className="text-bone-200/70">· {t}</div>
          ))}
        </div>
      )}
      {c.strategicTimeline.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">strategic timeline (last 6)</div>
          {c.strategicTimeline.slice(-6).map((e, i) => (
            <div key={i} className="text-bone-200/60 text-[10px]">
              {new Date(e.at).toISOString().slice(11, 19)} · {e.type}
              {'outcome' in e && ` · ${e.outcome}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Adaptation Orchestrator Panel ─────────────────────────────────
// Coordinated priority + conflict resolution + system state.
function AdaptationOrchestratorPanel({ o }: { o: AdaptationOrchestration }) {
  const stateColor =
    o.systemState === 'stable' ? 'text-green-300' :
    o.systemState === 'protecting' ? 'text-amber-200' :
    o.systemState === 'mutating' ? 'text-blue-300' :
    o.systemState === 'recovering' ? 'text-amber-300' :
    'text-red-400';
  const escColor =
    o.escalationLevel === 'low' ? 'text-bone-200/70' :
    o.escalationLevel === 'medium' ? 'text-amber-300' :
    o.escalationLevel === 'high' ? 'text-orange-400' :
    'text-red-400';
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">adaptation orchestrator</div>
      <div className="text-[10px] text-bone-200/50">{o.advisoryNotice}</div>
      <div className="flex items-baseline gap-2">
        <span className="eyebrow">state</span>
        <span className={`text-base font-semibold tracking-widest ${stateColor}`}>{o.systemState.toUpperCase()}</span>
        <span className={`text-[10px] ml-auto ${escColor}`}>{o.escalationLevel}</span>
      </div>
      <Field label="DOMINANT RISK" value={o.dominantRisk} />
      <Field label="DOMINANT PRESSURE" value={o.dominantPressure} />
      <Field label="PRIORITY" value={o.adaptationPriority} />
      <div className="text-sm text-bone-200/90 leading-snug">{o.strategicSummary}</div>
      <div className="text-xs text-bone-200/70">
        <span className="text-bone-200/50">focus:</span> {o.recommendedFocus}
      </div>
      <div className="border-t hairline pt-2 text-xs">
        <div className="eyebrow mb-1">strategy weights</div>
        <div className="flex justify-between text-bone-200/70">
          <span>trust protection</span><span>{o.trustProtectionWeight}/10</span>
        </div>
        <div className="flex justify-between text-bone-200/70">
          <span>originality protection</span><span>{o.originalityProtectionWeight}/10</span>
        </div>
        <div className="flex justify-between text-bone-200/70">
          <span>persuasion reduction</span><span>{o.persuasionReductionWeight}/10</span>
        </div>
        <div className="flex justify-between text-bone-200/70">
          <span>restraint</span><span>{o.restraintWeight}/10</span>
        </div>
        <div className="flex justify-between text-bone-200/70">
          <span>stabilization</span><span>{o.stabilizationWeight}/10</span>
        </div>
        <div className="flex justify-between text-bone-200/70">
          <span>mutation urgency</span><span>{o.mutationUrgency}/10</span>
        </div>
      </div>
      {o.adaptationConflicts.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">conflicts resolved</div>
          {o.adaptationConflicts.slice(0, 6).map((c, i) => (
            <div key={i} className="text-bone-200/70">
              <span className="text-bone-200/90">{c.winner}</span>
              <span className="text-bone-200/50"> ▸ suppresses ▸ </span>
              <span className="text-bone-200/60">{c.loser}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── System Energy Model Panel ─────────────────────────────────────
function SystemEnergyPanel({ e }: { e: SystemEnergyModel }) {
  const stateColor =
    e.energyState === 'fresh' ? 'text-green-300' :
    e.energyState === 'measured' ? 'text-bone-200/80' :
    e.energyState === 'taxed' ? 'text-amber-300' :
    'text-red-400';
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">system energy model</div>
      <div className="text-[10px] text-bone-200/50">{e.advisoryNotice}</div>
      <div className="flex items-baseline gap-2">
        <span className="eyebrow">energy</span>
        <span className={`text-base font-semibold tracking-widest ${stateColor}`}>{e.energyState.toUpperCase()}</span>
      </div>
      <div className="text-xs space-y-0.5 text-bone-200/80">
        <div className="flex justify-between"><span>available bandwidth</span><span>{e.availableBandwidth}/10</span></div>
        <div className="flex justify-between"><span>mutation capacity</span><span>{e.mutationCapacity}/10</span></div>
        <div className="flex justify-between"><span>stabilization load</span><span>{e.stabilizationLoad}/10</span></div>
        <div className="flex justify-between"><span>exhaustion risk</span><span>{e.exhaustionRisk}/10</span></div>
        <div className="flex justify-between"><span>recovery need</span><span>{e.recoveryNeed}/10</span></div>
        <div className="flex justify-between"><span>adaptation budget</span><span>{e.adaptationBudget}/10</span></div>
        <div className="flex justify-between"><span>overload risk</span><span className={e.overloadRisk >= 7 ? 'text-red-400' : ''}>{e.overloadRisk}/10</span></div>
        <div className="flex justify-between"><span>sustainable rate</span><span>{e.sustainableMutationRate}/10 runs</span></div>
      </div>
    </div>
  );
}

// ─── Adaptive Cadence Panel ────────────────────────────────────────
function AdaptiveCadencePanel({ c }: { c: AdaptiveCadence }) {
  const stateColor =
    c.cadenceState === 'paused' ? 'text-red-400' :
    c.cadenceState === 'stabilizing' ? 'text-amber-300' :
    c.cadenceState === 'gradual' ? 'text-bone-200/80' :
    c.cadenceState === 'normal' ? 'text-green-300' :
    'text-blue-300';
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">adaptive cadence</div>
      <div className="text-[10px] text-bone-200/50">{c.advisoryNotice}</div>
      <div className="flex items-baseline gap-2">
        <span className="eyebrow">cadence</span>
        <span className={`text-base font-semibold tracking-widest ${stateColor}`}>{c.cadenceState.toUpperCase()}</span>
      </div>
      <Field label="MUTATIONS / RUN" value={`${c.recommendedMutationsPerRun}`} />
      <Field label="COOLDOWN" value={`${c.cooldownRemaining} runs`} />
      <div className="text-xs text-bone-200/70">{c.cadenceJustification}</div>
      <div className="border-t hairline pt-2 text-xs space-y-0.5 text-bone-200/70">
        <div className="flex justify-between">
          <span>novelty cooldown</span>
          <span>{c.noveltyCooldownActive ? 'active' : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>trust restoration</span>
          <span>{c.trustRestorationActive ? 'active' : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>fatigue recovery window</span>
          <span>{c.fatigueRecoveryWindowOpen ? 'open' : '—'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Refusal Intelligence Panel ────────────────────────────────────
// Surfaces the refusal narrative engine's elite-creative-leadership voice.
function RefusalIntelligencePanel({ r }: { r: RefusalNarrativeOutput }) {
  const sevColor =
    r.severity === 'severe' ? 'text-red-400' :
    r.severity === 'serious' ? 'text-orange-400' :
    r.severity === 'moderate' ? 'text-amber-300' :
    'text-bone-200/80';
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">refusal intelligence</div>
      <div className="text-[10px] text-bone-200/50">Advisory only — describes, does not refuse.</div>
      <div className="flex items-baseline gap-2">
        <span className="eyebrow">severity</span>
        <span className={`text-base font-semibold tracking-widest ${sevColor}`}>{r.severity.toUpperCase()}</span>
      </div>
      <div className="text-sm text-bone-200/90 leading-snug">{r.narrativeReason}</div>
      <div className="border-t hairline pt-2 space-y-1 text-xs text-bone-200/70">
        <div><span className="text-bone-200/50">diagnosis:</span> {r.creativeDiagnosis}</div>
        <div><span className="text-bone-200/50">strategic risk:</span> {r.strategicRisk}</div>
        <div><span className="text-bone-200/50">suggested direction:</span> {r.suggestedDirection}</div>
        <div><span className="text-bone-200/50">emotional reading:</span> {r.emotionalInterpretation}</div>
        <div><span className="text-bone-200/50">trust impact:</span> {r.trustImpact}</div>
        <div><span className="text-bone-200/50">dignity impact:</span> {r.dignityImpact}</div>
      </div>
    </div>
  );
}

// ─── Creative Fatigue Panel ────────────────────────────────────────
function CreativeFatiguePanel({ f }: { f: CreativeFatigue }) {
  const color = f.fatigueLevel >= 7 ? 'text-red-400' : f.fatigueLevel >= 4 ? 'text-amber-300' : 'text-green-300';
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">creative fatigue</div>
      <div className="text-[10px] text-bone-200/50">{f.advisoryNotice}</div>
      <div className="flex items-baseline gap-2">
        <span className="eyebrow">fatigue</span>
        <span className={`text-base font-semibold tracking-widest ${color}`}>{f.fatigueLevel}/10</span>
      </div>
      <div className="text-xs space-y-0.5 text-bone-200/80">
        <div className="flex justify-between"><span>freshness</span><span>{f.freshnessScore}/10</span></div>
        <div className="flex justify-between"><span>predictability</span><span>{f.predictabilityScore}/10</span></div>
        <div className="flex justify-between"><span>collapse risk</span><span>{f.collapseRisk}/10</span></div>
        <div className="flex justify-between"><span>mutation pressure</span><span>{f.mutationPressure}/10</span></div>
      </div>
      <div className="border-t hairline pt-2 text-xs">
        <div className="eyebrow mb-1">vectors</div>
        {f.fatigueVectors.map((v) => (
          <div key={v.vector} className="flex justify-between text-bone-200/70">
            <span>{v.vector}</span>
            <span className={v.fatigue >= 7 ? 'text-red-400' : v.fatigue >= 4 ? 'text-amber-300' : 'text-bone-200/80'}>{v.fatigue}/10</span>
          </div>
        ))}
      </div>
      {f.saturationSignals.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">saturation signals</div>
          {f.saturationSignals.slice(0, 5).map((s, i) => (
            <div key={i} className="text-bone-200/70">
              <span className="text-bone-200/50">[{s.vector}/{s.dimension}]</span> {s.token.slice(0, 40)} · {Math.round(s.share * 100)}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mutation Planner Panel ────────────────────────────────────────
function MutationPlannerPanel({ plan, summary }: { plan: MutationPlan; summary: { fatigueLevel: number; freshnessScore: number; predictabilityScore: number; collapseRisk: number } }) {
  const categories: Array<[string, MutationPlan['pacingMutations']]> = [
    ['pacing', plan.pacingMutations],
    ['composition', plan.compositionMutations],
    ['emotional', plan.emotionalMutations],
    ['narrative', plan.narrativeMutations],
    ['persuasion', plan.persuasionMutations],
    ['visual', plan.visualMutations],
    ['restraint', plan.restraintMutations],
    ['novelty', plan.noveltyMutations],
  ];
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">mutation planner</div>
      <div className="text-[10px] text-bone-200/50">{plan.advisoryNotice}</div>
      <Field label="TOTAL PRESSURE" value={`${plan.totalMutationPressure}/10`} />
      <div className="flex justify-between text-[11px] text-bone-200/60">
        <span>fatigue {summary.fatigueLevel}</span>
        <span>freshness {summary.freshnessScore}</span>
        <span>predict {summary.predictabilityScore}</span>
        <span>collapse {summary.collapseRisk}</span>
      </div>
      {plan.topPriorityMutations.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">top priority (NOT applied)</div>
          {plan.topPriorityMutations.map((m, i) => (
            <div key={i} className="text-bone-200/80 mb-1">
              <span className="text-bone-200/90">{m.mutation}</span> · {m.intensity}/10
              <div className="text-bone-200/50 text-[10px]">{m.rationale}</div>
              <div className="text-bone-200/40 text-[10px]">would affect: {m.wouldAffect}</div>
            </div>
          ))}
        </div>
      )}
      {categories.filter(([, xs]) => xs.length > 0).length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">per category</div>
          {categories.filter(([, xs]) => xs.length > 0).map(([cat, xs]) => (
            <div key={cat} className="text-bone-200/70">
              <span className="text-bone-200/90">{cat}</span> · {xs.length} suggestion{xs.length === 1 ? '' : 's'} ·
              top: {xs[0]?.mutation.slice(0, 50)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Visual DNA Panel ──────────────────────────────────────────────
function VisualDNAPanel({ d }: { d: { totalObservations: number; saturations: Record<string, { dominantToken: string | null; share: number; distinct: number }>; averageRealism: number; averagePolish: number } }) {
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">visual DNA</div>
      <div className="text-[10px] text-bone-200/50">Observatory only — visual DNA never modifies generation.</div>
      <Field label="OBSERVATIONS" value={String(d.totalObservations)} />
      <div className="flex justify-between text-[11px] text-bone-200/60">
        <span>avg realism {d.averageRealism}/10</span>
        <span>avg polish {d.averagePolish}/10</span>
      </div>
      <div className="border-t hairline pt-2 text-xs">
        <div className="eyebrow mb-1">dimension saturation</div>
        {Object.entries(d.saturations).map(([dim, s]) => (
          <div key={dim} className="flex justify-between text-bone-200/70">
            <span>{dim}</span>
            <span className={s.share >= 0.5 ? 'text-amber-300' : 'text-bone-200/80'}>
              {Math.round(s.share * 100)}% · {s.distinct} distinct
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Narrative DNA Panel ───────────────────────────────────────────
function NarrativeDNAPanel({ d }: { d: { totalObservations: number; saturations: Record<string, { dominantToken: string | null; share: number; distinct: number }>; averageObservationalDensity: number; averageHumanRealism: number; averageCtaPressure: number } }) {
  return (
    <div className="border hairline p-4 space-y-2">
      <div className="eyebrow">narrative DNA</div>
      <div className="text-[10px] text-bone-200/50">Observatory only — narrative DNA never modifies generation.</div>
      <Field label="OBSERVATIONS" value={String(d.totalObservations)} />
      <div className="flex justify-between text-[11px] text-bone-200/60">
        <span>observ. density {d.averageObservationalDensity}/10</span>
        <span>human realism {d.averageHumanRealism}/10</span>
        <span>CTA pressure {d.averageCtaPressure}/10</span>
      </div>
      <div className="border-t hairline pt-2 text-xs">
        <div className="eyebrow mb-1">dimension saturation</div>
        {Object.entries(d.saturations).map(([dim, s]) => (
          <div key={dim} className="flex justify-between text-bone-200/70">
            <span>{dim}</span>
            <span className={s.share >= 0.5 ? 'text-amber-300' : 'text-bone-200/80'}>
              {Math.round(s.share * 100)}% · {s.distinct} distinct
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Creative Drift Panel ──────────────────────────────────────────
// Long-term creative-DNA observatory. Surfaces drift severity,
// entropy, emotional diversity, narrative stability, repetition,
// formula convergence, persuasion variance, originality pressure,
// collapse / recovery events, and direction over time.
// OBSERVATORY ONLY — never modifies generation.
function CreativeDriftPanel({
  current, longitudinal,
}: { current: CreativeDrift; longitudinal: CreativeDriftLongitudinalView }) {
  const healthColor =
    current.overallCreativeHealth >= 7 ? 'text-green-300' :
    current.overallCreativeHealth >= 4 ? 'text-amber-300' :
    'text-red-400';
  const directionColor =
    longitudinal.longTermDriftDirection === 'improving' ? 'text-green-300' :
    longitudinal.longTermDriftDirection === 'stable' ? 'text-bone-200/80' :
    longitudinal.longTermDriftDirection === 'volatile' ? 'text-amber-300' :
    longitudinal.longTermDriftDirection === 'worsening' ? 'text-red-400' :
    'text-bone-200/50';
  return (
    <div className="border hairline p-4 space-y-3">
      <div className="eyebrow">creative drift observatory</div>
      <div className="text-[10px] text-bone-200/50">{current.advisorySummary.includes('Observatory only')
        ? 'Observatory only — drift detection never modifies generation.'
        : current.advisorySummary}</div>
      <div className="flex items-baseline gap-2">
        <span className="eyebrow">health</span>
        <span className={`text-base font-semibold tracking-widest ${healthColor}`}>
          {current.overallCreativeHealth}/10
        </span>
      </div>
      <div className="space-y-1 text-sm">
        <Field label="DRIFT SEVERITY" value={`${current.driftSeverity}/10`} />
        <Field label="ENTROPY" value={`${current.entropyLevel}/10`} />
        <Field label="EMOTIONAL DIVERSITY" value={`${current.emotionalDiversity}/10`} />
        <Field label="PERSUASION VARIANCE" value={`${current.persuasionVariance}/10`} />
        <Field label="NARRATIVE STABILITY" value={`${current.narrativeStability}/10`} />
        <Field label="FORMULA DISTINCTIVENESS" value={`${current.formulaDistinctiveness}/10`} />
        <Field label="ORIGINALITY PRESSURE" value={`${current.originalityPressure}/10`} />
        <Field
          label="TRUST EROSION"
          value={`historical ${current.trustErosionTrajectory.historical} → recent ${current.trustErosionTrajectory.recent} (Δ ${current.trustErosionTrajectory.drift >= 0 ? '+' : ''}${current.trustErosionTrajectory.drift})`}
        />
      </div>
      {current.dominantDriftPatterns.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">dominant drift patterns</div>
          <ul className="space-y-1 text-bone-200/70">
            {current.dominantDriftPatterns.slice(0, 5).map((p, i) => (
              <li key={i}>
                <span className="text-bone-200/90">{p.pattern}</span> — severity {p.severity}/10
                <div className="text-bone-200/50 text-[10px]">{p.explanation}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {current.repetitiveNarratives.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">repetitive narratives</div>
          <ul className="space-y-0.5 text-bone-200/70">
            {current.repetitiveNarratives.slice(0, 4).map((n, i) => (
              <li key={i}>
                <span className="font-mono text-[10px]">{n.narrativeFingerprint.slice(0, 40)}</span>
                <span className="ml-2 text-bone-200/60">×{n.recurrence} · fatigueRisk {n.fatigueRisk}/10</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {current.formulaConvergence.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">formula convergence</div>
          <ul className="space-y-0.5 text-bone-200/70">
            {current.formulaConvergence.slice(0, 3).map((c, i) => (
              <li key={i}>
                {c.formulas.join(' ↔ ')} · {c.convergenceLevel}/10
                <div className="text-bone-200/50 text-[10px]">{c.explanation}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {current.emergingCreativeRisks.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">emerging creative risks</div>
          <ul className="space-y-0.5 text-bone-200/70">
            {current.emergingCreativeRisks.slice(0, 4).map((r, i) => (
              <li key={i}>
                <span className="text-bone-200/90">{r.risk}</span> · acceleration {r.acceleration}
                <div className="text-bone-200/50 text-[10px]">{r.explanation}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {longitudinal.present && (
        <div className="border-t hairline pt-2 text-xs space-y-1">
          <div className="eyebrow">long-term direction</div>
          <div className={`text-base tracking-widest font-medium ${directionColor}`}>
            {longitudinal.longTermDriftDirection.toUpperCase()}
          </div>
          <div className="text-bone-200/60">{longitudinal.statement}</div>
          <div className="flex justify-between text-[11px] text-bone-200/70 pt-1">
            <span>avg health {longitudinal.averageHealth}/10</span>
            <span>avg drift {longitudinal.averageDrift}/10</span>
            <span>entropy Δ {longitudinal.entropyAcceleration}/10</span>
          </div>
          <div className="flex justify-between text-[11px] text-bone-200/60">
            <span>healthy eras {longitudinal.healthiestEras.length}</span>
            <span>collapse periods {longitudinal.collapsePeriods.length}</span>
            <span>recoveries {longitudinal.recoveryEvents.length}</span>
          </div>
          <div className="flex justify-between text-[11px] text-bone-200/60">
            <span>repetition cycles {longitudinal.repetitionCycles.length}</span>
            <span>convergence cycles {longitudinal.convergenceCycles.length}</span>
            <span>originality cycles {longitudinal.originalityCycles.length}</span>
          </div>
          <div className="text-bone-200/50 text-[10px] pt-1">
            originality collapse risk {longitudinal.originalityCollapseRisk}/10 · {longitudinal.totalObservations} observations
          </div>
        </div>
      )}
      {current.creativeInstabilityZones.length > 0 && (
        <div className="border-t hairline pt-2 text-xs text-amber-200/80">
          <div className="eyebrow mb-1">creative instability zones</div>
          {current.creativeInstabilityZones.slice(0, 3).map((z, i) => (
            <div key={i}>
              <span className="text-amber-300">{z.condition}</span> · {z.instability}/10
              <div className="text-bone-200/60 text-[10px]">{z.explanation}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Production Conservative Mode Panel ──────────────────────────────
// Pre-flight checklist showing the requested combination's safety tier,
// production/testing allowance, recommended action, fallback suggestion,
// instability reasons, and guardrails. ADVISORY ONLY — no auto-apply.
function ProductionConservativeModePanel({
  conservative, envelopePresent,
}: { conservative: ProductionConservativeMode; envelopePresent: boolean }) {
  const tier = conservative.safetyTier;
  const tierColor =
    tier === 'safe' ? 'text-green-300' :
    tier === 'warning' ? 'text-amber-300' :
    tier === 'forbidden' ? 'text-red-400' :
    'text-bone-200/60';
  const req = conservative.requestedCombination;
  return (
    <div className="border hairline p-4 space-y-3">
      <div className="eyebrow">pre-flight · production conservative mode</div>
      <div className="text-[10px] text-bone-200/50">
        {conservative.advisoryNotice}
      </div>
      {!envelopePresent && (
        <div className="text-[11px] text-amber-300/80 border hairline px-2 py-1">
          envelope not present — run the matrix + envelope builder first
        </div>
      )}
      <div className="space-y-1 text-sm">
        <Field label="REQUESTED" value={`${req.formula} / ${req.campaignMode ?? 'AUTO'} / b=${req.brutality}`} />
        <div className="flex items-baseline gap-2">
          <span className="eyebrow">safety tier</span>
          <span className={`text-base font-semibold tracking-widest ${tierColor}`}>
            {tier.toUpperCase()}
          </span>
        </div>
        <Field label="READINESS" value={`${conservative.productionReadinessScore}/10`} />
        <Field label="PRODUCTION" value={conservative.allowedForProduction ? 'allowed' : 'NOT allowed'} />
        <Field label="TESTING" value={conservative.allowedForTesting ? 'allowed' : 'NOT allowed'} />
        <Field label="ACTION" value={conservative.recommendedAction} />
      </div>
      {conservative.safeFallback && (
        <div className="border-t hairline pt-2 space-y-1 text-xs">
          <div className="eyebrow">suggested fallback (NOT applied)</div>
          <div>
            {conservative.safeFallback.formula} / {conservative.safeFallback.campaignMode ?? 'AUTO'} / b={conservative.safeFallback.brutality}
          </div>
          <div className="text-bone-200/60">{conservative.safeFallback.reason}</div>
        </div>
      )}
      {conservative.instabilityReasons.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">instability reasons</div>
          <ul className="space-y-1 text-bone-200/70">
            {conservative.instabilityReasons.slice(0, 5).map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="border-t hairline pt-2 text-[11px] text-bone-200/60">
        <div className="eyebrow mb-1">guardrails</div>
        <div>max brutality: {conservative.guardrails.maxRecommendedBrutality}</div>
        <div>latency ceiling: {conservative.guardrails.latencyCeilingMs}ms</div>
        <div>refusal tolerance: {conservative.guardrails.refusalTolerance}</div>
        {conservative.guardrails.preferredModes.length > 0 && (
          <div>preferred modes: {conservative.guardrails.preferredModes.slice(0, 4).join(', ')}</div>
        )}
        {conservative.guardrails.avoidedModes.length > 0 && (
          <div>avoid modes: {conservative.guardrails.avoidedModes.slice(0, 4).join(', ')}</div>
        )}
      </div>
    </div>
  );
}

// ─── Pre-Generation Stabilizer Panel ────────────────────────────────
// Shows the system pressure map + plain-English stabilization status +
// non-applied operator suggestions. ADVISORY ONLY — never blocks Generate.
function PreGenerationStabilizerPanel({ stab }: { stab: PreGenerationStabilizer }) {
  const status = stab.stabilizationStatus;
  const statusColor =
    status === 'stable' ? 'text-green-300' :
    status === 'caution' ? 'text-amber-200' :
    status === 'testing-only' ? 'text-amber-300' :
    status === 'unstable' ? 'text-orange-400' :
    'text-red-400';
  const pressureAxes: Array<[string, number]> = Object.entries(stab.pressureMap);
  return (
    <div className="border hairline p-4 space-y-3">
      <div className="eyebrow">pre-flight · pre-generation stabilizer</div>
      <div className="text-[10px] text-bone-200/50">{stab.advisoryNotice}</div>
      <div className="flex items-baseline gap-2">
        <span className="eyebrow">status</span>
        <span className={`text-base font-semibold tracking-widest ${statusColor}`}>
          {status.toUpperCase()}
        </span>
      </div>
      <Field label="SCORE" value={`${stab.stabilizationScore}/10`} />
      <Field label="TESTING" value={stab.shouldGenerateInTesting ? 'OK' : 'BLOCKED'} />
      <Field label="PRODUCTION" value={stab.shouldGenerateInProduction ? 'OK' : 'BLOCKED'} />
      <Field label="DECISION" value={stab.recommendedHumanDecision} />
      <div className="border-t hairline pt-2 space-y-1 text-xs">
        <div className="eyebrow mb-1">pressure map (0..10)</div>
        {pressureAxes.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-bone-200/70">{k.replace('Pressure', '')}</span>
            <span className={v >= 7 ? 'text-red-400' : v >= 4 ? 'text-amber-300' : 'text-bone-200/80'}>
              {v}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t hairline pt-2 text-xs text-bone-200/80">
        {stab.plainEnglishReason}
      </div>
      {stab.nonAppliedSuggestions.length > 0 && (
        <div className="border-t hairline pt-2 text-xs">
          <div className="eyebrow mb-1">operator suggestions (NOT applied)</div>
          <ul className="space-y-2 text-bone-200/70">
            {stab.nonAppliedSuggestions.map((s, i) => (
              <li key={i}>
                <div className="font-medium text-bone-200/90">{s.suggestion}</div>
                <div className="text-bone-200/60">{s.reason}</div>
                <div className="text-bone-200/50 text-[10px]">would affect: {s.wouldAffect}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
