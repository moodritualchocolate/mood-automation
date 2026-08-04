/**
 * SCENE CONTINUITY (Phase 9)
 *
 * Implicit narrative thread across the campaign. The system tracks:
 *
 *   - has this apartment appeared before?
 *   - has this lighting echoed a previous banner?
 *   - does this silence reference an earlier moment?
 *   - is this object now emotionally loaded?
 *   - is this person plausibly the same subject as before?
 *
 * Returns a SceneContinuityReport that the image brief reads as
 * INVISIBLE context. The viewer never sees the connection explicitly —
 * but the campaign FEELS continuous.
 *
 * This is the spec's "cinematic memory" — the campaign as a quiet
 * mid-film universe, not isolated stills.
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { WorldDNA } from './worldPersistence';
import type { ObjectMemoryGraph } from './objectMemoryGraph';

export interface SceneContinuityReport {
  same_apartment: { is_same: boolean; kind: string | null; previous_banners: number };
  lighting_echoes: Array<{ behavior: string; first_appeared_in_banner: number; current_banner: number }>;
  silence_reference: string | null;
  loaded_objects: Array<{ objectId: string; meaning: string; weight: number }>;
  /** Plausibility — is the subject the same human as before? */
  plausibly_same_subject: boolean;
  /** Plain-text "context the camera knows" — fed into the image brief. */
  invisible_context: string;
}

export interface SceneContinuityInput {
  trail: EmotionalTraceEntry[];
  worldDNA: WorldDNA;
  objectGraph: ObjectMemoryGraph;
  /** The candidate banner's apartment kind + light behaviour + state family. */
  candidate: {
    apartmentKind: string | null;
    lightBehavior: string | null;
    family: string;
    /** Object ids the candidate's brief will mention. */
    objectIds: string[];
    /** Whether typography is absent or whisper. */
    isQuiet: boolean;
  };
  /** Banner index in the campaign. */
  bannerIndex: number;
}

export function analyzeSceneContinuity(input: SceneContinuityInput): SceneContinuityReport {
  const { trail, worldDNA, objectGraph, candidate, bannerIndex } = input;

  // ─── apartment ────────────────────────────────────────────────
  let apartmentReport: SceneContinuityReport['same_apartment'] = { is_same: false, kind: null, previous_banners: 0 };
  if (candidate.apartmentKind) {
    const prior = worldDNA.recurringApartments.find((a) => a.kind === candidate.apartmentKind);
    if (prior) {
      apartmentReport = { is_same: true, kind: candidate.apartmentKind, previous_banners: prior.count };
    }
  }

  // ─── lighting echoes ──────────────────────────────────────────
  // Walk trail oldest → newest, find banners whose atmospheric light
  // matches the candidate's, and report the first one.
  // (Trail does not currently store the light behaviour per banner; we
  // approximate via the family-light mapping at scoreVisualTaste time.
  // For this report we trust worldDNA.lightingFamilies as the canonical.)
  const lightingEchoes: SceneContinuityReport['lighting_echoes'] = [];
  if (candidate.lightBehavior) {
    const family = worldDNA.lightingFamilies.find((l) => l.behavior === candidate.lightBehavior);
    if (family && family.count >= 1) {
      lightingEchoes.push({
        behavior: candidate.lightBehavior,
        first_appeared_in_banner: Math.max(1, bannerIndex - family.count),
        current_banner: bannerIndex,
      });
    }
  }

  // ─── silence reference ────────────────────────────────────────
  let silence_reference: string | null = null;
  if (candidate.isQuiet) {
    // Find the most recent quiet banner in the trail.
    const lastQuiet = trail.find(
      (t) => t.facts?.typographyDominance === 'absent' || t.facts?.typographyDominance === 'whisper',
    );
    if (lastQuiet) {
      silence_reference = `this silence echoes the quiet moment in banner about "${lastQuiet.stateId}"`;
    }
  }

  // ─── loaded objects ───────────────────────────────────────────
  const loaded_objects: SceneContinuityReport['loaded_objects'] = [];
  for (const objectId of candidate.objectIds) {
    const node = objectGraph.nodes.find((n) => n.objectId === objectId);
    if (node && node.emotionalWeight >= 4) {
      loaded_objects.push({ objectId, meaning: node.currentLoadedMeaning, weight: node.emotionalWeight });
    }
  }

  // ─── plausibly same subject? ─────────────────────────────────
  // We treat as "same subject" when the apartment recurs AND the
  // family is in the same broad cluster (fatigue/collapse/numbness/
  // paralysis vs. pressure/overstimulation/fragmentation/avoidance).
  let plausibly_same_subject = false;
  if (apartmentReport.is_same && trail.length > 0) {
    const recentFamilies = trail.slice(0, 4).map((t) => t.family);
    const tiredCluster = ['fatigue', 'collapse', 'numbness', 'paralysis'];
    const pressureCluster = ['pressure', 'overstimulation', 'fragmentation', 'avoidance'];
    if (tiredCluster.includes(candidate.family) && recentFamilies.some((f) => tiredCluster.includes(f))) {
      plausibly_same_subject = true;
    } else if (pressureCluster.includes(candidate.family) && recentFamilies.some((f) => pressureCluster.includes(f))) {
      plausibly_same_subject = true;
    }
  }

  // ─── invisible context paragraph ─────────────────────────────
  const parts: string[] = [];
  if (apartmentReport.is_same) {
    parts.push(`The room is the same kind of room as ${apartmentReport.previous_banners} earlier banner(s) — keep geography consistent`);
  }
  if (lightingEchoes.length > 0) {
    parts.push(`Light "${lightingEchoes[0].behavior}" has been here before — the campaign's light has a memory`);
  }
  if (silence_reference) parts.push(silence_reference);
  if (loaded_objects.length > 0) {
    parts.push(`Loaded objects: ${loaded_objects.map((o) => o.meaning).join('; ')}`);
  }
  if (plausibly_same_subject) {
    parts.push('This could be the same human as before — body language continuous');
  }
  const invisible_context = parts.length > 0 ? parts.join('. ') + '.' : 'Campaign is still forming continuity.';

  return {
    same_apartment: apartmentReport,
    lighting_echoes: lightingEchoes,
    silence_reference,
    loaded_objects,
    plausibly_same_subject,
    invisible_context,
  };
}
