/**
 * ACTIVE COGNITION GRAPH (Phase 96 — Wave 8: Operating System Genesis)
 *
 * The runtime holds a live graph of what it is currently thinking —
 * active thoughts, open conflicts, memory pressure, identity tensions,
 * and the dependencies between them. The graph is the OS's working
 * set: when it grows too entangled, cognition slows under its own
 * cross-references.
 */

import type { InterruptReading } from './interruptArchitecture';
import type { ProcessScheduleReading } from './processScheduler';

export interface CognitionGraphReading {
  active_nodes: string[];
  /** 0..10 — how loaded the working graph is. */
  graph_load: number;
  /** The node entangled in the most relationships, or null. */
  most_entangled: string | null;
  /** True when the graph is too entangled to reason cleanly. */
  graph_is_tangled: boolean;
  notes: string[];
}

export interface CognitionGraphInput {
  interrupts: InterruptReading;
  scheduler: ProcessScheduleReading;
  /** Count of unresolved internal contradictions this run. */
  contradictionCount: number;
  /** True when the identity is under tension this run. */
  identityTension: boolean;
}

export function readActiveCognitionGraph(input: CognitionGraphInput): CognitionGraphReading {
  const { interrupts, scheduler, contradictionCount, identityTension } = input;
  const notes: string[] = [];

  const active_nodes: string[] = [];
  // The foreground process and any deferred process are active nodes.
  active_nodes.push(`process:${scheduler.foreground_process}`);
  for (const p of scheduler.processes) {
    if (p.window === 'deferred') active_nodes.push(`process:${p.name}`);
  }
  for (const it of interrupts.interrupts) active_nodes.push(`interrupt:${it.kind}`);
  for (let i = 0; i < contradictionCount; i++) active_nodes.push(`conflict:${i + 1}`);
  if (identityTension) active_nodes.push('tension:identity');

  let graph_load = 0;
  graph_load += active_nodes.length * 0.7;
  graph_load += contradictionCount * 0.8;
  graph_load += interrupts.interrupts.length * 0.6;
  graph_load = clamp10(round1(graph_load));

  // The most entangled node — interrupts and identity tension pull the
  // most cross-references; otherwise the foreground process.
  const most_entangled =
    identityTension ? 'tension:identity' :
    interrupts.highest ? `interrupt:${interrupts.highest.kind}` :
    contradictionCount > 0 ? 'conflict:1' :
    active_nodes[0] ?? null;

  const graph_is_tangled = graph_load >= 7 || contradictionCount >= 4;

  notes.push(`active cognition graph: ${active_nodes.length} active node(s), load ${graph_load}/10` +
    (graph_is_tangled ? ' — the graph is tangled' : '') +
    (most_entangled ? ` · most entangled "${most_entangled}"` : ''));
  return { active_nodes, graph_load, most_entangled, graph_is_tangled, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
