'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Field, Input, Select } from '@app/components/ui/Field';
import { useRequireTenant } from '@app/components/auth/AuthProvider';

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
  };
  advisoryNotice: string;
}

export default function FastStartPage() {
  const tenant = useRequireTenant();
  const [organizationName, setOrganizationName] = React.useState('');
  const [brandName, setBrandName] = React.useState('');
  const [productName, setProductName] = React.useState('');
  const [goalId, setGoalId] = React.useState<typeof GOALS[number]['id']>('product-launch');
  const [reason, setReason] = React.useState('fast start');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<FastStartResult | null>(null);
  const [elapsedMs, setElapsedMs] = React.useState<number | null>(null);

  async function submit() {
    setBusy(true); setError(null); setResult(null);
    const t0 = performance.now();
    try {
      const r = await fetch('/api/fast-start', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          operatorReason: reason || 'fast start',
          organizationName, brandName, productName, goalId,
        }),
      });
      setElapsedMs(performance.now() - t0);
      if (!r.ok) {
        const j = await r.json().catch(() => ({})) as { error?: string };
        setError(j.error ?? `Error ${r.status}`); return;
      }
      setResult(await r.json() as FastStartResult);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const canSubmit = organizationName && brandName && productName && reason && !busy;

  return (
    <AppShell section="Fast Start">
      <PageHead
        eyebrow="Scaffold an organization in under 3 minutes"
        title="Four fields. One scaffold."
        subtitle="Type the names of your organization, brand, and product. Pick a goal. The system creates the records — you remain the operator."
      />

      {error ? (
        <Card className="mb-6 border-[#FF4D2D]/40">
          <CardEyebrow>Operator review required</CardEyebrow>
          <CardHeadline>{error}</CardHeadline>
        </Card>
      ) : null}

      {result ? (
        <Card className="mb-6">
          <CardEyebrow>Done · {elapsedMs ? `${Math.round(elapsedMs)} ms` : ''}</CardEyebrow>
          <CardHeadline>Organization scaffolded.</CardHeadline>
          <CardMeta>
            <span>org · {result.result.organizationId}</span>
            <span className="mx-2">·</span>
            <span>workspace · {result.result.workspaceId}</span>
          </CardMeta>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/studio-home"><Button variant="primary" size="md">Open Studio →</Button></Link>
            <Link href="/asset-generator"><Button variant="secondary" size="md">Compose first asset</Button></Link>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="space-y-4">
          <Field label="Organization name" required>
            <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="MOOD" />
          </Field>
          <Field label="Brand name" required>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="mood" />
          </Field>
          <Field label="Product name" required>
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="ENERGY 30g pouch" />
          </Field>
          <Field label="Goal" required>
            <Select value={goalId} onChange={(e) => setGoalId(e.target.value as typeof GOALS[number]['id'])}>
              {GOALS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </Select>
          </Field>
          <Field label="Operator reason" required>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Button variant="primary" size="lg" block onClick={() => void submit()} disabled={!canSubmit}>
            {busy ? 'Scaffolding…' : 'Scaffold organization'}
          </Button>
        </div>
      </Card>

      {tenant ? (
        <div className="mt-6 text-[12px] text-[rgba(247,245,242,0.45)]">
          You're already in <span className="text-[#F7F5F2]">{tenant.organizationId}</span> — Fast Start creates a separate scaffold and does not replace it.
        </div>
      ) : null}
    </AppShell>
  );
}
