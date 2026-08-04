/**
 * VOICE INTEGRITY ENGINE (Phase 39 — Executive Identity Governance / Wave 4)
 *
 * Guards the MOOD voice at the governance level: grounded realism,
 * emotional restraint, quiet intelligence, an anti-performance tone.
 * The voice is the part of identity most easily eroded one banner at
 * a time.
 */

import type { HumanTruth } from '@/core/types';

export interface VoiceIntegrityReading {
  /** 0..10 — how intact the MOOD voice is. */
  voice_integrity: number;
  /** Named voice qualities that are intact. */
  intact_qualities: string[];
  /** Named voice qualities that have eroded. */
  eroded_qualities: string[];
  /** True when the voice still reads as quiet intelligence. */
  voice_is_intact: boolean;
  notes: string[];
}

export interface VoiceIntegrityInput {
  truth: HumanTruth;
  /** 0..10 — restraint of the direction. */
  restraint: number;
  /** 0..10 — non-performative score. */
  nonPerformative: number;
  /** 0..10 — emergence / structural truth. */
  emergence: number;
  copyText?: string;
}

const LITERARY_RX = /\b(a quiet ache|the weight of|tapestry|symphony|the gentle|whispers of|dance of|journey of)\b/i;
const SHOUTING_RX = /[A-Z]{4,}|!{2,}/;

export function readVoiceIntegrity(input: VoiceIntegrityInput): VoiceIntegrityReading {
  const { truth, restraint, nonPerformative, emergence, copyText } = input;
  const notes: string[] = [];
  const hay = `${truth.truth} ${copyText ?? ''}`;

  const intact_qualities: string[] = [];
  const eroded_qualities: string[] = [];

  // Grounded realism / quiet intelligence.
  if (emergence >= 5) intact_qualities.push('grounded realism');
  else eroded_qualities.push('grounded realism');
  // Emotional restraint.
  if (restraint >= 5) intact_qualities.push('emotional restraint');
  else eroded_qualities.push('emotional restraint');
  // Anti-performance tone.
  if (nonPerformative >= 5) intact_qualities.push('anti-performance tone');
  else eroded_qualities.push('anti-performance tone');
  // Quiet, exact language — not literary, not shouting.
  if (LITERARY_RX.test(hay)) eroded_qualities.push('quiet exact language (literary drift)');
  else if (SHOUTING_RX.test(hay)) eroded_qualities.push('quiet exact language (shouting)');
  else intact_qualities.push('quiet exact language');

  const voice_integrity = Math.max(0, Math.min(10, round1(10 - eroded_qualities.length * 2.5)));
  const voice_is_intact = eroded_qualities.length <= 1 && voice_integrity >= 6;

  if (eroded_qualities.length) notes.push(`voice integrity: eroded — ${eroded_qualities.join(', ')}`);
  else notes.push('voice integrity: intact — quiet, grounded, restrained, anti-performance');

  return { voice_integrity, intact_qualities, eroded_qualities, voice_is_intact, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
