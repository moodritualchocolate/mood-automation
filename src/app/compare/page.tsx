"use client";

import { StatusBadge } from "@/components/status";
import { PageHeader } from "@/components/ui/page-header";
import { Card, Chip, EmptyState, ScoreBadge } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BarChart3, Check, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

interface Row {
  id: string;
  company: string;
  price?: number;
  moq?: string;
  country?: string;
  taste?: number;
  leadTime?: string;
  rating?: number;
  overall: number;
}

export default function ComparePage() {
  const { t } = useI18n();
  const { suppliers, quotes, samples, materials } = useStore();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const rows = useMemo<Row[]>(() => {
    return selected.map((id) => {
      const s = suppliers.find((x) => x.id === id)!;
      const qs = quotes.filter((q) => q.supplierId === id && q.pricePerKg != null);
      const price = qs.length ? Math.min(...qs.map((q) => q.pricePerKg!)) : undefined;
      const ss = samples.filter((x) => x.supplierId === id);
      const tasteArr = ss.map((x) => x.taste).filter((n): n is number => n != null);
      const taste = tasteArr.length ? tasteArr.reduce((a, b) => a + b, 0) / tasteArr.length : undefined;
      const ratingArr = ss.map((x) => x.finalScore).filter((n): n is number => n != null);
      const rating = ratingArr.length ? ratingArr.reduce((a, b) => a + b, 0) / ratingArr.length : undefined;
      const mat = materials.find((m) => m.supplierId === id);
      const q = qs[0];

      let overall = 0;
      let w = 0;
      if (rating != null) { overall += rating * 3; w += 3; }
      if (taste != null) { overall += taste * 2; w += 2; }
      if (materials.some((m) => m.supplierId === id && m.coa)) { overall += 8; w += 1; }
      if (s.status === "approved") { overall += 9; w += 1; }
      const overallScore = w ? overall / w : 0;

      return {
        id,
        company: s.company,
        price,
        moq: q?.moq ?? mat?.moq,
        country: s.country,
        taste,
        leadTime: q?.leadTime,
        rating,
        overall: overallScore,
      };
    });
  }, [selected, suppliers, quotes, samples, materials]);

  const bestPrice = useMemo(() => {
    const ps = rows.map((r) => r.price).filter((n): n is number => n != null);
    return ps.length ? Math.min(...ps) : null;
  }, [rows]);
  const bestOverall = useMemo(() => {
    const os = rows.map((r) => r.overall).filter((n) => n > 0);
    return os.length ? Math.max(...os) : null;
  }, [rows]);

  return (
    <>
      <PageHeader
        eyebrow={t("nav.section.decide")}
        title={t("compare.title")}
        subtitle={t("compare.subtitle")}
        meta={
          selected.length > 0 && (
            <Chip tone="brand" size="sm">
              <span className="mono">{selected.length}</span>
              {t("compare.pick")}
            </Chip>
          )
        }
      />

      {/* Supplier picker */}
      <Card className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="eyebrow">{t("compare.pick")}</div>
          {selected.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="text-[11.5px] font-medium text-muted hover:text-fg"
            >
              {t("action.cancel")}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {suppliers.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={cn(
                  "chip transition-all duration-150",
                  on
                    ? "border-brand bg-brand text-brand-fg shadow-sm"
                    : "border-border text-fg-2 hover:border-border-strong hover:bg-surface-2",
                )}
              >
                {on && <Check size={11} strokeWidth={2.6} />}
                {s.company}
              </button>
            );
          })}
        </div>
      </Card>

      {rows.length < 2 ? (
        <EmptyState
          icon={BarChart3}
          title={t("compare.empty")}
          hint="Select at least 2 suppliers above to compare."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-surface-2/40">
                <tr className="border-b border-border">
                  <th className="sticky start-0 z-10 bg-surface-2/80 px-4 py-3 text-start text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint backdrop-blur-sm">
                    {t("compare.metric")}
                  </th>
                  {rows.map((r) => (
                    <th key={r.id} className="px-4 py-3 text-start text-[13.5px] font-semibold text-fg">
                      {r.company}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow
                  label={t("suppliers.status")}
                  cells={rows.map((r) => {
                    const s = suppliers.find((x) => x.id === r.id)!;
                    return <StatusBadge key={r.id} status={s.status} size="sm" />;
                  })}
                />
                <CompareRow
                  label={`${t("common.price")} (€/kg)`}
                  cells={rows.map((r) => (
                    <span key={r.id}>
                      {r.price != null ? (
                        r.price === bestPrice ? (
                          <Chip tone="success" size="sm" className="font-semibold">
                            <span className="mono">€{r.price.toFixed(2)}</span>
                          </Chip>
                        ) : (
                          <span className="mono font-semibold text-fg">€{r.price.toFixed(2)}</span>
                        )
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </span>
                  ))}
                />
                <CompareRow
                  label="MOQ"
                  cells={rows.map((r) => (
                    <span key={r.id} className={cn("mono", r.moq ? "text-fg-2" : "text-faint")}>
                      {r.moq || "—"}
                    </span>
                  ))}
                />
                <CompareRow
                  label={t("common.country")}
                  cells={rows.map((r) => (
                    <span key={r.id} className={r.country ? "text-fg-2" : "text-faint"}>
                      {r.country || "—"}
                    </span>
                  ))}
                />
                <CompareRow
                  label={t("compare.taste")}
                  cells={rows.map((r) => <ScoreBadge key={r.id} score={r.taste} />)}
                />
                <CompareRow
                  label={t("quotes.leadTime")}
                  cells={rows.map((r) => (
                    <span key={r.id} className={r.leadTime ? "text-fg-2" : "text-faint"}>
                      {r.leadTime || "—"}
                    </span>
                  ))}
                />
                <CompareRow
                  label={t("compare.rating")}
                  cells={rows.map((r) => <ScoreBadge key={r.id} score={r.rating} />)}
                />
                <CompareRow
                  label={t("compare.overall")}
                  highlight
                  cells={rows.map((r) => {
                    const isWinner = bestOverall != null && r.overall === bestOverall && r.overall > 0;
                    return (
                      <span key={r.id}>
                        {r.overall > 0 ? (
                          isWinner ? (
                            <Chip tone="brand" className="font-bold">
                              <Trophy size={11} strokeWidth={2.4} />
                              <span className="mono">{r.overall.toFixed(1)}</span>
                            </Chip>
                          ) : (
                            <span className="mono font-semibold text-fg">{r.overall.toFixed(1)}</span>
                          )
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </span>
                    );
                  })}
                />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function CompareRow({
  label,
  cells,
  highlight,
}: {
  label: string;
  cells: React.ReactNode[];
  highlight?: boolean;
}) {
  return (
    <tr className={cn(
      "border-b border-border-soft last:border-0 transition-colors hover:bg-surface-2/30",
      highlight && "bg-brand-soft/30",
    )}>
      <td className="sticky start-0 z-10 bg-surface px-4 py-3.5 text-[11.5px] font-medium text-muted">
        {label}
      </td>
      {cells.map((c, i) => (
        <td key={i} className="px-4 py-3.5">
          {c}
        </td>
      ))}
    </tr>
  );
}
