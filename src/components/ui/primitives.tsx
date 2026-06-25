"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   BUTTONS
   ──────────────────────────────────────────────────────────── */

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    size?: BtnSize;
    leadingIcon?: LucideIcon;
    trailingIcon?: LucideIcon;
    loading?: boolean;
  }
>(({ className, variant = "secondary", size = "md", leadingIcon: L, trailingIcon: T, loading, children, disabled, ...props }, ref) => {
  const v = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
  }[variant];
  const s = { sm: "btn-sm", md: "", lg: "btn-lg" }[size];
  const iconSize = size === "lg" ? 16 : size === "sm" ? 13 : 14;
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(v, s, className)}
      {...props}
    >
      {loading ? (
        <Spinner size={iconSize} />
      ) : (
        L && <L size={iconSize} strokeWidth={2.2} />
      )}
      {children}
      {T && !loading && <T size={iconSize} strokeWidth={2.2} />}
    </button>
  );
});
Button.displayName = "Button";

export function IconButton({
  className,
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <button
      className={cn(
        dims,
        "inline-flex items-center justify-center rounded-lg text-muted",
        "transition-all duration-150 active:scale-95",
        "hover:bg-surface-2 hover:text-fg",
        className,
      )}
      {...props}
    />
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   CARDS
   ──────────────────────────────────────────────────────────── */

export function Card({
  className,
  interactive,
  elevated,
  floating,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  elevated?: boolean;
  floating?: boolean;
}) {
  return (
    <div
      className={cn(
        floating ? "card-floating" : elevated ? "card-elevated" : "card",
        interactive && "card-interactive",
        "p-4 sm:p-5",
        className,
      )}
      {...props}
    />
  );
}

/* ────────────────────────────────────────────────────────────
   INPUTS
   ──────────────────────────────────────────────────────────── */

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("input-base", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("input-base min-h-[96px] resize-y leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn("input-base cursor-pointer appearance-none pe-9", className)}
      {...props}
    >
      {children}
    </select>
    <svg
      className="pointer-events-none absolute inset-y-0 end-3 my-auto text-faint"
      width="14" height="14" viewBox="0 0 24 24" fill="none"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
));
Select.displayName = "Select";

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      {label && (
        <span className="flex items-center gap-2 text-xs font-medium text-muted">
          {label}
          {required && <span className="text-danger" aria-hidden>•</span>}
          {hint && <span className="text-faint">· {hint}</span>}
        </span>
      )}
      {children}
    </label>
  );
}

/* ────────────────────────────────────────────────────────────
   CHIPS · STAT · METRIC · BADGE
   ──────────────────────────────────────────────────────────── */

type ChipTone = "default" | "brand" | "success" | "warning" | "danger" | "info" | "accent" | "neutral";
const CHIP_TONE: Record<ChipTone, string> = {
  default: "border-border bg-surface-2 text-muted",
  neutral: "border-border bg-surface-2 text-fg-2",
  brand:   "border-brand/25 bg-brand-soft text-brand",
  success: "border-success/25 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger:  "border-danger/25 bg-danger-soft text-danger",
  info:    "border-info/25 bg-info-soft text-info",
  accent:  "border-accent/25 bg-accent/10 text-accent",
};

export function Chip({
  tone = "default",
  size = "md",
  icon: Icon,
  className,
  children,
}: {
  tone?: ChipTone;
  size?: "sm" | "md";
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("chip", size === "sm" && "chip-sm", CHIP_TONE[tone], className)}>
      {Icon && <Icon size={size === "sm" ? 10 : 12} strokeWidth={2.2} />}
      {children}
    </span>
  );
}

/* ─── Stat · big number with label · for dashboards ─── */
export function Stat({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: { value: number; direction: "up" | "down" | "flat" };
  icon?: LucideIcon;
  tone?: "default" | "brand" | "success" | "warning" | "danger";
  className?: string;
}) {
  const iconTone = {
    default: "text-muted bg-surface-2",
    brand: "text-brand bg-brand-soft",
    success: "text-success bg-success-soft",
    warning: "text-warning bg-warning-soft",
    danger: "text-danger bg-danger-soft",
  }[tone];

  const trendTone = trend && (trend.direction === "up"
    ? "text-success"
    : trend.direction === "down"
    ? "text-danger"
    : "text-muted");

  return (
    <div className={cn("card-interactive p-4 sm:p-5 group", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted">
            {label}
          </div>
          <div className="text-3xl font-semibold tabular text-fg leading-none tracking-tight">
            {value}
          </div>
          {hint && <div className="text-xs text-faint">{hint}</div>}
        </div>
        {Icon && (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconTone)}>
            <Icon size={16} strokeWidth={2.2} />
          </span>
        )}
      </div>
      {trend && (
        <div className={cn("mt-3 flex items-center gap-1 text-xs font-medium", trendTone)}>
          <span>{trend.direction === "up" ? "↗" : trend.direction === "down" ? "↘" : "→"}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-faint">vs prev</span>
        </div>
      )}
    </div>
  );
}

/* ─── Keyboard hint ─── */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn("kbd", className)}>{children}</kbd>;
}

/* ────────────────────────────────────────────────────────────
   EMPTY STATE
   ──────────────────────────────────────────────────────────── */

export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  /** Accepts either a LucideIcon component or a pre-rendered ReactNode
   * (kept for backwards compatibility with existing callsites). */
  icon?: LucideIcon | React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  // Lucide icons are forwardRef *components* — they're objects with a
  // `render` field, not functions. Detect both function components and
  // forwardRef components so we render them via JSX; everything else is
  // treated as an already-rendered React element.
  const isComponent =
    typeof icon === "function" ||
    (typeof icon === "object" && icon !== null && "render" in (icon as unknown as Record<string, unknown>));
  const IconComp = isComponent ? (icon as LucideIcon) : null;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center",
      className,
    )}>
      {(IconComp || (icon && !isComponent)) && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-faint">
          {IconComp ? <IconComp size={22} strokeWidth={1.75} /> : (icon as React.ReactNode)}
        </span>
      )}
      <div className="space-y-1">
        <div className="text-sm font-semibold text-fg">{title}</div>
        {hint && <div className="mx-auto max-w-sm text-xs leading-relaxed text-muted">{hint}</div>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SCORE BADGE · 0-10
   ──────────────────────────────────────────────────────────── */

export function ScoreBadge({ score, size = "md" }: { score?: number; size?: "sm" | "md" | "lg" }) {
  if (score == null) {
    return <span className="text-faint mono">—</span>;
  }
  const tone =
    score >= 8.5 ? "border-success/25 bg-success-soft text-success"
    : score >= 7   ? "border-accent/25 bg-accent/10 text-accent"
    : score >= 5   ? "border-warning/25 bg-warning-soft text-warning"
    :                "border-danger/25 bg-danger-soft text-danger";
  const sz = size === "lg" ? "h-8 min-w-[2.75rem] text-[14px]"
           : size === "sm" ? "h-5 min-w-[2rem] text-[10.5px]"
           :                 "h-6 min-w-[2.25rem] text-[11.5px]";
  return (
    <span className={cn(
      "inline-flex items-center justify-center rounded-md border px-1.5 font-semibold tabular",
      tone, sz,
    )}>
      {score.toFixed(1)}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   STRUCTURE · Divider · SectionHeading
   ──────────────────────────────────────────────────────────── */

export function Divider({ className }: { className?: string }) {
  return <div className={cn("divider my-4", className)} aria-hidden />;
}

export function SectionHeading({
  eyebrow,
  title,
  hint,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h3 className="text-md font-semibold tracking-tight text-fg">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SKELETON
   ──────────────────────────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}
