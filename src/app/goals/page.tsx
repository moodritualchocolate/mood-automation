"use client";

// Goal Engine · the user defines OUTCOMES, not tasks. Each new goal is
// decomposed into starter tasks by a playbook, and progress is computed
// live from the world model on every render + autonomy cycle.

import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import {
  Button, Card, Chip, EmptyState, Field, Input, Select,
} from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";
import { goalPlaybook, goalProgress, useOsStore } from "@/lib/os/osStore";
import { buildWorldModel } from "@/lib/os/worldModel";
import type { GoalKind } from "@/lib/os/types";
import { SUPPLIER_CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Plus, Target, Trash2, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import type { DictKey } from "@/lib/i18n/dictionary";

const GOAL_KINDS: GoalKind[] = [
  "approve_suppliers", "collect_quotes", "test_samples", "reduce_price", "clear_tasks",
];

export default function GoalsPage() {
  const { t, lang } = useI18n();
  const role = useStore((s) => s.role);
  const editable = canEdit(role);
  const data = useStore();
  const goals = useOsStore((s) => s.goals);
  const addGoal = useOsStore((s) => s.addGoal);
  const deleteGoal = useOsStore((s) => s.deleteGoal);
  const addTask = useStore((s) => s.addTask);
  const runCycle = useOsStore((s) => s.runCycle);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<GoalKind>("approve_suppliers");
  const [target, setTarget] = useState("3");
  const [category, setCategory] = useState("");

  const world = useMemo(
    () =>
      buildWorldModel({
        suppliers: data.suppliers,
        events: data.events,
        materials: data.materials,
        samples: data.samples,
        quotes: data.quotes,
        tasks: data.tasks,
        files: data.files,
      }),
    [data.suppliers, data.events, data.materials, data.samples, data.quotes, data.tasks, data.files],
  );

  const progressList = useMemo(
    () => goals.map((g) => goalProgress(g, world)),
    [goals, world],
  );

  const create = () => {
    const n = Number(target);
    if (!n && kind !== "clear_tasks") return;
    const kindLabel = t(`goals.kind.${kind}` as DictKey);
    const title =
      kind === "clear_tasks"
        ? kindLabel
        : `${kindLabel} · ${n}${category ? ` · ${t(`category.${category}` as DictKey)}` : ""}`;
    addGoal({
      kind,
      title,
      target: kind === "clear_tasks" ? 0 : n,
      category: category || undefined,
    });
    // Decompose · the playbook creates the starter tasks immediately.
    for (const taskTitle of goalPlaybook(kind, lang, category || undefined)) {
      addTask({ title: taskTitle });
    }
    setOpen(false);
    // Let the brain react to the new goal right away.
    setTimeout(() => runCycle(lang), 500);
  };

  return (
    <>
      <PageHeader
        eyebrow={t("os.agent.executive")}
        title={t("goals.title")}
        subtitle={t("goals.subtitle")}
        action={
          editable && (
            <Button variant="primary" leadingIcon={Plus} onClick={() => setOpen(true)}>
              {t("goals.new")}
            </Button>
          )
        }
      />

      {progressList.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t("goals.empty")}
          action={
            editable && (
              <Button variant="primary" leadingIcon={Plus} onClick={() => setOpen(true)}>
                {t("goals.new")}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
          {progressList.map(({ goal, current, target: tgt, pct, done }) => (
            <Card key={goal.id} interactive className="group flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      done ? "bg-success-soft text-success" : "bg-brand-soft text-brand",
                    )}>
                      {done ? <Trophy size={15} strokeWidth={2.2} /> : <Target size={15} strokeWidth={2.2} />}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-fg">{goal.title}</div>
                      {done && (
                        <Chip tone="success" size="sm" icon={CheckCircle2} className="mt-1">
                          {t("goals.achieved")}
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
                {editable && (
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-faint opacity-0 transition group-hover:opacity-100 hover:bg-danger-soft hover:text-danger"
                    aria-label={t("action.delete")}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="mono tabular text-[13px] font-semibold text-fg">
                    {goal.kind === "reduce_price"
                      ? `€${current.toFixed(2)} / €${tgt.toFixed(2)}`
                      : goal.kind === "clear_tasks"
                        ? `${current}`
                        : `${current} / ${tgt}`}
                  </span>
                  <span className={cn(
                    "mono text-[11.5px] font-semibold",
                    done ? "text-success" : "text-muted",
                  )}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-spring",
                      done ? "bg-success" : "bg-brand",
                    )}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("goals.new")}
        subtitle={t("goals.playbook.note")}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>{t("action.cancel")}</Button>
            <Button variant="primary" onClick={create}>{t("action.create")}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t("goals.title")}>
            <Select value={kind} onChange={(e) => setKind(e.target.value as GoalKind)}>
              {GOAL_KINDS.map((k) => (
                <option key={k} value={k}>{t(`goals.kind.${k}` as DictKey)}</option>
              ))}
            </Select>
          </Field>
          {kind !== "clear_tasks" && (
            <Field label={t("goals.target")}>
              <Input
                type="number"
                min={kind === "reduce_price" ? 0.1 : 1}
                step={kind === "reduce_price" ? 0.1 : 1}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="mono"
              />
            </Field>
          )}
          {kind === "approve_suppliers" && (
            <Field label={t("suppliers.category")} hint={t("common.optional")}>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">{t("category.all")}</option>
                {SUPPLIER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`category.${c}` as DictKey)}</option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      </Modal>
    </>
  );
}
