/**
 * /api/onboarding · operator-supervised brand onboarding wizard.
 *
 * GET  ?operatorId=…  → list operator's sessions + descriptor for active one
 * POST · operator-supervised.
 *        Actions:
 *          start    · operator begins a new session
 *          advance  · operator submits the current step
 *          revise   · operator re-submits a previously-completed step
 *          abandon  · operator abandons the session
 *        Every write requires operatorId + operatorReason. The route
 *        NEVER auto-advances steps, NEVER auto-creates downstream
 *        entities, NEVER auto-completes the wizard.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import {
  appendOnboardingSession, createOnboardingMemoryStore,
  newOnboardingSessionId, replaceOnboardingSession,
} from '@lib/productization/onboardingMemory';
import {
  abandonOnboarding, advanceOnboarding, createInitialOnboardingSession,
  describeOnboardingSession, reviseOnboarding,
  ONBOARDING_STEP_IDS, type OnboardingStepId,
} from '@lib/productization/onboardingWizard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const operatorId = url.searchParams.get('operatorId') ?? '';
  const sessionId = url.searchParams.get('sessionId');
  if (!operatorId) return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });

  const mem = await createOnboardingMemoryStore().read().catch(() => null);
  const sessions = (mem?.sessions ?? []).filter((s) => s.operatorId === operatorId);
  const target = sessionId
    ? sessions.find((s) => s.sessionId === sessionId)
    : sessions[sessions.length - 1];
  return NextResponse.json({
    sessions,
    activeSession: target ?? null,
    descriptor: target ? describeOnboardingSession(target) : null,
    advisoryNotice:
      'Onboarding wizard · operator-supervised. The route NEVER auto-advances ' +
      'steps, NEVER auto-creates downstream entities, NEVER auto-completes the ' +
      'wizard. Human remains final authority.',
  });
}

interface BaseBody {
  action: 'start' | 'advance' | 'revise' | 'abandon';
  operatorId: string;
  operatorReason: string;
}
interface StartBody extends BaseBody { action: 'start'; }
interface AdvanceBody extends BaseBody {
  action: 'advance'; sessionId: string; stepId: OnboardingStepId; values: Record<string, unknown>;
}
interface ReviseBody extends BaseBody {
  action: 'revise'; sessionId: string; stepId: OnboardingStepId; values: Record<string, unknown>;
}
interface AbandonBody extends BaseBody { action: 'abandon'; sessionId: string; }
type Body = StartBody | AdvanceBody | ReviseBody | AbandonBody;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  body.operatorId = auth.ctx.user.userId;

  const store = createOnboardingMemoryStore();
  const state = await store.read();
  const at = Date.now();

  try {
    if (body.action === 'start') {
      const session = createInitialOnboardingSession(newOnboardingSessionId(), body.operatorId, at);
      const next = appendOnboardingSession(state, session);
      await store.save(next);
      return NextResponse.json({
        ok: true, session, descriptor: describeOnboardingSession(session),
        advisoryNotice:
          'Operator-supervised — onboarding session started. The route NEVER ' +
          'auto-advances steps. Human remains final authority.',
      });
    }
    if (body.action === 'advance' || body.action === 'revise') {
      const existing = state.sessions.find((s) => s.sessionId === body.sessionId);
      if (!existing) return NextResponse.json({ error: 'session not found' }, { status: 404 });
      if (existing.operatorId !== body.operatorId) {
        return NextResponse.json({ error: 'operator MAY NOT touch another operator’s session' }, { status: 403 });
      }
      if (!ONBOARDING_STEP_IDS.includes(body.stepId)) {
        return NextResponse.json({ error: 'unknown stepId' }, { status: 400 });
      }
      const advance = body.action === 'advance' ? advanceOnboarding : reviseOnboarding;
      const updated = advance(existing, {
        stepId: body.stepId, values: body.values,
        operatorId: body.operatorId, operatorReason: body.operatorReason, at,
      });
      const next = replaceOnboardingSession(state, updated);
      await store.save(next);
      return NextResponse.json({
        ok: true, session: updated, descriptor: describeOnboardingSession(updated),
        advisoryNotice:
          `Operator-supervised — step \`${body.stepId}\` ${body.action}d. ` +
          'The route NEVER auto-creates downstream entities. ' +
          'Human remains final authority.',
      });
    }
    if (body.action === 'abandon') {
      const existing = state.sessions.find((s) => s.sessionId === body.sessionId);
      if (!existing) return NextResponse.json({ error: 'session not found' }, { status: 404 });
      if (existing.operatorId !== body.operatorId) {
        return NextResponse.json({ error: 'operator MAY NOT touch another operator’s session' }, { status: 403 });
      }
      const updated = abandonOnboarding(existing, body.operatorId, body.operatorReason, at);
      const next = replaceOnboardingSession(state, updated);
      await store.save(next);
      return NextResponse.json({
        ok: true, session: updated, descriptor: describeOnboardingSession(updated),
        advisoryNotice:
          'Operator-supervised — onboarding session abandoned. ' +
          'Human remains final authority.',
      });
    }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    const msg = (err as Error).message;
    const status = /not found/.test(msg) ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
