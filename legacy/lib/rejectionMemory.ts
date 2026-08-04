/**
 * REJECTION MEMORY (Phase 27 — Persistent Cognitive Runtime)
 *
 * Rejections must become INTELLIGENCE. The runtime stores not only
 * what it refused but WHY — which truth, atmosphere, authenticity,
 * honesty, taste, product role, silence, or system causality the
 * refused direction violated.
 *
 * A rejected direction must reduce the probability of similar future
 * decisions. The system should learn from every refusal.
 */

export interface RejectionRecord {
  ts: number;
  generationIndex: number;
  rejectedConcept: string;            // the truth / state that was refused
  rejectionCategory: string;          // the verdict
  violatedTruth: boolean;
  violatedAtmosphere: boolean;
  violatedBehavioralAuthenticity: boolean;
  violatedCulturalHonesty: boolean;
  violatedVisualTaste: boolean;
  violatedProductRole: boolean;
  violatedSilence: boolean;
  violatedSystemCausality: boolean;
  reasons: string[];
  shouldInfluenceFuture: boolean;
}

export interface BuildRejectionRecordInput {
  generationIndex: number;
  rejectedConcept: string;
  verdict: string;
  reasons: string[];
}

/** Categorise a rejection's reasons into the violated-dimension flags. */
export function buildRejectionRecord(input: BuildRejectionRecordInput): RejectionRecord {
  const { generationIndex, rejectedConcept, verdict, reasons } = input;
  const blob = reasons.join(' ').toLowerCase();

  const violatedTruth = /\btruth|human truth|emotional truth|emergence|decorated\b/.test(blob);
  const violatedAtmosphere = /\batmosphere|aftertaste|uniformity\b/.test(blob);
  const violatedBehavioralAuthenticity = /\bbehaviou?r|loop|performative|synthetic|non-performative\b/.test(blob);
  const violatedCulturalHonesty = /\bcultural|private language|viral|collective|recognition\b/.test(blob);
  const violatedVisualTaste = /\btaste|visual gravity|negative space|composition|typography\b/.test(blob);
  const violatedProductRole = /\bproduct\b/.test(blob);
  const violatedSilence = /\bsilence|restraint|whisper|rhythm\b/.test(blob);
  const violatedSystemCausality = /\bsystemic|causal|cognitive field|pressure|world model\b/.test(blob);

  // A rejection influences the future when it points at a structural
  // failure (truth / authenticity / causality / honesty), not a
  // one-off image / layout problem.
  const shouldInfluenceFuture =
    violatedTruth || violatedBehavioralAuthenticity ||
    violatedCulturalHonesty || violatedSystemCausality;

  return {
    ts: Date.now(),
    generationIndex,
    rejectedConcept,
    rejectionCategory: verdict,
    violatedTruth,
    violatedAtmosphere,
    violatedBehavioralAuthenticity,
    violatedCulturalHonesty,
    violatedVisualTaste,
    violatedProductRole,
    violatedSilence,
    violatedSystemCausality,
    reasons,
    shouldInfluenceFuture,
  };
}

export interface RejectionAssessment {
  /** 0..10 — how close the candidate sits to past rejected territory. */
  similarity_to_rejected: number;
  /** True when the candidate repeats a rejected emotional territory. */
  repeats_rejected_territory: boolean;
  /** The closest matched rejection, if any. */
  matched: RejectionRecord | null;
  /** Rejection categories the system has learned to avoid. */
  learned_avoidances: string[];
  notes: string[];
}

export interface AssessRejectionInput {
  candidateConcept: string;            // current truth / state
  candidateTerritory: string;          // current state family
  rejectionMemory: RejectionRecord[];
}

/**
 * Assess the current candidate against rejection memory. A candidate
 * that repeats territory the system has refused before should be
 * pushed back toward the bar.
 */
export function assessAgainstRejectionMemory(input: AssessRejectionInput): RejectionAssessment {
  const { candidateConcept, candidateTerritory, rejectionMemory } = input;
  const notes: string[] = [];

  const influential = rejectionMemory.filter((r) => r.shouldInfluenceFuture);
  const conceptLower = candidateConcept.toLowerCase();

  let matched: RejectionRecord | null = null;
  let similarity_to_rejected = 0;

  for (const r of influential) {
    const rc = r.rejectedConcept.toLowerCase();
    // Territory match — the candidate sits where a refusal happened.
    const territoryHit = rc.includes(candidateTerritory) || r.reasons.join(' ').toLowerCase().includes(candidateTerritory);
    // Concept word overlap.
    const words = conceptLower.split(/\s+/).filter((w) => w.length >= 5);
    const overlap = words.filter((w) => rc.includes(w)).length;
    const score = (territoryHit ? 5 : 0) + Math.min(5, overlap * 1.5);
    if (score > similarity_to_rejected) {
      similarity_to_rejected = score;
      matched = r;
    }
  }

  const repeats_rejected_territory = similarity_to_rejected >= 5;
  const learned_avoidances = Array.from(new Set(influential.map((r) => r.rejectionCategory)));

  if (repeats_rejected_territory && matched) {
    notes.push(`candidate repeats territory the runtime refused at gen ${matched.generationIndex} (${matched.rejectionCategory})`);
  } else if (influential.length) {
    notes.push(`rejection memory holds ${influential.length} influential refusal(s) — candidate is clear of them`);
  } else {
    notes.push('rejection memory is empty — nothing to learn from yet');
  }

  return {
    similarity_to_rejected: Math.min(10, similarity_to_rejected),
    repeats_rejected_territory,
    matched,
    learned_avoidances,
    notes,
  };
}
