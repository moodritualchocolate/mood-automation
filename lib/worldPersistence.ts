/**
 * WORLD PERSISTENCE (Phase 9)
 *
 * The campaign should feel lived in, not regenerated.
 *
 * Tracks recurring environmental DNA across banners:
 *   - apartment-types     (derived from cultural micro-moments)
 *   - lighting families   (from Phase 7 atmospheric light behaviours)
 *   - object scars        (from object-emotion store appearances)
 *   - emotional temps     (warm/cool distribution)
 *   - camera distances    (from Phase 8 framing decisions)
 *
 * Reports:
 *   - dna_signature       — the recurring elements of the world
 *   - lighting_fatigue    — which lights have been used too many times
 *                           (the spec's "warmth used too often becomes fake")
 *   - whatShouldEvolve    — directives for the next banner
 *   - whatShouldStay      — anchors the campaign should keep
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { LightBehavior } from './atmosphericLight';
import type { ObjectMotif } from './objectEmotionMemory';

export interface WorldDNA {
  recurringApartments: Array<{ kind: string; count: number }>;
  lightingFamilies: Array<{ behavior: LightBehavior | string; count: number }>;
  objectScars: Array<{ objectId: string; appearances: number; motif: string | null }>;
  emotionalTemperature: { warm: number; cool: number; flat: number };
  averageSilence: number; // 0..1 — derived from typography dominance distribution
}

export interface LightingFatigue {
  fatigued: Array<{ behavior: string; count: number; reason: string }>;
  rest: string[]; // lights that should rest next banner
}

export interface WorldPersistenceReport {
  dna_signature: WorldDNA;
  lighting_fatigue: LightingFatigue;
  whatShouldEvolve: string[];
  whatShouldStay: string[];
  /** True when the world has accumulated enough DNA to be recognisable. */
  worldFeelsLivedIn: boolean;
  notes: string[];
}

const APARTMENT_KIND_BY_MOMENT: Record<string, string> = {
  'fridge-open-at-night': 'apartment-kitchen-night',
  'bed-scrolling': 'apartment-bedroom-night',
  'saturday-stillness': 'apartment-living-room-day',
  'late-kitchen-silence': 'apartment-kitchen-night',
  'no-energy-for-people': 'apartment-entry',
  'reserves-fatigue': 'apartment-kitchen-morning',
  'parenting-overload': 'apartment-living-room-day',
  'overstimulated-tabs': 'office-or-desk',
  'office-fluorescent': 'office-floor',
  'office-1647-brain-death': 'office-floor',
  'startup-late-night': 'office-floor-night',
  'train-ride-silence': 'transit-train',
  'car-after-work': 'transit-car',
  'post-meeting-emptiness': 'office-corridor',
  'zoning-out': 'video-call-desk',
  'staring-without-processing': 'desk',
  'unread-whatsapp': 'apartment-table',
  'avoiding-messages': 'apartment-surface',
  'eating-without-hunger': 'apartment-kitchen-counter',
  'coffee-machine-emptiness': 'office-kitchenette',
};

export interface PersistenceInput {
  trail: EmotionalTraceEntry[];
  /** Pulled from atmosphericLight at ship time for each banner. */
  recentLightBehaviors: Array<{ behavior: string; ts: number }>;
  /** Pulled from Phase 7 object-emotion store. */
  motifs: ObjectMotif[];
  /** Per-banner camera distances if persisted (optional). */
  recentCameraDistances?: string[];
}

export function analyzeWorldPersistence(input: PersistenceInput): WorldPersistenceReport {
  const { trail, recentLightBehaviors, motifs } = input;
  const notes: string[] = [];

  // ─── apartment kinds ──────────────────────────────────────────
  const apartmentCounts = new Map<string, number>();
  for (const t of trail) {
    if (t.culturalMoment && APARTMENT_KIND_BY_MOMENT[t.culturalMoment]) {
      const kind = APARTMENT_KIND_BY_MOMENT[t.culturalMoment];
      apartmentCounts.set(kind, (apartmentCounts.get(kind) ?? 0) + 1);
    }
  }
  const recurringApartments = Array.from(apartmentCounts.entries())
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);

  // ─── lighting families ────────────────────────────────────────
  const lightCounts = new Map<string, number>();
  for (const l of recentLightBehaviors) lightCounts.set(l.behavior, (lightCounts.get(l.behavior) ?? 0) + 1);
  const lightingFamilies = Array.from(lightCounts.entries())
    .map(([behavior, count]) => ({ behavior, count }))
    .sort((a, b) => b.count - a.count);

  // ─── object scars ─────────────────────────────────────────────
  const objectScars = motifs
    .slice()
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, 8)
    .map((m) => ({ objectId: m.objectId, appearances: m.appearances, motif: m.motifLabel }));

  // ─── emotional temperature ────────────────────────────────────
  // Heuristic: cool lights and screens count as cool; warm lights count as warm.
  let warm = 0, cool = 0, flat = 0;
  for (const l of recentLightBehaviors) {
    if (l.behavior.includes('warmth') || l.behavior.includes('amber') || l.behavior === 'window-soft-warm') warm += 1;
    else if (l.behavior.includes('cool') || l.behavior.includes('blue') || l.behavior === 'monitor-cool-only' || l.behavior === 'phone-glow-loneliness' || l.behavior === 'fluorescent-depletion' || l.behavior === 'refrigerator-isolation' || l.behavior === 'sleepless-blue' || l.behavior === 'cold-morning-detachment') cool += 1;
    else flat += 1;
  }
  const emotionalTemperature = { warm, cool, flat };

  // ─── average silence ──────────────────────────────────────────
  const dominances = trail.map((t) => t.facts?.typographyDominance).filter(Boolean) as string[];
  const silenceCount = dominances.filter((d) => d === 'absent' || d === 'whisper').length;
  const averageSilence = dominances.length > 0 ? silenceCount / dominances.length : 0;

  // ─── lighting fatigue ─────────────────────────────────────────
  const fatigued: LightingFatigue['fatigued'] = [];
  for (const { behavior, count } of lightingFamilies) {
    if (count >= 3) {
      const reason =
        behavior.includes('warmth') || behavior.includes('amber') ? 'warmth used too often becomes fake'
        : behavior.includes('blue') || behavior === 'sleepless-blue' ? 'darkness used too often becomes aesthetic'
        : `${behavior} repeated ${count}× — needs a rest`;
      fatigued.push({ behavior, count, reason });
    }
  }
  const rest = fatigued.map((f) => f.behavior);

  // ─── what should evolve / stay ────────────────────────────────
  const whatShouldEvolve: string[] = [];
  const whatShouldStay: string[] = [];

  if (recurringApartments[0] && recurringApartments[0].count >= 3) {
    whatShouldEvolve.push(`apartment "${recurringApartments[0].kind}" has been used ${recurringApartments[0].count}× — rotate to a different setting`);
  } else if (recurringApartments[0] && recurringApartments[0].count >= 2) {
    whatShouldStay.push(`apartment "${recurringApartments[0].kind}" recurring — keep the geography consistent`);
  }
  for (const f of fatigued) whatShouldEvolve.push(`lighting "${f.behavior}" fatigued — ${f.reason}`);
  if (objectScars[0] && objectScars[0].appearances >= 3) {
    whatShouldStay.push(`object motif "${objectScars[0].objectId}" carrying meaning — keep referencing it`);
  }
  if (emotionalTemperature.warm > emotionalTemperature.cool * 2 && warm + cool > 3) {
    whatShouldEvolve.push('campaign has been warm — try a cool moment next');
  } else if (emotionalTemperature.cool > emotionalTemperature.warm * 2 && warm + cool > 3) {
    whatShouldEvolve.push('campaign has been cool — try a warm moment next');
  }

  const worldFeelsLivedIn =
    objectScars.some((o) => o.appearances >= 2) &&
    (recurringApartments.length > 0 || lightingFamilies.length > 0);

  if (worldFeelsLivedIn) notes.push('world feels lived in — recurring objects, recurring rooms');
  if (fatigued.length > 0) notes.push(`lighting fatigue on ${fatigued.length} families`);
  if (notes.length === 0) notes.push('world still forming — not enough recurrence yet');

  return {
    dna_signature: {
      recurringApartments,
      lightingFamilies,
      objectScars,
      emotionalTemperature,
      averageSilence,
    },
    lighting_fatigue: { fatigued, rest },
    whatShouldEvolve,
    whatShouldStay,
    worldFeelsLivedIn,
    notes,
  };
}
