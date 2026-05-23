/**
 * CHANNEL EXECUTION ROUTING (Phase 211 — Wave 12: Autonomous Action Architecture)
 *
 * An action that is right for one channel is wrong for another. This
 * module routes an authorized action to the channel where it will
 * land as intended — or holds it when no channel fits.
 */

export type ExecutionChannel = 'feed' | 'quiet-channel' | 'none';

export interface ChannelRoutingReading {
  routed_channel: ExecutionChannel;
  /** True when a fitting channel was found for the action. */
  routing_found_a_fit: boolean;
  routing_note: string;
  notes: string[];
}

export interface ChannelRoutingInput {
  /** 0..10 — feed saturation. */
  saturation: number;
  /** 0..10 — attention chaos. */
  attentionChaos: number;
  /** True when the action is quiet and contemplative in tone. */
  actionIsQuiet: boolean;
}

export function readChannelExecutionRouting(input: ChannelRoutingInput): ChannelRoutingReading {
  const { saturation, attentionChaos, actionIsQuiet } = input;
  const notes: string[] = [];

  const feedHostile = saturation >= 8 || attentionChaos >= 8;

  const routed_channel: ExecutionChannel =
    feedHostile && actionIsQuiet ? 'quiet-channel' :
    feedHostile ? 'none' :
    'feed';

  const routing_found_a_fit = routed_channel !== 'none';

  const routing_note =
    routed_channel === 'feed' ? 'routed to the feed — conditions allow the action to land there'
    : routed_channel === 'quiet-channel' ? 'routed to a quieter channel — the feed is too hostile for this action'
    : 'no fitting channel — a loud action into a hostile feed; hold it';

  notes.push(`channel execution routing: ${routed_channel} — ${routing_note}`);
  return { routed_channel, routing_found_a_fit, routing_note, notes };
}
