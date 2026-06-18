"use client";

import { Modal } from "@/components/ui/modal";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import type { Sample } from "@/lib/types";
import { nowISO } from "@/lib/utils";
import { useState } from "react";

function num(v: string): number | undefined {
  return v === "" ? undefined : Number(v);
}

export function SampleForm({
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
  const materials = useStore((s) => s.materials);
  const addSample = useStore((s) => s.addSample);

  const [s, setS] = useState<Partial<Sample>>({
    supplierId: fixedSupplierId,
    date: nowISO(),
    suitable: undefined,
  });
  const set = <K extends keyof Sample>(k: K, v: Sample[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const supplierMaterials = materials.filter(
    (m) => m.supplierId === (s.supplierId ?? fixedSupplierId),
  );

  const submit = () => {
    const sid = s.supplierId ?? fixedSupplierId;
    if (!sid) return;
    addSample({ ...(s as Sample), supplierId: sid, date: s.date ?? nowISO() });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("samples.add")}
      footer={
        <>
          <Button onClick={onClose}>{t("action.cancel")}</Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={!(s.supplierId ?? fixedSupplierId)}
          >
            {t("action.save")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!fixedSupplierId && (
          <Field label={t("common.supplier")}>
            <Select
              value={s.supplierId ?? ""}
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
        <Field label={t("common.material")}>
          <Select
            value={s.materialId ?? ""}
            onChange={(e) => {
              const mat = supplierMaterials.find((m) => m.id === e.target.value);
              set("materialId", e.target.value);
              if (mat) set("material", t(`material.${mat.kind}` as const));
            }}
          >
            <option value="">—</option>
            {supplierMaterials.map((m) => (
              <option key={m.id} value={m.id}>
                {t(`material.${m.kind}` as const)} {m.variety ? `· ${m.variety}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.date")}>
          <Input
            type="date"
            value={(s.date ?? "").slice(0, 10)}
            onChange={(e) => set("date", new Date(e.target.value).toISOString())}
          />
        </Field>
        <Field label={t("samples.taste")} hint="0–10">
          <Input type="number" min={0} max={10} value={s.taste ?? ""} onChange={(e) => set("taste", num(e.target.value) as number)} />
        </Field>
        <Field label={t("samples.texture")} hint="0–10">
          <Input type="number" min={0} max={10} value={s.texture ?? ""} onChange={(e) => set("texture", num(e.target.value) as number)} />
        </Field>
        <Field label={t("samples.melt")} hint="0–10">
          <Input type="number" min={0} max={10} value={s.melt ?? ""} onChange={(e) => set("melt", num(e.target.value) as number)} />
        </Field>
        <Field label={t("samples.finalScore")} hint="0–10">
          <Input type="number" min={0} max={10} step={0.5} value={s.finalScore ?? ""} onChange={(e) => set("finalScore", num(e.target.value) as number)} />
        </Field>
        <Field label={t("samples.suitable")}>
          <Select
            value={s.suitable == null ? "" : s.suitable ? "1" : "0"}
            onChange={(e) => set("suitable", e.target.value === "1")}
          >
            <option value="">—</option>
            <option value="1">{t("common.yes")}</option>
            <option value="0">{t("common.no")}</option>
          </Select>
        </Field>
        <Field label={t("samples.impression")} className="sm:col-span-2">
          <Textarea value={s.impression ?? ""} onChange={(e) => set("impression", e.target.value)} />
        </Field>
        <Field label={t("samples.aftertaste")} className="sm:col-span-2">
          <Input value={s.aftertaste ?? ""} onChange={(e) => set("aftertaste", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
