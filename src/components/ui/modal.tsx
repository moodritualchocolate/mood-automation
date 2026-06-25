"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";
import { IconButton } from "./primitives";

/**
 * Modal · responsive · bottom-sheet on mobile · centered card on
 * desktop. Vercel/Linear-tier polish:
 *   - blurred dim backdrop
 *   - scale-in animation
 *   - floating shadow
 *   - footer with subtle differentiation
 *   - generous padding, refined header
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  className,
  /** Hide the close button (e.g. for command palettes). */
  hideClose,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  hideClose?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop · deeper blur, lower opacity than v1 */}
      <div
        className="absolute inset-0 animate-fade-in bg-black/45 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-border bg-surface shadow-floating",
          "animate-slide-up sm:animate-scale-in sm:rounded-2xl",
          width,
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-border-soft px-5 py-4 sm:px-6">
            {title && (
              <div className="min-w-0 space-y-0.5">
                <h2 className="truncate text-[15px] font-semibold tracking-tight text-fg">
                  {title}
                </h2>
                {subtitle && (
                  <p className="truncate text-[12.5px] text-muted">{subtitle}</p>
                )}
              </div>
            )}
            {!hideClose && (
              <IconButton onClick={onClose} aria-label="close" size="sm" className="-me-1.5">
                <X size={15} strokeWidth={2.2} />
              </IconButton>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border-soft bg-surface-2/40 px-5 py-3.5 pb-safe sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
