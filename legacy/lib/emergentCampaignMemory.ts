/**
 * EMERGENT CAMPAIGN MEMORY (Phase 25)
 *
 * Detects PATTERNS the campaign has formed without anyone designing
 * them — emergent signatures across the trail: a recurring time of
 * day, a recurring object, a recurring emotional cadence.
 *
 * The engine reports these emergent signatures so the meta-critic
 * can decide whether they have become an identity (good) or a rut
 * (bad).
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface EmergentSignature {
  kind: 'family' | 'cultural-moment' | 'residue-phrase';
  value: string;
  count: number;
}

export interface EmergentCampaignMemoryReading {
  signatures: EmergentSignature[];
  /** True when an emergent signature has become an identity (3-5 hits). */
  has_emergent_identity: boolean;
  /** True when an emergent signature has become a rut (>=7 hits). */
  has_emergent_rut: boolean;
  notes: string[];
}

export interface EmergentCampaignMemoryInput {
  recentTrail: EmotionalTraceEntry[];
}

export function readEmergentCampaignMemory(input: EmergentCampaignMemoryInput): EmergentCampaignMemoryReading {
  const { recentTrail } = input;
  const notes: string[] = [];

  const familyCounts: Record<string, number> = {};
  const momentCounts: Record<string, number> = {};
  for (const t of recentTrail.slice(0, 25)) {
    familyCounts[t.family] = (familyCounts[t.family] ?? 0) + 1;
    if (t.culturalMoment) momentCounts[t.culturalMoment] = (momentCounts[t.culturalMoment] ?? 0) + 1;
  }

  const signatures: EmergentSignature[] = [];
  for (const [value, count] of Object.entries(familyCounts)) {
    if (count >= 3) signatures.push({ kind: 'family', value, count });
  }
  for (const [value, count] of Object.entries(momentCounts)) {
    if (count >= 3) signatures.push({ kind: 'cultural-moment', value, count });
  }
  signatures.sort((a, b) => b.count - a.count);

  const has_emergent_identity = signatures.some((s) => s.count >= 3 && s.count <= 6);
  const has_emergent_rut = signatures.some((s) => s.count >= 7);

  if (signatures.length) {
    notes.push(`emergent campaign signatures: ${signatures.slice(0, 3).map((s) => `${s.kind}:${s.value}×${s.count}`).join(', ')}`);
  }
  if (has_emergent_rut) notes.push('WARNING: an emergent signature has become a RUT — campaign is repeating itself');
  else if (has_emergent_identity) notes.push('an emergent signature has become a campaign identity');

  return { signatures, has_emergent_identity, has_emergent_rut, notes };
}
