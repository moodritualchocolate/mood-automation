"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { SupplierStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// Tone per pipeline status · uses the same soft + foreground recipe as
// the rest of the design system. The "active / in motion" statuses get
// a pulsing dot so the eye is drawn to action items first.
export const STATUS_TONE: Record<SupplierStatus, string> = {
  new:               "border-border bg-surface-2 text-fg-2",
  contacted:         "border-info/25 bg-info-soft text-info",
  awaiting_response: "border-warning/30 bg-warning-soft text-warning",
  sample_requested:  "border-accent/25 bg-accent/10 text-accent",
  sample_received:   "border-accent/30 bg-accent/12 text-accent",
  quote_received:    "border-info/30 bg-info-soft text-info",
  negotiation:       "border-brand/30 bg-brand-soft text-brand",
  approved:          "border-success/30 bg-success-soft text-success",
  rejected:          "border-danger/25 bg-danger-soft text-danger",
};

export const STATUS_DOT: Record<SupplierStatus, string> = {
  new:               "bg-faint",
  contacted:         "bg-info",
  awaiting_response: "bg-warning",
  sample_requested:  "bg-accent",
  sample_received:   "bg-accent",
  quote_received:    "bg-info",
  negotiation:       "bg-brand",
  approved:          "bg-success",
  rejected:          "bg-danger",
};

// Statuses that mean "someone needs to act" → render with pulsing dot.
const PULSING: ReadonlySet<SupplierStatus> = new Set([
  "awaiting_response",
  "sample_requested",
  "negotiation",
]);

export function StatusBadge({
  status,
  size = "md",
  className,
}: {
  status: SupplierStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const { t } = useI18n();
  const isPulsing = PULSING.has(status);
  return (
    <span className={cn(
      "chip",
      size === "sm" && "chip-sm",
      STATUS_TONE[status],
      className,
    )}>
      {isPulsing ? (
        <span className={cn("pulse-dot", STATUS_DOT[status])} aria-hidden />
      ) : (
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} aria-hidden />
      )}
      {t(`status.${status}` as const)}
    </span>
  );
}
