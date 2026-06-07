'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Tag } from '@app/components/ui/Tag';
import { Empty } from '@app/components/ui/Empty';
import { useRequireTenant } from '@app/components/auth/AuthProvider';

interface Hook { id: string; text: string; audience: string; situation: string; visualDirection: string }
interface UgcScript { id: string; title: string; durationSec: number; scriptHebrew: string; shotList: string[]; callToActionHebrew: string }
interface ImageConcept { id: string; title: string; visualDescription: string; forUseWith: string; renderingNote: string }
interface LibraryResponse {
  empty?: boolean;
  selection?: { selectionId: string; generationId: string; finalizedAt: number };
  library?: {
    chosenOneLiner: { id: string; text: string } | null;
    hooks: Hook[];
    ugcScripts: UgcScript[];
    imageConcepts: ImageConcept[];
  };
  generatedAt?: number;
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<AppShell section="Library"><div /></AppShell>}>
      <LibraryInner />
    </Suspense>
  );
}

function LibraryInner() {
  const tenant = useRequireTenant();
  const params = useSearchParams();
  const selectionId = params.get('selectionId') ?? '';
  const [data, setData] = React.useState<LibraryResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!tenant) return;
    (async () => {
      try {
        const url = new URL('/api/mvp/library', window.location.origin);
        if (selectionId) url.searchParams.set('selectionId', selectionId);
        url.searchParams.set('organizationId', tenant.organizationId);
        url.searchParams.set('workspaceId', tenant.workspaceId);
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({})) as { error?: string };
          setError(j.error ?? `Failed (${res.status})`); return;
        }
        const j = await res.json() as LibraryResponse;
        setData(j);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [tenant, selectionId]);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {/* clipboard denied — silent */});
  }

  if (error) {
    return (
      <AppShell section="Library">
        <Card><CardEyebrow>Could not load</CardEyebrow><CardHeadline>{error}</CardHeadline></Card>
      </AppShell>
    );
  }
  if (!data) {
    return (
      <AppShell section="Library">
        <Card raised><CardEyebrow>Loading</CardEyebrow><CardHeadline>Loading your creative library…</CardHeadline></Card>
      </AppShell>
    );
  }
  if (data.empty || !data.library) {
    return (
      <AppShell section="Library">
        <PageHead eyebrow="Your library" title="Empty — generate your first kit." />
        <Empty
          eyebrow="No selections yet"
          headline="Run your first generation."
          description="Answer 4 questions. Get a kit in about 90 seconds. Save what you'll use."
          action={<Link href="/onboard"><Button variant="primary" size="lg">Start →</Button></Link>}
        />
      </AppShell>
    );
  }

  const { chosenOneLiner, hooks, ugcScripts, imageConcepts } = data.library;

  return (
    <AppShell section="Library">
      <PageHead
        eyebrow={`Saved ${data.selection ? new Date(data.selection.finalizedAt).toLocaleDateString() : ''}`}
        title="Your creative library"
        subtitle="Your selected one-liner + the hooks, scripts, and concepts you marked to use. Copy what you need."
        actions={<Link href="/onboard"><Button variant="secondary" size="md">+ New kit</Button></Link>}
      />

      {/* The one-liner */}
      {chosenOneLiner ? (
        <Card raised className="mb-10">
          <CardEyebrow>Your brand · one sentence</CardEyebrow>
          <div dir="rtl" className="mt-3 text-[32px] md:text-[40px] font-['EditorialNew','Times_New_Roman',serif] leading-[1.1] text-[#F7F5F2]">
            {chosenOneLiner.text}
          </div>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={() => copy(chosenOneLiner.text, 'one-liner')}>
              {copied === 'one-liner' ? 'Copied ✓' : 'Copy one-liner'}
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Hooks */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Top ads · ready to launch</div>
            <h2 className="font-['EditorialNew','Times_New_Roman',serif] text-[28px] tracking-tight mt-1">{hooks.length} hook{hooks.length === 1 ? '' : 's'}</h2>
          </div>
        </div>
        {hooks.length === 0 ? (
          <Empty eyebrow="None kept" headline="No hooks in this library." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hooks.map((h, idx) => (
              <Card key={h.id}>
                <div className="flex items-center justify-between mb-2">
                  <Tag>Ad {String(idx + 1).padStart(2, '0')}</Tag>
                  <button
                    onClick={() => copy(h.text, `hook-${h.id}`)}
                    className="text-[11px] text-[rgba(247,245,242,0.65)] hover:text-[#F7F5F2]"
                  >
                    {copied === `hook-${h.id}` ? 'Copied ✓' : 'Copy hook'}
                  </button>
                </div>
                <div dir="rtl" className="text-[20px] font-['EditorialNew','Times_New_Roman',serif] leading-snug text-[#F7F5F2] mb-3">
                  {h.text}
                </div>
                <div className="space-y-1.5 text-[12px] text-[rgba(247,245,242,0.65)]">
                  <Row label="audience" value={h.audience} />
                  <Row label="situation" value={h.situation} />
                  <Row label="visual" value={h.visualDirection} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* UGC scripts */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">UGC scripts · hand to a creator</div>
            <h2 className="font-['EditorialNew','Times_New_Roman',serif] text-[28px] tracking-tight mt-1">{ugcScripts.length} script{ugcScripts.length === 1 ? '' : 's'}</h2>
          </div>
        </div>
        {ugcScripts.length === 0 ? (
          <Empty eyebrow="None kept" headline="No UGC scripts in this library." />
        ) : (
          <div className="space-y-3">
            {ugcScripts.map((u) => (
              <Card key={u.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">
                    {u.durationSec}s · {u.title}
                  </span>
                  <button
                    onClick={() => copy(u.scriptHebrew, `ugc-${u.id}`)}
                    className="text-[11px] text-[rgba(247,245,242,0.65)] hover:text-[#F7F5F2]"
                  >
                    {copied === `ugc-${u.id}` ? 'Copied ✓' : 'Copy script'}
                  </button>
                </div>
                <pre dir="rtl" className="p-3 bg-[#050505] border border-[rgba(247,245,242,0.08)] rounded-lg text-[12px] whitespace-pre-wrap leading-relaxed font-['Heebo','Arial_Hebrew',sans-serif] text-[rgba(247,245,242,0.85)]">{u.scriptHebrew}</pre>
                <div className="mt-3 text-[12px] text-[rgba(247,245,242,0.55)]">
                  Shot list: {u.shotList.join(' → ')}
                </div>
                <div className="mt-1 text-[12px]" dir="rtl">
                  <span className="text-[rgba(247,245,242,0.40)] mr-2">CTA</span>{u.callToActionHebrew}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Image concepts */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Image concepts · to shoot or generate</div>
            <h2 className="font-['EditorialNew','Times_New_Roman',serif] text-[28px] tracking-tight mt-1">{imageConcepts.length} concept{imageConcepts.length === 1 ? '' : 's'}</h2>
          </div>
        </div>
        {imageConcepts.length === 0 ? (
          <Empty eyebrow="None kept" headline="No image concepts in this library." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {imageConcepts.map((c) => (
              <Card key={c.id}>
                <div className="flex items-center justify-between mb-2">
                  <Tag>Concept</Tag>
                  <button
                    onClick={() => copy(`${c.visualDescription}\n\n${c.renderingNote}`, `img-${c.id}`)}
                    className="text-[11px] text-[rgba(247,245,242,0.65)] hover:text-[#F7F5F2]"
                  >
                    {copied === `img-${c.id}` ? 'Copied ✓' : 'Copy concept'}
                  </button>
                </div>
                <div className="text-[16px] text-[#F7F5F2] mb-2">{c.title}</div>
                <div className="text-[13px] text-[rgba(247,245,242,0.75)] leading-relaxed mb-3">{c.visualDescription}</div>
                {c.forUseWith ? (
                  <div className="text-[11px] text-[rgba(247,245,242,0.55)]" dir="rtl">
                    Pairs with: {c.forUseWith}
                  </div>
                ) : null}
                <details className="mt-3">
                  <summary className="cursor-pointer text-[11px] text-[rgba(247,245,242,0.45)] hover:text-[#F7F5F2]">Rendering note (for AI image tools)</summary>
                  <div className="mt-2 text-[11px] text-[rgba(247,245,242,0.55)] leading-relaxed">{c.renderingNote}</div>
                </details>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="text-[12px] text-[rgba(247,245,242,0.45)] mt-10">
        Operator-supervised · 90-day access · no publishing · human remains final authority.
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.40)] w-16 shrink-0 mt-0.5">{label}</span>
      <span className="text-[rgba(247,245,242,0.85)]">{value}</span>
    </div>
  );
}
