"use client";

import { SampleForm } from "@/components/sample-form";
import { PageHeader } from "@/components/ui/page-header";
import { Button, Card, Chip, EmptyState, ScoreBadge } from "@/components/ui/primitives";
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
        meta={
          samples.length > 0 && (
            <Chip tone="neutral" size="sm">
              <span className="mono">{samples.length}</span>
              {t("supplier.samples")}
            </Chip>
          )
        }
        action={
          canEdit(role) && (
            <Button variant="primary" leadingIcon={Plus} onClick={() => setOpen(true)}>
              {t("samples.add")}
            </Button>
          )
        }
      />

      {samples.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title={t("samples.empty")}
          action={
            canEdit(role) && (
              <Button variant="primary" leadingIcon={Plus} onClick={() => setOpen(true)}>
                {t("samples.add")}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {samples.map((s) => (
            <Card key={s.id} interactive className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/suppliers/${s.supplierId}`}
                    className="block truncate text-[14px] font-semibold text-fg hover:text-brand"
                  >
                    {supplierName(s.supplierId)}
                  </Link>
                  <div className="mt-0.5 truncate text-[12.5px] text-fg-2">
                    {s.material || t("common.material")}
                  </div>
                  <div className="mono mt-0.5 text-[11px] text-faint">
                    {formatDate(s.date, lang)}
                  </div>
                </div>
                <ScoreBadge score={s.finalScore} size="lg" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  [t("samples.taste"), s.taste],
                  [t("samples.texture"), s.texture],
                  [t("samples.melt"), s.melt],
                ].map(([label, val], i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border-soft bg-surface-2/50 py-2"
                  >
                    <div className="mono tabular text-[15px] font-semibold text-fg">
                      {(val as number) ?? "—"}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted">
                      {label as string}
                    </div>
                  </div>
                ))}
              </div>

              {s.suitable != null && (
                <div>
                  {s.suitable ? (
                    <Chip tone="success" size="sm" icon={CheckCircle2}>
                      {t("samples.suitable")}
                    </Chip>
                  ) : (
                    <Chip tone="danger" size="sm" icon={XCircle}>
                      {t("common.no")}
                    </Chip>
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
