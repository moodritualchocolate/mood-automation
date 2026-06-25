"use client";

import { StatusBadge } from "@/components/status";
import { SupplierForm } from "@/components/supplier-form";
import { PageHeader } from "@/components/ui/page-header";
import { Button, Card, Chip, EmptyState, Input, Select, Skeleton } from "@/components/ui/primitives";
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

const catOf = (s: Supplier): SupplierCategory => s.category ?? "other";

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
        eyebrow={t("nav.section.sourcing")}
        title={t("suppliers.title")}
        subtitle={t("suppliers.subtitle")}
        meta={
          <>
            <Chip tone="neutral" size="sm">
              <span className="mono">{suppliers.length}</span>
              {t("suppliers.count")}
            </Chip>
          </>
        }
        action={
          canEdit(role) && (
            <Button variant="primary" leadingIcon={Plus} onClick={() => setFormOpen(true)}>
              {t("suppliers.new")}
            </Button>
          )
        }
      />

      {/* Category tabs */}
      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {(["all", ...SUPPLIER_CATEGORIES] as const).map((c) => {
          const active = cat === c;
          const count = catCounts[c] ?? 0;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "chip shrink-0 transition-all duration-150",
                active
                  ? "border-brand bg-brand text-brand-fg shadow-sm"
                  : "border-border text-fg-2 hover:border-border-strong hover:bg-surface-2",
              )}
            >
              {c === "all" ? t("category.all") : t(`category.${c}` as const)}
              <span className={cn(
                "mono tabular ms-0.5",
                active ? "opacity-90" : "text-faint",
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + filter row */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={15}
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
          className="sm:w-60"
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
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("suppliers.empty")}
          hint={q ? `"${q}"` : undefined}
          action={
            canEdit(role) && !q && (
              <Button variant="primary" leadingIcon={Plus} onClick={() => setFormOpen(true)}>
                {t("suppliers.new")}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/suppliers/${s.id}`}
              className="card-interactive group flex flex-col gap-3 p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-semibold tracking-tight text-fg group-hover:text-brand">
                    {s.company}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Chip tone="brand" size="sm">
                      {t(`category.${catOf(s)}` as const)}
                    </Chip>
                  </div>
                </div>
                <StatusBadge status={s.status} size="sm" />
              </div>

              {(s.contact || s.country || s.phone || s.email || s.website) && (
                <div className="space-y-1.5 text-[12.5px] text-muted">
                  {s.contact && (
                    <div className="flex items-center gap-2">
                      <User size={12} className="shrink-0 text-faint" />
                      <span className="truncate">{s.contact}</span>
                    </div>
                  )}
                  {s.country && (
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="shrink-0 text-faint" />
                      <span className="truncate">{s.country}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2" dir="ltr">
                      <Phone size={12} className="shrink-0 text-faint" />
                      <span className="mono truncate">{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2" dir="ltr">
                      <Mail size={12} className="shrink-0 text-faint" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {s.website && (
                    <div className="flex items-center gap-2" dir="ltr">
                      <Globe size={12} className="shrink-0 text-faint" />
                      <span className="truncate">{s.website.replace(/^https?:\/\//, "")}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-border-soft pt-3 text-[11px]">
                <span className="text-muted">
                  <span className="mono font-semibold text-fg-2">{materialCount(s.id)}</span>
                  <span className="ms-1">{t("supplier.materials")}</span>
                </span>
                <span className="mono text-faint">
                  {relativeTime(s.updatedAt, lang)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <SupplierForm open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
