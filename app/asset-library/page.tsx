'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Tag } from '@app/components/ui/Tag';
import { Empty } from '@app/components/ui/Empty';
import { Modal } from '@app/components/ui/Modal';
import { Field, Input, Textarea } from '@app/components/ui/Field';

interface AssetRow {
  assetId: string;
  formula: string;
  campaign: string;
  packageType: 'image' | 'video' | 'carousel' | 'landing';
  prompt: string;
  summary: string;
  createdAt: number;
  operatorId: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'archived';
  approvalHistory: Array<{ at: number; status: string; operatorId: string; reason?: string }>;
  operatorNote?: string;
  previewDataUrl?: string;
  copy?: { headline?: string; body?: string; cta?: string; paletteKey?: string };
  brandId?: string;
}

interface ListResponse {
  totalAssets: number;
  counts: Record<string, number>;
  assets: AssetRow[];
}

const STATUS_FILTERS: Array<{ key: 'all' | 'pending' | 'approved' | 'rejected' | 'archived'; label: string }> = [
  { key: 'all',      label: 'All'      },
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'archived', label: 'Archived' },
];

export default function AssetLibraryPage() {
  const [data, setData] = React.useState<ListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<'all' | 'pending' | 'approved' | 'rejected' | 'archived'>('all');
  const [selected, setSelected] = React.useState<AssetRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ organizationId: 'org-mood', workspaceId: 'wsp-mood-default' });
      if (status !== 'all') params.set('status', status);
      const res = await fetch(`/api/asset-registry?${params.toString()}`, { credentials: 'include' });
      if (res.status === 401) { setError('Operator session required. Please sign in.'); setData(null); return; }
      if (res.status === 403) { setError('Operator MAY NOT view this workspace.'); setData(null); return; }
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as ListResponse;
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => { void load(); }, [load]);

  const assets = data?.assets ?? [];

  return (
    <AppShell section="Asset Library">
      <PageHead
        eyebrow="Operator-supervised registry"
        title="Asset Library"
        subtitle="Every saved creative — banner, post, carousel — with provenance, prompts, and approval history. Operator approval required before publication. Human remains final authority."
        actions={
          <>
            <Link href="/asset-generator"><Button variant="primary" size="md">Generate new asset</Button></Link>
            <Button variant="secondary" size="md" onClick={() => void load()}>Refresh</Button>
          </>
        }
      />

      {/* Status filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={[
              'rounded-full border px-3 py-1.5 text-[12px] tracking-tight transition-colors duration-150',
              status === f.key
                ? 'bg-[#F7F5F2] text-[#0A0A0A] border-[#F7F5F2]'
                : 'bg-transparent text-[rgba(247,245,242,0.65)] border-[rgba(247,245,242,0.18)] hover:text-[#F7F5F2]',
            ].join(' ')}
          >
            {f.label}
            {data?.counts && f.key !== 'all' && typeof data.counts[f.key] === 'number'
              ? <span className="ml-2 opacity-60">{data.counts[f.key]}</span>
              : null}
          </button>
        ))}
        <div className="ml-auto text-[12px] text-[rgba(247,245,242,0.45)]">
          {data ? `${data.totalAssets} total · ${assets.length} shown` : ''}
        </div>
      </div>

      {error ? (
        <Card>
          <CardEyebrow>Operator review required</CardEyebrow>
          <CardHeadline>{error}</CardHeadline>
          <CardMeta>Try refreshing, or check that you are signed in.</CardMeta>
        </Card>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-[rgba(247,245,242,0.08)] bg-[#0A0A0A] aspect-square pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <Empty
          eyebrow="Nothing here yet"
          headline="The library is silent."
          description="Generate the first asset — banner, post, or carousel — and save it here for operator approval."
          action={<Link href="/asset-generator"><Button variant="primary" size="lg">Open Asset Generator</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {assets.slice().reverse().map((a) => (
            <Card key={a.assetId} interactive onClick={() => setSelected(a)} className="overflow-hidden p-0">
              <div className="relative aspect-[4/3] bg-[#0A0A0A] overflow-hidden border-b border-[rgba(247,245,242,0.08)]">
                {a.previewDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={a.previewDataUrl} alt={a.summary} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[rgba(247,245,242,0.30)] text-[12px] uppercase tracking-[0.28em]">
                    no preview
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Tag>{a.packageType}</Tag>
                  <Tag>{a.formula}</Tag>
                </div>
                <div className="absolute top-3 right-3">
                  <Tag status={a.approvalStatus}>{a.approvalStatus}</Tag>
                </div>
              </div>
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.40)] mb-2">{a.campaign}</div>
                <div className="font-['EditorialNew','Times_New_Roman',serif] text-[20px] leading-tight tracking-tight text-[#F7F5F2]">
                  {a.copy?.headline ?? a.summary}
                </div>
                {a.copy?.body ? (
                  <div className="mt-2 text-[13px] text-[rgba(247,245,242,0.55)] line-clamp-2">{a.copy.body}</div>
                ) : null}
                <div className="mt-4 flex items-center justify-between text-[11px] text-[rgba(247,245,242,0.45)]">
                  <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  <span>{a.operatorId.slice(0, 12)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected ? (
        <AssetDetailModal
          asset={selected}
          onClose={() => setSelected(null)}
          onChanged={async () => { await load(); setSelected(null); }}
        />
      ) : null}
    </AppShell>
  );
}

interface DetailProps {
  asset: AssetRow;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}

function AssetDetailModal({ asset, onClose, onChanged }: DetailProps) {
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<'prompt' | 'spec' | null>(null);

  async function transition(action: 'approve' | 'reject' | 'archive') {
    if (reason.trim().length === 0) {
      setErr('Operator reason is required.');
      return;
    }
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/asset-registry', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, assetId: asset.assetId, operatorReason: reason }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `status ${res.status}`);
      }
      await onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function downloadPreview() {
    if (!asset.previewDataUrl) return;
    const a = document.createElement('a');
    a.href = asset.previewDataUrl;
    a.download = `mood-${asset.packageType}-${asset.assetId.slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function copy(kind: 'prompt' | 'spec') {
    const text = kind === 'prompt'
      ? asset.prompt
      : JSON.stringify({
          assetId: asset.assetId, formula: asset.formula, packageType: asset.packageType,
          campaign: asset.campaign, copy: asset.copy, summary: asset.summary,
        }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {/* clipboard may be denied — silent */}
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      eyebrow={`${asset.packageType} · ${asset.formula} · ${asset.campaign}`}
      title={asset.copy?.headline ?? asset.summary}
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={busy}>Close</Button>
          <Button variant="danger" size="md" onClick={() => void transition('reject')} disabled={busy || asset.approvalStatus === 'rejected'}>Reject</Button>
          <Button variant="secondary" size="md" onClick={() => void transition('archive')} disabled={busy || asset.approvalStatus === 'archived'}>Archive</Button>
          <Button variant="primary" size="md" onClick={() => void transition('approve')} disabled={busy || asset.approvalStatus === 'approved'}>Approve</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <div className="relative bg-[#050505] rounded-xl overflow-hidden border border-[rgba(247,245,242,0.08)] aspect-square flex items-center justify-center">
            {asset.previewDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={asset.previewDataUrl} alt={asset.summary} className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-[rgba(247,245,242,0.40)] text-[12px] uppercase tracking-[0.28em]">no preview saved</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="primary" size="sm" onClick={downloadPreview} disabled={!asset.previewDataUrl}>Download PNG</Button>
            <Button variant="secondary" size="sm" onClick={() => void copy('prompt')}>{copied === 'prompt' ? 'Copied ✓' : 'Copy prompt'}</Button>
            <Button variant="secondary" size="sm" onClick={() => void copy('spec')}>{copied === 'spec' ? 'Copied ✓' : 'Copy spec (JSON)'}</Button>
          </div>
        </div>
        <div className="md:col-span-2 space-y-5">
          <div>
            <div className="eyebrow mb-2 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Status</div>
            <Tag status={asset.approvalStatus}>{asset.approvalStatus}</Tag>
          </div>
          <div>
            <div className="eyebrow mb-2 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Hebrew Copy</div>
            <div className="space-y-2 text-[14px]">
              {asset.copy?.headline ? <div><span className="text-[rgba(247,245,242,0.40)] text-[11px] mr-2">headline</span>{asset.copy.headline}</div> : null}
              {asset.copy?.body     ? <div><span className="text-[rgba(247,245,242,0.40)] text-[11px] mr-2">body</span>{asset.copy.body}</div> : null}
              {asset.copy?.cta      ? <div><span className="text-[rgba(247,245,242,0.40)] text-[11px] mr-2">cta</span>{asset.copy.cta}</div> : null}
              {asset.copy?.paletteKey ? <div><span className="text-[rgba(247,245,242,0.40)] text-[11px] mr-2">palette</span>{asset.copy.paletteKey}</div> : null}
            </div>
          </div>
          <Field label="Operator reason" required helper="Required to approve / reject / archive">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="why this decision" rows={3} />
          </Field>
          {err ? <div className="text-[12px] text-[#FF4D2D]">{err}</div> : null}
          <div>
            <div className="eyebrow mb-2 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Approval history</div>
            <ul className="text-[12px] space-y-1">
              {asset.approvalHistory.slice().reverse().map((step, i) => (
                <li key={i} className="text-[rgba(247,245,242,0.65)]">
                  <span className="text-[rgba(247,245,242,0.40)]">{new Date(step.at).toLocaleString()}</span>
                  <span className="mx-2">·</span>
                  <span>{step.status}</span>
                  {step.reason ? <span className="text-[rgba(247,245,242,0.55)]"> — {step.reason}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}
