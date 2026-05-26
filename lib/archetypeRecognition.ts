/**
 * ARCHETYPE RECOGNITION (pure, observational)
 *
 * Identifies recurring human archetypes that appear in creative
 * fingerprints. For each archetype that ENGAGEMENT data supports,
 * the engine reports which downstream outcomes the archetype
 * historically produced.
 *
 * STRICT CONTRACT:
 *   - no I/O · no critic / pipeline imports
 *   - archetypes describe CONTENT FIGURES, not humans in segments
 *   - never used for tribal classification or identity manipulation
 */

import type { CulturalInput } from './culturalMemoryEngine';

// ─── archetype taxonomy ───────────────────────────────────────

interface ArchetypeDefinition {
  key: string;
  label: string;
  patterns: RegExp;
}

const ARCHETYPES: ArchetypeDefinition[] = [
  { key: 'caregiver',                    label: 'caregiver',                     patterns: /caregiv|care-giver|nurtur|protect-loved/i },
  { key: 'exhausted-parent',             label: 'exhausted parent',              patterns: /exhausted.*parent|tired.*parent|burnt.*parent|stretched-thin/i },
  { key: 'quiet-protector',              label: 'quiet protector',               patterns: /quiet.*protect|silent-guardian|reserved-protector/i },
  { key: 'dreamer',                      label: 'dreamer',                       patterns: /dream|imagin|future-seer|aspir-soft/i },
  { key: 'outsider',                     label: 'outsider',                      patterns: /outsider|outside-the-room|excluded|fringe|loner-by-choice/i },
  { key: 'survivor',                     label: 'survivor',                      patterns: /survivor|getting-through|recovered|carrying|endur/i },
  { key: 'builder',                      label: 'builder',                       patterns: /builder|maker|founder|crafts|construct/i },
  { key: 'observer',                     label: 'observer',                      patterns: /observ|watch|witness|notic/i },
  { key: 'mentor',                       label: 'mentor',                        patterns: /mentor|elder|guide|teacher|wise/i },
  { key: 'lonely-achiever',              label: 'lonely achiever',               patterns: /lonely.*high|alone.*winning|isolated-success|achieve.*alone/i },
  { key: 'overwhelmed-modern-human',     label: 'overwhelmed modern human',      patterns: /overwhelm|burned-out|too-much|maxed-out|drained-modern/i },
  { key: 'nostalgic-adult',              label: 'nostalgic adult',               patterns: /nostalg.*adult|grown-up.*looking-back|adult.*childhood/i },
  { key: 'restless-creator',             label: 'restless creator',              patterns: /restless|making-something|always-creating|driven-maker/i },
  { key: 'emotionally-tired-professional', label: 'emotionally tired professional', patterns: /tired.*profession|office.*worn|exhausted.*work|burnt-out.*career/i },
];

// ─── output ───────────────────────────────────────────────────

export interface ArchetypeReading {
  key: string;
  label: string;
  occurrences: number;
  averageEngagement: number;            // 0..10
  /** Counts of downstream outcome categories. */
  effects: {
    trust: number;
    fatigue: number;
    replayability: number;
    longTermResonance: number;
    emotionalRecovery: number;
  };
  /** Free-text summary of what this archetype historically caused. */
  description: string;
}

export interface ArchetypeRecognitionReport {
  totalOutcomes: number;
  recognized: ArchetypeReading[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — archetypes describe CONTENT FIGURES the system has produced. ' +
  'They are NEVER used to classify, segment, or target humans.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function engagementScore(m: { retention?: number; saves?: number; comments?: number; shares?: number; bounceRate?: number; scrollDepth?: number } | undefined): number {
  if (!m) return 0;
  const saves = Math.min(1, (m.saves ?? 0) / 10);
  const comments = Math.min(1, (m.comments ?? 0) / 20);
  const shares = Math.min(1, (m.shares ?? 0) / 10);
  return clamp10(((m.retention ?? 0) * 0.40 + (m.scrollDepth ?? 0) * 0.15 +
    saves * 0.15 + comments * 0.10 + shares * 0.10 + (1 - (m.bounceRate ?? 0)) * 0.10) * 10);
}

// ─── outcome → effect categorization ─────────────────────────

function effectsOf(records: NonNullable<NonNullable<CulturalInput['outcomes']>['outcomes']>): ArchetypeReading['effects'] {
  let trust = 0, fatigue = 0, replayability = 0, longTermResonance = 0, emotionalRecovery = 0;
  for (const r of records) {
    const o = r.downstreamOutcome ?? '';
    if (o === 'trust-formation' || o === 'identity-reinforcement') trust += 1;
    if (o === 'fatigue-acceleration' || o === 'visual-fatigue' || o === 'retention-decay') fatigue += 1;
    if (o === 'replay-behavior') replayability += 1;
    if (o === 'emotional-resonance' || o === 'curiosity-retention') longTermResonance += 1;
    if (o === 'emotional-stillness-success' || o === 'realism-success') emotionalRecovery += 1;
  }
  return { trust, fatigue, replayability, longTermResonance, emotionalRecovery };
}

// ─── main ─────────────────────────────────────────────────────

export function computeArchetypeRecognition(input: CulturalInput): ArchetypeRecognitionReport {
  const outcomes = input.outcomes?.outcomes ?? [];
  const recognized: ArchetypeReading[] = [];

  for (const arche of ARCHETYPES) {
    const matching = outcomes.filter((r) => {
      const hay = (r.emotionalSignature ?? '') + ' ' + (r.narrativeSignature ?? '') + ' ' + (r.visualStyle ?? '');
      return arche.patterns.test(hay);
    });
    if (matching.length === 0) continue;
    const engagement = r1(avg(matching.map((r) => engagementScore(r.metrics))));
    const effects = effectsOf(matching);
    const dominantEffect = (Object.entries(effects) as Array<[string, number]>)
      .sort((a, b) => b[1] - a[1])[0];
    const description =
      `archetype "${arche.label}" — ${matching.length} record(s), engagement ${engagement}/10. ` +
      `dominant effect: ${dominantEffect[0]} (${dominantEffect[1]}).`;
    recognized.push({
      key: arche.key,
      label: arche.label,
      occurrences: matching.length,
      averageEngagement: engagement,
      effects,
      description,
    });
  }
  recognized.sort((a, b) =>
    b.occurrences - a.occurrences ||
    b.averageEngagement - a.averageEngagement ||
    a.key.localeCompare(b.key),
  );

  return {
    totalOutcomes: outcomes.length,
    recognized,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `archetypes-recognized:${recognized.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
