/**
 * /fast-start · operator-facing Fast Start page.
 *
 * Four required fields → one POST → full organization scaffold.
 * Designed to drop time-to-first-revenue-event below 3 minutes.
 */

'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { COLORS, SPACING } from '@lib/productization/designSystem';

const GOALS = [
  { id: 'product-launch',   label: 'Launch a product' },
  { id: 'lead-generation',  label: 'Generate leads' },
  { id: 'brand-awareness',  label: 'Build awareness' },
  { id: 'community-growth', label: 'Grow community' },
  { id: 'retention',        label: 'Retain customers' },
  { id: 'sales',            label: 'Drive sales' },
  { id: 'market-expansion', label: 'Expand to a new market' },
] as const;

interface FastStartResult {
  ok: true;
  result: {
    organizationId: string; workspaceId: string;
    brandId: string; productId: string;
    activationId: string; workflowId: string;
    derivedFields: {
      organizationSlug: string; formula: string | null;
      primaryMarket: string; audienceLabel: string; templateId: string;
    };
  };
  advisoryNotice: string;
}

export default function FastStartPage() {
  return <main className="min-h-screen scanline"><FastStartInner /></main>;
}

function FastStartInner() {
  const params = useSearchParams();
  const operatorId = params.get('operatorId') ?? 'demo-operator';

  const [organizationName, setOrganizationName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [productName, setProductName] = useState('');
  const [goalId, setGoalId] = useState<typeof GOALS[number]['id']>('product-launch');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FastStartResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const submit = useCallback(async () => {
    setError(null); setBusy(true); setResult(null);
    const t0 = performance.now();
    try {
      const r = await fetch('/api/fast-start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId, operatorReason: reason || 'fast start',
          organizationName, brandName, productName, goalId,
        }),
      });
      const elapsed = performance.now() - t0;
      setElapsedMs(elapsed);
      if (!r.ok) {
        const j = await r.json().catch(() => ({})) as { error?: string };
        setError(j.error ?? `error ${r.status}`); return;
      }
      const j = await r.json() as FastStartResult;
      setResult(j);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }, [operatorId, reason, organizationName, brandName, productName, goalId]);

  const canSubmit = organizationName && brandName && productName && reason && !busy;

  return (
    <div className="mx-auto max-w-xl px-4 pb-20 pt-6 sm:max-w-2xl sm:px-6 sm:pt-10">
      <header className="flex flex-col gap-2">
        <div className="eyebrow">CreativeOS · Fast Start</div>
        <h1 className="font-editorial text-3xl tracking-tight sm:text-4xl">Four fields. One scaffold.</h1>
        <p className="text-sm text-bone-100/70">
          Operator: <span className="font-mono">{operatorId}</span>
          {' · '}target: under 3 min
        </p>
        {error ? (
          <div className="mt-4 rounded-lg border px-4 py-3 text-sm"
               style={{ color: COLORS.signal.warning, borderColor: COLORS.signal.warning }}>
            Operator review required · {error}
          </div>
        ) : null}
      </header>

      <section className="mt-8 rounded-xl border p-5 sm:p-6"
               style={{ borderColor: COLORS.hairline }}>
        <div className="eyebrow">Required</div>
        <div className="mt-5 flex flex-col gap-4">
          <Field label="organizationName *" value={organizationName} onChange={setOrganizationName} />
          <Field label="brandName *"        value={brandName}        onChange={setBrandName} />
          <Field label="productName *"      value={productName}      onChange={setProductName} />
          <label className="flex flex-col gap-1">
            <span className="eyebrow">goalId *</span>
            <select value={goalId} onChange={(e) => setGoalId(e.target.value as typeof goalId)}
              className="h-11 rounded-lg border bg-transparent px-3 text-sm text-bone-50 outline-none focus:border-bone-200"
              style={{ borderColor: COLORS.hairline, paddingInline: SPACING.scale[3] }}>
              {GOALS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </label>
          <Field label="operatorReason *" value={reason} onChange={setReason} />
          <button type="button" onClick={() => { void submit(); }} disabled={!canSubmit}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-medium disabled:opacity-50"
            style={{ background: COLORS.bone[50], color: COLORS.ink[900] }}>
            {busy ? 'Scaffolding…' : 'Scaffold organization'}
          </button>
        </div>
      </section>

      {result ? (
        <section className="mt-8 rounded-xl border p-5 sm:p-6"
                 style={{ borderColor: COLORS.hairline, background: COLORS.surfaceRaised }}>
          <div className="eyebrow" style={{ color: COLORS.status.approved }}>Scaffolded</div>
          <ul className="mt-3 flex flex-col gap-1 text-xs text-bone-100/70">
            <li>organizationId · <span className="font-mono">{result.result.organizationId}</span></li>
            <li>workspaceId · <span className="font-mono">{result.result.workspaceId}</span></li>
            <li>brandId · <span className="font-mono">{result.result.brandId}</span></li>
            <li>productId · <span className="font-mono">{result.result.productId}</span></li>
            <li>activationId · <span className="font-mono">{result.result.activationId}</span></li>
            <li>workflowId · <span className="font-mono">{result.result.workflowId}</span></li>
            <li>derived formula · {result.result.derivedFields.formula ?? '—'}</li>
            <li>derived market · {result.result.derivedFields.primaryMarket}</li>
            <li>derived audience · {result.result.derivedFields.audienceLabel}</li>
            <li>workflow template · {result.result.derivedFields.templateId}</li>
            {elapsedMs !== null ? <li>round-trip · {Math.round(elapsedMs)} ms</li> : null}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={{ pathname: '/dashboard', query: {
              operatorId, organizationId: result.result.organizationId, workspaceId: result.result.workspaceId,
            } }}
              className="inline-flex h-11 items-center justify-center rounded-lg border px-4 text-xs"
              style={{ borderColor: COLORS.hairline, color: COLORS.bone[50] }}>
              Open dashboard
            </Link>
            <Link href={{ pathname: '/workflows', query: {
              operatorId, organizationId: result.result.organizationId, workspaceId: result.result.workspaceId,
            } }}
              className="inline-flex h-11 items-center justify-center rounded-lg border px-4 text-xs"
              style={{ borderColor: COLORS.hairline, color: COLORS.bone[50] }}>
              Open workflows
            </Link>
          </div>
          <p className="mt-4 text-xs text-bone-100/40">{result.advisoryNotice}</p>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-lg border bg-transparent px-3 text-sm text-bone-50 outline-none focus:border-bone-200"
        style={{ borderColor: COLORS.hairline, paddingInline: SPACING.scale[3] }} />
    </label>
  );
}
