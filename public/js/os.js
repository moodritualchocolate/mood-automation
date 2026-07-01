// MOOD Autonomous OS — Executive dashboard client.
'use strict';

const $ = (s) => document.querySelector(s);
let snap = null;

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
async function api(path, opts) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}
function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'הרגע';
  if (s < 3600) return `לפני ${Math.floor(s / 60)} ד׳`;
  if (s < 86400) return `לפני ${Math.floor(s / 3600)} ש׳`;
  return `לפני ${Math.floor(s / 86400)} ימים`;
}

const LEVELS = [
  { key: 'off', label: 'כבוי' },
  { key: 'suggest', label: 'מציע' },
  { key: 'auto', label: 'אוטונומי' },
];
const AGENT_NAMES = {};

// ---- Renderers -------------------------------------------------------------

function renderHero() {
  const h = snap.health || { score: 0, label: '' };
  const lvl = snap.autonomyLevel;
  const seg = LEVELS.map((l) =>
    `<button class="seg ${l.key === lvl ? 'active' : ''}" data-level="${l.key}">${l.label}</button>`).join('');
  $('#hero').innerHTML = `
    <div class="os-hero-grid">
      <div class="health-ring" style="--pct:${h.score}">
        <div class="hr-inner"><div class="hr-score">${h.score}</div><div class="hr-label">${esc(h.label)}</div></div>
      </div>
      <div class="hero-mid">
        <div class="hero-title">בריאות העסק</div>
        <div class="meta">עדכון אחרון: ${timeAgo(snap.lastTickAt) || '—'} · ${snap.counts.tasksDone} משימות הושלמו · ${snap.counts.goalsActive} יעדים פעילים</div>
        <div class="autonomy">
          <span class="meta">מצב אוטונומיה:</span>
          <div class="seg-group">${seg}</div>
          <button class="btn" id="tickBtn">⚡ הרץ עכשיו</button>
        </div>
      </div>
      <div class="hero-goal">
        <div class="hero-title">הגדר יעד — המערכת תפרק ותבצע</div>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <input type="text" id="goalInput" placeholder="למשל: להגדיל הכנסות / למצוא ספקים / לשפר SEO" style="flex:1;min-width:180px" />
          <button class="btn primary" id="addGoalBtn">➕ הוסף יעד</button>
        </div>
      </div>
    </div>`;

  $('#hero').querySelectorAll('.seg').forEach((b) =>
    b.addEventListener('click', () => setLevel(b.dataset.level)));
  $('#tickBtn').addEventListener('click', runNow);
  $('#addGoalBtn').addEventListener('click', addGoal);
  $('#goalInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') addGoal(); });
}

function kpi(val, label, cls, sub) {
  return `<div class="kpi ${cls || ''}"><div class="kpi-val">${val}</div><div class="kpi-label">${esc(label)}</div>${sub ? `<div class="kpi-sub meta">${sub}</div>` : ''}</div>`;
}
function renderKpis() {
  const c = snap.counts;
  $('#kpis').innerHTML = [
    kpi(c.tasksDone, 'הושלמו', 'good'),
    kpi(c.tasksActive, 'בעבודה', 'accent'),
    kpi(snap.decisions.length, 'ממתין להחלטתך', c.needsApproval ? 'warn' : ''),
    kpi(c.opportunities, 'הזדמנויות'),
    kpi(c.goalsActive, 'יעדים פעילים'),
    kpi((snap.health || {}).score ?? '—', 'בריאות העסק', 'good'),
  ].join('');
}

const ACT_ICON = { success: '✓', info: '•', warn: '⚠', decision: '🔔' };
const ACT_CLS = { success: 'a-ok', info: 'a-info', warn: 'a-warn', decision: 'a-dec' };
function renderActivity() {
  const el = $('#activity');
  if (!snap.activity.length) { el.innerHTML = '<div class="meta">אין פעילות עדיין.</div>'; return; }
  el.innerHTML = snap.activity.slice(0, 14).map((a) =>
    `<div class="act ${ACT_CLS[a.type] || ''}">
      <span class="act-ic">${ACT_ICON[a.type] || '•'}</span>
      <span class="act-body"><b>${esc(AGENT_NAMES[a.agent] || a.agent)}</b> — ${esc(a.message)}<br><span class="meta">${timeAgo(a.at)}</span></span>
    </div>`).join('');
}

function renderGoals() {
  const el = $('#goals');
  if (!snap.goals.length) { el.innerHTML = '<div class="meta">אין יעדים. הוסיפו יעד למעלה.</div>'; return; }
  el.innerHTML = snap.goals.map((g) =>
    `<div class="goal">
      <div class="goal-head"><b>${esc(g.title)}</b><span class="badge" data-status="${g.status === 'done' ? 'Published' : 'Approved'}">${g.progress}%</span></div>
      ${g.description ? `<div class="meta">${esc(g.description)}</div>` : ''}
      <div class="funnel-bar" style="margin-top:6px"><span style="width:${g.progress}%"></span></div>
    </div>`).join('');
}

function renderDecisions() {
  const el = $('#decisions');
  if (!snap.decisions.length) { el.innerHTML = '<div class="meta pill-ok">אין החלטות פתוחות — הכל תחת שליטה ✓</div>'; return; }
  el.innerHTML = snap.decisions.map((d) =>
    `<div class="decision">
      <b>${esc(d.title)}</b>
      <div class="meta">${esc(d.detail || '')}</div>
      ${d.recommendation ? `<div class="meta pill-warn">המלצה: ${esc(d.recommendation)}</div>` : ''}
      <div class="asset-actions">
        <button class="btn primary" data-approve="${d.id}">אשר</button>
        <button class="btn" data-reject="${d.id}">דחה</button>
      </div>
    </div>`).join('');
  el.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => resolveDecision(b.dataset.approve, 'approve')));
  el.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', () => resolveDecision(b.dataset.reject, 'reject')));
}

function renderOpportunities() {
  const el = $('#opportunities');
  if (!snap.opportunities.length) { el.innerHTML = '<div class="meta">אין הזדמנויות פתוחות כרגע.</div>'; return; }
  el.innerHTML = snap.opportunities.map((o) =>
    `<div class="opp">
      <b>${esc(o.title)}</b>
      <div class="meta">${esc(o.detail || '')}</div>
      <div class="asset-actions">
        <button class="btn primary" data-accept="${o.id}">אמץ ליעד</button>
        <button class="btn" data-dismiss="${o.id}">התעלם</button>
      </div>
    </div>`).join('');
  el.querySelectorAll('[data-accept]').forEach((b) => b.addEventListener('click', () => resolveOpp(b.dataset.accept, 'accept')));
  el.querySelectorAll('[data-dismiss]').forEach((b) => b.addEventListener('click', () => resolveOpp(b.dataset.dismiss, 'dismiss')));
}

function renderAgents() {
  $('#agents').innerHTML = `<div class="agent-grid">${snap.agents.map((a) => {
    AGENT_NAMES[a.id] = a.name;
    return `<div class="agent">
      <div class="agent-name">${esc(a.name)}</div>
      <div class="meta">${esc(a.role)}</div>
      <div class="meta">${a.tasksDone || 0} משימות · <span class="${a.status === 'working' ? 'pill-warn' : 'pill-ok'}">${a.status === 'working' ? 'עובד' : 'פנוי'}</span></div>
    </div>`;
  }).join('')}</div>`;
}

function renderMode() {
  const chip = $('#modeChip');
  if (!chip || !snap.mode) return;
  chip.textContent = snap.mode.demoMode ? '🧪 Demo Mode' : '🔧 Real Mode';
  chip.className = 'mode-chip ' + (snap.mode.demoMode ? 'demo' : 'real');
}

// ---- Actions ---------------------------------------------------------------

async function refresh() {
  try {
    const [os, health] = await Promise.all([
      api('/api/os'),
      api('/api/health').catch(() => null),
    ]);
    snap = os;
    snap.mode = health;
    // Agent names first (used by activity feed).
    snap.agents.forEach((a) => (AGENT_NAMES[a.id] = a.name));
    renderMode();
    renderHero();
    renderKpis();
    renderActivity();
    renderGoals();
    renderDecisions();
    renderOpportunities();
    renderAgents();
  } catch (e) {
    toast('שגיאה: ' + e.message);
  }
}
async function setLevel(level) {
  try { await api('/api/os/autonomy', { method: 'POST', body: JSON.stringify({ level }) }); toast('מצב אוטונומיה: ' + level); refresh(); }
  catch (e) { toast('שגיאה: ' + e.message); }
}
async function runNow() {
  try { await api('/api/os/tick', { method: 'POST' }); toast('הצוות ביצע סבב עבודה ⚡'); refresh(); }
  catch (e) { toast('שגיאה: ' + e.message); }
}
async function addGoal() {
  const title = $('#goalInput').value.trim();
  if (!title) return toast('הזינו יעד');
  try { await api('/api/os/goals', { method: 'POST', body: JSON.stringify({ title }) }); $('#goalInput').value = ''; toast('יעד נוסף — הצוות התחיל לעבוד'); refresh(); }
  catch (e) { toast('שגיאה: ' + e.message); }
}
async function resolveDecision(id, action) {
  try { await api('/api/os/decisions/' + id, { method: 'POST', body: JSON.stringify({ action }) }); toast(action === 'approve' ? 'אושר' : 'נדחה'); refresh(); }
  catch (e) { toast('שגיאה: ' + e.message); }
}
async function resolveOpp(id, action) {
  try { await api('/api/os/opportunities/' + id, { method: 'POST', body: JSON.stringify({ action }) }); toast(action === 'accept' ? 'אומץ ליעד' : 'הוסר'); refresh(); }
  catch (e) { toast('שגיאה: ' + e.message); }
}

refresh();
setInterval(refresh, 7000);
