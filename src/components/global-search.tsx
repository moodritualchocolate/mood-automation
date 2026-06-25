"use client";

import { Modal } from "@/components/ui/modal";
import { Kbd } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Building2,
  CheckSquare,
  CornerDownLeft,
  FileText,
  MessageSquare,
  Package,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface Hit {
  group: string;
  Icon: LucideIcon;
  label: string;
  sub?: string;
  href: string;
}

export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const { suppliers, materials, events, tasks, files } = useStore();

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const supplierName = (id?: string) =>
    suppliers.find((s) => s.id === id)?.company ?? "";

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out: Hit[] = [];
    const m = (s?: string) => (s ?? "").toLowerCase().includes(needle);

    for (const s of suppliers) {
      if (m(s.company) || m(s.contact) || m(s.phone) || m(s.email) || m(s.country) || m(s.notes))
        out.push({
          group: t("search.in.suppliers"),
          Icon: Building2,
          label: s.company,
          sub: [s.contact, s.country].filter(Boolean).join(" · "),
          href: `/suppliers/${s.id}`,
        });
    }
    for (const mt of materials) {
      if (m(mt.country) || m(mt.variety) || m(mt.notes) || m(mt.tasteNotes) || m(mt.productCode))
        out.push({
          group: t("search.in.materials"),
          Icon: Package,
          label: t(`material.${mt.kind}` as const),
          sub: `${supplierName(mt.supplierId)} · ${[mt.variety, mt.country].filter(Boolean).join(" ")}`,
          href: `/suppliers/${mt.supplierId}?tab=materials`,
        });
    }
    for (const e of events) {
      if (m(e.text))
        out.push({
          group: t("search.in.timeline"),
          Icon: MessageSquare,
          label: e.text.slice(0, 60),
          sub: supplierName(e.supplierId),
          href: `/suppliers/${e.supplierId}?tab=timeline`,
        });
    }
    for (const tk of tasks) {
      if (m(tk.title))
        out.push({
          group: t("search.in.tasks"),
          Icon: CheckSquare,
          label: tk.title,
          sub: supplierName(tk.supplierId),
          href: `/tasks`,
        });
    }
    for (const f of files) {
      if (m(f.name))
        out.push({
          group: t("search.in.files"),
          Icon: FileText,
          label: f.name,
          sub: supplierName(f.supplierId),
          href: `/files`,
        });
    }
    return out.slice(0, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, suppliers, materials, events, tasks, files, lang]);

  const grouped = useMemo(() => {
    const map = new Map<string, Hit[]>();
    for (const h of hits) {
      if (!map.has(h.group)) map.set(h.group, []);
      map.get(h.group)!.push(h);
    }
    return [...map.entries()];
  }, [hits]);

  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  // Keep active in bounds.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" hideClose className="overflow-hidden">
      {/* Search bar */}
      <div className="-mx-6 -my-5 sm:-mx-6 sm:-my-5">
        <div className="flex items-center gap-3 border-b border-border-soft px-5 py-4 sm:px-6">
          <Search size={18} className="shrink-0 text-faint" strokeWidth={2.2} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search.placeholder")}
            className="w-full bg-transparent text-[15px] font-medium leading-7 text-fg outline-none placeholder:text-faint placeholder:font-normal"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, flat.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && flat[active]) {
                go(flat[active].href);
              }
            }}
          />
          <span className="hidden shrink-0 items-center gap-1 sm:flex">
            <Kbd>esc</Kbd>
          </span>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto px-3 py-3 sm:px-4 sm:py-3">
          {!q.trim() ? (
            <EmptyHint hint={t("search.empty")} />
          ) : flat.length === 0 ? (
            <EmptyHint hint={t("search.noResults")} sample={q} />
          ) : (
            <div className="space-y-4">
              {grouped.map(([group, items]) => (
                <div key={group}>
                  <div className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                    {group}
                  </div>
                  <ul className="space-y-0.5">
                    {items.map((h) => {
                      const idx = flat.indexOf(h);
                      const isActive = idx === active;
                      return (
                        <li key={`${group}-${idx}`}>
                          <button
                            onMouseEnter={() => setActive(idx)}
                            onClick={() => go(h.href)}
                            className={cn(
                              "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start transition-colors",
                              isActive
                                ? "bg-brand-soft text-brand"
                                : "text-fg-2 hover:bg-surface-2",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                                isActive ? "bg-brand/15 text-brand" : "bg-surface-2 text-muted",
                              )}
                            >
                              <h.Icon size={14} strokeWidth={2.2} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cn(
                                "block truncate text-[13.5px] font-semibold",
                                isActive ? "text-brand" : "text-fg",
                              )}>
                                {h.label}
                              </span>
                              {h.sub && (
                                <span className="block truncate text-[12px] text-muted">
                                  {h.sub}
                                </span>
                              )}
                            </span>
                            {isActive && (
                              <CornerDownLeft
                                size={13}
                                className="shrink-0 text-brand opacity-80"
                                strokeWidth={2.4}
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint row · only on desktop */}
        <div className="hidden items-center justify-between gap-3 border-t border-border-soft bg-surface-2/40 px-5 py-2.5 text-[11.5px] text-muted sm:flex sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>נווט · navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd>
              <span>פתח · open</span>
            </span>
          </div>
          {flat.length > 0 && (
            <span className="mono text-faint">
              {flat.length} {flat.length === 1 ? "result" : "results"}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}

function EmptyHint({ hint, sample }: { hint: string; sample?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-faint">
        <Search size={18} strokeWidth={1.8} />
      </span>
      <p className="text-[13px] text-muted">{hint}</p>
      {sample && (
        <p className="mono text-[11.5px] text-faint">&ldquo;{sample}&rdquo;</p>
      )}
    </div>
  );
}
