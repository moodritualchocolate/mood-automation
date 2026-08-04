/**
 * ACTION SANDBOX VIEW (Wave 27 — Phase 8A)
 *
 * Surfaces os.pendingExternalActions[] to the dashboard. Hidden when
 * the array is empty. Every field is read directly from persisted
 * state — no derivation, no fabricated risk scoring, no invented
 * counts. The view's purpose is to make the SANDBOX visible: a
 * record exists, nothing has been executed, the entry is what it is.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type { PendingExternalAction } from './operatingSystemCore';

export interface ActionSandboxViewModel {
  present: boolean;
  count: number;
  /** The most recent N pending actions in reverse-chronological order. */
  recent: PendingExternalAction[];
  statement: string;
}

const SHOW_LIMIT = 6;

export function buildActionSandboxView(snap: RuntimeSnapshot): ActionSandboxViewModel {
  const list = snap.os?.pendingExternalActions ?? [];
  if (list.length === 0) {
    return {
      present: false, count: 0, recent: [],
      statement: 'no proposed external actions — the sandbox is empty',
    };
  }
  const recent = [...list].reverse().slice(0, SHOW_LIMIT);
  return {
    present: true,
    count: list.length,
    recent,
    statement:
      `${list.length} pending external action candidate${list.length === 1 ? '' : 's'} — ` +
      `sandboxed, no execution`,
  };
}
