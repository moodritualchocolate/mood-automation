"use client";

// Autonomous OS · store + Executive Brain.
//
// The cycle: SENSE (world model) → THINK (agents propose) → DECIDE
// (score, route) → ACT (execute safe actions) → VERIFY → LEARN
// (memory + dismissal dampening) → REPORT (cycle record).
//
// Autonomy is deterministic and auditable: every action the system takes
// is recorded as an Initiative with a full trail, and anything that
// changes business state beyond additive task-creation goes through the
// human decision queue.

import { create } from "zustand";
import { canEdit, useStore } from "@/lib/store";
import type { Lang } from "@/lib/i18n/dictionary";
import { nowISO, uid } from "@/lib/utils";
import { AGENT_ANALYZERS, makeInitiative, makeT } from "./agents";
import { buildWorldModel, healthScore } from "./worldModel";
import type {
  AgentRun,
  CycleReport,
  Goal,
  GoalKind,
  GoalProgress,
  Initiative,
  MemoryEntry,
  MemoryLayer,
  OsState,
  WorldModel,
} from "./types";

const OS_KEY = "mood.os.v1";
const DAY = 86_400_000;

/** How many auto-executions a single cycle may perform (anti-spam). */
const MAX_AUTO_PER_CYCLE = 8;
/** Dismissed initiative kinds are muted for this many days per target. */
const DISMISS_COOLDOWN_DAYS = 14;
/** Auto-execute threshold after learning-dampening. */
const AUTO_CONFIDENCE = 0.75;

function emptyOs(): OsState {
  return {
    goals: [],
    initiatives: [],
    memories: [],
    cycles: [],
    dismissals: {},
    lastCycleAt: null,
    autonomyEnabled: true,
  };
}

function loadOs(): OsState {
  if (typeof window === "undefined") return emptyOs();
  try {
    const raw = window.localStorage.getItem(OS_KEY);
    if (!raw) return emptyOs();
    return { ...emptyOs(), ...(JSON.parse(raw) as OsState) };
  } catch {
    return emptyOs();
  }
}

interface OsStore extends OsState {
  osHydrated: boolean;
  hydrateOs: () => void;
  setAutonomy: (on: boolean) => void;

  /** The Executive Brain — one full autonomous cycle. */
  runCycle: (lang: Lang) => CycleReport | null;

  approveInitiative: (id: string, lang: Lang) => void;
  dismissInitiative: (id: string) => void;

  addGoal: (g: Omit<Goal, "id" | "createdAt">) => Goal;
  deleteGoal: (id: string) => void;

  remember: (layer: MemoryLayer, kind: string, text: string, refId?: string) => void;
}

function persist(s: OsState) {
  if (typeof window === "undefined") return;
  try {
    // Keep the log bounded — long-term memory is capped, working memory trimmed.
    const bounded: OsState = {
      ...s,
      initiatives: s.initiatives.slice(0, 400),
      memories: s.memories.slice(0, 600),
      cycles: s.cycles.slice(0, 60),
    };
    window.localStorage.setItem(OS_KEY, JSON.stringify(bounded));
  } catch {
    /* quota */
  }
}

function osSnapshot(s: OsStore): OsState {
  return {
    goals: s.goals,
    initiatives: s.initiatives,
    memories: s.memories,
    cycles: s.cycles,
    dismissals: s.dismissals,
    lastCycleAt: s.lastCycleAt,
    autonomyEnabled: s.autonomyEnabled,
  };
}

/* ── Executor · performs an initiative's action ── */

function executeAction(init: Initiative, lang: Lang): string {
  const data = useStore.getState();
  switch (init.action.type) {
    case "create_task": {
      const due = init.action.dueInDays
        ? new Date(Date.now() + init.action.dueInDays * DAY).toISOString()
        : undefined;
      const task = data.addTask({
        title: init.action.title,
        supplierId: init.action.supplierId,
        dueDate: due,
      });
      return `task:${task.id}`;
    }
    case "suggest_status": {
      // Executing an approved status suggestion actually applies it.
      data.setStatus(init.action.supplierId, init.action.to as never);
      return `status:${init.action.supplierId}→${init.action.to}`;
    }
    case "flag_risk":
    case "record_insight":
      // Pure knowledge actions — the memory write happens in the caller.
      return "insight";
    default:
      return "noop";
  }
}

/* ── Verification · confirm the action actually landed ── */

function verifyOutcome(outcome: string): boolean {
  if (outcome.startsWith("task:")) {
    const id = outcome.slice(5);
    return useStore.getState().tasks.some((t) => t.id === id);
  }
  return true;
}

/* ── Goal progress · computed live from the world ── */

export function goalProgress(goal: Goal, w: WorldModel): GoalProgress {
  let current = 0;
  switch (goal.kind) {
    case "approve_suppliers":
      current = w.suppliers.filter(
        (s) =>
          s.status === "approved" &&
          (!goal.category || s.category === goal.category),
      ).length;
      break;
    case "collect_quotes":
      current = w.totals.quotes;
      break;
    case "test_samples":
      current = w.raw.samples.filter((s) => s.finalScore != null).length;
      break;
    case "reduce_price": {
      // Target is a price ceiling — progress = any quote at/below target.
      const prices = w.raw.quotes
        .map((q) => q.pricePerKg)
        .filter((p): p is number => p != null);
      const best = prices.length ? Math.min(...prices) : null;
      current = best != null && best <= goal.target ? 1 : 0;
      return {
        goal,
        current: best ?? 0,
        target: goal.target,
        pct: current ? 100 : best ? Math.min(99, Math.round((goal.target / best) * 100)) : 0,
        done: current === 1,
      };
    }
    case "clear_tasks":
      // Target 0 overdue — progress inverted.
      return {
        goal,
        current: w.totals.overdueTasks,
        target: 0,
        pct: w.totals.overdueTasks === 0 ? 100 : Math.max(0, 100 - w.totals.overdueTasks * 20),
        done: w.totals.overdueTasks === 0,
      };
  }
  const pct = goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0;
  return { goal, current, target: goal.target, pct, done: current >= goal.target };
}

/** Goal templates — decompose a new goal into concrete starter tasks. */
export function goalPlaybook(kind: GoalKind, lang: Lang, category?: string): string[] {
  const t = makeT(lang);
  switch (kind) {
    case "approve_suppliers":
      return [
        t(`לאתר מועמדים חדשים${category ? ` בקטגוריית ${category}` : ""}`,
          `Source new candidates${category ? ` in ${category}` : ""}`),
        t("לבקש דוגמאות מהמועמדים המובילים", "Request samples from top candidates"),
        t("להריץ השוואת מחירים בין המועמדים", "Run a price comparison across candidates"),
      ];
    case "collect_quotes":
      return [
        t("לבקש הצעות מחיר מכל ספק פעיל", "Request quotes from every active supplier"),
        t("לוודא תוקף להצעות קיימות", "Verify validity of existing quotes"),
      ];
    case "test_samples":
      return [
        t("לבקש דוגמאות מספקים ללא דוגמה", "Request samples from suppliers without one"),
        t("לקבוע מפגש טעימות", "Schedule a tasting session"),
      ];
    case "reduce_price":
      return [
        t("לפתוח מו\"מ עם הספק הזול ביותר", "Open negotiation with the cheapest supplier"),
        t("להשיג הצעת מחיר מתחרה נוספת", "Obtain one more competing quote"),
      ];
    case "clear_tasks":
      return [t("לפנות זמן לסגירת משימות באיחור", "Block time to clear overdue tasks")];
  }
}

/* ── The store ── */

export const useOsStore = create<OsStore>((set, get) => {
  const commit = (patch: Partial<OsStore>) => {
    set(patch);
    persist(osSnapshot({ ...get(), ...patch } as OsStore));
  };

  return {
    ...emptyOs(),
    osHydrated: false,

    hydrateOs: () => {
      if (get().osHydrated) return;
      set({ ...loadOs(), osHydrated: true });
    },

    setAutonomy: (on) => commit({ autonomyEnabled: on }),

    remember: (layer, kind, text, refId) => {
      const entry: MemoryEntry = {
        id: uid("mem"), layer, kind, text, refId, createdAt: nowISO(),
      };
      commit({ memories: [entry, ...get().memories] });
    },

    runCycle: (lang) => {
      const os = get();
      if (!os.autonomyEnabled) return null;
      // Autonomy writes data — require an editing role.
      if (!canEdit(useStore.getState().role)) return null;
      const data = useStore.getState();
      if (!data.hydrated) return null;

      const t = makeT(lang);
      const world = buildWorldModel({
        suppliers: data.suppliers,
        events: data.events,
        materials: data.materials,
        samples: data.samples,
        quotes: data.quotes,
        tasks: data.tasks,
        files: data.files,
      });

      /* THINK · run every agent */
      const agentRuns: AgentRun[] = [];
      const proposals: Initiative[] = [];
      for (const [agentId, analyze] of Object.entries(AGENT_ANALYZERS)) {
        const found = analyze(world, t);
        agentRuns.push({
          id: uid("run"),
          agent: agentId as never,
          at: nowISO(),
          findings: found.length,
          proposed: found.length,
        });
        for (const p of found) proposals.push(makeInitiative(p));
      }

      /* DECIDE · dedupe → dampen → route */
      const now = Date.now();
      const existing = os.initiatives;
      const isBlocked = (key: string): boolean =>
        existing.some((i) => {
          if (i.dedupeKey !== key) return false;
          if (i.status === "pending") return true;
          const age = now - new Date(i.resolvedAt ?? i.createdAt).getTime();
          if (i.status === "dismissed") return age < DISMISS_COOLDOWN_DAYS * DAY;
          if (i.status === "auto_executed" || i.status === "approved")
            return age < 7 * DAY; // don't re-raise the same action within a week
          return false;
        });

      const fresh: Initiative[] = [];
      for (const p of proposals) {
        if (isBlocked(p.dedupeKey)) continue;
        // LEARN (applied) · dismissals dampen confidence per kind.
        const d = os.dismissals[p.kind] ?? 0;
        const damped = p.confidence / (1 + d * 0.5);
        if (damped < 0.4) continue; // learned: the owner doesn't want these
        fresh.push({ ...p, confidence: damped });
      }

      /* ACT · execute safe actions, queue the rest */
      let autoBudget = MAX_AUTO_PER_CYCLE;
      const newMemories: MemoryEntry[] = [];
      const resolved: Initiative[] = fresh.map((init) => {
        const additive =
          init.action.type === "create_task" ||
          init.action.type === "record_insight" ||
          init.action.type === "flag_risk";
        const canAuto =
          additive && init.risk === "low" && init.confidence >= AUTO_CONFIDENCE && autoBudget > 0;

        if (!canAuto) return { ...init, status: "pending" as const };

        autoBudget -= 1;
        const outcome = executeAction(init, lang);
        const ok = verifyOutcome(outcome);
        newMemories.push({
          id: uid("mem"),
          layer: "longterm",
          kind: "action",
          text: init.title,
          refId: init.id,
          createdAt: nowISO(),
        });
        if (init.action.type === "record_insight" || init.action.type === "flag_risk") {
          newMemories.push({
            id: uid("mem"),
            layer: "knowledge",
            kind: init.action.type === "flag_risk" ? "risk" : "insight",
            text: "note" in init.action ? init.action.note : init.title,
            refId: init.supplierId,
            createdAt: nowISO(),
          });
        }
        return {
          ...init,
          status: ok ? ("auto_executed" as const) : ("pending" as const),
          resolvedAt: nowISO(),
          outcome,
        };
      });

      /* Expire pending initiatives whose target vanished. */
      const supplierIds = new Set(data.suppliers.map((s) => s.id));
      const carried = existing.map((i) =>
        i.status === "pending" && i.supplierId && !supplierIds.has(i.supplierId)
          ? { ...i, status: "expired" as const, resolvedAt: nowISO() }
          : i,
      );

      /* Goals · detect completions */
      const goals = os.goals.map((g) => {
        if (g.achievedAt) return g;
        const prog = goalProgress(g, world);
        if (prog.done) {
          newMemories.push({
            id: uid("mem"),
            layer: "knowledge",
            kind: "goal_achieved",
            text: g.title,
            refId: g.id,
            createdAt: nowISO(),
          });
          return { ...g, achievedAt: nowISO() };
        }
        return g;
      });

      const report: CycleReport = {
        id: uid("cyc"),
        at: nowISO(),
        agentRuns,
        autoExecuted: resolved.filter((i) => i.status === "auto_executed").length,
        queuedForApproval: resolved.filter((i) => i.status === "pending").length,
        expired: carried.filter((i) => i.status === "expired").length -
          existing.filter((i) => i.status === "expired").length,
        healthScore: healthScore(world),
      };

      commit({
        initiatives: [...resolved, ...carried],
        memories: [...newMemories, ...os.memories],
        cycles: [report, ...os.cycles],
        goals,
        lastCycleAt: nowISO(),
      });
      return report;
    },

    approveInitiative: (id, lang) => {
      const os = get();
      const init = os.initiatives.find((i) => i.id === id);
      if (!init || init.status !== "pending") return;
      const outcome = executeAction(init, lang);
      const mem: MemoryEntry = {
        id: uid("mem"),
        layer: "longterm",
        kind: "approval",
        text: init.title,
        refId: init.id,
        createdAt: nowISO(),
      };
      commit({
        initiatives: os.initiatives.map((i) =>
          i.id === id
            ? { ...i, status: "approved", resolvedAt: nowISO(), outcome }
            : i,
        ),
        memories: [mem, ...os.memories],
      });
    },

    dismissInitiative: (id) => {
      const os = get();
      const init = os.initiatives.find((i) => i.id === id);
      if (!init || init.status !== "pending") return;
      const mem: MemoryEntry = {
        id: uid("mem"),
        layer: "longterm",
        kind: "dismissal",
        text: init.title,
        refId: init.id,
        createdAt: nowISO(),
      };
      commit({
        initiatives: os.initiatives.map((i) =>
          i.id === id ? { ...i, status: "dismissed", resolvedAt: nowISO() } : i,
        ),
        dismissals: {
          ...os.dismissals,
          [init.kind]: (os.dismissals[init.kind] ?? 0) + 1,
        },
        memories: [mem, ...os.memories],
      });
    },

    addGoal: (g) => {
      const goal: Goal = { ...g, id: uid("goal"), createdAt: nowISO() };
      commit({ goals: [goal, ...get().goals] });
      return goal;
    },
    deleteGoal: (id) => {
      commit({ goals: get().goals.filter((g) => g.id !== id) });
    },
  };
});
