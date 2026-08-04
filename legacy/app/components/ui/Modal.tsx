'use client';

import * as React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const sizeClass = {
  md: 'max-w-[560px]',
  lg: 'max-w-[820px]',
  xl: 'max-w-[1080px]',
} as const;

export function Modal({ open, onClose, title, eyebrow, children, footer, size = 'md' }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="close modal"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={[
          'relative w-full md:rounded-2xl rounded-t-2xl bg-[#0A0A0A] border border-[rgba(247,245,242,0.12)] shadow-2xl',
          'max-h-[88dvh] flex flex-col',
          sizeClass[size],
        ].join(' ')}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <span className="block h-1 w-10 rounded-full bg-[rgba(247,245,242,0.18)]" />
        </div>
        {(title || eyebrow) ? (
          <div className="px-6 pt-5 pb-4 border-b border-[rgba(247,245,242,0.08)]">
            {eyebrow ? (
              <div className="eyebrow mb-1 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <h2 className="font-['EditorialNew','Times_New_Roman',serif] text-[26px] leading-[1.10] tracking-tight text-[#F7F5F2]">
                {title}
              </h2>
            ) : null}
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer ? (
          <div className="px-6 py-4 border-t border-[rgba(247,245,242,0.08)] flex flex-wrap items-center justify-end gap-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
