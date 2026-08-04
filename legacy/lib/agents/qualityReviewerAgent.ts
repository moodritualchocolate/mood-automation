/**
 * QUALITY REVIEWER AGENT (pure orchestrator)
 *
 * Reviews assets against brand rules + knowledge base. Surfaces
 * violations / warnings / review notes. Never blocks.
 *
 * The agent composes the existing brand guardian + meta-cognition
 * + self-reflection signals + knowledge engine search results.
 */

import { computeBrandGuardian, briefToScanText } from '../brandGuardian';
import { searchKnowledge } from '../knowledgeEngine';
import type { AssetRecord } from '../assetRegistryMemory';
import type { KnowledgeEntry } from '../knowledgeMemory';
import type { AgentDescriptor } from './types';
import { AGENT_CATALOG, AGENT_ADVISORY_NOTICE } from './types';

// ─── input ────────────────────────────────────────────────────

export interface QualityReviewerAgentInput {
  /** Assets to review — operator chooses which subset. */
  assets: AssetRecord[];
  /** Optional knowledge base for cross-checks. */
  knowledgeEntries?: KnowledgeEntry[];
  /** Optional audience market context. */
  audienceMarket?: 'israel' | 'global';
}

// ─── output ───────────────────────────────────────────────────

export interface QualityReviewerAgentOutput {
  descriptor: AgentDescriptor;
  /** Per-asset findings. */
  findings: Array<{
    assetId: string;
    sourceStoryName: string;
    brandAlignment: number;
    violationCount: number;
    evidenceGapCount: number;
    violations: string[];
    warnings: string[];
    relatedKnowledgeTitles: string[];
    note: string;
  }>;
  /** Aggregate counters. */
  totalViolations: number;
  totalEvidenceGaps: number;
  /** Plain-language review notes. */
  reviewNotes: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── main ─────────────────────────────────────────────────────

export function runQualityReviewerAgent(
  input: QualityReviewerAgentInput,
): QualityReviewerAgentOutput {
  const assets = input.assets ?? [];
  const knowledgeEntries = input.knowledgeEntries ?? [];
  const audienceMarket = input.audienceMarket ?? 'israel';

  // Run brand guardian over each asset (we use the asset as a coarse
  // "brief" since the asset registry stores the frozen prompt).
  const guardianInput = assets.map((a) => ({
    briefId: a.assetId,
    briefType: a.packageType,
    formula: a.formula,
    sourceStoryName: a.sourceStoryName,
    audienceMarket,
    briefText: briefToScanText(a as unknown as Record<string, unknown>),
  }));
  const guardianResult = computeBrandGuardian({ briefs: guardianInput, audienceMarket });

  const findings = guardianResult.briefReports.map((report) => {
    const violations = report.findings.filter((f) => f.status === 'violated').map((f) => `${f.ruleName}: ${f.detail}`);
    const warnings = report.findings.filter((f) => f.status === 'requires-more-evidence').map((f) => `${f.ruleName}: ${f.detail}`);

    // Find related knowledge entries (token overlap on the asset's
    // story name + formula).
    const sourceAsset = assets.find((a) => a.assetId === report.targetId);
    const searchTokens = sourceAsset ? `${sourceAsset.sourceStoryName} ${sourceAsset.formula}` : '';
    const knowledge = searchKnowledge({ entries: knowledgeEntries, query: searchTokens });
    const relatedKnowledgeTitles = knowledge.matches
      .filter((m) => m.matchScore >= 1)
      .slice(0, 4)
      .map((m) => `${m.entry.title} (${m.entry.category})`);

    const note = violations.length > 0
      ? 'violations historically observed · operator review required — agent NEVER blocks'
      : warnings.length > 0
      ? 'evidence gaps historically observed · requires more evidence · operator review required'
      : 'no violations or evidence gaps observed alongside the asset';
    return {
      assetId: report.targetId,
      sourceStoryName: report.sourceStoryName,
      brandAlignment: report.brandAlignment,
      violationCount: report.violationCount,
      evidenceGapCount: report.evidenceGapCount,
      violations, warnings, relatedKnowledgeTitles, note,
    };
  });

  const reviewNotes: string[] = [];
  reviewNotes.push('quality reviewer agent run · operator-reviewable findings');
  reviewNotes.push('agent NEVER blocks · operator decides whether to act on the findings');
  if (guardianResult.totalViolations > 0) {
    reviewNotes.push(`${guardianResult.totalViolations} brand-guardian violation(s) historically observed · operator review required`);
  }
  if (guardianResult.totalEvidenceGaps > 0) {
    reviewNotes.push(`${guardianResult.totalEvidenceGaps} evidence gap(s) historically observed · requires more evidence`);
  }
  if (knowledgeEntries.length === 0) {
    reviewNotes.push('no knowledge entries provided — operator may add knowledge for cross-reference');
  }

  return {
    descriptor: AGENT_CATALOG['quality-reviewer'],
    findings,
    totalViolations: guardianResult.totalViolations,
    totalEvidenceGaps: guardianResult.totalEvidenceGaps,
    reviewNotes,
    notes: [
      `${assets.length} asset(s) historically observed`,
      'agent never blocks · operator review required',
    ],
    reasonCodes: [
      `assets:${assets.length}`,
      `violations:${guardianResult.totalViolations}`,
      `gaps:${guardianResult.totalEvidenceGaps}`,
      `knowledge:${knowledgeEntries.length}`,
    ],
    advisoryNotice: AGENT_ADVISORY_NOTICE,
  };
}
