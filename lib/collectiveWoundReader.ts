/**
 * COLLECTIVE WOUND READER (Phase 416 — Wave 16)
 */

export interface CollectiveWoundReaderReading {
  wound_detected: boolean;
  wound_kind: string | null;
  notes: string[];
}

export interface CollectiveWoundReaderInput {
  exhaustionHigh: boolean;
  trustEroded: boolean;
  isolationHigh: boolean;
}

export function readCollectiveWoundReader(input: CollectiveWoundReaderInput): CollectiveWoundReaderReading {
  const notes: string[] = [];
  const wound_kind = input.exhaustionHigh ? 'exhaustion' :
    input.trustEroded ? 'broken trust' :
    input.isolationHigh ? 'isolation' : null;
  const wound_detected = wound_kind !== null;
  notes.push(`collective wound reader: ${wound_detected ? `wound — ${wound_kind}` : 'no wound'}`);
  return { wound_detected, wound_kind, notes };
}
