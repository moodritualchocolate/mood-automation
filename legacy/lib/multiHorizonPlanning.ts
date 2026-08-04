/**
 * MULTI-HORIZON PLANNING (Phase 102 — Wave 8: Operating System Genesis)
 *
 * The runtime plans on four horizons at once — the next banner, the
 * coming season, the civilization's arc, and the organism's survival.
 * A healthy OS keeps the four coherent; when a short-horizon move
 * contradicts a long-horizon need, the planner flags the conflict.
 */

import type { LongHorizonPredictionReading } from './longHorizonPrediction';
import type { ExistentialRiskReading } from './existentialRiskLayer';
import type { DirectiveReading } from './directiveEngine';

export interface MultiHorizonReading {
  short_term: string;
  mid_term: string;
  civilizational: string;
  existential: string;
  /** True when a short-horizon move contradicts a long-horizon need. */
  horizon_conflict: boolean;
  notes: string[];
}

export interface MultiHorizonInput {
  longHorizon: LongHorizonPredictionReading;
  existentialRisk: ExistentialRiskReading;
  directive: DirectiveReading;
}

export function readMultiHorizonPlanning(input: MultiHorizonInput): MultiHorizonReading {
  const { longHorizon, existentialRisk, directive } = input;
  const notes: string[] = [];

  const short_term = directive.directive === 'publish'
    ? 'ship a banner that is true to this tick'
    : `hold output — the directive this tick is "${directive.directive}"`;

  const mid_term = `position for ${longHorizon.predicted_season} — ${longHorizon.season_strategy}`;

  const civilizational = 'keep the campaign recognisable across generations without ossifying';

  const existential = existentialRisk.organism_at_risk
    ? 'survival overrides every other horizon — protect the organism\'s core'
    : 'no existential threat — the organism can plan freely';

  // A conflict — the short horizon wants to publish while the
  // existential horizon demands protection, or the directive ships
  // output while the long horizon calls for retreat.
  const horizon_conflict =
    (existentialRisk.organism_at_risk && directive.directive === 'publish') ||
    (longHorizon.predicted_season === 'a-season-of-fatigue' && directive.directive === 'escalate');

  notes.push(`multi-horizon planning: short "${short_term}" · mid "${longHorizon.predicted_season}"` +
    (horizon_conflict ? ' — HORIZON CONFLICT: a short-term move contradicts a long-horizon need' : ' — horizons coherent'));
  return { short_term, mid_term, civilizational, existential, horizon_conflict, notes };
}
