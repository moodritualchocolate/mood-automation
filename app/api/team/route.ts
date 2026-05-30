/**
 * /api/team · operator-supervised.
 *
 * GET   — returns team engine reading + raw members.
 * POST  — operator-supervised. Actions: add-member | update-roles.
 *         Every write requires operatorId + operatorReason.
 *
 * STRICT CONTRACT:
 *   - the route NEVER auto-creates members
 *   - the route NEVER auto-assigns roles
 *   - the route NEVER approves anything on its own
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  createTeamMemoryStore, newTeamMemberId,
  appendTeamMember, updateTeamMemberRoles,
  TEAM_ROLES, type TeamMemberRecord, type TeamRole,
} from '@lib/teamMemory';
import { buildTeamEngine } from '@lib/teamEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROLES: ReadonlySet<TeamRole> = new Set(TEAM_ROLES);

export async function GET(): Promise<NextResponse> {
  const mem = await createTeamMemoryStore().read().catch(() => null);
  const reading = buildTeamEngine({ members: mem?.members ?? [] });
  return NextResponse.json({
    reading,
    members: mem?.members ?? [],
    advisoryNotice:
      'Team · operator-supervised. The route never auto-creates members, ' +
      'never auto-assigns roles, never approves anything. ' +
      'Human remains final authority.',
  });
}

interface AddMemberBody {
  action: 'add-member';
  operatorId: string;
  operatorReason: string;
  name: string;
  roles: TeamRole[];
  operatorNote?: string;
}
interface UpdateRolesBody {
  action: 'update-roles';
  operatorId: string;
  operatorReason: string;
  memberId: string;
  roles: TeamRole[];
}
type Body = AddMemberBody | UpdateRolesBody;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  if (!Array.isArray(body.roles) || body.roles.some((r) => !VALID_ROLES.has(r))) {
    return NextResponse.json({ error: 'roles must be a non-empty array of valid TeamRole values' }, { status: 400 });
  }

  const store = createTeamMemoryStore();
  const state = await store.read();

  if (body.action === 'add-member') {
    if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const record: TeamMemberRecord = {
      memberId: newTeamMemberId(), name: body.name, roles: body.roles,
      createdAt: Date.now(), addedBy: body.operatorId, operatorNote: body.operatorNote,
    };
    await store.save(appendTeamMember(state, record));
    return NextResponse.json({ ok: true, member: record });
  }
  if (body.action === 'update-roles') {
    if (!body.memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    try {
      const next = updateTeamMemberRoles(state, body.memberId, body.roles);
      await store.save(next);
      const updated = next.members.find((m) => m.memberId === body.memberId);
      return NextResponse.json({ ok: true, member: updated });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
