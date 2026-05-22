/**
 * CAUSAL MEMORY GRAPH (Phase 26 — Unified Cognitive Field)
 *
 * Connects every memory node CAUSALLY. Not "this happened" but "this
 * happened BECAUSE of this pressure, and it LATER created this coping
 * loop, which LEFT this residue, which the body ADAPTED around".
 *
 * The graph lets the system reason across time. It is a PURE module:
 * it defines the graph shape and the operations. Persistence is owned
 * by worldStatePersistence.
 *
 * Node kinds follow the spec's causal vocabulary:
 *   cause → behavior → consequence → residue → adaptation →
 *   symbolic-object → future-drift
 */

export type CausalNodeKind =
  | 'cause' | 'behavior' | 'consequence' | 'residue'
  | 'adaptation' | 'symbolic-object' | 'future-drift';

export interface CausalNode {
  id: string;                  // `${kind}:${label-slug}`
  kind: CausalNodeKind;
  label: string;
  firstSeen: number;
  lastSeen: number;
  weight: number;              // strengthens each time it recurs
}

export interface CausalEdge {
  from: string;
  to: string;
  relation: 'causes' | 'leads-to' | 'leaves' | 'adapts-into' | 'carried-by' | 'drifts-toward';
  weight: number;
}

export interface CausalMemoryGraph {
  nodes: Record<string, CausalNode>;
  edges: CausalEdge[];
}

export function createEmptyCausalGraph(): CausalMemoryGraph {
  return { nodes: {}, edges: {} as unknown as CausalEdge[] } as CausalMemoryGraph;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

export interface CausalChainLink {
  kind: CausalNodeKind;
  label: string;
}

const RELATION_BY_TARGET: Record<CausalNodeKind, CausalEdge['relation']> = {
  cause: 'causes',
  behavior: 'leads-to',
  consequence: 'leads-to',
  residue: 'leaves',
  adaptation: 'adapts-into',
  'symbolic-object': 'carried-by',
  'future-drift': 'drifts-toward',
};

/**
 * Record a causal chain into the graph. Each adjacent pair of links
 * becomes (or strengthens) an edge; each link becomes (or strengthens)
 * a node. Returns the SAME graph object, mutated, for chaining.
 */
export function recordCausalChain(graph: CausalMemoryGraph, chain: CausalChainLink[]): CausalMemoryGraph {
  if (!Array.isArray(graph.edges)) graph.edges = [];
  const now = Date.now();
  const ids: string[] = [];

  for (const link of chain) {
    const id = `${link.kind}:${slug(link.label)}`;
    ids.push(id);
    const existing = graph.nodes[id];
    if (existing) {
      existing.lastSeen = now;
      existing.weight += 1;
    } else {
      graph.nodes[id] = {
        id, kind: link.kind, label: link.label,
        firstSeen: now, lastSeen: now, weight: 1,
      };
    }
  }

  for (let i = 0; i < ids.length - 1; i++) {
    const from = ids[i];
    const to = ids[i + 1];
    const relation = RELATION_BY_TARGET[chain[i + 1].kind];
    const edge = graph.edges.find((e) => e.from === from && e.to === to);
    if (edge) edge.weight += 1;
    else graph.edges.push({ from, to, relation, weight: 1 });
  }
  return graph;
}

/** All nodes reachable downstream of a node id (causal consequences). */
export function queryDownstream(graph: CausalMemoryGraph, nodeId: string, depth = 4): CausalNode[] {
  if (!Array.isArray(graph.edges)) return [];
  const seen = new Set<string>();
  const out: CausalNode[] = [];
  let frontier = [nodeId];
  for (let d = 0; d < depth && frontier.length; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const e of graph.edges) {
        if (e.from === id && !seen.has(e.to)) {
          seen.add(e.to);
          const n = graph.nodes[e.to];
          if (n) { out.push(n); next.push(e.to); }
        }
      }
    }
    frontier = next;
  }
  return out;
}

export interface CausalGraphReport {
  node_count: number;
  edge_count: number;
  /** The strongest recurring causal pathway, as a readable string. */
  strongest_pathway: string | null;
  /** Nodes that have recurred enough to be campaign laws. */
  established_nodes: CausalNode[];
}

export function reportCausalGraph(graph: CausalMemoryGraph): CausalGraphReport {
  const nodes = Object.values(graph.nodes);
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const established_nodes = nodes.filter((n) => n.weight >= 3).sort((a, b) => b.weight - a.weight);

  let strongest_pathway: string | null = null;
  if (edges.length) {
    const top = [...edges].sort((a, b) => b.weight - a.weight)[0];
    const from = graph.nodes[top.from];
    const to = graph.nodes[top.to];
    if (from && to) strongest_pathway = `${from.label} ${top.relation.replace(/-/g, ' ')} ${to.label} (×${top.weight})`;
  }

  return {
    node_count: nodes.length,
    edge_count: edges.length,
    strongest_pathway,
    established_nodes,
  };
}
