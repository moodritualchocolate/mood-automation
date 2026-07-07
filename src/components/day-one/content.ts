// MOOD · Day One — ENGINE-SHARED content (not Moment-specific).
// Moment-specific content (title, challenges, reflections, hero art) lives in
// ./moments/*. This file holds only what is universal across every Moment:
// the discovery onboarding, the map math, and the evening feeling taps.

import type { Axis, ChoiceOption, DiscoveryStep, HumanMap } from "./types";

export type {
  Axis,
  ChoiceOption,
  DiscoveryStep,
  HumanMap,
  Recognition,
  Level,
  ChallengeItem,
  Moment,
  SceneKey,
} from "./types";

// The four discovery choices. Universal onboarding — builds the Human Map once.
// No labels are ever shown; the person just feels which is them.
export const DISCOVERY: DiscoveryStep[] = [
  {
    axis: "belonging",
    left: { id: "outside", scene: "window", signals: { belonging: -0.4 } },
    right: { id: "inside", scene: "room", signals: { belonging: 0.5 } },
  },
  {
    axis: "initiation",
    left: { id: "reach", scene: "reach", signals: { initiation: 0.6, risk: 0.2 } },
    right: { id: "wait", scene: "wait", signals: { initiation: -0.5 } },
  },
  {
    axis: "energy",
    left: { id: "crowd", scene: "street", signals: { energy: 0.6 } },
    right: { id: "quiet", scene: "bench", signals: { energy: -0.6 } },
  },
  {
    axis: "risk",
    left: { id: "half", scene: "door-half", signals: { risk: -0.4 } },
    right: { id: "wide", scene: "door-wide", signals: { risk: 0.6 } },
  },
];

export function emptyMap(): HumanMap {
  return {
    belonging: { value: 0, confidence: 0.3 },
    initiation: { value: 0, confidence: 0.3 },
    energy: { value: 0, confidence: 0.3 },
    risk: { value: 0, confidence: 0.3 },
  };
}

// Fold the chosen options into soft floats. Confidence rises a little per signal.
export function buildMap(chosen: ChoiceOption[]): HumanMap {
  const map = emptyMap();
  for (const opt of chosen) {
    for (const [axis, delta] of Object.entries(opt.signals) as [Axis, number][]) {
      const t = map[axis];
      t.value = clamp(t.value + delta, -1, 1);
      t.confidence = clamp(t.confidence + 0.2, 0, 0.9);
    }
  }
  return map;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// Evening journal — soft feeling taps (never mandatory, never scored). Universal.
export const FEELINGS = [
  "פתוח יותר",
  "קצת גאה",
  "נבוך אבל שמח",
  "רגוע",
  "מופתע מעצמי",
  "עוד מעכל",
];
