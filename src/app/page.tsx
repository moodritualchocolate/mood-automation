"use client";

// Executive Dashboard · outcomes-first.
//
// The user opens this screen and sees what the autonomous organization
// already accomplished, which decisions genuinely need human judgment,
// how healthy the business is, and how goals are progressing. Tools
// live in the sidebar; this screen shows results.

import { LogConversation } from "@/components/log-conversation";
import { StatusBadge, STATUS_DOT } from "@/components/status";
import {
  Button, Card, Chip, EmptyState, ScoreBadge, SectionHeading, Skeleton,
} from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";
import { useOsStore, goalProgress } from "@/lib/os/osStore";
import { buildWorldModel, healthScore } from "@/lib/os/worldModel";
import { AGENTS } from "@/lib/os/agents";
import { SUPPLIER_STATUSES } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import type { DictKey } from "@/lib/i18n/dictionary";
import {
  AlertTriangle, ArrowUpRight, Bot, Building2, Check, CheckCircle2,
  Clock, FlaskConical, type LucideIcon, Plus, Receipt, RefreshCw,
  Sparkles, Target, TrendingUp, X, Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function ExecutiveDashboard() {
  const { t, lang } = useI18n();
  const hydrated = useStore((s) => s.hydrated);
  const role = useStore((s) => s.role);
  const data = useStore();
  const [logOpen, setLogOpen] = useState(false);

  const initiatives = useOsStore((s) => s.initiatives);
  const goals = useOsStore((s) => s.goals);
  const lastCycleAt = useOsStore((s) => s.lastCycleAt);
  const autonomyEnabled = useOsStore((s) => s.autonomyEnabled);
  const setAutonomy = useOsStore((s) => s.setAutonomy);
  const runCycle = useOsStore((s) => s.runCycle);
  const approveInitiative = useOsStore((s) => s.approveInitiative);
  const dismissInitiative = useOsStore((s) => s.dismissInitiative);

  const world = useMemo(
    () =>
      buildWorldModel({
        suppliers: data.suppliers, events: data.events, materials: data.materials,
        samples: data.samples, quotes: data.quotes, tasks: data.tasks, files: data.files,
      }),
    [data.suppliers, data.events, data.materials, data.samples, data.quotes, data.tasks, data.files],
  );

  const health = useMemo(() => healthScore(world), [world]);

  const pending = useMemo(
    () => initiatives.filter((i) => i.status === "pending"),
    [initiatives],
  );
  const executed = useMemo(
    () =>
      initiatives
        .filter((i) => i.status === "auto_executed" || i.status === "approved")
        .slice(0, 10),
    [initiatives],
  );
  const executedToday = useMemo(() => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    return initiatives.filter(
      (i) =>
        (i.status === "auto_executed" || i.status === "approved") &&
        i.resolvedAt && new Date(i.resolvedAt) >= dayStart,
    ).length;
  }, [initiatives]);

  const goalsProgress = useMemo(
    () => goals.slice(0, 4).map((g) => goalProgress(g, world)),
    [goals, world],
  );

  const agentActivity = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of initiatives) {
      if (i.status === "auto_executed" || i.status === "approved")
        counts.set(i.agent, (counts.get(i.agent) ?? 0) + 1);
    }
    return AGENTS.filter((a) => a.id !== "executive").map((a) => ({
      ...a, done: counts.get(a.id) ?? 0,
    }));
  }, [initiatives]);

  const pipeline = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of data.suppliers) counts.set(s.status, (counts.get(s.status) ?? 0) + 1);
    const total = data.suppliers.length || 1;
    return SUPPLIER_STATUSES.map((status) => ({
      status, count: counts.get(status) ?? 0, pct: ((counts.get(status) ?? 0) / total) * 100,
    })).filter((p) => p.count > 0);
  }, [data.suppliers]);

  const supplierName = (id?: string) =>
    data.suppliers.find((s) => s.id === id)?.company ?? "";

  if (!hydrated) return <DashboardSkeleton />;

  const hour = new Date().getHours();
  const greetingKey: DictKey =
    hour < 12 ? "dashboard.greeting.morning"
    : hour < 18 ? "dashboard.greeting.afternoon"
    : "dashboard.greeting.evening";

  return (
    <>
      {/* ─── Hero · while you were away ──────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface bg-warm">
        <div className="relative flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2.5">
            <div className="eyebrow flex items-center gap-2">
              <span className={cn(
                "pulse-dot",
                autonomyEnabled ? "bg-success text-success" : "bg-faint text-faint",
              )} aria-hidden />
              {t("os.autonomy")} · {autonomyEnabled ? t("os.autonomy.on") : t("os.autonomy.off")}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              {t(greetingKey)}
              <span className="text-muted"> · </span>
              <span className="text-fg-2">{t("os.whileAway")}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Chip tone="success" size="sm" icon={Zap}>
                <span className="mono font-semibold">{executedToday}</span>
                {t("os.autoExecuted")}
              </Chip>
              <Chip tone={pending.length > 0 ? "warning" : "neutral"} size="sm" icon={AlertTriangle}>
                <span className="mono font-semibold">{pending.length}</span>
                {t("os.pendingDecisions")}
              </Chip>
              {lastCycleAt && (
                <span className="mono text-[11px] text-faint">
                  {t("os.lastCycle")}: {relativeTime(lastCycleAt, lang)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {canEdit(role) && (
                <>
                  <Button size="sm" leadingIcon={RefreshCw} onClick={() => runCycle(lang)}>
                    {t("os.runNow")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAutonomy(!autonomyEnabled)}
                  >
                    {autonomyEnabled ? t("os.autonomy.off") : t("os.autonomy.on")}
                  </Button>
                  <Button size="sm" variant="ghost" leadingIcon={Plus} onClick={() => setLogOpen(true)}>
                    {t("timeline.add")}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Health ring */}
          <div className="flex items-center gap-4">
            <HealthRing value={health} />
            <div className="space-y-0.5">
              <div className="eyebrow">{t("os.health")}</div>
              <div className="mono text-3xl font-bold tabular leading-none text-fg">{health}</div>
              <div className="text-[11px] text-muted">/ 100</div>
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -top-24 -end-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgb(var(--brand) / 0.35), transparent)" }}
          aria-hidden
        />
      </div>

      {/* ─── Decisions queue · only what needs human judgment ─────── */}
      {pending.length > 0 && (
        <Card className="mt-5 border-warning/25">
          <SectionHeading
            eyebrow={t("os.agent.executive")}
            title={t("os.decisions.title")}
            action={<Chip tone="warning" size="sm">{pending.length}</Chip>}
          />
          <ul className="space-y-2">
            {pending.slice(0, 6).map((init) => {
              const agent = AGENTS.find((a) => a.id === init.agent);
              return (
                <li
                  key={init.id}
                  className="flex flex-col gap-3 rounded-xl border border-border-soft bg-surface-2/40 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px]" aria-hidden>{agent?.emoji}</span>
                      <span className="text-[13.5px] font-semibold text-fg">{init.title}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{init.detail}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Chip tone="neutral" size="sm">
                        {t("os.confidence")} <span className="mono">{Math.round(init.confidence * 100)}%</span>
                      </Chip>
                      <Chip tone="neutral" size="sm">
                        {t("os.impact")} <span className="mono">{init.impact}/10</span>
                      </Chip>
                    </div>
                  </div>
                  {canEdit(role) && (
                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="sm" variant="primary" leadingIcon={Check}
                        onClick={() => approveInitiative(init.id, lang)}>
                        {t("os.approve")}
                      </Button>
                      <Button size="sm" variant="ghost" leadingIcon={X}
                        onClick={() => dismissInitiative(init.id)}>
                        {t("os.dismiss")}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* ─── Activity + Goals/Agents ──────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <Card className="lg:col-span-2">
          <SectionHeading
            title={t("os.activity.title")}
            action={<Bot size={14} className="text-muted" />}
          />
          {executed.length === 0 ? (
            <EmptyState icon={Sparkles} title={t("os.activity.empty")} />
          ) : (
            <ul className="relative space-y-3">
              <span className="absolute inset-y-2 start-[5px] w-px bg-border-soft" aria-hidden />
              {executed.map((init) => {
                const agent = AGENTS.find((a) => a.id === init.agent);
                return (
                  <li key={init.id} className="relative flex gap-3">
                    <span className={cn(
                      "relative z-10 mt-1.5 h-[10px] w-[10px] shrink-0 rounded-full border-2 border-bg",
                      init.status === "approved" ? "bg-info" : "bg-success",
                    )} />
                    <div className="min-w-0 flex-1 -mt-0.5 rounded-md px-2 py-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span aria-hidden className="text-[13px]">{agent?.emoji}</span>
                          <span className="truncate text-[13px] font-semibold text-fg">
                            {init.title}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <Chip tone={init.status === "approved" ? "info" : "success"} size="sm">
                            {init.status === "approved" ? t("os.approved.badge") : t("os.executed.badge")}
                          </Chip>
                          {init.resolvedAt && (
                            <span className="mono hidden text-[10.5px] text-faint sm:inline">
                              {relativeTime(init.resolvedAt, lang)}
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-[12px] text-muted">
                        {agent ? t(agent.nameKey as DictKey) : init.agent}
                        {init.supplierId ? ` · ${supplierName(init.supplierId)}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4 lg:space-y-5">
          {/* Goals strip */}
          <Card>
            <SectionHeading
              title={t("goals.title")}
              action={
                <Link href="/goals" className="btn-ghost btn-sm">
                  {t("action.open")}
                  <ArrowUpRight size={13} />
                </Link>
              }
            />
            {goalsProgress.length === 0 ? (
              <EmptyState icon={Target} title={t("goals.empty")} className="!py-8" />
            ) : (
              <ul className="space-y-3">
                {goalsProgress.map(({ goal, pct, done }) => (
                  <li key={goal.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="truncate text-[12.5px] font-medium text-fg">{goal.title}</span>
                      <span className={cn(
                        "mono shrink-0 text-[11px] font-semibold",
                        done ? "text-success" : "text-muted",
                      )}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700 ease-spring",
                          done ? "bg-success" : "bg-brand")}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Agent organization */}
          <Card>
            <SectionHeading title={t("os.agent.executive")} />
            <ul className="space-y-1">
              {agentActivity.map((a) => (
                <li key={a.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                  <span className="text-[15px]" aria-hidden>{a.emoji}</span>
                  <span className="flex-1 truncate text-[12.5px] font-medium text-fg-2">
                    {t(a.nameKey as DictKey)}
                  </span>
                  <span className="mono text-[11.5px] tabular text-muted">{a.done}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* ─── Business stats (secondary) ───────────────────────────── */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label={t("dashboard.activeSuppliers")} value={world.suppliers.filter((s) => s.status !== "rejected" && s.status !== "new").length} icon={Building2} href="/suppliers" />
        <MiniStat label={t("dashboard.awaiting")} value={world.totals.awaiting} icon={Clock} href="/suppliers" />
        <MiniStat label={t("dashboard.samplesInTransit")} value={world.suppliers.filter((s) => s.status === "sample_requested").length} icon={FlaskConical} href="/samples" />
        <MiniStat label={t("dashboard.quotesReceived")} value={world.totals.quotes} icon={Receipt} href="/quotes" />
        <MiniStat label={t("dashboard.approved")} value={world.totals.approved} icon={CheckCircle2} href="/suppliers" />
        <MiniStat label={t("dashboard.openTasks")} value={world.totals.openTasks} icon={AlertTriangle} href="/tasks" />
      </div>

      {/* ─── Pipeline (kept · compact) ────────────────────────────── */}
      {pipeline.length > 0 && (
        <Card className="mt-5">
          <SectionHeading
            title={t("dashboard.pipeline")}
            action={
              <Link href="/suppliers" className="btn-ghost btn-sm">
                {t("action.open")}
                <ArrowUpRight size={13} />
              </Link>
            }
          />
          <div className="space-y-3">
            {pipeline.map((p) => (
              <div key={p.status} className="flex items-center gap-3">
                <div className="flex w-40 shrink-0 items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[p.status])} />
                  <span className="truncate text-[12.5px] font-medium text-fg-2">
                    {t(`status.${p.status}` as DictKey)}
                  </span>
                </div>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn("absolute inset-y-0 start-0 rounded-full transition-all duration-700 ease-spring", STATUS_DOT[p.status])}
                    style={{ width: `${Math.max(p.pct, 6)}%` }}
                  />
                </div>
                <span className="mono w-8 text-end text-[13px] font-semibold tabular text-fg">
                  {p.count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <LogConversation open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}

/* ─── Health ring · SVG progress circle ─────────────────────── */
function HealthRing({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const filled = (value / 100) * c;
  const tone = value >= 80 ? "rgb(var(--success))" : value >= 55 ? "rgb(var(--warning))" : "rgb(var(--danger))";
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
      <circle cx="38" cy="38" r={r} fill="none" stroke="rgb(var(--border))" strokeWidth="7" />
      <circle
        cx="38" cy="38" r={r} fill="none"
        stroke={tone} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  );
}

function MiniStat({
  label, value, icon: Icon, href,
}: {
  label: string; value: number; icon: LucideIcon; href: string;
}) {
  return (
    <Link href={href} className="card-interactive flex items-center gap-3 p-3.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <span className="min-w-0">
        <span className="mono block text-[18px] font-bold leading-none tabular text-fg">{value}</span>
        <span className="mt-0.5 block truncate text-[10.5px] text-muted">{label}</span>
      </span>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
