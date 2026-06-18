"use client";

import { StatusBadge } from "@/components/status";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState, ScoreBadge } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BarChart3, Check } from "lucide-react";
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

      // Overall: weighted blend of rating, taste, price competitiveness, COA presence.
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
      <PageHeader title={t("compare.title")} subtitle={t("compare.subtitle")} />

      {/* Supplier picker */}
      <Card className="mb-4">
        <div className="mb-3 text-sm font-semibold">{t("compare.pick")}</div>
        <div className="flex flex-wrap gap-2">
          {suppliers.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={cn(
                  "chip transition",
                  on
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border text-muted hover:border-border-strong",
                )}
              >
                {on && <Check size={13} />}
                {s.company}
              </button>
            );
          })}
        </div>
      </Card>

      {rows.length < 2 ? (
        <EmptyState icon={<BarChart3 size={28} />} title={t("compare.empty")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky start-0 bg-surface px-4 py-3 text-start text-xs font-medium text-muted">
                  {t("compare.metric")}
                </th>
                {rows.map((r) => (
                  <th key={r.id} className="px-4 py-3 text-start font-semibold">
                    {r.company}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label={t("suppliers.status")} cells={rows.map((r) => {
                const s = suppliers.find((x) => x.id === r.id)!;
                return <StatusBadge key={r.id} status={s.status} />;
              })} />
              <CompareRow
                label={`${t("common.price")} (€/kg)`}
                cells={rows.map((r) => (
                  <span key={r.id} className={cn(r.price != null && r.price === bestPrice && "chip border-transparent bg-success/12 font-semibold text-success")}>
                    {r.price != null ? r.price.toFixed(2) : "—"}
                  </span>
                ))}
              />
              <CompareRow label={t("compare.bestPrice") && "MOQ"} cells={rows.map((r) => <span key={r.id}>{r.moq || "—"}</span>)} />
              <CompareRow label={t("common.country")} cells={rows.map((r) => <span key={r.id}>{r.country || "—"}</span>)} />
              <CompareRow label={t("compare.taste")} cells={rows.map((r) => <ScoreBadge key={r.id} score={r.taste} />)} />
              <CompareRow label={t("quotes.leadTime")} cells={rows.map((r) => <span key={r.id}>{r.leadTime || "—"}</span>)} />
              <CompareRow label={t("compare.rating")} cells={rows.map((r) => <ScoreBadge key={r.id} score={r.rating} />)} />
              <CompareRow
                label={t("compare.overall")}
                highlight
                cells={rows.map((r) => (
                  <span
                    key={r.id}
                    className={cn(
                      "chip border-transparent font-bold",
                      bestOverall != null && r.overall === bestOverall && r.overall > 0
                        ? "bg-brand text-brand-fg"
                        : "bg-surface-2",
                    )}
                  >
                    {r.overall > 0 ? r.overall.toFixed(1) : "—"}
                  </span>
                ))}
              />
            </tbody>
          </table>
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
    <tr className={cn("border-b border-border last:border-0", highlight && "bg-surface-2/60")}>
      <td className="sticky start-0 bg-surface px-4 py-3 text-xs font-medium text-muted">
        {label}
      </td>
      {cells.map((c, i) => (
        <td key={i} className="px-4 py-3">
          {c}
        </td>
      ))}
    </tr>
  );
}
