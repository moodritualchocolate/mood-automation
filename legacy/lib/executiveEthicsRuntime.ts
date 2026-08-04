/**
 * EXECUTIVE ETHICS RUNTIME (Phase 66 — Wave 6: Cognitive Civilization)
 *
 * A civilization governs by ETHICS, not only by strategy. The ethics
 * runtime holds the civilization's moral constraints — the things it
 * will not do to a human audience even when strategy, performance,
 * and timing all permit them.
 */

import type { CivilizationState } from './civilizationArchive';

export interface EthicalConstraint {
  id: string;
  constraint: string;
}

export const ETHICAL_CONSTRAINTS: EthicalConstraint[] = [
  { id: 'no-manufactured-inadequacy', constraint: 'never manufacture inadequacy in the audience to sell a fix' },
  { id: 'no-exploited-exhaustion', constraint: 'never exploit the audience\'s exhaustion as a conversion lever' },
  { id: 'no-false-urgency', constraint: 'never use false urgency to extract attention' },
  { id: 'no-aestheticised-suffering', constraint: 'never aestheticise human suffering for engagement' },
  { id: 'no-performed-care', constraint: 'never perform care the brand does not actually hold' },
];

export interface ExecutiveEthicsReading {
  /** Ethical constraints the current candidate appears to violate. */
  violated_constraints: string[];
  /** 0..10 — how ethically clean the candidate is. */
  ethical_integrity: number;
  /** True when an ethical line was crossed. */
  ethical_violation: boolean;
  notes: string[];
}

export interface ExecutiveEthicsInput {
  state: CivilizationState;
  /** True when the candidate manufactures inadequacy / sells a fix. */
  manufacturesInadequacy: boolean;
  /** True when the candidate exploits exhaustion as a lever. */
  exploitsExhaustion: boolean;
  /** True when the candidate uses false urgency. */
  usesFalseUrgency: boolean;
  /** True when the candidate aestheticises suffering. */
  aestheticisesSuffering: boolean;
  /** True when the candidate performs care it does not hold. */
  performsCare: boolean;
}

export function readExecutiveEthics(input: ExecutiveEthicsInput): ExecutiveEthicsReading {
  const notes: string[] = [];
  const violated_constraints: string[] = [];

  if (input.manufacturesInadequacy) violated_constraints.push('no-manufactured-inadequacy');
  if (input.exploitsExhaustion) violated_constraints.push('no-exploited-exhaustion');
  if (input.usesFalseUrgency) violated_constraints.push('no-false-urgency');
  if (input.aestheticisesSuffering) violated_constraints.push('no-aestheticised-suffering');
  if (input.performsCare) violated_constraints.push('no-performed-care');

  const ethical_violation = violated_constraints.length > 0;
  const ethical_integrity = Math.max(0, Math.min(10, 10 - violated_constraints.length * 2.5));

  if (ethical_violation) {
    notes.push(`executive ethics: the candidate violates ethical constraints — ${violated_constraints.join(', ')}`);
  } else {
    notes.push('executive ethics: the candidate is ethically clean — no moral line was crossed');
  }

  return { violated_constraints, ethical_integrity, ethical_violation, notes };
}
