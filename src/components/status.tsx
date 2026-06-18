"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { SupplierStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// Color tone per pipeline status. Tuned to read clearly in both themes.
export const STATUS_TONE: Record<SupplierStatus, string> = {
  new: "bg-faint/15 text-muted border-border",
  contacted: "bg-info/12 text-info border-info/25",
  awaiting_response: "bg-warning/15 text-warning border-warning/30",
  sample_requested: "bg-accent/12 text-accent border-accent/25",
  sample_received: "bg-accent/18 text-accent border-accent/30",
  quote_received: "bg-info/15 text-info border-info/30",
  negotiation: "bg-brand/12 text-brand border-brand/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-danger/12 text-danger border-danger/30",
};

// Dot color used in compact lists / pipeline.
export const STATUS_DOT: Record<SupplierStatus, string> = {
  new: "bg-faint",
  contacted: "bg-info",
  awaiting_response: "bg-warning",
  sample_requested: "bg-accent",
  sample_received: "bg-accent",
  quote_received: "bg-info",
  negotiation: "bg-brand",
  approved: "bg-success",
  rejected: "bg-danger",
};

export function StatusBadge({
  status,
  className,
}: {
  status: SupplierStatus;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <span className={cn("chip", STATUS_TONE[status], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {t(`status.${status}` as const)}
    </span>
  );
}
