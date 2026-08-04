/**
 * TEAM MEMORY (FIFO, operator-supervised)
 *
 * Phase 2 — Operations Layer.
 *
 * Persistent store of TEAM MEMBERS + ROLE ASSIGNMENTS. Roles are
 * a fixed union (Owner, Creative Director, Designer, Editor, Media
 * Buyer, Operator, Reviewer).
 *
 * STRICT CONTRACT:
 *   - the store never auto-creates members
 *   - the store never auto-assigns roles
 *   - the store never approves anything by itself — approval flow
 *     validation happens in the team engine
 *
 * Lives at data/memory/team-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'team-memory.json';

export const TEAM_MEMBER_LIMIT = 128;

// ─── types ────────────────────────────────────────────────────

export type TeamRole =
  | 'owner' | 'creative-director' | 'designer' | 'editor'
  | 'media-buyer' | 'operator' | 'reviewer';

export const TEAM_ROLES: TeamRole[] = [
  'owner', 'creative-director', 'designer', 'editor',
  'media-buyer', 'operator', 'reviewer',
];

export interface TeamMemberRecord {
  memberId: string;
  /** Display name — operator-provided, NOT linked to external auth. */
  name: string;
  roles: TeamRole[];
  createdAt: number;
  /** Operator who added the member. */
  addedBy: string;
  operatorNote?: string;
}

// ─── state ────────────────────────────────────────────────────

export interface TeamMemoryState {
  members: TeamMemberRecord[];
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialTeamMemory(): TeamMemoryState {
  return { members: [], firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helper ───────────────────────────────────────────────

let __memSeq = 0;
export function newTeamMemberId(): string {
  __memSeq += 1;
  return `team-${Date.now().toString(36)}-${__memSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendTeamMember(state: TeamMemoryState, record: TeamMemberRecord): TeamMemoryState {
  return {
    ...state,
    members: [...state.members, record].slice(-TEAM_MEMBER_LIMIT),
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}
export function updateTeamMemberRoles(
  state: TeamMemoryState, memberId: string, roles: TeamRole[],
): TeamMemoryState {
  const idx = state.members.findIndex((m) => m.memberId === memberId);
  if (idx === -1) throw new Error(`team member not found: ${memberId}`);
  const members = [...state.members];
  members[idx] = { ...members[idx], roles };
  return { ...state, members, updatedAt: nowMs() };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodTeam?: TeamMemoryState };

export interface TeamMemoryStore {
  read(): Promise<TeamMemoryState>;
  save(state: TeamMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createTeamMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): TeamMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: TeamMemoryStore = {
    async read() {
      if (g.__moodTeam) return g.__moodTeam;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<TeamMemoryState>;
        g.__moodTeam = { ...createInitialTeamMemory(), ...parsed };
      } catch {
        g.__moodTeam = createInitialTeamMemory();
      }
      return g.__moodTeam;
    },
    async save(state) {
      state.updatedAt = nowMs();
      g.__moodTeam = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodTeam = undefined;
    },
  };
  return store;
}
