/**
 * PUBLIC / PRIVATE SPLIT (Phase 19)
 *
 * Tracks the divergence between the SOCIAL VERSION of the subject
 * and the PRIVATE version that exists once the room has cleared.
 *
 * Examples named in the spec:
 *   energetic meeting          → silent car collapse
 *   parenting performance      → nighttime shutdown
 *   social responsiveness      → emotional absence later
 *   "doing amazing"            → cognitive residue accumulation
 *
 * Phase 9's emotionalSequence asked "does this banner advance the
 * arc?" Phase 19 asks a different question: "does the campaign show
 * BOTH SIDES of the same person across environments?" The complete
 * cinematic story is the SPLIT — not the public side alone, not the
 * private side alone, but the two together as a single subject.
 *
 * The engine reads the campaign trail and the candidate banner and
 * scores:
 *   split_coverage           — has the campaign shown BOTH sides?
 *   identity_drift_across_env — how big is the gap between the public
 *                              and private versions in the trail?
 *   candidate_side            — which side is THIS banner on?
 *   needed_complement         — what would the next banner need to
 *                              complete the diptych?
 *
 * This phase makes the campaign behave like a DIPTYCH GENERATOR.
 */

import type { HumanState, HumanTruth } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { EmotionalTraceEntry } from './humanMemory';

export type EnvironmentSide = 'public' | 'private' | 'transitional' | 'ambiguous';

export interface SidePair {
  public_label: string;
  private_label: string;
  public_signal_phrases: RegExp;
  private_signal_phrases: RegExp;
}

export const SIDE_PAIRS: SidePair[] = [
  {
    public_label: 'energetic meeting',
    private_label: 'silent car collapse',
    public_signal_phrases: /\b(meeting|standup|all[- ]?hands|presented|deck|delivered|pitch|on cue|on tone)\b/i,
    private_signal_phrases: /\b(car|driveway|engine off|parked|sitting in the car|in the elevator)\b/i,
  },
  {
    public_label: 'parenting performance',
    private_label: 'nighttime shutdown',
    public_signal_phrases: /\b(sweetheart|honey|patient|bedtime|book|bath|wake[- ]?ups?|school pickup|read again)\b/i,
    private_signal_phrases: /\b(after the kids|kids are down|once the door closed|alone in the kitchen|23:\d{2}|midnight)\b/i,
  },
  {
    public_label: 'social responsiveness',
    private_label: 'emotional absence later',
    public_signal_phrases: /\b(reply|replied|got it|inbox|standup|on slack|under (60|90) seconds)\b/i,
    private_signal_phrases: /\b(empty|absent|flat|hollow|gone|nothing left|stared at nothing)\b/i,
  },
  {
    public_label: 'doing amazing',
    private_label: 'residue accumulation',
    public_signal_phrases: /\b(thriving|crushing|great|doing well|good|i'?m good|all good|on it)\b/i,
    private_signal_phrases: /\b(carrying|carried|still|every|all week|all month|by (now|wednesday|friday)|jaw|shoulders|by the end)\b/i,
  },
  {
    public_label: 'host energy',
    private_label: 'collapse-after-door-closes',
    public_signal_phrases: /\b(host(ed|ing)?|guests|warm welcome|come in|the candle|the music)\b/i,
    private_signal_phrases: /\b(door closed|once they left|collapsed on the couch|alone again|finally)\b/i,
  },
  {
    public_label: 'group-chat warmth',
    private_label: 'silence in the kitchen',
    public_signal_phrases: /\b(group chat|whatsapp|telegram|family chat|slack channel|joked|emoji)\b/i,
    private_signal_phrases: /\b(kitchen|counter|fridge|water glass|by the sink|nobody is up)\b/i,
  },
];

const ENVIRONMENT_PATTERNS = {
  public: /\b(office|meeting|standup|all[- ]?hands|deck|inbox|conference|gym|dinner with|at the dinner|at the table|school pickup|with the kids|with the team|customer|client)\b/i,
  private: /\b(car|elevator|bathroom|shower|alone|kitchen at|fridge|bed|nightstand|by the sink|on the floor|in the dark|parked|driveway|once the door|after the kids)\b/i,
  transitional: /\b(commute|drive home|the way home|on the way|in the lobby|the bus|the train|the parking lot|the doorway|the threshold)\b/i,
};

export interface PublicPrivateSplitReading {
  /** Which side this candidate banner sits on. */
  candidate_side: EnvironmentSide;
  /** Detected public/private pair the candidate connects to. */
  detected_pair: SidePair | null;
  /** 0..10 — how much of the diptych the campaign has covered. */
  split_coverage: number;
  /** 0..10 — how big the gap is between public and private versions
   *  in the campaign trail. */
  identity_drift_across_env: number;
  /** What the next banner should be to complete the split. */
  needed_complement: string | null;
  /** True when the campaign has only shown ONE side repeatedly. */
  one_sided_campaign: boolean;
  /** True when the candidate is the public side of a pair the trail
   *  already showed the private side of (or vice versa). */
  banner_completes_a_pair: boolean;
  notes: string[];
}

export interface PublicPrivateSplitInput {
  state: HumanState;
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
  /** Recent campaign trail — used to assess split coverage. */
  recentTrail: EmotionalTraceEntry[];
}

export function readPublicPrivateSplit(input: PublicPrivateSplitInput): PublicPrivateSplitReading {
  const { truth, recentTrail } = input;
  const notes: string[] = [];
  const text = truth.truth;

  // ─── Determine candidate side ──────────────────────────────────
  const matchesPublic = ENVIRONMENT_PATTERNS.public.test(text);
  const matchesPrivate = ENVIRONMENT_PATTERNS.private.test(text);
  const matchesTransitional = ENVIRONMENT_PATTERNS.transitional.test(text);

  let candidate_side: EnvironmentSide = 'ambiguous';
  if (matchesTransitional) candidate_side = 'transitional';
  else if (matchesPublic && !matchesPrivate) candidate_side = 'public';
  else if (matchesPrivate && !matchesPublic) candidate_side = 'private';

  // ─── Match against named pairs ─────────────────────────────────
  let detected_pair: SidePair | null = null;
  for (const pair of SIDE_PAIRS) {
    if (pair.public_signal_phrases.test(text) || pair.private_signal_phrases.test(text)) {
      detected_pair = pair;
      break;
    }
  }

  // ─── Scan the trail to score coverage + drift ──────────────────
  let publicCount = 0;
  let privateCount = 0;
  const pairsSeen = new Set<string>();
  for (const t of recentTrail.slice(0, 20)) {
    const hay = `${t.truth} ${t.tension} ${t.residue}`;
    const p = ENVIRONMENT_PATTERNS.public.test(hay);
    const pr = ENVIRONMENT_PATTERNS.private.test(hay);
    if (p && !pr) publicCount += 1;
    if (pr && !p) privateCount += 1;
    for (const pair of SIDE_PAIRS) {
      if (pair.public_signal_phrases.test(hay) || pair.private_signal_phrases.test(hay)) {
        pairsSeen.add(pair.public_label);
      }
    }
  }
  const trailSize = Math.max(1, recentTrail.length);
  const balance = 1 - Math.abs(publicCount - privateCount) / trailSize;
  const split_coverage = trailSize >= 3
    ? Math.round(clamp10((balance * 5) + Math.min(pairsSeen.size, 5)))
    : 3;

  const identity_drift_across_env = clamp10(Math.abs(publicCount - privateCount) * 1.5);

  const one_sided_campaign = trailSize >= 4 && (publicCount === 0 || privateCount === 0);

  // ─── Banner completes a pair? ──────────────────────────────────
  let banner_completes_a_pair = false;
  let needed_complement: string | null = null;

  if (detected_pair) {
    const trailMatchesOtherSide = recentTrail.slice(0, 10).some((t) => {
      const hay = `${t.truth} ${t.tension} ${t.residue}`;
      if (candidate_side === 'public')   return detected_pair!.private_signal_phrases.test(hay);
      if (candidate_side === 'private')  return detected_pair!.public_signal_phrases.test(hay);
      return false;
    });
    banner_completes_a_pair = trailMatchesOtherSide;
    if (!banner_completes_a_pair) {
      if (candidate_side === 'public') {
        needed_complement = `next banner should show "${detected_pair.private_label}" to complete the diptych`;
      } else if (candidate_side === 'private') {
        needed_complement = `next banner should show "${detected_pair.public_label}" to complete the diptych`;
      }
    }
  } else if (one_sided_campaign) {
    needed_complement = publicCount > privateCount
      ? 'campaign has only shown public sides — next banner should photograph the private side'
      : 'campaign has only shown private sides — next banner should photograph the public side';
  }

  // ─── Notes ─────────────────────────────────────────────────────
  notes.push(`candidate side: ${candidate_side}`);
  if (detected_pair) notes.push(`detected pair: "${detected_pair.public_label}" ↔ "${detected_pair.private_label}"`);
  if (banner_completes_a_pair) notes.push('banner COMPLETES a diptych the campaign has been quietly building');
  if (one_sided_campaign) notes.push('WARNING: campaign has been one-sided — only one half of the human shown');
  if (needed_complement) notes.push(`needed complement: ${needed_complement}`);

  return {
    candidate_side,
    detected_pair,
    split_coverage,
    identity_drift_across_env,
    needed_complement,
    one_sided_campaign,
    banner_completes_a_pair,
    notes,
  };
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
