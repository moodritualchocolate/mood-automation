/**
 * PERSISTENT COGNITIVE RUNTIME (Phase 27)
 *
 * The living runtime layer. It wraps the Phase 26 cognitive field so
 * that the system stops behaving as "generate → judge → store" and
 * starts behaving as "remember → interpret → decide → act → learn →
 * become slightly different".
 *
 * This module is the orchestration layer:
 *   - loadRuntimeContext   — load everything the prior runs left
 *   - commitApprovedRun    — learn from an approval, leave a directive
 *   - commitRejectedRun    — learn from a refusal
 *
 * The master principle: "Did this run change the mind of the system?"
 * If not, the runtime is not alive.
 */

import { randomUUID } from 'crypto';
import type { RuntimeMemoryStore, RuntimeBook, RuntimeHistoryEntry, PriorStateSummary } from './runtimeMemoryStore';
import type { NextRunDirective } from './nextRunDirective';
import { describeDirective } from './nextRunDirective';
import type { RejectionRecord } from './rejectionMemory';
import type { ApprovalRecord } from './approvalMemory';
import type { RuntimeTrace } from './runtimeTrace';
import type { RuntimeHealth } from './runtimeHealthMonitor';
import type { CognitiveContinuityReading } from './cognitiveContinuityScore';
import type { CognitiveFieldState } from './cognitiveField';
import type { RuntimeIdentity } from './runtimeIdentity';
import { RUNTIME_IDENTITY } from './runtimeIdentity';

export interface RuntimeContext {
  campaignId: string;
  /** The index this run will be — i.e. how many runs came before. */
  generationIndex: number;
  priorState: PriorStateSummary | null;
  nextRunDirective: NextRunDirective;
  rejectionMemory: RejectionRecord[];
  approvalMemory: ApprovalRecord[];
  history: RuntimeHistoryEntry[];
  identity: RuntimeIdentity;
  approvedCount: number;
  rejectedCount: number;
  book: RuntimeBook;
}

/** Load everything the prior runs of this campaign left behind. */
export async function loadRuntimeContext(store: RuntimeMemoryStore): Promise<RuntimeContext> {
  const book = await store.read();
  return {
    campaignId: book.campaignId,
    generationIndex: book.generationIndex,
    priorState: book.lastState,
    nextRunDirective: book.nextRunDirective,
    rejectionMemory: book.rejectionMemory,
    approvalMemory: book.approvalMemory,
    history: book.history,
    identity: RUNTIME_IDENTITY,
    approvedCount: book.approvedCount,
    rejectedCount: book.rejectedCount,
    book,
  };
}

export interface PersistentRuntimeState {
  runtimeId: string;
  timestamp: number;
  campaignId: string;
  generationIndex: number;
  priorStateSummary: string;
  cognitiveFieldSummary: {
    worldStateConfidence: number;
    field_coherence: number;
    emergence_score: number;
    campaignAtmosphere: string;
  };
  decisionContext: string;
  approvedDirections: string[];
  rejectedDirections: string[];
  rejectionMemoryCount: number;
  worldStateDelta: string;
  humanGraphDelta: string;
  symbolicObjectDelta: string;
  truthPersistenceDelta: string;
  decayDelta: string;
  trajectoryDelta: string;
  campaignIdentityDelta: string;
  audienceSignalDelta: string;
  nextRunDirectiveSummary: string;
  runtimeHealth: number;
  persistenceConfidence: number;
  /** Did this run change the mind of the system? */
  changed_the_mind: boolean;
}

export interface CommitApprovedInput {
  context: RuntimeContext;
  field: CognitiveFieldState;
  continuity: CognitiveContinuityReading;
  health: RuntimeHealth;
  trace: RuntimeTrace;
  nextRunDirective: NextRunDirective;
  approvalRecord: ApprovalRecord;
  historyEntry: RuntimeHistoryEntry;
  /** Optional near-miss rejection learned from an internal attempt. */
  nearMissRejection: RejectionRecord | null;
  worldStateDelta: string;
  humanGraphDelta: string;
  symbolicObjectDelta: string;
  truthPersistenceDelta: string;
  decayDelta: string;
  trajectoryDelta: string;
  campaignIdentityDelta: string;
  audienceSignalDelta: string;
}

/**
 * Learn from an approval: append history, approval memory, the next-run
 * directive and the runtime trace, then persist the campaign's book.
 */
export async function commitApprovedRun(
  store: RuntimeMemoryStore,
  input: CommitApprovedInput,
): Promise<PersistentRuntimeState> {
  const {
    context, field, continuity, health, trace, nextRunDirective, approvalRecord,
    historyEntry, nearMissRejection,
  } = input;
  const book = context.book;

  book.generationIndex += 1;
  book.approvedCount += 1;
  book.history = [historyEntry, ...book.history];
  book.approvalMemory = [approvalRecord, ...book.approvalMemory];
  if (nearMissRejection) book.rejectionMemory = [nearMissRejection, ...book.rejectionMemory];
  book.traces = [trace, ...book.traces];
  book.nextRunDirective = nextRunDirective;
  book.lastState = {
    generationIndex: historyEntry.generationIndex,
    ts: historyEntry.ts,
    verdict: historyEntry.verdict,
    dominantTruth: historyEntry.dominantTruth,
    emotionalTerritory: historyEntry.emotionalTerritory,
    campaignAtmosphere: field.campaignAtmosphere,
    worldStateGen: historyEntry.worldStateGen,
    continuityScore: continuity.continuity_score,
    directorMemo: trace.director_memo,
  };

  await store.save(book);
  await store.bumpGlobal(true);

  return assembleState({
    context, field, continuity, health, nextRunDirective,
    approvedDirections: [approvalRecord.approvedConcept],
    rejectedDirections: nearMissRejection ? [nearMissRejection.rejectedConcept] : [],
    worldStateDelta: input.worldStateDelta,
    humanGraphDelta: input.humanGraphDelta,
    symbolicObjectDelta: input.symbolicObjectDelta,
    truthPersistenceDelta: input.truthPersistenceDelta,
    decayDelta: input.decayDelta,
    trajectoryDelta: input.trajectoryDelta,
    campaignIdentityDelta: input.campaignIdentityDelta,
    audienceSignalDelta: input.audienceSignalDelta,
  });
}

export interface CommitRejectedInput {
  context: RuntimeContext;
  rejectionRecord: RejectionRecord;
  historyEntry: RuntimeHistoryEntry;
  trace: RuntimeTrace;
}

/** Learn from a fully-refused run: append the rejection to memory. */
export async function commitRejectedRun(
  store: RuntimeMemoryStore,
  input: CommitRejectedInput,
): Promise<void> {
  const { context, rejectionRecord, historyEntry, trace } = input;
  const book = context.book;

  book.generationIndex += 1;
  book.rejectedCount += 1;
  book.history = [historyEntry, ...book.history];
  book.rejectionMemory = [rejectionRecord, ...book.rejectionMemory];
  book.traces = [trace, ...book.traces];
  book.lastState = {
    generationIndex: historyEntry.generationIndex,
    ts: historyEntry.ts,
    verdict: historyEntry.verdict,
    dominantTruth: historyEntry.dominantTruth,
    emotionalTerritory: historyEntry.emotionalTerritory,
    campaignAtmosphere: book.lastState?.campaignAtmosphere ?? 'campaign atmosphere unchanged',
    worldStateGen: historyEntry.worldStateGen,
    continuityScore: historyEntry.continuityScore,
    directorMemo: trace.director_memo,
  };

  await store.save(book);
  await store.bumpGlobal(false);
}

function assembleState(args: {
  context: RuntimeContext;
  field: CognitiveFieldState;
  continuity: CognitiveContinuityReading;
  health: RuntimeHealth;
  nextRunDirective: NextRunDirective;
  approvedDirections: string[];
  rejectedDirections: string[];
  worldStateDelta: string;
  humanGraphDelta: string;
  symbolicObjectDelta: string;
  truthPersistenceDelta: string;
  decayDelta: string;
  trajectoryDelta: string;
  campaignIdentityDelta: string;
  audienceSignalDelta: string;
}): PersistentRuntimeState {
  const { context, field, continuity, health, nextRunDirective } = args;

  // "Did this run change the mind of the system?" — the central
  // Phase 27 question. An approved run changes the mind when it
  // integrated with prior memory (it added an approval, advanced the
  // world-state, and left a fresh directive) rather than behaving
  // like a fresh prompt that ignored everything before it.
  const changed_the_mind =
    continuity.is_first_run || !continuity.behaved_like_fresh_prompt;

  const persistenceConfidence = Math.round(
    ((continuity.continuity_score + health.overall_health + field.worldStateConfidence) / 3) * 10,
  ) / 10;

  return {
    runtimeId: randomUUID(),
    timestamp: Date.now(),
    campaignId: context.campaignId,
    generationIndex: context.generationIndex,
    priorStateSummary: context.priorState
      ? `gen ${context.priorState.generationIndex}: ${context.priorState.dominantTruth} (${context.priorState.emotionalTerritory})`
      : 'no prior state — campaign opening',
    cognitiveFieldSummary: {
      worldStateConfidence: field.worldStateConfidence,
      field_coherence: field.field_coherence,
      emergence_score: field.emergence_score,
      campaignAtmosphere: field.campaignAtmosphere,
    },
    decisionContext: `directive in effect: ${describeDirective(context.nextRunDirective)}`,
    approvedDirections: args.approvedDirections,
    rejectedDirections: args.rejectedDirections,
    rejectionMemoryCount: context.rejectionMemory.length,
    worldStateDelta: args.worldStateDelta,
    humanGraphDelta: args.humanGraphDelta,
    symbolicObjectDelta: args.symbolicObjectDelta,
    truthPersistenceDelta: args.truthPersistenceDelta,
    decayDelta: args.decayDelta,
    trajectoryDelta: args.trajectoryDelta,
    campaignIdentityDelta: args.campaignIdentityDelta,
    audienceSignalDelta: args.audienceSignalDelta,
    nextRunDirectiveSummary: describeDirective(nextRunDirective),
    runtimeHealth: health.overall_health,
    persistenceConfidence,
    changed_the_mind,
  };
}
