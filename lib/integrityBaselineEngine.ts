/**
 * INTEGRITY BASELINE ENGINE
 *
 * Pure deterministic shape-signature derivation + comparison. Given
 * a JSON value, derives a structural fingerprint that ignores
 * concrete values but captures keys + types. Two outputs whose
 * shape signatures deep-equal are structurally identical.
 *
 * STRICTLY:
 *   - no I/O (shape derivation + comparison are pure)
 *   - no critic imports
 *   - same value → same shape signature
 *   - same baseline + current → same comparison
 *
 * Used by the baseline anchoring layer to detect missing fields,
 * renamed fields, and type-shape drift across view-builder outputs.
 */

// ─── shape node ────────────────────────────────────────────────

export type ShapeNode =
  | { kind: 'object'; properties: Record<string, ShapeNode> }
  | { kind: 'array'; element: ShapeNode | null }
  | { kind: 'primitive'; types: string[] };

// ─── derive shape ──────────────────────────────────────────────

function primitiveTypeOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';   // unreachable in primitive path
  return typeof v;
}

/** Sort keys lexicographically so the derived shape is stable across
 *  any input that has the same key set in any order. */
function sortedKeys<T extends object>(obj: T): Array<keyof T & string> {
  return (Object.keys(obj) as Array<keyof T & string>).sort();
}

/** Merge two shape nodes — used for arrays so the element shape
 *  reflects the UNION of keys/types across every element. This
 *  catches optional-field shapes (some elements have key X, others
 *  don't) without false positives on first-element-only scans. */
function mergeShapes(a: ShapeNode, b: ShapeNode): ShapeNode {
  if (a.kind === 'primitive' && b.kind === 'primitive') {
    const set = new Set([...a.types, ...b.types]);
    return { kind: 'primitive', types: Array.from(set).sort() };
  }
  if (a.kind === 'array' && b.kind === 'array') {
    if (a.element === null) return { kind: 'array', element: b.element };
    if (b.element === null) return { kind: 'array', element: a.element };
    return { kind: 'array', element: mergeShapes(a.element, b.element) };
  }
  if (a.kind === 'object' && b.kind === 'object') {
    const keys = new Set([...Object.keys(a.properties), ...Object.keys(b.properties)]);
    const merged: Record<string, ShapeNode> = {};
    for (const k of Array.from(keys).sort()) {
      const av = a.properties[k];
      const bv = b.properties[k];
      if (av === undefined) merged[k] = bv;
      else if (bv === undefined) merged[k] = av;
      else merged[k] = mergeShapes(av, bv);
    }
    return { kind: 'object', properties: merged };
  }
  // Heterogeneous — record as primitive union to surface the drift.
  const aTypes = a.kind === 'primitive' ? a.types : [a.kind];
  const bTypes = b.kind === 'primitive' ? b.types : [b.kind];
  return { kind: 'primitive', types: Array.from(new Set([...aTypes, ...bTypes])).sort() };
}

export function deriveShape(value: unknown): ShapeNode {
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: 'array', element: null };
    let element = deriveShape(value[0]);
    for (let i = 1; i < value.length; i++) {
      element = mergeShapes(element, deriveShape(value[i]));
    }
    return { kind: 'array', element };
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const properties: Record<string, ShapeNode> = {};
    for (const k of sortedKeys(obj)) {
      properties[k] = deriveShape(obj[k]);
    }
    return { kind: 'object', properties };
  }
  return { kind: 'primitive', types: [primitiveTypeOf(value)] };
}

// ─── compare shapes ────────────────────────────────────────────

export interface ShapeDiffIssue {
  path: string;        // dotted path, e.g. "preferences[].confidenceWeight"
  kind: 'missing-field' | 'extra-field' | 'type-drift' | 'array-element-drift' | 'kind-drift';
  detail: string;
}

export interface ShapeComparisonResult {
  matched: boolean;
  issues: ShapeDiffIssue[];
}

function joinPath(base: string, segment: string): string {
  if (base === '') return segment;
  return `${base}${segment.startsWith('[') ? '' : '.'}${segment}`;
}

function arraysEqualUnordered(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return false;
  }
  return true;
}

function compareNode(
  baseline: ShapeNode, current: ShapeNode, path: string,
  issues: ShapeDiffIssue[],
): void {
  if (baseline.kind !== current.kind) {
    issues.push({
      path: path === '' ? '<root>' : path,
      kind: 'kind-drift',
      detail: `baseline kind '${baseline.kind}' vs current kind '${current.kind}'`,
    });
    return;
  }
  if (baseline.kind === 'primitive' && current.kind === 'primitive') {
    if (!arraysEqualUnordered(baseline.types, current.types)) {
      issues.push({
        path: path === '' ? '<root>' : path,
        kind: 'type-drift',
        detail: `baseline types [${baseline.types.join('|')}] vs current [${current.types.join('|')}]`,
      });
    }
    return;
  }
  if (baseline.kind === 'array' && current.kind === 'array') {
    if (baseline.element !== null && current.element !== null) {
      compareNode(baseline.element, current.element, joinPath(path, '[]'), issues);
    } else if (baseline.element !== null && current.element === null) {
      issues.push({
        path: joinPath(path, '[]'),
        kind: 'array-element-drift',
        detail: 'baseline declares array element shape; current array is empty (cannot compare)',
      });
    } else if (baseline.element === null && current.element !== null) {
      // Baseline was empty array; current has elements. This is shape
      // expansion — flag so anchoring can be re-run by operator.
      issues.push({
        path: joinPath(path, '[]'),
        kind: 'array-element-drift',
        detail: 'baseline array shape was empty; current array now has elements — operator should re-anchor',
      });
    }
    return;
  }
  if (baseline.kind === 'object' && current.kind === 'object') {
    const baseKeys = new Set(Object.keys(baseline.properties));
    const curKeys = new Set(Object.keys(current.properties));
    for (const k of baseKeys) {
      if (!curKeys.has(k)) {
        issues.push({
          path: joinPath(path, k),
          kind: 'missing-field',
          detail: `field '${k}' present in baseline but missing in current output`,
        });
      }
    }
    for (const k of curKeys) {
      if (!baseKeys.has(k)) {
        issues.push({
          path: joinPath(path, k),
          kind: 'extra-field',
          detail: `field '${k}' present in current output but missing in baseline (possible rename or addition)`,
        });
      }
    }
    for (const k of baseKeys) {
      if (curKeys.has(k)) {
        compareNode(baseline.properties[k], current.properties[k], joinPath(path, k), issues);
      }
    }
    return;
  }
}

export function compareShapes(
  baseline: ShapeNode, current: ShapeNode,
): ShapeComparisonResult {
  const issues: ShapeDiffIssue[] = [];
  compareNode(baseline, current, '', issues);
  return { matched: issues.length === 0, issues };
}

// ─── public report shape ──────────────────────────────────────

export type BaselineStatus = 'matched' | 'missing-baseline' | 'shape-drift';

export interface BaselineComparisonRow {
  layer: string;
  status: BaselineStatus;
  /** Concise summary of issues — empty when matched / missing-baseline. */
  issues: ShapeDiffIssue[];
  /** Human-readable issue tally, e.g. "2 missing, 1 type drift". */
  issueSummary: string | null;
}

export function compareLayer(args: {
  layer: string;
  current: unknown;
  baseline: ShapeNode | null;
}): BaselineComparisonRow {
  if (!args.baseline) {
    return {
      layer: args.layer,
      status: 'missing-baseline',
      issues: [],
      issueSummary: 'baseline not yet anchored — run scripts/anchor-integrity-baselines.ts',
    };
  }
  const currentShape = deriveShape(args.current);
  const result = compareShapes(args.baseline, currentShape);
  if (result.matched) {
    return { layer: args.layer, status: 'matched', issues: [], issueSummary: null };
  }
  const counts = result.issues.reduce<Record<string, number>>((acc, i) => {
    acc[i.kind] = (acc[i.kind] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(counts)
    .map(([k, v]) => `${v} ${k.replace('-', ' ')}`)
    .join(', ');
  return {
    layer: args.layer,
    status: 'shape-drift',
    issues: result.issues.slice(0, 12),
    issueSummary: summary,
  };
}
