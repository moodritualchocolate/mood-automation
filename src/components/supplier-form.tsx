"use client";

import { Modal } from "@/components/ui/modal";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { SUPPLIER_STATUSES, type Supplier } from "@/lib/types";
import { useState } from "react";

export function SupplierForm({
  open,
  onClose,
  existing,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Supplier;
  onCreated?: (id: string) => void;
}) {
  const { t } = useI18n();
  const addSupplier = useStore((s) => s.addSupplier);
  const updateSupplier = useStore((s) => s.updateSupplier);

  const [form, setForm] = useState({
    company: existing?.company ?? "",
    contact: existing?.contact ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    website: existing?.website ?? "",
    country: existing?.country ?? "",
    notes: existing?.notes ?? "",
    status: existing?.status ?? "new",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.company.trim()) return;
    if (existing) {
      updateSupplier(existing.id, { ...form, status: form.status as Supplier["status"] });
    } else {
      const s = addSupplier({ ...form, status: form.status as Supplier["status"] });
      onCreated?.(s.id);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? t("action.edit") : t("suppliers.new")}
      footer={
        <>
          <Button onClick={onClose}>{t("action.cancel")}</Button>
          <Button variant="primary" onClick={submit} disabled={!form.company.trim()}>
            {existing ? t("action.save") : t("action.create")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("suppliers.company")} className="sm:col-span-2">
          <Input
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            autoFocus
            placeholder="Barry Callebaut"
          />
        </Field>
        <Field label={t("suppliers.contact")}>
          <Input value={form.contact} onChange={(e) => set("contact", e.target.value)} />
        </Field>
        <Field label={t("suppliers.phone")}>
          <Input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            dir="ltr"
            inputMode="tel"
          />
        </Field>
        <Field label={t("suppliers.email")}>
          <Input
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            dir="ltr"
            inputMode="email"
          />
        </Field>
        <Field label={t("suppliers.website")}>
          <Input
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            dir="ltr"
            placeholder="https://"
          />
        </Field>
        <Field label={t("common.country")}>
          <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
        </Field>
        <Field label={t("suppliers.status")}>
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {SUPPLIER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}` as const)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.notes")} className="sm:col-span-2">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
