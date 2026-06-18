"use client";

import { Modal } from "@/components/ui/modal";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import {
  MATERIAL_KINDS,
  type MaterialKind,
  type RawMaterial,
} from "@/lib/types";
import { useState } from "react";

export function MaterialForm({
  open,
  onClose,
  supplierId,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  supplierId: string;
  existing?: RawMaterial;
}) {
  const { t } = useI18n();
  const addMaterial = useStore((s) => s.addMaterial);
  const updateMaterial = useStore((s) => s.updateMaterial);

  const [m, setM] = useState<Partial<RawMaterial>>(
    existing ?? { kind: "cocoa_mass", coa: false },
  );
  const set = <K extends keyof RawMaterial>(k: K, v: RawMaterial[K]) =>
    setM((prev) => ({ ...prev, [k]: v }));

  const kind = (m.kind ?? "cocoa_mass") as MaterialKind;

  const submit = () => {
    if (existing) {
      updateMaterial(existing.id, m);
    } else {
      addMaterial({ ...(m as RawMaterial), supplierId, kind });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? t("action.edit") : t("material.add")}
      footer={
        <>
          <Button onClick={onClose}>{t("action.cancel")}</Button>
          <Button variant="primary" onClick={submit}>
            {t("action.save")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("material.kind")} className="sm:col-span-2">
          <Select
            value={kind}
            onChange={(e) => set("kind", e.target.value as MaterialKind)}
          >
            {MATERIAL_KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`material.${k}` as const)}
              </option>
            ))}
          </Select>
        </Field>

        {/* Kind-specific fields */}
        {kind === "cocoa_mass" && (
          <>
            <Field label={t("material.variety")}>
              <Input value={m.variety ?? ""} onChange={(e) => set("variety", e.target.value)} />
            </Field>
            <Field label={t("material.origin")}>
              <Select
                value={m.origin ?? ""}
                onChange={(e) => set("origin", e.target.value as "single" | "blend")}
              >
                <option value="">—</option>
                <option value="single">{t("material.single")}</option>
                <option value="blend">{t("material.blend")}</option>
              </Select>
            </Field>
          </>
        )}
        {kind === "cocoa_butter" && (
          <Field label={t("material.coa") && t("material.deodorized")} className="sm:col-span-2">
            <Select
              value={m.deodorized == null ? "" : m.deodorized ? "1" : "0"}
              onChange={(e) => set("deodorized", e.target.value === "1")}
            >
              <option value="">—</option>
              <option value="1">{t("material.deodorized")}</option>
              <option value="0">{t("material.notDeodorized")}</option>
            </Select>
          </Field>
        )}
        {kind === "allulose" && (
          <Field label={t("material.purity")}>
            <Input value={m.purity ?? ""} onChange={(e) => set("purity", e.target.value)} placeholder="≥ 98%" />
          </Field>
        )}
        {kind === "lecithin" && (
          <Field label={t("material.source")}>
            <Select
              value={m.source ?? ""}
              onChange={(e) => set("source", e.target.value as "sunflower" | "soy")}
            >
              <option value="">—</option>
              <option value="sunflower">{t("material.sunflower")}</option>
              <option value="soy">{t("material.soy")}</option>
            </Select>
          </Field>
        )}

        <Field label={t("common.country")}>
          <Input value={m.country ?? ""} onChange={(e) => set("country", e.target.value)} />
        </Field>
        <Field label={t("material.productCode")}>
          <Input value={m.productCode ?? ""} onChange={(e) => set("productCode", e.target.value)} dir="ltr" />
        </Field>
        <Field label={t("material.moq")}>
          <Input value={m.moq ?? ""} onChange={(e) => set("moq", e.target.value)} placeholder="25 kg" />
        </Field>
        <Field label={t("common.price")}>
          <Input value={m.price ?? ""} onChange={(e) => set("price", e.target.value)} placeholder="9.2 €/kg" />
        </Field>
        <Field label={t("material.coa")}>
          <Select
            value={m.coa ? "1" : "0"}
            onChange={(e) => set("coa", e.target.value === "1")}
          >
            <option value="0">{t("common.no")}</option>
            <option value="1">{t("common.yes")}</option>
          </Select>
        </Field>
        <Field label={t("common.score")} hint="0–10">
          <Input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={m.score ?? ""}
            onChange={(e) =>
              set("score", e.target.value === "" ? (undefined as never) : Number(e.target.value))
            }
          />
        </Field>
        {(kind === "cocoa_mass" || kind === "cocoa_butter") && (
          <Field label={t("material.tasteNotes")} className="sm:col-span-2">
            <Textarea value={m.tasteNotes ?? ""} onChange={(e) => set("tasteNotes", e.target.value)} />
          </Field>
        )}
        <Field label={t("common.notes")} className="sm:col-span-2">
          <Textarea value={m.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
