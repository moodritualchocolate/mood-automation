/**
 * REVISION TRACE VIEW (Wave 26 — Phase 7)
 *
 * Reads the cognitive-lineage archive to surface the revision chain
 * of the current draft. If the current draft is itself a revision,
 * the chain walks back to its original via revisedFrom.originalDraftId,
 * then forward through every revision derived from that original.
 *
 * The user requirement was explicit: "the original draft must NOT
 * disappear." This view is the proof — every step is visible.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export interface RevisionTraceStep {
  draftId: string;
  createdTick: number;
  kind: 'first-internal-draft' | 'revised-internal-draft';
  revisionNumber?: number;
  basedOnReviewId?: string;
}

export interface RevisionTraceViewModel {
  present: boolean;
  originalDraftId?: string;
  revisionCount: number;
  steps: RevisionTraceStep[];
  statement: string;
}

export function buildRevisionTraceView(snap: RuntimeSnapshot): RevisionTraceViewModel {
  const lineage = snap.cognitiveLineage;
  const currentDraft = snap.os?.currentDraft ?? null;

  if (!currentDraft || !lineage || lineage.entries.length === 0) {
    return {
      present: false, revisionCount: 0, steps: [],
      statement: 'no revision trace yet',
    };
  }

  const originalDraftId = currentDraft.revisedFrom?.originalDraftId
    ?? currentDraft.draftId;

  // Walk the lineage for every draft in this chain — the original
  // plus any revision whose originalDraftId matches.
  const steps: RevisionTraceStep[] = lineage.entries
    .filter((e) => e.kind === 'draft')
    .map((e) => e.payload as import('./operatingSystemCore').CurrentDraft)
    .filter((d) =>
      d.draftId === originalDraftId ||
      d.revisedFrom?.originalDraftId === originalDraftId,
    )
    .map((d) => ({
      draftId: d.draftId,
      createdTick: d.createdTick,
      kind: d.kind,
      revisionNumber: d.revisedFrom?.revisionNumber,
      basedOnReviewId: d.revisedFrom?.basedOnReviewId,
    }))
    .sort((a, b) => a.createdTick - b.createdTick);

  if (steps.length === 0) {
    return {
      present: false, revisionCount: 0, steps: [],
      statement: 'no revision trace yet — current draft predates lineage',
    };
  }

  const revisionCount = steps.filter((s) => s.kind === 'revised-internal-draft').length;

  return {
    present: true,
    originalDraftId,
    revisionCount,
    steps,
    statement: revisionCount === 0
      ? `original draft at tick ${steps[0].createdTick} (no revisions yet)`
      : `original → ${revisionCount} revision${revisionCount === 1 ? '' : 's'} (currently at tick ${steps[steps.length - 1].createdTick})`,
  };
}
