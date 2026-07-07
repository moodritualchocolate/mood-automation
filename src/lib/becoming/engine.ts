// MOOD · Becoming engine — pure logic that turns the frozen content library into a
// playable multi-day loop. No UI, no IO. This is what proves the content contract.

export type Axis = "belonging" | "initiation" | "energy" | "risk";
export type HumanMap = Record<Axis, { value: number; confidence: number }>;
export type Recognition = { key: string; when: Record<string, string>; lines: string[] };
export type ChallengeItem = { level: string; label: string; text: string; sub: string };

export type MomentContent = {
  id: string;
  dimension: string;
  title: string;
  recognitions: Recognition[];
  challengeHeader: string;
  challenges: ChallengeItem[];
  onTry: string[];
  onNotThisTime: string[];
  becomingOnTry: string[];
  tomorrowHooks: string[];
};

export type ContentBundle = {
  moments: Record<string, MomentContent>; // keyed by dimension
  order: string[]; // dimension rotation for the wedge (life-chosen, not user-chosen)
  discovery: any;
  becomingStatements: { rules: { when_dimensions: string[]; line: string }[]; early_state: string };
  becomingPortrait: any;
  feelings: { key: string; label: string }[];
  system: any;
};

export function emptyMap(): HumanMap {
  return {
    belonging: { value: 0, confidence: 0.3 },
    initiation: { value: 0, confidence: 0.3 },
    energy: { value: 0, confidence: 0.3 },
    risk: { value: 0, confidence: 0.3 },
  };
}

export function applyChoice(map: HumanMap, signals: Partial<Record<Axis, number>>): HumanMap {
  const next: HumanMap = JSON.parse(JSON.stringify(map));
  for (const [axis, delta] of Object.entries(signals) as [Axis, number][]) {
    const t = next[axis];
    t.value = Math.max(-1, Math.min(1, t.value + delta));
    t.confidence = Math.min(0.9, t.confidence + 0.2);
  }
  return next;
}

// Evaluate a data-driven condition like { "initiation": "<-0.2", "energy": "<0" }.
export function evalWhen(when: Record<string, string>, map: HumanMap): boolean {
  for (const [axis, expr] of Object.entries(when)) {
    const m = /^(<=|>=|<|>)\s*(-?\d*\.?\d+)$/.exec(expr.trim());
    if (!m) return false;
    const [, op, numStr] = m;
    const n = parseFloat(numStr);
    const v = (map as any)[axis]?.value;
    if (v === undefined) return false;
    if (op === "<" && !(v < n)) return false;
    if (op === ">" && !(v > n)) return false;
    if (op === "<=" && !(v <= n)) return false;
    if (op === ">=" && !(v >= n)) return false;
  }
  return true;
}

// First recognition whose every condition matches; the empty-when entry is the default.
export function pickRecognition(recs: Recognition[], map: HumanMap): Recognition {
  for (const r of recs) {
    if (Object.keys(r.when || {}).length === 0) continue;
    if (evalWhen(r.when, map)) return r;
  }
  return recs.find((r) => Object.keys(r.when || {}).length === 0) || recs[recs.length - 1];
}

// Triangulation: first Becoming rule whose dimensions are all present in what's engaged.
export function assembleBecoming(
  rules: { when_dimensions: string[]; line: string }[],
  engaged: Set<string>,
): string {
  for (const rule of rules) {
    if (rule.when_dimensions.length === 0) continue;
    if (rule.when_dimensions.every((d) => engaged.has(d))) return rule.line;
  }
  const fallback = rules.find((r) => r.when_dimensions.length === 0);
  return fallback ? fallback.line : "";
}

// Growth framing keyed to how many DISTINCT dimensions were engaged (not day count).
export function growthFraming(portrait: any, distinct: number): string {
  const rules: any[] = portrait?.growth_framing?.rules || [];
  const exact = rules.find((r) => r.when_distinct_dimensions === distinct);
  if (exact) return exact.line;
  const plus = rules.find((r) => String(r.when_distinct_dimensions).endsWith("+"));
  return plus ? plus.line : "";
}
