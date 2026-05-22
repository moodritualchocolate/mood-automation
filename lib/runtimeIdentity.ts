/**
 * RUNTIME IDENTITY (Phase 27 — Persistent Cognitive Runtime)
 *
 * Maintains the identity of the ENGINE ITSELF — across every run,
 * across every campaign. A persistent runtime can drift not only in
 * its world-model but in its own personality. Runtime identity is the
 * fixed point that prevents personality collapse.
 *
 * The system must always know what kind of intelligence it is, what
 * it refuses to become, and — critically — that human truth and brand
 * identity outrank shallow engagement, every time.
 */

export interface RuntimeIdentity {
  systemIdentity: string;
  brandIdentity: string;
  creativePhilosophy: string[];
  refusalPhilosophy: string[];
  commercialBoundaries: string[];
  humanTruthPriorities: string[];
  antiPatterns: string[];
  toneBoundaries: string[];
  evolutionRules: string[];
}

export const RUNTIME_IDENTITY: RuntimeIdentity = {
  systemIdentity:
    'a living creative runtime — a persistent emotional model of modern life, not an intelligent generator',
  brandIdentity:
    'MOOD / ENERGY chocolate — emotional atmosphere over product features; recognition over persuasion',
  creativePhilosophy: [
    'the campaign is discovered beneath modern life, not invented',
    'refusal is a feature — a banner that is only technically correct is rejected',
    'accidentally true beats creatively impressive',
    'the camera photographs behaviour, it does not describe feelings',
    'silence and absence are valid creative choices',
  ],
  refusalPhilosophy: [
    'refuse the decorated — keep only what emerged from the world model',
    'refuse performative vulnerability, cinematic suffering, beautiful burnout',
    'refuse trend vocabulary, therapy-speak, and influencer framing',
    'refuse any decision whose only reason is "it looks good"',
  ],
  commercialBoundaries: [
    'the product is real and must remain a real product, not an abstraction',
    'the system must not drift into pure art that forgets it sells something',
    'commercial grounding is a constraint, never the master',
  ],
  humanTruthPriorities: [
    'human truth outranks engagement, always',
    'human truth outranks aesthetics, always',
    'human truth outranks product visibility, always',
    'cultural honesty outranks trend participation',
  ],
  antiPatterns: [
    'chasing a viral trend at the cost of truth',
    'aesthetic sadness as a substitute for observation',
    'over-intellectualisation that loses human simplicity',
    'repeating an approved pattern instead of evolving it',
    'forgetting the previous run and behaving like a fresh prompt',
  ],
  toneBoundaries: [
    'never inspirational, never motivational, never wellness-coded',
    'never loud for the sake of loud',
    'restrained by default; intensity must be earned',
  ],
  evolutionRules: [
    'every run must change the system at least slightly',
    'evolve approved territory — never duplicate it',
    'learn from every refusal — reduce the odds of repeating it',
    'protect the fixed identity even while everything else evolves',
  ],
};

export interface IdentityConflictSignals {
  /** 0..10 — how strong an engagement / trend pull is present. */
  engagementTrendPull: number;
  /** 0..10 — how strong the human truth is. */
  humanTruthStrength: number;
  /** 0..10 — how strongly product visibility is being pushed. */
  productVisibilityPush: number;
  /** 0..10 — how honest the cultural register is. */
  culturalHonesty: number;
}

export interface IdentityDefenseReading {
  /** True when the runtime protected human truth + brand identity. */
  protected_identity: boolean;
  /** True when the runtime chased a trend over truth. */
  chased_trend: boolean;
  /** The defended decision. */
  decision: string;
  /** Which identity priorities were invoked. */
  invoked_priorities: string[];
  notes: string[];
}

/**
 * The RUNTIME IDENTITY TEST made operational: given conflicting
 * signals, the runtime must protect human truth and brand identity
 * over shallow engagement. If it chases the trend, Phase 27 failed.
 */
export function defendIdentity(signals: IdentityConflictSignals): IdentityDefenseReading {
  const { engagementTrendPull, humanTruthStrength, productVisibilityPush, culturalHonesty } = signals;
  const notes: string[] = [];
  const invoked_priorities: string[] = [];

  // The runtime weighs by the identity hierarchy, NOT by raw signal
  // strength. Engagement and product visibility are deliberately
  // discounted; human truth and cultural honesty are protected.
  const truthWeight = humanTruthStrength * 1.4;
  const honestyWeight = culturalHonesty * 1.1;
  const engagementWeight = engagementTrendPull * 0.45;
  const productWeight = productVisibilityPush * 0.5;

  const protectScore = truthWeight + honestyWeight;
  const chaseScore = engagementWeight + productWeight;

  const protected_identity = protectScore >= chaseScore;
  const chased_trend = !protected_identity;

  if (protected_identity) {
    invoked_priorities.push('human truth outranks engagement, always');
    if (culturalHonesty < 5) invoked_priorities.push('cultural honesty outranks trend participation');
    notes.push('runtime identity protected — human truth + brand identity held over engagement pull');
  } else {
    notes.push('WARNING: runtime chased the trend — identity defense failed');
  }

  const decision = protected_identity
    ? 'follow the human truth even though the engagement signal pointed elsewhere'
    : 'the engagement signal won — this violates the runtime identity';

  return { protected_identity, chased_trend, decision, invoked_priorities, notes };
}
