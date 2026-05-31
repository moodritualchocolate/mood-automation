/**
 * /dashboard · Executive Dashboard (mobile-first).
 *
 * Read-only operator home. Renders the cards composed by
 * /api/dashboard and the navigation tree from /api/navigation. The
 * page never triggers an operator action by itself — every CTA
 * routes to an operator-supervised section.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { DashboardDescriptor } from '@lib/productization/dashboardComposition';
import type { NavigationDescriptor } from '@lib/productization/navigation';
import { COLORS, SPACING, BADGES } from '@lib/productization/designSystem';
import type { TenantContext } from '@lib/tenancy/types';

interface DashboardPayload {
  context: TenantContext;
  dashboard: DashboardDescriptor;
  advisoryNotice: string;
}
interface NavigationPayload {
  context: TenantContext;
  navigation: NavigationDescriptor;
  advisoryNotice: string;
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen scanline">
      <DashboardInner />
    </main>
  );
}

function DashboardInner() {
  const params = useSearchParams();
  const operatorId = params.get('operatorId') ?? 'demo-operator';
  const organizationId = params.get('organizationId') ?? 'org-mood';
  const workspaceId = params.get('workspaceId') ?? 'wsp-mood-default';

  const [dash, setDash] = useState<DashboardPayload | null>(null);
  const [nav, setNav] = useState<NavigationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams({ operatorId, organizationId, workspaceId });
      const [d, n] = await Promise.all([
        fetch(`/api/dashboard?${q.toString()}`, { cache: 'no-store' }),
        fetch(`/api/navigation?${q.toString()}`, { cache: 'no-store' }),
      ]);
      if (!d.ok || !n.ok) { setError(`dashboard ${d.status} · navigation ${n.status}`); return; }
      setDash(await d.json() as DashboardPayload);
      setNav(await n.json() as NavigationPayload);
      setError(null);
    } catch (e) { setError((e as Error).message); }
  }, [operatorId, organizationId, workspaceId]);

  useEffect(() => { void load(); }, [load]);

  const sortedCards = useMemo(
    () => dash?.dashboard.cards.slice().sort((a, b) => a.mobileOrder - b.mobileOrder) ?? [],
    [dash],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:max-w-3xl sm:px-6 sm:pt-10">
      <header className="flex flex-col gap-2">
        <div className="eyebrow">CreativeOS · Dashboard</div>
        <h1 className="font-editorial text-3xl tracking-tight sm:text-4xl">
          {nav?.context?.organizationId ?? organizationId}
        </h1>
        <p className="text-sm text-bone-100/70">
          Operator: <span className="font-mono">{operatorId}</span>
          {workspaceId ? <> · workspace <span className="font-mono">{workspaceId}</span></> : null}
        </p>
        {error ? (
          <div
            className="mt-4 rounded-lg border px-4 py-3 text-sm"
            style={{ color: COLORS.signal.warning, borderColor: COLORS.signal.warning }}>
            Operator review required · {error}
          </div>
        ) : null}
      </header>

      <section className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
        {sortedCards.length === 0 && !error ? (
          <div className="col-span-full rounded-xl border px-5 py-12 text-center"
               style={{ borderColor: COLORS.hairline }}>
            <div className="eyebrow">Loading</div>
            <p className="mt-2 text-sm text-bone-100/70">Composing dashboard…</p>
          </div>
        ) : null}
        {sortedCards.map((c) => {
          const isApprovalCard = c.id === 'pending-approvals';
          const fg = isApprovalCard ? COLORS.status.pending : COLORS.bone[50];
          return (
            <article key={c.id}
              className="flex flex-col gap-3 rounded-xl border bg-ink-800 p-5 sm:p-6"
              style={{ borderColor: COLORS.hairline }}>
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="eyebrow">{c.label}</div>
                  <div className="mt-2 flex items-baseline gap-2 font-editorial">
                    <span className="text-4xl" style={{ color: fg }}>{c.primaryMetric.value}</span>
                    {c.primaryMetric.suffix ? (
                      <span className="text-xs text-bone-100/60">{c.primaryMetric.suffix}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <ul className="flex flex-col gap-1 text-xs text-bone-100/70">
                {c.observations.slice(0, 3).map((o, i) => (
                  <li key={i} className="truncate">{o}</li>
                ))}
              </ul>
              <Link
                href={{
                  pathname: `/dashboard`,
                  query: { operatorId, organizationId, workspaceId, section: c.primaryAction.targetSectionId },
                }}
                className="mt-1 inline-flex h-11 items-center justify-center rounded-lg border text-xs"
                style={{ borderColor: COLORS.hairline, color: COLORS.bone[50] }}>
                {c.primaryAction.label}
              </Link>
            </article>
          );
        })}
      </section>

      {dash ? (
        <p className="mt-8 text-xs text-bone-100/40">{dash.advisoryNotice}</p>
      ) : null}

      {/* Mobile bottom nav */}
      {nav ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-[#050505]/95 backdrop-blur"
             style={{ borderColor: COLORS.hairline }}>
          <ul className="mx-auto flex max-w-2xl items-stretch justify-around"
              style={{ height: `${56}px`, paddingInline: SPACING.scale[2] }}>
            {nav.navigation.mobileBottomNav.map((s) => (
              <li key={s.id} className="flex-1">
                <Link
                  href={{
                    pathname: `/dashboard`,
                    query: { operatorId, organizationId, workspaceId, section: s.id },
                  }}
                  className="flex h-full flex-col items-center justify-center gap-1 text-bone-100/70">
                  <span className="h-1 w-1 rounded-full"
                        style={{ background: BADGES.statusToColors('approved').fg }} />
                  <span className="eyebrow !text-[9px]">{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
