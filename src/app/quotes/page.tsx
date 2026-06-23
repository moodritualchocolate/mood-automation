"use client";

import { QuoteForm } from "@/components/quote-form";
import { PageHeader } from "@/components/ui/page-header";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
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
        title={t("quotes.title")}
        subtitle={t("quotes.subtitle")}
        action={
          canEdit(role) && (
            <Button variant="primary" onClick={() => setOpen(true)}>
              <Plus size={16} />
              {t("quotes.add")}
            </Button>
          )
        }
      />
      {quotes.length === 0 ? (
        <EmptyState icon={<Receipt size={28} />} title={t("quotes.empty")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted">
                <th className="px-4 py-3 text-start font-medium">{t("common.supplier")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("common.material")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("quotes.pricePerKg")}</th>
                <th className="hidden px-4 py-3 text-start font-medium sm:table-cell">{t("quotes.moq")}</th>
                <th className="hidden px-4 py-3 text-start font-medium md:table-cell">{t("quotes.leadTime")}</th>
                <th className="hidden px-4 py-3 text-start font-medium lg:table-cell">{t("quotes.paymentTerms")}</th>
                <th className="hidden px-4 py-3 text-start font-medium md:table-cell">{t("common.date")}</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const isBest = best != null && q.pricePerKg === best;
                return (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link href={`/suppliers/${q.supplierId}`} className="font-medium text-brand hover:underline">
                        {supplierName(q.supplierId)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{q.material || "—"}</td>
                    <td className="px-4 py-3">
                      {q.pricePerKg != null ? (
                        <span className={isBest ? "chip border-transparent bg-success/12 font-semibold text-success" : "font-semibold"}>
                          {q.pricePerKg.toFixed(2)}€{isBest && ` · ${t("compare.bestPrice")}`}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">{q.moq || "—"}</td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">{q.leadTime || "—"}</td>
                    <td className="hidden px-4 py-3 text-muted lg:table-cell">{q.paymentTerms || "—"}</td>
                    <td className="hidden px-4 py-3 text-faint md:table-cell">{formatDate(q.date, lang)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <QuoteForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
