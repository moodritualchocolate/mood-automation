/**
 * RITUAL BEHAVIOR ENGINE (pure, observational)
 *
 * Detects rituals depicted in creative fingerprints. The system
 * recognizes that rituals create emotional attachment stronger than
 * persuasion — and surfaces which ritual themes have appeared and
 * how they engaged audiences.
 *
 * STRICT CONTRACT:
 *   - no I/O · no critic / pipeline imports
 *   - never exploited for habit-loop optimization
 */

import type { CulturalInput } from './culturalMemoryEngine';

const RITUALS: Array<{ key: string; label: string; patterns: RegExp }> = [
  { key: 'night-routines',     label: 'night routines',     patterns: /night-routine|bedtime|evening-ritual|night-wind/i },
  { key: 'morning-stillness',  label: 'morning stillness',  patterns: /morning|sunrise|early-still|waking/i },
  { key: 'coffee-rituals',     label: 'coffee rituals',     patterns: /coffee|espresso|brewing|first-cup/i },
  { key: 'bedtime-decompression', label: 'bedtime decompression', patterns: /bedtime|unwind|sleep|night-decompress/i },
  { key: 'commute-exhaustion', label: 'commute exhaustion', patterns: /commute|traffic|train|drive-home|drive-to-work/i },
  { key: 'family-moments',     label: 'family moments',     patterns: /family|kids|parents|kitchen|dinner|home-moment/i },
  { key: 'study-rituals',      label: 'study rituals',      patterns: /study|reading|focus-ritual|deep-work/i },
  { key: 'gym-identity',       label: 'gym identity',       patterns: /gym|workout|training|reps/i },
  { key: 'loneliness-rituals', label: 'loneliness rituals', patterns: /alone|solitude|quiet-hour|empty-house/i },
  { key: 'digital-exhaustion', label: 'digital exhaustion', patterns: /screen|scroll|notification|digital-burn/i },
  { key: 'work-recovery',      label: 'work recovery cycles', patterns: /work-recovery|after-work|decompress.*work|burnt-out-recovery/i },
];

export interface RitualReading {
  key: string;
  label: string;
  occurrences: number;
  averageEngagement: number;
  averageSaves: number;
  averageRetention: number;
  emotionalAttachmentScore: number;     // 0..10
  description: string;
}

export interface RitualBehaviorReport {
  totalOutcomes: number;
  detected: RitualReading[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — ritual behaviors describe content patterns that ' +
  'historically engaged audiences. The engine never optimizes habit loops.';

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

export function computeRitualBehaviors(input: CulturalInput): RitualBehaviorReport {
  const outcomes = input.outcomes?.outcomes ?? [];
  const detected: RitualReading[] = [];

  for (const r of RITUALS) {
    const matching = outcomes.filter((o) => {
      const hay = (o.emotionalSignature ?? '') + ' ' + (o.narrativeSignature ?? '') + ' ' + (o.visualStyle ?? '');
      return r.patterns.test(hay);
    });
    if (matching.length === 0) continue;
    const engagement = r1(avg(matching.map((o) => engagementScore(o.metrics))));
    const meanSaves = r1(avg(matching.map((o) => o.metrics?.saves ?? 0)));
    const meanRetention = r1(avg(matching.map((o) => o.metrics?.retention ?? 0)));
    // Emotional attachment composite: saves + retention + repeat behavior.
    const meanRewatches = avg(matching.map((o) => o.metrics?.rewatches ?? 0));
    const attachment = r1(clamp10(
      Math.min(1, meanSaves / 5) * 4 +
      meanRetention * 4 +
      Math.min(1, meanRewatches) * 2,
    ));
    detected.push({
      key: r.key,
      label: r.label,
      occurrences: matching.length,
      averageEngagement: engagement,
      averageSaves: meanSaves,
      averageRetention: meanRetention,
      emotionalAttachmentScore: attachment,
      description:
        `ritual "${r.label}" — ${matching.length} record(s), engagement ${engagement}/10, ` +
        `emotional attachment ${attachment}/10.`,
    });
  }
  detected.sort((a, b) =>
    b.emotionalAttachmentScore - a.emotionalAttachmentScore ||
    b.occurrences - a.occurrences ||
    a.key.localeCompare(b.key),
  );

  return {
    totalOutcomes: outcomes.length,
    detected,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `rituals-detected:${detected.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
