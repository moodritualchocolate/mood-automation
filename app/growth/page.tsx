/**
 * /growth · Growth Command Center.
 *
 * Single executive screen — mobile-first. Reads /api/growth and
 * renders the eight modules (Goals · Funnels · Campaigns · Channels ·
 * Assets · Performance · Tasks · Approvals) plus the connection map.
 * The page NEVER triggers an operator action by itself.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState, Suspense} from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { GrowthCommandCenterDescriptor } from '@lib/business/growthCommandCenter';
import type { TenantContext } from '@lib/tenancy/types';
import { COLORS } from '@lib/productization/designSystem';

interface GrowthPayload {
  context: TenantContext;
  descriptor: GrowthCommandCenterDescriptor;
  advisoryNotice: string;
}

export default function GrowthPage() {
  return (<Suspense fallback={null}>(
    <main className="min-h-screen scanline">
      <GrowthInner />
    </main>
  )</Suspense>);
}

function GrowthInner() {
  const params = useSearchParams();
  const operatorId = params.get('operatorId') ?? 'demo-operator';
  const organizationId = params.get('organizationId') ?? 'org-mood';
  const workspaceId = params.get('workspaceId') ?? 'wsp-mood-default';

  const [payload, setPayload] = useState<GrowthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams({ operatorId, organizationId, workspaceId });
      const r = await fetch(`/api/growth?${q.toString()}`, { cache: 'no-store' });
      if (!r.ok) { setError(`growth ${r.status}`); return; }
      setPayload(await r.json() as GrowthPayload);
      setError(null);
    } catch (e) { setError((e as Error).message); }
  }, [operatorId, organizationId, workspaceId]);

  useEffect(() => { void load(); }, [load]);

  const sorted = useMemo(
    () => payload?.descriptor.modules.slice().sort((a, b) => a.mobileOrder - b.mobileOrder) ?? [],
    [payload],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:max-w-4xl sm:px-6 sm:pt-10">
      <header className="flex flex-col gap-2">
        <div className="eyebrow">CreativeOS · Growth Command Center</div>
        <h1 className="font-editorial text-3xl tracking-tight sm:text-4xl">
          {organizationId} · {workspaceId}
        </h1>
        <p className="text-sm text-bone-100/70">
          Operator: <span className="font-mono">{operatorId}</span>
        </p>
        {error ? (
          <div className="mt-4 rounded-lg border px-4 py-3 text-sm"
               style={{ color: COLORS.signal.warning, borderColor: COLORS.signal.warning }}>
            Operator review required · {error}
          </div>
        ) : null}
      </header>

      {/* modules grid */}
      <section className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {sorted.length === 0 && !error ? (
          <div className="col-span-full rounded-xl border px-5 py-12 text-center"
               style={{ borderColor: COLORS.hairline }}>
            <div className="eyebrow">Loading</div>
            <p className="mt-2 text-sm text-bone-100/70">Composing growth center…</p>
          </div>
        ) : null}
        {sorted.map((m) => (
          <article key={m.moduleId}
            className="flex flex-col gap-3 rounded-xl border bg-ink-800 p-5"
            style={{ borderColor: COLORS.hairline }}>
            <div className="eyebrow">{m.label}</div>
            <div className="flex items-baseline gap-2 font-editorial">
              <span className="text-4xl">{m.primaryMetric.value}</span>
              {m.primaryMetric.suffix ? (
                <span className="text-xs text-bone-100/60">{m.primaryMetric.suffix}</span>
              ) : null}
            </div>
            <ul className="flex flex-col gap-1 text-xs text-bone-100/70">
              {m.observations.slice(0, 3).map((o, i) => (
                <li key={i} className="truncate">{o}</li>
              ))}
            </ul>
            <Link
              href={{
                pathname: `/dashboard`,
                query: { operatorId, organizationId, workspaceId, section: m.targetSectionId },
              }}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-lg border text-xs"
              style={{ borderColor: COLORS.hairline, color: COLORS.bone[50] }}>
              Open {m.label}
            </Link>
          </article>
        ))}
      </section>

      {/* connections map */}
      {payload ? (
        <section className="mt-10">
          <div className="eyebrow">Connections</div>
          <ul className="mt-3 flex flex-col gap-2 text-xs text-bone-100/70">
            {payload.descriptor.connections.map((c, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2"
                  style={{ borderColor: COLORS.hairline }}>
                <span className="rounded bg-ink-700 px-2 py-0.5 font-mono text-[10px]">{c.from}</span>
                <span>→</span>
                <span className="rounded bg-ink-700 px-2 py-0.5 font-mono text-[10px]">{c.to}</span>
                <span className="ml-2 truncate">{c.note}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* goal × channel matrix */}
      {payload && payload.descriptor.goalChannelMatrix.length > 0 ? (
        <section className="mt-10">
          <div className="eyebrow">Goal · Channel Matrix</div>
          <ul className="mt-3 flex flex-col gap-2 text-xs text-bone-100/80">
            {payload.descriptor.goalChannelMatrix.map((row) => (
              <li key={row.goalId} className="rounded-lg border p-3"
                  style={{ borderColor: COLORS.hairline }}>
                <div className="font-medium">{row.goal.label}</div>
                <div className="mt-1 text-bone-100/60">
                  channels: {row.channelIds.join(' · ')}
                </div>
                <div className="text-bone-100/60">
                  measurements: {row.measurementCategories.join(' · ')}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {payload ? (
        <p className="mt-10 text-xs text-bone-100/40">{payload.advisoryNotice}</p>
      ) : null}
    </div>
  );
}
