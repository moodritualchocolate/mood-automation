"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button, Card, Chip, EmptyState, Input, Select } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Filter = "open" | "done" | "all";

export default function TasksPage() {
  const { t, lang } = useI18n();
  const role = useStore((s) => s.role);
  const editable = canEdit(role);
  const tasks = useStore((s) => s.tasks);
  const suppliers = useStore((s) => s.suppliers);
  const addTask = useStore((s) => s.addTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [filter, setFilter] = useState<Filter>("open");
  const [title, setTitle] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const supplierName = (id?: string) =>
    suppliers.find((s) => s.id === id)?.company ?? "";

  const counts = useMemo(() => {
    const open = tasks.filter((tk) => !tk.done).length;
    const done = tasks.filter((tk) => tk.done).length;
    return { open, done, all: tasks.length };
  }, [tasks]);

  const filtered = useMemo(() => {
    const list = tasks.filter((tk) =>
      filter === "all" ? true : filter === "open" ? !tk.done : tk.done,
    );
    return [...list].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const ad = a.dueDate ?? "9999";
      const bd = b.dueDate ?? "9999";
      return ad.localeCompare(bd);
    });
  }, [tasks, filter]);

  const isOverdue = (due?: string) =>
    due && new Date(due).getTime() < Date.now();

  return (
    <>
      <PageHeader
        eyebrow={t("nav.section.decide")}
        title={t("tasks.title")}
        subtitle={t("tasks.subtitle")}
        meta={
          tasks.length > 0 && (
            <>
              <Chip tone={counts.open > 0 ? "warning" : "neutral"} size="sm">
                <span className="mono">{counts.open}</span>
                {t("tasks.open")}
              </Chip>
              {counts.done > 0 && (
                <Chip tone="success" size="sm">
                  <span className="mono">{counts.done}</span>
                  {t("tasks.done")}
                </Chip>
              )}
            </>
          )
        }
      />

      {/* Quick-add row */}
      {editable && (
        <Card className="mb-5 !p-3">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              addTask({ title: title.trim(), supplierId: supplierId || undefined });
              setTitle("");
            }}
          >
            <Input
              className="flex-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("tasks.placeholder")}
            />
            <Select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="sm:w-48"
            >
              <option value="">{t("common.none")}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company}
                </option>
              ))}
            </Select>
            <Button variant="primary" type="submit" leadingIcon={Plus}>
              {t("action.add")}
            </Button>
          </form>
        </Card>
      )}

      {/* Filter pills */}
      <div className="mb-4 inline-flex gap-0.5 rounded-lg border border-border bg-surface-2 p-0.5">
        {(["open", "done", "all"] as Filter[]).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150",
                active
                  ? "bg-surface text-fg shadow-sm"
                  : "text-muted hover:text-fg-2",
              )}
            >
              {t(`tasks.${f}` as const)}
              <span className={cn("mono text-[11px]", active ? "text-fg-2" : "text-faint")}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={t("tasks.empty")} />
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((tk) => {
            const overdue = isOverdue(tk.dueDate) && !tk.done;
            return (
              <li
                key={tk.id}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border bg-surface px-4 py-3 transition-all duration-150",
                  overdue ? "border-danger/30 bg-danger-soft/30" : "border-border-soft hover:border-border-strong hover:shadow-sm",
                )}
              >
                <label className="flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={tk.done}
                    disabled={!editable}
                    onChange={() => toggleTask(tk.id)}
                    className="peer sr-only"
                  />
                  <span className={cn(
                    "flex h-[18px] w-[18px] items-center justify-center rounded-md border-2 transition-all",
                    tk.done
                      ? "border-success bg-success text-white"
                      : "border-border-strong bg-surface hover:border-brand",
                  )}>
                    {tk.done && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="m5 12 4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </label>
                <div className="min-w-0 flex-1">
                  <div className={cn(
                    "text-[13.5px] font-medium",
                    tk.done ? "text-faint line-through" : "text-fg",
                  )}>
                    {tk.title}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11.5px]">
                    {tk.supplierId && (
                      <Link
                        href={`/suppliers/${tk.supplierId}`}
                        className="font-medium text-muted hover:text-brand"
                      >
                        {supplierName(tk.supplierId)}
                      </Link>
                    )}
                    {tk.dueDate && (
                      <span className={cn(
                        "mono flex items-center gap-1",
                        overdue ? "font-semibold text-danger" : "text-faint",
                      )}>
                        <Clock size={11} strokeWidth={2.2} />
                        {formatDate(tk.dueDate, lang)}
                      </span>
                    )}
                  </div>
                </div>
                {editable && (
                  <button
                    onClick={() => deleteTask(tk.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-faint opacity-0 transition hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                    aria-label={t("action.delete")}
                  >
                    <Trash2 size={14} strokeWidth={2.2} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
