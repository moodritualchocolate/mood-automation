// Platform Connections — client.
'use strict';

const $ = (s) => document.querySelector(s);

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

function yesNo(v) {
  return v
    ? '<span class="pill-ok">כן</span>'
    : '<span class="pill-bad">לא</span>';
}

function fmtTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('he-IL');
  } catch {
    return iso;
  }
}

function connCard(p) {
  const statusPill = p.connected
    ? '<span class="pill-ok">● מחובר</span>'
    : '<span class="pill-bad">● לא מחובר</span>';

  const perms = (p.requiredPermissions || [])
    .map((perm) => {
      const missing = (p.missingPermissions || []).includes(perm);
      return `<li class="${missing ? 'missing' : ''}">${missing ? '' : '✓ '}${escapeHtml(perm)}</li>`;
    })
    .join('');

  const missingCreds = (p.missingCredentials || []).length
    ? `<div class="conn-row"><span class="label">חסר להגדרה</span><span class="pill-warn">${p.missingCredentials.map(escapeHtml).join(', ')}</span></div>`
    : '';

  return `
    <div class="conn-card">
      <div class="conn-head">
        <h3>${escapeHtml(p.nameHe)} · ${escapeHtml(p.name)}</h3>
        ${statusPill}
      </div>
      <div class="conn-row"><span class="label">חשבון</span><span>${p.accountName ? escapeHtml(p.accountName) : '—'}</span></div>
      <div class="conn-row"><span class="label">בדיקת חיבור אחרונה</span><span>${fmtTime(p.checkedAt)}</span></div>
      <div class="conn-row"><span class="label">יכול להעלות וידאו</span><span>${yesNo(p.canUpload)}</span></div>
      <div class="conn-row"><span class="label">יכול לפרסם</span><span>${yesNo(p.canPublish)}</span></div>
      ${missingCreds}
      <div class="conn-row" style="display:block">
        <span class="label">הרשאות נדרשות</span>
        <ul class="perm-list">${perms}</ul>
      </div>
      ${
        !p.canPublish
          ? `<div class="conn-row"><span class="pill-warn" style="font-size:.78rem">${escapeHtml(p.publishDisabledReason || '')}</span></div>`
          : ''
      }
    </div>`;
}

function render(platforms) {
  $('#connGrid').innerHTML = platforms.map(connCard).join('');
  const latest = platforms
    .map((p) => p.checkedAt)
    .filter(Boolean)
    .sort()
    .pop();
  $('#lastCheck').textContent = latest ? 'נבדק לאחרונה: ' + fmtTime(latest) : '';
}

async function api(path, opts) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function load() {
  try {
    const data = await api('/api/connections');
    render(data.platforms || []);
  } catch (e) {
    toast('שגיאה בטעינה: ' + e.message);
  }
}

async function check() {
  $('#checkBtn').disabled = true;
  try {
    const data = await api('/api/connections/check', { method: 'POST' });
    render(data.platforms || []);
    toast('בדיקת החיבורים הושלמה ✓');
  } catch (e) {
    toast('שגיאה: ' + e.message);
  } finally {
    $('#checkBtn').disabled = false;
  }
}

$('#checkBtn').addEventListener('click', check);
load();
