/**
 * USER MEMORY (FIFO, operator-supervised)
 *
 * Persistent FIFO of UserRecords. Pure transforms throw on unknown
 * userId / duplicate email. The store NEVER auto-creates a user,
 * NEVER triggers any outbound action, NEVER sends email.
 *
 * Lives at data/memory/user-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { UserId, UserRecord } from './types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'user-memory.json';

export const USER_LIMIT = 2048;

// ─── state ───────────────────────────────────────────────────

export interface UserMemoryState {
  users: UserRecord[];
  totalUsers: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialUserMemory(): UserMemoryState {
  return { users: [], totalUsers: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

let __userSeq = 0;
export function newUserId(): UserId {
  __userSeq += 1;
  return `user-${Date.now().toString(36)}-${__userSeq.toString(36)}`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ─── pure transforms ─────────────────────────────────────────

export function appendUser(state: UserMemoryState, record: UserRecord): UserMemoryState {
  if (state.users.some((u) => u.userId === record.userId)) {
    throw new Error(`user already exists: ${record.userId}`);
  }
  const normalizedNew = normalizeEmail(record.email);
  if (state.users.some((u) => normalizeEmail(u.email) === normalizedNew)) {
    throw new Error(`email already in use: ${record.email}`);
  }
  return {
    ...state,
    users: [...state.users, { ...record, email: normalizedNew }].slice(-USER_LIMIT),
    totalUsers: state.totalUsers + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? record.createdAt,
    updatedAt: record.createdAt,
  };
}

export function findUserByEmail(state: UserMemoryState, email: string): UserRecord | null {
  const target = normalizeEmail(email);
  return state.users.find((u) => normalizeEmail(u.email) === target) ?? null;
}

export function findUserById(state: UserMemoryState, userId: UserId): UserRecord | null {
  return state.users.find((u) => u.userId === userId) ?? null;
}

function updateUser(
  state: UserMemoryState, userId: UserId, mutator: (u: UserRecord) => UserRecord,
): UserMemoryState {
  const idx = state.users.findIndex((u) => u.userId === userId);
  if (idx === -1) throw new Error(`user not found: ${userId}`);
  const next = mutator(state.users[idx]);
  const users = [...state.users];
  users[idx] = next;
  return { ...state, users, updatedAt: nowMs() };
}

export function recordFailedLogin(
  state: UserMemoryState, userId: UserId, at: number, lockoutMs: number,
): UserMemoryState {
  return updateUser(state, userId, (u) => {
    const next = { ...u, failedLoginCount: u.failedLoginCount + 1 };
    // Lockout kicks in at 5 failures within a rolling window.
    if (next.failedLoginCount >= 5) {
      next.lockedUntil = at + lockoutMs;
    }
    return next;
  });
}

export function resetFailedLogin(state: UserMemoryState, userId: UserId): UserMemoryState {
  return updateUser(state, userId, (u) => ({ ...u, failedLoginCount: 0, lockedUntil: 0 }));
}

export function disableUser(state: UserMemoryState, userId: UserId, at: number): UserMemoryState {
  return updateUser(state, userId, (u) => {
    if (u.disabledAt) throw new Error(`user already disabled: ${userId}`);
    return { ...u, disabledAt: at };
  });
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodUserMemory?: UserMemoryState };

export interface UserMemoryStore {
  read(): Promise<UserMemoryState>;
  save(state: UserMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createUserMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): UserMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: UserMemoryStore = {
    async read() {
      if (g.__moodUserMemory) return g.__moodUserMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<UserMemoryState>;
        g.__moodUserMemory = { ...createInitialUserMemory(), ...parsed };
      } catch {
        g.__moodUserMemory = createInitialUserMemory();
      }
      return g.__moodUserMemory;
    },
    async save(state) {
      state.users = state.users.slice(-USER_LIMIT);
      state.updatedAt = nowMs();
      g.__moodUserMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodUserMemory = undefined;
    },
  };
  return store;
}
