// Social Video Review — dashboard client.
'use strict';

const STATUSES = [
  'New',
  'Needs review',
  'Approved',
  'Ready to publish',
  'Published',
  'Failed',
];
const STATUS_HE = {
  'New': 'חדש',
  'Needs review': 'דורש סקירה',
  'Approved': 'מאושר',
  'Ready to publish': 'מוכן לפרסום',
  'Published': 'פורסם',
  'Failed': 'נכשל',
};

let videos = [];
let filterStatus = '';
let currentId = null;

const $ = (sel) => document.querySelector(sel);

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

async function api(path, opts) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

function fmtSize(bytes) {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}
function fmtDuration(sec) {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}:${String(s).padStart(2, '0')}` : `${s} שׁ׳`;
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

function statusBadge(status) {
  return `<span class="badge" data-status="${status}"><span class="dot"></span>${STATUS_HE[status] || status}</span>`;
}

// ---- Grid ------------------------------------------------------------------

function renderFilter() {
  const sel = $('#statusFilter');
  sel.innerHTML =
    '<option value="">כל הסטטוסים</option>' +
    STATUSES.map((s) => `<option value="${s}">${STATUS_HE[s]}</option>`).join('');
  sel.value = filterStatus;
}

function renderGrid() {
  const grid = $('#grid');
  const empty = $('#empty');
  const list = filterStatus ? videos.filter((v) => v.status === filterStatus) : videos;

  $('#count').textContent = `${list.length} סרטונים`;

  if (!videos.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = list
    .map((v) => {
      const a = v.analysis || {};
      const ready = a.readiness?.ready;
      const readyPill = v.missing
        ? '<span class="pill-bad">⚠ הקובץ חסר</span>'
        : ready
        ? '<span class="pill-ok">✓ מוכן</span>'
        : '<span class="pill-warn">● דורש בדיקה</span>';
      return `
      <div class="card" data-id="${v.id}">
        <div class="thumb" data-action="open">
          <video preload="metadata" muted src="/api/videos/${v.id}/file#t=0.1"></video>
          <div class="play-hint">▶</div>
        </div>
        <div class="body">
          <div class="fname">${escapeHtml(v.filename)}</div>
          <div class="meta">
            <span>${fmtDuration(a.durationSec)}</span>
            <span>${a.aspectRatio || '—'}</span>
            <span>${fmtSize(v.sizeBytes)}</span>
          </div>
          <div>${statusBadge(v.status)} ${readyPill}</div>
        </div>
      </div>`;
    })
    .join('');

  grid.querySelectorAll('.card').forEach((card) => {
    card.querySelector('[data-action="open"]').addEventListener('click', () =>
      openDetail(card.dataset.id),
    );
  });
}

// ---- Detail modal ----------------------------------------------------------

const STYLE_ORDER = ['moodBrand', 'emotional', 'funny', 'directResponse'];
const STYLE_NAMES = {
  moodBrand: 'מותג MOOD',
  emotional: 'רגשי',
  funny: 'הומור ישראלי',
  directResponse: 'מכירה ישירה',
};
const PLATFORM_LABEL_TO_KEY = {
  'Instagram Reels': 'instagram',
  TikTok: 'tiktok',
  'Facebook Reels': 'facebook',
  'YouTube Shorts': 'youtube',
};

const SOURCE_LABELS = {
  'claude-vision': '🟢 ניתוח חזותי באמצעות Claude',
  'claude-text': '🟡 ניתוח Claude (ללא פריימים)',
  'heuristic-fallback': '⚪ תבנית מותג (ללא ניתוח חזותי)',
};

// Renders one style card with hook / caption / CTA / hashtags / platform / time
// plus a button that copies the whole style into the manual-edit fields.
function styleCard(style) {
  const tags = [...(style.hashtags?.hebrew || []), ...(style.hashtags?.english || [])];
  return `
    <div class="platform-block">
      <h4>🎨 ${escapeHtml(style.name)}
        <span class="pill-ok" style="font-weight:400">${escapeHtml(style.suggestedPlatform || '')} · ${escapeHtml(style.suggestedTime || '')}</span>
      </h4>
      <div class="kv"><b>הוק:</b> ${escapeHtml(style.hook || '')}</div>
      <div class="cap-text" style="white-space:pre-wrap;font-size:.85rem;margin-top:6px">${escapeHtml(style.caption || '')}</div>
      <div class="kv" style="margin-top:6px"><b>CTA:</b> ${escapeHtml(style.cta || '')}</div>
      <div style="margin-top:6px">${tags.map((h) => `<span class="tag">${escapeHtml(h)}</span>`).join('')}</div>
      <button class="btn use-btn" data-use-style="${style.key}">השתמש בסגנון זה ←</button>
    </div>`;
}

function renderDetail(v) {
  const a = v.analysis || {};
  const r = v.recommendations || {};
  const styles = r.styles || {};
  const edits = v.edits || {};

  const notesHtml = (a.readiness?.notes || []).length
    ? `<ul class="notes">${a.readiness.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`
    : `<ul class="notes"><li class="ok">✓ לא נמצאו בעיות מהותיות. הסרטון נראה מוכן.</li></ul>`;

  const elementsHtml = (r.detectedElements || []).length
    ? `<div style="margin-top:6px">${r.detectedElements.map((e) => `<span class="tag">${escapeHtml(e)}</span>`).join('')}</div>`
    : '';

  const sourceLabel = SOURCE_LABELS[r.source] || r.source || '';
  const framesNote = r.framesAnalyzed ? ` · ${r.framesAnalyzed} פריימים` : '';

  $('#modalTitle').textContent = v.filename;
  $('#modalBody').innerHTML = `
    <div class="detail-grid">
      <div>
        <div class="section-title">תצוגה מקדימה</div>
        ${
          v.missing
            ? '<div class="empty">⚠ קובץ הווידאו לא נמצא בתיקייה.</div>'
            : `<video class="preview-video" controls preload="metadata" src="/api/videos/${v.id}/file"></video>`
        }

        <div class="section-title">ניתוח הסרטון</div>
        <div class="meta-row"><span>אורך</span><span>${fmtDuration(a.durationSec)}</span></div>
        <div class="meta-row"><span>רזולוציה</span><span>${a.width && a.height ? `${a.width}×${a.height}` : '—'}</span></div>
        <div class="meta-row"><span>יחס מסך</span><span>${a.aspectRatio || '—'}</span></div>
        <div class="meta-row"><span>אודיו</span><span>${a.hasAudio == null ? '—' : a.hasAudio ? 'כן' : 'לא'}</span></div>
        <div class="meta-row"><span>קצב פריימים</span><span>${a.fps || '—'}</span></div>
        <div class="meta-row"><span>קודק</span><span>${a.videoCodec || '—'}</span></div>
        <div class="meta-row"><span>גודל</span><span>${fmtSize(v.sizeBytes)}</span></div>

        <div class="section-title">הערות מוכנות לפרסום</div>
        ${notesHtml}
        <button class="btn" id="reanalyzeBtn" style="margin-top:8px">🔁 נתח מחדש</button>
      </div>

      <div>
        <div class="section-title">סטטוס</div>
        <select id="statusSelect">
          ${STATUSES.map((s) => `<option value="${s}" ${s === v.status ? 'selected' : ''}>${STATUS_HE[s]}</option>`).join('')}
        </select>

        <div class="section-title">ניתוח תוכן הסרטון</div>
        <div class="meta" style="margin-bottom:6px">${escapeHtml(sourceLabel)}${framesNote}</div>
        <div class="cap-text" style="background:var(--surface-2);padding:10px;border-radius:10px;white-space:pre-wrap">${escapeHtml(r.contentAnalysis || '—')}</div>
        ${elementsHtml}
        ${r.fallbackReason ? `<div class="meta pill-warn" style="margin-top:6px">סיבת מעבר לתבנית: ${escapeHtml(r.fallbackReason)}</div>` : ''}
      </div>
    </div>

    <div class="section-title">המלצות לפי סגנון (לחצו "השתמש" כדי למלא את שדות העריכה)</div>
    ${STYLE_ORDER.map((k) => (styles[k] ? styleCard(styles[k]) : '')).join('')}

    <div class="section-title">עריכה ידנית (זה מה שיישמר)</div>
    <label>כותרת (Caption)</label>
    <textarea id="editCaption">${escapeHtml(edits.caption || '')}</textarea>
    <label>האשטגים</label>
    <textarea id="editHashtags" style="min-height:60px">${escapeHtml(edits.hashtags || '')}</textarea>
    <label>קריאה לפעולה (CTA)</label>
    <input type="text" id="editCta" value="${escapeHtml(edits.cta || '')}" />
    <label>פלטפורמות</label>
    <div id="platformChecks" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:4px">
      ${['instagram', 'tiktok', 'facebook', 'youtube']
        .map(
          (k) =>
            `<label style="display:flex;gap:6px;align-items:center;margin:0;color:var(--text)">
              <input type="checkbox" value="${k}" ${(edits.platforms || []).includes(k) ? 'checked' : ''}/> ${k}
            </label>`,
        )
        .join('')}
    </div>
    <label>זמן פרסום מוצע</label>
    <input type="datetime-local" id="editPublishTime" value="${escapeHtml(edits.publishTime || '')}" />

    <div style="display:flex;gap:10px;margin-top:18px">
      <button class="btn primary" id="saveBtn">💾 שמור שינויים</button>
      <span class="meta" style="align-self:center">לא מתבצע פרסום — שמירה בלבד.</span>
    </div>
  `;

  // "Use this style" — copy the whole style into the manual-edit fields.
  $('#modalBody').querySelectorAll('[data-use-style]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const style = styles[btn.dataset.useStyle];
      if (!style) return;
      $('#editCaption').value = style.caption || '';
      $('#editHashtags').value = [
        ...(style.hashtags?.hebrew || []),
        ...(style.hashtags?.english || []),
      ].join(' ');
      $('#editCta').value = style.cta || '';
      const key = PLATFORM_LABEL_TO_KEY[style.suggestedPlatform];
      if (key) {
        $('#platformChecks')
          .querySelectorAll('input[type=checkbox]')
          .forEach((c) => {
            c.checked = c.value === key;
          });
      }
      toast(`הוחל סגנון: ${style.name}`);
    });
  });
  $('#reanalyzeBtn').addEventListener('click', () => reanalyze(v.id));
  $('#saveBtn').addEventListener('click', () => saveEdits(v.id));
  $('#statusSelect').addEventListener('change', (e) => updateStatus(v.id, e.target.value));
}

function openDetail(id) {
  const v = videos.find((x) => x.id === id);
  if (!v) return;
  currentId = id;
  renderDetail(v);
  $('#modalBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDetail() {
  $('#modalBackdrop').classList.remove('open');
  document.body.style.overflow = '';
  currentId = null;
}

// ---- Actions ---------------------------------------------------------------

async function updateStatus(id, status) {
  try {
    const updated = await api(`/api/videos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    mergeVideo(updated);
    renderGrid();
    toast('הסטטוס עודכן');
  } catch (e) {
    toast('שגיאה: ' + e.message);
  }
}

async function saveEdits(id) {
  const edits = {
    caption: $('#editCaption').value,
    hashtags: $('#editHashtags').value,
    cta: $('#editCta').value,
    publishTime: $('#editPublishTime').value,
    platforms: Array.from(
      $('#platformChecks').querySelectorAll('input:checked'),
    ).map((c) => c.value),
  };
  try {
    const updated = await api(`/api/videos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ edits }),
    });
    mergeVideo(updated);
    toast('השינויים נשמרו ✓');
  } catch (e) {
    toast('שגיאה: ' + e.message);
  }
}

async function reanalyze(id) {
  toast('מנתח מחדש…');
  try {
    const updated = await api(`/api/videos/${id}/reanalyze`, { method: 'POST' });
    mergeVideo(updated);
    renderDetail(updated);
    renderGrid();
    toast('הניתוח עודכן ✓');
  } catch (e) {
    toast('שגיאה: ' + e.message);
  }
}

function mergeVideo(updated) {
  const i = videos.findIndex((v) => v.id === updated.id);
  if (i >= 0) videos[i] = updated;
}

async function scan() {
  $('#scanBtn').disabled = true;
  try {
    const data = await api('/api/scan', { method: 'POST' });
    videos = data.videos || [];
    renderGrid();
    toast('הסריקה הושלמה');
  } catch (e) {
    toast('שגיאה: ' + e.message);
  } finally {
    $('#scanBtn').disabled = false;
  }
}

async function loadVideos() {
  try {
    const data = await api('/api/videos');
    videos = data.videos || [];
    renderGrid();
  } catch (e) {
    toast('שגיאה בטעינה: ' + e.message);
  }
}

async function loadHealth() {
  try {
    const h = await api('/api/health');
    $('#watchPath').textContent = 'תיקייה במעקב: ' + h.watchDir;
  } catch {}
}

// ---- Init ------------------------------------------------------------------

function init() {
  renderFilter();
  $('#scanBtn').addEventListener('click', scan);
  $('#statusFilter').addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderGrid();
  });
  $('#closeModal').addEventListener('click', closeDetail);
  $('#modalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modalBackdrop') closeDetail();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentId) closeDetail();
  });

  loadHealth();
  loadVideos();
  // Auto-refresh the grid so newly-dropped videos appear without a manual scan.
  setInterval(() => {
    if (!currentId) loadVideos();
  }, 6000);
}

init();
