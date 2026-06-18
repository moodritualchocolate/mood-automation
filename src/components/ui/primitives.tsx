"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/* ── Buttons ── */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }
>(({ className, variant = "secondary", ...props }, ref) => {
  const v = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
  }[variant];
  return <button ref={ref} className={cn(v, className)} {...props} />;
});
Button.displayName = "Button";

export function IconButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg active:scale-95",
        className,
      )}
      {...props}
    />
  );
}

/* ── Card ── */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card p-4", className)} {...props} />;
}

/* ── Inputs ── */
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
    className={cn("input-base min-h-[88px] resize-y leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn("input-base cursor-pointer appearance-none pe-8", className)}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      {label && (
        <span className="flex items-center gap-2 text-xs font-medium text-muted">
          {label}
          {hint && <span className="text-faint">· {hint}</span>}
        </span>
      )}
      {children}
    </label>
  );
}

/* ── Empty state ── */
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      {icon && <div className="text-faint">{icon}</div>}
      <div className="text-sm font-medium text-fg">{title}</div>
      {hint && <div className="max-w-sm text-xs text-muted">{hint}</div>}
      {action}
    </div>
  );
}

/* ── Score badge (0–10) ── */
export function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-faint">—</span>;
  const tone =
    score >= 8.5
      ? "bg-success/12 text-success"
      : score >= 7
        ? "bg-accent/15 text-accent"
        : score >= 5
          ? "bg-warning/15 text-warning"
          : "bg-danger/12 text-danger";
  return (
    <span className={cn("chip border-transparent font-semibold", tone)}>
      {score.toFixed(1)}
    </span>
  );
}

/* ── Skeleton ── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}
