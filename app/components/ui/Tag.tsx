'use client';

import * as React from 'react';
import { BADGES } from '@lib/productization/designSystem';

interface TagProps {
  status?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export function Tag({ status, children, size = 'sm' }: TagProps) {
  const colors = status ? BADGES.statusToColors(status) : { fg: 'rgba(247,245,242,0.65)', bg: 'rgba(247,245,242,0.06)' };
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border tracking-tight',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-[12px]',
      ].join(' ')}
      style={{ color: colors.fg, background: colors.bg, borderColor: colors.fg + '33' }}
    >
      {children}
    </span>
  );
}
