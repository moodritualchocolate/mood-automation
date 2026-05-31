/**
 * /api/workflow-templates · static workflow template catalog.
 *
 * GET — read-only. The route NEVER auto-selects a template,
 * NEVER launches anything.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  getWorkflowTemplate, listWorkflowTemplates, type WorkflowTemplateId,
} from '@lib/workflows/workflowTemplates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = new URL(req.url).searchParams.get('templateId') as WorkflowTemplateId | null;
  if (id) {
    try {
      const template = getWorkflowTemplate(id);
      return NextResponse.json({
        template,
        advisoryNotice:
          'Workflow template · read-only. The route NEVER launches anything. ' +
          'Human remains final authority.',
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 404 });
    }
  }
  const catalog = listWorkflowTemplates();
  return NextResponse.json({
    catalog,
    advisoryNotice:
      'Workflow template catalog · read-only. The route NEVER auto-selects ' +
      'a template, NEVER launches anything. Human remains final authority.',
  });
}
