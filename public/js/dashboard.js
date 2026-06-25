// MOOD Social — Overview dashboard client.
'use strict';

const STATUS_HE = {
  'New': 'חדש',
  'Needs review': 'דורש סקירה',
  'Approved': 'מאושר',
  'Ready to publish': 'מוכן לפרסום',
  'Published': 'פורסם',
  'Failed': 'נכשל',
};
const FUNNEL = ['New', 'Needs review', 'Approved', 'Ready to publish', 'Published'];
let APPROVAL_ITEMS = [
  { key: 'captionReviewed' }, { key: 'hashtagsReviewed' }, { key: 'platformSelected' },
  { key: 'previewChecked' }, { key: 'rightsConfirmed' }, { key: 'publishTimeSelected' },
];

let health = null;
let videos = [];
let connections = [];

const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
async function api(path, opts) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}
function flag(v) {
  return v ? '<span class="flag-yes">כן</span>' : '<span class="flag-no">לא</span>';
}
function approvalComplete(a) {
  return APPROVAL_ITEMS.every((i) => (a || {})[i.key]);
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('he-IL'); } catch { return iso; }
}

// ---- Renderers -------------------------------------------------------------

function renderModeChip() {
  const chip = $('#modeChip');
  if (!chip || !health) return;
  chip.textContent = health.demoMode ? '🧪 Demo Mode' : '🔧 Real Mode';
  chip.className = 'mode-chip ' + (health.demoMode ? 'demo' : 'real');
}

function countBy(status) {
  return videos.filter((v) => v.status === status).length;
}

function renderKpis() {
  const transcripts = videos.filter((v) => v.transcript?.available).length;
  const cards = [
    { val: videos.length, label: 'סה״כ סרטונים', cls: 'accent' },
    { val: countBy('New'), label: 'חדשים' },
    { val: countBy('Ready to publish'), label: 'מוכנים לפרסום', cls: 'warn' },
    { val: countBy('Published'), label: 'פורסמו', cls: 'good' },
    { val: countBy('Failed'), label: 'נכשלו', cls: countBy('Failed') ? 'bad' : '' },
    { val: transcripts, label: 'עם תמלול', sub: '🎙' },
  ];
  $('#kpis').innerHTML = cards
    .map(
      (c) => `<div class="kpi ${c.cls || ''}">
        <div class="kpi-val">${c.val}</div>
        <div class="kpi-label">${escapeHtml(c.label)}</div>
        ${c.sub ? `<div class="kpi-sub meta">${c.sub}</div>` : ''}
      </div>`,
    )
    .join('');
}

function renderFunnel() {
  const max = Math.max(1, videos.length);
  $('#funnel').innerHTML = FUNNEL.map((s) => {
    const n = countBy(s);
    const pct = Math.round((n / max) * 100);
    return `<div class="funnel-row">
      <span class="badge" data-status="${s}"><span class="dot"></span>${STATUS_HE[s]}</span>
      <span class="funnel-bar"><span style="width:${pct}%"></span></span>
      <span class="fn-count">${n}</span>
    </div>`;
  }).join('');
}

function statusBadge(status) {
  return `<span class="badge" data-status="${status}"><span class="dot"></span>${STATUS_HE[status] || status}</span>`;
}

function renderRecent() {
  const list = videos.slice(0, 6);
  if (!list.length) {
    $('#recent').innerHTML = '<div class="meta">אין סרטונים עדיין. הוסיפו וידאו או הריצו הדגמה.</div>';
    return;
  }
  $('#recent').innerHTML = list
    .map(
      (v) => `<div class="recent-item">
        <a href="/review.html">
          <span class="rt">${v.demo ? '🎬' : '🎞'}</span>
          <span class="rname">${escapeHtml(v.filename)}
            ${v.demo ? '<span class="badge-demo">הדגמה</span>' : ''}
            ${v.transcript?.available ? ' 🎙' : ''}
            <br><span class="meta">${fmtDateTime(v.addedAt)}</span>
          </span>
        </a>
        ${statusBadge(v.status)}
      </div>`,
    )
    .join('');
}

function renderHealth() {
  if (!health) return;
  const ytLine = health.youtubeConnected
    ? `<span class="flag-yes">מחובר${health.youtubeConnectionIsDemo ? ' (הדגמה)' : ''}</span>`
    : '<span class="flag-no">לא מחובר</span>';
  $('#health').innerHTML = `
    <div class="health-row"><span class="label">תיקיית מעקב</span><span style="direction:ltr;font-size:.76rem">${escapeHtml(health.watchDir)}</span></div>
    <div class="health-row"><span class="label">ffmpeg זמין</span>${flag(health.ffmpegAvailable)}</div>
    <div class="health-row"><span class="label">מפתח Claude מוגדר</span>${flag(health.claudeConfigured)}</div>
    <div class="health-row"><span class="label">תמלול מוגדר</span>${flag(health.transcriptionConfigured)}</div>
    <div class="health-row"><span class="label">פרטי YouTube מוגדרים</span>${flag(health.youtubeConfigured)}</div>
    <div class="health-row"><span class="label">YouTube מחובר</span>${ytLine}</div>`;
}

function renderConnections() {
  if (!connections.length) { $('#connections').innerHTML = '<div class="meta">—</div>'; return; }
  $('#connections').innerHTML = connections
    .map((p) => {
      const state = p.connected
        ? `<span class="flag-yes">מחובר${p.demo ? ' (הדגמה)' : ''}</span>`
        : p.key === 'youtube'
        ? '<span class="flag-no">לא מחובר</span>'
        : '<span class="meta">לא נבנה</span>';
      const pub = p.canPublish ? ' · <span class="pill-ok">פרסום זמין</span>' : '';
      return `<div class="conn-line"><span>${escapeHtml(p.nameHe)} · ${escapeHtml(p.name)}</span><span>${state}${pub}</span></div>`;
    })
    .join('');
}

function renderSteps() {
  const any = (fn) => videos.some(fn);
  const steps = [
    { t: 'שלב 1: הוספת סרטון', done: videos.length > 0 },
    { t: 'שלב 2: סקירת ההמלצות', done: any((v) => v.recommendations?.styles) },
    { t: 'שלב 3: עריכת כותרת/האשטגים/CTA', done: any((v) => v.approval?.captionReviewed) },
    { t: 'שלב 4: השלמת רשימת האישור', done: any((v) => approvalComplete(v.approval)) },
    { t: 'שלב 5: חיבור YouTube', done: !!health?.youtubeConnected },
    { t: 'שלב 6: העלאת בדיקה כ-Unlisted', done: any((v) => (v.publishHistory || []).length > 0) },
    { t: 'שלב 7: פרסום ידני', done: any((v) => v.status === 'Published') },
  ];
  $('#steps').innerHTML = steps
    .map(
      (s, i) => `<li class="${s.done ? 'done' : ''}">
        <span class="num">${s.done ? '✓' : i + 1}</span>
        <span class="step-text">${escapeHtml(s.t)}</span>
      </li>`,
    )
    .join('');
}

function renderQuickActions() {
  const demo = !!health?.demoMode;
  $('#quickActions').innerHTML = `
    <button class="btn primary" id="scanBtn">🔄 סרוק תיקייה</button>
    <a class="btn" href="/review.html">🎬 סקירת סרטונים</a>
    <a class="btn" href="/connections.html">🔌 חיבורים</a>
    ${demo ? '<button class="btn primary" id="runDemoBtn">▶️ הרץ הדגמה מלאה</button><button class="btn" id="resetDemoBtn">↺ אפס הדגמה</button>' : ''}
    <div class="spacer"></div>
    <span class="meta" id="lastUpdated"></span>`;

  $('#scanBtn').addEventListener('click', async () => {
    try { await api('/api/scan', { method: 'POST' }); await refresh(); toast('סריקה הושלמה'); }
    catch (e) { toast('שגיאה: ' + e.message); }
  });
  const run = $('#runDemoBtn');
  if (run) run.addEventListener('click', runFullDemo);
  const reset = $('#resetDemoBtn');
  if (reset) reset.addEventListener('click', async () => {
    try { await api('/api/demo/reset', { method: 'POST' }); await refresh(); toast('ההדגמה אופסה'); }
    catch (e) { toast('שגיאה: ' + e.message); }
  });
}

// ---- Run Full Demo (drives the real gated endpoints; publish is simulated) --

async function runFullDemo() {
  const btn = $('#runDemoBtn');
  if (btn) btn.disabled = true;
  try {
    const reset = await api('/api/demo/reset', { method: 'POST' });
    const id = reset.runTargetId || 'demo-new';
    await refresh();

    toast('שלב 1: זוהה סרטון חדש 🎬'); await sleep(900);
    toast('שלב 2: המלצות Claude מוכנות ✓'); await sleep(900);

    const v = videos.find((x) => x.id === id);
    const s = v?.recommendations?.styles?.moodBrand || {};
    await api(`/api/videos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        edits: {
          caption: s.caption || '',
          hashtags: [...(s.hashtags?.hebrew || []), ...(s.hashtags?.english || [])].join(' '),
          cta: s.cta || '', platforms: ['youtube'],
        },
      }),
    });
    toast('שלב 3: כותרת/האשטגים/CTA נערכו ✓'); await sleep(900);

    const approval = {};
    APPROVAL_ITEMS.forEach((i) => (approval[i.key] = true));
    await api(`/api/videos/${id}`, { method: 'PATCH', body: JSON.stringify({ approval }) });
    toast('שלב 4: רשימת האישור הושלמה ✓'); await sleep(900);

    await api(`/api/videos/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Ready to publish' }) });
    toast('שלב 5: מוכן לפרסום · YouTube מחובר (הדגמה) ✓'); await sleep(900);

    toast('שלב 6: מבצע העלאת בדיקה (Unlisted)…');
    await api(`/api/videos/${id}/publish/youtube`, { method: 'POST' });
    await sleep(700);
    toast('שלב 7: פורסם בהדגמה — לא פורסם דבר באמת ✅');

    await refresh();
  } catch (e) {
    toast('שגיאה בהדגמה: ' + e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ---- Load + render ---------------------------------------------------------

async function refresh() {
  const [h, vd, cn] = await Promise.all([
    api('/api/health').catch(() => null),
    api('/api/videos').catch(() => ({ videos: [] })),
    api('/api/connections').catch(() => ({ platforms: [] })),
  ]);
  health = h;
  videos = vd.videos || [];
  if (Array.isArray(vd.approvalItems) && vd.approvalItems.length) APPROVAL_ITEMS = vd.approvalItems;
  connections = cn.platforms || [];

  renderModeChip();
  renderQuickActions();
  renderKpis();
  renderFunnel();
  renderRecent();
  renderHealth();
  renderConnections();
  renderSteps();
  const lu = $('#lastUpdated');
  if (lu) lu.textContent = 'עודכן: ' + new Date().toLocaleTimeString('he-IL');
}

refresh();
setInterval(refresh, 8000);
