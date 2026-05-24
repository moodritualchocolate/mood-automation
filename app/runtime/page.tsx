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
import { PulseBanner, RuntimePanel, SilenceBanner, DeepCognitionGrid, ProtectionTrail, CognitiveWeather, ScarTrail, PressureField, TemporalCognition, InternalDraft, InternalReview, RevisionTrace, ApprovalStatePanel, CognitiveCoherence } from './components';

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
    let id: ReturnType<typeof setInterval> | null = setInterval(() => {
      void load();
      setRefreshes((r) => r + 1);
    }, 4000);

    // Mobile coherence: when the tab backgrounds (iOS Safari throttles
    // setInterval aggressively when the screen sleeps), pause polling.
    // When it foregrounds again, refresh immediately so the viewer sees
    // current atmosphere the moment they look, not stale state.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void load();
        setRefreshes((r) => r + 1);
        if (id === null) {
          id = setInterval(() => {
            void load();
            setRefreshes((r) => r + 1);
          }, 4000);
        }
      } else if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (id !== null) clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
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

  // Wave 17.6 / 17.7 — vignette bias from two sources:
  //   memory pressure (recent scars and protections)         × 0.08
  //   external pressure field magnitude (digested signals)   × 0.06
  // Both are subtle and additive. Neither alone can override the
  // data-weather baseline; together they bias the atmosphere by a
  // perceptible-but-not-loud amount. The cognitive weather word
  // remains fully sovereign — pressure cannot recolour it.
  const memoryPressure = m.deepCognition.weatherTrail.memory_pressure;
  const fieldPressure = m.deepCognition.pressureField.field_magnitude;
  const bias = memoryPressure * 0.08 + fieldPressure * 0.06;
  const atmosStyle: React.CSSProperties = {
    gap: 'var(--atmos-gap)',
    transition: 'gap var(--atmos-transition) ease-in-out',
  };
  if (bias > 0) {
    (atmosStyle as Record<string, string>)['--atmos-vignette-bias'] = `${bias}`;
  }

  return (
    <main
      className="min-h-screen px-6 md:px-10 py-8 flex flex-col relative"
      data-weather={m.deepCognition.weather.weather}
      style={atmosStyle}
    >
      {/* Wave 17.5 — atmospheric coherence. A subtle vignette that
          deepens when the organism's attention turns inward. Never
          decorative; the strength comes from --atmos-vignette which
          is driven by the cognitive weather of the moment. */}
      <div className="atmos-vignette" aria-hidden />

      <header className="flex flex-col gap-3 relative z-10">
        <div className="flex items-center gap-3">
          {/* The status dot inherits the cognitive weather breath
              when silence is the move — so the very heartbeat at the
              top of the page slows with the organism. Falls back to
              the existing pulse otherwise. */}
          <span
            className={`w-2.5 h-2.5 rounded-full ${m.deepCognition.weather.breath ?? 'pulse'}`}
            style={{ background: dot }}
          />
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
          <span>runs lived {b.organism_age}</span>
          <span>evolutionary age {m.organism.evolutionary_age}</span>
          <span>civilization gen {b.civilization_generation}</span>
          <span className="text-bone-200/40 italic">{m.presence.statement}</span>
        </div>
      </header>

      <PulseBanner m={m} />

      {/* Wave 24 — the first internal draft, when one exists.
          Renders nothing while currentDraft is null on disk. */}
      <InternalDraft m={m} />

      {/* Wave 26 — Phase 7 internal review layer. Each panel renders
          only when its underlying state exists. Approval / coherence
          appear after the chain progresses; revision trace appears
          once a draft has any revision history. */}
      <InternalReview m={m} />
      <RevisionTrace m={m} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ApprovalStatePanel m={m} />
        <CognitiveCoherence m={m} />
      </div>

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

      {/* Wave 17.7 — external pressure field. Architectural
          preparation for real-world coupling: digested weak signals
          enter here as pressure, never as commands. The dashboard
          shows them; the cognitive weather remains sovereign. */}
      <PressureField m={m} />

      {/* Wave 18 — temporal cognition. The organism perceiving
          duration: what persisted, returned, slowly built, recovered,
          compounded, kept teaching. Pure derivation across the four
          archives — no new sensing, just memory continuity. */}
      <TemporalCognition m={m} />

      {/* Wave 17 — the protection / scar twin trails. Protection
          shows what restraint preserved; scars show what shipped
          despite restraint. Together: a track record of conscience. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProtectionTrail m={m} />
        <ScarTrail m={m} />
      </div>

      <footer className="text-[10px] tracking-[0.22em] text-bone-200/30 uppercase pt-3 border-t hairline flex flex-wrap gap-x-4 gap-y-1">
        <span>{m.runtime_is_visible ? 'runtime visible' : 'runtime dormant'}</span>
        <span>surface true to cognition</span>
        <span>captured {new Date(m.captured_at).toISOString().slice(11, 19)}</span>
        <span className="text-bone-200/20">live · refresh #{refreshes}</span>
      </footer>
    </main>
  );
}
