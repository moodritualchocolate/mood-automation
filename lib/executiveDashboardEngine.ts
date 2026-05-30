/**
 * EXECUTIVE DASHBOARD ENGINE (pure, observational)
 *
 * Phase 5 — Operations Layer.
 *
 * Pure composer that produces a single-screen executive snapshot
 * across nine sections: campaigns · assets · approvals · generation
 * queue · publications · revenue attribution · performance ·
 * learning · system health.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - the engine never predicts
 *   - the engine never recommends
 *   - the engine never auto-executes anything
 *   - allowed phrasing: "historically observed", "operator review
 *     required", "Human remains final authority"
 *   - forbidden: predict, will-perform, best, winner, recommended,
 *     selected, chosen, optimal, auto-apply
 */

import type { Formula } from '@/core/types';
import type { AssetRecord, AssetApprovalStatus } from './assetRegistryMemory';
import type { PublicationRecord, PublicationStatus } from './publicationRegistryMemory';
import type { CampaignPlanRecord, CampaignPlanStatus } from './campaignPlanMemory';
import type { GenerationRequestRecord, GenerationRequestStatus } from './generationRequestQueue';
import type { CustomerJourneyReading } from './customerJourneyEngine';
import type { AttributionEngineReading } from './attributionEngine';
import type { PerformanceAnalyzerReading } from './performanceAnalyzer';
import type { LearningSignalBridgeReading } from './learningSignalBridge';
import type { RevenueLearningBridgeReading } from './revenueLearningBridge';
import type { TaskEngineReading } from './taskEngine';
import type { WorkspaceEngineReading } from './workspaceEngine';
import type { TeamEngineReading } from './teamEngine';

// ─── input ────────────────────────────────────────────────────

export interface ExecutiveDashboardInput {
  workspace?: WorkspaceEngineReading | null;
  team?: TeamEngineReading | null;
  tasks?: TaskEngineReading | null;
  assets?: AssetRecord[];
  publications?: PublicationRecord[];
  campaignPlans?: CampaignPlanRecord[];
  generationRequests?: GenerationRequestRecord[];
  journey?: CustomerJourneyReading | null;
  attribution?: AttributionEngineReading | null;
  performance?: PerformanceAnalyzerReading | null;
  learning?: LearningSignalBridgeReading | null;
  revenueBridge?: RevenueLearningBridgeReading | null;
  /** System integrity quick status (operator-provided). */
  systemHealth?: {
    overallStatus?: 'stable' | 'warning' | 'critical';
    typeScriptStatus?: boolean;
    warningCount?: number;
  };
}

// ─── output ───────────────────────────────────────────────────

export interface ExecutiveSection {
  title: string;
  observation: string;
  counters: Record<string, number>;
}

export interface ExecutiveDashboardReading {
  sections: {
    campaigns: ExecutiveSection;
    assets: ExecutiveSection;
    approvals: ExecutiveSection;
    generationQueue: ExecutiveSection;
    publications: ExecutiveSection;
    revenueAttribution: ExecutiveSection;
    performance: ExecutiveSection;
    learning: ExecutiveSection;
    systemHealth: ExecutiveSection;
  };
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Executive dashboard is descriptive only. The system never publishes, never ' +
  'spends, never auto-executes anything. Operator review required. ' +
  'Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function countBy<T, K extends string>(arr: T[], key: (item: T) => K): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const item of arr) {
    const k = key(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function r3(n: number): number { return Math.round(n * 1000) / 1000; }

// ─── main ─────────────────────────────────────────────────────

export function composeExecutiveDashboard(input: ExecutiveDashboardInput): ExecutiveDashboardReading {
  const workspace = input.workspace;
  const team = input.team;
  const tasks = input.tasks;
  const assets = input.assets ?? [];
  const publications = input.publications ?? [];
  const plans = input.campaignPlans ?? [];
  const genRequests = input.generationRequests ?? [];
  const journey = input.journey;
  const attribution = input.attribution;
  const performance = input.performance;
  const learning = input.learning;
  const revenueBridge = input.revenueBridge;

  // ── campaigns ────────────────────────────────────────────
  const planStatusCounts = countBy<CampaignPlanRecord, CampaignPlanStatus>(plans, (p) => p.status);
  const workspaceCampaignCount = workspace?.projectTree.reduce((acc, p) => acc + p.totals.campaignCount, 0) ?? 0;
  const campaignsSection: ExecutiveSection = {
    title: 'Campaigns',
    observation: `${plans.length} campaign plan(s) · ${workspaceCampaignCount} workspace campaign(s) historically observed · operator review required`,
    counters: {
      planCount: plans.length,
      workspaceCampaignCount,
      draft: planStatusCounts.draft ?? 0,
      approved: planStatusCounts.approved ?? 0,
      'in-flight': planStatusCounts['in-flight'] ?? 0,
      completed: planStatusCounts.completed ?? 0,
      rejected: planStatusCounts.rejected ?? 0,
      archived: planStatusCounts.archived ?? 0,
    },
  };

  // ── assets ───────────────────────────────────────────────
  const assetStatusCounts = countBy<AssetRecord, AssetApprovalStatus>(assets, (a) => a.approvalStatus);
  const formulaCounts = countBy<AssetRecord, Formula>(assets, (a) => a.formula);
  const assetsSection: ExecutiveSection = {
    title: 'Assets',
    observation: `${assets.length} asset(s) historically observed · operator review required`,
    counters: {
      total: assets.length,
      pending: assetStatusCounts.pending ?? 0,
      approved: assetStatusCounts.approved ?? 0,
      rejected: assetStatusCounts.rejected ?? 0,
      archived: assetStatusCounts.archived ?? 0,
      ENERGY: formulaCounts.ENERGY ?? 0,
      FOCUS: formulaCounts.FOCUS ?? 0,
      RELAX: formulaCounts.RELAX ?? 0,
      SLEEP: formulaCounts.SLEEP ?? 0,
    },
  };

  // ── approvals ────────────────────────────────────────────
  const pendingAssets = assets.filter((a) => a.approvalStatus === 'pending').length;
  const draftRequests = genRequests.filter((r) => r.status === 'draft').length;
  const draftPlans = plans.filter((p) => p.status === 'draft').length;
  const blockedTasks = tasks?.blockedTasks.length ?? 0;
  const overdueTasks = tasks?.overdueTasks.length ?? 0;
  const approvalsSection: ExecutiveSection = {
    title: 'Approvals',
    observation: `${pendingAssets + draftRequests + draftPlans + blockedTasks + overdueTasks} item(s) historically observed awaiting operator action · operator approval required`,
    counters: {
      pendingAssets, draftGenerationRequests: draftRequests, draftCampaignPlans: draftPlans,
      blockedTasks, overdueTasks,
      atRiskTasks: tasks?.atRiskTasks.length ?? 0,
    },
  };

  // ── generation queue ─────────────────────────────────────
  const genStatusCounts = countBy<GenerationRequestRecord, GenerationRequestStatus>(genRequests, (r) => r.status);
  const generationQueueSection: ExecutiveSection = {
    title: 'Generation Queue',
    observation: `${genRequests.length} generation request(s) historically observed · operator approval required before any submission`,
    counters: {
      total: genRequests.length,
      draft: genStatusCounts.draft ?? 0,
      approved: genStatusCounts.approved ?? 0,
      submitted: genStatusCounts.submitted ?? 0,
      completed: genStatusCounts.completed ?? 0,
      failed: genStatusCounts.failed ?? 0,
      archived: genStatusCounts.archived ?? 0,
    },
  };

  // ── publications ─────────────────────────────────────────
  const publicationStatusCounts = countBy<PublicationRecord, PublicationStatus>(publications, (p) => p.status);
  const publicationsSection: ExecutiveSection = {
    title: 'Publications',
    observation: `${publications.length} publication(s) historically observed · operator publishes externally · operator manually registers here`,
    counters: {
      total: publications.length,
      live: publicationStatusCounts.live ?? 0,
      paused: publicationStatusCounts.paused ?? 0,
      unpublished: publicationStatusCounts.unpublished ?? 0,
      archived: publicationStatusCounts.archived ?? 0,
    },
  };

  // ── revenue attribution ──────────────────────────────────
  const revenueAttributionSection: ExecutiveSection = {
    title: 'Revenue Attribution',
    observation: attribution
      ? `$${(attribution.totalRevenueUSD ?? 0).toLocaleString()} historically observed across ${attribution.totalJourneys} journey(s) — attribution coverage ${Math.round((attribution.attributionCoverage ?? 0) * 100)}%`
      : 'no attribution data yet · requires more evidence',
    counters: {
      totalRevenueUSD: attribution?.totalRevenueUSD ?? 0,
      totalJourneys: attribution?.totalJourneys ?? 0,
      attributionCoverageBp: Math.round((attribution?.attributionCoverage ?? 0) * 10000),
      attributionRows: attribution?.dimensions.reduce((acc, d) => acc + d.rows.length, 0) ?? 0,
    },
  };

  // ── performance ──────────────────────────────────────────
  const performanceSection: ExecutiveSection = {
    title: 'Performance',
    observation: performance
      ? `${performance.totalPerformances} performance observation(s) historically observed · fatigue ${performance.indicators.fatigueIndicator.level}/10 · attention ${performance.indicators.attentionIndicator.level}/10 · retention ${performance.indicators.retentionIndicator.level}/10 · trust ${performance.indicators.trustIndicator.level}/10`
      : 'no performance observations yet · requires more evidence',
    counters: {
      totalPerformances: performance?.totalPerformances ?? 0,
      fatigueIndicator: performance?.indicators.fatigueIndicator.level ?? 0,
      attentionIndicator: performance?.indicators.attentionIndicator.level ?? 0,
      retentionIndicator: performance?.indicators.retentionIndicator.level ?? 0,
      trustIndicator: performance?.indicators.trustIndicator.level ?? 0,
      historicalPatterns: performance?.historicallyAssociatedPatterns.length ?? 0,
    },
  };

  // ── learning ─────────────────────────────────────────────
  const learningSignalCount = learning?.bridgeSignals.length ?? 0;
  const revenueSignalCount = revenueBridge?.revenueSignals.length ?? 0;
  const learningSection: ExecutiveSection = {
    title: 'Learning',
    observation: learningSignalCount + revenueSignalCount === 0
      ? 'no learning signals composed yet · requires more evidence'
      : `${learningSignalCount} prior learning signal(s) + ${revenueSignalCount} revenue signal(s) historically observed · operator review required`,
    counters: {
      learningSignals: learningSignalCount,
      revenueSignals: revenueSignalCount,
      operatorExplorations:
        (learning?.operatorExplorations.length ?? 0) +
        (revenueBridge?.operatorExplorations.length ?? 0),
    },
  };

  // ── system health ────────────────────────────────────────
  const health = input.systemHealth ?? {};
  const systemHealthSection: ExecutiveSection = {
    title: 'System Health',
    observation:
      `system status historically observed as ${health.overallStatus ?? 'unknown'} · ` +
      `typescript ${health.typeScriptStatus ?? true ? 'clean' : 'errors'} · ` +
      `${health.warningCount ?? 0} warning(s) · operator review required`,
    counters: {
      typeScriptClean: health.typeScriptStatus === false ? 0 : 1,
      warningCount: health.warningCount ?? 0,
      workspaceProjects: workspace?.projectTree.length ?? 0,
      teamMembers: team?.approvalAvailability.length ?? 0,
      uncoveredRoles: team?.uncoveredRoles.length ?? 0,
      tasksTotal: tasks?.totalTasks ?? 0,
      tasksReady: tasks?.readyToStart.length ?? 0,
    },
  };

  // Aggregate.
  const notes: string[] = [];
  notes.push('executive dashboard composed from operator-supervised registries · operator review required');
  if (!attribution || attribution.totalJourneys === 0) {
    notes.push('no journey data feeds revenue attribution yet · requires more evidence');
  }
  if ((tasks?.overdueTasks.length ?? 0) > 0) {
    notes.push(`${tasks?.overdueTasks.length} overdue task(s) historically observed · operator review required`);
  }

  // Defensive uses for the side data we keep on input but don't render
  // into a separate section — they show up in counters above.
  void r3;
  void formulaCounts;

  return {
    sections: {
      campaigns: campaignsSection,
      assets: assetsSection,
      approvals: approvalsSection,
      generationQueue: generationQueueSection,
      publications: publicationsSection,
      revenueAttribution: revenueAttributionSection,
      performance: performanceSection,
      learning: learningSection,
      systemHealth: systemHealthSection,
    },
    notes,
    reasonCodes: [
      `campaigns:${plans.length}`,
      `assets:${assets.length}`,
      `publications:${publications.length}`,
      `genRequests:${genRequests.length}`,
      `journeys:${journey?.totalJourneys ?? 0}`,
      `revenueUSD:${attribution?.totalRevenueUSD ?? 0}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
