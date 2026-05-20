/**
 * Studio — where the generation happens and the banner is shown.
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
import { useSearchParams } from 'next/navigation';
import type { Banner, CampaignMode, Formula, PipelineEvent } from '@/core/types';

type StreamPayload =
  | { type: 'event'; event: PipelineEvent }
  | { type: 'banner'; banner: Banner; svg: string }
  | { type: 'error'; error: string };

export default function StudioPage() {
  return (
    <Suspense fallback={<PreviewSkeleton running={true} />}>
      <StudioInner />
    </Suspense>
  );
}

function StudioInner() {
  const sp = useSearchParams();
  const formula = (sp.get('formula') as Formula) || 'ENERGY';
  const mode = (sp.get('mode') as CampaignMode | null) || null;
  const brutalityLabel = (sp.get('brutality') as 'lenient' | 'default' | 'brutal' | null) || 'default';
  const brutality = brutalityLabel === 'lenient' ? 0.5 : brutalityLabel === 'brutal' ? 0.9 : 0.65;

  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void run();
    async function run() {
      setRunning(true);
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ formula, campaignMode: mode, brutality }),
        });
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
        setError((e as Error).message);
      } finally {
        setRunning(false);
      }
    }
  }, [formula, mode]);

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

  return (
    <main className="min-h-screen px-6 md:px-12 py-8 grid grid-cols-1 md:grid-cols-[1fr_360px] gap-10">
      <section className="flex items-center justify-center">
        {svgDataUrl ? (
          <div className="w-full max-w-[540px]">
            <img src={svgDataUrl} alt="banner" className="w-full h-auto block shadow-2xl" />
            <div className="mt-6 flex gap-3">
              <button
                onClick={downloadPng}
                className="px-5 py-2 bg-bone-50 text-ink-900 text-xs tracking-widest font-semibold"
              >
                EXPORT PNG
              </button>
              <a
                href="/"
                className="px-5 py-2 border hairline text-xs tracking-widest text-bone-50 hover:bg-white/5"
              >
                NEW BANNER
              </a>
            </div>
          </div>
        ) : (
          <PreviewSkeleton running={running} exhausted={!running && !!error && error.toLowerCase().includes('exhausted')} />
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
              <div className="eyebrow">taste layer</div>
              <Field
                label="FINAL VERDICT"
                value={`${banner.finalVerdict.verdict} @ brutality ${banner.finalVerdict.brutality.toFixed(2)}`}
              />
              <Field label="TASTE CRITIC" value={banner.taste.verdict} />
              <Field
                label="REFERENCE"
                value={`${banner.referenceMatch.reference.id} · closeness ${banner.referenceMatch.closeness.toFixed(2)}`}
                multiline
              />
              <Field
                label="REFERENCE FEELING"
                value={`"${banner.referenceMatch.reference.campaign_feeling}"`}
                multiline
              />
              <Field
                label="PSYCHOLOGY"
                value={`flow ${banner.psychology.eyeFlowIntegrity.toFixed(1)} · cta-resolution ${banner.psychology.ctaResolution.toFixed(1)} · interruption ${banner.psychology.focalInterruption.toFixed(1)}`}
                multiline
              />
              {banner.productPresence && (
                <Field
                  label="PRODUCT PRESENCE"
                  value={`${banner.productPresence.verdict} (${Object.values(banner.productPresence.scores).reduce((a, b) => a + b, 0) / 7 | 0}/10)`}
                />
              )}
              {banner.referenceMatch.divergences.length > 0 && (
                <div className="text-xs text-bone-200/55 leading-snug">
                  <div className="eyebrow mb-1">divergences from anchor</div>
                  <ul className="space-y-0.5">
                    {banner.referenceMatch.divergences.map((d, i) => (
                      <li key={i}>· {d}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Field label="ATTEMPTS" value={String(banner.attempts)} />
            </div>
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

        {error && (
          <div className="text-xs text-signal-warning border hairline p-3">
            {error}
          </div>
        )}
      </aside>
    </main>
  );
}

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={`mt-0.5 ${multiline ? 'leading-snug' : 'truncate'}`}>{value}</div>
    </div>
  );
}

function PreviewSkeleton({ running, exhausted }: { running: boolean; exhausted?: boolean }) {
  return (
    <div className="w-full max-w-[540px] aspect-[4/5] border hairline flex flex-col items-center justify-center text-xs text-bone-200/50 text-center px-8">
      {exhausted ? (
        <>
          <div className="text-signal-warning tracking-widest mb-3">NOT GOOD ENOUGH</div>
          <div className="leading-relaxed max-w-xs">
            The critic refused every attempt at this brutality. Either lower the brutality, change the campaign mode, or wait — the system is meant to refuse.
          </div>
        </>
      ) : (
        <>
          <div className={running ? 'pulse' : ''}>composing…</div>
          <div className="mt-2 text-[10px] tracking-widest">HUMAN STATE → TRUTH → DIRECTION → IMAGE → TASTE</div>
        </>
      )}
    </div>
  );
}
