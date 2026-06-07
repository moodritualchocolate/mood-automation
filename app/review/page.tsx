'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { useRequireTenant } from '@app/components/auth/AuthProvider';

interface OneLiner { id: string; text: string }
interface Hook { id: string; text: string; audience: string; situation: string; visualDirection: string }
interface UgcScript { id: string; title: string; durationSec: number; scriptHebrew: string; shotList: string[]; callToActionHebrew: string }
interface ImageConcept { id: string; title: string; visualDescription: string; forUseWith: string; renderingNote: string }
interface Generation {
  generationId: string;
  status: 'generating' | 'ready' | 'failed';
  oneLinerCandidates: OneLiner[];
  hooks: Hook[];
  ugcScripts: UgcScript[];
  imageConcepts: ImageConcept[];
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<AppShell section="Review"><div /></AppShell>}>
      <ReviewInner />
    </Suspense>
  );
}

function ReviewInner() {
  const tenant = useRequireTenant();
  const router = useRouter();
  const params = useSearchParams();
  const generationId = params.get('generationId') ?? '';

  const [gen, setGen] = React.useState<Generation | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Selections
  const [chosenOneLiner, setChosenOneLiner] = React.useState<string>('');
  const [hookKeep, setHookKeep] = React.useState<Record<string, boolean>>({});
  const [ugcKeep, setUgcKeep] = React.useState<Record<string, boolean>>({});
  const [conceptKeep, setConceptKeep] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!tenant || !generationId) return;
    (async () => {
      try {
        const url = new URL('/api/mvp/generate', window.location.origin);
        url.searchParams.set('generationId', generationId);
        url.searchParams.set('organizationId', tenant.organizationId);
        url.searchParams.set('workspaceId', tenant.workspaceId);
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({})) as { error?: string };
          setLoadError(j.error ?? `Failed (${res.status})`); return;
        }
        const j = await res.json() as { generation: Generation };
        setGen(j.generation);
        // Default selections: pick first one-liner · keep all 10 hooks · keep all 5 UGC · keep all 10 concepts
        setChosenOneLiner(j.generation.oneLinerCandidates[0]?.id ?? '');
        setHookKeep(Object.fromEntries(j.generation.hooks.map((h) => [h.id, true])));
        setUgcKeep(Object.fromEntries(j.generation.ugcScripts.map((u) => [u.id, true])));
        setConceptKeep(Object.fromEntries(j.generation.imageConcepts.map((c) => [c.id, true])));
      } catch (e) {
        setLoadError((e as Error).message);
      }
    })();
  }, [tenant, generationId]);

  async function submit() {
    if (!tenant || !gen) return;
    setBusy(true); setSubmitError(null);
    try {
      const keptHookIds = Object.entries(hookKeep).filter(([, v]) => v).map(([k]) => k);
      const keptUgcScriptIds = Object.entries(ugcKeep).filter(([, v]) => v).map(([k]) => k);
      const keptImageConceptIds = Object.entries(conceptKeep).filter(([, v]) => v).map(([k]) => k);

      const res = await fetch('/api/mvp/selection', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          generationId: gen.generationId,
          chosenOneLinerId: chosenOneLiner,
          keptHookIds, keptUgcScriptIds, keptImageConceptIds,
          organizationId: tenant.organizationId,
          workspaceId: tenant.workspaceId,
          operatorReason: 'mvp review · finalize selection',
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        setSubmitError(j.error ?? `Failed (${res.status})`); return;
      }
      const j = await res.json() as { selectionId: string };
      router.replace(`/library?selectionId=${encodeURIComponent(j.selectionId)}`);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <AppShell section="Review">
        <Card><CardEyebrow>Could not load</CardEyebrow><CardHeadline>{loadError}</CardHeadline></Card>
      </AppShell>
    );
  }
  if (!gen) {
    return (
      <AppShell section="Review">
        <Card raised><CardEyebrow>Loading</CardEyebrow><CardHeadline>Fetching your generated kit…</CardHeadline></Card>
      </AppShell>
    );
  }

  const keptHookCount = Object.values(hookKeep).filter(Boolean).length;
  const keptUgcCount = Object.values(ugcKeep).filter(Boolean).length;
  const keptConceptCount = Object.values(conceptKeep).filter(Boolean).length;

  return (
    <AppShell section="Review">
      <PageHead
        eyebrow="Review · keep what you'll use"
        title="Your kit, ready for review."
        subtitle="Choose one positioning. Mark which hooks, scripts, and concepts you'll actually use. Skip the rest. Then save to your library."
        actions={
          <Button variant="primary" size="md" onClick={() => void submit()} disabled={busy || !chosenOneLiner}>
            {busy ? 'Saving…' : 'Save to my library →'}
          </Button>
        }
      />

      {submitError ? (
        <Card className="mb-6 border-[#FF4D2D]/40">
          <CardEyebrow>Save failed</CardEyebrow>
          <CardHeadline>{submitError}</CardHeadline>
        </Card>
      ) : null}

      {/* Section 1 · positioning */}
      <section className="mb-10">
        <div className="eyebrow mb-3 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">01 · Pick your one-liner</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gen.oneLinerCandidates.map((o) => (
            <button
              key={o.id}
              onClick={() => setChosenOneLiner(o.id)}
              className={[
                'text-left rounded-xl border p-5 transition-colors duration-150',
                chosenOneLiner === o.id
                  ? 'bg-[#111111] border-[#F7F5F2]'
                  : 'bg-[#0A0A0A] border-[rgba(247,245,242,0.18)] hover:border-[rgba(247,245,242,0.40)]',
              ].join(' ')}
            >
              <div className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)] mb-2">
                Option {gen.oneLinerCandidates.indexOf(o) + 1}
              </div>
              <div dir="rtl" className="text-[22px] font-['EditorialNew','Times_New_Roman',serif] leading-tight text-[#F7F5F2]">
                {o.text}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Section 2 · hooks */}
      <section className="mb-10">
        <div className="eyebrow mb-3 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">
          02 · Pick the hooks you'll use ({keptHookCount} of {gen.hooks.length} kept)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gen.hooks.map((h, idx) => {
            const kept = !!hookKeep[h.id];
            return (
              <div
                key={h.id}
                className={[
                  'rounded-xl border p-4 transition-colors duration-150',
                  kept
                    ? 'bg-[#111111] border-[rgba(247,245,242,0.30)]'
                    : 'bg-[#0A0A0A] border-[rgba(247,245,242,0.10)] opacity-60',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">
                    Hook {String(idx + 1).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setHookKeep((s) => ({ ...s, [h.id]: !kept }))}
                    className={[
                      'rounded-full px-3 py-1 text-[11px] tracking-tight border transition-colors',
                      kept ? 'bg-[#F7F5F2] text-[#0A0A0A] border-[#F7F5F2]'
                           : 'bg-transparent text-[rgba(247,245,242,0.65)] border-[rgba(247,245,242,0.18)] hover:text-[#F7F5F2]',
                    ].join(' ')}
                  >
                    {kept ? 'Keeping' : 'Skipped'}
                  </button>
                </div>
                <div dir="rtl" className="text-[18px] font-['EditorialNew','Times_New_Roman',serif] mb-3 text-[#F7F5F2]">
                  {h.text}
                </div>
                <div className="space-y-1 text-[12px] text-[rgba(247,245,242,0.55)]">
                  <div><span className="text-[rgba(247,245,242,0.40)] mr-2">audience</span>{h.audience}</div>
                  <div><span className="text-[rgba(247,245,242,0.40)] mr-2">situation</span>{h.situation}</div>
                  <div><span className="text-[rgba(247,245,242,0.40)] mr-2">visual</span>{h.visualDirection}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3 · UGC */}
      <section className="mb-10">
        <div className="eyebrow mb-3 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">
          03 · Pick the UGC scripts you'll use ({keptUgcCount} of {gen.ugcScripts.length} kept)
        </div>
        <div className="space-y-3">
          {gen.ugcScripts.map((u) => {
            const kept = !!ugcKeep[u.id];
            return (
              <div
                key={u.id}
                className={[
                  'rounded-xl border p-4 transition-colors duration-150',
                  kept
                    ? 'bg-[#111111] border-[rgba(247,245,242,0.30)]'
                    : 'bg-[#0A0A0A] border-[rgba(247,245,242,0.10)] opacity-60',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">
                    {u.durationSec}s · UGC
                  </span>
                  <button
                    onClick={() => setUgcKeep((s) => ({ ...s, [u.id]: !kept }))}
                    className={[
                      'rounded-full px-3 py-1 text-[11px] tracking-tight border transition-colors',
                      kept ? 'bg-[#F7F5F2] text-[#0A0A0A] border-[#F7F5F2]'
                           : 'bg-transparent text-[rgba(247,245,242,0.65)] border-[rgba(247,245,242,0.18)] hover:text-[#F7F5F2]',
                    ].join(' ')}
                  >
                    {kept ? 'Keeping' : 'Skipped'}
                  </button>
                </div>
                <div className="text-[16px] mb-2 text-[#F7F5F2]">{u.title}</div>
                <pre dir="rtl" className="p-3 bg-[#050505] border border-[rgba(247,245,242,0.08)] rounded-lg text-[12px] whitespace-pre-wrap leading-relaxed font-['Heebo','Arial_Hebrew',sans-serif]">
                  {u.scriptHebrew}
                </pre>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 4 · image concepts */}
      <section className="mb-10">
        <div className="eyebrow mb-3 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">
          04 · Pick the image concepts you'll shoot ({keptConceptCount} of {gen.imageConcepts.length} kept)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gen.imageConcepts.map((c) => {
            const kept = !!conceptKeep[c.id];
            return (
              <div
                key={c.id}
                className={[
                  'rounded-xl border p-4 transition-colors duration-150',
                  kept
                    ? 'bg-[#111111] border-[rgba(247,245,242,0.30)]'
                    : 'bg-[#0A0A0A] border-[rgba(247,245,242,0.10)] opacity-60',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">
                    Concept
                  </span>
                  <button
                    onClick={() => setConceptKeep((s) => ({ ...s, [c.id]: !kept }))}
                    className={[
                      'rounded-full px-3 py-1 text-[11px] tracking-tight border transition-colors',
                      kept ? 'bg-[#F7F5F2] text-[#0A0A0A] border-[#F7F5F2]'
                           : 'bg-transparent text-[rgba(247,245,242,0.65)] border-[rgba(247,245,242,0.18)] hover:text-[#F7F5F2]',
                    ].join(' ')}
                  >
                    {kept ? 'Keeping' : 'Skipped'}
                  </button>
                </div>
                <div className="text-[16px] mb-2 text-[#F7F5F2]">{c.title}</div>
                <div className="text-[12px] text-[rgba(247,245,242,0.65)] leading-relaxed">{c.visualDescription}</div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-end mt-6">
        <Button variant="primary" size="lg" onClick={() => void submit()} disabled={busy || !chosenOneLiner}>
          {busy ? 'Saving…' : `Save to my library → (${1 + keptHookCount + keptUgcCount + keptConceptCount} items)`}
        </Button>
      </div>
    </AppShell>
  );
}
