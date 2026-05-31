/**
 * /workflows · Workflow Dashboard (mobile-first).
 *
 * Renders the read-only descriptor from /api/workflows: cards,
 * pending approvals, blocked tasks, missing assets, upcoming
 * milestones. The page NEVER triggers operator actions by itself —
 * every CTA navigates to an operator-supervised section.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { WorkflowDashboardDescriptor } from '@lib/workflows/workflowDashboard';
import { COLORS, BADGES } from '@lib/productization/designSystem';

interface Payload {
  descriptor: WorkflowDashboardDescriptor;
  totalWorkflows: number;
  advisoryNotice: string;
}

export default function WorkflowsPage() {
  return (
    <main className="min-h-screen scanline">
      <WorkflowsInner />
    </main>
  );
}

function WorkflowsInner() {
  const params = useSearchParams();
  const operatorId = params.get('operatorId') ?? 'demo-operator';
  const organizationId = params.get('organizationId') ?? 'org-mood';
  const workspaceId = params.get('workspaceId') ?? 'wsp-mood-default';

  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams({ organizationId, workspaceId });
      const r = await fetch(`/api/workflows?${q.toString()}`, { cache: 'no-store' });
      if (!r.ok) { setError(`workflows ${r.status}`); return; }
      setPayload(await r.json() as Payload);
      setError(null);
    } catch (e) { setError((e as Error).message); }
  }, [organizationId, workspaceId]);

  useEffect(() => { void load(); }, [load]);

  const sortedCards = useMemo(
    () => payload?.descriptor.cards.slice().sort((a, b) => a.mobileOrder - b.mobileOrder) ?? [],
    [payload],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:max-w-4xl sm:px-6 sm:pt-10">
      <header className="flex flex-col gap-2">
        <div className="eyebrow">CreativeOS · Workflows</div>
        <h1 className="font-editorial text-3xl tracking-tight sm:text-4xl">Active Workflows</h1>
        <p className="text-sm text-bone-100/70">
          Operator: <span className="font-mono">{operatorId}</span> ·
          workspace <span className="font-mono">{workspaceId}</span>
        </p>
        {error ? (
          <div className="mt-4 rounded-lg border px-4 py-3 text-sm"
               style={{ color: COLORS.signal.warning, borderColor: COLORS.signal.warning }}>
            Operator review required · {error}
          </div>
        ) : null}
      </header>

      {/* status cards */}
      <section className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {sortedCards.length === 0 && !error ? (
          <div className="col-span-full rounded-xl border px-5 py-12 text-center"
               style={{ borderColor: COLORS.hairline }}>
            <div className="eyebrow">Loading</div>
            <p className="mt-2 text-sm text-bone-100/70">Composing workflow dashboard…</p>
          </div>
        ) : null}
        {sortedCards.map((c) => (
          <article key={c.cardId}
            className="flex flex-col gap-3 rounded-xl border bg-ink-800 p-5"
            style={{ borderColor: COLORS.hairline }}>
            <div className="eyebrow">{c.label}</div>
            <div className="flex items-baseline gap-2 font-editorial">
              <span className="text-4xl">{c.primaryMetric.value}</span>
              {c.primaryMetric.suffix ? (
                <span className="text-xs text-bone-100/60">{c.primaryMetric.suffix}</span>
              ) : null}
            </div>
            <ul className="flex flex-col gap-1 text-xs text-bone-100/70">
              {c.observations.slice(0, 3).map((o, i) => (
                <li key={i} className="truncate">{o}</li>
              ))}
            </ul>
            <Link
              href={{
                pathname: `/dashboard`,
                query: { operatorId, organizationId, workspaceId, section: c.targetSectionId },
              }}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-lg border text-xs"
              style={{ borderColor: COLORS.hairline, color: COLORS.bone[50] }}>
              Open {c.label}
            </Link>
          </article>
        ))}
      </section>

      {/* active workflows list */}
      {payload && payload.descriptor.activeWorkflows.length > 0 ? (
        <section className="mt-10">
          <div className="eyebrow">Active workflows</div>
          <ul className="mt-3 flex flex-col gap-2">
            {payload.descriptor.activeWorkflows.map((w) => {
              const badge = BADGES.statusToColors(w.status);
              return (
                <li key={w.workflowId}
                  className="flex flex-col gap-2 rounded-xl border p-4"
                  style={{ borderColor: COLORS.hairline }}>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium">{w.label}</div>
                    <span className="rounded px-2 py-0.5 text-[10px]"
                          style={{ color: badge.fg, background: badge.bg }}>
                      {w.status}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-bone-100/50">
                    {w.workflowId}
                  </div>
                  <div className="text-xs text-bone-100/70">
                    template: {w.templateId} ·
                    step {w.completedStepIds.length}/{w.plan.steps.length} ·
                    {w.currentStepId ? ` current: ${w.currentStepId}` : ' all steps completed'}
                  </div>
                  {w.bottlenecks.filter((b) => !b.resolvedAt).length > 0 ? (
                    <div className="text-xs"
                         style={{ color: COLORS.status.failed }}>
                      {w.bottlenecks.filter((b) => !b.resolvedAt).length} open bottleneck(s)
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* upcoming milestones */}
      {payload && payload.descriptor.upcomingMilestones.length > 0 ? (
        <section className="mt-10">
          <div className="eyebrow">Upcoming milestones</div>
          <ul className="mt-3 flex flex-col gap-2 text-xs text-bone-100/70">
            {payload.descriptor.upcomingMilestones.slice(0, 8).map((m, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2"
                  style={{ borderColor: COLORS.hairline }}>
                <span className="rounded bg-ink-700 px-2 py-0.5 font-mono text-[10px]">
                  day {m.atDayIndex}
                </span>
                <span>{m.label}</span>
                <span className="ml-2 truncate text-bone-100/50">{m.note}</span>
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
