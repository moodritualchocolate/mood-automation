/**
 * PRIVATE RITUAL MEMORY (Phase 22)
 *
 * The campaign accumulates a memory of which RITUALS it has been
 * observing. Across many banners, certain rituals begin to define
 * the campaign's emotional weather. Private ritual memory is
 * persistent; it informs the next banner by telling the system
 * which rituals are becoming campaign-signature.
 *
 * Reads the humanDesireMemory store, filtered to ritual-dependency
 * entries. Reports which rituals are over-represented.
 */

import type { DesireMemoryEntry, HumanDesireMemoryStore } from './humanDesireMemory';

export interface PrivateRitualMemoryReading {
  /** Rituals that have appeared in 3+ banners. */
  campaign_ritual_signatures: DesireMemoryEntry[];
  /** True when one ritual dominates (any ritual at >=5 appearances). */
  ritual_over_represented: boolean;
  notes: string[];
}

export async function readPrivateRitualMemory(args: { store: HumanDesireMemoryStore }): Promise<PrivateRitualMemoryReading> {
  const { store } = args;
  const all = await store.list('ritual-dependency');
  const campaign_ritual_signatures = all.filter((e) => e.count >= 3).sort((a, b) => b.count - a.count);
  const ritual_over_represented = all.some((e) => e.count >= 5);
  const notes: string[] = [];
  if (campaign_ritual_signatures.length > 0) {
    notes.push(`campaign ritual signatures: ${campaign_ritual_signatures.slice(0, 3).map((e) => `${e.display}×${e.count}`).join(', ')}`);
  }
  if (ritual_over_represented) notes.push('WARNING: one ritual is dominating campaign memory');
  return { campaign_ritual_signatures, ritual_over_represented, notes };
}
