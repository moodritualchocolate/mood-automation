/**
 * ABSENCE INTELLIGENCE (Phase 9)
 *
 * Strategic omission. Sometimes the strongest move is:
 *
 *   no copy        no product        no face
 *   no CTA         no explanation    no visible emotion
 *
 * The engine detects when the CURRENT banner should embrace absence
 * because the campaign rhythm + cultural moment + emotional core all
 * point to "say nothing — let the room speak."
 *
 * Returns a per-element absence decision the layout director honours.
 */

import type { EmotionalCore } from './humanTruthEngine';
import type { CulturalMicroMoment } from './culturalMemory';
import type { TempoReport } from './visualTempo';
import type { CampaignTimeline } from './campaignTimeline';

export interface AbsenceDecision {
  drop_copy: boolean;
  drop_product: boolean;
  drop_face: boolean;
  drop_cta: boolean;
  drop_explanation: boolean;
  hide_emotion: boolean;
  /** 0..10 — how strongly absence creates curiosity for THIS banner. */
  curiosity_score: number;
  reasoning: string[];
}

export interface AbsenceInput {
  emotionalCore: EmotionalCore | null;
  microMoment: CulturalMicroMoment | null;
  tempo: TempoReport;
  timeline: CampaignTimeline;
  /** Banner index — early banners can't earn radical absence. */
  bannerIndex: number;
  /** Asset job (from Phase 3). */
  jobId: string;
}

export function decideAbsence(input: AbsenceInput): AbsenceDecision {
  const { emotionalCore, microMoment, tempo, timeline, bannerIndex, jobId } = input;
  const reasoning: string[] = [];

  let drop_copy = false;
  let drop_product = false;
  let drop_face = false;
  let drop_cta = false;
  let drop_explanation = false;
  let hide_emotion = false;
  let curiosity = 3;

  // Tempo-driven: when the campaign needs a breath, prefer absences.
  if (tempo.needs_breath_next) {
    drop_copy = bannerIndex >= 3;
    drop_cta = bannerIndex >= 4;
    curiosity += 2;
    reasoning.push('tempo needs breath — drop copy + cta');
  }

  // Emotional core demands absence (e.g. shame, loneliness).
  if (emotionalCore) {
    if (emotionalCore.product_role === 'hidden') {
      drop_product = true;
      reasoning.push(`core "${emotionalCore.id}" lives in absence — product hidden`);
      curiosity += 1.5;
    }
    if (emotionalCore.typography_behavior === 'absent' && bannerIndex >= 3) {
      drop_copy = true;
      reasoning.push(`core "${emotionalCore.id}" prescribes absent typography — drop copy`);
      curiosity += 1.5;
    }
    if (emotionalCore.id === 'shame' || emotionalCore.id === 'loneliness-in-public') {
      drop_face = true;
      reasoning.push(`core "${emotionalCore.id}" wants the face out of frame`);
      curiosity += 1;
    }
    if (emotionalCore.id === 'emotional-numbness' || emotionalCore.id === 'emotional-drift') {
      hide_emotion = true;
      reasoning.push(`core "${emotionalCore.id}" wants flat expression — no visible emotion`);
      curiosity += 0.5;
    }
  }

  // Asset job: atmosphere / anti-ad / no-product favour absences.
  if (jobId === 'atmosphere' || jobId === 'anti-ad') {
    drop_explanation = true;
    drop_cta = drop_cta || bannerIndex >= 3;
    curiosity += 1.5;
    reasoning.push(`job "${jobId}" explicitly chooses absence`);
  }
  if (jobId === 'no-product') {
    drop_product = true;
    reasoning.push('job "no-product" requires absence');
  }

  // Cultural moment: very high silence_level micro-moments earn absences.
  if (microMoment && microMoment.silence_level >= 0.85 && bannerIndex >= 3) {
    drop_copy = true;
    curiosity += 1;
    reasoning.push(`micro-moment "${microMoment.state_id}" has silence_level ${microMoment.silence_level} — copy redundant`);
  }

  // Timeline: when the campaign has visited every loud note already,
  // absence creates the strongest contrast.
  const playedLoud = timeline.notes_already_played.filter(
    (n) => n.note === 'disorientation' || n.note === 'micro-collapse' || n.note === 'denial',
  ).length;
  if (playedLoud >= 3 && bannerIndex >= 5) {
    drop_explanation = true;
    drop_cta = true;
    curiosity += 1.5;
    reasoning.push('campaign has produced enough loudness — absence is now interruption');
  }

  // Early banners cannot earn radical absence.
  if (bannerIndex < 2) {
    drop_copy = false;
    drop_explanation = false;
    drop_cta = false;
    drop_product = drop_product && emotionalCore?.product_role === 'hidden'; // still honour core
  }

  curiosity = Math.max(0, Math.min(10, curiosity));

  if (reasoning.length === 0) reasoning.push('no absence pressure — banner can speak normally');

  return {
    drop_copy, drop_product, drop_face, drop_cta, drop_explanation, hide_emotion,
    curiosity_score: curiosity,
    reasoning,
  };
}
