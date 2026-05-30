/**
 * CONTENT CALENDAR ENGINE (pure, observational)
 *
 * Composes a week-by-week content calendar from a campaign plan +
 * asset requirements. The calendar is a STRUCTURE the operator may
 * follow — the system never publishes, never auto-schedules to a
 * platform, never auto-fills any slot.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never publishes
 *   - never auto-schedules to a platform
 *   - allowed phrasing: "calendar structure", "operator slot",
 *     "rest beat", "historically associated", "observed alongside",
 *     "requires more evidence"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply, optimize
 */

import type { CampaignPhaseId, CampaignPhase, AssetRequirementBucket, CreativeAngle } from './campaignPlannerEngine';

// ─── input ────────────────────────────────────────────────────

export interface ContentCalendarInput {
  /** Optional start ISO date string (defaults to today). */
  startISODate?: string;
  phases: CampaignPhase[];
  assetRequirements: AssetRequirementBucket[];
  creativeAngles: CreativeAngle[];
  /** Posts per week the operator can sustain (defaults to 3). */
  publishingCadencePerWeek?: number;
  /** Optional rest-beat policy (default: one rest day per week). */
  restDaysPerWeek?: number;
}

// ─── output ───────────────────────────────────────────────────

export interface CalendarSlot {
  slotId: string;
  /** 0..6 day-of-week index from start. */
  dayOfWeek: number;
  /** Approximate ISO date for this slot. */
  approxISODate: string;
  packageType: AssetRequirementBucket['packageType'] | 'rest';
  phaseId: CampaignPhaseId | 'rest';
  /** Suggested angle to explore — operator decides. */
  angleSuggestion?: string;
  /** Plain-language slot note. */
  slotNote: string;
  operatorReviewRequired: true;
}

export interface CalendarWeek {
  weekIndex: number;
  phaseId: CampaignPhaseId;
  slots: CalendarSlot[];
  weekNote: string;
}

export interface ContentCalendarReading {
  startISODate: string;
  totalWeeks: number;
  publishingCadencePerWeek: number;
  restDaysPerWeek: number;
  weeks: CalendarWeek[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Content calendar is a structure of operator slots only. ' +
  'The system never publishes, never auto-schedules to a platform. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function dateAddDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── main ─────────────────────────────────────────────────────

export function buildContentCalendar(input: ContentCalendarInput): ContentCalendarReading {
  const startISODate = input.startISODate ?? todayISO();
  const cadence = Math.max(1, Math.min(7, input.publishingCadencePerWeek ?? 3));
  const restDays = Math.max(0, Math.min(7 - cadence, input.restDaysPerWeek ?? 1));
  const totalDurationDays = input.phases.reduce((a, p) => a + p.durationDays, 0);
  const totalWeeks = Math.max(1, Math.ceil(totalDurationDays / 7));

  // Build phase-by-day map.
  const phaseByDay: CampaignPhaseId[] = [];
  for (const phase of input.phases) {
    for (let i = 0; i < phase.durationDays; i++) phaseByDay.push(phase.phaseId);
  }

  // Choose a package mix per phase. Coarse: pick the AssetRequirementBucket
  // that has this phase in its phases list, in priority order video → image →
  // carousel → landing (varied across slots).
  function picksForPhase(phaseId: CampaignPhaseId): AssetRequirementBucket['packageType'][] {
    const fitting = input.assetRequirements.filter((b) => b.phases.includes(phaseId));
    if (fitting.length === 0) return ['image'];
    return fitting.map((b) => b.packageType);
  }

  // Choose an angle for a slot — rotate through angles whose story-family
  // is in the phase's story-family options.
  function angleForPhase(phaseId: CampaignPhaseId, slotIndex: number): string | undefined {
    const phaseDef = input.phases.find((p) => p.phaseId === phaseId);
    if (!phaseDef) return undefined;
    const pool = input.creativeAngles
      .filter((a) => phaseDef.storyFamilyOptions.includes(a.storyFamily));
    if (pool.length === 0) return input.creativeAngles[slotIndex % Math.max(1, input.creativeAngles.length)]?.angleId;
    return pool[slotIndex % pool.length].angleId;
  }

  const weeks: CalendarWeek[] = [];
  let dayCursor = 0;
  let slotCounter = 0;
  for (let w = 0; w < totalWeeks; w++) {
    const slots: CalendarSlot[] = [];
    // Determine dominant phase for the week (mode of the 7 days).
    const phaseCounts = new Map<CampaignPhaseId, number>();
    for (let d = 0; d < 7; d++) {
      const phase = phaseByDay[dayCursor + d] ?? phaseByDay[phaseByDay.length - 1];
      phaseCounts.set(phase, (phaseCounts.get(phase) ?? 0) + 1);
    }
    let dominantPhase: CampaignPhaseId = 'arrival';
    let domMax = -1;
    for (const [p, c] of phaseCounts) {
      if (c > domMax) { domMax = c; dominantPhase = p; }
    }

    const picks = picksForPhase(dominantPhase);
    // Layout: cadence publishing slots, restDays rest slots, remaining are
    // observational blank days the operator may fill.
    const layout: Array<AssetRequirementBucket['packageType'] | 'rest' | 'open'> = [];
    for (let d = 0; d < 7; d++) {
      if (d < cadence) layout.push(picks[d % picks.length]);
      else if (d < cadence + restDays) layout.push('rest');
      else layout.push('open');
    }

    for (let d = 0; d < 7; d++) {
      slotCounter += 1;
      const layoutChoice = layout[d];
      const packageType: CalendarSlot['packageType'] = layoutChoice === 'open' ? 'image' : layoutChoice;
      const phaseId: CalendarSlot['phaseId'] = layoutChoice === 'rest' ? 'rest' : dominantPhase;
      const slotNote =
        layoutChoice === 'rest'
          ? 'rest beat · no publication · breathing room observed alongside the calendar'
          : layoutChoice === 'open'
          ? `open slot · operator may explore additional ${packageType} or leave blank`
          : `${packageType} slot · ${dominantPhase} phase · operator approval required`;
      slots.push({
        slotId: `slot-${slotCounter}`,
        dayOfWeek: d,
        approxISODate: dateAddDays(startISODate, w * 7 + d),
        packageType,
        phaseId,
        angleSuggestion: layoutChoice === 'rest' ? undefined : angleForPhase(dominantPhase, slotCounter),
        slotNote,
        operatorReviewRequired: true,
      });
    }
    weeks.push({
      weekIndex: w + 1,
      phaseId: dominantPhase,
      slots,
      weekNote: `week ${w + 1} · ${dominantPhase} phase · ${cadence} publishing slot(s) · ${restDays} rest beat(s) · operator slots only`,
    });
    dayCursor += 7;
  }

  const notes: string[] = [];
  notes.push('calendar structure · operator slots only · the system never publishes');
  notes.push('rest beats observed alongside the calendar — historically associated with audience breathing room');

  return {
    startISODate,
    totalWeeks,
    publishingCadencePerWeek: cadence,
    restDaysPerWeek: restDays,
    weeks,
    notes,
    reasonCodes: [
      `weeks:${totalWeeks}`, `cadence:${cadence}`, `rest:${restDays}`,
      `phases:${input.phases.length}`, `angles:${input.creativeAngles.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
