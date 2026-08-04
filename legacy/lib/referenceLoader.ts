/**
 * References loader.
 *
 * Loads every JSON file under /references/<category>/*.json once per
 * process and caches by category. Returns ReferenceAnalysis records the
 * rest of the taste system compares against.
 *
 * The directories chosen here mirror the named categories from the
 * spec: excellent / good / bad / too_ai / premium / editorial /
 * documentary / fashion / quiet / aggressive / scrollstop / boring.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { ReferenceAnalysis } from './referenceDNA';

const ROOT = path.resolve(process.cwd(), 'references');

export const REFERENCE_CATEGORIES = [
  'excellent',
  'good',
  'bad',
  'too_ai',
  'premium',
  'editorial',
  'documentary',
  'fashion',
  'quiet',
  'aggressive',
  'scrollstop',
  'boring',
] as const;
export type ReferenceCategory = (typeof REFERENCE_CATEGORIES)[number];

const g = globalThis as unknown as { __moodRefs?: ReferenceAnalysis[] };

export async function loadReferences(): Promise<ReferenceAnalysis[]> {
  if (g.__moodRefs) return g.__moodRefs;
  const out: ReferenceAnalysis[] = [];
  for (const cat of REFERENCE_CATEGORIES) {
    const dir = path.join(ROOT, cat);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const file of entries) {
      if (!file.endsWith('.json')) continue;
      try {
        const txt = await fs.readFile(path.join(dir, file), 'utf8');
        const parsed = JSON.parse(txt) as ReferenceAnalysis;
        // Inject category from the folder name if the JSON omitted it.
        out.push({ ...parsed, category: parsed.category ?? cat });
      } catch (e) {
        console.warn(`[references] failed to parse ${cat}/${file}:`, (e as Error).message);
      }
    }
  }
  g.__moodRefs = out;
  return out;
}

export function categorize(refs: ReferenceAnalysis[]): Record<ReferenceCategory, ReferenceAnalysis[]> {
  const out = {} as Record<ReferenceCategory, ReferenceAnalysis[]>;
  for (const cat of REFERENCE_CATEGORIES) out[cat] = [];
  for (const r of refs) {
    if ((REFERENCE_CATEGORIES as readonly string[]).includes(r.category)) {
      out[r.category as ReferenceCategory].push(r);
    }
  }
  return out;
}
