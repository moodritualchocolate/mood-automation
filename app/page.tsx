/**
 * Landing — the single entry point of MOOD CREATIVE OS V1.
 *
 * The user does NOT write a prompt. They choose:
 *   1. Formula (V1 ships ENERGY only — but the picker shows the full shape)
 *   2. Campaign mode (optional)
 *
 * Then they press a single button and the system thinks for them.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CAMPAIGN_MODES, FORMULAS, type CampaignMode, type Formula } from '@/core/types';

export default function Landing() {
  const router = useRouter();
  const [formula] = useState<Formula>('ENERGY');
  const [mode, setMode] = useState<CampaignMode | null>(null);
  const [brutality, setBrutality] = useState<'lenient' | 'default' | 'brutal'>('default');
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    const params = new URLSearchParams({ formula, brutality });
    if (mode) params.set('mode', mode);
    router.push(`/studio?${params.toString()}`);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-8 md:px-16 pt-8 flex items-center justify-between">
        <div>
          <div className="eyebrow">MOOD CREATIVE OS</div>
          <div className="mt-1 text-xs text-bone-200/60">v0.1 · ENERGY engine</div>
        </div>
        <div className="text-xs text-bone-200/60 tabular-nums">{new Date().toISOString().slice(0, 10)}</div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="eyebrow mb-6">choose a formula</div>

        <div className="flex gap-3">
          {FORMULAS.map((f) => (
            <button
              key={f}
              className={`px-6 py-3 border hairline text-sm tracking-widest font-medium transition-colors ${
                formula === f ? 'bg-bone-50 text-ink-900' : 'text-bone-50 hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
          {['CALM', 'FOCUS', 'SLEEP'].map((dim) => (
            <button
              key={dim}
              disabled
              className="px-6 py-3 border hairline text-sm tracking-widest font-medium opacity-25 cursor-not-allowed"
              title="reserved — not in V1"
            >
              {dim}
            </button>
          ))}
        </div>

        <div className="mt-16 eyebrow mb-4">campaign mode <span className="opacity-60">— optional</span></div>
        <div className="flex flex-wrap gap-2 justify-center max-w-xl">
          <button
            className={`px-4 py-2 text-xs tracking-wider border hairline transition-colors ${
              mode === null ? 'bg-white/10 text-bone-50' : 'text-bone-50/70 hover:bg-white/5'
            }`}
            onClick={() => setMode(null)}
          >
            AUTO
          </button>
          {CAMPAIGN_MODES.map((m) => (
            <button
              key={m}
              className={`px-4 py-2 text-xs tracking-wider border hairline transition-colors ${
                mode === m ? 'bg-bone-50 text-ink-900' : 'text-bone-50/70 hover:bg-white/5'
              }`}
              onClick={() => setMode(m)}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-16 eyebrow mb-4">critic brutality</div>
        <div className="flex gap-2 justify-center">
          {(['lenient', 'default', 'brutal'] as const).map((b) => (
            <button
              key={b}
              className={`px-4 py-2 text-xs tracking-wider border hairline transition-colors ${
                brutality === b ? 'bg-bone-50 text-ink-900' : 'text-bone-50/70 hover:bg-white/5'
              }`}
              onClick={() => setBrutality(b)}
              title={
                b === 'lenient'
                  ? 'fewer rejections — useful for first runs without API keys'
                  : b === 'brutal'
                  ? 'creative-director-level rejection — most banners will fail'
                  : 'balanced — rejects safe and generic, accepts observed'
              }
            >
              {b.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          disabled={busy}
          onClick={generate}
          className="mt-12 px-10 py-4 bg-bone-50 text-ink-900 text-sm tracking-[0.3em] font-semibold disabled:opacity-50"
        >
          {busy ? 'COMPOSING…' : 'GENERATE'}
        </button>

        <p className="mt-6 text-xs text-bone-200/45 max-w-md">
          The system will choose the human moment, the truth beneath it, the composition, and the typography.
          You do not write a prompt. You did your job by choosing.
        </p>
      </section>

      <footer className="px-8 md:px-16 pb-8 flex justify-between items-end">
        <div className="text-xs text-bone-200/40 max-w-xs leading-relaxed">
          Not a banner generator. Not a prompt wrapper. An autonomous creative operating system.
        </div>
        <div className="eyebrow">v0.1 · build {process.env.NODE_ENV === 'production' ? 'prod' : 'dev'}</div>
      </footer>
    </main>
  );
}
