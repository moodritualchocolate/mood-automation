/**
 * /runtime — the runtime manifestation dashboard (Wave 9).
 *
 * A window into the cognitive operating system. The page renders only
 * the RuntimeManifestation served by /api/runtime — every surface is
 * built from persistent runtime state. It polls on an interval so the
 * viewer is watching a living organism think, not reading a report.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RuntimeManifestation, LivenessState } from '@lib/index';
import { PulseBanner, RuntimePanel, SilenceBanner, DeepCognitionGrid, ProtectionTrail, CognitiveWeather } from './components';

const LIVENESS_COLOR: Record<LivenessState, string> = {
  awakening: '#C9A24B',
  alive: '#8AA98A',
  breathing: '#8AA98A',
  strained: '#C9A24B',
  dormant: '#6F8196',
  critical: '#FF4D2D',
};

export default function RuntimePage() {
  const [m, setM] = useState<RuntimeManifestation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshes, setRefreshes] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/runtime', { cache: 'no-store' });
      if (!res.ok) { setError(`runtime error ${res.status}`); return; }
      setM((await res.json()) as RuntimeManifestation);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => {
      void load();
      setRefreshes((r) => r + 1);
    }, 4000);
    return () => clearInterval(id);
  }, [load]);

  if (!m) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[11px] tracking-[0.28em] text-bone-200/40 uppercase pulse">
          {error ?? 'opening a window into cognition'}
        </div>
      </main>
    );
  }

  const b = m.brain;
  const dot = LIVENESS_COLOR[b.liveness];

  return (
    <main className="min-h-screen px-6 md:px-10 py-8 flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full pulse" style={{ background: dot }} />
          <span className="eyebrow">runtime manifestation</span>
          <span className="text-[10px] tracking-[0.28em] text-bone-200/35 uppercase">{b.liveness}</span>
        </div>
        <h1 className="text-2xl md:text-[2rem] tracking-tight text-bone-50 leading-snug max-w-3xl">
          {b.headline}
        </h1>
        {/* Wave 17 — the cognitive weather. The first impression on
            page load: one word for what the organism is feeling, one
            sentence for how it feels. */}
        <CognitiveWeather m={m} />
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-bone-200/50">
          <span>uptime {b.uptime_ticks} ticks</span>
          <span>organism age {b.organism_age}</span>
          <span>civilization gen {b.civilization_generation}</span>
          <span className="text-bone-200/40 italic">{m.presence.statement}</span>
        </div>
      </header>

      <PulseBanner m={m} />

      {/* Wave 17 — the unified Silence Engine reading. Aggregates
          silence signals from every layer (saturation, restraint,
          patience, meaning persistence, world tension) into one
          canonical directive: speak / hold / be-silent / go-quiet-now. */}
      <SilenceBanner m={m} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {m.layout.panels.map((p) => (
          <RuntimePanel
            key={p.panel}
            panelId={p.panel}
            title={p.title}
            hero={p.emphasis === 'hero'}
            m={m}
          />
        ))}
      </div>

      {/* Wave 17 — Waves 10–16 surfaced. Each persistent store
          (reality coupling, strategic future, autonomous action,
          reality feedback, live coupling, sovereign identity,
          generative presence) is shown as its own card. */}
      <DeepCognitionGrid m={m} />

      {/* Wave 17 — the protection trail. Runtime continuity for
          what restraint preserved. Each entry is a real moment the
          organism chose not to act. Silence as a record, not absence. */}
      <ProtectionTrail m={m} />

      <footer className="text-[10px] tracking-[0.22em] text-bone-200/30 uppercase pt-3 border-t hairline flex flex-wrap gap-x-4 gap-y-1">
        <span>{m.runtime_is_visible ? 'runtime visible' : 'runtime dormant'}</span>
        <span>surface true to cognition</span>
        <span>captured {new Date(m.captured_at).toISOString().slice(11, 19)}</span>
        <span className="text-bone-200/20">live · refresh #{refreshes}</span>
      </footer>
    </main>
  );
}
