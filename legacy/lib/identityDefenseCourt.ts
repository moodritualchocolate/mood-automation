/**
 * IDENTITY DEFENSE COURT (Phase 51 — Wave 5)
 *
 * When a banner is accused of eroding the brand, the council holds a
 * COURT. The Identity Guardian prosecutes; the Strategist and the
 * Executive Synthesizer may argue mitigation; the court rules. The
 * brand identity is non-negotiable — but the court makes the defense
 * explicit rather than reflexive.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';

export interface IdentityDefenseCourtReading {
  /** True when an identity charge was brought. */
  charge_brought: boolean;
  /** The charge, if any. */
  charge: string | null;
  /** The court's verdict. */
  verdict: 'acquitted' | 'convicted' | 'no-charge';
  /** The defense argument considered. */
  defense: string | null;
  /** True when the identity must be defended (banner blocked). */
  identity_must_be_defended: boolean;
  notes: string[];
}

export interface IdentityDefenseCourtInput {
  briefing: CouncilBriefing;
  opinions: EntityOpinion[];
}

export function holdIdentityDefenseCourt(input: IdentityDefenseCourtInput): IdentityDefenseCourtReading {
  const { briefing, opinions } = input;
  const notes: string[] = [];

  const guardian = opinions.find((o) => o.entity === 'identity-guardian');
  const charge_brought = !!guardian && (guardian.stance === 'object' || guardian.stance === 'caution');

  if (!charge_brought) {
    return {
      charge_brought: false, charge: null, verdict: 'no-charge', defense: null,
      identity_must_be_defended: false,
      notes: ['identity defense court: no charge brought — the Identity Guardian did not object'],
    };
  }

  const charge = guardian!.argument;

  // Mitigation — the Strategist / Synthesizer may argue the banner is
  // strategically sound. Mitigation can soften a CAUTION, never an
  // OBJECT: identity is non-negotiable.
  const strategist = opinions.find((o) => o.entity === 'strategist');
  const synthesizer = opinions.find((o) => o.entity === 'executive-synthesizer');
  const mitigationVoices = [strategist, synthesizer].filter((o) => o && o.stance === 'advocate' && o.conviction >= 6);
  const defense = mitigationVoices.length
    ? `mitigation argued by ${mitigationVoices.map((o) => o!.entity).join(', ')}`
    : null;

  // A hard OBJECT from the Guardian + governance block → convicted.
  // A CAUTION with strong mitigation → acquitted with a warning.
  let verdict: IdentityDefenseCourtReading['verdict'];
  if (briefing.identityGovernanceBlocks || guardian!.stance === 'object') {
    verdict = 'convicted';
  } else if (defense && guardian!.conviction < 8) {
    verdict = 'acquitted';
  } else {
    verdict = 'convicted';
  }

  const identity_must_be_defended = verdict === 'convicted';

  notes.push(`identity defense court: charge "${charge}" — verdict "${verdict}"`);
  if (defense) notes.push(`identity defense court: ${defense}`);
  if (identity_must_be_defended) notes.push('identity defense court: the identity must be defended — the banner is blocked');

  return { charge_brought, charge, verdict, defense, identity_must_be_defended, notes };
}
