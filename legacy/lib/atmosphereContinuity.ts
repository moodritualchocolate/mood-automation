/**
 * ATMOSPHERE CONTINUITY (Phase 31 — Emotional Continuity Runtime / Wave 2)
 *
 * Campaigns must not emotionally RESET between banners. This module
 * tracks whether the campaign's atmosphere is continuous — and warns
 * when the atmosphere has become decorative rather than felt.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface AtmosphereContinuityReading {
  /** 0..10 — how continuous the campaign atmosphere is. */
  atmosphere_continuity: number;
  /** True when the atmosphere has become decorative. */
  atmosphere_decorative: boolean;
  /** True when the campaign emotionally reset (a hard discontinuity). */
  emotional_reset_detected: boolean;
  notes: string[];
}

export interface AtmosphereContinuityInput {
  trail: EmotionalTraceEntry[];
  /** The candidate banner's emotional family. */
  candidateFamily: string;
}

// Families that sit "near" each other emotionally — moving between
// them is continuity; jumping across the map is a reset.
const NEIGHBOURS: Record<string, string[]> = {
  fatigue: ['collapse', 'numbness', 'paralysis'],
  collapse: ['fatigue', 'numbness'],
  numbness: ['fatigue', 'collapse', 'avoidance'],
  paralysis: ['fatigue', 'avoidance', 'fragmentation'],
  pressure: ['overstimulation', 'fragmentation'],
  overstimulation: ['pressure', 'fragmentation'],
  fragmentation: ['overstimulation', 'pressure', 'paralysis'],
  avoidance: ['numbness', 'paralysis'],
};

export function readAtmosphereContinuity(input: AtmosphereContinuityInput): AtmosphereContinuityReading {
  const { trail, candidateFamily } = input;
  const notes: string[] = [];

  if (trail.length < 2) {
    return {
      atmosphere_continuity: 6, atmosphere_decorative: false, emotional_reset_detected: false,
      notes: ['atmosphere continuity: campaign too young to break continuity'],
    };
  }

  const priorFamily = trail[0].family;
  const continuous = priorFamily === candidateFamily
    || (NEIGHBOURS[priorFamily] ?? []).includes(candidateFamily);
  const emotional_reset_detected = !continuous;

  // Decorative: the recent banners cluster on one family but their
  // engagement is flat — the atmosphere is being worn as decoration.
  const window = trail.slice(0, 8);
  const sameFamily = window.filter((t) => t.family === priorFamily).length;
  const avgEngagement = window.reduce((s, t) => s + (t.engagement ?? 0), 0) / window.length;
  const atmosphere_decorative = sameFamily >= 5 && avgEngagement < 4;

  let atmosphere_continuity = continuous ? 8 : 3;
  if (atmosphere_decorative) atmosphere_continuity = Math.max(0, atmosphere_continuity - 3);

  if (emotional_reset_detected) notes.push(`atmosphere continuity: the campaign reset — "${priorFamily}" → "${candidateFamily}" is a hard discontinuity`);
  if (atmosphere_decorative) notes.push('atmosphere continuity: the atmosphere has become decorative — clustered family, flat resonance');
  if (continuous && !atmosphere_decorative) notes.push('atmosphere continuity: continuous — the campaign did not emotionally reset');

  return { atmosphere_continuity, atmosphere_decorative, emotional_reset_detected, notes };
}
