'use client';

// Public shared-kit page (roadmap #25) — every shared kit is an ad.
// No session, no shell, no tenant chrome: kit content + one CTA.

export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface SharedKit {
  oneLinerCandidates: { text: string }[];
  hooks: { text: string; audience: string; situation: string; visualDirection: string }[];
  ugcScripts: { title: string; durationSec: number; script: string; shotList: string[]; cta: string }[];
  imageConcepts: { title: string; visualDescription: string }[];
  verticalId: string | null;
  generatedAt: number;
}

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const [kit, setKit] = React.useState<SharedKit | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!params?.token) return;
    (async () => {
      try {
        const res = await fetch(`/api/mvp/share?token=${encodeURIComponent(params.token)}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({})) as { error?: string };
          setError(j.error ?? `Failed (${res.status})`); return;
        }
        const j = await res.json() as { kit: SharedKit };
        setKit(j.kit);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [params?.token]);

  return (
    <main className="min-h-[100dvh] bg-[#050505] text-[#F7F5F2]">
      {/* Minimal header */}
      <header className="border-b border-[rgba(247,245,242,0.06)]">
        <div className="mx-auto flex h-14 max-w-[860px] items-center justify-between px-4 md:px-6">
          <span className="font-['EditorialNew','Times_New_Roman',serif] text-[18px] tracking-tight">
            MOOD
            <span className="ml-2 align-middle text-[10px] uppercase tracking-[0.32em] text-[rgba(247,245,242,0.40)]">
              Creative OS
            </span>
          </span>
          <Link
            href="/register"
            className="rounded-lg bg-[#F7F5F2] px-3 py-1.5 text-[13px] text-[#0A0A0A]"
          >
            Make one for my brand →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[860px] px-4 py-10 md:px-6 md:py-14">
        {error ? (
          <div className="rounded-xl border border-[rgba(247,245,242,0.12)] p-6 text-[14px] text-[rgba(247,245,242,0.70)]">
            {error === 'kit not found' ? 'This shared kit no longer exists.' : error}
          </div>
        ) : !kit ? (
          <div className="text-[14px] text-[rgba(247,245,242,0.45)]">Loading shared kit…</div>
        ) : (
          <>
            <div className="mb-2 text-[10px] uppercase tracking-[0.32em] text-[rgba(247,245,242,0.45)]">
              Shared creative kit{kit.verticalId ? ` · ${kit.verticalId}` : ''}
            </div>
            {kit.oneLinerCandidates[0] ? (
              <h1
                dir="rtl"
                className="mb-10 font-['EditorialNew','Times_New_Roman',serif] text-[34px] leading-[1.15] md:text-[44px]"
              >
                {kit.oneLinerCandidates[0].text}
              </h1>
            ) : null}

            <section className="mb-10">
              <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">
                Hooks · {kit.hooks.length}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {kit.hooks.map((h, i) => (
                  <div key={i} className="rounded-xl border border-[rgba(247,245,242,0.10)] bg-[#0A0A0A] p-4">
                    <div dir="rtl" className="font-['EditorialNew','Times_New_Roman',serif] text-[18px] leading-snug">
                      {h.text}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-10">
              <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">
                UGC scripts · {kit.ugcScripts.length}
              </div>
              <div className="space-y-3">
                {kit.ugcScripts.map((u, i) => (
                  <div key={i} className="rounded-xl border border-[rgba(247,245,242,0.10)] bg-[#0A0A0A] p-4">
                    <div className="mb-2 text-[13px] text-[rgba(247,245,242,0.85)]">
                      {u.title} · {u.durationSec}s
                    </div>
                    <pre dir="rtl" className="whitespace-pre-wrap rounded-lg border border-[rgba(247,245,242,0.06)] bg-[#050505] p-3 font-['Heebo','Arial_Hebrew',sans-serif] text-[12px] leading-relaxed text-[rgba(247,245,242,0.75)]">
                      {u.script}
                    </pre>
                  </div>
                ))}
              </div>
            </section>

            {/* Conversion footer — the whole point of the share loop */}
            <div className="rounded-2xl border border-[rgba(247,245,242,0.14)] bg-[#0A0A0A] p-6 text-center md:p-8">
              <div className="font-['EditorialNew','Times_New_Roman',serif] text-[24px] md:text-[28px]">
                This kit took 8 minutes to make.
              </div>
              <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[rgba(247,245,242,0.65)]">
                Four questions about your brand. Industry-native hooks, UGC scripts and
                image concepts — written from inside your industry, not by a generic AI.
              </p>
              <Link
                href="/register"
                className="mt-5 inline-flex rounded-lg bg-[#F7F5F2] px-6 py-3 text-[15px] font-medium text-[#0A0A0A] hover:bg-[#EFEBE5]"
              >
                Make one for my brand →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
