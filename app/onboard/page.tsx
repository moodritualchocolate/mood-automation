'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Field, Input, Textarea, Select } from '@app/components/ui/Field';
import { useRequireTenant } from '@app/components/auth/AuthProvider';

interface AnswerState {
  artifact: string;
  audience: string;
  emotional: string;
  locale: string;
}

const LOCALES = [
  { value: 'Israel · Hebrew', label: 'Israel · Hebrew' },
  { value: 'Israel · English', label: 'Israel · English' },
  { value: 'Global · English', label: 'Global · English' },
  { value: 'United States · English', label: 'United States · English' },
  { value: 'United Kingdom · English', label: 'United Kingdom · English' },
];

const STEPS = [
  { key: 'artifact',  label: '01 · What do you sell?' },
  { key: 'audience',  label: '02 · Who buys it?' },
  { key: 'emotional', label: '03 · Deeper feeling?' },
  { key: 'locale',    label: '04 · Where?' },
] as const;
type StepKey = typeof STEPS[number]['key'];

export default function OnboardPage() {
  const tenant = useRequireTenant();
  const router = useRouter();
  const [step, setStep] = React.useState<StepKey>('artifact');
  const [a, setA] = React.useState<AnswerState>({
    artifact: '',
    audience: '',
    emotional: '',
    locale: 'Israel · Hebrew',
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const isLast = stepIdx === STEPS.length - 1;
  const canAdvance =
    (step === 'artifact'  && a.artifact.trim().length  >= 2) ||
    (step === 'audience'  && a.audience.trim().length  >= 2) ||
    (step === 'emotional' && a.emotional.trim().length >= 2) ||
    (step === 'locale'    && a.locale.length > 0);

  function next() {
    if (!canAdvance) return;
    if (!isLast) setStep(STEPS[stepIdx + 1].key);
    else void submit();
  }

  function prev() {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1].key);
  }

  async function submit() {
    if (!tenant) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/mvp/onboard', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          artifact: a.artifact, audience: a.audience,
          emotional: a.emotional, locale: a.locale,
          organizationId: tenant.organizationId,
          workspaceId: tenant.workspaceId,
          operatorReason: 'mvp onboarding · first kit',
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        setError(j.error ?? `Failed (${res.status})`); return;
      }
      const j = await res.json() as { brandInputId: string };
      // Kick off generation immediately
      const genRes = await fetch('/api/mvp/generate', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          brandInputId: j.brandInputId,
          organizationId: tenant.organizationId,
          workspaceId: tenant.workspaceId,
          operatorReason: 'mvp generation · post onboarding',
        }),
      });
      if (!genRes.ok) {
        const gj = await genRes.json().catch(() => ({})) as { error?: string };
        setError(gj.error ?? `Generation start failed (${genRes.status})`);
        return;
      }
      const gj = await genRes.json() as { generationId: string };
      router.replace(`/generating?generationId=${encodeURIComponent(gj.generationId)}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell section="Onboarding">
      <PageHead
        eyebrow={`Step ${stepIdx + 1} of ${STEPS.length}`}
        title={STEPS[stepIdx].label}
        subtitle="Four short questions. The system needs only this. Everything else we figure out for you."
      />

      <Card raised>
        {step === 'artifact' ? (
          <Field label="What do you sell?" required helper="One short sentence">
            <Textarea
              value={a.artifact}
              onChange={(e) => setA((s) => ({ ...s, artifact: e.target.value }))}
              rows={3}
              placeholder="e.g., Premium dark chocolate · Running shoes for adults returning to running · Productivity software"
              autoFocus
            />
          </Field>
        ) : null}

        {step === 'audience' ? (
          <Field label="Who buys it?" required helper="One or two sentences — age, life stage, where they work, what they care about">
            <Textarea
              value={a.audience}
              onChange={(e) => setA((s) => ({ ...s, audience: e.target.value }))}
              rows={3}
              placeholder="e.g., Israeli adults 32-50, urban, parents, professional, disposable income, allergic to wellness marketing"
              autoFocus
            />
          </Field>
        ) : null}

        {step === 'emotional' ? (
          <Field label="Underneath the purchase — what do they really want?" required helper="The feeling, not the feature">
            <Textarea
              value={a.emotional}
              onChange={(e) => setA((s) => ({ ...s, emotional: e.target.value }))}
              rows={3}
              placeholder="e.g., To be present in the moments they would otherwise miss · To feel like a runner again · To reclaim the hour the day stole"
              autoFocus
            />
          </Field>
        ) : null}

        {step === 'locale' ? (
          <Field label="Where do your customers live?" required>
            <Select
              value={a.locale}
              onChange={(e) => setA((s) => ({ ...s, locale: e.target.value }))}
            >
              {LOCALES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </Select>
          </Field>
        ) : null}

        {error ? <div className="mt-4 text-[12px] text-[#FF4D2D]">{error}</div> : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" size="md" onClick={prev} disabled={busy || stepIdx === 0}>
            ← Back
          </Button>
          <Button variant="primary" size="md" onClick={next} disabled={busy || !canAdvance}>
            {busy ? 'Saving…' : isLast ? 'Generate my kit →' : 'Next →'}
          </Button>
        </div>
      </Card>

      <div className="mt-6 text-[12px] text-[rgba(247,245,242,0.45)]">
        About 2 minutes of questions. About 90 seconds of AI work. Then your kit.
      </div>
    </AppShell>
  );
}
