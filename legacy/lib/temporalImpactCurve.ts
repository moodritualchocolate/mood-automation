/**
 * TEMPORAL IMPACT CURVE (Phase 243 — Wave 13: Reality Feedback Infrastructure)
 *
 * Impact unfolds over time as a curve, not a number. This module
 * sketches the shape of that curve — peaking now, peaking later,
 * already past — so the organism can read its action in the time
 * dimension reality actually delivers it in.
 */

export type ImpactCurveShape = 'rising' | 'peaked-now' | 'peaked-past' | 'flat';

export interface TemporalImpactCurveReading {
  curve_shape: ImpactCurveShape;
  /** Estimated cycles to peak (0 = now). */
  cycles_to_peak: number;
  curve_note: string;
  notes: string[];
}

export interface TemporalImpactCurveInput {
  /** 0..10 — immediate impact. */
  impactNow: number;
  /** 0..10 — projected impact one cycle out. */
  impactNext: number;
  /** 0..10 — impact one cycle ago. */
  impactPrior: number;
}

export function readTemporalImpactCurve(input: TemporalImpactCurveInput): TemporalImpactCurveReading {
  const { impactNow, impactNext, impactPrior } = input;
  const notes: string[] = [];

  const curve_shape: ImpactCurveShape =
    impactNext > impactNow + 0.5 ? 'rising' :
    impactNow > impactPrior + 0.5 && impactNow >= impactNext ? 'peaked-now' :
    impactPrior > impactNow + 0.5 ? 'peaked-past' : 'flat';

  const cycles_to_peak =
    curve_shape === 'rising' ? 1 :
    curve_shape === 'peaked-now' ? 0 :
    curve_shape === 'peaked-past' ? -1 : 0;

  const curve_note =
    curve_shape === 'rising' ? 'the impact curve is still rising — the action will land harder next cycle'
    : curve_shape === 'peaked-now' ? 'the impact has peaked this cycle — what follows will be the fade'
    : curve_shape === 'peaked-past' ? 'the impact peaked a cycle ago — what is observed now is the tail'
    : 'the impact curve is flat — no clear temporal shape';

  notes.push(`temporal impact curve: ${curve_shape} — ${curve_note}`);
  return { curve_shape, cycles_to_peak, curve_note, notes };
}
