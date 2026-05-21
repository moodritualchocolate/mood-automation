/**
 * SUBCONSCIOUS RECOGNITION (Phase 10)
 *
 * Goal: the viewer should recognize the campaign emotionally BEFORE
 * consciously realizing why.
 *
 * Phase 7 already produced a CampaignIdentity with a "recognisability"
 * score. Phase 10 sharpens that into the spec's named question:
 *
 *   "Would someone recognize this world without the logo?"
 *
 * Reads recurring:
 *   - emotional geometry        (compositional families repeating)
 *   - silence structure          (typography-absent rhythm)
 *   - lighting memory            (atmospheric light families)
 *   - object residue             (motifs at high emotional weight)
 *   - emotional pacing           (reaction-curve shapes recurring)
 *   - framing behavior           (camera distances recurring)
 *   - contradiction patterns     (recurring named contradictions)
 *
 * Outputs:
 *   - recognition_score 0..10    (single headline number)
 *   - patterns                   (named recurring patterns)
 *   - missing_signatures         (axes where the campaign has no DNA)
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { WorldDNA } from './worldPersistence';
import type { ObjectMemoryGraph } from './objectMemoryGraph';
import type { CampaignTimeline } from './campaignTimeline';

export interface RecognitionPattern {
  axis:
    | 'emotional-geometry'
    | 'silence-structure'
    | 'lighting-memory'
    | 'object-residue'
    | 'emotional-pacing'
    | 'framing-behavior'
    | 'contradiction-pattern';
  signature: string;
  strength: number;
}

export interface RecognitionReport {
  recognition_score: number;
  patterns: RecognitionPattern[];
  missing_signatures: string[];
  /** Would the campaign be recognised without the logo? */
  recognisable_without_logo: boolean;
  notes: string[];
}

export interface RecognitionInput {
  trail: EmotionalTraceEntry[];
  worldDNA: WorldDNA;
  objectGraph: ObjectMemoryGraph;
  timeline: CampaignTimeline;
}

export function analyzeSubconsciousRecognition(input: RecognitionInput): RecognitionReport {
  const { trail, worldDNA, objectGraph, timeline } = input;
  const notes: string[] = [];
  const patterns: RecognitionPattern[] = [];

  if (trail.length < 3) {
    return {
      recognition_score: 0,
      patterns: [],
      missing_signatures: ['emotional-geometry', 'silence-structure', 'lighting-memory', 'object-residue', 'emotional-pacing', 'framing-behavior', 'contradiction-pattern'],
      recognisable_without_logo: false,
      notes: ['campaign too short to form subconscious recognition'],
    };
  }

  const present = new Set<RecognitionPattern['axis']>();

  // emotional-geometry — recurring layout family
  if (worldDNA.recurringApartments[0] && worldDNA.recurringApartments[0].count >= 2) {
    patterns.push({
      axis: 'emotional-geometry',
      signature: `apartment kind "${worldDNA.recurringApartments[0].kind}" repeated`,
      strength: Math.min(10, worldDNA.recurringApartments[0].count * 2.5),
    });
    present.add('emotional-geometry');
  }

  // silence-structure — rate of absent/whisper dominance
  const dominances = trail.map((t) => t.facts?.typographyDominance).filter(Boolean) as string[];
  const silent = dominances.filter((d) => d === 'absent' || d === 'whisper').length;
  if (silent >= Math.ceil(trail.length * 0.4)) {
    patterns.push({
      axis: 'silence-structure',
      signature: `${silent}/${trail.length} banners speak in whisper or silence`,
      strength: Math.min(10, (silent / trail.length) * 11),
    });
    present.add('silence-structure');
  }

  // lighting-memory — top light family count ≥ 2
  const topLight = worldDNA.lightingFamilies[0];
  if (topLight && topLight.count >= 2) {
    patterns.push({
      axis: 'lighting-memory',
      signature: `${topLight.behavior} carries the campaign light`,
      strength: Math.min(10, topLight.count * 2.5),
    });
    present.add('lighting-memory');
  }

  // object-residue — at least one object motif with weight ≥ 5
  const loudestObject = objectGraph.loudest;
  if (loudestObject && loudestObject.emotionalWeight >= 5) {
    patterns.push({
      axis: 'object-residue',
      signature: loudestObject.currentLoadedMeaning,
      strength: loudestObject.emotionalWeight,
    });
    present.add('object-residue');
  }

  // emotional-pacing — same closing reaction across multiple banners
  const closings = new Map<string, number>();
  for (const t of trail.slice(0, 8)) closings.set(t.reaction.at_3s, (closings.get(t.reaction.at_3s) ?? 0) + 1);
  const topClosing = Array.from(closings.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topClosing && topClosing[1] >= 2) {
    patterns.push({
      axis: 'emotional-pacing',
      signature: `closing reaction "${topClosing[0]}" recurs (${topClosing[1]}×)`,
      strength: Math.min(10, topClosing[1] * 2),
    });
    present.add('emotional-pacing');
  }

  // framing-behavior — would require persisted framing per banner; for
  // now we infer from facts.documentary_weight averages.
  const avgDoc = trail.length > 0
    ? trail.map((t) => t.facts?.documentary_weight ?? 0.6).reduce((a, b) => a + b, 0) / trail.length
    : 0;
  if (avgDoc >= 0.7) {
    patterns.push({
      axis: 'framing-behavior',
      signature: `documentary-leaning framing across the campaign (avg ${avgDoc.toFixed(2)})`,
      strength: Math.min(10, avgDoc * 12),
    });
    present.add('framing-behavior');
  }

  // contradiction-pattern — count of tensions that recur or echo
  const tensions = trail.map((t) => t.tension).filter(Boolean) as string[];
  const recurringTensions = tensions.filter((t, i) =>
    tensions.findIndex((other) => similarTensions(other, t)) < i,
  ).length;
  if (recurringTensions >= 1 || timeline.notes_already_played.length >= 2) {
    patterns.push({
      axis: 'contradiction-pattern',
      signature: `${timeline.notes_already_played.length} distinct emotional notes covered`,
      strength: Math.min(10, timeline.notes_already_played.length * 2.5),
    });
    present.add('contradiction-pattern');
  }

  // ─── score ────────────────────────────────────────────────────
  const presentCount = present.size;
  const avgStrength = patterns.length > 0
    ? patterns.reduce((a, b) => a + b.strength, 0) / patterns.length
    : 0;
  const recognition_score = Math.min(10, (presentCount / 7) * 6 + (avgStrength / 10) * 4);

  const allAxes: RecognitionPattern['axis'][] = ['emotional-geometry', 'silence-structure', 'lighting-memory', 'object-residue', 'emotional-pacing', 'framing-behavior', 'contradiction-pattern'];
  const missing_signatures = allAxes.filter((a) => !present.has(a));

  const recognisable_without_logo = recognition_score >= 6 && presentCount >= 4;

  if (recognisable_without_logo) {
    notes.push('campaign has formed enough signatures to be recognised without a logo');
  } else if (presentCount >= 2) {
    notes.push(`campaign forming recognition — ${presentCount}/7 axes present`);
  } else {
    notes.push('campaign needs more recurring patterns to be recognisable');
  }

  return { recognition_score, patterns, missing_signatures, recognisable_without_logo, notes };
}

function similarTensions(a: string, b: string): boolean {
  if (!a || !b) return false;
  const tokensA = new Set(a.toLowerCase().split(/\s+/));
  const tokensB = new Set(b.toLowerCase().split(/\s+/));
  let intersect = 0;
  for (const t of tokensA) if (tokensB.has(t)) intersect += 1;
  return intersect / Math.max(tokensA.size, tokensB.size, 1) >= 0.4;
}
