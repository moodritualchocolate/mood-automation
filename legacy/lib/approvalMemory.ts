/**
 * APPROVAL MEMORY (Phase 27 — Persistent Cognitive Runtime)
 *
 * Approved outputs must also become INTELLIGENCE. The runtime stores
 * why a direction was approved and what it carried — so the next run
 * can CONTINUE the emotional territory without DUPLICATING the
 * creative pattern.
 *
 * Approved ideas should evolve, never repeat.
 */

export interface ApprovalRecord {
  ts: number;
  generationIndex: number;
  approvedConcept: string;
  whyApproved: string;
  dominantHumanTruth: string;
  activePressure: string;
  behavioralLoop: string;
  ritualSignal: string;
  identityTension: string;
  culturalRecognitionScore: number;
  atmosphereSignature: string;
  objectMotif: string;
  productRole: string;
  expectedAftertaste: number;
  futureTrajectory: string;
}

export interface ApprovalAssessment {
  /** True when the candidate continues an approved emotional territory. */
  continues_territory: boolean;
  /** True when the candidate duplicates an approved creative pattern
   *  rather than evolving it. */
  duplicates_pattern: boolean;
  /** The approval the candidate is closest to. */
  matched: ApprovalRecord | null;
  /** A short instruction on how to evolve, not repeat. */
  evolution_hint: string | null;
  notes: string[];
}

export interface AssessApprovalInput {
  candidateConcept: string;
  candidateTerritory: string;          // state family
  candidateObjectMotif: string;
  candidateProductRole: string;
  approvalMemory: ApprovalRecord[];
}

/**
 * Assess the current candidate against approval memory — distinguish
 * a healthy CONTINUATION of territory from an unhealthy DUPLICATION
 * of pattern.
 */
export function assessAgainstApprovalMemory(input: AssessApprovalInput): ApprovalAssessment {
  const { candidateConcept, candidateTerritory, candidateObjectMotif, candidateProductRole, approvalMemory } = input;
  const notes: string[] = [];

  if (approvalMemory.length === 0) {
    return {
      continues_territory: false,
      duplicates_pattern: false,
      matched: null,
      evolution_hint: null,
      notes: ['approval memory is empty — this is the first approved direction'],
    };
  }

  const conceptLower = candidateConcept.toLowerCase();
  let matched: ApprovalRecord | null = null;
  let bestTerritoryHit = false;
  let bestPatternScore = 0;

  for (const a of approvalMemory) {
    const territoryHit = a.atmosphereSignature.toLowerCase().includes(candidateTerritory)
      || a.dominantHumanTruth.toLowerCase().includes(candidateTerritory)
      || a.futureTrajectory.toLowerCase().includes(candidateTerritory);
    // Pattern duplication score: same object motif + same product role
    // + heavy concept word overlap = duplication.
    const sameObject = a.objectMotif === candidateObjectMotif && candidateObjectMotif !== '';
    const sameProduct = a.productRole === candidateProductRole;
    const words = conceptLower.split(/\s+/).filter((w) => w.length >= 5);
    const overlap = words.filter((w) => a.approvedConcept.toLowerCase().includes(w)).length;
    const patternScore = (sameObject ? 4 : 0) + (sameProduct ? 2 : 0) + Math.min(4, overlap * 1.3);
    if (patternScore > bestPatternScore) {
      bestPatternScore = patternScore;
      matched = a;
    }
    if (territoryHit) bestTerritoryHit = true;
  }

  const continues_territory = bestTerritoryHit;
  const duplicates_pattern = bestPatternScore >= 7;

  let evolution_hint: string | null = null;
  if (duplicates_pattern && matched) {
    evolution_hint =
      `gen ${matched.generationIndex} already approved this pattern (object "${matched.objectMotif}", ` +
      `product "${matched.productRole}") — continue the territory but change the object motif or the framing`;
    notes.push('candidate DUPLICATES an approved pattern — must evolve, not repeat');
  } else if (continues_territory) {
    notes.push('candidate continues an approved emotional territory — healthy continuation');
  } else {
    notes.push('candidate opens new territory — not a continuation of approved memory');
  }

  return { continues_territory, duplicates_pattern, matched, evolution_hint, notes };
}
