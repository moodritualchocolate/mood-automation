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
      }
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runCounter]);

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

function PreviewSkeleton({ running }: { running: boolean }) {
  return (
    <div className="w-full max-w-[540px] aspect-[4/5] border hairline flex flex-col items-center justify-center text-xs text-bone-200/50 text-center px-8">
      <div className={running ? 'pulse' : ''}>composing…</div>
      <div className="mt-2 text-[10px] tracking-widest">HUMAN STATE → TRUTH → DIRECTION → IMAGE → TASTE</div>
    </div>
  );
}
