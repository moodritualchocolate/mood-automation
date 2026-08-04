/**
 * SELF-REFLECTION & HYPOCRISY DETECTION (Phase 52 — Wave 5)
 *
 * The council turns its scrutiny on ITSELF. It checks for hypocrisy —
 * the system advocating something it has refused before, the council
 * approving loudness while claiming to defend restraint, an entity
 * arguing against its own stated priority.
 *
 * A mind that cannot catch its own hypocrisy cannot be trusted to
 * govern.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';

export interface HypocrisyFinding {
  description: string;
  severity: number;          // 0..10
}

export interface SelfReflectionReading {
  findings: HypocrisyFinding[];
  /** 0..10 — total hypocrisy detected. */
  hypocrisy_score: number;
  /** True when the council caught itself in a contradiction. */
  hypocrisy_detected: boolean;
  /** A self-reflective note in the system's own voice. */
  self_reflection: string;
  notes: string[];
}

export interface SelfReflectionInput {
  briefing: CouncilBriefing;
  opinions: EntityOpinion[];
}

export function reflectOnHypocrisy(input: SelfReflectionInput): SelfReflectionReading {
  const { briefing, opinions } = input;
  const notes: string[] = [];
  const findings: HypocrisyFinding[] = [];

  const advocates = opinions.filter((o) => o.stance === 'advocate');
  const objectors = opinions.filter((o) => o.stance === 'object');

  // Hypocrisy 1 — the council advocates a loud banner while it holds
  // an entity sworn to defend true (non-loud) attention.
  if (briefing.attentionIsLoud && advocates.length > objectors.length) {
    findings.push({
      description: 'the council is leaning to advocate a LOUD banner while it claims to defend true attention',
      severity: 7,
    });
  }
  // Hypocrisy 2 — advocating an output the executive runtime already
  // ruled against.
  if (!briefing.executiveIsOutput && advocates.length >= 6) {
    findings.push({
      description: 'the council is advocating an output the executive runtime already decided against',
      severity: 6,
    });
  }
  // Hypocrisy 3 — advocating while optimisation corrupts truth, with
  // the Anti-Hype Defender outvoted.
  if (briefing.optimizationCorruptsTruth && advocates.length > objectors.length) {
    findings.push({
      description: 'the council is advocating while optimisation corrupts truth — it is doing what it exists to resist',
      severity: 8,
    });
  }
  // Hypocrisy 4 — an entity arguing AGAINST its own priority.
  for (const o of opinions) {
    if (o.entity === 'recovery-director' && o.stance === 'advocate' && briefing.recommendSilence) {
      findings.push({
        description: 'the Recovery Director is advocating output while silence is recommended — arguing against its own priority',
        severity: 6,
      });
    }
    if (o.entity === 'anti-hype-defender' && o.stance === 'advocate' && briefing.optimizationRisk >= 6) {
      findings.push({
        description: 'the Anti-Hype Defender is advocating while optimisation pressure is high — arguing against its own priority',
        severity: 6,
      });
    }
  }

  const hypocrisy_score = Math.min(10, findings.reduce((s, f) => s + f.severity, 0) / Math.max(1, findings.length) * (findings.length > 0 ? 1 : 0));
  const hypocrisy_detected = findings.length > 0;

  const self_reflection = hypocrisy_detected
    ? `I caught myself in a contradiction: ${findings[0].description}. I should not trust this consensus without re-examining it.`
    : 'I examined my own reasoning and found no hypocrisy — the council is arguing in good faith.';

  notes.push(`self-reflection: ${hypocrisy_detected ? `${findings.length} hypocrisy finding(s)` : 'no hypocrisy'} — ${self_reflection}`);

  return {
    findings,
    hypocrisy_score: Math.round(hypocrisy_score * 10) / 10,
    hypocrisy_detected,
    self_reflection,
    notes,
  };
}
