/**
 * MANIFESTATION LAYOUT (Phase 129 — Wave 9: Manifestation Architecture)
 *
 * The runtime decides how it should be SEEN. The layout is not fixed
 * chrome — it is composed from the runtime's own state: the surface
 * that carries the most urgent truth this tick is promoted to the
 * hero position, and the rest fall into place behind it.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export type PanelEmphasis = 'hero' | 'primary' | 'secondary';

export interface LayoutPanel {
  panel: string;
  title: string;
  emphasis: PanelEmphasis;
}

export interface ManifestationLayoutViewModel {
  panels: LayoutPanel[];
  hero: string;
  statement: string;
}

const PANEL_ORDER: Array<{ panel: string; title: string; emphasis: PanelEmphasis }> = [
  { panel: 'organism-state', title: 'Organism State', emphasis: 'primary' },
  { panel: 'cognitive-pulse', title: 'Cognitive Pulse', emphasis: 'primary' },
  { panel: 'runtime-health', title: 'Runtime Health', emphasis: 'primary' },
  { panel: 'directive-stream', title: 'Directive Stream', emphasis: 'secondary' },
  { panel: 'cognition-timeline', title: 'Cognition Timeline', emphasis: 'secondary' },
  { panel: 'strategic-season', title: 'Strategic Season', emphasis: 'secondary' },
  { panel: 'world-state', title: 'World-State Monitor', emphasis: 'secondary' },
  { panel: 'attention-pressure', title: 'Attention Pressure', emphasis: 'secondary' },
  { panel: 'internal-conflict', title: 'Internal Conflict', emphasis: 'secondary' },
  { panel: 'identity-state', title: 'Identity State', emphasis: 'secondary' },
  { panel: 'drift-monitor', title: 'Drift Monitor', emphasis: 'secondary' },
  { panel: 'interrupt-surface', title: 'Interrupt Surface', emphasis: 'secondary' },
  { panel: 'executive-council', title: 'Executive Council', emphasis: 'secondary' },
  { panel: 'memory-graph', title: 'Memory Graph', emphasis: 'secondary' },
  { panel: 'escalation-surface', title: 'Decision Ledger', emphasis: 'secondary' },
  { panel: 'runtime-orchestration', title: 'Runtime Orchestration', emphasis: 'secondary' },
];

export function buildManifestationLayout(snap: RuntimeSnapshot, foreground: string): ManifestationLayoutViewModel {
  // The foreground surface is promoted to hero and floated to the top;
  // every other panel keeps its declared emphasis.
  const panels: LayoutPanel[] = PANEL_ORDER.map((p) => ({
    ...p,
    emphasis: p.panel === foreground ? 'hero' : p.emphasis,
  }));
  panels.sort((a, b) => {
    const rank = (e: PanelEmphasis) => (e === 'hero' ? 0 : e === 'primary' ? 1 : 2);
    return rank(a.emphasis) - rank(b.emphasis);
  });

  const hero = panels.find((p) => p.emphasis === 'hero')?.panel ?? foreground;

  return {
    panels,
    hero,
    statement: `the runtime is composed around "${hero}" — the surface carrying the most urgent truth this tick`,
  };
}
