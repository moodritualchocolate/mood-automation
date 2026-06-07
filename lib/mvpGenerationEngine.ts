/**
 * MVP GENERATION ENGINE
 *
 * Pure orchestrator. Reads a BrandInputRecord, calls the LLM
 * provider, ranks hooks by deterministic commercial score, persists
 * the GenerationRecord, and returns the generationId. Failures are
 * recorded on the GenerationRecord with status='failed' — never
 * thrown to the caller.
 *
 * STRICT CONTRACT:
 *   - no I/O outside the memory stores + the LLM provider call
 *   - never publishes
 *   - never auto-saves selection · only the GenerationRecord
 *   - operator-supervised at the route layer (this engine is
 *     called after requireSession has passed)
 */

import {
  createMvpBrandInputMemoryStore,
} from './mvpBrandInputMemory';
import {
  createMvpGenerationMemoryStore, newGenerationId,
  type GenerationRecord,
} from './mvpGenerationMemory';
import { mvpGenerate } from './mvpLlmProvider';

export interface RunMvpGenerationInput {
  brandInputId: string;
  operatorId: string;
  organizationId: string;
  workspaceId: string;
}

export interface RunMvpGenerationResult {
  generationId: string;
  status: 'generating' | 'ready' | 'failed';
  error?: string;
}

/**
 * Runs end-to-end. Caller is responsible for kicking this off and
 * polling `/api/mvp/generate?generationId=…` if they want a non-
 * blocking experience.
 *
 * For V1 we execute synchronously because the stub provider is
 * deterministic and instantaneous. When OpenAI/Anthropic adapters
 * come online, this function will be split into an `enqueue` and
 * a worker — but the caller signature stays the same.
 */
export async function runMvpGeneration(
  input: RunMvpGenerationInput,
): Promise<RunMvpGenerationResult> {
  const brandStore = createMvpBrandInputMemoryStore();
  const genStore = createMvpGenerationMemoryStore();

  // 1 · fetch brand input
  const brandInput = await brandStore.findById(input.brandInputId);
  if (!brandInput) {
    return {
      generationId: '',
      status: 'failed',
      error: `brand input not found: ${input.brandInputId}`,
    };
  }

  // 2 · create a generating record up front so the UI can poll
  const generationId = newGenerationId();
  const at = Date.now();
  const draft: GenerationRecord = {
    generationId,
    brandInputId: brandInput.brandInputId,
    operatorId: input.operatorId,
    organizationId: input.organizationId,
    workspaceId: input.workspaceId,
    oneLinerCandidates: [],
    hooks: [],
    ugcScripts: [],
    imageConcepts: [],
    status: 'generating',
    providerId: 'stub',
    createdAt: at,
  };
  await genStore.append(draft);

  // 3 · call the LLM provider
  try {
    const output = await mvpGenerate({
      artifact: brandInput.artifact,
      audience: brandInput.audience,
      emotional: brandInput.emotional,
      locale: brandInput.locale,
    });

    // 4 · sort hooks by commercialScore desc · keep top 10
    const rankedHooks = [...output.hooks]
      .sort((a, b) => b.commercialScore - a.commercialScore)
      .slice(0, 10);

    // 5 · enforce the V1 shape: 2 / 10 / 5 / 10
    const oneLiners = output.oneLinerCandidates.slice(0, 2);
    const ugcScripts = output.ugcScripts.slice(0, 5);
    const imageConcepts = output.imageConcepts.slice(0, 10);

    await genStore.update(generationId, {
      oneLinerCandidates: oneLiners,
      hooks: rankedHooks,
      ugcScripts,
      imageConcepts,
      providerId: output.providerId,
      status: 'ready',
      completedAt: Date.now(),
    });

    return { generationId, status: 'ready' };
  } catch (e) {
    const error = (e as Error).message;
    await genStore.update(generationId, {
      status: 'failed',
      error,
      completedAt: Date.now(),
    });
    return { generationId, status: 'failed', error };
  }
}
