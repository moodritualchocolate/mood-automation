/**
 * /brands · brand CRUD page (operator-supervised).
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { COLORS, SPACING } from '@lib/productization/designSystem';

interface BrandRow { brandId: string; projectId: string; name: string; description?: string; createdAt: number; }

export default function BrandsPage() {
  return <main className="min-h-screen scanline"><BrandsInner /></main>;
}

function BrandsInner() {
  const params = useSearchParams();
  const operatorId = params.get('operatorId') ?? 'demo-operator';
  const organizationId = params.get('organizationId') ?? 'org-mood';
  const workspaceId = params.get('workspaceId') ?? 'wsp-mood-default';

  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = new URLSearchParams({ organizationId, workspaceId });
    const r = await fetch(`/api/brand?${q.toString()}`, { cache: 'no-store' });
    if (!r.ok) { setError(`load ${r.status}`); return; }
    const j = await r.json() as { brands: BrandRow[] };
    setBrands(j.brands);
  }, [organizationId, workspaceId]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    setError(null); setBusy(true);
    const r = await fetch('/api/brand', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create', operatorId, operatorReason: reason || 'create brand',
        organizationId, workspaceId,
        name, description: description || undefined,
      }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({})) as { error?: string };
      setError(j.error ?? `error ${r.status}`);
    } else {
      setName(''); setDescription(''); setReason('');
      await load();
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:max-w-3xl sm:px-6 sm:pt-10">
      <header className="flex flex-col gap-2">
        <Breadcrumb operatorId={operatorId} organizationId={organizationId} workspaceId={workspaceId} entity="Brands" />
        <h1 className="font-editorial text-3xl tracking-tight sm:text-4xl">Brands</h1>
        {error ? (
          <div className="mt-3 rounded-lg border px-4 py-3 text-sm"
               style={{ color: COLORS.signal.warning, borderColor: COLORS.signal.warning }}>
            Operator review required · {error}
          </div>
        ) : null}
      </header>

      <section className="mt-6 rounded-xl border p-5 sm:p-6" style={{ borderColor: COLORS.hairline }}>
        <div className="eyebrow">Create brand</div>
        <div className="mt-4 flex flex-col gap-3">
          <Field label="name *" value={name} onChange={setName} />
          <Field label="description" value={description} onChange={setDescription} />
          <Field label="operatorReason *" value={reason} onChange={setReason} />
          <button type="button" onClick={() => { void submit(); }}
            disabled={busy || !name || !reason}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-medium disabled:opacity-50"
            style={{ background: COLORS.bone[50], color: COLORS.ink[900] }}>
            {busy ? 'Creating…' : 'Create brand'}
          </button>
        </div>
      </section>

      <section className="mt-8">
        <div className="eyebrow">{brands.length} brand{brands.length === 1 ? '' : 's'}</div>
        <ul className="mt-3 flex flex-col gap-2">
          {brands.map((b) => (
            <li key={b.brandId} className="rounded-lg border p-3 text-xs text-bone-100/80"
                style={{ borderColor: COLORS.hairline }}>
              <div className="font-medium">{b.name}</div>
              <div className="mt-1 font-mono text-[10px] text-bone-100/50">{b.brandId}</div>
              {b.description ? <div className="mt-1 text-bone-100/60">{b.description}</div> : null}
            </li>
          ))}
        </ul>
      </section>
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

function Breadcrumb({ operatorId, organizationId, workspaceId, entity }: {
  operatorId: string; organizationId: string; workspaceId: string; entity: string;
}) {
  return (
    <>
      <div className="eyebrow">CreativeOS · {entity}</div>
      <nav className="flex flex-wrap items-center gap-2 text-[10px] text-bone-100/60">
        <span className="font-mono">{organizationId}</span>
        <span>·</span>
        <span className="font-mono">{workspaceId}</span>
        <span>·</span>
        <span className="text-bone-100/80">{entity}</span>
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
    </>
  );
}
