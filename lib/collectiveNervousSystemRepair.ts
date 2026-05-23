/**
 * COLLECTIVE NERVOUS SYSTEM REPAIR (Phase 412 — Wave 16)
 */

export interface CollectiveNervousSystemRepairReading {
  repair_offered: boolean;
  repair_kind: string | null;
  notes: string[];
}

export interface CollectiveNervousSystemRepairInput {
  audienceOverloaded: boolean;
  brandOfferingSlowness: boolean;
  brandOfferingPermission: boolean;
}

export function readCollectiveNervousSystemRepair(input: CollectiveNervousSystemRepairInput): CollectiveNervousSystemRepairReading {
  const { audienceOverloaded, brandOfferingSlowness, brandOfferingPermission } = input;
  const notes: string[] = [];

  const repair_kind = !audienceOverloaded ? null
    : brandOfferingSlowness ? 'slowness — a breath the audience can fall into'
    : brandOfferingPermission ? 'permission — to feel without performing'
    : null;

  const repair_offered = repair_kind !== null;

  notes.push(`collective nervous system repair: ${repair_offered ? `OFFERED — ${repair_kind}` : 'none'}`);
  return { repair_offered, repair_kind, notes };
}
