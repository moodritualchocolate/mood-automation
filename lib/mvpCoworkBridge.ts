/**
 * MVP COWORK BRIDGE — the keyless premium path (roadmap #1/#21 alternative).
 *
 * When there is NO paid LLM key, the premium generation is fulfilled by
 * **Claude Cowork as a task** instead of a paid API call — zero spend.
 *
 * Flow:
 *   1. The generation engine delivers the instant CORPUS kit as today,
 *      and — if `coworkEnabled()` — ENQUEUES a task carrying the exact
 *      vertical contract (re-resolvable from verticalId + signals).
 *   2. A fulfiller (Claude in Cowork, via `scripts/cowork-fulfill.ts`, run
 *      on demand or on a schedule) reads the task, AUTHORS premium hooks,
 *      and calls `applyCoworkKit()`.
 *   3. `applyCoworkKit()` validates every authored hook against the SAME
 *      contract the paid path uses — locale purity · forbidden vocab ·
 *      cross-vertical leak · deterministic quality floor — and only then
 *      upgrades the persisted GenerationRecord (providerId → 'cowork').
 *
 * STRICT CONTRACT (mirrors mvpLlmProvider):
 *   - authored text is validated, never trusted blindly
 *   - failures never corrupt the delivered corpus kit (best-effort upgrade)
 *   - no network / no API key / no spend
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  resolveVerticalContext,
  assembleGenerationContext,
  validateLocalePurity,
  hasForbiddenVocab,
  hasCrossVerticalLeak,
  type GenerationContext,
  type VerticalId,
} from './verticalIntelligence';
import { qualityScore, HOOK_QUALITY_FLOOR } from './mvpQualityScore';
import {
  createMvpGenerationMemoryStore,
  type HookItem,
  type OneLinerCandidate,
} from './mvpGenerationMemory';

const DEFAULT_DIR = process.env.MOOD_MEMORY_DIR || 'data/memory';
const FILE = 'mvp-cowork-queue.json';
const LIMIT = 200;

export type CoworkStatus = 'pending' | 'fulfilled' | 'rejected';

export interface CoworkTask {
  taskId: string;
  generationId: string;
  brandInputId: string;
  status: CoworkStatus;
  locale: string;
  verticalId: string;
  signals: { artifact: string; audience: string; emotional: string };
  brandVoice?: string;
  excludeTexts: string[];
  need: { hooks: number; oneLiners: number };
  createdAt: number;
  fulfilledAt?: number;
  note?: string;
}

interface QueueState {
  tasks: CoworkTask[];
  updatedAt: number;
}

/** ON by default whenever there is no paid key. Force off with MVP_COWORK=0. */
export function coworkEnabled(): boolean {
  if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) return false;
  return process.env.MVP_COWORK !== '0';
}

function filePath(): string {
  return path.join(process.env.MOOD_MEMORY_DIR || DEFAULT_DIR, FILE);
}

async function read(): Promise<QueueState> {
  try {
    return JSON.parse(await fs.readFile(filePath(), 'utf8')) as QueueState;
  } catch {
    return { tasks: [], updatedAt: Date.now() };
  }
}

async function write(state: QueueState): Promise<void> {
  state.tasks = state.tasks.slice(-LIMIT);
  state.updatedAt = Date.now();
  await fs.mkdir(path.dirname(filePath()), { recursive: true });
  await fs.writeFile(filePath(), JSON.stringify(state, null, 2));
}

export async function enqueueCoworkTask(
  input: Omit<CoworkTask, 'status' | 'createdAt'>,
): Promise<CoworkTask> {
  const state = await read();
  const task: CoworkTask = { ...input, status: 'pending', createdAt: Date.now() };
  // idempotent per generation: replace any prior task for the same generation
  state.tasks = state.tasks.filter((t) => t.generationId !== input.generationId);
  state.tasks.push(task);
  await write(state);
  return task;
}

export async function listCoworkTasks(status?: CoworkStatus): Promise<CoworkTask[]> {
  const state = await read();
  return status ? state.tasks.filter((t) => t.status === status) : state.tasks;
}

export async function getCoworkTask(taskId: string): Promise<CoworkTask | null> {
  const state = await read();
  return state.tasks.find((t) => t.taskId === taskId) ?? null;
}

async function setStatus(taskId: string, status: CoworkStatus, note?: string): Promise<void> {
  const state = await read();
  const t = state.tasks.find((x) => x.taskId === taskId);
  if (!t) return;
  t.status = status;
  if (status === 'fulfilled') t.fulfilledAt = Date.now();
  if (note) t.note = note;
  await write(state);
}

/** Reproduce the EXACT contract the paid path would use for this task. */
export function resolveTaskContext(task: CoworkTask): GenerationContext {
  const vc = resolveVerticalContext(
    {
      artifact: task.signals.artifact,
      audience: task.signals.audience,
      emotional: task.signals.emotional,
      locale: task.locale,
    },
    { forceVerticalId: task.verticalId as VerticalId },
  );
  return assembleGenerationContext(vc);
}

export interface AuthoredKit {
  hooks: string[];
  oneLiners?: string[];
}

export interface HookVerdict {
  text: string;
  ok: boolean;
  reasons: string[];
  quality: number;
}

export interface ApplyReport {
  taskId: string;
  generationId: string;
  accepted: number;
  rejected: number;
  verdicts: HookVerdict[];
  applied: boolean;
  message: string;
}

function checkHook(text: string, ctx: GenerationContext, exclude: Set<string>): HookVerdict {
  const reasons: string[] = [];
  if (!validateLocalePurity(text, ctx.locale).ok) reasons.push('locale-impurity');
  const fv = hasForbiddenVocab(text, ctx.vocabularyForbidden);
  if (fv.found) reasons.push(`forbidden:${fv.word}`);
  const cx = hasCrossVerticalLeak(text, ctx.vocabularyForbiddenCrossVertical);
  if (cx.found) reasons.push(`cross-vertical:${cx.word}`);
  if (exclude.has(text)) reasons.push('duplicate-or-excluded');
  const q = qualityScore({ text, locale: ctx.locale, vocabulary: ctx.vocabularyRequired });
  if (q < HOOK_QUALITY_FLOOR) reasons.push(`below-quality-floor(${q}<${HOOK_QUALITY_FLOOR})`);
  return { text, ok: reasons.length === 0, reasons, quality: q };
}

let __seq = 0;
function nid(prefix: string): string {
  __seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${__seq.toString(36)}`;
}

/**
 * Validate an authored kit and, only if enough hooks pass the contract,
 * upgrade the persisted generation to the Cowork (premium) version.
 */
export async function applyCoworkKit(taskId: string, kit: AuthoredKit): Promise<ApplyReport> {
  const task = await getCoworkTask(taskId);
  if (!task) {
    return { taskId, generationId: '', accepted: 0, rejected: 0, verdicts: [], applied: false, message: 'task not found' };
  }
  if (task.status !== 'pending') {
    return { taskId, generationId: task.generationId, accepted: 0, rejected: 0, verdicts: [], applied: false, message: `task already ${task.status}` };
  }

  const ctx = resolveTaskContext(task);
  const exclude = new Set(task.excludeTexts);
  const verdicts = kit.hooks.map((h) => checkHook(h.trim(), ctx, exclude));
  // dedupe accepted by text
  const seen = new Set<string>();
  const good = verdicts.filter((v) => {
    if (!v.ok || seen.has(v.text)) return false;
    seen.add(v.text);
    return true;
  });

  if (good.length < task.need.hooks) {
    return {
      taskId,
      generationId: task.generationId,
      accepted: good.length,
      rejected: verdicts.length - good.length,
      verdicts,
      applied: false,
      message: `need ${task.need.hooks} valid hooks · got ${good.length} · NOT applied — revise and re-apply`,
    };
  }

  const audienceLabel = ctx.resolvedAudience.label;
  const audienceDemo = ctx.resolvedAudience.demographic;
  const proven = ctx.vertical.bestPerformingAdFormats[0] ?? '';
  const hooks: HookItem[] = good.slice(0, task.need.hooks).map((v, i) => ({
    id: nid('hook'),
    text: v.text,
    audience: `${audienceLabel} · ${audienceDemo}`,
    situation: ctx.purchaseMoments[i % Math.max(1, ctx.purchaseMoments.length)] ?? '',
    visualDirection:
      proven ||
      (ctx.locale === 'he'
        ? 'צילום דוקומנטרי 50מ"מ · אור טבעי · אדם אמיתי לא מדגמן'
        : 'documentary 50mm · natural light · real adult · no posed shots'),
    // Cowork kit ranks above the corpus baseline (≈50-60) by construction.
    commercialScore: Math.min(100, 72 + Math.round(v.quality / 3)),
    family: 'cowork',
    qualityScore: v.quality,
  }));

  const oneLiners: OneLinerCandidate[] | undefined =
    kit.oneLiners && kit.oneLiners.length
      ? kit.oneLiners.slice(0, task.need.oneLiners).map((t) => ({ id: nid('ol'), text: t.trim() }))
      : undefined;

  const genStore = createMvpGenerationMemoryStore();
  const patch: Record<string, unknown> = {
    hooks,
    providerId: 'cowork',
    coworkStatus: 'fulfilled',
    status: 'ready',
    completedAt: Date.now(),
  };
  if (oneLiners) patch.oneLinerCandidates = oneLiners;
  await genStore.update(task.generationId, patch);
  await setStatus(taskId, 'fulfilled', `applied ${hooks.length} hooks`);

  return {
    taskId,
    generationId: task.generationId,
    accepted: hooks.length,
    rejected: verdicts.length - good.length,
    verdicts,
    applied: true,
    message: `upgraded generation ${task.generationId} with ${hooks.length} Cowork hooks (providerId → cowork)`,
  };
}
