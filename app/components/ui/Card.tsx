'use client';

import * as React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  padded?: boolean;
  interactive?: boolean;
}

export function Card({
  raised = false,
  padded = true,
  interactive = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-[rgba(247,245,242,0.12)]',
        raised ? 'bg-[#111111]' : 'bg-[#0A0A0A]',
        padded ? 'p-5 md:p-6' : '',
        interactive ? 'transition-colors duration-150 hover:border-[rgba(247,245,242,0.28)] cursor-pointer' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="eyebrow mb-2 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">
      {children}
    </div>
  );
}

export function CardHeadline({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <h3
      className={[
        "font-['EditorialNew','Times_New_Roman',serif]",
        large ? 'text-[28px] leading-[1.10]' : 'text-[22px] leading-[1.20]',
        'tracking-tight text-[#F7F5F2]',
      ].join(' ')}
    >
      {children}
    </h3>
  );
}

export function CardMeta({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 text-[13px] text-[rgba(247,245,242,0.65)] leading-relaxed">{children}</div>
  );
}
