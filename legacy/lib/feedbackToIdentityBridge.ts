/**
 * FEEDBACK TO IDENTITY BRIDGE (Phase 240 — Wave 13: Reality Feedback Infrastructure)
 *
 * Real feedback can require a real identity correction. This bridge
 * routes feedback signals up to the identity layer — but only when
 * the case is strong enough to justify changing what the brand is.
 */

export interface FeedbackToIdentityReading {
  /** True when feedback is being routed up to the identity layer. */
  identity_update_routed: boolean;
  identity_signal: string;
  /** True when the bridge resisted updating identity on weak signal. */
  resisted_premature_update: boolean;
  notes: string[];
}

export interface FeedbackToIdentityInput {
  /** True when feedback signal is usable. */
  signalUsable: boolean;
  /** True when an identity correction is genuinely recommended. */
  correctionRecommended: boolean;
  /** True when the correction would preserve founding identity. */
  correctionPreservesIdentity: boolean;
}

export function readFeedbackToIdentityBridge(input: FeedbackToIdentityInput): FeedbackToIdentityReading {
  const { signalUsable, correctionRecommended, correctionPreservesIdentity } = input;
  const notes: string[] = [];

  const identity_update_routed = signalUsable && correctionRecommended && correctionPreservesIdentity;
  const resisted_premature_update = correctionRecommended && (!signalUsable || !correctionPreservesIdentity);

  const identity_signal = identity_update_routed
    ? 'routing a small identity correction up — feedback is clean and the change preserves the founding self'
    : resisted_premature_update
      ? !signalUsable
        ? 'resisting premature update — signal is too noisy to change identity on'
        : 'resisting premature update — the proposed correction would abandon the founding identity'
      : 'no identity update this cycle — no correction warranted';

  notes.push(`feedback to identity bridge: ${identity_signal}`);
  return { identity_update_routed, identity_signal, resisted_premature_update, notes };
}
