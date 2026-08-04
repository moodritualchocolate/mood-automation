/**
 * FEEDBACK MEMORY ARCHIVE (Phase 256 — Wave 13: Reality Feedback Infrastructure)
 *
 * The organism must remember its own feedback — the reactions, the
 * patterns, the surprises — to learn anything at all. This archive
 * reports on the depth of that memory and what it says about the
 * organism's capacity to evolve from reality.
 */

export interface FeedbackMemoryArchiveReading {
  /** True when feedback memory is deep enough to draw lessons from. */
  archive_is_meaningful: boolean;
  /** 0..10 — depth of the feedback memory. */
  memory_depth: number;
  archive_summary: string;
  notes: string[];
}

export interface FeedbackMemoryArchiveInput {
  feedbackCycles: number;
  reactionsIngested: number;
  contradictionsFound: number;
  slowTruthsDetected: number;
}

export function readFeedbackMemoryArchive(input: FeedbackMemoryArchiveInput): FeedbackMemoryArchiveReading {
  const { feedbackCycles, reactionsIngested, contradictionsFound, slowTruthsDetected } = input;
  const notes: string[] = [];

  let memory_depth = Math.min(5, feedbackCycles * 0.5);
  memory_depth += Math.min(3, reactionsIngested * 0.3);
  memory_depth += Math.min(2, slowTruthsDetected * 0.5);
  memory_depth = round1(Math.min(10, memory_depth));

  const archive_is_meaningful = memory_depth >= 4 && feedbackCycles >= 3;

  const archive_summary = `${feedbackCycles} feedback cycles · ${reactionsIngested} reactions ingested · ` +
    `${contradictionsFound} contradiction(s) · ${slowTruthsDetected} slow truth(s) detected`;

  notes.push(`feedback memory archive: depth ${memory_depth}/10 — ${archive_summary}`);
  return { archive_is_meaningful, memory_depth, archive_summary, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
