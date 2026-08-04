/** BEAUTY OVER SPECTACLE GOVERNOR (Phase 465 — Wave 16) */
export interface BeautyOverSpectacleGovernorReading { chose_beauty: boolean; notes: string[]; }
export interface BeautyOverSpectacleGovernorInput { beautifulOptionPicked: boolean; spectacleOptionPicked: boolean; }
export function readBeautyOverSpectacleGovernor(input: BeautyOverSpectacleGovernorInput): BeautyOverSpectacleGovernorReading {
  const chose_beauty = input.beautifulOptionPicked && !input.spectacleOptionPicked;
  return { chose_beauty, notes: [`beauty over spectacle governor: ${chose_beauty ? 'BEAUTY' : 'spectacle'}`] };
}
