'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
  /** Section label shown in the breadcrumb row. */
  section?: string;
}

const NAV: Array<{ href: string; label: string; key: string }> = [
  { href: '/studio-home',     label: 'Studio',        key: 'studio-home' },
  { href: '/asset-generator', label: 'Generator',     key: 'asset-generator' },
  { href: '/asset-library',   label: 'Library',       key: 'asset-library' },
  { href: '/brands',          label: 'Brands',        key: 'brands' },
  { href: '/dashboard',       label: 'Dashboard',     key: 'dashboard' },
];

export function AppShell({ children, section }: AppShellProps) {
  const pathname = usePathname() ?? '';
  return (
    <main className="min-h-[100dvh] bg-[#050505] text-[#F7F5F2]">
      <header className="sticky top-0 z-30 border-b border-[rgba(247,245,242,0.08)] bg-[#050505]/85 backdrop-blur-md">
        <div className="mx-auto max-w-[1240px] px-4 md:px-6 flex items-center justify-between gap-4 h-14">
          <Link
            href="/studio-home"
            className="font-['EditorialNew','Times_New_Roman',serif] text-[18px] tracking-tight text-[#F7F5F2] hover:opacity-80"
          >
            MOOD
            <span className="ml-2 text-[10px] uppercase tracking-[0.32em] text-[rgba(247,245,242,0.40)] align-middle">
              Creative OS
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/');
              return (
                <Link
                  key={n.key}
                  href={n.href}
                  className={[
                    'px-3 py-1.5 rounded-md text-[13px] tracking-tight transition-colors duration-150',
                    active
                      ? 'bg-[#111111] text-[#F7F5F2] border border-[rgba(247,245,242,0.18)]'
                      : 'text-[rgba(247,245,242,0.65)] border border-transparent hover:text-[#F7F5F2] hover:bg-[rgba(247,245,242,0.04)]',
                  ].join(' ')}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <nav className="md:hidden flex overflow-x-auto border-t border-[rgba(247,245,242,0.06)]">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + '/');
            return (
              <Link
                key={n.key}
                href={n.href}
                className={[
                  'shrink-0 px-4 py-2 text-[12px] tracking-tight border-b-2',
                  active
                    ? 'text-[#F7F5F2] border-[#F7F5F2]'
                    : 'text-[rgba(247,245,242,0.55)] border-transparent',
                ].join(' ')}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {section ? (
        <div className="border-b border-[rgba(247,245,242,0.06)]">
          <div className="mx-auto max-w-[1240px] px-4 md:px-6 py-3">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.40)]">
              {section}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1240px] px-4 md:px-6 py-6 md:py-10">
        {children}
      </div>
    </main>
  );
}

interface PageHeadProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHead({ eyebrow, title, subtitle, actions }: PageHeadProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
      <div className="max-w-2xl">
        {eyebrow ? (
          <div className="eyebrow mb-3 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-['EditorialNew','Times_New_Roman',serif] text-[40px] md:text-[52px] leading-[1.05] tracking-tight text-[#F7F5F2]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-[15px] md:text-[16px] leading-relaxed text-[rgba(247,245,242,0.65)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
