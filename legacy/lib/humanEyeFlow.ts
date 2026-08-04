/**
 * HUMAN EYE FLOW (Phase 30 — Visual Cognition / Wave 2)
 *
 * Traces the path a human eye takes through the frame. A frame with a
 * coherent eye flow leads; a frame whose flow collapses scatters the
 * viewer and loses the moment.
 */

import type { CompositionPlan } from '@/core/types';

export interface HumanEyeFlowReading {
  /** 0..10 — how coherent the eye flow is. */
  flow_coherence: number;
  /** Number of stops in the eye path. */
  flow_stops: number;
  /** True when the eye flow collapses (scatters with no path). */
  flow_collapses: boolean;
  /** The total path length, normalised — a long jagged path is tiring. */
  path_length: number;
  notes: string[];
}

export interface HumanEyeFlowInput {
  composition: CompositionPlan;
}

export function readHumanEyeFlow(input: HumanEyeFlowInput): HumanEyeFlowReading {
  const { composition } = input;
  const notes: string[] = [];
  const flow = composition.eyeFlow;

  if (flow.length < 2) {
    return {
      flow_coherence: 4, flow_stops: flow.length, flow_collapses: flow.length === 0,
      path_length: 0,
      notes: ['human eye flow: the frame defines no eye path — the eye has nowhere to travel'],
    };
  }

  let path_length = 0;
  for (let i = 1; i < flow.length; i++) {
    path_length += Math.hypot(flow[i][0] - flow[i - 1][0], flow[i][1] - flow[i - 1][1]);
  }
  path_length = round1(path_length);

  // Coherence: 2-4 stops with a moderate path is ideal. Too many stops
  // or a jagged long path collapses the flow.
  const flow_stops = flow.length;
  let flow_coherence = 7;
  if (flow_stops > 5) flow_coherence -= (flow_stops - 5) * 1.5;
  if (path_length > 2.4) flow_coherence -= 2;
  if (flow_stops < 2) flow_coherence -= 3;
  flow_coherence = clamp10(round1(flow_coherence));

  const flow_collapses = flow_coherence < 4 || flow_stops > 6;

  notes.push(`human eye flow: ${flow_stops} stops, coherence ${flow_coherence}/10, path ${path_length}`);
  if (flow_collapses) notes.push('human eye flow: the flow collapses — the eye scatters with no leading path');

  return { flow_coherence, flow_stops, flow_collapses, path_length, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
