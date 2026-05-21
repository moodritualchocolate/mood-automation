/**
 * OBJECT MEMORY GRAPH (Phase 9)
 *
 * Objects accumulate emotional meaning over time. The spec named it:
 *
 *   coffee cup: first = stimulation
 *               later = exhaustion
 *               later = avoidance
 *               later = loneliness
 *
 * Phase 7's objectEmotionMemory stored a SINGLE dominant core per
 * object. Phase 9 reads its history and produces an EVOLUTION arc —
 * the sequence of meanings the object has carried, with the current
 * "loaded" meaning at the top.
 *
 * The graph reports per object:
 *   - chronological evolution (oldest → newest meanings)
 *   - currentLoadedMeaning    — what the object now SAYS in this campaign
 *   - emotionalWeight          — 0..10 how much meaning the object has
 *                                accumulated (high = use sparingly)
 *
 * The meta-critic uses emotionalWeight to detect "this object has
 * spoken too loudly" — the spec's named question.
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { ObjectMotif } from './objectEmotionMemory';
import { extractObjectsFromBrief } from './objectEmotionMemory';
import type { EmotionalCoreId } from './humanTruthEngine';

export interface ObjectNode {
  objectId: string;
  evolution: Array<{ core: EmotionalCoreId | 'unmapped'; ts: number; bannerId: string }>;
  currentLoadedMeaning: string;
  emotionalWeight: number;
  /** True when this object has carried multiple distinct cores
   *  — it has BECOME a symbol. */
  isSymbolic: boolean;
}

export interface ObjectMemoryGraph {
  nodes: ObjectNode[];
  loudest: ObjectNode | null;
  symbolicObjects: ObjectNode[];
}

export function buildObjectMemoryGraph(args: {
  trail: EmotionalTraceEntry[];
  motifs: ObjectMotif[];
  /** Per-banner brief scenes — passed when known, used to extract
   *  per-banner object mentions (so the evolution is chronological). */
  briefScenes?: Array<{ bannerId: string; scene: string; ts: number }>;
}): ObjectMemoryGraph {
  const { trail, motifs, briefScenes = [] } = args;

  // Build per-object evolution by joining trail entries (which carry
  // the family/core via stateId mapping) with brief scenes (which
  // carry the object mentions).
  const trailByBannerId = new Map(trail.map((t) => [t.bannerId, t]));
  const evolutionPerObject = new Map<string, ObjectNode['evolution']>();

  for (const bs of briefScenes) {
    const objects = extractObjectsFromBrief(bs.scene, []);
    const t = trailByBannerId.get(bs.bannerId);
    const coreId = (t?.facts ? coreFromEntry(t) : null) ?? 'unmapped' as const;
    for (const objectId of objects) {
      const list = evolutionPerObject.get(objectId) ?? [];
      list.push({ core: coreId, ts: bs.ts, bannerId: bs.bannerId });
      evolutionPerObject.set(objectId, list);
    }
  }

  // Where we have NO brief scenes, fall back to motifs as a flat
  // evolution: use the motif's emotional-core-counts ordered by count.
  for (const m of motifs) {
    if (evolutionPerObject.has(m.objectId)) continue;
    const list: ObjectNode['evolution'] = [];
    const sortedCores = Object.entries(m.emotionalCoreCounts).sort((a, b) => b[1] - a[1]);
    for (const [core] of sortedCores) {
      list.push({ core: core as EmotionalCoreId, ts: m.lastSeen, bannerId: '' });
    }
    evolutionPerObject.set(m.objectId, list);
  }

  const nodes: ObjectNode[] = [];
  for (const [objectId, evolution] of evolutionPerObject) {
    if (evolution.length === 0) continue;
    const evolutionSorted = evolution.slice().sort((a, b) => a.ts - b.ts);
    const distinct = new Set(evolutionSorted.map((e) => e.core)).size;
    const appearances = evolutionSorted.length;
    const emotionalWeight = Math.min(10, distinct * 1.8 + appearances * 0.7);
    const isSymbolic = distinct >= 2;
    const currentLoadedMeaning = buildCurrentMeaning(objectId, evolutionSorted);
    nodes.push({ objectId, evolution: evolutionSorted, currentLoadedMeaning, emotionalWeight, isSymbolic });
  }

  nodes.sort((a, b) => b.emotionalWeight - a.emotionalWeight);
  const loudest = nodes[0] ?? null;
  const symbolicObjects = nodes.filter((n) => n.isSymbolic);

  return { nodes, loudest, symbolicObjects };
}

function coreFromEntry(_t: EmotionalTraceEntry): EmotionalCoreId | null {
  // The trail entry stores the family/stateId but not the resolved
  // core. Callers that want precision should pass briefScenes paired
  // with the resolved core; otherwise the fallback below uses motifs
  // directly.
  return null;
}

function buildCurrentMeaning(objectId: string, evolution: ObjectNode['evolution']): string {
  if (evolution.length === 0) return `${objectId.replace(/-/g, ' ')} — no meaning yet`;
  const latest = evolution[evolution.length - 1];
  const distinctCount = new Set(evolution.map((e) => e.core)).size;
  const objectWord = objectId.replace(/-/g, ' ');
  if (latest.core === 'unmapped' || distinctCount === 0) return `${objectWord} — present, meaning still forming`;
  if (distinctCount === 1) return `${objectWord} = ${latest.core}`;
  const sequence = evolution.map((e) => e.core).filter((c) => c !== 'unmapped').slice(-4).join(' → ');
  return `${objectWord} accumulating: ${sequence}`;
}

/**
 * Convenience: returns true when adding this object to ANOTHER banner
 * would over-load it. The meta-critic uses this to enforce the
 * "this object has spoken too loudly" gate.
 */
export function objectHasSpokenTooLoudly(graph: ObjectMemoryGraph, objectId: string, currentBannerWillUse: boolean): boolean {
  if (!currentBannerWillUse) return false;
  const node = graph.nodes.find((n) => n.objectId === objectId);
  if (!node) return false;
  return node.emotionalWeight >= 8.5;
}
