"use client";

import { Modal } from "@/components/ui/modal";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import type { Quote } from "@/lib/types";
import { nowISO } from "@/lib/utils";
import { useState } from "react";

export function QuoteForm({
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
  const addQuote = useStore((s) => s.addQuote);

  const [q, setQ] = useState<Partial<Quote>>({
    supplierId: fixedSupplierId,
    date: nowISO(),
  });
  const set = <K extends keyof Quote>(k: K, v: Quote[K]) =>
    setQ((prev) => ({ ...prev, [k]: v }));

  const submit = () => {
    const sid = q.supplierId ?? fixedSupplierId;
    if (!sid) return;
    addQuote({ ...(q as Quote), supplierId: sid, date: q.date ?? nowISO() });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("quotes.add")}
      footer={
        <>
          <Button onClick={onClose}>{t("action.cancel")}</Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={!(q.supplierId ?? fixedSupplierId)}
          >
            {t("action.save")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!fixedSupplierId && (
          <Field label={t("common.supplier")} className="sm:col-span-2">
            <Select
              value={q.supplierId ?? ""}
              onChange={(e) => set("supplierId", e.target.value)}
            >
              <option value="">—</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.company}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t("common.material")} className="sm:col-span-2">
          <Input value={q.material ?? ""} onChange={(e) => set("material", e.target.value)} />
        </Field>
        <Field label={t("quotes.pricePerKg")} hint="€">
          <Input
            type="number"
            step={0.1}
            value={q.pricePerKg ?? ""}
            onChange={(e) =>
              set("pricePerKg", e.target.value === "" ? (undefined as never) : Number(e.target.value))
            }
          />
        </Field>
        <Field label={t("quotes.moq")}>
          <Input value={q.moq ?? ""} onChange={(e) => set("moq", e.target.value)} placeholder="25 kg" />
        </Field>
        <Field label={t("quotes.leadTime")}>
          <Input value={q.leadTime ?? ""} onChange={(e) => set("leadTime", e.target.value)} placeholder="30 days" />
        </Field>
        <Field label={t("quotes.paymentTerms")}>
          <Input value={q.paymentTerms ?? ""} onChange={(e) => set("paymentTerms", e.target.value)} />
        </Field>
        <Field label={t("common.date")}>
          <Input
            type="date"
            value={(q.date ?? "").slice(0, 10)}
            onChange={(e) => set("date", new Date(e.target.value).toISOString())}
          />
        </Field>
        <Field label={t("common.notes")} className="sm:col-span-2">
          <Textarea value={q.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
