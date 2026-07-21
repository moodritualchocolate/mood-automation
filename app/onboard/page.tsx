'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Field, Input, Textarea, Select } from '@app/components/ui/Field';
import { useRequireTenant } from '@app/components/auth/AuthProvider';
import { detectVertical, ALL_VERTICAL_IDS, VERTICAL_KNOWLEDGE_BASE } from '@lib/verticalIntelligence';

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
  { key: 'confirm',   label: '05 · Your industry' },
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
  const [verticalChoice, setVerticalChoice] = React.useState<string>('');
  const [waitlistEmail, setWaitlistEmail] = React.useState('');
  const [waitlistDone, setWaitlistDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const isConfirm = step === 'confirm';

  // Deterministic detection · pure client-side, no network call.
  const detection = React.useMemo(
    () => detectVertical({
      artifact: a.artifact, audience: a.audience,
      emotional: a.emotional, locale: a.locale,
    }),
    [a.artifact, a.audience, a.emotional, a.locale],
  );

  // Entering the confirm step seeds the choice with the detection —
  // unless confidence is too low, in which case the operator decides.
  React.useEffect(() => {
    if (step !== 'confirm') return;
    setVerticalChoice(detection.confidence >= 0.4 ? detection.verticalId : '');
  }, [step, detection.verticalId, detection.confidence]);

  const canAdvance =
    (step === 'artifact'  && a.artifact.trim().length  >= 2) ||
    (step === 'audience'  && a.audience.trim().length  >= 2) ||
    (step === 'emotional' && a.emotional.trim().length >= 2) ||
    (step === 'locale'    && a.locale.length > 0) ||
    (step === 'confirm'   && verticalChoice.length > 0 && verticalChoice !== 'other');

  function next() {
    if (isConfirm) { void submit(); return; }
    if (!canAdvance) return;
    setStep(STEPS[stepIdx + 1].key);
  }

  function prev() {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1].key);
  }

  async function joinWaitlist() {
    if (!tenant) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/mvp/waitlist', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: waitlistEmail,
          businessDescription: a.artifact,
          organizationId: tenant.organizationId,
          workspaceId: tenant.workspaceId,
          operatorReason: 'vertical not supported · waitlist',
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        setError(j.error ?? `Failed (${res.status})`); return;
      }
      setWaitlistDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!tenant || !canAdvance) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/mvp/onboard', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          artifact: a.artifact, audience: a.audience,
          emotional: a.emotional, locale: a.locale,
          verticalOverride: verticalChoice,
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

  const detectedName = VERTICAL_KNOWLEDGE_BASE[detection.verticalId]?.displayName ?? detection.verticalId;

  return (
    <AppShell section="Onboarding">
      <PageHead
        eyebrow={`Step ${stepIdx + 1} of ${STEPS.length}`}
        title={STEPS[stepIdx].label}
        subtitle="Four short questions plus one confirmation. Everything else we figure out for you."
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

        {step === 'confirm' ? (
          waitlistDone ? (
            <div className="space-y-3">
              <div className="text-[15px] text-[#F7F5F2]">
                You&apos;re on the list. Your industry ships within 90 days — we&apos;ll email you the day it&apos;s live.
              </div>
              <div className="text-[12px] text-[rgba(247,245,242,0.55)]">
                We refuse to generate generic content. When your vertical exists, the output will feel written from inside your industry.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {detection.confidence >= 0.4 ? (
                <div className="text-[13px] text-[rgba(247,245,242,0.70)]">
                  We detected your industry as{' '}
                  <span className="text-[#F7F5F2] font-medium">{detectedName}</span>
                  {' '}(confidence {Math.round(detection.confidence * 100)}%
                  {detection.evidence.length > 0 ? ` · matched: ${detection.evidence.slice(0, 3).join(', ')}` : ''}).
                  Confirm or correct:
                </div>
              ) : (
                <div className="text-[13px] text-[rgba(247,245,242,0.70)]">
                  We couldn&apos;t confidently detect your industry. Pick the closest one — or choose Other and we&apos;ll build your vertical.
                </div>
              )}

              <Field label="Your industry" required>
                <Select
                  value={verticalChoice}
                  onChange={(e) => setVerticalChoice(e.target.value)}
                >
                  <option value="">—</option>
                  {ALL_VERTICAL_IDS.map((id) => (
                    <option key={id} value={id}>
                      {VERTICAL_KNOWLEDGE_BASE[id].displayName}
                    </option>
                  ))}
                  <option value="other">Other / not listed</option>
                </Select>
              </Field>

              {verticalChoice === 'other' ? (
                <div className="space-y-3 border-t border-[rgba(247,245,242,0.08)] pt-4">
                  <div className="text-[13px] leading-relaxed text-[rgba(247,245,242,0.70)]">
                    We only generate for industries we know deeply — that&apos;s the whole point.
                    Leave your email and we&apos;ll build your vertical within 90 days.
                  </div>
                  <Field label="Email" required>
                    <Input
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@company.com"
                      dir="ltr"
                    />
                  </Field>
                  <Button
                    variant="primary" size="md"
                    onClick={() => void joinWaitlist()}
                    disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(waitlistEmail)}
                  >
                    {busy ? 'Saving…' : 'Join the waitlist →'}
                  </Button>
                </div>
              ) : null}
            </div>
          )
        ) : null}

        {error ? <div className="mt-4 text-[12px] text-[#FF4D2D]">{error}</div> : null}

        {!waitlistDone ? (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" size="md" onClick={prev} disabled={busy || stepIdx === 0}>
              ← Back
            </Button>
            {verticalChoice !== 'other' || !isConfirm ? (
              <Button variant="primary" size="md" onClick={next} disabled={busy || !canAdvance}>
                {busy ? 'Saving…' : isConfirm ? 'Generate my kit →' : 'Next →'}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="mt-6 text-[12px] text-[rgba(247,245,242,0.45)]">
        About 2 minutes of questions. About 90 seconds of AI work. Then your kit.
      </div>
    </AppShell>
  );
}
