"use client";

import { StatusBadge } from "@/components/status";
import { SupplierForm } from "@/components/supplier-form";
import { PageHeader } from "@/components/ui/page-header";
import { Button, EmptyState, Input, Select, Skeleton } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { canEdit, useStore } from "@/lib/store";
import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_STATUSES,
  type Supplier,
  type SupplierCategory,
  type SupplierStatus,
} from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";

const catOf = (s: Supplier): SupplierCategory => s.category ?? "other";
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  User,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function SuppliersPage() {
  const { t, lang } = useI18n();
  const hydrated = useStore((s) => s.hydrated);
  const role = useStore((s) => s.role);
  const suppliers = useStore((s) => s.suppliers);
  const materials = useStore((s) => s.materials);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<SupplierStatus | "all">("all");
  const [cat, setCat] = useState<SupplierCategory | "all">("all");
  const [formOpen, setFormOpen] = useState(false);

  // Count suppliers per category for the tab badges.
  const catCounts = useMemo(() => {
    const m: Record<string, number> = { all: suppliers.length };
    for (const s of suppliers) {
      const c = catOf(s);
      m[c] = (m[c] ?? 0) + 1;
    }
    return m;
  }, [suppliers]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rank = (st: string) =>
      st === "awaiting_response" ? 0 : st === "rejected" ? 2 : 1;
    return suppliers.filter((s) => {
      if (cat !== "all" && catOf(s) !== cat) return false;
      if (filter !== "all" && s.status !== filter) return false;
      if (!needle) return true;
      return [s.company, s.contact, s.country, s.email, s.phone, s.notes]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(needle));
    }).sort((a, b) => rank(a.status) - rank(b.status));
  }, [suppliers, q, filter, cat]);

  const materialCount = (sid: string) =>
    materials.filter((m) => m.supplierId === sid).length;

  return (
    <>
      <PageHeader
        title={t("suppliers.title")}
        subtitle={t("suppliers.subtitle")}
        action={
          canEdit(role) && (
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              <Plus size={16} />
              {t("suppliers.new")}
            </Button>
          )
        }
      />

      {/* Category lists */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {(["all", ...SUPPLIER_CATEGORIES] as const).map((c) => {
          const active = cat === c;
          const count = catCounts[c] ?? 0;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "chip shrink-0 transition",
                active
                  ? "border-brand bg-brand text-brand-fg"
                  : "border-border text-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {c === "all" ? t("category.all") : t(`category.${c}` as const)}
              <span className={cn("tabular-nums", active ? "opacity-80" : "text-faint")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("suppliers.search")}
            className="ps-9"
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as SupplierStatus | "all")}
          className="sm:w-56"
        >
          <option value="all">{t("suppliers.filterAll")}</option>
          {SUPPLIER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}` as const)}
            </option>
          ))}
        </Select>
      </div>

      {!hydrated ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title={t("suppliers.empty")}
          action={
            canEdit(role) && (
              <Button variant="primary" onClick={() => setFormOpen(true)}>
                <Plus size={16} />
                {t("suppliers.new")}
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="mb-3 text-xs text-muted">
            {filtered.length} {t("suppliers.count")}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Link
                key={s.id}
                href={`/suppliers/${s.id}`}
                className="card flex flex-col gap-3 p-4 transition hover:border-border-strong hover:shadow-elevated"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{s.company}</h3>
                    <span className="mt-1 inline-flex chip border-transparent bg-brand-soft px-2 py-0.5 text-[10px] text-brand">
                      {t(`category.${catOf(s)}` as const)}
                    </span>
                    {s.contact && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <User size={12} /> {s.contact}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="space-y-1 text-xs text-muted">
                  {s.country && (
                    <p className="flex items-center gap-1.5">
                      <MapPin size={12} /> {s.country}
                    </p>
                  )}
                  {s.phone && (
                    <p className="flex items-center gap-1.5" dir="ltr">
                      <Phone size={12} /> {s.phone}
                    </p>
                  )}
                  {s.email && (
                    <p className="flex items-center gap-1.5 truncate" dir="ltr">
                      <Mail size={12} /> {s.email}
                    </p>
                  )}
                  {s.website && (
                    <p className="flex items-center gap-1.5 truncate" dir="ltr">
                      <Globe size={12} /> {s.website.replace(/^https?:\/\//, "")}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-2 text-[11px] text-faint">
                  <span>
                    {materialCount(s.id)} {t("supplier.materials")}
                  </span>
                  <span>
                    {t("common.updated")} {relativeTime(s.updatedAt, lang)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <SupplierForm open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
