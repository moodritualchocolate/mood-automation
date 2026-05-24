/**
 * INTERNAL DRAFT VIEW (Phase 6 — Wave 24)
 *
 * A minimal view of currentDraft on the OS state. Exposes status,
 * kind, createdTick, body, and restraintTrace so the dashboard can
 * show the first internal artifact. Hidden when no draft exists.
 *
 * No external content. The view is bound straight to os.currentDraft;
 * if that field is null the panel disappears. There is no fallback
 * value, no derived text, no fabricated activity.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export interface InternalDraftViewModel {
  present: boolean;
  draftId?: string;
  status?: 'internal';
  kind?: 'first-internal-draft';
  createdTick?: number;
  createdAt?: number;
  derivedFromPreparedTick?: number;
  derivedFromPermittedTick?: number;
  body?: string;
  restraintTrace?: string[];
  statement: string;
}

export function buildInternalDraftView(snap: RuntimeSnapshot): InternalDraftViewModel {
  const d = snap.os?.currentDraft ?? null;
  if (!d) {
    return {
      present: false,
      statement: 'no internal draft yet',
    };
  }
  return {
    present: true,
    draftId: d.draftId,
    status: d.status,
    kind: d.kind,
    createdTick: d.createdTick,
    createdAt: d.createdAt,
    derivedFromPreparedTick: d.derivedFromPreparedTick,
    derivedFromPermittedTick: d.derivedFromPermittedTick,
    body: d.body,
    restraintTrace: d.restraintTrace,
    statement:
      `internal draft at tick ${d.createdTick}, status ${d.status}, ` +
      `kind ${d.kind} — derived from prepared tick ${d.derivedFromPreparedTick}`,
  };
}
