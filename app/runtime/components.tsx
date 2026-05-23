/**
 * Runtime manifestation panels (Wave 9).
 *
 * Every panel renders ONLY from the RuntimeManifestation — the view
 * models built from persistent runtime state. No panel fetches, no
 * panel computes cognition, no panel fabricates. The dashboard is a
 * window into the organism, not a separate analytics layer.
 */

import type {
  RuntimeManifestation, Gauge, Tone,
} from '@lib/index';

const TONE: Record<Tone, string> = {
  good: '#8AA98A',
  warn: '#C9A24B',
  bad: '#FF4D2D',
  cool: '#6F8196',
  neutral: '#D8D2C8',
};

function toneOf(t: Tone): string { return TONE[t] ?? TONE.neutral; }

// ─── primitives ────────────────────────────────────────────────

export function Panel({
  title, hero, accent, accentTone, children,
}: {
  title: string;
  hero?: boolean;
  accent?: string;
  accentTone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`border hairline bg-ink-900/50 p-5 flex flex-col gap-3 ${hero ? 'md:col-span-2' : ''}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="eyebrow">{title}</h2>
        {accent && (
          <span
            className="text-[10px] tracking-[0.2em] uppercase shrink-0"
            style={{ color: accentTone ? toneOf(accentTone) : 'rgba(247,245,242,0.45)' }}
          >
            {accent}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function GaugeBar({ g }: { g: Gauge }) {
  const pct = Math.max(2, Math.min(100, (g.value / g.max) * 100));
  return (
    <div>
      <div className="flex justify-between text-[11px] text-bone-200/70">
        <span>{g.label}</span>
        <span style={{ color: toneOf(g.tone) }}>{g.display}</span>
      </div>
      <div className="h-[3px] bg-white/[0.06] mt-1">
        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: toneOf(g.tone) }} />
      </div>
    </div>
  );
}

function Line({ children, tone }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <div className="text-[12px] leading-snug flex gap-2" style={{ color: tone ? toneOf(tone) : 'rgba(216,210,200,0.8)' }}>
      <span className="text-bone-200/30">·</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}

function Statement({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-bone-200/55 leading-relaxed italic">{children}</p>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-bone-200/35 leading-relaxed">{children}</p>;
}

// ─── pulse banner — the organism's heartbeat ───────────────────

export function PulseBanner({ m }: { m: RuntimeManifestation }) {
  const p = m.pulse;
  const w = 720;
  const h = 70;
  const pts = p.waveform
    .map((v, i) => `${(i / (p.waveform.length - 1)) * w},${h - 6 - v * (h - 14)}`)
    .join(' ');
  const tone = p.rhythm === 'racing' || p.rhythm === 'irregular' ? '#FF4D2D'
    : p.rhythm === 'faint' ? '#6F8196' : '#8AA98A';
  return (
    <div className="border hairline bg-ink-900/50 px-5 py-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="eyebrow">cognitive pulse</span>
        <span className="text-[11px] tracking-widest" style={{ color: tone }}>
          {p.present ? `${p.rate} · ${p.rhythm.toUpperCase()}` : 'NO PULSE'}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[70px]">
        {/* The pulse line itself subscribes to atmospheric breath.
            When silence deepens, the heartbeat trace softens with
            the same cadence as everything else on the page. */}
        <polyline
          className="atmos-breathe"
          points={pts}
          fill="none"
          stroke={tone}
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity={p.present ? 0.9 : 0.25}
        />
      </svg>
    </div>
  );
}

// ─── per-panel renderers ───────────────────────────────────────

function OrganismPanel({ m }: { m: RuntimeManifestation }) {
  const o = m.organism;
  return (
    <>
      {o.gauges.map((g) => <GaugeBar key={g.label} g={g} />)}
      <div className="grid grid-cols-3 gap-2 text-[11px] text-bone-200/60 pt-1">
        <span>age {o.age}</span>
        <span>rested {o.rest_count}×</span>
        <span>adapted {o.adaptation_count}×</span>
      </div>
      <Line>{o.immune_recent_survival}</Line>
      <Statement>{o.statement}</Statement>
    </>
  );
}

function HealthPanel({ m }: { m: RuntimeManifestation }) {
  const h = m.health;
  return (
    <>
      {h.gauges.map((g) => <GaugeBar key={g.label} g={g} />)}
      <Statement>{h.statement}</Statement>
    </>
  );
}

function DirectivePanel({ m }: { m: RuntimeManifestation }) {
  const d = m.directives;
  if (!d.present) return <Empty>{d.statement}</Empty>;
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {d.stream.map((e, i) => (
          <span
            key={i}
            className="text-[10px] tracking-wide px-1.5 py-0.5 border hairline"
            style={{ color: toneOf(e.tone), opacity: i === 0 ? 1 : 0.5 - i * 0.02 }}
          >
            {e.directive}
          </span>
        ))}
      </div>
      <Statement>{d.statement}</Statement>
    </>
  );
}

function TimelinePanel({ m }: { m: RuntimeManifestation }) {
  const t = m.timeline;
  if (!t.present) return <Empty>{t.statement}</Empty>;
  return (
    <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto">
      {t.events.map((e, i) => (
        <div key={i} className="flex gap-2 text-[11px]">
          <span className="text-bone-200/30 w-10 shrink-0 tabular-nums">t{e.tick}</span>
          <span style={{ color: toneOf(e.tone) }} className="shrink-0">{e.label}</span>
          <span className="text-bone-200/45 flex-1 truncate">{e.detail}</span>
        </div>
      ))}
    </div>
  );
}

function SeasonPanel({ m }: { m: RuntimeManifestation }) {
  const s = m.season;
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {s.markers.map((mk) => (
          <span
            key={mk.season}
            className="text-[10px] tracking-wide px-2 py-1 border hairline"
            style={{
              color: mk.active ? '#050505' : 'rgba(216,210,200,0.5)',
              background: mk.active ? '#D8D2C8' : 'transparent',
            }}
          >
            {mk.season}
          </span>
        ))}
      </div>
      <Statement>{s.statement}</Statement>
    </>
  );
}

function WorldStatePanel({ m }: { m: RuntimeManifestation }) {
  const w = m.worldState;
  if (!w.present) return <Empty>{w.statement}</Empty>;
  return (
    <>
      {w.pressures.map((g) => <GaugeBar key={g.label} g={g} />)}
      <Statement>{w.statement}</Statement>
    </>
  );
}

function PressureMapPanel({ m }: { m: RuntimeManifestation }) {
  const p = m.pressureMap;
  if (!p.present) return <Empty>{p.statement}</Empty>;
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {p.cells.map((c) => (
          <div
            key={c.label}
            className="aspect-[4/3] border hairline flex flex-col justify-end p-1.5"
            style={{ background: `rgba(255,77,45,${0.06 + c.intensity * 0.5})` }}
          >
            <span className="text-[9px] leading-tight text-bone-50/85">{c.label}</span>
            <span className="text-[9px] text-bone-200/45">{Math.round(c.intensity * 100)}%</span>
          </div>
        ))}
      </div>
      <Statement>{p.statement}</Statement>
    </>
  );
}

function ConflictPanel({ m }: { m: RuntimeManifestation }) {
  const c = m.conflict;
  if (c.at_peace) return <Empty>{c.statement}</Empty>;
  return (
    <>
      {c.conflicts.map((cf, i) => (
        <Line key={i} tone={cf.tone}>{cf.conflict} <span className="text-bone-200/40">({cf.intensity}/10)</span></Line>
      ))}
      <Statement>{c.statement}</Statement>
    </>
  );
}

function IdentityPanel({ m }: { m: RuntimeManifestation }) {
  const id = m.identity;
  if (!id.present) return <Empty>{id.statement}</Empty>;
  return (
    <>
      <GaugeBar g={{ label: 'identity strength', value: id.identity_strength, max: 10, display: `${id.identity_strength}/10`, tone: id.identity_held ? 'good' : 'bad' }} />
      <GaugeBar g={{ label: 'optimization share', value: id.optimization_share * 10, max: 10, display: `${Math.round(id.optimization_share * 100)}%`, tone: id.optimization_share > 0.5 ? 'bad' : 'good' }} />
      {id.signals.map((s, i) => <Line key={i}>{s}</Line>)}
      <Statement>{id.statement}</Statement>
    </>
  );
}

function DriftPanel({ m }: { m: RuntimeManifestation }) {
  const d = m.drift;
  if (!d.present) return <Empty>{d.statement}</Empty>;
  return (
    <>
      <GaugeBar g={{ label: 'drift magnitude', value: d.drift_magnitude, max: 10, display: `${d.drift_magnitude}/10`, tone: d.drift_detected ? 'bad' : 'good' }} />
      {d.signals.map((s, i) => <Line key={i} tone={s.tone}>{s.signal}</Line>)}
      <Statement>{d.statement}</Statement>
    </>
  );
}

function InterruptPanel({ m }: { m: RuntimeManifestation }) {
  const it = m.interrupts;
  return (
    <>
      <div className="grid grid-cols-3 gap-2 text-[12px]">
        <Metric label="total" value={String(it.total_interrupts)} />
        <Metric label="per tick" value={String(it.interrupt_rate)} />
        <Metric label="line" value={it.line_state} tone={it.line_state === 'storm' ? 'bad' : it.line_state === 'active' ? 'warn' : 'good'} />
      </div>
      <Statement>{it.statement}</Statement>
    </>
  );
}

function CouncilPanel({ m }: { m: RuntimeManifestation }) {
  const c = m.council;
  if (!c.present) return <Empty>{c.statement}</Empty>;
  return (
    <>
      {c.members.length > 0 && (
        <div className="flex flex-col gap-1">
          {c.members.slice(0, 6).map((mem) => (
            <div key={mem.entity} className="flex justify-between text-[11px]">
              <span className="text-bone-200/70 truncate">{mem.entity}</span>
              <span style={{ color: toneOf(mem.tone) }}>{mem.standing}</span>
            </div>
          ))}
        </div>
      )}
      <Statement>{c.statement}</Statement>
    </>
  );
}

function MemoryGraphPanel({ m }: { m: RuntimeManifestation }) {
  const g = m.memoryGraph;
  if (!g.present) return <Empty>{g.statement}</Empty>;
  const w = 320;
  const h = 150;
  const placed = g.nodes.slice(0, 26).map((n, i) => {
    const angle = (i / Math.min(26, g.nodes.length)) * Math.PI * 2;
    const radius = 26 + (i % 4) * 18;
    return {
      n,
      x: w / 2 + Math.cos(angle) * radius * 1.6,
      y: h / 2 + Math.sin(angle) * radius,
    };
  });
  const kindColor: Record<string, string> = {
    belief: '#8AA98A', myth: '#C9A24B', scar: '#FF4D2D', law: '#6F8196', immune: '#D8D2C8',
  };
  return (
    <>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[150px]">
        {g.edges.map((e, i) => {
          const a = placed.find((p) => p.n.id === e.from);
          const b = placed.find((p) => p.n.id === e.to);
          if (!a || !b) return null;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(247,245,242,0.12)" strokeWidth="0.6" />;
        })}
        {placed.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r={2 + p.n.weight * 4}
            fill={kindColor[p.n.kind] ?? '#D8D2C8'}
            opacity={0.45 + p.n.weight * 0.5}
          />
        ))}
      </svg>
      <Statement>{g.statement}</Statement>
    </>
  );
}

function EscalationPanel({ m }: { m: RuntimeManifestation }) {
  const e = m.escalation;
  if (!e.present) return <Empty>{e.statement}</Empty>;
  return (
    <>
      <div className="grid grid-cols-3 gap-2 text-[12px]">
        <Metric label="shipped" value={String(e.approved_count)} tone="good" />
        <Metric label="refused" value={String(e.refused_count)} tone="warn" />
        <Metric label="posture" value={e.posture} />
      </div>
      <div className="flex flex-wrap gap-1">
        {e.ledger.map((d, i) => (
          <span key={i} className="w-2.5 h-2.5" title={d.detail} style={{ background: toneOf(d.tone) }} />
        ))}
      </div>
      <Statement>{e.statement}</Statement>
    </>
  );
}

function OrchestrationPanel({ m }: { m: RuntimeManifestation }) {
  const o = m.orchestration;
  if (!o.present) return <Empty>{o.statement}</Empty>;
  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {o.panels.map((p) => (
          <div key={p.label} className="flex justify-between text-[11px]">
            <span className="text-bone-200/55">{p.label}</span>
            <span style={{ color: toneOf(p.tone) }} className="text-right">{p.value}</span>
          </div>
        ))}
      </div>
      <Statement>{o.statement}</Statement>
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="border hairline px-2 py-1.5">
      <div className="eyebrow text-[8px]">{label}</div>
      <div className="text-[13px] mt-0.5" style={{ color: tone ? toneOf(tone) : '#F7F5F2' }}>{value}</div>
    </div>
  );
}

// ─── panel registry — keyed by the layout's panel ids ──────────

const RENDERERS: Record<string, (m: RuntimeManifestation) => React.ReactNode> = {
  'organism-state': (m) => <OrganismPanel m={m} />,
  'cognitive-pulse': (m) => <Statement>{m.pulse.statement}</Statement>,
  'runtime-health': (m) => <HealthPanel m={m} />,
  'directive-stream': (m) => <DirectivePanel m={m} />,
  'cognition-timeline': (m) => <TimelinePanel m={m} />,
  'strategic-season': (m) => <SeasonPanel m={m} />,
  'world-state': (m) => <WorldStatePanel m={m} />,
  'attention-pressure': (m) => <PressureMapPanel m={m} />,
  'internal-conflict': (m) => <ConflictPanel m={m} />,
  'identity-state': (m) => <IdentityPanel m={m} />,
  'drift-monitor': (m) => <DriftPanel m={m} />,
  'interrupt-surface': (m) => <InterruptPanel m={m} />,
  'executive-council': (m) => <CouncilPanel m={m} />,
  'memory-graph': (m) => <MemoryGraphPanel m={m} />,
  'escalation-surface': (m) => <EscalationPanel m={m} />,
  'runtime-orchestration': (m) => <OrchestrationPanel m={m} />,
};

export function RuntimePanel({
  panelId, title, hero, m,
}: {
  panelId: string;
  title: string;
  hero: boolean;
  m: RuntimeManifestation;
}) {
  const render = RENDERERS[panelId];
  if (!render) return null;
  return (
    <Panel title={title} hero={hero} accent={hero ? 'FOREGROUND' : undefined} accentTone="warn">
      {render(m)}
    </Panel>
  );
}

// ─── WAVE 17 — Embodied Runtime Presence ───────────────────────
// Surfaces the deepest cognition layers (Waves 10–16) and the
// canonical Silence Engine reading the user identified as central.

const SILENCE_TONE: Record<string, Tone> = {
  speak: 'good',
  hold: 'cool',
  'be-silent': 'warn',
  'go-quiet-now': 'bad',
};

const SILENCE_LABEL: Record<string, string> = {
  speak: 'SPEAK',
  hold: 'HOLD',
  'be-silent': 'BE SILENT',
  'go-quiet-now': 'GO QUIET',
};

/**
 * The canonical Silence Engine banner. The single most important
 * runtime surface in Wave 17: should the brand be silent right now,
 * and why? Aggregated from every layer that has a notion of silence.
 *
 * When silence is the move, the banner BREATHES — the rendering
 * itself enacts the restraint. The values never move; only the
 * opacity does. Silence is shown as active protection, not absence.
 */
export function SilenceBanner({ m }: { m: RuntimeManifestation }) {
  const s = m.deepCognition.silence;
  const tone = SILENCE_TONE[s.directive] ?? 'neutral';
  const color = toneOf(tone);
  const label = SILENCE_LABEL[s.directive] ?? s.directive.toUpperCase();
  const strengthPct = Math.max(4, Math.min(100, (s.silence_strength / 10) * 100));

  // The breath the banner wears. Derived from the directive — speak
  // gets no breath because nothing is being held.
  const breathClass =
    s.directive === 'go-quiet-now' ? 'breathe-go-quiet'
    : s.directive === 'be-silent'   ? 'breathe-silent'
    : s.directive === 'hold'        ? 'breathe-hold'
    : '';

  // A subtle inner glow that intensifies with silence strength. When
  // the directive is speak, the glow evaporates.
  const innerGlow = s.silence_is_the_move
    ? `inset 0 0 ${24 + s.silence_strength * 4}px -8px ${color}26`
    : 'none';

  return (
    <div
      className="border hairline bg-ink-900/50 px-5 py-4 flex flex-col gap-3"
      style={{
        boxShadow: innerGlow,
        // Transition timing inherits the atmospheric cadence — state
        // changes themselves slow with the organism's attention.
        transition: 'box-shadow var(--atmos-transition) ease-in-out',
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="eyebrow">silence engine</span>
          <span className="text-[10px] tracking-[0.28em] uppercase" style={{ color: 'rgba(247,245,242,0.4)' }}>
            the central distinction
          </span>
        </div>
        <span
          className={`text-[11px] tracking-[0.3em] font-medium ${breathClass}`}
          style={{ color }}
        >
          {label} · {s.silence_strength}/10
        </span>
      </div>
      <p className={`text-[13px] leading-relaxed text-bone-50/85 ${breathClass}`}>
        {s.statement}
      </p>
      {s.contributing_reasons.length > 0 && s.contributing_reasons[0] !== 'none' && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] tracking-[0.18em] uppercase text-bone-200/45">
          {s.contributing_reasons.map((r) => (
            <span key={r} className="border hairline px-2 py-[2px]" style={{ borderColor: 'rgba(247,245,242,0.12)' }}>
              {r}
            </span>
          ))}
        </div>
      )}
      <div className="h-[2px] bg-white/[0.06] mt-1">
        <div
          className={`h-full transition-all duration-700 ${breathClass}`}
          style={{ width: `${strengthPct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/**
 * The cognitive weather header — a single word that says what the
 * organism is feeling right now. The first impression on page load.
 * Aesthetic but never invented; derived from the same persistent
 * state every other surface reads from.
 */
export function CognitiveWeather({ m }: { m: RuntimeManifestation }) {
  const w = m.deepCognition.weather;
  const trail = m.deepCognition.weatherTrail;
  const color = toneOf(w.tone);
  const breathClass = w.breath ?? '';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] tracking-[0.28em] uppercase text-bone-200/35">
          weather
        </span>
        <span
          className={`text-[11px] tracking-[0.32em] font-medium uppercase ${breathClass}`}
          style={{ color }}
        >
          {w.weather}
        </span>
        <span className="text-[11px] text-bone-200/55 italic">
          {w.felt_as}
        </span>
      </div>
      {/* Wave 17.6 — the weather trail. A horizontal strip of the
          last N samples; the eye reads where the organism came from
          in the same glance as where it is now. Marked dots indicate
          samples that coincided with a protection or a scar. */}
      {trail.dots.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.18em] uppercase text-bone-200/25">
            history
          </span>
          <div className="flex items-center gap-[3px]" aria-label="recent weather history">
            {trail.dots.map((d) => (
              <span
                key={d.i}
                className="block"
                title={d.weather}
                style={{
                  width: d.marked ? 5 : 4,
                  height: d.marked ? 5 : 4,
                  borderRadius: 9999,
                  background: toneOf(d.tone),
                  opacity: 0.35 + (d.i / Math.max(1, trail.dots.length - 1)) * 0.5,
                }}
              />
            ))}
          </div>
          {trail.transition && (
            <span className="text-[10px] tracking-[0.18em] uppercase text-bone-200/40 ml-1">
              {trail.transition.from} → {trail.transition.to}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The deep cognition grid — one card per Wave 10–16 layer, each
 * showing its current statement and a small set of gauges. The
 * deepest cognition becomes legible in a glance.
 */
export function DeepCognitionGrid({ m }: { m: RuntimeManifestation }) {
  const dc = m.deepCognition;

  if (!dc.any_layer_present) {
    return (
      <section className="border hairline bg-ink-900/50 p-5">
        <h2 className="eyebrow mb-2">deep cognition</h2>
        <Empty>{dc.statement}</Empty>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow">deep cognition</h2>
        <span className="text-[10px] tracking-[0.22em] uppercase text-bone-200/40">
          waves 10–16 · {dc.layers.length} layer(s) visible
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {dc.layers.map((layer) => (
          <article key={layer.name} className="border hairline bg-ink-900/50 p-4 flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 atmos-breathe-faint"
                  style={{ background: toneOf(layer.tone), opacity: 0.85 }}
                />
                <h3 className="text-[12px] tracking-[0.2em] uppercase text-bone-100/85">
                  {layer.name}
                </h3>
              </div>
              <span className="text-[10px] tracking-[0.18em] uppercase text-bone-200/35">
                wave {layer.wave}
              </span>
            </div>
            <Statement>{layer.statement}</Statement>
            <div className="flex flex-col gap-1.5 pt-1">
              {layer.gauges.map((g) => (
                <GaugeBar key={g.label} g={g} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * The protection trail — runtime continuity for what restraint
 * preserved. Each row is a moment the organism chose not to act,
 * the strength of that silence, and the reasons that contributed.
 * Silence here looks like a record, not absence.
 */
export function ProtectionTrail({ m }: { m: RuntimeManifestation }) {
  const trail = m.deepCognition.protectionTrail;

  if (!trail.any_protection_history) {
    return (
      <section className="border hairline bg-ink-900/50 p-5 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="eyebrow">what restraint protected</h2>
          <span className="text-[10px] tracking-[0.22em] uppercase text-bone-200/35">
            runtime continuity
          </span>
        </div>
        <Empty>{trail.summary}</Empty>
      </section>
    );
  }

  return (
    <section className="border hairline bg-ink-900/50 p-5 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow">what restraint protected</h2>
        <span className="text-[10px] tracking-[0.22em] uppercase text-bone-200/40">
          {trail.total_protections} protection{trail.total_protections === 1 ? '' : 's'} · last {trail.trail.length}
        </span>
      </div>
      <p className="text-[12px] text-bone-200/55 leading-relaxed italic">
        {trail.summary}
      </p>
      {/* Vertical rail threading the entries together. Silence reads
          as one continuous record instead of scattered events. */}
      <div className="relative pl-4 pt-1">
        <div className="absolute left-[3px] top-1 bottom-1 trail-rail" aria-hidden />
        <ol className="flex flex-col gap-3">
          {[...trail.trail].reverse().map((entry, idx) => {
            const tone: Tone = SILENCE_TONE[entry.directive] ?? 'cool';
            const color = toneOf(tone);
            return (
              <li key={`${entry.at}-${idx}`} className="relative">
                <span
                  className="absolute -left-4 top-[7px] w-[7px] h-[7px] rounded-full border"
                  style={{
                    background: '#050505',
                    borderColor: color,
                    boxShadow: `0 0 0 2px rgba(5,5,5,1)`,
                  }}
                  aria-hidden
                />
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color }}>
                    {SILENCE_LABEL[entry.directive] ?? entry.directive.toUpperCase()}
                    <span className="text-bone-200/30 ml-2 tracking-[0.18em]">{entry.strength}/10</span>
                  </span>
                  <span className="text-[10px] tracking-[0.18em] uppercase text-bone-200/35 shrink-0">
                    {entry.ago}
                  </span>
                </div>
                <p className="text-[12px] text-bone-200/75 leading-snug mt-0.5">
                  {entry.statement}
                </p>
                {entry.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 text-[10px] tracking-[0.16em] uppercase text-bone-200/40">
                    {entry.reasons.map((r) => (
                      <span key={r}>{r}</span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

const SCAR_TONE: Record<string, Tone> = {
  'overreach':         'warn',
  'noise':             'warn',
  'broken-restraint':  'bad',
  'meaning-dilution':  'warn',
  'applause-chasing':  'bad',
  'identity-drift':    'bad',
  'compulsive-action': 'bad',
};

/**
 * The scar trail — the dark counterpart to the protection trail.
 * Each entry is a moment the organism shipped despite itself.
 * Severity, description, wisdom. Permanent memory; scars are how
 * restraint earns its way to becoming wisdom.
 */
export function ScarTrail({ m }: { m: RuntimeManifestation }) {
  const t = m.deepCognition.scarTrail;

  if (!t.any_scars) {
    return (
      <section className="border hairline bg-ink-900/50 p-5 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="eyebrow">contradiction scars</h2>
          <span className="text-[10px] tracking-[0.22em] uppercase text-bone-200/35">
            wisdom · 0 on record
          </span>
        </div>
        <p className="text-[12px] text-bone-200/55 leading-relaxed italic">
          {t.summary}
        </p>
      </section>
    );
  }

  return (
    <section className="border hairline bg-ink-900/50 p-5 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow">contradiction scars</h2>
        <span className="text-[10px] tracking-[0.22em] uppercase text-bone-200/40">
          wisdom · {t.total_scars} on record
        </span>
      </div>
      <p className="text-[12px] text-bone-200/55 leading-relaxed italic">
        {t.summary}
      </p>
      <div className="relative pl-4 pt-1">
        <div className="absolute left-[3px] top-1 bottom-1 trail-rail" aria-hidden />
        <ol className="flex flex-col gap-3">
          {[...t.trail].reverse().map((entry, idx) => {
            const tone: Tone = SCAR_TONE[entry.kind] ?? 'warn';
            const color = toneOf(tone);
            return (
              <li key={`${entry.at}-${idx}`} className="relative">
                <span
                  className="absolute -left-4 top-[7px] w-[7px] h-[7px] border"
                  style={{
                    background: '#050505',
                    borderColor: color,
                    boxShadow: `0 0 0 2px rgba(5,5,5,1)`,
                  }}
                  aria-hidden
                />
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color }}>
                    {entry.kind.replace(/-/g, ' ')}
                    <span className="text-bone-200/30 ml-2 tracking-[0.18em]">{entry.severity}/10</span>
                  </span>
                  <span className="text-[10px] tracking-[0.18em] uppercase text-bone-200/35 shrink-0">
                    {entry.ago}
                  </span>
                </div>
                <p className="text-[12px] text-bone-200/75 leading-snug mt-0.5">
                  {entry.description}
                </p>
                <p className="text-[11px] italic mt-1" style={{ color: 'rgba(216,210,200,0.55)' }}>
                  — {entry.wisdom}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/**
 * The external pressure field — Wave 17.7's preparation surface
 * for real-world coupling. Six dimensions, each shown as a small
 * bar that points left or right from a center axis. The bars are
 * smoothed (EMA in the gateway), so they move slowly even if raw
 * signals spike.
 *
 * Pressure is shown but never spoken for. The dashboard surfaces
 * the field; the cognitive weather remains sovereign.
 */
export function PressureField({ m }: { m: RuntimeManifestation }) {
  const pf = m.deepCognition.pressureField;

  return (
    <section className="border hairline bg-ink-900/50 p-5 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow">external pressure field</h2>
        <span className="text-[10px] tracking-[0.22em] uppercase text-bone-200/40">
          {pf.has_pressure_field
            ? `${pf.readings_ingested} reading${pf.readings_ingested === 1 ? '' : 's'} · magnitude ${Math.round(pf.field_magnitude * 100)}%`
            : 'gateway open · awaiting'}
        </span>
      </div>
      <p className="text-[12px] text-bone-200/55 leading-relaxed italic">
        {pf.summary}
      </p>
      {/* Wave 17.9 — active sources. The world is pressuring the
          organism through these channels right now. Showing the
          source names makes the pressure legible without making
          the organism reactive to it. */}
      {pf.active_sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] tracking-[0.18em] uppercase text-bone-200/45">
          <span className="text-bone-200/30">world →</span>
          {pf.active_sources.map((s) => (
            <span
              key={s.name}
              className="border hairline px-2 py-[2px]"
              style={{ borderColor: 'rgba(247,245,242,0.12)' }}
            >
              {s.name} · {s.count}
            </span>
          ))}
        </div>
      )}
      {pf.has_pressure_field && (
        <ul className="flex flex-col gap-1.5 pt-1">
          {pf.dimensions.map((d) => {
            const pct = Math.round(Math.abs(d.vector) * 100);
            const color = toneOf(d.tone);
            const isRight = d.vector >= 0;
            return (
              <li key={d.kind} className="flex items-center gap-3 text-[11px]">
                <span className="w-[140px] tracking-[0.16em] uppercase text-bone-200/55 shrink-0">
                  {d.kind.replace(/-/g, ' ')}
                </span>
                {/* Bipolar bar: center at 50%, fill grows left or right
                    depending on the sign of the vector. */}
                <div className="flex-1 h-[6px] relative">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-white/[0.08]" />
                  <div
                    className="absolute inset-y-0 transition-all atmos-breathe-faint"
                    style={{
                      [isRight ? 'left' : 'right']: '50%',
                      width: `${pct / 2}%`,
                      background: color,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="w-12 text-right text-bone-200/40 tabular-nums shrink-0">
                  {d.vector >= 0 ? '+' : ''}{d.vector.toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
