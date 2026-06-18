"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button, EmptyState, Select } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, Plus } from "lucide-react";
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

  const filtered = useMemo(() => {
    const list = tasks.filter((t) =>
      filter === "all" ? true : filter === "open" ? !t.done : t.done,
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
      <PageHeader title={t("tasks.title")} subtitle={t("tasks.subtitle")} />

      {editable && (
        <form
          className="mb-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            addTask({ title: title.trim(), supplierId: supplierId || undefined });
            setTitle("");
          }}
        >
          <input
            className="input-base flex-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("tasks.placeholder")}
          />
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="sm:w-48">
            <option value="">{t("common.none")}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.company}
              </option>
            ))}
          </Select>
          <Button variant="primary" type="submit">
            <Plus size={16} />
            {t("action.add")}
          </Button>
        </form>
      )}

      <div className="mb-4 inline-flex rounded-lg border border-border bg-surface p-0.5 text-sm">
        {(["open", "done", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition",
              filter === f ? "bg-brand text-brand-fg" : "text-muted hover:text-fg",
            )}
          >
            {t(`tasks.${f}` as const)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={28} />} title={t("tasks.empty")} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((tk) => (
            <li
              key={tk.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <input
                type="checkbox"
                checked={tk.done}
                disabled={!editable}
                onChange={() => toggleTask(tk.id)}
                className="h-4 w-4 accent-[rgb(var(--brand))]"
              />
              <div className="min-w-0 flex-1">
                <div className={cn("text-sm", tk.done && "text-faint line-through")}>
                  {tk.title}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  {tk.supplierId && (
                    <Link href={`/suppliers/${tk.supplierId}`} className="text-brand hover:underline">
                      {supplierName(tk.supplierId)}
                    </Link>
                  )}
                  {tk.dueDate && (
                    <span className={cn("flex items-center gap-1", isOverdue(tk.dueDate) && !tk.done && "font-medium text-danger")}>
                      <Clock size={12} /> {t("tasks.due")}: {formatDate(tk.dueDate, lang)}
                    </span>
                  )}
                </div>
              </div>
              {editable && (
                <button
                  onClick={() => deleteTask(tk.id)}
                  className="text-xs text-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
                >
                  {t("action.delete")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
