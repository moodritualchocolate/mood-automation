/**
 * IDENTITY GOVERNANCE (Phase 39 — Wave 4: Executive Cognition)
 *
 * The executive layer that DEFENDS MOOD from mutation. Where Phase 34
 * persisted identity through execution, Phase 39 GOVERNS it: it holds
 * the constitution, prosecutes violations, guards the voice, and
 * pulls every drifting banner back to the psychological anchor.
 *
 * The hard governance gate: "Would a real exhausted human trust this,
 * or only admire its aesthetics?"
 */

import type { HumanTruth } from '@/core/types';
import { checkConstitution } from './brandTruthConstitution';
import { mapAestheticCorruption } from './aestheticCorruptionMap';
import { detectIdentityViolations } from './identityViolationDetector';
import { readVoiceIntegrity } from './voiceIntegrityEngine';
import { readPsychologicalBrandAnchor } from './psychologicalBrandAnchor';

export interface IdentityGovernanceReading {
  constitutionAlignment: number;
  corruptionLoad: number;
  violationSeverity: number;
  voiceIntegrity: number;
  anchorProximity: number;
  violations: string[];
  /** True when a real exhausted human would TRUST this banner. */
  exhausted_human_would_trust: boolean;
  /** True when the banner only invites admiration of its aesthetics. */
  only_aesthetic_admiration: boolean;
  /** True when governance must block the banner. */
  governance_blocks: boolean;
  governanceCorrection: string | null;
  notes: string[];
}

export interface IdentityGovernanceInput {
  truth: HumanTruth;
  realism: number;
  restraint: number;
  nonPerformative: number;
  hasTension: boolean;
  imperfection: number;
  productAsFix: boolean;
  emergence: number;
  recognition: number;
  improvementPressure: number;
  copyText?: string;
}

export function readIdentityGovernance(input: IdentityGovernanceInput): IdentityGovernanceReading {
  const {
    truth, realism, restraint, nonPerformative, hasTension, imperfection,
    productAsFix, emergence, recognition, improvementPressure, copyText,
  } = input;
  const notes: string[] = [];

  const constitution = checkConstitution({ realism, restraint, nonPerformative, hasTension, imperfection, productAsFix });
  const corruption = mapAestheticCorruption({ truth, copyText });
  const violation = detectIdentityViolations({ constitution, corruption });
  const voice = readVoiceIntegrity({ truth, restraint, nonPerformative, emergence, copyText });
  const anchor = readPsychologicalBrandAnchor({ recognition, improvementPressure, nonPerformative });

  // "Would a real exhausted human trust this, or only admire its
  // aesthetics?" — trust comes from constitution + voice + anchor;
  // admiration-only comes from aesthetic polish without those.
  const exhausted_human_would_trust =
    constitution.constitutionally_sound &&
    voice.voice_is_intact &&
    anchor.is_anchored &&
    !corruption.brand_mutating;

  const only_aesthetic_admiration =
    !exhausted_human_would_trust && (realism >= 6 || emergence >= 6) && !anchor.is_anchored;

  const governance_blocks = violation.identity_violated || corruption.brand_mutating || only_aesthetic_admiration;

  const governanceCorrection =
    anchor.anchor_correction ??
    (corruption.detected[0] ? `pull back from ${corruption.detected[0].mutates_into}` : null) ??
    (voice.eroded_qualities[0] ? `restore the voice: ${voice.eroded_qualities[0]}` : null);

  notes.push(`identity governance: ${exhausted_human_would_trust ? 'a real exhausted human would TRUST this' : 'this only invites aesthetic admiration'}`);
  notes.push(...constitution.notes, ...corruption.notes, ...violation.notes, ...voice.notes, ...anchor.notes);

  return {
    constitutionAlignment: constitution.constitution_alignment,
    corruptionLoad: corruption.corruption_load,
    violationSeverity: violation.violation_severity,
    voiceIntegrity: voice.voice_integrity,
    anchorProximity: anchor.anchor_proximity,
    violations: violation.violations,
    exhausted_human_would_trust,
    only_aesthetic_admiration,
    governance_blocks,
    governanceCorrection,
    notes,
  };
}
