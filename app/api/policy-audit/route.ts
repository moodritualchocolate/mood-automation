/**
 * GET /api/policy-audit
 *
 * Read-only governance view over data/memory/copy-quality-policy-audit.json.
 * Returns a PolicyAuditView shaped for the studio audit panel.
 *
 * No generation, no critic, no external execution.
 */

import { createPolicyAuditStore } from '@lib/copyQualityPolicyAudit';
import { buildPolicyAuditView } from '@lib/copyQualityPolicyAuditView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await createPolicyAuditStore().read().catch(() => null);
  const view = buildPolicyAuditView(state);
  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
