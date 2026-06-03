'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Tag } from '@app/components/ui/Tag';
import type { DashboardDescriptor } from '@lib/productization/dashboardComposition';
import type { TenantContext } from '@lib/tenancy/types';
import { useRequireTenant } from '@app/components/auth/AuthProvider';

interface DashboardPayload {
  context: TenantContext;
  dashboard: DashboardDescriptor;
  advisoryNotice: string;
}

export default function DashboardPage() {
  const tenant = useRequireTenant();
  const [dash, setDash] = React.useState<DashboardPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!tenant) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const q = new URLSearchParams({ organizationId: tenant.organizationId, workspaceId: tenant.workspaceId });
        const r = await fetch(`/api/dashboard?${q.toString()}`, { credentials: 'include', cache: 'no-store' });
        if (!r.ok) { setError(`Dashboard load failed (${r.status}).`); return; }
        setDash(await r.json() as DashboardPayload);
      } catch (e) {
        setError((e as Error).message);
      } finally { setLoading(false); }
    })();
  }, [tenant]);

  const sortedCards = React.useMemo(
    () => dash?.dashboard.cards.slice().sort((a, b) => a.mobileOrder - b.mobileOrder) ?? [],
    [dash],
  );

  return (
    <AppShell section="Dashboard">
      <PageHead
        eyebrow="Executive overview"
        title={tenant?.organizationId ?? 'Dashboard'}
        subtitle={tenant ? `Workspace · ${tenant.workspaceId}` : undefined}
      />

      {error ? (
        <Card className="mb-6 border-[#FF4D2D]/40">
          <CardEyebrow>Operator review required</CardEyebrow>
          <CardHeadline>{error}</CardHeadline>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 rounded-xl bg-[#0A0A0A] pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedCards.map((c) => {
            const tone = c.id === 'pending-approvals' ? 'pending' : undefined;
            return (
              <Card key={c.id}>
                <CardEyebrow>{c.label}</CardEyebrow>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-['EditorialNew','Times_New_Roman',serif] text-[40px] leading-none tracking-tight">{c.primaryMetric.value}</span>
                  {c.primaryMetric.suffix ? <span className="text-[12px] text-[rgba(247,245,242,0.55)]">{c.primaryMetric.suffix}</span> : null}
                  {tone ? <Tag status={tone}>{tone}</Tag> : null}
                </div>
                <ul className="mt-3 space-y-1 text-[12px] text-[rgba(247,245,242,0.65)]">
                  {c.observations.slice(0, 3).map((o, i) => <li key={i} className="truncate">· {o}</li>)}
                </ul>
                <div className="mt-4 text-[12px]">
                  <Link href="/studio-home" className="text-[#F7F5F2] hover:underline">{c.primaryAction.label} →</Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {dash ? <p className="mt-8 text-[11px] text-[rgba(247,245,242,0.40)]">{dash.advisoryNotice}</p> : null}
    </AppShell>
  );
}
