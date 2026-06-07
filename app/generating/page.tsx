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

const PROGRESS_MESSAGES = [
  'Mapping your audience…',
  'Finding the emotional center of your brand…',
  'Writing two positioning candidates…',
  'Generating 10 ad hooks…',
  'Ranking them by what will convert…',
  'Drafting 5 UGC scripts…',
  'Composing 10 image concepts…',
  'Assembling your kit…',
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
  const [progressIdx, setProgressIdx] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  // Rotate progress messages while polling
  React.useEffect(() => {
    const t = setInterval(() => {
      setProgressIdx((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 1100);
    return () => clearInterval(t);
  }, []);

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
        <div className="flex items-center gap-4">
          <div className="h-3 w-3 rounded-full bg-[#C9A24B] pulse" />
          <div className="text-[15px] text-[rgba(247,245,242,0.85)]">
            {PROGRESS_MESSAGES[progressIdx]}
          </div>
        </div>
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
