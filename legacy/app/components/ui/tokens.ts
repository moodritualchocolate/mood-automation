/**
 * UI TOKENS (frontend-only convenience re-exports)
 *
 * The single source of truth lives in lib/productization/designSystem.ts.
 * This module re-exports them as the constants the page-level components
 * actually consume, plus a handful of Tailwind class strings so JSX stays
 * readable.
 */

import { COLORS, SPACING, BUTTONS, CARDS, BADGES } from '@lib/productization/designSystem';

export { COLORS, SPACING, BUTTONS, CARDS, BADGES };

export const SURFACE = {
  page: 'bg-[#050505] text-[#F7F5F2]',
  card: 'bg-[#0A0A0A] border border-[rgba(247,245,242,0.12)] rounded-xl',
  raised: 'bg-[#111111] border border-[rgba(247,245,242,0.12)] rounded-xl',
  hairline: 'border-[rgba(247,245,242,0.12)]',
  hairlineSoft: 'border-[rgba(247,245,242,0.06)]',
} as const;

export const TEXT = {
  primary: 'text-[#F7F5F2]',
  muted: 'text-[rgba(247,245,242,0.65)]',
  faint: 'text-[rgba(247,245,242,0.40)]',
  warning: 'text-[#FF4D2D]',
  quiet: 'text-[#5C5C5C]',
} as const;

export const FONT = {
  editorial: "font-['EditorialNew','Times_New_Roman',serif]",
  display:   "font-['Helvetica_Neue','Inter',system-ui,sans-serif]",
  hebrew:    "font-['Heebo','Arial_Hebrew','Arial',sans-serif]",
  mono:      "font-['JetBrains_Mono',monospace]",
} as const;
