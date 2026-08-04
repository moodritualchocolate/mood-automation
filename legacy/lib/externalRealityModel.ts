/**
 * EXTERNAL REALITY MODEL (Phase 148 — Wave 10: Reality Coupling Architecture)
 *
 * The organism's working model of the world outside itself. This
 * module reports how faithful that model is — whether the organism is
 * reading reality with enough signal and enough honesty that its
 * model can be trusted, or whether the model has drifted from the
 * world it claims to describe.
 */

export interface ExternalRealityModelReading {
  /** 0..10 — how faithfully the model tracks the real external world. */
  model_fidelity: number;
  world_model_summary: string;
  /** True when the model has drifted from the reality it describes. */
  model_diverges_from_reality: boolean;
  notes: string[];
}

export interface ExternalRealityModelInput {
  worldIsSpeaking: boolean;
  externalSignalVolume: number;
  /** True when a contradiction was found between self-model and reality (Phase 144). */
  contradictionDetected: boolean;
  /** 0..10 — the fused world-feedback signal (Phase 145). */
  worldFeedbackSignal: number;
}

export function readExternalRealityModel(input: ExternalRealityModelInput): ExternalRealityModelReading {
  const { worldIsSpeaking, externalSignalVolume, contradictionDetected, worldFeedbackSignal } = input;
  const notes: string[] = [];

  let model_fidelity = 0;
  model_fidelity += externalSignalVolume * 0.45;
  model_fidelity += worldFeedbackSignal * 0.4;
  if (!worldIsSpeaking) model_fidelity -= 2;
  if (contradictionDetected) model_fidelity -= 3;
  model_fidelity = round1(Math.max(0, Math.min(10, model_fidelity)));

  const model_diverges_from_reality = contradictionDetected || model_fidelity < 4;

  const world_model_summary = model_diverges_from_reality
    ? 'the external model has drifted — the organism cannot fully trust what it believes about the world'
    : worldIsSpeaking
      ? `the external model is faithful (${model_fidelity}/10) — built on real, legible signal`
      : 'the external model is thin — the world is quiet, the model is provisional';

  notes.push(`external reality model: fidelity ${model_fidelity}/10 — ${world_model_summary}`);
  return { model_fidelity, world_model_summary, model_diverges_from_reality, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
