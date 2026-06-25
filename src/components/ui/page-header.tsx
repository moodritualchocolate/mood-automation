"use client";

import { cn } from "@/lib/utils";

/**
 * Page header · the first thing the user sees on every screen.
 * Eyebrow · large title · subtitle · action group · subtle bottom rule.
 * Built to feel like Linear / Stripe / Vercel — generous, deliberate,
 * never cramped.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  meta,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Tabular meta · e.g. counts, last-updated, tag chips. */
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 border-b border-border-soft pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-6",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow && (
          <div className="eyebrow flex items-center gap-2">
            <span className="inline-block h-1 w-1 rounded-full bg-brand" aria-hidden />
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted">
            {subtitle}
          </p>
        )}
        {meta && (
          <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-2">{action}</div>
      )}
    </div>
  );
}
