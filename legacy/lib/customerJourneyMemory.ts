/**
 * CUSTOMER JOURNEY MEMORY (FIFO, operator-supervised)
 *
 * Phase 1 — Business Intelligence Layer.
 *
 * Persistent FIFO of CUSTOMER JOURNEY EVENTS. Every event is logged
 * by the OPERATOR — pulled from external analytics / CRM /
 * payments — and stored here for OBSERVATION only.
 *
 * STRICT CONTRACT:
 *   - the memory NEVER fetches from any platform
 *   - the memory NEVER calls a CRM, payment, or ad-platform API
 *   - the memory NEVER triggers any outbound action
 *   - every write requires operator credentials at the route layer
 *   - FIFO-capped
 *
 * Lives at data/memory/customer-journey-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'customer-journey-memory.json';

export const CUSTOMER_JOURNEY_LIMIT = 1024;

// ─── types ────────────────────────────────────────────────────

export type JourneyEventType =
  | 'impression'
  | 'view'
  | 'click'
  | 'landing-visit'
  | 'lead'
  | 'call'
  | 'purchase'
  | 'repeat-purchase';

export interface JourneyEvent {
  eventId: string;
  eventType: JourneyEventType;
  /** Anonymized journey identifier (operator-provided · NOT PII). */
  journeyId: string;
  /** The publication that the event is attributed to (if any). */
  publicationId?: string;
  /** The asset associated with the event (if any). */
  assetId?: string;
  /** The campaign plan id (if any). */
  campaignPlanId?: string;
  /** Optional revenue in USD — for purchase / repeat-purchase events. */
  revenueUSD?: number;
  /** Optional channel where the event was observed. */
  channel?: string;
  /** Optional audience descriptor. */
  audience?: string;
  /** Timestamp of the event. */
  occurredAt: number;
  /** Operator note. */
  operatorNote?: string;
  /** Operator who logged the event. */
  operatorId: string;
  /** Timestamp the operator logged the event (server side). */
  loggedAt: number;
}

// ─── state ────────────────────────────────────────────────────

export interface CustomerJourneyMemoryState {
  events: JourneyEvent[];
  totalEvents: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialCustomerJourneyMemory(): CustomerJourneyMemoryState {
  return { events: [], totalEvents: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── ID helper ───────────────────────────────────────────────

let __evtSeq = 0;
export function newJourneyEventId(): string {
  __evtSeq += 1;
  return `journey-evt-${Date.now().toString(36)}-${__evtSeq.toString(36)}`;
}

// ─── pure transform ──────────────────────────────────────────

export function appendJourneyEvent(
  state: CustomerJourneyMemoryState,
  event: JourneyEvent,
): CustomerJourneyMemoryState {
  const events = [...state.events, event].slice(-CUSTOMER_JOURNEY_LIMIT);
  return {
    ...state,
    events,
    totalEvents: state.totalEvents + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? event.occurredAt,
    updatedAt: event.occurredAt,
  };
}

// ─── store ───────────────────────────────────────────────────

const g = globalThis as unknown as { __moodCustomerJourney?: CustomerJourneyMemoryState };

export interface CustomerJourneyMemoryStore {
  read(): Promise<CustomerJourneyMemoryState>;
  append(event: JourneyEvent): Promise<CustomerJourneyMemoryState>;
  save(state: CustomerJourneyMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCustomerJourneyMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CustomerJourneyMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: CustomerJourneyMemoryStore = {
    async read() {
      if (g.__moodCustomerJourney) return g.__moodCustomerJourney;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<CustomerJourneyMemoryState>;
        g.__moodCustomerJourney = { ...createInitialCustomerJourneyMemory(), ...parsed };
      } catch {
        g.__moodCustomerJourney = createInitialCustomerJourneyMemory();
      }
      return g.__moodCustomerJourney;
    },
    async append(event) {
      const cur = await store.read();
      const next = appendJourneyEvent(cur, event);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.events = state.events.slice(-CUSTOMER_JOURNEY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodCustomerJourney = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCustomerJourney = undefined;
    },
  };
  return store;
}
