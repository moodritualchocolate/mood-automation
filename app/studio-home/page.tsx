'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Tag } from '@app/components/ui/Tag';
import { useRequireTenant } from '@app/components/auth/AuthProvider';

interface AssetRow {
  assetId: string;
  formula: string;
  campaign: string;
  packageType: string;
  createdAt: number;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'archived';
  previewDataUrl?: string;
  copy?: { headline?: string; cta?: string };
}

interface BrandRow {
  brandId: string;
  name: string;
  description?: string;
  identity?: { slogan?: string; voice?: string; paletteKey?: string };
}

export default function StudioHomePage() {
  const tenant = useRequireTenant();
  const [assets, setAssets] = React.useState<AssetRow[]>([]);
  const [brands, setBrands] = React.useState<BrandRow[]>([]);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!tenant) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const params = new URLSearchParams({ organizationId: tenant.organizationId, workspaceId: tenant.workspaceId });
        const [assetsRes, brandsRes] = await Promise.all([
          fetch(`/api/asset-registry?${params.toString()}`, { credentials: 'include' }),
          fetch(`/api/brand?${params.toString()}`,          { credentials: 'include' }),
        ]);
        if (assetsRes.status === 401 || brandsRes.status === 401) {
          setError('Operator session required. Please sign in.');
          return;
        }
        if (assetsRes.ok) {
          const j = await assetsRes.json() as { assets?: AssetRow[]; counts?: Record<string, number> };
          setAssets(j.assets ?? []);
          setCounts(j.counts ?? {});
        }
        if (brandsRes.ok) {
          const j = await brandsRes.json() as { brands?: BrandRow[] };
          setBrands(j.brands ?? []);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [tenant]);

  const recent = assets.slice().reverse().slice(0, 6);
  const totalAssets = (counts.pending ?? 0) + (counts.approved ?? 0) + (counts.rejected ?? 0) + (counts.archived ?? 0);

  return (
    <AppShell section="Studio">
      <PageHead
        eyebrow="MOOD Creative OS"
        title="Studio"
        subtitle="A quiet room for serious work. Compose, review, approve, and ship. The system observes. The operator decides. Human remains final authority."
        actions={
          <>
            <Link href="/asset-generator"><Button variant="primary" size="md">New asset</Button></Link>
            <Link href="/asset-library"><Button variant="secondary" size="md">Open Library</Button></Link>
          </>
        }
      />

      {error ? (
        <Card>
          <CardEyebrow>Session</CardEyebrow>
          <CardHeadline>{error}</CardHeadline>
          <CardMeta>Sign in to see your assets and brands.</CardMeta>
        </Card>
      ) : null}

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <Counter label="Total assets"  value={totalAssets} />
        <Counter label="Pending"       value={counts.pending  ?? 0} tone="pending"  />
        <Counter label="Approved"      value={counts.approved ?? 0} tone="approved" />
        <Counter label="Brands"        value={brands.length} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-10">
        <ActionCard
          href="/asset-generator"
          eyebrow="01"
          title="Compose"
          subtitle="Brief in Hebrew. Render to PNG. Save to library. Banner, post, or carousel."
        />
        <ActionCard
          href="/asset-library"
          eyebrow="02"
          title="Review"
          subtitle="Every saved asset with its prompt and approval history. Approve, reject, or archive."
        />
        <ActionCard
          href="/brands"
          eyebrow="03"
          title="Brand setup"
          subtitle="Capture voice, audience, palette so every render speaks in one consistent language."
        />
      </div>

      {/* Recent assets */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Recent</div>
            <h2 className="font-['EditorialNew','Times_New_Roman',serif] text-[28px] tracking-tight mt-1">Latest from the library</h2>
          </div>
          <Link href="/asset-library" className="text-[13px] text-[rgba(247,245,242,0.65)] hover:text-[#F7F5F2]">view all →</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => <div key={i} className="aspect-[4/3] rounded-xl bg-[#0A0A0A] pulse border border-[rgba(247,245,242,0.06)]" />)}
          </div>
        ) : recent.length === 0 ? (
          <Card padded>
            <CardEyebrow>No assets yet</CardEyebrow>
            <CardHeadline>The library is silent.</CardHeadline>
            <CardMeta>Compose the first asset — the room fills as you work.</CardMeta>
            <div className="mt-4">
              <Link href="/asset-generator"><Button variant="primary" size="md">Open Generator</Button></Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {recent.map((a) => (
              <Link key={a.assetId} href="/asset-library" className="block">
                <Card interactive className="p-0 overflow-hidden">
                  <div className="relative aspect-[4/3] bg-[#0A0A0A] overflow-hidden border-b border-[rgba(247,245,242,0.08)]">
                    {a.previewDataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={a.previewDataUrl} alt={a.campaign} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[rgba(247,245,242,0.30)] text-[11px] uppercase tracking-[0.28em]">no preview</div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2"><Tag>{a.packageType}</Tag><Tag>{a.formula}</Tag></div>
                    <div className="absolute top-3 right-3"><Tag status={a.approvalStatus}>{a.approvalStatus}</Tag></div>
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.40)] mb-2">{a.campaign}</div>
                    <div className="font-['EditorialNew','Times_New_Roman',serif] text-[18px] leading-tight tracking-tight text-[#F7F5F2]">
                      {a.copy?.headline ?? `${a.formula} · ${a.packageType}`}
                    </div>
                    <div className="mt-3 text-[11px] text-[rgba(247,245,242,0.45)]">{new Date(a.createdAt).toLocaleDateString()}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Brands */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Brands</div>
            <h2 className="font-['EditorialNew','Times_New_Roman',serif] text-[28px] tracking-tight mt-1">Voices the system carries</h2>
          </div>
          <Link href="/brands" className="text-[13px] text-[rgba(247,245,242,0.65)] hover:text-[#F7F5F2]">manage →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 rounded-xl bg-[#0A0A0A] pulse" />
            <div className="h-32 rounded-xl bg-[#0A0A0A] pulse" />
          </div>
        ) : brands.length === 0 ? (
          <Card>
            <CardEyebrow>No brands yet</CardEyebrow>
            <CardHeadline>Set up the first brand.</CardHeadline>
            <div className="mt-4"><Link href="/brands"><Button variant="primary" size="md">Add a brand</Button></Link></div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brands.map((b) => (
              <Link key={b.brandId} href={`/brand-setup/${b.brandId}`} className="block">
                <Card interactive>
                  <CardEyebrow>brand · {b.identity?.paletteKey ?? '—'}</CardEyebrow>
                  <CardHeadline>{b.name}</CardHeadline>
                  {b.identity?.slogan ? <div className="mt-2 text-[14px] text-[rgba(247,245,242,0.75)]" dir="rtl">{b.identity.slogan}</div> : null}
                  {b.description ? <CardMeta>{b.description}</CardMeta> : null}
                  <div className="mt-4 text-[11px] text-[rgba(247,245,242,0.45)]">
                    {b.identity?.voice ? `voice · ${b.identity.voice}` : 'identity not yet captured — open setup →'}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card padded={false} className="p-4">
      <div className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-['EditorialNew','Times_New_Roman',serif] text-[32px] leading-none tracking-tight">{value}</span>
        {tone ? <Tag status={tone}>{tone}</Tag> : null}
      </div>
    </Card>
  );
}

function ActionCard({ href, eyebrow, title, subtitle }: { href: string; eyebrow: string; title: string; subtitle: string }) {
  return (
    <Link href={href} className="block">
      <Card interactive className="h-full">
        <CardEyebrow>{eyebrow}</CardEyebrow>
        <CardHeadline>{title}</CardHeadline>
        <CardMeta>{subtitle}</CardMeta>
      </Card>
    </Link>
  );
}
