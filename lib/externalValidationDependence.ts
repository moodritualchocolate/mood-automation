/**
 * EXTERNAL VALIDATION DEPENDENCE (Phase 352 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Measures how dependent the brand has become on external validation.
 */

export interface ExternalValidationDependenceReading {
  /** True when external validation is driving decisions. */
  is_dependent: boolean;
  /** 0..10 — dependence level. */
  dependence: number;
  notes: string[];
}

export interface ExternalValidationDependenceInput {
  needsApprovalToAct: boolean;
  freezesWithoutFeedback: boolean;
  selfDirectedEnough: boolean;
}

export function readExternalValidationDependence(input: ExternalValidationDependenceInput): ExternalValidationDependenceReading {
  const { needsApprovalToAct, freezesWithoutFeedback, selfDirectedEnough } = input;
  const notes: string[] = [];

  let dependence = 0;
  if (needsApprovalToAct) dependence += 4;
  if (freezesWithoutFeedback) dependence += 3;
  if (!selfDirectedEnough) dependence += 3;

  const is_dependent = dependence >= 5;

  notes.push(`external validation dependence: ${is_dependent ? 'DEPENDENT' : 'self-directed'} (${dependence}/10)`);
  return { is_dependent, dependence, notes };
}
