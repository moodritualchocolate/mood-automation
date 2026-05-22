/**
 * EMOTIONAL PHYSICS (Phase 26 — Unified Cognitive Field)
 *
 * Models CAUSAL CHAINS between emotional systems. The system must
 * understand emotional CAUSALITY, not just emotional categories.
 *
 * A category says "this is fatigue". Physics says "attention
 * fragmentation → shallow recovery → cognitive residue → fake rest
 * → masking fatigue → identity instability". The chain is the truth;
 * the category is only a frame of it.
 *
 * The engine holds a library of known causal chains and detects
 * which chains the current cognitive field is sitting inside.
 */

import type { CognitiveFieldState } from './cognitiveField';

export interface CausalChainRecord {
  id: string;
  chain: string[];               // ordered links
  /** Field markers that indicate this chain is active. */
  activators: string[];
  /** A plain-language statement of what the chain produces. */
  produces: string;
}

export const CAUSAL_CHAINS: CausalChainRecord[] = [
  {
    id: 'fragmentation-to-identity-instability',
    chain: ['attention fragmentation', 'shallow recovery', 'cognitive residue', 'fake rest', 'masking fatigue', 'identity instability'],
    activators: ['attention-fragmentation', 'interrupted-focus', 'unfinished-tabs', 'tab-switching', 'carries-weeks-of-residue'],
    produces: 'an identity that is quietly destabilising because the body never fully arrives anywhere',
  },
  {
    id: 'social-performance-to-symbolic-product',
    chain: ['social performance pressure', 'emotional suppression', 'private decompression ritual', 'ritual attachment', 'symbolic product meaning'],
    activators: ['social-performance-pressure', 'public-emotional-suppression', 'private-decompression', 'morning-cup', 'five-minutes-in-the-car'],
    produces: 'a small object or window that has quietly become emotionally load-bearing',
  },
  {
    id: 'productivity-identity-to-quiet-permission',
    chain: ['productivity identity', 'guilt during rest', 'over-functioning', 'functional collapse', 'desire for quiet permission'],
    activators: ['productivity-identity', 'optimization-culture', 'over-functioning', 'permission-to-stop', 'an-end-to-the-list'],
    produces: 'a body that cannot stop and is reaching, beneath everything, for permission to',
  },
  {
    id: 'availability-to-loneliness',
    chain: ['infinite accessibility', 'constant responsiveness', 'attention as currency', 'ambient loneliness'],
    activators: ['infinite-accessibility', 'notification-fragmentation', 'lock-screen-pull', 'refresh-inbox'],
    produces: 'a loneliness that does not match the calendar density — connected and unreached',
  },
  {
    id: 'overstimulation-to-numb-baseline',
    chain: ['collective overstimulation', 'stimulation switching', 'no gap for feeling', 'emotional numbness baseline'],
    activators: ['collective-overstimulation', 'doomscroll', 'toward-numbness', 'baseline-numbing'],
    produces: 'an emotional baseline slowly flattening because no gap is ever long enough for a feeling',
  },
  {
    id: 'caretaking-to-unwitnessed-self',
    chain: ['identity as caretaker', 'attention given outward', 'own state unasked', 'desire to be known without explaining'],
    activators: ['parent', 'caretaker', 'a-hand-that-asks-nothing-back', 'being-known-without-explaining'],
    produces: 'a person whose attention only goes one direction and who has stopped expecting it back',
  },
];

export interface EmotionalPhysicsReading {
  active_chains: CausalChainRecord[];
  /** The single most-activated causal chain. */
  primary_chain: CausalChainRecord | null;
  /** 0..10 — how strongly the field obeys a causal chain (vs being a
   *  loose set of categories). */
  causal_clarity: number;
  notes: string[];
}

export interface EmotionalPhysicsInput {
  field: CognitiveFieldState;
}

export function readEmotionalPhysics(input: EmotionalPhysicsInput): EmotionalPhysicsReading {
  const { field } = input;
  const notes: string[] = [];

  // Build the set of all field markers we can match activators against.
  const markers = new Set<string>([
    ...field.activePressures,
    ...field.behavioralLoops,
    ...field.desireForces,
    ...field.ritualAttachments,
    ...field.identityNarratives,
    ...field.culturalSignals,
    ...field.emotionalResidue,
    ...field.futureTrajectories,
  ]);

  const scored = CAUSAL_CHAINS.map((c) => {
    const hits = c.activators.filter((a) => markers.has(a)).length;
    return { chain: c, hits };
  }).filter((s) => s.hits > 0).sort((a, b) => b.hits - a.hits);

  const active_chains = scored.map((s) => s.chain);
  const primary_chain = scored[0]?.chain ?? null;

  let causal_clarity = 0;
  if (scored[0]) causal_clarity = Math.min(10, scored[0].hits * 3 + (scored.length > 1 ? 1 : 0));

  if (primary_chain) {
    notes.push(`primary causal chain: ${primary_chain.chain.join(' → ')}`);
    notes.push(`physics produces: ${primary_chain.produces}`);
  } else {
    notes.push('no causal chain active — the field is a set of categories, not a causality');
  }

  return { active_chains, primary_chain, causal_clarity, notes };
}
