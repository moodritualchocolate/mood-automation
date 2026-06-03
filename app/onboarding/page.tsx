/**
 * /onboarding · brand onboarding wizard (mobile-first).
 *
 * Eight operator-supervised steps. The wizard never auto-advances,
 * never auto-creates downstream entities. Every step submission
 * requires operatorReason at the route layer.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState, Suspense} from 'react';
import { useSearchParams } from 'next/navigation';
import type {
  OnboardingDescriptor, OnboardingSessionState, OnboardingStep,
} from '@lib/productization/onboardingWizard';
import { COLORS, SPACING } from '@lib/productization/designSystem';

interface SessionPayload {
  sessions: OnboardingSessionState[];
  activeSession: OnboardingSessionState | null;
  descriptor: OnboardingDescriptor | null;
  advisoryNotice: string;
}

export default function OnboardingPage() {
  return (<Suspense fallback={null}>(
    <main className="min-h-screen scanline">
      <OnboardingInner />
    </main>
  )</Suspense>);
}

function OnboardingInner() {
  const params = useSearchParams();
  const operatorId = params.get('operatorId') ?? 'demo-operator';
  const organizationId = params.get('organizationId') ?? 'org-mood';
  const workspaceId = params.get('workspaceId') ?? 'wsp-mood-default';

  const [payload, setPayload] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const q = new URLSearchParams({ operatorId });
    const r = await fetch(`/api/onboarding?${q.toString()}`, { cache: 'no-store' });
    if (!r.ok) { setError(`onboarding ${r.status}`); return; }
    setPayload(await r.json() as SessionPayload);
    setError(null);
  }, [operatorId]);

  useEffect(() => { void load(); }, [load]);

  const start = async () => {
    setBusy(true);
    const r = await fetch(`/api/onboarding`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', operatorId, operatorReason: 'begin onboarding' }),
    });
    if (!r.ok) setError(`start ${r.status}`);
    setBusy(false);
    setValues({});
    setReason('');
    await load();
  };

  const advance = async (step: OnboardingStep, session: OnboardingSessionState) => {
    if (reason.trim().length === 0) { setError('operatorReason is required'); return; }
    const missing = step.requiredFields.filter((f) => (values[f] ?? '').trim().length === 0);
    if (missing.length > 0) { setError(`required: ${missing.join(', ')}`); return; }
    setBusy(true);
    const r = await fetch(`/api/onboarding`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'advance', operatorId, operatorReason: reason,
        sessionId: session.sessionId, stepId: step.id, values,
      }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({})) as { error?: string };
      setError(e.error ?? `advance ${r.status}`);
    } else {
      setValues({});
      setReason('');
    }
    setBusy(false);
    await load();
  };

  const session = payload?.activeSession;
  const descriptor = payload?.descriptor;
  const currentStep = descriptor?.currentStep ?? null;

  return (
    <div className="mx-auto max-w-xl px-4 pb-20 pt-6 sm:max-w-2xl sm:px-6 sm:pt-10">
      <header className="flex flex-col gap-2">
        <div className="eyebrow">CreativeOS · Onboarding</div>
        <nav className="flex flex-wrap items-center gap-2 text-[10px] text-bone-100/60">
          <span className="font-mono">{organizationId}</span>
          <span>·</span>
          <span className="font-mono">{workspaceId}</span>
          <span>·</span>
          <span className="text-bone-100/80">Onboarding</span>
          <span>·</span>
          <span className="font-mono">{operatorId}</span>
          <span className="ml-auto">
            <a href={`/dashboard?operatorId=${operatorId}&organizationId=${organizationId}&workspaceId=${workspaceId}`}
              className="rounded-full border px-2 py-0.5"
              style={{ borderColor: 'rgba(247,245,242,0.12)', color: 'rgba(247,245,242,0.8)' }}>
              ← /dashboard
            </a>
          </span>
        </nav>
        <h1 className="font-editorial text-3xl tracking-tight sm:text-4xl">Brand Onboarding</h1>
        <p className="text-sm text-bone-100/70">
          Operator: <span className="font-mono">{operatorId}</span>
          {session ? (
            <> · session <span className="font-mono">{session.sessionId.slice(-8)}</span> · <span className="lowercase">{session.status}</span></>
          ) : null}
        </p>
        {error ? (
          <div className="mt-4 rounded-lg border px-4 py-3 text-sm"
               style={{ color: COLORS.signal.warning, borderColor: COLORS.signal.warning }}>
            Operator review required · {error}
          </div>
        ) : null}
      </header>

      {!session || session.status === 'completed' || session.status === 'abandoned' ? (
        <section className="mt-8 rounded-xl border p-6"
                 style={{ borderColor: COLORS.hairline }}>
          <div className="eyebrow">Begin</div>
          <p className="mt-2 text-sm text-bone-100/70">
            Start a new onboarding session. The wizard never auto-creates downstream entities — every
            registration MAY be reviewed before submission.
          </p>
          <button
            type="button" onClick={() => { void start(); }} disabled={busy}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-medium"
            style={{ background: COLORS.bone[50], color: COLORS.ink[900] }}>
            {busy ? 'Starting…' : 'Begin onboarding'}
          </button>
        </section>
      ) : null}

      {session && currentStep && session.status !== 'completed' && session.status !== 'abandoned' ? (
        <>
          {/* progress */}
          <section className="mt-8">
            <div className="eyebrow">
              Step {currentStep.index} of {descriptor!.steps.length} · {descriptor!.progress.percent}%
            </div>
            <ol className="mt-3 flex gap-1">
              {descriptor!.steps.map((s) => (
                <li key={s.id} className="h-1 flex-1 rounded-full"
                    style={{ background: session.completedSteps.includes(s.id)
                      ? COLORS.status.approved
                      : s.id === currentStep.id ? COLORS.bone[200] : COLORS.ink[600] }} />
              ))}
            </ol>
          </section>

          {/* current step form */}
          <section className="mt-8 rounded-xl border p-5 sm:p-6"
                   style={{ borderColor: COLORS.hairline }}>
            <div className="eyebrow">{currentStep.label}</div>
            <p className="mt-2 text-sm text-bone-100/70">{currentStep.description}</p>
            <div className="mt-5 flex flex-col gap-4">
              {currentStep.requiredFields.map((f) => (
                <Field key={f} label={`${f} *`} value={values[f] ?? ''} onChange={(v) =>
                  setValues((prev) => ({ ...prev, [f]: v }))} />
              ))}
              {currentStep.optionalFields.map((f) => (
                <Field key={f} label={f} value={values[f] ?? ''} onChange={(v) =>
                  setValues((prev) => ({ ...prev, [f]: v }))} />
              ))}
              <Field label="operatorReason *" value={reason} onChange={setReason} />
              <button
                type="button" onClick={() => { void advance(currentStep, session); }} disabled={busy}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-medium"
                style={{ background: COLORS.bone[50], color: COLORS.ink[900] }}>
                {busy ? 'Submitting…' : `Submit · ${currentStep.label}`}
              </button>
            </div>
          </section>
        </>
      ) : null}

      {session?.status === 'completed' ? (
        <section className="mt-8 rounded-xl border p-6"
                 style={{ borderColor: COLORS.hairline, background: COLORS.surfaceRaised }}>
          <div className="eyebrow" style={{ color: COLORS.status.approved }}>Ready</div>
          <p className="mt-2 text-sm text-bone-100/70">
            All steps completed. The operator MAY now register downstream entities through the standard
            operator-supervised routes. The wizard never auto-created any record.
          </p>
        </section>
      ) : null}

      {payload ? (
        <p className="mt-8 text-xs text-bone-100/40">{payload.advisoryNotice}</p>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-lg border bg-transparent px-3 text-sm text-bone-50 outline-none focus:border-bone-200"
        style={{ borderColor: COLORS.hairline, paddingInline: SPACING.scale[3] }} />
    </label>
  );
}
