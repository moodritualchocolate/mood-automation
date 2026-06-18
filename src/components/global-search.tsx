"use client";

import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Building2,
  CheckSquare,
  FileText,
  MessageSquare,
  Package,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface Hit {
  group: string;
  icon: React.ReactNode;
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
  const { suppliers, materials, events, tasks, files } = useStore();

  useEffect(() => {
    if (open) {
      setQ("");
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
      if (
        m(s.company) || m(s.contact) || m(s.phone) || m(s.email) ||
        m(s.country) || m(s.notes)
      )
        out.push({
          group: t("search.in.suppliers"),
          icon: <Building2 size={16} />,
          label: s.company,
          sub: [s.contact, s.country].filter(Boolean).join(" · "),
          href: `/suppliers/${s.id}`,
        });
    }
    for (const mt of materials) {
      if (m(mt.country) || m(mt.variety) || m(mt.notes) || m(mt.tasteNotes) || m(mt.productCode))
        out.push({
          group: t("search.in.materials"),
          icon: <Package size={16} />,
          label: t(`material.${mt.kind}` as const),
          sub: `${supplierName(mt.supplierId)} · ${[mt.variety, mt.country].filter(Boolean).join(" ")}`,
          href: `/suppliers/${mt.supplierId}?tab=materials`,
        });
    }
    for (const e of events) {
      if (m(e.text))
        out.push({
          group: t("search.in.timeline"),
          icon: <MessageSquare size={16} />,
          label: e.text.slice(0, 60),
          sub: supplierName(e.supplierId),
          href: `/suppliers/${e.supplierId}?tab=timeline`,
        });
    }
    for (const tk of tasks) {
      if (m(tk.title))
        out.push({
          group: t("search.in.tasks"),
          icon: <CheckSquare size={16} />,
          label: tk.title,
          sub: supplierName(tk.supplierId),
          href: `/tasks`,
        });
    }
    for (const f of files) {
      if (m(f.name))
        out.push({
          group: t("search.in.files"),
          icon: <FileText size={16} />,
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

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="-mx-1">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Search size={18} className="text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search.placeholder")}
            className="w-full bg-transparent text-base outline-none placeholder:text-faint"
            onKeyDown={(e) => {
              if (e.key === "Enter" && hits[0]) go(hits[0].href);
            }}
          />
        </div>

        <div className="mt-3 max-h-[60vh] space-y-4 overflow-y-auto">
          {!q.trim() && (
            <p className="px-1 py-8 text-center text-sm text-muted">
              {t("search.empty")}
            </p>
          )}
          {q.trim() && hits.length === 0 && (
            <p className="px-1 py-8 text-center text-sm text-muted">
              {t("search.noResults")}
            </p>
          )}
          {grouped.map(([group, items]) => (
            <div key={group}>
              <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-faint">
                {group}
              </div>
              <ul>
                {items.map((h, i) => (
                  <li key={i}>
                    <button
                      onClick={() => go(h.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start transition hover:bg-surface-2",
                      )}
                    >
                      <span className="text-muted">{h.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {h.label}
                        </span>
                        {h.sub && (
                          <span className="block truncate text-xs text-muted">
                            {h.sub}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
