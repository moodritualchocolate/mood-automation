'use client';

import * as React from 'react';

interface EmptyProps {
  eyebrow?: string;
  headline: string;
  description?: string;
  action?: React.ReactNode;
}

export function Empty({ eyebrow, headline, description, action }: EmptyProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[rgba(247,245,242,0.18)] bg-[#0A0A0A] py-16 px-8 text-center">
      {eyebrow ? (
        <div className="eyebrow mb-3 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">
          {eyebrow}
        </div>
      ) : null}
      <h3 className="font-['EditorialNew','Times_New_Roman',serif] text-[24px] leading-[1.20] tracking-tight text-[#F7F5F2]">
        {headline}
      </h3>
      {description ? (
        <p className="mt-3 text-[14px] leading-relaxed text-[rgba(247,245,242,0.55)] max-w-md mx-auto">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
