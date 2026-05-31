/**
 * ONBOARDING MEMORY (FIFO, operator-supervised)
 *
 * Persistent FIFO of operator-supervised onboarding sessions. The
 * memory NEVER auto-creates sessions, NEVER auto-transitions a
 * session, NEVER triggers any outbound action.
 *
 * Lives at data/memory/onboarding-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { OnboardingSessionState } from './onboardingWizard';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'onboarding-memory.json';

export const ONBOARDING_LIMIT = 128;

export interface OnboardingMemoryState {
  sessions: OnboardingSessionState[];
  totalSessions: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialOnboardingMemory(): OnboardingMemoryState {
  return { sessions: [], totalSessions: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

let __obSeq = 0;
export function newOnboardingSessionId(): string {
  __obSeq += 1;
  return `onboarding-${Date.now().toString(36)}-${__obSeq.toString(36)}`;
}

// ─── pure transforms ─────────────────────────────────────────

export function appendOnboardingSession(
  state: OnboardingMemoryState, session: OnboardingSessionState,
): OnboardingMemoryState {
  if (state.sessions.some((s) => s.sessionId === session.sessionId)) {
    throw new Error(`onboarding session already exists: ${session.sessionId}`);
  }
  return {
    ...state,
    sessions: [...state.sessions, session].slice(-ONBOARDING_LIMIT),
    totalSessions: state.totalSessions + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? session.createdAt,
    updatedAt: session.createdAt,
  };
}

export function replaceOnboardingSession(
  state: OnboardingMemoryState, session: OnboardingSessionState,
): OnboardingMemoryState {
  const idx = state.sessions.findIndex((s) => s.sessionId === session.sessionId);
  if (idx === -1) throw new Error(`onboarding session not found: ${session.sessionId}`);
  const sessions = [...state.sessions];
  sessions[idx] = session;
  return { ...state, sessions, updatedAt: session.updatedAt };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodOnboardingMemory?: OnboardingMemoryState };

export interface OnboardingMemoryStore {
  read(): Promise<OnboardingMemoryState>;
  save(state: OnboardingMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createOnboardingMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): OnboardingMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: OnboardingMemoryStore = {
    async read() {
      if (g.__moodOnboardingMemory) return g.__moodOnboardingMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<OnboardingMemoryState>;
        g.__moodOnboardingMemory = { ...createInitialOnboardingMemory(), ...parsed };
      } catch {
        g.__moodOnboardingMemory = createInitialOnboardingMemory();
      }
      return g.__moodOnboardingMemory;
    },
    async save(state) {
      state.sessions = state.sessions.slice(-ONBOARDING_LIMIT);
      state.updatedAt = nowMs();
      g.__moodOnboardingMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodOnboardingMemory = undefined;
    },
  };
  return store;
}
