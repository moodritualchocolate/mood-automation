/**
 * MEMORY GRAPH VIEW (Phase 116 — Wave 9: Manifestation Architecture)
 *
 * The civilization's memory, drawn as a graph. Beliefs, founding
 * myths, scars, standing laws, and the immune system's records become
 * nodes; the generations that bore them become the edges. This is the
 * organism's mind, mapped — not a list, a structure.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export type MemoryNodeKind = 'belief' | 'myth' | 'scar' | 'law' | 'immune';

export interface MemoryNode {
  id: string;
  label: string;
  kind: MemoryNodeKind;
  /** 0..1 — how strongly the node holds in memory. */
  weight: number;
  generation: number;
}

export interface MemoryEdge { from: string; to: string; }

export interface MemoryGraphViewModel {
  present: boolean;
  nodes: MemoryNode[];
  edges: MemoryEdge[];
  /** 0..10 — how dense and interconnected the memory has become. */
  density: number;
  oldest_memory: string | null;
  statement: string;
}

export function buildMemoryGraphView(snap: RuntimeSnapshot): MemoryGraphViewModel {
  const { civilization, organism } = snap;
  const nodes: MemoryNode[] = [];
  const edges: MemoryEdge[] = [];

  if (civilization) {
    for (const b of civilization.beliefs) {
      nodes.push({ id: `belief:${b.id}`, label: b.statement, kind: 'belief', weight: Math.min(1, b.strength / 10), generation: b.bornGeneration });
    }
    for (const m of civilization.myths) {
      nodes.push({ id: `myth:${m.id}`, label: m.story, kind: 'myth', weight: 0.85, generation: m.foundingGeneration });
    }
    for (const s of civilization.scars) {
      nodes.push({ id: `scar:${s.id}`, label: s.wound, kind: 'scar', weight: s.healed ? 0.35 : Math.min(1, s.severity / 10), generation: s.generation });
    }
    for (const l of civilization.laws) {
      nodes.push({ id: `law:${l.id}`, label: l.law, kind: 'law', weight: 0.9, generation: l.enactedGeneration });
    }
  }
  if (organism) {
    const seen = new Set<string>();
    for (const r of organism.immuneMemory) {
      if (seen.has(r.threat)) continue;
      seen.add(r.threat);
      nodes.push({ id: `immune:${r.threat}`, label: `survived ${r.threat}`, kind: 'immune', weight: 0.5, generation: r.age });
    }
  }

  // Edges — nodes from the same generation share a memory cluster.
  const byGen: Record<number, string[]> = {};
  for (const n of nodes) (byGen[n.generation] ??= []).push(n.id);
  for (const ids of Object.values(byGen)) {
    for (let i = 1; i < ids.length; i++) edges.push({ from: ids[0], to: ids[i] });
  }

  const density = Math.round(Math.min(10, nodes.length * 0.5 + edges.length * 0.4) * 10) / 10;
  const oldest = [...nodes].sort((a, b) => a.generation - b.generation)[0] ?? null;

  return {
    present: nodes.length > 0,
    nodes, edges, density,
    oldest_memory: oldest ? oldest.label : null,
    statement: nodes.length
      ? `${nodes.length} memories across the civilization's life — density ${density}/10`
      : 'the memory graph is empty — the civilization has formed no lasting memory',
  };
}
