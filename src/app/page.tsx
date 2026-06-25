"use client";

import { LogConversation } from "@/components/log-conversation";
import { StatusBadge, STATUS_DOT } from "@/components/status";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ScoreBadge,
  SectionHeading,
  Skeleton,
  Stat,
} from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";
import { SUPPLIER_STATUSES } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import type { DictKey } from "@/lib/i18n/dictionary";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  FlaskConical,
  type LucideIcon,
  Plus,
  Receipt,
  Sparkles,
  TrendingUp,
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
    const active = suppliers.filter((s) => s.status !== "rejected" && s.status !== "new").length;
    const awaiting = suppliers.filter((s) => s.status === "awaiting_response").length;
    const samplesInTransit = suppliers.filter((s) => s.status === "sample_requested").length;
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

  const cards: {
    key: DictKey;
    value: number;
    icon: LucideIcon;
    href: string;
    tone: "default" | "brand" | "success" | "warning" | "danger";
    hint?: string;
  }[] = [
    { key: "dashboard.activeSuppliers", value: stats.active,           icon: Building2,    href: "/suppliers", tone: "brand"   },
    { key: "dashboard.awaiting",        value: stats.awaiting,         icon: Clock,        href: "/suppliers", tone: "warning" },
    { key: "dashboard.samplesInTransit",value: stats.samplesInTransit, icon: FlaskConical, href: "/samples",   tone: "default" },
    { key: "dashboard.quotesReceived",  value: stats.quotes,           icon: Receipt,      href: "/quotes",    tone: "default" },
    { key: "dashboard.approved",        value: stats.approved,         icon: CheckCircle2, href: "/suppliers", tone: "success" },
    { key: "dashboard.openTasks",       value: stats.openTasks,        icon: AlertTriangle,href: "/tasks",     tone: stats.openTasks > 0 ? "danger" : "default" },
  ];

  return (
    <>
      {/* ─── Hero · greeting + primary CTA ─────────────────────────── */}
      <Hero onAddEvent={() => setLogOpen(true)} canEdit={canEdit(role)} approved={stats.approved} active={stats.active} />

      {/* ─── Stat cards ────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.key} href={c.href} className="group block">
            <Stat
              label={t(c.key)}
              value={c.value}
              icon={c.icon}
              tone={c.tone}
              hint={c.hint}
            />
          </Link>
        ))}
      </div>

      {/* ─── Pipeline + Alerts row ─────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <Card className="lg:col-span-2">
          <SectionHeading
            eyebrow={t("dashboard.eyebrow")}
            title={t("dashboard.pipeline")}
            action={
              <Link href="/suppliers" className="btn-ghost btn-sm">
                {t("action.open")}
                <ArrowUpRight size={13} />
              </Link>
            }
          />
          {pipeline.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={t("common.empty")}
              hint={t("suppliers.empty")}
            />
          ) : (
            <div className="space-y-3">
              {pipeline.map((p) => (
                <div key={p.status} className="flex items-center gap-3">
                  <div className="flex w-40 shrink-0 items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[p.status])} />
                    <span className="truncate text-[12.5px] font-medium text-fg-2">
                      {t(`status.${p.status}` as const)}
                    </span>
                  </div>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={cn(
                        "absolute inset-y-0 start-0 rounded-full transition-all duration-700 ease-spring",
                        STATUS_DOT[p.status],
                      )}
                      style={{ width: `${Math.max(p.pct, 6)}%` }}
                    />
                  </div>
                  <span className="mono w-8 text-end text-[13px] font-semibold tabular text-fg">
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionHeading
            title={t("dashboard.alerts")}
            action={
              overdueTasks.length > 0 ? (
                <Chip tone="danger" size="sm">{overdueTasks.length}</Chip>
              ) : null
            }
          />
          {overdueTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success">
                <CheckCircle2 size={18} strokeWidth={2.2} />
              </span>
              <p className="max-w-[18ch] text-[12.5px] leading-relaxed text-muted">
                {t("dashboard.noAlerts")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {overdueTasks.slice(0, 6).map((task) => (
                <li key={task.id}>
                  <Link
                    href={task.supplierId ? `/suppliers/${task.supplierId}?tab=tasks` : "/tasks"}
                    className="group block rounded-lg border border-danger/20 bg-danger-soft/40 px-3 py-2 transition hover:border-danger/30 hover:bg-danger-soft/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-fg">
                          {task.title}
                        </div>
                        {task.supplierId && (
                          <div className="truncate text-[11.5px] text-muted">
                            {supplierName(task.supplierId)}
                          </div>
                        )}
                      </div>
                      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-danger" strokeWidth={2.4} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ─── Activity + Top suppliers row ──────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <Card className="lg:col-span-2">
          <SectionHeading
            title={t("dashboard.recentActivity")}
            action={
              <Chip tone="neutral" size="sm">
                {recent.length}
              </Chip>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={t("common.empty")}
              hint="Add your first conversation to start the timeline."
            />
          ) : (
            <ul className="relative space-y-4">
              {/* Timeline rail */}
              <span className="absolute inset-y-2 start-[5px] w-px bg-border-soft" aria-hidden />
              {recent.map((e) => (
                <li key={e.id} className="relative flex gap-3 ps-0">
                  <span className="relative z-10 mt-1.5 h-[10px] w-[10px] shrink-0 rounded-full border-2 border-bg bg-brand" />
                  <Link
                    href={`/suppliers/${e.supplierId}?tab=timeline`}
                    className="group min-w-0 flex-1 -mt-0.5 rounded-md px-2 py-1 transition hover:bg-surface-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-fg group-hover:text-brand">
                        {supplierName(e.supplierId)}
                      </span>
                      <span className="mono shrink-0 text-[10.5px] text-faint">
                        {relativeTime(e.createdAt, lang)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">
                      {e.text}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeading
            title={t("dashboard.topSuppliers")}
            action={<TrendingUp size={14} className="text-muted" />}
          />
          {topSuppliers.length === 0 ? (
            <EmptyState icon={TrendingUp} title={t("common.empty")} />
          ) : (
            <ul className="space-y-1">
              {topSuppliers.map(({ s, score }, idx) => (
                <li key={s.id}>
                  <Link
                    href={`/suppliers/${s.id}`}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-2"
                  >
                    <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-2 text-[11px] font-semibold text-muted group-hover:bg-brand-soft group-hover:text-brand">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-fg">
                        {s.company}
                      </div>
                      <StatusBadge status={s.status} size="sm" className="mt-1" />
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

/* ─── Hero · personalized greeting + headline metric ────────── */
function Hero({
  onAddEvent,
  canEdit,
  approved,
  active,
}: {
  onAddEvent: () => void;
  canEdit: boolean;
  approved: number;
  active: number;
}) {
  const { t } = useI18n();
  const hour = new Date().getHours();
  const greetingKey: DictKey =
    hour < 12 ? "dashboard.greeting.morning"
    : hour < 18 ? "dashboard.greeting.afternoon"
    :             "dashboard.greeting.evening";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface bg-warm">
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div className="space-y-2.5">
          <div className="eyebrow flex items-center gap-2">
            <span className="inline-block h-1 w-1 rounded-full bg-brand" aria-hidden />
            {t("dashboard.eyebrow")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            {t(greetingKey)}
            <span className="text-muted"> · </span>
            <span className="text-fg-2">{t("dashboard.greeting.suffix")}</span>
          </h1>
          <p className="max-w-xl text-[14px] leading-relaxed text-muted">
            {t("dashboard.subtitle")}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip tone="brand" size="sm">
              <span className="mono">{active}</span> {t("dashboard.activeSuppliers")}
            </Chip>
            <Chip tone="success" size="sm">
              <span className="mono">{approved}</span> {t("dashboard.approved")}
            </Chip>
          </div>
        </div>
        {canEdit && (
          <Button variant="primary" size="lg" leadingIcon={Plus} onClick={onAddEvent}>
            {t("timeline.add")}
          </Button>
        )}
      </div>
      {/* Soft top-right glow */}
      <div
        className="pointer-events-none absolute -top-24 -end-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgb(var(--brand) / 0.35), transparent)" }}
        aria-hidden
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
