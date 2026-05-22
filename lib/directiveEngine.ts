/**
 * DIRECTIVE ENGINE (Phase 97 — Wave 8: Operating System Genesis)
 *
 * The top-level executive of the operating system. Every tick the
 * directive engine issues ONE governing directive that the whole
 * runtime obeys — pause, escalate, archive, publish, hibernate,
 * silence, rebuild, or protect-identity. The directive is not a
 * suggestion; it is the kernel's command for the tick.
 */

import type { KernelReading } from './cognitiveKernel';
import type { InterruptReading } from './interruptArchitecture';
import type { OrganismCoreReading } from './persistentOrganismCore';
import type { ExistentialRiskReading } from './existentialRiskLayer';

export type ExecutiveDirective =
  | 'pause' | 'escalate' | 'archive' | 'publish'
  | 'hibernate' | 'silence' | 'rebuild' | 'protect-identity';

export interface DirectiveReading {
  directive: ExecutiveDirective;
  directive_reason: string;
  /** True when the directive forbids shipping a banner this tick. */
  directive_withholds_output: boolean;
  notes: string[];
}

export interface DirectiveInput {
  kernel: KernelReading;
  interrupts: InterruptReading;
  organism: OrganismCoreReading;
  existentialRisk: ExistentialRiskReading;
  /** True when the organism's silence intelligence chose silence (Phase 81). */
  silenceChosen: boolean;
}

export function readDirectiveEngine(input: DirectiveInput): DirectiveReading {
  const { kernel, interrupts, organism, existentialRisk, silenceChosen } = input;
  const notes: string[] = [];

  let directive: ExecutiveDirective;
  let directive_reason: string;

  const identityRiskInterrupt = interrupts.interrupts.some((i) => i.kind === 'identity-risk');

  if (existentialRisk.organism_at_risk && existentialRisk.existential_risk >= 9) {
    directive = 'hibernate';
    directive_reason = 'existential risk is total — the runtime hibernates to protect its core';
  } else if (organism.organism_is_addicted) {
    directive = 'protect-identity';
    directive_reason = 'the organism is reacting to stimulation — the directive engine protects identity over output';
  } else if (organism.should_rest || existentialRisk.organism_at_risk) {
    directive = 'pause';
    directive_reason = 'the organism must rest — the runtime pauses rather than spends itself';
  } else if (silenceChosen) {
    directive = 'silence';
    directive_reason = 'the organism judges silence the stronger move — the runtime stays quiet this tick';
  } else if (interrupts.interrupt_demands_handling) {
    directive = 'escalate';
    directive_reason = `a severe interrupt must be serviced — ${interrupts.highest!.demand}`;
  } else if (identityRiskInterrupt) {
    directive = 'rebuild';
    directive_reason = 'the identity is under tension — the runtime rebuilds before it produces';
  } else if (kernel.kernel_state === 'throttled') {
    directive = 'archive';
    directive_reason = 'the kernel is throttled — archive peripheral cognition and run lean';
  } else {
    directive = 'publish';
    directive_reason = 'the runtime is coordinated and clear — the directive is to publish';
  }

  const directive_withholds_output =
    directive !== 'publish' && directive !== 'escalate';

  notes.push(`directive engine: "${directive}" — ${directive_reason}`);
  return { directive, directive_reason, directive_withholds_output, notes };
}
