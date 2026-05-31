/**
 * WORKSPACE QUICK START (pure)
 *
 * Operator-facing quick-start catalog. After onboarding the operator
 * may pick one of five quick-start options; each option produces a
 * workflow draft — never an active workflow, never a launched
 * campaign, never a published asset.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - quick-start NEVER launches automatically
 *   - quick-start NEVER publishes
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type { BusinessGoalId } from '@lib/business/businessGoalModel';
import type { WorkflowTemplateId } from './workflowTemplates';
import { getWorkflowTemplate } from './workflowTemplates';

// ─── catalog ─────────────────────────────────────────────────

export type QuickStartOptionId =
  | 'launch-product' | 'generate-leads' | 'build-awareness'
  | 'grow-community' | 'retain-customers';

export interface QuickStartOption {
  optionId: QuickStartOptionId;
  label: string;
  description: string;
  /** Goal the option scaffolds toward. */
  goalId: BusinessGoalId;
  /** Workflow template the option produces as a draft. */
  templateId: WorkflowTemplateId;
  /** Observational tags. */
  observationalTags: string[];
}

const OPTIONS: QuickStartOption[] = [
  {
    optionId: 'launch-product',
    label: 'Launch Product',
    description: 'Operator chooses the product launch workflow as a draft.',
    goalId: 'product-launch', templateId: 'product-launch',
    observationalTags: ['launch', 'reveal'],
  },
  {
    optionId: 'generate-leads',
    label: 'Generate Leads',
    description: 'Operator chooses the lead-generation workflow as a draft.',
    goalId: 'lead-generation', templateId: 'lead-generation',
    observationalTags: ['lead capture', 'opt-in'],
  },
  {
    optionId: 'build-awareness',
    label: 'Build Awareness',
    description: 'Operator chooses the brand-awareness workflow as a draft.',
    goalId: 'brand-awareness', templateId: 'brand-awareness',
    observationalTags: ['reach', 'recognition'],
  },
  {
    optionId: 'grow-community',
    label: 'Grow Community',
    description: 'Operator chooses the community-growth workflow as a draft.',
    goalId: 'community-growth', templateId: 'community-growth',
    observationalTags: ['community', 'replies'],
  },
  {
    optionId: 'retain-customers',
    label: 'Retain Customers',
    description: 'Operator chooses the retention workflow as a draft.',
    goalId: 'retention', templateId: 'retention',
    observationalTags: ['lifecycle', 'reactivation'],
  },
];

export const ALL_QUICK_START_OPTIONS: QuickStartOption[] = OPTIONS;
export const QUICK_START_OPTION_IDS: QuickStartOptionId[] = OPTIONS.map((o) => o.optionId);

// ─── pure helpers ────────────────────────────────────────────

export function getQuickStartOption(id: QuickStartOptionId): QuickStartOption {
  const o = OPTIONS.find((x) => x.optionId === id);
  if (!o) throw new Error(`unknown quick-start option: ${id}`);
  return o;
}

export interface QuickStartCatalog {
  options: QuickStartOption[];
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Workspace quick-start is a catalog of operator-supervised draft options. ' +
  'No option launches automatically. No option publishes. No option spends ' +
  'money. Operator approval required at every draft → active transition. ' +
  'Human remains final authority.';

export function listQuickStartOptions(): QuickStartCatalog {
  return {
    options: OPTIONS,
    notes: [
      `${OPTIONS.length} quick-start options defined`,
      'each option produces a workflow draft (status=draft) — never active automatically',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}

/** Pure: validate a quick-start option references a valid template. */
export function validateQuickStartOption(id: QuickStartOptionId): { ok: boolean; templateLabel: string } {
  const o = getQuickStartOption(id);
  const t = getWorkflowTemplate(o.templateId);
  return { ok: true, templateLabel: t.label };
}
