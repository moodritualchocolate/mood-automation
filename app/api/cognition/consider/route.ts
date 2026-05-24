/**
 * POST /api/cognition/consider — hold a relation in mind.
 *
 * Wave 21 — cognitive vocabulary. Consider does not name a single
 * fact (notice's job); it holds a derived relation: cognition density
 * — the ratio of cognitive acts to ticks of uptime. The number is
 * computed from persistent state at evolve time, not invented.
 *
 * Persists to data/runtime/os-runtime.json (directive 'consider' with
 * a composed thought) and data/runtime/organism.json (age += 1).
 * No external mutation, no generation.
 */

import { runConsider } from '@lib/cognitionEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await runConsider();
  return Response.json({ ok: true, ...result });
}
