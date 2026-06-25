"use client";

import { QuoteForm } from "@/components/quote-form";
import { PageHeader } from "@/components/ui/page-header";
import { Button, Chip, EmptyState } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function QuotesPage() {
  const { t, lang } = useI18n();
  const role = useStore((s) => s.role);
  const allQuotes = useStore((s) => s.quotes);
  const quotes = useMemo(
    () => [...allQuotes].sort((a, b) => b.date.localeCompare(a.date)),
    [allQuotes],
  );
  const suppliers = useStore((s) => s.suppliers);
  const [open, setOpen] = useState(false);

  const supplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.company ?? "—";

  const best = useMemo(() => {
    const priced = quotes.filter((q) => q.pricePerKg != null);
    return priced.length ? Math.min(...priced.map((q) => q.pricePerKg!)) : null;
  }, [quotes]);

  return (
    <>
      <PageHeader
        eyebrow={t("nav.section.sourcing")}
        title={t("quotes.title")}
        subtitle={t("quotes.subtitle")}
        meta={
          quotes.length > 0 && (
            <>
              <Chip tone="neutral" size="sm">
                <span className="mono">{quotes.length}</span>
                {t("nav.quotes")}
              </Chip>
              {best != null && (
                <Chip tone="success" size="sm">
                  {t("compare.bestPrice")}
                  <span className="mono font-semibold">€{best.toFixed(2)}</span>
                </Chip>
              )}
            </>
          )
        }
        action={
          canEdit(role) && (
            <Button variant="primary" leadingIcon={Plus} onClick={() => setOpen(true)}>
              {t("quotes.add")}
            </Button>
          )
        }
      />

      {quotes.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t("quotes.empty")}
          hint="הוסף את ההצעה הראשונה כדי להתחיל להשוות מחירים."
          action={
            canEdit(role) && (
              <Button variant="primary" leadingIcon={Plus} onClick={() => setOpen(true)}>
                {t("quotes.add")}
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-surface-2/40">
                <tr className="border-b border-border text-start text-[10.5px] uppercase tracking-[0.06em] text-faint">
                  <th className="px-4 py-3 text-start font-semibold">{t("common.supplier")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("common.material")}</th>
                  <th className="px-4 py-3 text-end font-semibold">{t("quotes.pricePerKg")}</th>
                  <th className="hidden px-4 py-3 text-start font-semibold sm:table-cell">{t("quotes.moq")}</th>
                  <th className="hidden px-4 py-3 text-start font-semibold md:table-cell">{t("quotes.leadTime")}</th>
                  <th className="hidden px-4 py-3 text-start font-semibold lg:table-cell">{t("quotes.paymentTerms")}</th>
                  <th className="hidden px-4 py-3 text-end font-semibold md:table-cell">{t("common.date")}</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const isBest = best != null && q.pricePerKg === best;
                  return (
                    <tr
                      key={q.id}
                      className="border-b border-border-soft last:border-0 transition-colors hover:bg-surface-2/60"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/suppliers/${q.supplierId}`}
                          className="font-semibold text-fg hover:text-brand"
                        >
                          {supplierName(q.supplierId)}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-fg-2">{q.material || "—"}</td>
                      <td className="mono px-4 py-3.5 text-end tabular">
                        {q.pricePerKg != null ? (
                          isBest ? (
                            <Chip tone="success" size="sm" className="font-semibold">
                              €{q.pricePerKg.toFixed(2)}
                              <span className="text-[9.5px] uppercase tracking-wider opacity-80">best</span>
                            </Chip>
                          ) : (
                            <span className="font-semibold text-fg">€{q.pricePerKg.toFixed(2)}</span>
                          )
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="mono hidden px-4 py-3.5 text-fg-2 sm:table-cell">{q.moq || "—"}</td>
                      <td className="hidden px-4 py-3.5 text-fg-2 md:table-cell">{q.leadTime || "—"}</td>
                      <td className="hidden px-4 py-3.5 text-fg-2 lg:table-cell">{q.paymentTerms || "—"}</td>
                      <td className="mono hidden px-4 py-3.5 text-end text-faint md:table-cell">
                        {formatDate(q.date, lang)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <QuoteForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
