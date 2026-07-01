// Autonomous OS · domain types.
//
// The OS layer sits ABOVE the procurement data layer. It observes the
// world (DataState), thinks (agents propose initiatives), decides
// (decision engine scores + routes), acts (executor performs safe
// actions), and learns (memory + dismissal dampening).
//
// OS state is persisted separately from business data so the Supabase
// schema stays untouched.

import type { DataState } from "@/lib/types";

/* ── Agents ── */

export type AgentId =
  | "executive"
  | "procurement"
  | "quality"
  | "finance"
  | "research"
  | "operations"
  | "risk";

export interface AgentDef {
  id: AgentId;
  /** Dictionary keys for name + role, resolved by the UI. */
  nameKey: string;
  emoji: string;
}

/* ── Initiatives · units of autonomous work ── */

/** What kind of action the initiative wants to take. */
export type InitiativeAction =
  | { type: "create_task"; title: string; supplierId?: string; dueInDays?: number }
  | { type: "flag_risk"; note: string; supplierId?: string }
  | { type: "record_insight"; note: string }
  | { type: "suggest_status"; supplierId: string; to: string; reason: string };

export type InitiativeKind =
  // procurement
  | "follow_up_stale"
  | "request_quote_approved"
  | "advance_new_supplier"
  | "missing_contact_info"
  // quality
  | "score_pending_sample"
  | "missing_coa"
  | "low_score_in_pipeline"
  // finance
  | "price_outlier"
  | "stale_quote"
  | "best_price_available"
  // research
  | "thin_category"
  | "country_concentration"
  // operations
  | "overdue_task"
  | "untouched_supplier"
  // risk
  | "single_source_dependency"
  | "no_files_approved";

export type InitiativeStatus =
  | "proposed"      // created this cycle, not yet routed
  | "auto_executed" // executed autonomously
  | "pending"       // waiting for human decision
  | "approved"      // human approved → executed
  | "dismissed"     // human dismissed → learned
  | "expired";      // superseded / no longer relevant

export interface Initiative {
  id: string;
  kind: InitiativeKind;
  agent: AgentId;
  /** Stable key for dedup: kind + target. */
  dedupeKey: string;
  /** Short human title (already localized at creation time). */
  title: string;
  detail: string;
  action: InitiativeAction;
  /** 0–1 · how sure the agent is that this is the right move. */
  confidence: number;
  /** 1–10 · estimated business impact. */
  impact: number;
  risk: "low" | "medium" | "high";
  status: InitiativeStatus;
  supplierId?: string;
  createdAt: string;
  resolvedAt?: string;
  /** What happened when executed (e.g. created task id). */
  outcome?: string;
}

/* ── Goals ── */

export type GoalKind =
  | "approve_suppliers"   // reach N approved suppliers in a category
  | "collect_quotes"      // get N quotes
  | "test_samples"        // score N samples
  | "reduce_price"        // get best €/kg under target
  | "clear_tasks";        // reach zero overdue tasks

export interface Goal {
  id: string;
  kind: GoalKind;
  title: string;
  /** Target number (meaning depends on kind). */
  target: number;
  /** Optional category filter (approve_suppliers). */
  category?: string;
  createdAt: string;
  /** Computed at read time, but snapshotted for history. */
  achievedAt?: string;
}

export interface GoalProgress {
  goal: Goal;
  current: number;
  target: number;
  pct: number; // 0–100
  done: boolean;
}

/* ── Memory ── */

export type MemoryLayer = "working" | "longterm" | "knowledge";

export interface MemoryEntry {
  id: string;
  layer: MemoryLayer;
  kind: string;          // e.g. "action", "dismissal", "insight", "cycle"
  text: string;
  refId?: string;        // initiative / supplier id
  createdAt: string;
}

/* ── Cycle bookkeeping ── */

export interface AgentRun {
  id: string;
  agent: AgentId;
  at: string;
  findings: number;
  proposed: number;
}

export interface CycleReport {
  id: string;
  at: string;
  agentRuns: AgentRun[];
  autoExecuted: number;
  queuedForApproval: number;
  expired: number;
  healthScore: number; // 0–100
}

/* ── Persisted OS state ── */

export interface OsState {
  goals: Goal[];
  initiatives: Initiative[];
  memories: MemoryEntry[];
  cycles: CycleReport[];
  /** kind → dismissal count · used to dampen confidence (learning). */
  dismissals: Record<string, number>;
  lastCycleAt: string | null;
  /** Master switch — autonomy on/off. */
  autonomyEnabled: boolean;
}

/* ── World model ── */

export interface WorldSupplierView {
  id: string;
  company: string;
  category: string;
  status: string;
  country?: string;
  daysSinceUpdate: number;
  daysSinceLastEvent: number | null;
  materialsCount: number;
  samplesCount: number;
  avgSampleScore: number | null;
  quotesCount: number;
  bestPrice: number | null;
  openTasks: number;
  filesCount: number;
  hasCoa: boolean;
  hasContactInfo: boolean;
}

export interface WorldModel {
  at: string;
  suppliers: WorldSupplierView[];
  totals: {
    suppliers: number;
    approved: number;
    awaiting: number;
    quotes: number;
    samples: number;
    openTasks: number;
    overdueTasks: number;
  };
  /** category → supplier count (non-rejected). */
  categoryCounts: Record<string, number>;
  /** country → supplier count (non-rejected). */
  countryCounts: Record<string, number>;
  /** Median price per material kind across quotes. */
  medianPriceByMaterial: Record<string, number>;
  raw: DataState;
}
