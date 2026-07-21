'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { useRequireTenant } from '@app/components/auth/AuthProvider';

interface GenerationPoll {
  generation: {
    generationId: string;
    status: 'generating' | 'ready' | 'failed';
    error?: string;
  };
}

// Staged checklist (roadmap #14) — stages check off progressively so
// the wait reads as work, not silence.
const STAGES = [
  { label: 'Detecting your industry', dwellMs: 1200 },
  { label: 'Loading vertical intelligence — fears, desires, hooks that convert', dwellMs: 1800 },
  { label: 'Matching your audience archetype', dwellMs: 1600 },
  { label: 'Writing positioning candidates', dwellMs: 2000 },
  { label: 'Composing 10 hooks across proven families', dwellMs: 2400 },
  { label: 'Scoring every hook · dropping the weak ones', dwellMs: 2000 },
  { label: 'Drafting UGC scripts + image concepts', dwellMs: 2400 },
  { label: 'Validating language purity + brand safety', dwellMs: 1800 },
];

export default function GeneratingPage() {
  return (
    <Suspense fallback={<AppShell section="Generating"><div /></AppShell>}>
      <GeneratingInner />
    </Suspense>
  );
}

function GeneratingInner() {
  const tenant = useRequireTenant();
  const router = useRouter();
  const params = useSearchParams();
  const generationId = params.get('generationId') ?? '';
  const [stageIdx, setStageIdx] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  // Advance through stages on their dwell times; hold on the last one
  // until the poll redirects (never loops back — reads as real work).
  React.useEffect(() => {
    if (stageIdx >= STAGES.length - 1) return;
    const t = setTimeout(() => setStageIdx((i) => i + 1), STAGES[stageIdx].dwellMs);
    return () => clearTimeout(t);
  }, [stageIdx]);

  // Poll the generation
  React.useEffect(() => {
    if (!tenant || !generationId) return;
    let cancelled = false;

    async function poll() {
      try {
        const url = new URL('/api/mvp/generate', window.location.origin);
        url.searchParams.set('generationId', generationId);
        if (tenant) {
          url.searchParams.set('organizationId', tenant.organizationId);
          url.searchParams.set('workspaceId', tenant.workspaceId);
        }
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({})) as { error?: string };
          setError(j.error ?? `Status check failed (${res.status})`);
          return;
        }
        const j = await res.json() as GenerationPoll;
        if (cancelled) return;
        if (j.generation.status === 'ready') {
          router.replace(`/review?generationId=${encodeURIComponent(generationId)}`);
        } else if (j.generation.status === 'failed') {
          setError(j.generation.error ?? 'Generation failed');
        } else {
          setTimeout(() => { if (!cancelled) void poll(); }, 1500);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }

    void poll();
    return () => { cancelled = true; };
  }, [tenant, generationId, router]);

  if (!generationId) {
    return (
      <AppShell section="Generating">
        <Card>
          <CardEyebrow>Missing generation id</CardEyebrow>
          <CardHeadline>Open this page only from the onboarding flow.</CardHeadline>
          <div className="mt-4">
            <Button variant="primary" size="md" onClick={() => router.push('/onboard')}>← Back to onboarding</Button>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell section="Generating">
      <PageHead
        eyebrow="The AI is working"
        title="Your kit is being assembled."
        subtitle="About 90 seconds. This page will redirect when ready."
      />

      <Card raised>
        {/* Progress bar */}
        <div className="mb-5 h-1 overflow-hidden rounded-full bg-[rgba(247,245,242,0.08)]">
          <div
            className="h-full rounded-full bg-[#C9A24B] transition-all duration-700"
            style={{ width: `${Math.round(((stageIdx + 1) / STAGES.length) * 92)}%` }}
          />
        </div>
        {/* Staged checklist */}
        <ol className="space-y-2.5">
          {STAGES.map((s, i) => {
            const done = i < stageIdx;
            const active = i === stageIdx;
            return (
              <li key={s.label} className="flex items-center gap-3">
                <span className={[
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]',
                  done ? 'bg-[#C9A24B] text-[#0A0A0A]'
                    : active ? 'border border-[#C9A24B] text-[#C9A24B]'
                    : 'border border-[rgba(247,245,242,0.15)]',
                ].join(' ')}>
                  {done ? '✓' : active ? '•' : ''}
                </span>
                <span className={[
                  'text-[13.5px] transition-colors',
                  done ? 'text-[rgba(247,245,242,0.45)] line-through decoration-[rgba(247,245,242,0.2)]'
                    : active ? 'text-[#F7F5F2]'
                    : 'text-[rgba(247,245,242,0.35)]',
                ].join(' ')}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
        {error ? (
          <div className="mt-6 text-[12px] text-[#FF4D2D]">
            {error}
            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={() => router.push('/onboard')}>
                ← Try again
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="mt-6 text-[12px] text-[rgba(247,245,242,0.45)]">
        Operator-supervised · no publishing · human remains final authority.
      </div>
    </AppShell>
  );
}
