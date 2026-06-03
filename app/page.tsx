'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './components/auth/AuthProvider';

export default function LandingPage() {
  const { state } = useAuth();
  const router = useRouter();

  // Authenticated members land on the Studio; no-org users finish onboarding.
  React.useEffect(() => {
    if (state.status === 'member') router.replace('/studio-home');
    if (state.status === 'no-org') router.replace('/account?onboard=1');
  }, [state.status, router]);

  if (state.status === 'loading' || state.status === 'member' || state.status === 'no-org') {
    return <main className="min-h-[100dvh] bg-[#050505]" />;
  }

  return (
    <main className="min-h-[100dvh] bg-[#050505] text-[#F7F5F2]">
      <header className="border-b border-[rgba(247,245,242,0.06)]">
        <div className="mx-auto max-w-[1240px] px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="font-['EditorialNew','Times_New_Roman',serif] text-[18px] tracking-tight">
            MOOD
            <span className="ml-2 text-[10px] uppercase tracking-[0.32em] text-[rgba(247,245,242,0.40)] align-middle">
              Creative OS
            </span>
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <Link href="/login" className="text-[rgba(247,245,242,0.65)] hover:text-[#F7F5F2]">Sign in</Link>
            <Link href="/register" className="bg-[#F7F5F2] text-[#0A0A0A] rounded-lg px-3 py-1.5">Get started</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-[1240px] px-4 md:px-6 pt-16 md:pt-28 pb-16 md:pb-24">
        <div className="max-w-3xl">
          <div className="text-[10px] uppercase tracking-[0.32em] text-[rgba(247,245,242,0.55)] mb-4">
            Operator-supervised · brand-safe · Hebrew-first
          </div>
          <h1 className="font-['EditorialNew','Times_New_Roman',serif] text-[44px] md:text-[72px] leading-[1.04] tracking-tight">
            A quiet creative OS<br />
            for serious chocolate brands.
          </h1>
          <p className="mt-6 max-w-2xl text-[16px] md:text-[18px] leading-relaxed text-[rgba(247,245,242,0.70)]">
            Compose banners, posts, and carousels from a Hebrew brief. The system enforces brand discipline —
            formula-correct color, approved product references, no invented packaging — and registers every
            asset in a library with full prompt and approval history. Operator approval required. Human remains
            final authority.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex items-center justify-center bg-[#F7F5F2] text-[#0A0A0A] rounded-lg px-6 py-3 text-[15px] font-medium hover:bg-[#EFEBE5]">
              Create your workspace →
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center border border-[rgba(247,245,242,0.18)] text-[#F7F5F2] rounded-lg px-6 py-3 text-[15px] font-medium hover:border-[#F7F5F2]">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="border-t border-[rgba(247,245,242,0.06)]">
        <div className="mx-auto max-w-[1240px] px-4 md:px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          <Highlight eyebrow="01"
            title="Compose"
            body="Pick a visual mode — text editorial, product hero, human moment, or product + human. Brief in Hebrew. Preview in seconds." />
          <Highlight eyebrow="02"
            title="Review"
            body="Asset Quality Guard rejects renders that don't meet the brand contract. Operator approves or archives. Every decision is logged." />
          <Highlight eyebrow="03"
            title="Ship"
            body="Download PNG. Copy prompt + production spec. Hand off to a designer or external image provider with a complete brief." />
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="border-t border-[rgba(247,245,242,0.06)]">
        <div className="mx-auto max-w-[1240px] px-4 md:px-6 py-12 md:py-16">
          <div className="text-[10px] uppercase tracking-[0.32em] text-[rgba(247,245,242,0.55)] mb-3">What's inside</div>
          <h2 className="font-['EditorialNew','Times_New_Roman',serif] text-[32px] md:text-[44px] leading-tight tracking-tight max-w-2xl">
            Built for brands that take their voice seriously.
          </h2>
          <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl text-[14px] text-[rgba(247,245,242,0.70)] leading-relaxed">
            <li>· Formula-correct palettes — ENERGY, FOCUS, RELAX, SLEEP</li>
            <li>· Vector pouch + chocolate-square illustration</li>
            <li>· 5 visual modes, including carousel-story with per-slide control</li>
            <li>· Asset Quality Guard with Hebrew-only enforcement</li>
            <li>· Prompt + negative prompt + production spec on every render</li>
            <li>· Multi-tenant — your workspace is yours</li>
            <li>· Operator-driven approve / reject / archive</li>
            <li>· No publishing. No auto-approval. Ever.</li>
          </ul>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex items-center justify-center bg-[#F7F5F2] text-[#0A0A0A] rounded-lg px-6 py-3 text-[15px] font-medium hover:bg-[#EFEBE5]">
              Start free →
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center border border-[rgba(247,245,242,0.18)] text-[#F7F5F2] rounded-lg px-6 py-3 text-[15px] font-medium hover:border-[#F7F5F2]">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[rgba(247,245,242,0.06)]">
        <div className="mx-auto max-w-[1240px] px-4 md:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-[12px] text-[rgba(247,245,242,0.45)]">
          <span>MOOD Creative OS · alpha</span>
          <span>Operator approval required · Human remains final authority</span>
        </div>
      </footer>
    </main>
  );
}

function Highlight({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.32em] text-[rgba(247,245,242,0.55)] mb-3">{eyebrow}</div>
      <h3 className="font-['EditorialNew','Times_New_Roman',serif] text-[24px] tracking-tight">{title}</h3>
      <p className="mt-3 text-[14px] leading-relaxed text-[rgba(247,245,242,0.65)]">{body}</p>
    </div>
  );
}
