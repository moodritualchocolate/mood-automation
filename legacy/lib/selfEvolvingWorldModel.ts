/**
 * SELF-EVOLVING WORLD MODEL (Phase 26 — Unified Cognitive Field)
 *
 * Lets the system evolve its model of modern human life. It runs
 * AFTER generation / rejection / reality ingestion and reports the
 * model-evolution actions the system should take:
 *
 *   - strengthen persistent truths
 *   - weaken decayed truths
 *   - detect emerging pressures
 *   - retire dead clichés
 *   - identify new desire forces
 *   - update masking patterns
 *   - detect when the system is overfitting itself
 *
 * The module does not mutate stores directly — it reads the current
 * cognition and emits an evolution report. Persistence layers act on
 * the report. This keeps the world-model evolution observable.
 */

import type { WorldState } from './worldStateSimulation';
import type { CausalMemoryGraph } from './causalMemoryGraph';
import { reportCausalGraph } from './causalMemoryGraph';
import type { DesireMemoryEntry } from './humanDesireMemory';
import type { TruthPersistenceReport } from './truthPersistence';
import type { DecayReading } from './emotionalDecay';

export interface WorldModelEvolution {
  strengthen_truths: string[];
  weaken_truths: string[];
  emerging_pressures: string[];
  retire_cliches: string[];
  new_desire_forces: string[];
  /** True when the campaign keeps proving the same thing — the model
   *  is overfitting itself instead of observing reality. */
  overfitting_detected: boolean;
  /** 0..10 — how much the world-model needs to evolve right now. */
  evolution_pressure: number;
  notes: string[];
}

export interface SelfEvolvingWorldModelInput {
  worldState: WorldState;
  causalGraph: CausalMemoryGraph;
  desireEntries: DesireMemoryEntry[];
  truthPersistence: TruthPersistenceReport | null;
  decay: DecayReading | null;
}

const COLD_MS = 21 * 24 * 3600 * 1000;

export function evolveWorldModel(input: SelfEvolvingWorldModelInput): WorldModelEvolution {
  const { worldState, causalGraph, desireEntries, truthPersistence, decay } = input;
  const notes: string[] = [];
  const now = Date.now();

  // ─── strengthen persistent truths ──────────────────────────────
  const strengthen_truths: string[] = [];
  for (const p of truthPersistence?.persistent ?? []) {
    if (p.count >= 3) strengthen_truths.push(p.display);
  }
  if (truthPersistence?.candidate_touches_persistent && truthPersistence.durability_score >= 6) {
    strengthen_truths.push(truthPersistence.candidate_entry?.display ?? 'the candidate truth');
  }

  // ─── weaken decayed truths ─────────────────────────────────────
  const weaken_truths: string[] = [];
  if (decay && decay.status === 'decorative') {
    weaken_truths.push(`decorative truth (${decay.decorative_mode ?? 'unspecified'})`);
  }
  if (decay && decay.status === 'aging') weaken_truths.push('an aging truth heading toward decorative');

  // ─── emerging pressures ────────────────────────────────────────
  // A pressure is emerging when the causal graph has a young, fast-
  // growing 'cause' node.
  const emerging_pressures: string[] = [];
  for (const node of Object.values(causalGraph.nodes)) {
    if (node.kind === 'cause' && node.weight >= 2 && (now - node.firstSeen) < COLD_MS) {
      emerging_pressures.push(node.label);
    }
  }

  // ─── retire dead clichés ───────────────────────────────────────
  // A symbolic-object node that has gone cold is a cliché to retire.
  const retire_cliches: string[] = [];
  for (const node of Object.values(causalGraph.nodes)) {
    if (node.kind === 'symbolic-object' && node.weight >= 4 && (now - node.lastSeen) > COLD_MS) {
      retire_cliches.push(node.label);
    }
  }

  // ─── new desire forces ─────────────────────────────────────────
  const new_desire_forces: string[] = [];
  for (const e of desireEntries) {
    if (e.category === 'aspiration' && e.count <= 2 && (now - e.firstSeen) < COLD_MS && e.averageIntensity >= 6) {
      new_desire_forces.push(e.display);
    }
  }

  // ─── overfitting detection ─────────────────────────────────────
  // The model is overfitting when one causal pathway dominates AND the
  // world-state has stopped moving (low rejection ratio, high gen count).
  const graphReport = reportCausalGraph(causalGraph);
  const dominantPathway = graphReport.established_nodes[0];
  const overfitting_detected =
    !!dominantPathway && dominantPathway.weight >= 6 &&
    worldState.generationCount >= 8 &&
    worldState.rejectionCount / Math.max(1, worldState.generationCount) < 0.15;

  // ─── evolution pressure ────────────────────────────────────────
  let evolution_pressure = 0;
  evolution_pressure += weaken_truths.length * 2;
  evolution_pressure += retire_cliches.length * 1.5;
  evolution_pressure += emerging_pressures.length * 1;
  if (overfitting_detected) evolution_pressure += 4;
  evolution_pressure = Math.min(10, evolution_pressure);

  if (strengthen_truths.length) notes.push(`strengthen: ${strengthen_truths.slice(0, 3).join(', ')}`);
  if (weaken_truths.length) notes.push(`weaken: ${weaken_truths.join(', ')}`);
  if (emerging_pressures.length) notes.push(`emerging pressures: ${emerging_pressures.slice(0, 3).join(', ')}`);
  if (retire_cliches.length) notes.push(`retire clichés: ${retire_cliches.join(', ')}`);
  if (overfitting_detected) notes.push('WARNING: the world-model is overfitting itself — one pathway dominates and reality is not pushing back');
  if (notes.length === 0) notes.push('world-model is current — no evolution pressure');

  return {
    strengthen_truths, weaken_truths, emerging_pressures, retire_cliches,
    new_desire_forces, overfitting_detected, evolution_pressure, notes,
  };
}
