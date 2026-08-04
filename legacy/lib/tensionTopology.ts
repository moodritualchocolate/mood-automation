/**
 * TENSION TOPOLOGY (Phase 26 — Unified Cognitive Field)
 *
 * Maps the UNRESOLVED TENSIONS across the cognitive field and finds
 * where the deepest campaign opportunities live.
 *
 * A tension is a true contradiction the modern human is living inside
 * and cannot resolve. The deepest creative opportunities are not in
 * the feelings — they are in the tensions, because a tension cannot
 * be sold a solution, only recognised.
 */

import type { CognitiveFieldState } from './cognitiveField';
import type { HumanTruth } from '@/core/types';

export interface TensionRecord {
  id: string;
  the_tension: string;             // "X / Y" — the two poles
  why_unresolvable: string;
  /** Field markers that indicate this tension is live. */
  activators: string[];
  /** 0..10 — base depth of this tension as a campaign opportunity. */
  base_depth: number;
}

export const TENSION_LIBRARY: TensionRecord[] = [
  {
    id: 'rest-vs-stillness',
    the_tension: 'wanting rest / fearing stillness',
    why_unresolvable: 'the body needs to stop but stopping is where the unprocessed waits',
    activators: ['permission-to-stop', 'too-tired-to-rest', 'recovery-failure', 'an-end-to-the-list'],
    base_depth: 9,
  },
  {
    id: 'energy-vs-optimization',
    the_tension: 'needing energy / rejecting optimization culture',
    why_unresolvable: 'the body wants more capacity but is exhausted by the language of self-improvement',
    activators: ['endless-self-improvement-loop', 'optimization-culture', 'a-body-that-feels-like-itself'],
    base_depth: 8,
  },
  {
    id: 'connection-vs-messages',
    the_tension: 'wanting connection / avoiding messages',
    why_unresolvable: 'the body is lonely but each message is also a task',
    activators: ['ambient-loneliness', 'refresh-inbox', 'reply-rehearsal', 'being-known-without-explaining'],
    base_depth: 8,
  },
  {
    id: 'productivity-vs-resentment',
    the_tension: 'seeking productivity / resenting productivity identity',
    why_unresolvable: 'the self-worth runs on output and the self is tired of being output',
    activators: ['productivity-identity', 'over-functioning', 'a-version-of-now-that-is-enough'],
    base_depth: 8,
  },
  {
    id: 'silence-vs-filling-it',
    the_tension: 'wanting silence / filling every silence with the phone',
    why_unresolvable: 'the body craves the gap but cannot tolerate the gap when it arrives',
    activators: ['doomscroll', 'lock-screen-pull', 'reliable-quiet', 'stimulation-switching'],
    base_depth: 9,
  },
  {
    id: 'health-vs-wellness-fatigue',
    the_tension: 'wanting health / being tired of wellness language',
    why_unresolvable: 'the body wants to feel well but every route there is sold back to it',
    activators: ['wellness-cohort-pressure', 'meditation-app-checklist', 'endless-self-improvement-loop'],
    base_depth: 7,
  },
  {
    id: 'control-vs-interruption',
    the_tension: 'wanting control / living inside constant interruption',
    why_unresolvable: 'the body wants to decide its own attention but the environment decides it',
    activators: ['algorithmic-interruption', 'notification-fragmentation', 'interrupted-focus', 'tab-switching'],
    base_depth: 8,
  },
];

export interface TensionTopologyReading {
  live_tensions: Array<{ tension: TensionRecord; depth: number }>;
  /** The single deepest unresolved tension — the campaign opportunity. */
  deepest_opportunity: TensionRecord | null;
  /** 0..10 — depth of the deepest opportunity. */
  opportunity_depth: number;
  /** True when the candidate truth actually inhabits the deepest tension. */
  truth_inhabits_opportunity: boolean;
  notes: string[];
}

export interface TensionTopologyInput {
  field: CognitiveFieldState;
  truth: HumanTruth;
}

export function mapTensionTopology(input: TensionTopologyInput): TensionTopologyReading {
  const { field, truth } = input;
  const notes: string[] = [];

  const markers = new Set<string>([
    ...field.activePressures, ...field.behavioralLoops, ...field.desireForces,
    ...field.ritualAttachments, ...field.culturalSignals, ...field.emotionalResidue,
    ...field.dominantTruths,
  ]);

  const live_tensions = TENSION_LIBRARY.map((t) => {
    const hits = t.activators.filter((a) => markers.has(a)).length;
    // depth = base, lifted by how many activators are live and by the
    // field's coherence (a coherent field makes a tension landable).
    const depth = hits === 0 ? 0 : Math.min(10, t.base_depth * 0.6 + hits * 1.5 + field.field_coherence * 0.1);
    return { tension: t, depth: round1(depth) };
  }).filter((t) => t.depth > 0).sort((a, b) => b.depth - a.depth);

  const deepest = live_tensions[0] ?? null;
  const deepest_opportunity = deepest?.tension ?? null;
  const opportunity_depth = deepest?.depth ?? 0;

  // Does the candidate truth's tension phrase actually inhabit the
  // deepest opportunity? We check both poles loosely.
  let truth_inhabits_opportunity = false;
  if (deepest_opportunity) {
    const tensionText = `${truth.tension} ${truth.truth}`.toLowerCase();
    const poles = deepest_opportunity.the_tension.split('/').map((p) => p.trim().toLowerCase());
    const poleWords = poles.flatMap((p) => p.split(/\s+/).filter((w) => w.length >= 4));
    const hitWords = poleWords.filter((w) => tensionText.includes(w)).length;
    truth_inhabits_opportunity = hitWords >= 2;
  }

  if (deepest_opportunity) {
    notes.push(`deepest tension opportunity: "${deepest_opportunity.the_tension}" (depth ${opportunity_depth}/10)`);
    notes.push(truth_inhabits_opportunity
      ? 'the candidate truth inhabits the deepest tension'
      : 'the candidate truth does NOT inhabit the deepest available tension');
  } else {
    notes.push('no live tension — the field has feelings but no contradiction to land');
  }

  return { live_tensions, deepest_opportunity, opportunity_depth, truth_inhabits_opportunity, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
