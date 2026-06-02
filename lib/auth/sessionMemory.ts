/**
 * SESSION MEMORY (FIFO, operator-supervised)
 *
 * Persistent FIFO of SessionRecords. Each session is created on
 * login and revoked on logout (or admin revoke). The store NEVER
 * auto-creates sessions and NEVER triggers any outbound action.
 *
 * Lives at data/memory/session-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { createHash, randomBytes } from 'crypto';
import type { SessionId, SessionRecord, UserId } from './types';
import { SESSION_ABSOLUTE_TTL_MS, SESSION_COOKIE_MAX_AGE_S, SESSION_SLIDING_HALFLIFE_MS } from './cookie';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'session-memory.json';

export const SESSION_LIMIT = 4096;

// ─── state ───────────────────────────────────────────────────

export interface SessionMemoryState {
  sessions: SessionRecord[];
  totalSessions: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialSessionMemory(): SessionMemoryState {
  return { sessions: [], totalSessions: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

let __sessSeq = 0;
export function newSessionId(): SessionId {
  __sessSeq += 1;
  return `sess-${Date.now().toString(36)}-${__sessSeq.toString(36)}`;
}

// ─── token helpers ───────────────────────────────────────────

/** Generate a fresh 32-byte session token (hex-encoded · 64 chars). */
export function newSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/** Hash the raw token with the sessionId as a per-session salt. */
export function hashSessionToken(sessionId: SessionId, rawToken: string): string {
  return createHash('sha256').update(`${sessionId}:${rawToken}`).digest('hex');
}

// ─── pure transforms ─────────────────────────────────────────

export interface NewSessionInput {
  sessionId: SessionId;
  userId: UserId;
  rawToken: string;
  at: number;
  contextHint?: string;
}

export function appendSession(state: SessionMemoryState, input: NewSessionInput): SessionMemoryState {
  if (state.sessions.some((s) => s.sessionId === input.sessionId)) {
    throw new Error(`session already exists: ${input.sessionId}`);
  }
  const record: SessionRecord = {
    sessionId: input.sessionId,
    userId: input.userId,
    tokenHash: hashSessionToken(input.sessionId, input.rawToken),
    createdAt: input.at,
    lastSeenAt: input.at,
    expiresAt: input.at + SESSION_COOKIE_MAX_AGE_S * 1000,
    contextHint: input.contextHint,
  };
  return {
    ...state,
    sessions: [...state.sessions, record].slice(-SESSION_LIMIT),
    totalSessions: state.totalSessions + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? input.at,
    updatedAt: input.at,
  };
}

function updateSession(
  state: SessionMemoryState, sessionId: SessionId, mutator: (s: SessionRecord) => SessionRecord,
): SessionMemoryState {
  const idx = state.sessions.findIndex((s) => s.sessionId === sessionId);
  if (idx === -1) throw new Error(`session not found: ${sessionId}`);
  const next = mutator(state.sessions[idx]);
  const sessions = [...state.sessions];
  sessions[idx] = next;
  return { ...state, sessions, updatedAt: nowMs() };
}

/** Sliding-expiry refresh. Extends `expiresAt` only after the
 *  sliding half-life has elapsed since the last update. */
export function touchSession(
  state: SessionMemoryState, sessionId: SessionId, at: number,
): SessionMemoryState {
  return updateSession(state, sessionId, (s) => {
    const next: SessionRecord = { ...s, lastSeenAt: at };
    const elapsed = at - s.lastSeenAt;
    if (elapsed >= SESSION_SLIDING_HALFLIFE_MS) {
      const absoluteCap = s.createdAt + SESSION_ABSOLUTE_TTL_MS;
      next.expiresAt = Math.min(absoluteCap, at + SESSION_COOKIE_MAX_AGE_S * 1000);
    }
    return next;
  });
}

export function revokeSession(
  state: SessionMemoryState, sessionId: SessionId, at: number, reason: string,
): SessionMemoryState {
  return updateSession(state, sessionId, (s) => {
    if (s.revokedAt) return s;
    return { ...s, revokedAt: at, revokedReason: reason };
  });
}

export function revokeUserSessions(
  state: SessionMemoryState, userId: UserId, at: number, reason: string,
): SessionMemoryState {
  const sessions = state.sessions.map((s) => {
    if (s.userId !== userId) return s;
    if (s.revokedAt) return s;
    return { ...s, revokedAt: at, revokedReason: reason };
  });
  return { ...state, sessions, updatedAt: at };
}

/** Read-side helper: returns the live session matching the given
 *  (sessionId, raw token) or null. Live = not revoked, not expired. */
export function findLiveSession(
  state: SessionMemoryState, sessionId: SessionId, rawToken: string, at: number,
): SessionRecord | null {
  const record = state.sessions.find((s) => s.sessionId === sessionId);
  if (!record) return null;
  if (record.revokedAt) return null;
  if (record.expiresAt <= at) return null;
  const expected = hashSessionToken(sessionId, rawToken);
  if (record.tokenHash !== expected) return null;
  return record;
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodSessionMemory?: SessionMemoryState };

export interface SessionMemoryStore {
  read(): Promise<SessionMemoryState>;
  save(state: SessionMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createSessionMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): SessionMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: SessionMemoryStore = {
    async read() {
      if (g.__moodSessionMemory) return g.__moodSessionMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<SessionMemoryState>;
        g.__moodSessionMemory = { ...createInitialSessionMemory(), ...parsed };
      } catch {
        g.__moodSessionMemory = createInitialSessionMemory();
      }
      return g.__moodSessionMemory;
    },
    async save(state) {
      state.sessions = state.sessions.slice(-SESSION_LIMIT);
      state.updatedAt = nowMs();
      g.__moodSessionMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodSessionMemory = undefined;
    },
  };
  return store;
}
