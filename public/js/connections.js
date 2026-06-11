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

  // YouTube (Phase 1) gets real connect/disconnect controls.
  let actions = '';
  if (p.key === 'youtube') {
    if (!p.configured) {
      actions = `<div class="conn-row"><span class="pill-warn" style="font-size:.78rem">הגדירו YT_CLIENT_ID ו-YT_CLIENT_SECRET כדי לאפשר חיבור.</span></div>`;
    } else if (p.connected) {
      actions = `<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn" data-yt-disconnect>נתק</button>
        <span class="meta" style="align-self:center">פרטיות פרסום: <b>${escapeHtml(p.privacyStatus || 'public')}</b></span>
      </div>`;
    } else {
      actions = `<div style="margin-top:10px"><a class="btn primary" href="${p.authUrlPath}">🔗 התחבר ל-YouTube</a></div>`;
    }
  } else {
    // Other platforms are not built yet in this phase.
    actions = `<div class="conn-row"><span class="meta" style="font-size:.78rem">פרסום לפלטפורמה זו טרם נבנה (Phase 1 = YouTube בלבד).</span></div>`;
  }

  return `
    <div class="conn-card">
      <div class="conn-head">
        <h3>${escapeHtml(p.nameHe)} · ${escapeHtml(p.name)}</h3>
        ${statusPill}
      </div>
      <div class="conn-row"><span class="label">${p.key === 'youtube' ? 'ערוץ' : 'חשבון'}</span><span>${p.accountName ? escapeHtml(p.accountName) : '—'}</span></div>
      <div class="conn-row"><span class="label">בדיקת חיבור אחרונה</span><span>${fmtTime(p.checkedAt)}</span></div>
      <div class="conn-row"><span class="label">יכול להעלות וידאו</span><span>${yesNo(p.canUpload)}</span></div>
      <div class="conn-row"><span class="label">יכול לפרסם</span><span>${yesNo(p.canPublish)}</span></div>
      ${missingCreds}
      <div class="conn-row" style="display:block">
        <span class="label">הרשאות נדרשות</span>
        <ul class="perm-list">${perms}</ul>
      </div>
      ${
        !p.canPublish && p.publishDisabledReason
          ? `<div class="conn-row"><span class="pill-warn" style="font-size:.78rem">${escapeHtml(p.publishDisabledReason)}</span></div>`
          : ''
      }
      ${actions}
    </div>`;
}

function render(platforms) {
  $('#connGrid').innerHTML = platforms.map(connCard).join('');

  // Wire YouTube disconnect (re-rendered each time).
  const disc = $('#connGrid').querySelector('[data-yt-disconnect]');
  if (disc) {
    disc.addEventListener('click', async () => {
      if (!confirm('לנתק את חשבון ה-YouTube?')) return;
      try {
        await api('/api/youtube/disconnect', { method: 'POST' });
        toast('נותק מ-YouTube');
        load();
      } catch (e) {
        toast('שגיאה: ' + e.message);
      }
    });
  }
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

// Surface the result of the OAuth redirect.
(function handleOAuthReturn() {
  const params = new URLSearchParams(location.search);
  const yt = params.get('yt');
  if (yt === 'connected') toast('YouTube חובר בהצלחה ✓');
  else if (yt === 'error') toast('שגיאת חיבור YouTube: ' + (params.get('msg') || ''));
  if (yt) history.replaceState({}, '', location.pathname);
})();

$('#checkBtn').addEventListener('click', check);
load();
