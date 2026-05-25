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
            </div>
          )}

          {/* Show all read-only longitudinal panels even without a
              banner — first load / after refusal still has data. */}
          {!banner && (longitudinal || policyAudit || cultural || conflict || cogWeight || identity || governance) && (
            <div className="space-y-4 text-sm">
              {longitudinal && <LongitudinalQualityPanel view={longitudinal} />}
              {policyAudit && <PolicyAuditPanel view={policyAudit} />}
              {cultural && <CulturalIntelligencePanel view={cultural} />}
              {conflict && <CrossBrainConflictPanel view={conflict} />}
              {cogWeight && <CognitiveWeightEvolutionPanel view={cogWeight} />}
              {identity && <IdentityContinuityPanel view={identity} />}
              {governance && <ExecutiveGovernancePanel view={governance} />}
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
              >
                {f}
              </button>
            ))}
            {['CALM', 'FOCUS', 'SLEEP'].map((dim) => (
              <button
                key={dim}
                disabled
                className="px-3 py-1.5 border hairline text-[11px] tracking-widest font-medium opacity-25 cursor-not-allowed"
                title="reserved — not in V1"
              >
                {dim}
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

function PreviewSkeleton({ running }: { running: boolean }) {
  return (
    <div className="w-full max-w-[540px] aspect-[4/5] border hairline flex flex-col items-center justify-center text-xs text-bone-200/50 text-center px-8">
      <div className={running ? 'pulse' : ''}>composing…</div>
      <div className="mt-2 text-[10px] tracking-widest">HUMAN STATE → TRUTH → DIRECTION → IMAGE → TASTE</div>
    </div>
  );
}
