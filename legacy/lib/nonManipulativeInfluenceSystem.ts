/**
 * NON-MANIPULATIVE INFLUENCE SYSTEM (Phase 408 — Wave 16: Generative Civilization Presence)
 *
 * Influence by invitation, not by manipulation — the only kind that
 * does not corrupt the brand.
 */

export interface NonManipulativeInfluenceReading {
  influence_is_invitation: boolean;
  notes: string[];
}

export interface NonManipulativeInfluenceInput {
  invitesNotPushes: boolean;
  manipulating: boolean;
}

export function readNonManipulativeInfluenceSystem(input: NonManipulativeInfluenceInput): NonManipulativeInfluenceReading {
  const { invitesNotPushes, manipulating } = input;
  const notes: string[] = [];

  const influence_is_invitation = invitesNotPushes && !manipulating;

  notes.push(`non-manipulative influence system: ${influence_is_invitation ? 'INVITATION' : 'pressure'}`);
  return { influence_is_invitation, notes };
}
