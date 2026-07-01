// Autonomous OS core — the "Executive Brain".
//
// Turns goals into plans → tasks → executed work, run by a roster of agents,
// on an autonomous tick loop. Philosophy: automate the safe internal work; route
// anything OUTWARD-FACING (publish, send, spend) to a human-approval "decisions"
// queue. Nothing outward ever executes automatically.
//
// Autonomy levels:
//   off     — the org is paused.
//   suggest — plans goals into tasks + surfaces opportunities, but executes nothing.
//   auto    — also executes SAFE (non-outward) tasks automatically.

import { config } from './config.js';
import * as store from './store.js';

export const AUTONOMY_LEVELS = ['off', 'suggest', 'auto'];

export const AGENT_ROSTER = [
  { id: 'ceo', name: 'מנכ״ל AI', role: 'אסטרטגיה ותעדוף' },
  { id: 'research', name: 'סוכן מחקר', role: 'מתחרים ומגמות' },
  { id: 'marketing', name: 'סוכן שיווק', role: 'קמפיינים ותוכן' },
  { id: 'copywriter', name: 'קופירייטר', role: 'כותרות, הוקים והאשטגים' },
  { id: 'seo', name: 'סוכן SEO', role: 'נראות וחיפוש' },
  { id: 'analytics', name: 'סוכן אנליטיקס', role: 'מדדים ואנומליות' },
  { id: 'social', name: 'סוכן סושיאל', role: 'פרסום מגודר' },
  { id: 'ops', name: 'סוכן תפעול', role: 'תזמון ומשימות' },
  { id: 'finance', name: 'סוכן פיננסים', role: 'עלויות ותקציב' },
];

// Outward task types always require human approval — they never auto-execute.
const OUTWARD_KEYWORDS = ['פרסם', 'העלה', 'שלח', 'תשלום', 'רכש', 'הוצאה', 'publish', 'send', 'email', 'spend', 'buy'];

// ---- helpers ---------------------------------------------------------------

const now = () => new Date().toISOString();
const rid = (p) => p + '-' + Math.random().toString(16).slice(2, 10);

export function ensureAgents() {
  if (store.agents.list().length) return;
  for (const a of AGENT_ROSTER) {
    store.agents.upsert({ ...a, status: 'idle', lastActive: null, tasksDone: 0 });
  }
}

function activity(agent, type, message) {
  return store.addActivity({ at: now(), agent, type, message });
}

function isOutward(title) {
  const t = (title || '').toLowerCase();
  return OUTWARD_KEYWORDS.some((k) => t.includes(k));
}

function score(t) {
  // Higher value, lower effort, higher priority → sooner.
  return (t.value || 3) * 2 + (t.priority || 3) - (t.effort || 3);
}

// ---- Goal decomposition (planning engine) ----------------------------------

// Maps a goal to a concrete task list. Heuristic + keyword based (Claude can be
// layered in later); always returns actionable work.
function planFor(goalTitle) {
  const t = (goalTitle || '').toLowerCase();
  const P = [];
  const add = (title, agent, value, effort) => P.push({ title, agent, value, effort });

  if (/(revenue|מכיר|הכנס|sales|לید|lead)/.test(t)) {
    add('לנתח את המרות הפוסטים האחרונים', 'analytics', 5, 2);
    add('להפיק 5 רעיונות תוכן ממיר', 'copywriter', 4, 2);
    add('לזהות 3 קהלים חדשים לטרגוט', 'marketing', 4, 3);
    add('לפרסם את הסרטון בעל הביצועים הטובים', 'social', 5, 2);
  } else if (/(seo|נראות|חיפוש|search)/.test(t)) {
    add('לבצע ניתוח מילות מפתח לנישה', 'seo', 4, 2);
    add('לשפר תיאורים והאשטגים לפי SEO', 'seo', 3, 2);
    add('לזהות פערי תוכן מול מתחרים', 'research', 4, 3);
  } else if (/(מתחר|competitor|מחקר|research|trend|מגמ)/.test(t)) {
    add('לסרוק מתחרים ולעדכן תובנות', 'research', 4, 2);
    add('לגלות 5 נכסי השראה חדשים', 'research', 4, 2);
    add('לתרגם מגמות ל-3 רעיונות ל-MOOD', 'copywriter', 4, 2);
  } else if (/(cost|עלות|תקציב|budget|reduce)/.test(t)) {
    add('למפות עלויות תוכן ופרסום', 'finance', 4, 2);
    add('להמליץ על אופטימיזציית תקציב', 'finance', 4, 3);
  } else if (/(product|מוצר|launch|השק)/.test(t)) {
    add('לנתח ביקוש למוצר בנישה', 'research', 4, 3);
    add('להכין קונספט השקה + הוקים', 'copywriter', 4, 2);
    add('לבנות תוכנית קמפיין השקה', 'marketing', 5, 3);
  } else {
    add('לפרק את היעד למשימות מדידות', 'ceo', 4, 2);
    add('לאסוף נתונים רלוונטיים', 'analytics', 3, 2);
    add('להפיק המלצת פעולה ראשונה', 'ceo', 4, 2);
  }
  return P;
}

// ---- Goals & tasks ---------------------------------------------------------

export function addGoal({ title, description }) {
  ensureAgents();
  const goal = store.goals.upsert({
    id: rid('goal'),
    title: title.slice(0, 160),
    description: (description || '').slice(0, 500),
    status: 'active',
    progress: 0,
    createdAt: now(),
  });
  const drafts = planFor(title + ' ' + (description || ''));
  for (const d of drafts) {
    store.osTasks.upsert({
      id: rid('task'),
      goalId: goal.id,
      title: d.title,
      agent: d.agent,
      priority: 3,
      value: d.value,
      effort: d.effort,
      outward: isOutward(d.title),
      status: 'queued',
      createdAt: now(),
      updatedAt: now(),
      result: null,
    });
  }
  activity('ceo', 'info', `יעד חדש התקבל: "${goal.title}". פורק ל-${drafts.length} משימות.`);
  updateGoalProgress(goal.id);
  return goal;
}

function updateGoalProgress(goalId) {
  const tasks = store.osTasks.list().filter((t) => t.goalId === goalId);
  if (!tasks.length) return;
  const done = tasks.filter((t) => t.status === 'done').length;
  const g = store.goals.get(goalId);
  if (g) {
    const progress = Math.round((done / tasks.length) * 100);
    store.goals.upsert({ ...g, progress, status: progress >= 100 ? 'done' : g.status });
  }
}

// Produces a concise result for a safe internal task (the "work product").
function workProduct(task) {
  const byAgent = {
    analytics: 'נותחו הנתונים: זוהתה עלייה של 18% בשמירות ווידאו קצר בבוקר עובד טוב יותר.',
    copywriter: 'הופקו 3 הוקים בעברית + וריאציית כיתוב מוכנה לסקירה.',
    research: 'נסרקו מתחרים ועודכנו תובנות; זוהו 4 נכסי השראה רלוונטיים.',
    marketing: 'הוגדר סקיצת קמפיין עם קהל יעד ומסר מרכזי.',
    seo: 'הופקו מילות מפתח ותיאורים משופרים לנישה.',
    finance: 'מופתה עלות לפוסט; זוהתה הזדמנות חיסכון של ~12%.',
    ceo: 'גובשה המלצת פעולה מתועדפת עם צעד הבא ברור.',
    ops: 'סודרו תלויות ותוזמנו המשימות הבאות.',
  };
  return byAgent[task.agent] || `הושלם: ${task.title}.`;
}

function executeTask(task) {
  const agent = store.agents.get(task.agent);
  const result = workProduct(task);
  store.osTasks.upsert({ ...task, status: 'done', result, updatedAt: now() });
  if (agent) store.agents.upsert({ ...agent, status: 'idle', lastActive: now(), tasksDone: (agent.tasksDone || 0) + 1 });
  activity(task.agent, 'success', `${task.title} — ${result}`);
  updateGoalProgress(task.goalId);
}

function routeOutward(task) {
  store.osTasks.upsert({ ...task, status: 'needs_approval', updatedAt: now() });
  const dec = store.decisions.upsert({
    id: rid('dec'),
    at: now(),
    title: `אישור נדרש: ${task.title}`,
    detail: 'פעולה חיצונית (פרסום/שליחה) — דורשת אישור אנושי לפי מדיניות הבטיחות.',
    taskId: task.id,
    recommendation: 'מומלץ לאשר לאחר בדיקה קצרה.',
    status: 'pending',
  });
  activity(task.agent, 'decision', `הוכן ל"${task.title}" וממתין לאישורך.`);
  return dec;
}

// ---- Initiative / opportunity engine ---------------------------------------

const OPP_POOL = [
  { title: 'מגמת ASMR קקאו עולה', detail: 'זוהתה עלייה בסרטוני ASMR של הכנת קקאו — הזדמנות לסדרה קצרה.', source: 'research', value: 4 },
  { title: 'פער תוכן: "קפה מול קקאו"', detail: 'מתחרים מרוויחים מזווית ההשוואה; אין לנו עדיין תוכן כזה.', source: 'research', value: 4 },
  { title: 'שעת פרסום אופטימלית 19:30', detail: 'הנתונים מצביעים על מעורבות גבוהה יותר ב-19:30 בימי חול.', source: 'analytics', value: 3 },
  { title: 'חיסכון עלויות בעריכה', detail: 'ניתן לאחד תבניות עריכה ולחסוך ~12% זמן הפקה.', source: 'finance', value: 3 },
  { title: 'האשטג טרנדי #טקס_בוקר', detail: 'האשטג צובר תאוצה בנישה — כדאי לשלב בפוסטים הבאים.', source: 'seo', value: 3 },
];

function generateOpportunity() {
  const active = store.opportunities.list().filter((o) => o.status === 'new');
  if (active.length >= 6) return null;
  const seen = new Set(store.opportunities.list().map((o) => o.title));
  const pick = OPP_POOL.find((o) => !seen.has(o.title));
  if (!pick) return null;
  const opp = store.opportunities.upsert({ id: rid('opp'), at: now(), status: 'new', ...pick });
  activity(pick.source, 'info', `הזדמנות זוהתה: ${pick.title}.`);
  return opp;
}

export function acceptOpportunity(id) {
  const o = store.opportunities.get(id);
  if (!o) return null;
  store.opportunities.upsert({ ...o, status: 'accepted' });
  const goal = addGoal({ title: o.title, description: o.detail });
  activity('ceo', 'success', `הזדמנות אומצה והפכה ליעד: ${o.title}.`);
  return goal;
}
export function dismissOpportunity(id) {
  const o = store.opportunities.get(id);
  if (o) store.opportunities.upsert({ ...o, status: 'dismissed' });
}

// ---- Decisions (human-in-the-loop) -----------------------------------------

export function resolveDecision(id, action) {
  const d = store.decisions.get(id);
  if (!d) return null;
  const task = d.taskId ? store.osTasks.get(d.taskId) : null;
  if (action === 'approve') {
    store.decisions.upsert({ ...d, status: 'approved', resolvedAt: now() });
    if (task) {
      // Approval clears the gate; the actual outward action still runs through
      // its own module (e.g. YouTube publish) — never silently here.
      store.osTasks.upsert({ ...task, status: 'done', result: 'אושר ידנית — מוכן לביצוע במודול הייעודי', updatedAt: now() });
      updateGoalProgress(task.goalId);
    }
    activity('ceo', 'success', `אישרת: ${d.title}.`);
  } else {
    store.decisions.upsert({ ...d, status: 'rejected', resolvedAt: now() });
    if (task) store.osTasks.upsert({ ...task, status: 'cancelled', updatedAt: now() });
    activity('ceo', 'warn', `נדחה: ${d.title}.`);
  }
  return store.decisions.get(id);
}

// ---- Health ----------------------------------------------------------------

function computeHealth() {
  const tasks = store.osTasks.list();
  const done = tasks.filter((t) => t.status === 'done').length;
  const total = tasks.length || 1;
  const pending = tasks.filter((t) => ['queued', 'in_progress'].includes(t.status)).length;
  const decisionsOpen = store.decisions.list().filter((d) => d.status === 'pending').length;
  const score = Math.max(20, Math.min(99, Math.round((done / total) * 70) + 25 - decisionsOpen * 3));
  const label = score >= 80 ? 'מצוין' : score >= 60 ? 'טוב' : score >= 40 ? 'סביר' : 'דורש תשומת לב';
  return {
    score,
    label,
    tasksDone: done,
    tasksPending: pending,
    decisionsOpen,
    updatedAt: now(),
  };
}

// ---- The autonomous tick ---------------------------------------------------

export function tick({ force = false } = {}) {
  ensureAgents();
  const os = store.getOS();
  const level = os.autonomyLevel || 'off';
  if (level === 'off' && !force) {
    store.setOS({ health: computeHealth() });
    return { level, advanced: 0 };
  }

  let advanced = 0;
  const ready = store.osTasks
    .list()
    .filter((t) => t.status === 'queued')
    .sort((a, b) => score(b) - score(a));

  // Bounded work per tick keeps the org calm and predictable.
  const budget = 3;
  for (const t of ready.slice(0, budget)) {
    if (level === 'suggest' && !force) break; // suggest = plan only, no execution
    if (t.outward) routeOutward(t);
    else executeTask(t);
    advanced++;
  }

  // Initiative: surface a new opportunity occasionally.
  if (level !== 'off' && (advanced === 0 || Math.random() < 0.4)) {
    generateOpportunity();
  }

  const health = computeHealth();
  store.setOS({ lastTickAt: now(), health });
  return { level, advanced, health };
}

export function setAutonomy(level) {
  if (!AUTONOMY_LEVELS.includes(level)) throw new Error('invalid level');
  store.setOS({ autonomyLevel: level });
  activity('ceo', 'info', `מצב אוטונומיה שונה ל: ${level}.`);
  return store.getOS();
}

// ---- Aggregate snapshot for the dashboard ----------------------------------

export function snapshot() {
  ensureAgents();
  const os = store.getOS();
  const tasks = store.osTasks.list();
  return {
    autonomyLevel: os.autonomyLevel || 'off',
    lastTickAt: os.lastTickAt,
    health: os.health || computeHealth(),
    goals: store.goals.list().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    tasks,
    agents: store.agents.list(),
    activity: store.listActivity(40),
    opportunities: store.opportunities.list().filter((o) => o.status === 'new'),
    decisions: store.decisions.list().filter((d) => d.status === 'pending'),
    counts: {
      tasksDone: tasks.filter((t) => t.status === 'done').length,
      tasksActive: tasks.filter((t) => ['queued', 'in_progress'].includes(t.status)).length,
      needsApproval: tasks.filter((t) => t.status === 'needs_approval').length,
      goalsActive: store.goals.list().filter((g) => g.status === 'active').length,
      opportunities: store.opportunities.list().filter((o) => o.status === 'new').length,
    },
  };
}
