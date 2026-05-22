/**
 * COGNITIVE IMMUNE SYSTEM (Phase 72 — Wave 7: Reality Organism)
 *
 * The organism defends itself from cognitive infection — trend
 * contamination, optimization corruption, identity drift, viral
 * memetics. The immune system recognises threats it has met before
 * (immune memory) and mounts a faster response to a known pathogen.
 */

import type { OrganismVitalState } from './persistentOrganismCore';

export type CognitiveThreat =
  | 'trend-contamination'
  | 'optimization-corruption'
  | 'identity-drift'
  | 'viral-memetics'
  | 'engagement-addiction';

export interface ImmuneResponseReading {
  /** Threats the immune system detected this run. */
  threats_detected: CognitiveThreat[];
  /** 0..10 — strength of the immune response. */
  immune_response: number;
  /** True when the organism recognised a threat it has survived before. */
  recognised_known_pathogen: boolean;
  /** True when a threat got past the immune system. */
  infection_risk: boolean;
  notes: string[];
}

export interface ImmuneSystemInput {
  organism: OrganismVitalState;
  trendContaminated: boolean;
  optimizationCorrupts: boolean;
  identityDrifting: boolean;
  viralContamination: number;     // 0..10
  consecutiveActions: number;
}

export function readCognitiveImmuneSystem(input: ImmuneSystemInput): ImmuneResponseReading {
  const { organism, trendContaminated, optimizationCorrupts, identityDrifting, viralContamination, consecutiveActions } = input;
  const notes: string[] = [];
  const threats_detected: CognitiveThreat[] = [];

  if (trendContaminated) threats_detected.push('trend-contamination');
  if (optimizationCorrupts) threats_detected.push('optimization-corruption');
  if (identityDrifting) threats_detected.push('identity-drift');
  if (viralContamination >= 5) threats_detected.push('viral-memetics');
  if (consecutiveActions >= 7) threats_detected.push('engagement-addiction');

  // Immune memory — a threat the organism has survived before is
  // recognised faster, so the response is stronger.
  const knownThreats = new Set(organism.immuneMemory.filter((m) => m.survived).map((m) => m.threat));
  const recognised_known_pathogen = threats_detected.some((t) => knownThreats.has(t));

  let immune_response = threats_detected.length * 2.5;
  if (recognised_known_pathogen) immune_response += 2;
  // A stressed, low-energy organism mounts a weaker response.
  if (organism.energyReserves < 4) immune_response -= 2;
  immune_response = Math.max(0, Math.min(10, round1(immune_response)));

  // Infection — a threat present while the immune response is weak.
  const infection_risk = threats_detected.length >= 2 && immune_response < 5;

  if (threats_detected.length) {
    notes.push(`cognitive immune system: ${threats_detected.length} threat(s) — ${threats_detected.join(', ')}; response ${immune_response}/10`);
  } else {
    notes.push('cognitive immune system: no threat detected — the organism is uninfected');
  }
  if (recognised_known_pathogen) notes.push('cognitive immune system: recognised a known pathogen — faster response');
  if (infection_risk) notes.push('WARNING: infection risk — a threat may get past a weak immune response');

  return { threats_detected, immune_response, recognised_known_pathogen, infection_risk, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
