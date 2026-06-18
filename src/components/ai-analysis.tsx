"use client";

import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n/provider";
import { analyzeLocally, type AnalysisResult } from "@/lib/analyze";
import { useStore } from "@/lib/store";
import type { DataState, Supplier } from "@/lib/types";
import {
  AlertTriangle,
  Loader2,
  Scale,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";

function snapshot(s: ReturnType<typeof useStore.getState>): DataState {
  return {
    suppliers: s.suppliers,
    events: s.events,
    materials: s.materials,
    samples: s.samples,
    quotes: s.quotes,
    tasks: s.tasks,
    files: s.files,
  };
}

export function AiAnalysis({
  open,
  onClose,
  supplier,
}: {
  open: boolean;
  onClose: () => void;
  supplier: Supplier;
}) {
  const { t, lang } = useI18n();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const data = snapshot(useStore.getState());
    // Instant local result, then upgrade with the API (Claude) if available.
    setResult(analyzeLocally(supplier, data, lang));
    setLoading(true);
    let active = true;
    fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ supplier, data, lang }),
    })
      .then((r) => r.json())
      .then((r: AnalysisResult) => active && setResult(r))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, supplier, lang]);

  return (
    <Modal open={open} onClose={onClose} title={`${t("ai.title")} · ${supplier.company}`} size="lg">
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-xs text-muted">
          <Sparkles size={14} className="text-brand" />
          {t("ai.intro")}
          {result?.source === "local" && !loading && (
            <span className="ms-auto text-faint">· {t("ai.heuristic")}</span>
          )}
          {loading && <Loader2 size={13} className="ms-auto animate-spin" />}
        </p>

        {result && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Block icon={<ThumbsUp size={15} />} title={t("ai.pros")} tone="success" items={result.pros} />
              <Block icon={<ThumbsDown size={15} />} title={t("ai.cons")} tone="warning" items={result.cons} />
              <Block icon={<AlertTriangle size={15} />} title={t("ai.risks")} tone="danger" items={result.risks} />
            </div>

            <Section icon={<Scale size={15} />} title={t("ai.comparison")}>
              {result.comparison}
            </Section>

            <div className="rounded-xl border border-brand/30 bg-brand-soft/60 p-4">
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-brand">
                <Wand2 size={15} />
                {t("ai.recommendation")}
              </div>
              <p className="text-sm leading-relaxed">{result.recommendation}</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Block({
  icon,
  title,
  items,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone: "success" | "warning" | "danger";
}) {
  const ring = {
    success: "border-success/30",
    warning: "border-warning/30",
    danger: "border-danger/30",
  }[tone];
  const text = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <div className={`rounded-xl border ${ring} bg-surface p-3`}>
      <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${text}`}>
        {icon}
        {title}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-faint">—</p>
      ) : (
        <ul className="space-y-1.5 text-xs leading-relaxed">
          {items.map((it, i) => (
            <li key={i} className="flex gap-1.5">
              <span className={text}>•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
        {icon}
        {title}
      </div>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
