// World Model · builds one connected, queryable snapshot of the entire
// business state. Every agent reasons over this — never over raw store
// arrays — so the "understanding of the world" lives in one place.

import type { DataState } from "@/lib/types";
import type { WorldModel, WorldSupplierView } from "./types";

const DAY = 86_400_000;

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / DAY);
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function buildWorldModel(data: DataState): WorldModel {
  const now = new Date().toISOString();

  const suppliers: WorldSupplierView[] = data.suppliers.map((s) => {
    const events = data.events.filter((e) => e.supplierId === s.id);
    const lastEvent = events.length
      ? events.reduce((a, b) => (a.date > b.date ? a : b))
      : null;
    const materials = data.materials.filter((m) => m.supplierId === s.id);
    const samples = data.samples.filter((x) => x.supplierId === s.id);
    const scored = samples.filter((x) => x.finalScore != null);
    const quotes = data.quotes.filter((q) => q.supplierId === s.id);
    const priced = quotes.filter((q) => q.pricePerKg != null);
    const tasks = data.tasks.filter((t) => t.supplierId === s.id && !t.done);
    const files = data.files.filter((f) => f.supplierId === s.id);

    return {
      id: s.id,
      company: s.company,
      category: s.category ?? "other",
      status: s.status,
      country: s.country,
      daysSinceUpdate: daysSince(s.updatedAt) ?? 0,
      daysSinceLastEvent: lastEvent ? daysSince(lastEvent.date) : null,
      materialsCount: materials.length,
      samplesCount: samples.length,
      avgSampleScore: scored.length
        ? scored.reduce((a, x) => a + (x.finalScore ?? 0), 0) / scored.length
        : null,
      quotesCount: quotes.length,
      bestPrice: priced.length
        ? Math.min(...priced.map((q) => q.pricePerKg!))
        : null,
      openTasks: tasks.length,
      filesCount: files.length,
      hasCoa: materials.some((m) => m.coa) || files.some((f) => f.category === "coa"),
      hasContactInfo: Boolean(s.email || s.phone),
    };
  });

  const active = suppliers.filter((s) => s.status !== "rejected");
  const categoryCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};
  for (const s of active) {
    categoryCounts[s.category] = (categoryCounts[s.category] ?? 0) + 1;
    if (s.country) countryCounts[s.country] = (countryCounts[s.country] ?? 0) + 1;
  }

  const medianPriceByMaterial: Record<string, number> = {};
  const byMaterial = new Map<string, number[]>();
  for (const q of data.quotes) {
    if (q.pricePerKg == null || !q.material) continue;
    const arr = byMaterial.get(q.material) ?? [];
    arr.push(q.pricePerKg);
    byMaterial.set(q.material, arr);
  }
  for (const [mat, prices] of byMaterial) {
    medianPriceByMaterial[mat] = median(prices);
  }

  return {
    at: now,
    suppliers,
    totals: {
      suppliers: data.suppliers.length,
      approved: suppliers.filter((s) => s.status === "approved").length,
      awaiting: suppliers.filter((s) => s.status === "awaiting_response").length,
      quotes: data.quotes.length,
      samples: data.samples.length,
      openTasks: data.tasks.filter((t) => !t.done).length,
      overdueTasks: data.tasks.filter(
        (t) => !t.done && t.dueDate && new Date(t.dueDate).getTime() < Date.now(),
      ).length,
    },
    categoryCounts,
    countryCounts,
    medianPriceByMaterial,
    raw: data,
  };
}

/**
 * Business health · 0–100. A single number the executive dashboard can
 * show, derived from concrete signals rather than vibes.
 */
export function healthScore(w: WorldModel): number {
  let score = 100;

  // Pipeline stalls — suppliers stuck awaiting response > 7 days.
  const stalled = w.suppliers.filter(
    (s) => s.status === "awaiting_response" && s.daysSinceUpdate > 7,
  ).length;
  score -= Math.min(20, stalled * 5);

  // Overdue tasks.
  score -= Math.min(20, w.totals.overdueTasks * 4);

  // No approved supplier at all → serious gap.
  if (w.totals.suppliers > 0 && w.totals.approved === 0) score -= 15;

  // Approved suppliers without COA → compliance exposure.
  const approvedNoCoa = w.suppliers.filter(
    (s) => s.status === "approved" && !s.hasCoa,
  ).length;
  score -= Math.min(15, approvedNoCoa * 5);

  // Untouched suppliers (no event in 30+ days, still active pipeline).
  const untouched = w.suppliers.filter(
    (s) =>
      s.status !== "rejected" &&
      s.status !== "approved" &&
      (s.daysSinceLastEvent == null || s.daysSinceLastEvent > 30),
  ).length;
  score -= Math.min(15, untouched * 3);

  return Math.max(0, Math.min(100, Math.round(score)));
}
