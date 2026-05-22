/**
 * EMOTIONAL SIGNATURE (Phase 34 — Identity Persistence / Wave 2)
 *
 * The emotional fingerprint that makes a banner unmistakably MOOD —
 * even without the logo. Quiet recognition, unresolved tension,
 * non-performative observation, a small true moment. This module
 * measures how strongly that signature is present.
 */

import type { HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';

export interface EmotionalSignatureReading {
  /** 0..10 — how strongly the MOOD emotional signature is present. */
  signature_strength: number;
  /** True when the banner is unmistakably MOOD without the logo. */
  unmistakably_mood: boolean;
  /** True when the banner feels generic / replaceable. */
  feels_replaceable: boolean;
  notes: string[];
}

export interface EmotionalSignatureInput {
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
  /** 0..10 — recognition score (collective / critic). */
  recognition: number;
  /** 0..10 — how non-performative the banner reads. */
  nonPerformative: number;
  /** 0..10 — emergence from the cognitive field. */
  emergence: number;
}

export function readEmotionalSignature(input: EmotionalSignatureInput): EmotionalSignatureReading {
  const { truth, emotionalCore, recognition, nonPerformative, emergence } = input;
  const notes: string[] = [];

  // The signature: a real tension + recognition + non-performative
  // observation + structural emergence.
  const hasTension = truth.tension.trim().length > 8;
  let signature_strength = 0;
  signature_strength += recognition * 0.3;
  signature_strength += nonPerformative * 0.3;
  signature_strength += emergence * 0.25;
  if (hasTension) signature_strength += 1.5;
  if (emotionalCore) signature_strength += 1;
  signature_strength = round1(Math.min(10, signature_strength));

  const unmistakably_mood = signature_strength >= 6 && hasTension && nonPerformative >= 5;
  const feels_replaceable = signature_strength < 4.5;

  notes.push(`emotional signature: strength ${signature_strength}/10`);
  if (unmistakably_mood) notes.push('emotional signature: unmistakably MOOD — it would read as MOOD without the logo');
  if (feels_replaceable) notes.push('emotional signature: the banner feels generic / replaceable — no distinct MOOD fingerprint');

  return { signature_strength, unmistakably_mood, feels_replaceable, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
