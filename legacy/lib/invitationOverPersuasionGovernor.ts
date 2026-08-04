/** INVITATION OVER PERSUASION GOVERNOR (Phase 434 — Wave 16) */
export interface InvitationOverPersuasionReading { chose_invitation: boolean; notes: string[]; }
export interface InvitationOverPersuasionInput { inviting: boolean; persuading: boolean; }
export function readInvitationOverPersuasionGovernor(input: InvitationOverPersuasionInput): InvitationOverPersuasionReading {
  const chose_invitation = input.inviting && !input.persuading;
  return { chose_invitation, notes: [`invitation over persuasion governor: ${chose_invitation ? 'INVITATION' : 'persuasion'}`] };
}
