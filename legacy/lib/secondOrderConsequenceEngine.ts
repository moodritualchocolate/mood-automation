/**
 * SECOND-ORDER CONSEQUENCE ENGINE (Phase 159 — Wave 11: Strategic Future Intelligence)
 *
 * Every move has a consequence; every consequence has a consequence.
 * This engine traces past the obvious first-order result into the
 * second order — the hidden cost a present win quietly creates.
 */

export interface ConsequenceLink {
  order: number;
  effect: string;
  tone: 'good' | 'warn' | 'bad';
}

export interface SecondOrderConsequenceReading {
  consequences: ConsequenceLink[];
  /** A hidden cost the first-order win conceals. */
  hidden_cost: string | null;
  /** True when the second-order consequence is negative. */
  second_order_is_negative: boolean;
  notes: string[];
}

export interface SecondOrderConsequenceInput {
  optimizationCorrupts: boolean;
  /** True when the run chased engagement / stimulus. */
  chasedStimulus: boolean;
  /** 0..10 — audience saturation the run would add to. */
  saturation: number;
}

export function readSecondOrderConsequence(input: SecondOrderConsequenceInput): SecondOrderConsequenceReading {
  const { optimizationCorrupts, chasedStimulus, saturation } = input;
  const notes: string[] = [];
  const consequences: ConsequenceLink[] = [];

  consequences.push({ order: 1, effect: 'the banner ships and earns its immediate response', tone: 'good' });

  let hidden_cost: string | null = null;
  if (chasedStimulus) {
    consequences.push({ order: 2, effect: 'the audience learns to expect stimulus — true banners land softer next time', tone: 'bad' });
    hidden_cost = 'each stimulus banner raises the dose the next one must clear';
  } else if (optimizationCorrupts) {
    consequences.push({ order: 2, effect: 'optimization sets a precedent — the next decision is a little easier to corrupt', tone: 'bad' });
    hidden_cost = 'a corrupted decision today lowers the bar for tomorrow';
  } else if (saturation >= 7) {
    consequences.push({ order: 2, effect: 'one more banner into a saturated feed deepens the audience\'s numbness', tone: 'warn' });
    hidden_cost = 'shipping into saturation trades a small gain for a duller audience';
  } else {
    consequences.push({ order: 2, effect: 'a true banner compounds — it makes the next true banner easier to trust', tone: 'good' });
  }

  const second_order_is_negative = consequences.some((c) => c.order === 2 && c.tone === 'bad');

  notes.push(`second-order consequence engine: ${second_order_is_negative ? 'a NEGATIVE second-order cost is hidden behind the first-order win' : 'second-order effects are benign or compounding'}`);
  return { consequences, hidden_cost, second_order_is_negative, notes };
}
