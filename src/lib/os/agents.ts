// Multi-Agent Organization · each agent is a pure analysis pass over the
// WorldModel that proposes Initiatives. Agents never mutate anything —
// the decision engine + executor own side effects.
//
// Titles are generated bilingually at proposal time (the OS runs
// headless, outside React, so it can't call useI18n).

import type { Lang } from "@/lib/i18n/dictionary";
import { uid } from "@/lib/utils";
import type {
  AgentDef,
  AgentId,
  Initiative,
  InitiativeAction,
  InitiativeKind,
  WorldModel,
} from "./types";

export const AGENTS: AgentDef[] = [
  { id: "executive",   nameKey: "os.agent.executive",   emoji: "🧠" },
  { id: "procurement", nameKey: "os.agent.procurement", emoji: "📦" },
  { id: "quality",     nameKey: "os.agent.quality",     emoji: "🔬" },
  { id: "finance",     nameKey: "os.agent.finance",     emoji: "💰" },
  { id: "research",    nameKey: "os.agent.research",    emoji: "🔎" },
  { id: "operations",  nameKey: "os.agent.operations",  emoji: "⚙️" },
  { id: "risk",        nameKey: "os.agent.risk",        emoji: "🛡️" },
];

type T = (he: string, en: string) => string;

interface Proposal {
  kind: InitiativeKind;
  agent: AgentId;
  dedupeKey: string;
  title: string;
  detail: string;
  action: InitiativeAction;
  confidence: number;
  impact: number;
  risk: "low" | "medium" | "high";
  supplierId?: string;
}

export function makeInitiative(p: Proposal): Initiative {
  return {
    id: uid("init"),
    status: "proposed",
    createdAt: new Date().toISOString(),
    ...p,
  };
}

/* ── Procurement Agent · pipeline momentum ── */

function procurementAgent(w: WorldModel, t: T): Proposal[] {
  const out: Proposal[] = [];

  for (const s of w.suppliers) {
    // Stalled: awaiting response for more than 7 days → follow-up task.
    if (s.status === "awaiting_response" && s.daysSinceUpdate > 7) {
      out.push({
        kind: "follow_up_stale",
        agent: "procurement",
        dedupeKey: `follow_up_stale:${s.id}`,
        title: t(`מעקב: ${s.company} לא ענו ${s.daysSinceUpdate} ימים`,
                 `Follow up: ${s.company} silent for ${s.daysSinceUpdate} days`),
        detail: t(
          `הספק בסטטוס "ממתין למענה" כבר ${s.daysSinceUpdate} ימים. נוצרה משימת מעקב אוטומטית.`,
          `Supplier has been awaiting response for ${s.daysSinceUpdate} days. A follow-up task was created automatically.`,
        ),
        action: {
          type: "create_task",
          title: t(`לתזכר את ${s.company} — אין מענה ${s.daysSinceUpdate} ימים`,
                   `Ping ${s.company} — no reply for ${s.daysSinceUpdate} days`),
          supplierId: s.id,
          dueInDays: 2,
        },
        confidence: 0.9,
        impact: 6,
        risk: "low",
        supplierId: s.id,
      });
    }

    // Approved but no quote on file → we can't order from them.
    if (s.status === "approved" && s.quotesCount === 0) {
      out.push({
        kind: "request_quote_approved",
        agent: "procurement",
        dedupeKey: `request_quote_approved:${s.id}`,
        title: t(`${s.company} מאושר אבל בלי הצעת מחיר`,
                 `${s.company} approved but has no quote`),
        detail: t(
          "ספק מאושר ללא הצעת מחיר בתוקף — אי אפשר להזמין ממנו. נוצרה משימה לבקש הצעה.",
          "An approved supplier without a valid quote can't be ordered from. A task to request a quote was created.",
        ),
        action: {
          type: "create_task",
          title: t(`לבקש הצעת מחיר מ-${s.company}`, `Request a quote from ${s.company}`),
          supplierId: s.id,
          dueInDays: 3,
        },
        confidence: 0.85,
        impact: 7,
        risk: "low",
        supplierId: s.id,
      });
    }

    // Fresh supplier untouched for 5+ days → nudge first contact.
    if (s.status === "new" && s.daysSinceUpdate > 5) {
      out.push({
        kind: "advance_new_supplier",
        agent: "procurement",
        dedupeKey: `advance_new_supplier:${s.id}`,
        title: t(`${s.company} עדיין לא נוצר קשר`,
                 `${s.company} hasn't been contacted yet`),
        detail: t(
          `הספק נוסף לפני ${s.daysSinceUpdate} ימים ועדיין בסטטוס "חדש". נוצרה משימת יצירת קשר.`,
          `Added ${s.daysSinceUpdate} days ago and still marked "new". A first-contact task was created.`,
        ),
        action: {
          type: "create_task",
          title: t(`ליצור קשר ראשוני עם ${s.company}`, `Make first contact with ${s.company}`),
          supplierId: s.id,
          dueInDays: 2,
        },
        confidence: 0.8,
        impact: 5,
        risk: "low",
        supplierId: s.id,
      });
    }

    // Missing contact info on an active supplier.
    if (!s.hasContactInfo && s.status !== "rejected") {
      out.push({
        kind: "missing_contact_info",
        agent: "procurement",
        dedupeKey: `missing_contact_info:${s.id}`,
        title: t(`חסרים פרטי קשר ל-${s.company}`, `${s.company} is missing contact info`),
        detail: t(
          "אין מייל או טלפון — אי אפשר להתקדם מול הספק. נוצרה משימה להשלים פרטים.",
          "No email or phone on record — the pipeline can't move. A task to complete the details was created.",
        ),
        action: {
          type: "create_task",
          title: t(`להשלים פרטי קשר של ${s.company}`, `Fill in contact details for ${s.company}`),
          supplierId: s.id,
          dueInDays: 5,
        },
        confidence: 0.75,
        impact: 4,
        risk: "low",
        supplierId: s.id,
      });
    }
  }

  return out;
}

/* ── Quality Agent · sample + certification discipline ── */

function qualityAgent(w: WorldModel, t: T): Proposal[] {
  const out: Proposal[] = [];

  // Samples received but never scored.
  for (const smp of w.raw.samples) {
    if (smp.finalScore == null) {
      const sup = w.suppliers.find((s) => s.id === smp.supplierId);
      if (!sup) continue;
      out.push({
        kind: "score_pending_sample",
        agent: "quality",
        dedupeKey: `score_pending_sample:${smp.id}`,
        title: t(`דוגמה של ${sup.company} ממתינה לציון`,
                 `A sample from ${sup.company} awaits scoring`),
        detail: t(
          "התקבלה דוגמה שטרם קיבלה ציון סופי. נוצרה משימת טעימה/הערכה.",
          "A received sample has no final score yet. A tasting/evaluation task was created.",
        ),
        action: {
          type: "create_task",
          title: t(`לדרג דוגמה של ${sup.company}`, `Score the sample from ${sup.company}`),
          supplierId: sup.id,
          dueInDays: 4,
        },
        confidence: 0.85,
        impact: 6,
        risk: "low",
        supplierId: sup.id,
      });
    }
  }

  for (const s of w.suppliers) {
    // Approved / negotiating without COA → compliance gap.
    if ((s.status === "approved" || s.status === "negotiation") && !s.hasCoa) {
      out.push({
        kind: "missing_coa",
        agent: "quality",
        dedupeKey: `missing_coa:${s.id}`,
        title: t(`${s.company} בלי תעודת COA`, `${s.company} has no COA on file`),
        detail: t(
          "ספק בשלב מתקדם ללא תעודת אנליזה. נוצרה משימה לדרוש COA לפני התקדמות.",
          "A late-stage supplier without a certificate of analysis. A task to demand a COA was created.",
        ),
        action: {
          type: "create_task",
          title: t(`לדרוש COA מ-${s.company}`, `Request a COA from ${s.company}`),
          supplierId: s.id,
          dueInDays: 3,
        },
        confidence: 0.9,
        impact: 8,
        risk: "low",
        supplierId: s.id,
      });
    }

    // Low average score but still consuming pipeline attention → suggest rejection (human decision).
    if (
      s.avgSampleScore != null &&
      s.avgSampleScore < 5 &&
      s.status !== "rejected" &&
      s.status !== "approved"
    ) {
      out.push({
        kind: "low_score_in_pipeline",
        agent: "quality",
        dedupeKey: `low_score_in_pipeline:${s.id}`,
        title: t(`לשקול לדחות את ${s.company} (ציון ${s.avgSampleScore.toFixed(1)})`,
                 `Consider rejecting ${s.company} (score ${s.avgSampleScore.toFixed(1)})`),
        detail: t(
          `ציון הדוגמאות הממוצע הוא ${s.avgSampleScore.toFixed(1)}/10 — מתחת לרף. ממליץ לדחות ולפנות קשב לספקים חזקים.`,
          `Average sample score is ${s.avgSampleScore.toFixed(1)}/10 — below bar. Recommend rejecting to free attention for stronger suppliers.`,
        ),
        action: {
          type: "suggest_status",
          supplierId: s.id,
          to: "rejected",
          reason: t("ציון דוגמאות נמוך", "Low sample scores"),
        },
        confidence: 0.7,
        impact: 5,
        risk: "medium", // status changes always go through a human
        supplierId: s.id,
      });
    }
  }

  return out;
}

/* ── Finance Agent · price discipline ── */

function financeAgent(w: WorldModel, t: T): Proposal[] {
  const out: Proposal[] = [];
  const DAY = 86_400_000;

  for (const q of w.raw.quotes) {
    const sup = w.suppliers.find((s) => s.id === q.supplierId);
    if (!sup) continue;

    // Price 40%+ above the material median → outlier worth challenging.
    if (q.pricePerKg != null && q.material) {
      const med = w.medianPriceByMaterial[q.material];
      if (med && q.pricePerKg > med * 1.4) {
        out.push({
          kind: "price_outlier",
          agent: "finance",
          dedupeKey: `price_outlier:${q.id}`,
          title: t(`מחיר חריג: ${sup.company} — €${q.pricePerKg.toFixed(2)}`,
                   `Price outlier: ${sup.company} — €${q.pricePerKg.toFixed(2)}`),
          detail: t(
            `ההצעה גבוהה ב-${Math.round(((q.pricePerKg - med) / med) * 100)}% מהחציון (€${med.toFixed(2)}) עבור ${q.material}. נוצרה משימת משא ומתן.`,
            `Quote is ${Math.round(((q.pricePerKg - med) / med) * 100)}% above the €${med.toFixed(2)} median for ${q.material}. A negotiation task was created.`,
          ),
          action: {
            type: "create_task",
            title: t(`לנהל מו"מ על מחיר מול ${sup.company}`, `Negotiate price with ${sup.company}`),
            supplierId: sup.id,
            dueInDays: 5,
          },
          confidence: 0.8,
          impact: 7,
          risk: "low",
          supplierId: sup.id,
        });
      }
    }

    // Quotes older than 60 days lose validity.
    const ageDays = Math.floor((Date.now() - new Date(q.date).getTime()) / DAY);
    if (ageDays > 60) {
      out.push({
        kind: "stale_quote",
        agent: "finance",
        dedupeKey: `stale_quote:${q.id}`,
        title: t(`הצעת מחיר של ${sup.company} בת ${ageDays} ימים`,
                 `${sup.company}'s quote is ${ageDays} days old`),
        detail: t(
          "הצעות מעל 60 יום בדרך כלל כבר לא בתוקף. נוצרה משימה לבקש עדכון.",
          "Quotes older than 60 days are usually void. A task to request a refresh was created.",
        ),
        action: {
          type: "create_task",
          title: t(`לרענן הצעת מחיר מ-${sup.company}`, `Refresh the quote from ${sup.company}`),
          supplierId: sup.id,
          dueInDays: 7,
        },
        confidence: 0.75,
        impact: 5,
        risk: "low",
        supplierId: sup.id,
      });
    }
  }

  return out;
}

/* ── Research Agent · sourcing coverage ── */

function researchAgent(w: WorldModel, t: T): Proposal[] {
  const out: Proposal[] = [];

  // Any category with fewer than 2 active suppliers → thin coverage.
  for (const [cat, count] of Object.entries(w.categoryCounts)) {
    if (count < 2) {
      out.push({
        kind: "thin_category",
        agent: "research",
        dedupeKey: `thin_category:${cat}`,
        title: t(`כיסוי דק בקטגוריית ${cat} (${count} ספק)`,
                 `Thin coverage in ${cat} (${count} supplier)`),
        detail: t(
          "פחות משני ספקים פעילים בקטגוריה — אין כוח מיקוח ואין גיבוי. נוצרה משימת מחקר ספקים.",
          "Fewer than two active suppliers in this category — no leverage and no backup. A supplier-research task was created.",
        ),
        action: {
          type: "create_task",
          title: t(`לאתר ספקים נוספים בקטגוריית ${cat}`, `Source more suppliers in ${cat}`),
          dueInDays: 10,
        },
        confidence: 0.7,
        impact: 6,
        risk: "low",
      });
    }
  }

  // >60% of suppliers in one country → geographic concentration insight.
  const active = w.suppliers.filter((s) => s.status !== "rejected").length;
  for (const [country, count] of Object.entries(w.countryCounts)) {
    if (active >= 3 && count / active > 0.6) {
      out.push({
        kind: "country_concentration",
        agent: "research",
        dedupeKey: `country_concentration:${country}`,
        title: t(`ריכוז גיאוגרפי: ${Math.round((count / active) * 100)}% מהספקים ב-${country}`,
                 `Geographic concentration: ${Math.round((count / active) * 100)}% of suppliers in ${country}`),
        detail: t(
          "תלות במדינה אחת חושפת את שרשרת האספקה לסיכוני שילוח, מכס ומטבע.",
          "Dependence on one country exposes the supply chain to shipping, customs and currency risk.",
        ),
        action: {
          type: "record_insight",
          note: t(`לגוון מקורות מעבר ל-${country}`, `Diversify sourcing beyond ${country}`),
        },
        confidence: 0.75,
        impact: 5,
        risk: "low",
      });
    }
  }

  return out;
}

/* ── Operations Agent · task hygiene ── */

function operationsAgent(w: WorldModel, t: T): Proposal[] {
  const out: Proposal[] = [];

  const overdue = w.raw.tasks.filter(
    (tk) => !tk.done && tk.dueDate && new Date(tk.dueDate).getTime() < Date.now(),
  );
  if (overdue.length >= 3) {
    out.push({
      kind: "overdue_task",
      agent: "operations",
      dedupeKey: `overdue_task:bulk`,
      title: t(`${overdue.length} משימות באיחור`, `${overdue.length} tasks are overdue`),
      detail: t(
        "הצטברות משימות באיחור מאטה את כל הצנרת. מומלץ לפנות בוקר לטיפול מרוכז.",
        "A backlog of overdue tasks slows the whole pipeline. Recommend a focused clearing session.",
      ),
      action: {
        type: "record_insight",
        note: t("לתעדף סגירת משימות באיחור", "Prioritize clearing overdue tasks"),
      },
      confidence: 0.9,
      impact: 6,
      risk: "low",
    });
  }

  // Suppliers untouched 30+ days in mid-pipeline.
  for (const s of w.suppliers) {
    const mid = ["contacted", "sample_requested", "sample_received", "quote_received", "negotiation"];
    if (
      mid.includes(s.status) &&
      s.daysSinceLastEvent != null &&
      s.daysSinceLastEvent > 30
    ) {
      out.push({
        kind: "untouched_supplier",
        agent: "operations",
        dedupeKey: `untouched_supplier:${s.id}`,
        title: t(`${s.company} ללא פעילות ${s.daysSinceLastEvent} ימים`,
                 `${s.company} idle for ${s.daysSinceLastEvent} days`),
        detail: t(
          "אין אירועים חדשים בציר הזמן מעל חודש — הצנרת קפואה. נוצרה משימת חידוש קשר.",
          "No timeline events for over a month — the pipeline froze. A re-engagement task was created.",
        ),
        action: {
          type: "create_task",
          title: t(`לחדש קשר עם ${s.company}`, `Re-engage ${s.company}`),
          supplierId: s.id,
          dueInDays: 3,
        },
        confidence: 0.8,
        impact: 5,
        risk: "low",
        supplierId: s.id,
      });
    }
  }

  return out;
}

/* ── Risk Agent · exposure detection ── */

function riskAgent(w: WorldModel, t: T): Proposal[] {
  const out: Proposal[] = [];

  // Only one approved supplier overall → single point of failure.
  const approved = w.suppliers.filter((s) => s.status === "approved");
  if (approved.length === 1) {
    const s = approved[0];
    out.push({
      kind: "single_source_dependency",
      agent: "risk",
      dedupeKey: "single_source_dependency:global",
      title: t(`תלות בספק יחיד: ${s.company}`, `Single-source dependency: ${s.company}`),
      detail: t(
        "יש רק ספק מאושר אחד. עצירה אצלו עוצרת את הייצור. מומלץ לאשר ספק גיבוי.",
        "Only one approved supplier exists. If they stall, production stalls. Recommend approving a backup.",
      ),
      action: {
        type: "flag_risk",
        note: t("לאשר ספק גיבוי", "Approve a backup supplier"),
        supplierId: s.id,
      },
      confidence: 0.85,
      impact: 8,
      risk: "low",
      supplierId: s.id,
    });
  }

  // Approved supplier with zero files → nothing documented.
  for (const s of w.suppliers) {
    if (s.status === "approved" && s.filesCount === 0) {
      out.push({
        kind: "no_files_approved",
        agent: "risk",
        dedupeKey: `no_files_approved:${s.id}`,
        title: t(`${s.company} מאושר בלי מסמכים`, `${s.company} approved with zero documents`),
        detail: t(
          "אין אף קובץ מתועד לספק מאושר — חוזים, תעודות והצעות חסרים. נוצרה משימת איסוף מסמכים.",
          "No files exist for an approved supplier — contracts, certificates and quotes are missing. A document-collection task was created.",
        ),
        action: {
          type: "create_task",
          title: t(`לאסוף מסמכים מ-${s.company}`, `Collect documents from ${s.company}`),
          supplierId: s.id,
          dueInDays: 7,
        },
        confidence: 0.8,
        impact: 6,
        risk: "low",
        supplierId: s.id,
      });
    }
  }

  return out;
}

/* ── Registry ── */

export type AgentAnalyze = (w: WorldModel, t: T) => Proposal[];

export const AGENT_ANALYZERS: Record<Exclude<AgentId, "executive">, AgentAnalyze> = {
  procurement: procurementAgent,
  quality: qualityAgent,
  finance: financeAgent,
  research: researchAgent,
  operations: operationsAgent,
  risk: riskAgent,
};

export function makeT(lang: Lang): T {
  return (he, en) => (lang === "he" ? he : en);
}
