'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Field, Input, Textarea, Select } from '@app/components/ui/Field';
import { Tag } from '@app/components/ui/Tag';
import { Empty } from '@app/components/ui/Empty';
import { useRequireTenant } from '@app/components/auth/AuthProvider';

interface BrandRow { brandId: string; name: string }
interface ProductRow {
  productId: string;
  brandId: string;
  name: string;
  formula?: string;
  description?: string;
}

const FORMULAS = ['', 'ENERGY', 'FOCUS', 'RELAX', 'SLEEP'] as const;

export default function ProductsPage() {
  const tenant = useRequireTenant();
  const [brands, setBrands] = React.useState<BrandRow[]>([]);
  const [products, setProducts] = React.useState<ProductRow[]>([]);
  const [brandId, setBrandId] = React.useState('');
  const [name, setName] = React.useState('');
  const [formula, setFormula] = React.useState<typeof FORMULAS[number]>('');
  const [description, setDescription] = React.useState('');
  const [reason, setReason] = React.useState('create product');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!tenant) return;
    setLoading(true); setError(null);
    try {
      const q = new URLSearchParams({ organizationId: tenant.organizationId, workspaceId: tenant.workspaceId });
      const [b, p] = await Promise.all([
        fetch(`/api/brand?${q.toString()}`, { credentials: 'include', cache: 'no-store' }),
        fetch(`/api/product?${q.toString()}`, { credentials: 'include', cache: 'no-store' }),
      ]);
      if (!b.ok || !p.ok) { setError(`Could not load (${b.status}/${p.status}).`); return; }
      const bj = await b.json() as { brands: BrandRow[] };
      const pj = await p.json() as { products: ProductRow[] };
      setBrands(bj.brands); setProducts(pj.products);
      if (!brandId && bj.brands.length > 0) setBrandId(bj.brands[0].brandId);
    } finally { setLoading(false); }
  }, [tenant, brandId]);

  React.useEffect(() => { void load(); }, [load]);

  async function submit() {
    if (!tenant) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/product', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          operatorReason: reason || 'create product',
          organizationId: tenant.organizationId,
          workspaceId: tenant.workspaceId,
          brandId, name,
          formula: formula || undefined,
          description: description || undefined,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({})) as { error?: string };
        setError(j.error ?? `Error ${r.status}`); return;
      }
      setName(''); setDescription(''); setShowCreate(false);
      await load();
    } finally { setBusy(false); }
  }

  const brandLookup = new Map(brands.map((b) => [b.brandId, b.name]));

  return (
    <AppShell section="Products">
      <PageHead
        eyebrow="Operator-supervised"
        title="Products"
        subtitle="Each product attaches to a brand and a formula (ENERGY · FOCUS · RELAX · SLEEP). The formula drives palette + label conventions in the renderer."
        actions={<Button variant="primary" size="md" onClick={() => setShowCreate((v) => !v)} disabled={brands.length === 0}>{showCreate ? 'Cancel' : '+ New product'}</Button>}
      />

      {error ? (
        <Card className="mb-6 border-[#FF4D2D]/40">
          <CardEyebrow>Operator review required</CardEyebrow>
          <CardHeadline>{error}</CardHeadline>
        </Card>
      ) : null}

      {brands.length === 0 && !loading ? (
        <Empty
          eyebrow="No brand yet"
          headline="Create a brand first."
          description="Every product attaches to a brand."
          action={<Button variant="primary" size="md" onClick={() => { window.location.href = '/brands'; }}>Open /brands</Button>}
        />
      ) : null}

      {showCreate && brands.length > 0 ? (
        <Card className="mb-6">
          <CardEyebrow>Create product</CardEyebrow>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Brand" required>
              <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                {brands.map((b) => <option key={b.brandId} value={b.brandId}>{b.name}</option>)}
              </Select>
            </Field>
            <Field label="Product name" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ENERGY 30g pouch" /></Field>
            <Field label="Formula">
              <Select value={formula} onChange={(e) => setFormula(e.target.value as typeof FORMULAS[number])}>
                <option value="">—</option>
                {FORMULAS.filter((f) => f).map((f) => <option key={f} value={f}>{f}</option>)}
              </Select>
            </Field>
            <Field label="Operator reason" required><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
            <div className="md:col-span-2"><Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></Field></div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" size="md" onClick={() => void submit()} disabled={busy || !name || !brandId}>{busy ? 'Creating…' : 'Create product'}</Button>
            <Button variant="ghost" size="md" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => <div key={i} className="h-24 rounded-xl bg-[#0A0A0A] pulse" />)}
        </div>
      ) : products.length === 0 && brands.length > 0 ? (
        <Empty
          eyebrow="No products yet"
          headline="Add the first product."
          description="Pick a brand + formula, give it a name."
          action={<Button variant="primary" size="md" onClick={() => setShowCreate(true)}>+ New product</Button>}
        />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <Card key={p.productId}>
              <CardEyebrow>{brandLookup.get(p.brandId) ?? p.brandId}</CardEyebrow>
              <CardHeadline>{p.name}</CardHeadline>
              {p.formula ? <div className="mt-2"><Tag>{p.formula}</Tag></div> : null}
              {p.description ? <CardMeta>{p.description}</CardMeta> : null}
            </Card>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
