/**
 * Process-local cache of recently generated banners.
 *
 * Used so the studio's export endpoint can rasterise the SVG without
 * re-running the full pipeline. In production we would swap this for
 * a real store keyed on banner.id; for V1 a 50-entry LRU is enough.
 */

import type { Banner } from './types';

const MAX = 50;

// Use a globalThis-scoped store so Next.js HMR / multiple route module
// instances all share the same cache during a process lifetime.
const g = globalThis as unknown as { __moodBannerCache?: Map<string, Banner> };
if (!g.__moodBannerCache) g.__moodBannerCache = new Map<string, Banner>();
const map = g.__moodBannerCache;

export function rememberBanner(b: Banner) {
  if (map.size >= MAX) {
    const oldest = map.keys().next().value;
    if (oldest) map.delete(oldest);
  }
  map.set(b.id, b);
}

export function recallBanner(id: string): Banner | undefined {
  return map.get(id);
}
