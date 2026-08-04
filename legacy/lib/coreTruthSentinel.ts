/**
 * CORE TRUTH SENTINEL (Phase 356 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Stands watch over the truths the brand has committed to — refuses
 * to let them quietly slip.
 */

export interface CoreTruthSentinelReading {
  truths_held: boolean;
  /** Names of truths under threat. */
  truths_under_threat: string[];
  notes: string[];
}

export interface CoreTruthSentinelInput {
  unpopularTruthSuppressed: boolean;
  contradictedKnownFact: boolean;
}

export function readCoreTruthSentinel(input: CoreTruthSentinelInput): CoreTruthSentinelReading {
  const { unpopularTruthSuppressed, contradictedKnownFact } = input;
  const notes: string[] = [];

  const truths_under_threat: string[] = [];
  if (unpopularTruthSuppressed) truths_under_threat.push('an unpopular truth was suppressed');
  if (contradictedKnownFact) truths_under_threat.push('a known fact was contradicted');

  const truths_held = truths_under_threat.length === 0;

  notes.push(`core truth sentinel: ${truths_held ? 'TRUTHS HELD' : `${truths_under_threat.length} under threat`}`);
  return { truths_held, truths_under_threat, notes };
}
