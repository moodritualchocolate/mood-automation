'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Field, Input, Textarea } from '@app/components/ui/Field';
import { Empty } from '@app/components/ui/Empty';
import { useRequireTenant } from '@app/components/auth/AuthProvider';

interface BrandRow {
  brandId: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: number;
  identity?: { slogan?: string; voice?: string; paletteKey?: string };
}

export default function BrandsPage() {
  const tenant = useRequireTenant();
  const [brands, setBrands] = React.useState<BrandRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [reason, setReason] = React.useState('create brand');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!tenant) return;
    setLoading(true); setError(null);
    try {
      const q = new URLSearchParams({ organizationId: tenant.organizationId, workspaceId: tenant.workspaceId });
      const r = await fetch(`/api/brand?${q.toString()}`, { credentials: 'include', cache: 'no-store' });
      if (!r.ok) { setError(`Could not load brands (${r.status}).`); return; }
      const j = await r.json() as { brands: BrandRow[] };
      setBrands(j.brands);
    } finally { setLoading(false); }
  }, [tenant]);

  React.useEffect(() => { void load(); }, [load]);

  async function submit() {
    if (!tenant) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/brand', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          operatorReason: reason || 'create brand',
          organizationId: tenant.organizationId,
          workspaceId: tenant.workspaceId,
          name, description: description || undefined,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({})) as { error?: string };
        setError(j.error ?? `Error ${r.status}`);
        return;
      }
      setName(''); setDescription(''); setShowCreate(false);
      await load();
    } finally { setBusy(false); }
  }

  return (
    <AppShell section="Brands">
      <PageHead
        eyebrow="Operator-supervised"
        title="Brands"
        subtitle="Each brand carries its own voice, palette, and asset references. Configure once — every render inherits it."
        actions={<Button variant="primary" size="md" onClick={() => setShowCreate((v) => !v)}>{showCreate ? 'Cancel' : '+ New brand'}</Button>}
      />

      {error ? (
        <Card className="mb-6 border-[#FF4D2D]/40">
          <CardEyebrow>Operator review required</CardEyebrow>
          <CardHeadline>{error}</CardHeadline>
        </Card>
      ) : null}

      {showCreate ? (
        <Card className="mb-6">
          <CardEyebrow>Create brand</CardEyebrow>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Brand name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., MOOD" /></Field>
            <Field label="Operator reason" required><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
            <div className="md:col-span-2">
              <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></Field>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" size="md" onClick={() => void submit()} disabled={busy || !name}>
              {busy ? 'Creating…' : 'Create brand'}
            </Button>
            <Button variant="ghost" size="md" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => <div key={i} className="h-28 rounded-xl bg-[#0A0A0A] pulse" />)}
        </div>
      ) : brands.length === 0 ? (
        <Empty
          eyebrow="No brands yet"
          headline="Start with your first brand."
          description="A brand carries voice, audience, palette, and product references."
          action={<Button variant="primary" size="lg" onClick={() => setShowCreate(true)}>+ New brand</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brands.map((b) => (
            <Link key={b.brandId} href={`/brand-setup/${b.brandId}`} className="block">
              <Card interactive>
                <CardEyebrow>brand · {b.identity?.paletteKey ?? '—'}</CardEyebrow>
                <CardHeadline>{b.name}</CardHeadline>
                {b.identity?.slogan ? <div className="mt-2 text-[14px] text-[rgba(247,245,242,0.75)]" dir="rtl">{b.identity.slogan}</div> : null}
                {b.description ? <CardMeta>{b.description}</CardMeta> : null}
                <div className="mt-3 text-[11px] text-[rgba(247,245,242,0.45)] flex items-center justify-between">
                  <span>{b.identity?.voice ? `voice · ${b.identity.voice}` : 'identity not yet captured — click to open setup'}</span>
                  <span className="text-[#F7F5F2]">Open setup →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
