"use client";

import { Modal } from "@/components/ui/modal";
import { Button, Field, Select, Textarea } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/status";
import { useI18n } from "@/lib/i18n/provider";
import { parseConversation } from "@/lib/parse";
import { useStore } from "@/lib/store";
import { SUPPLIER_STATUSES, type EventType, type SupplierStatus } from "@/lib/types";
import { nowISO } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

const EVENT_TYPES: EventType[] = ["call", "email", "meeting", "note", "sample", "quote"];

export function LogConversation({
  open,
  onClose,
  supplierId: fixedSupplierId,
}: {
  open: boolean;
  onClose: () => void;
  supplierId?: string;
}) {
  const { t } = useI18n();
  const suppliers = useStore((s) => s.suppliers);
  const addEvent = useStore((s) => s.addEvent);
  const setStatus = useStore((s) => s.setStatus);
  const addTask = useStore((s) => s.addTask);

  const [text, setText] = useState("");
  const [supplierId, setSupplierId] = useState(fixedSupplierId ?? "");
  const [eventType, setEventType] = useState<EventType>("note");
  const [status, setStatusSel] = useState<SupplierStatus | "">("");
  const [tasks, setTasks] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  // Live parse of the free-text note.
  const parsed = useMemo(
    () => parseConversation(text, suppliers),
    [text, suppliers],
  );

  // Apply detections (only until the user manually overrides a field).
  const onChangeText = (val: string) => {
    setText(val);
    const p = parseConversation(val, suppliers);
    if (!touched) {
      setEventType(p.eventType);
      setStatusSel(p.suggestedStatus ?? "");
      setTasks(p.suggestedTasks);
      if (!fixedSupplierId && p.supplierId) setSupplierId(p.supplierId);
    }
  };

  const reset = () => {
    setText("");
    setEventType("note");
    setStatusSel("");
    setTasks([]);
    setTouched(false);
    if (!fixedSupplierId) setSupplierId("");
  };

  const submit = () => {
    const sid = supplierId || fixedSupplierId;
    if (!sid || !text.trim()) return;
    addEvent({ supplierId: sid, type: eventType, text: text.trim(), date: nowISO() });
    if (status) setStatus(sid, status);
    for (const title of tasks) addTask({ supplierId: sid, title });
    reset();
    onClose();
  };

  const canSubmit = Boolean((supplierId || fixedSupplierId) && text.trim());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("timeline.add")}
      footer={
        <>
          <Button onClick={onClose}>{t("action.cancel")}</Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit}>
            {t("action.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!fixedSupplierId && (
          <Field label={t("common.supplier")}>
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label={t("timeline.add")} hint={t("timeline.logHint")}>
          <Textarea
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder={t("timeline.placeholder")}
            className="min-h-[130px]"
            autoFocus
          />
        </Field>

        {/* Smart detections */}
        {(parsed.suggestedStatus ||
          parsed.suggestedTasks.length > 0 ||
          parsed.matchedSupplierName) && (
          <div className="rounded-xl border border-brand/30 bg-brand-soft/60 p-3 text-sm">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand">
              <Sparkles size={14} />
              {t("timeline.detected")}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {status && (
                <span className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">{t("timeline.parsedStatus")}:</span>
                  <StatusBadge status={status} />
                </span>
              )}
            </div>
            {tasks.length > 0 && (
              <ul className="mt-2 space-y-1">
                {tasks.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg bg-surface px-2.5 py-1.5 text-xs"
                  >
                    <span>✓ {task}</span>
                    <button
                      onClick={() => setTasks(tasks.filter((_, j) => j !== i))}
                      className="text-faint hover:text-danger"
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("event.type")}>
            <Select
              value={eventType}
              onChange={(e) => {
                setTouched(true);
                setEventType(e.target.value as EventType);
              }}
            >
              {EVENT_TYPES.map((ev) => (
                <option key={ev} value={ev}>
                  {t(`event.${ev}` as const)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("suppliers.status")} hint={t("common.optional")}>
            <Select
              value={status}
              onChange={(e) => {
                setTouched(true);
                setStatusSel(e.target.value as SupplierStatus | "");
              }}
            >
              <option value="">—</option>
              {SUPPLIER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}` as const)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
