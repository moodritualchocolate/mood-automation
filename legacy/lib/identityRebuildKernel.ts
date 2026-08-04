/**
 * IDENTITY REBUILD KERNEL (Phase 380 — Wave 15: Identity Preservation Under Live Reality)
 *
 * For severe identity damage — the rebuilding process from the
 * founding identity outward.
 */

export interface IdentityRebuildKernelReading {
  rebuild_in_progress: boolean;
  rebuild_step: string;
  notes: string[];
}

export interface IdentityRebuildKernelInput {
  identityDamaged: boolean;
  rebuildResourcesAvailable: boolean;
}

export function readIdentityRebuildKernel(input: IdentityRebuildKernelInput): IdentityRebuildKernelReading {
  const { identityDamaged, rebuildResourcesAvailable } = input;
  const notes: string[] = [];

  const rebuild_in_progress = identityDamaged && rebuildResourcesAvailable;
  const rebuild_step = !identityDamaged ? 'no rebuild needed'
    : !rebuildResourcesAvailable ? 'rebuild blocked — no resources'
    : 'rebuilding from founding identity outward';

  notes.push(`identity rebuild kernel: ${rebuild_step}`);
  return { rebuild_in_progress, rebuild_step, notes };
}
