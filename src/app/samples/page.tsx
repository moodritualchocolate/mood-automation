"use client";

import { SampleForm } from "@/components/sample-form";
import { PageHeader } from "@/components/ui/page-header";
import { Button, Card, EmptyState, ScoreBadge } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, FlaskConical, Plus, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function SamplesPage() {
  const { t, lang } = useI18n();
  const role = useStore((s) => s.role);
  const allSamples = useStore((s) => s.samples);
  const samples = useMemo(
    () => [...allSamples].sort((a, b) => b.date.localeCompare(a.date)),
    [allSamples],
  );
  const suppliers = useStore((s) => s.suppliers);
  const [open, setOpen] = useState(false);

  const supplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.company ?? "—";

  return (
    <>
      <PageHeader
        eyebrow={t("nav.section.sourcing")}
        title={t("samples.title")}
        subtitle={t("samples.subtitle")}
        action={
          canEdit(role) && (
            <Button variant="primary" leadingIcon={Plus} onClick={() => setOpen(true)}>
              {t("samples.add")}
            </Button>
          )
        }
      />
      {samples.length === 0 ? (
        <EmptyState icon={<FlaskConical size={28} />} title={t("samples.empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {samples.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-2">
                <Link href={`/suppliers/${s.supplierId}`} className="text-sm font-semibold text-brand hover:underline">
                  {supplierName(s.supplierId)}
                </Link>
                <ScoreBadge score={s.finalScore} />
              </div>
              <div className="mt-1 text-sm">{s.material || t("common.material")}</div>
              <div className="text-xs text-muted">{formatDate(s.date, lang)}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  [t("samples.taste"), s.taste],
                  [t("samples.texture"), s.texture],
                  [t("samples.melt"), s.melt],
                ].map(([label, val], i) => (
                  <div key={i} className="rounded-lg bg-surface-2 py-1.5">
                    <div className="text-sm font-semibold tabular-nums">{(val as number) ?? "—"}</div>
                    <div className="text-[10px] text-muted">{label as string}</div>
                  </div>
                ))}
              </div>
              {s.suitable != null && (
                <div className="mt-3">
                  {s.suitable ? (
                    <span className="chip border-transparent bg-success/12 text-success">
                      <CheckCircle2 size={13} /> {t("samples.suitable")}
                    </span>
                  ) : (
                    <span className="chip border-transparent bg-danger/12 text-danger">
                      <XCircle size={13} /> {t("common.no")}
                    </span>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <SampleForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
