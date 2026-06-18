import type { DataState, Supplier } from "./types";
import type { Lang } from "./i18n/dictionary";

export interface AnalysisResult {
  pros: string[];
  cons: string[];
  risks: string[];
  comparison: string;
  recommendation: string;
  source: "local" | "ai";
}

// Builds the structured profile we feed to either the heuristic or Claude.
export function buildSupplierProfile(supplier: Supplier, data: DataState) {
  const materials = data.materials.filter((m) => m.supplierId === supplier.id);
  const samples = data.samples.filter((s) => s.supplierId === supplier.id);
  const quotes = data.quotes.filter((q) => q.supplierId === supplier.id);
  const events = data.events.filter((e) => e.supplierId === supplier.id);
  const tasks = data.tasks.filter((t) => t.supplierId === supplier.id);

  const sampleScores = samples
    .map((s) => s.finalScore)
    .filter((n): n is number => n != null);
  const avgSample = sampleScores.length
    ? sampleScores.reduce((a, b) => a + b, 0) / sampleScores.length
    : undefined;
  const minQuote = quotes.length
    ? Math.min(...quotes.map((q) => q.pricePerKg ?? Infinity))
    : undefined;

  return { supplier, materials, samples, quotes, events, tasks, avgSample, minQuote };
}

// Local, deterministic analysis — works with zero external dependencies.
export function analyzeLocally(
  supplier: Supplier,
  data: DataState,
  lang: Lang = "he",
): AnalysisResult {
  const p = buildSupplierProfile(supplier, data);
  const he = lang === "he";
  const pros: string[] = [];
  const cons: string[] = [];
  const risks: string[] = [];

  // Peer benchmarks across all suppliers.
  const allMinQuotes = data.suppliers
    .map((s) => {
      const qs = data.quotes.filter((q) => q.supplierId === s.id);
      return qs.length ? Math.min(...qs.map((q) => q.pricePerKg ?? Infinity)) : undefined;
    })
    .filter((n): n is number => n != null && Number.isFinite(n));
  const marketAvg = allMinQuotes.length
    ? allMinQuotes.reduce((a, b) => a + b, 0) / allMinQuotes.length
    : undefined;

  // ── Pros ──
  if (p.avgSample != null && p.avgSample >= 8)
    pros.push(he ? `ציון טעימה מצוין (${p.avgSample.toFixed(1)}/10)` : `Excellent tasting score (${p.avgSample.toFixed(1)}/10)`);
  if (p.samples.some((s) => s.suitable))
    pros.push(he ? "סומן כמתאים ל-MOOD בדגימה" : "Marked as suitable for MOOD in a sample");
  if (p.minQuote != null && marketAvg != null && p.minQuote < marketAvg)
    pros.push(he ? `מחיר מתחת לממוצע השוק (${p.minQuote.toFixed(1)}€)` : `Below-market price (${p.minQuote.toFixed(1)}€)`);
  if (p.materials.some((m) => m.coa))
    pros.push(he ? "סיפק COA לחומר גלם" : "Provided COA for a raw material");
  if (supplier.status === "approved")
    pros.push(he ? "כבר אושר בתהליך" : "Already approved in the pipeline");
  if (p.materials.some((m) => m.origin === "single"))
    pros.push(he ? "מציע Single Origin" : "Offers Single Origin");

  // ── Cons ──
  if (p.avgSample != null && p.avgSample < 6)
    cons.push(he ? `ציון טעימה נמוך (${p.avgSample.toFixed(1)}/10)` : `Low tasting score (${p.avgSample.toFixed(1)}/10)`);
  if (p.minQuote != null && marketAvg != null && p.minQuote > marketAvg)
    cons.push(he ? `מחיר מעל ממוצע השוק (${p.minQuote.toFixed(1)}€)` : `Above-market price (${p.minQuote.toFixed(1)}€)`);
  if (p.materials.length === 0)
    cons.push(he ? "לא תועדו חומרי גלם" : "No raw materials recorded");
  if (p.quotes.length === 0)
    cons.push(he ? "טרם התקבלה הצעת מחיר" : "No quote received yet");

  // ── Risks ──
  if (!p.materials.some((m) => m.coa))
    risks.push(he ? "חסר COA — לוודא תאימות רגולטורית" : "Missing COA — verify regulatory compliance");
  if (p.samples.length === 0)
    risks.push(he ? "לא נבדקה דוגמה — אין אימות טעם/איכות" : "No sample evaluated — taste/quality unverified");
  const openTasks = p.tasks.filter((t) => !t.done).length;
  if (openTasks > 0)
    risks.push(he ? `${openTasks} משימות פתוחות בהמשכיות מול הספק` : `${openTasks} open follow-up tasks with this supplier`);
  if (["new", "contacted", "awaiting_response"].includes(supplier.status))
    risks.push(he ? "התקשורת בשלב מוקדם — חוסר ודאות גבוה" : "Early-stage engagement — high uncertainty");

  // ── Comparison ──
  let comparison: string;
  if (p.minQuote != null && marketAvg != null) {
    const diff = (((p.minQuote - marketAvg) / marketAvg) * 100).toFixed(0);
    comparison = he
      ? `המחיר הזול ביותר של הספק (${p.minQuote.toFixed(1)}€) הוא ${Number(diff) <= 0 ? `${Math.abs(Number(diff))}% מתחת` : `${diff}% מעל`} לממוצע השוק (${marketAvg.toFixed(1)}€) מבין ${allMinQuotes.length} ספקים מתומחרים.`
      : `The supplier's lowest price (${p.minQuote.toFixed(1)}€) is ${Number(diff) <= 0 ? `${Math.abs(Number(diff))}% below` : `${diff}% above`} the market average (${marketAvg.toFixed(1)}€) across ${allMinQuotes.length} priced suppliers.`;
  } else {
    comparison = he
      ? "אין מספיק הצעות מחיר במערכת להשוואה כמותית."
      : "Not enough quotes in the system for a quantitative comparison.";
  }

  // ── Recommendation ──
  let recommendation: string;
  const score = (p.avgSample ?? 0) + pros.length - cons.length - risks.length * 0.5;
  if (supplier.status === "approved")
    recommendation = he ? "ספק מאושר — להמשיך להזמנה ראשונה ולחתום על תנאים." : "Approved supplier — proceed to a first order and lock terms.";
  else if (score >= 8 && p.avgSample != null && p.avgSample >= 8)
    recommendation = he ? "מועמד חזק. מומלץ לקדם למשא ומתן ולבקש COA חתום + הזמנת ניסיון." : "Strong candidate. Advance to negotiation and request a signed COA + trial order.";
  else if (p.samples.length === 0)
    recommendation = he ? "לפני החלטה — לבקש דוגמה ו-COA ולבצע טעימה מסודרת." : "Before deciding — request a sample and COA, and run a structured tasting.";
  else
    recommendation = he ? "פוטנציאל בינוני. כדאי להשוות מול לפחות שני ספקים נוספים לפני התקדמות." : "Moderate potential. Compare against at least two other suppliers before advancing.";

  return { pros, cons, risks, comparison, recommendation, source: "local" };
}
