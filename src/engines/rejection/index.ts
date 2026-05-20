/**
 * 12. REJECTION SYSTEM
 *
 * Drives the regenerate loop. Given a critic verdict, decides what to
 * keep and what to rerun. The pipeline calls this between attempts.
 *
 * reject-image  → rerun image generation with stricter prompt
 * reject-concept → rerun from state selection (try a different state)
 * approve        → ship
 */

import type { Critique } from '@/core/types';

export interface RejectionAction {
  kind: 'approve' | 'regen-image' | 'regen-concept';
  reasons: string[];
  promptHardening?: string;
}

export function decideRejection(c: Critique): RejectionAction {
  if (c.verdict === 'approve') return { kind: 'approve', reasons: [] };

  if (c.verdict === 'reject-image') {
    return {
      kind: 'regen-image',
      reasons: c.rejectionReasons,
      promptHardening:
        'Push further into documentary realism. Stronger imperfection. Subject NOT centered. Product feels found, not placed. No theatrical lighting. Visible everyday-life detail.',
    };
  }

  return {
    kind: 'regen-concept',
    reasons: c.rejectionReasons,
  };
}
