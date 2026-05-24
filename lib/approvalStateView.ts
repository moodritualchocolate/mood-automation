/**
 * APPROVAL STATE VIEW (Wave 26 — Phase 7)
 *
 * One of three states: 'pending' (a draft and review exist but no
 * approval yet), 'approved' (an approval exists for the current
 * chain), 'refused' (the latest review recommends refused). Hidden
 * when there's no draft at all.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export type ApprovalDisplayState = 'pending' | 'approved' | 'refused' | 'revise-required';

export interface ApprovalStateViewModel {
  present: boolean;
  state?: ApprovalDisplayState;
  approvalId?: string;
  approvedTick?: number;
  approvedDraftId?: string;
  basedOnReviewId?: string;
  verdict?: 'internally-coherent';
  scoresSnapshot?: {
    qualityScore: number;
    coherenceScore: number;
    restraintScore: number;
    contradictionScore: number;
  };
  statement: string;
}

export function buildApprovalStateView(snap: RuntimeSnapshot): ApprovalStateViewModel {
  const os = snap.os;
  if (!os || !os.currentDraft) {
    return { present: false, statement: 'no draft, no approval state' };
  }

  const approval = os.currentApproval;
  const review = os.currentReview;

  // 'approved' wins if the approval references the CURRENT draft.
  if (approval && approval.approvedDraftId === os.currentDraft.draftId) {
    return {
      present: true,
      state: 'approved',
      approvalId: approval.approvalId,
      approvedTick: approval.approvedTick,
      approvedDraftId: approval.approvedDraftId,
      basedOnReviewId: approval.basedOnReviewId,
      verdict: approval.verdict,
      scoresSnapshot: approval.scoresSnapshot,
      statement: `approved as internally-coherent at tick ${approval.approvedTick} — internal only`,
    };
  }

  // Otherwise derive from the latest review on the current draft.
  if (review && review.derivedFromDraftId === os.currentDraft.draftId) {
    if (review.recommendation === 'refused') {
      return { present: true, state: 'refused',
        statement: `review refused this draft — chain ended` };
    }
    if (review.recommendation === 'revise-required') {
      return { present: true, state: 'revise-required',
        statement: `review requires revision before approval` };
    }
    return { present: true, state: 'pending',
      statement: `review recommends approval — awaiting approve directive` };
  }

  return { present: true, state: 'pending',
    statement: `draft exists, awaiting review` };
}
