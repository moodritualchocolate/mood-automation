"use client";

import { LogConversation } from "@/components/log-conversation";
import { StatusBadge, STATUS_DOT } from "@/components/status";
import { Button, Card, EmptyState, ScoreBadge, Skeleton } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";
import { SUPPLIER_STATUSES } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import type { DictKey } from "@/lib/i18n/dictionary";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  FlaskConical,
  type LucideIcon,
  Plus,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const hydrated = useStore((s) => s.hydrated);
  const role = useStore((s) => s.role);
  const { suppliers, events, samples, quotes, tasks } = useStore();
  const [logOpen, setLogOpen] = useState(false);

  const stats = useMemo(() => {
    const active = suppliers.filter(
      (s) => s.status !== "rejected" && s.status !== "new",
    ).length;
    const awaiting = suppliers.filter(
      (s) => s.status === "awaiting_response",
    ).length;
    const samplesInTransit = suppliers.filter(
      (s) => s.status === "sample_requested",
    ).length;
    const approved = suppliers.filter((s) => s.status === "approved").length;
    const openTasks = tasks.filter((t) => !t.done).length;
    return {
      active,
      awaiting,
      samplesInTransit,
      quotes: quotes.length,
      approved,
      openTasks,
    };
  }, [suppliers, quotes, tasks]);

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) => !t.done && t.dueDate && new Date(t.dueDate).getTime() < Date.now(),
      ),
    [tasks],
  );

  const pipeline = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of suppliers) counts.set(s.status, (counts.get(s.status) ?? 0) + 1);
    const total = suppliers.length || 1;
    return SUPPLIER_STATUSES.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
      pct: ((counts.get(status) ?? 0) / total) * 100,
    })).filter((p) => p.count > 0);
  }, [suppliers]);

  const recent = useMemo(
    () => [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [events],
  );

  const topSuppliers = useMemo(() => {
    const score = (sid: string) => {
      const ss = samples.filter((s) => s.supplierId === sid && s.finalScore != null);
      if (!ss.length) return undefined;
      return ss.reduce((a, s) => a + (s.finalScore ?? 0), 0) / ss.length;
    };
    return suppliers
      .map((s) => ({ s, score: score(s.id) }))
      .filter((x) => x.score != null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);
  }, [suppliers, samples]);

  const supplierName = (id?: string) =>
    suppliers.find((s) => s.id === id)?.company ?? "";

  if (!hydrated) return <DashboardSkeleton />;

  const cards: { key: DictKey; value: number; icon: LucideIcon; href: string; tone: string }[] = [
    { key: "dashboard.activeSuppliers", value: stats.active, icon: Building2, href: "/suppliers", tone: "text-brand bg-brand-soft" },
    { key: "dashboard.awaiting", value: stats.awaiting, icon: Clock, href: "/suppliers", tone: "text-warning bg-warning/12" },
    { key: "dashboard.samplesInTransit", value: stats.samplesInTransit, icon: FlaskConical, href: "/samples", tone: "text-accent bg-accent/12" },
    { key: "dashboard.quotesReceived", value: stats.quotes, icon: Receipt, href: "/quotes", tone: "text-info bg-info/12" },
    { key: "dashboard.approved", value: stats.approved, icon: CheckCircle2, href: "/suppliers", tone: "text-success bg-success/12" },
    { key: "dashboard.openTasks", value: stats.openTasks, icon: AlertTriangle, href: "/tasks", tone: "text-danger bg-danger/12" },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {t("dashboard.title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted">{t("dashboard.subtitle")}</p>
        </div>
        {canEdit(role) && (
          <Button variant="primary" onClick={() => setLogOpen(true)}>
            <Plus size={16} />
            {t("timeline.add")}
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.key} href={c.href}>
              <Card className="transition hover:border-border-strong hover:shadow-elevated">
                <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-lg", c.tone)}>
                  <Icon size={18} />
                </div>
                <div className="text-2xl font-bold tabular-nums">{c.value}</div>
                <div className="mt-0.5 text-xs text-muted">{t(c.key)}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Pipeline */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">{t("dashboard.pipeline")}</h2>
          {pipeline.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t("common.empty")}</p>
          ) : (
            <div className="space-y-3">
              {pipeline.map((p) => (
                <div key={p.status} className="flex items-center gap-3">
                  <div className="flex w-40 shrink-0 items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[p.status])} />
                    <span className="truncate text-xs text-muted">
                      {t(`status.${p.status}` as const)}
                    </span>
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={cn("h-full rounded-full", STATUS_DOT[p.status])}
                      style={{ width: `${Math.max(p.pct, 6)}%` }}
                    />
                  </div>
                  <span className="w-6 text-end text-sm font-semibold tabular-nums">
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Alerts */}
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle size={15} className="text-warning" />
            {t("dashboard.alerts")}
          </h2>
          {overdueTasks.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">
              {t("dashboard.noAlerts")}
            </p>
          ) : (
            <ul className="space-y-2">
              {overdueTasks.slice(0, 6).map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm"
                >
                  <div className="font-medium">{task.title}</div>
                  {task.supplierId && (
                    <div className="text-xs text-muted">
                      {supplierName(task.supplierId)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">
            {t("dashboard.recentActivity")}
          </h2>
          {recent.length === 0 ? (
            <EmptyState title={t("common.empty")} />
          ) : (
            <ul className="space-y-3">
              {recent.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <Link
                    href={`/suppliers/${e.supplierId}?tab=timeline`}
                    className="group min-w-0 flex-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-brand group-hover:underline">
                        {supplierName(e.supplierId)}
                      </span>
                      <span className="shrink-0 text-[11px] text-faint">
                        {relativeTime(e.createdAt, lang)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted">{e.text}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Top suppliers */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold">{t("dashboard.topSuppliers")}</h2>
          {topSuppliers.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">{t("common.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {topSuppliers.map(({ s, score }) => (
                <li key={s.id}>
                  <Link
                    href={`/suppliers/${s.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{s.company}</div>
                      <StatusBadge status={s.status} className="mt-1" />
                    </div>
                    <ScoreBadge score={score} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <LogConversation open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
