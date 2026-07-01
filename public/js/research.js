// MOOD Social — competitor research + inspiration client.
'use strict';

const $ = (s) => document.querySelector(s);
let health = null;

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
function fmtViews(n) {
  if (n == null) return '';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return String(n);
}

// ---- Asset card ------------------------------------------------------------

function assetCard(a, { saved } = {}) {
  const thumb = a.thumbnail
    ? `<img class="asset-th" src="${esc(a.thumbnail)}" alt="" loading="lazy" />`
    : `<div class="asset-th ph">▶</div>`;
  const stats = [a.views != null ? `👁 ${fmtViews(a.views)}` : '', a.likes != null ? `❤ ${fmtViews(a.likes)}` : '']
    .filter(Boolean).join(' · ');
  const link = a.shortsUrl || a.url;
  const actions = saved
    ? `<button class="btn" data-remove="${esc(a.videoId)}">הסר</button>`
    : `<button class="btn primary" data-save='${esc(JSON.stringify(a))}'>שמור לרעיונות</button>`;
  return `
    <div class="asset">
      ${thumb}
      <div class="asset-body">
        <div class="asset-title">${esc(a.title)}</div>
        <div class="meta">${esc(a.channelTitle || '')}${stats ? ' · ' + stats : ''}${a.demo ? ' · <span class="badge-demo">הדגמה</span>' : ''}</div>
        ${a.adaptNote ? `<div class="adapt">💡 ${esc(a.adaptNote)}</div>` : ''}
        <div class="asset-actions">
          <a class="btn" href="${esc(link)}" target="_blank" rel="noopener">פתח ▶</a>
          ${actions}
        </div>
      </div>
    </div>`;
}

// ---- Competitors -----------------------------------------------------------

function competitorCard(c) {
  const ins = c.insight;
  const recent = (c.recent || []).slice(0, 4);
  return `
    <div class="comp">
      <div class="comp-head">
        <div>
          <b>${esc(c.name)}</b> ${c.demo ? '<span class="badge-demo">הדגמה</span>' : ''}
          <div class="meta">${esc(c.niche || '')}${c.youtube ? ' · ' + esc(c.youtube) : ''}${c.checkedAt ? ' · נבדק' : ''}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn" data-refresh="${esc(c.id)}">↻ רענן</button>
          <button class="btn" data-delcomp="${esc(c.id)}">מחק</button>
        </div>
      </div>
      ${
        ins
          ? `<div class="insight">
              <div class="cap-text">${esc(ins.summary || '')}</div>
              ${arrBlock('מה עובד להם', ins.whatWorks)}
              ${arrBlock('רעיונות ל-MOOD', ins.ideasForMood)}
              ${ins.hooks?.length ? `<div class="meta" style="margin-top:6px">הוקים בהשראה:</div>${ins.hooks.map((h) => `<span class="tag">${esc(h)}</span>`).join('')}` : ''}
            </div>`
          : '<div class="meta" style="margin-top:8px">לחצו "רענן" כדי למשוך תוכן אחרון ותובנות.</div>'
      }
      ${recent.length ? `<div class="section-title">סרטונים אחרונים</div>${recent.map((r) => `<div class="recent-item"><a href="${esc(r.shortsUrl || r.url)}" target="_blank" rel="noopener"><span class="rt">▶</span><span class="rname">${esc(r.title)}<br><span class="meta">${fmtViews(r.views)} צפיות</span></span></a></div>`).join('')}` : ''}
    </div>`;
}
function arrBlock(label, arr) {
  if (!arr || !arr.length) return '';
  return `<div class="meta" style="margin-top:6px">${esc(label)}:</div><ul class="perm-list">${arr.map((x) => `<li>• ${esc(x)}</li>`).join('')}</ul>`;
}

async function loadCompetitors() {
  const { competitors } = await api('/api/competitors');
  const el = $('#competitors');
  el.innerHTML = competitors.length
    ? competitors.map(competitorCard).join('')
    : '<div class="meta">אין מתחרים עדיין. הוסיפו אחד למעלה.</div>';
  el.querySelectorAll('[data-refresh]').forEach((b) =>
    b.addEventListener('click', () => refreshCompetitor(b.dataset.refresh)));
  el.querySelectorAll('[data-delcomp]').forEach((b) =>
    b.addEventListener('click', () => deleteCompetitor(b.dataset.delcomp)));
}
async function addCompetitor() {
  const name = $('#compName').value.trim();
  if (!name) return toast('הזינו שם מתחרה');
  try {
    await api('/api/competitors', { method: 'POST', body: JSON.stringify({
      name, youtube: $('#compYt').value.trim(), niche: $('#compNiche').value.trim(),
    }) });
    $('#compName').value = ''; $('#compYt').value = ''; $('#compNiche').value = '';
    toast('נוסף מתחרה');
    loadCompetitors();
  } catch (e) { toast('שגיאה: ' + e.message); }
}
async function deleteCompetitor(id) {
  if (!confirm('למחוק את המתחרה?')) return;
  try { await api('/api/competitors/' + id, { method: 'DELETE' }); loadCompetitors(); } catch (e) { toast('שגיאה: ' + e.message); }
}
async function refreshCompetitor(id) {
  toast('מושך תוכן ותובנות…');
  try { await api('/api/competitors/' + id + '/refresh', { method: 'POST' }); loadCompetitors(); toast('עודכן ✓'); }
  catch (e) { toast('שגיאה: ' + e.message); }
}

// ---- Discovery + saved -----------------------------------------------------

async function discover() {
  const btn = $('#discoverBtn'); btn.disabled = true;
  $('#discoverResults').innerHTML = '<div class="meta">מחפש רעיונות…</div>';
  try {
    const { assets, mode } = await api('/api/inspiration/discover', {
      method: 'POST', body: JSON.stringify({ query: $('#discoverQuery').value.trim() }),
    });
    renderDiscover(assets, mode);
  } catch (e) {
    $('#discoverResults').innerHTML = '';
    toast('שגיאה: ' + e.message);
  } finally { btn.disabled = false; }
}
function renderDiscover(assets, mode) {
  const el = $('#discoverResults');
  if (!assets.length) { el.innerHTML = '<div class="meta">לא נמצאו תוצאות.</div>'; return; }
  const note = mode && mode.startsWith('live') ? '' : '<div class="meta" style="margin-bottom:6px">מקור: נתוני הדגמה (הגדירו YT_API_KEY לחיפוש חי).</div>';
  el.innerHTML = note + assets.map((a) => assetCard(a, { saved: false })).join('');
  el.querySelectorAll('[data-save]').forEach((b) =>
    b.addEventListener('click', () => saveAsset(JSON.parse(b.dataset.save))));
}
async function saveAsset(asset) {
  try { await api('/api/inspiration/save', { method: 'POST', body: JSON.stringify({ asset }) }); toast('נשמר לרעיונות ✓'); loadSaved(); }
  catch (e) { toast('שגיאה: ' + e.message); }
}
async function loadSaved() {
  const { inspiration } = await api('/api/inspiration');
  const el = $('#savedAssets');
  el.innerHTML = inspiration.length
    ? inspiration.map((a) => assetCard(a, { saved: true })).join('')
    : '<div class="meta">עדיין לא שמרתם רעיונות. גלו והשמרו מהחיפוש.</div>';
  el.querySelectorAll('[data-remove]').forEach((b) =>
    b.addEventListener('click', async () => {
      try { await api('/api/inspiration/' + b.dataset.remove, { method: 'DELETE' }); loadSaved(); } catch (e) { toast('שגיאה: ' + e.message); }
    }));
}

async function loadMode() {
  try {
    health = await api('/api/health');
    const chip = $('#modeChip');
    chip.textContent = health.demoMode ? '🧪 Demo Mode' : '🔧 Real Mode';
    chip.className = 'mode-chip ' + (health.demoMode ? 'demo' : 'real');
  } catch {}
}

$('#addCompBtn').addEventListener('click', addCompetitor);
$('#discoverBtn').addEventListener('click', discover);
loadMode();
loadCompetitors();
loadSaved();
