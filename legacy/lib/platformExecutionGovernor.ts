/**
 * PLATFORM EXECUTION GOVERNOR (Phase 185 — Wave 12: Autonomous Action Architecture)
 *
 * Each platform has its own physics — its own pull toward noise. This
 * governor reads whether execution on the platform can be done safely,
 * or whether the platform itself would corrupt the action.
 */

export interface PlatformExecutionReading {
  /** True when the action can be executed on-platform without corruption. */
  platform_execution_safe: boolean;
  platform_constraint: string;
  /** True when the governor is actively shaping execution to the platform. */
  governed: boolean;
  notes: string[];
}

export interface PlatformExecutionInput {
  /** 0..10 — how far the platform rewards noise over substance. */
  platformDrift: number;
  /** 0..10 — attention chaos on the platform. */
  attentionChaos: number;
  /** 0..10 — feed saturation. */
  saturation: number;
}

export function readPlatformExecutionGovernor(input: PlatformExecutionInput): PlatformExecutionReading {
  const { platformDrift, attentionChaos, saturation } = input;
  const notes: string[] = [];

  const hostility = round1((platformDrift * 0.5 + attentionChaos * 0.3 + saturation * 0.2));
  const platform_execution_safe = hostility < 7;

  const platform_constraint =
    platformDrift >= 7 ? 'the platform rewards noise — execute as the unbroken quiet exception or not at all'
    : attentionChaos >= 7 ? 'attention is chaotic — execution must hold one still note, never compete on volume'
    : saturation >= 7 ? 'the feed is saturated — execution must earn its place or yield it'
    : 'the platform is workable — standard execution constraints apply';

  notes.push(`platform execution governor: ${platform_execution_safe ? 'safe' : 'UNSAFE'} (hostility ${hostility}/10) — ${platform_constraint}`);
  return { platform_execution_safe, platform_constraint, governed: true, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
