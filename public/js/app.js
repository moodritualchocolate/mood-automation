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

function capOption(label, text, key) {
  return `
    <div class="cap-option">
      <div class="cap-label">${label}</div>
      <div class="cap-text">${escapeHtml(text)}</div>
      <button class="btn use-btn" data-use-caption="${key}">השתמש בגרסה זו ←</button>
    </div>`;
}

function platformBlock(key, p, suggested) {
  const sug = suggested.includes(key) ? '<span class="pill-ok">מומלץ</span>' : '';
  return `
    <div class="platform-block">
      <h4>${escapeHtml(p.label)} ${sug}</h4>
      <div class="cap-text" style="white-space:pre-wrap;font-size:.84rem">${escapeHtml(p.caption)}</div>
      <div class="kv"><span>האשטגים:</span> ${p.hashtags.map((h) => escapeHtml(h)).join(' ')}</div>
      <div class="kv"><b>זמן מוצע:</b> ${escapeHtml(p.suggestedTime)} · <b>אורך מרבי:</b> ${p.maxDurationSec}s</div>
      <div class="kv">${escapeHtml(p.notes)}</div>
    </div>`;
}

function renderDetail(v) {
  const a = v.analysis || {};
  const r = v.recommendations || {};
  const caps = r.captions || {};
  const tags = r.hashtags || { hebrew: [], english: [] };
  const edits = v.edits || {};
  const platforms = ['instagram', 'tiktok', 'facebook', 'youtube'];

  const notesHtml = (a.readiness?.notes || []).length
    ? `<ul class="notes">${a.readiness.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`
    : `<ul class="notes"><li class="ok">✓ לא נמצאו בעיות מהותיות. הסרטון נראה מוכן.</li></ul>`;

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

        <div class="section-title">הוק לשורה הראשונה</div>
        <div class="cap-text" style="background:var(--surface-2);padding:10px;border-radius:10px">${escapeHtml(r.hook || '')}</div>

        <div class="section-title">הצעות לכותרת (קלִיקֶר בעברית)</div>
        ${capOption('גרסה רגשית', caps.emotional || '', 'emotional')}
        ${capOption('גרסה ישראלית מצחיקה', caps.funny || '', 'funny')}
        ${capOption('גרסת מותג נקייה', caps.brand || '', 'brand')}
        ${capOption('גרסת מכירה ישירה', caps.sales || '', 'sales')}

        <div class="section-title">האשטגים מוצעים</div>
        <div><b style="font-size:.8rem;color:var(--muted)">עברית:</b><br>${tags.hebrew.map((h) => `<span class="tag">${escapeHtml(h)}</span>`).join('')}</div>
        <div style="margin-top:8px"><b style="font-size:.8rem;color:var(--muted)">English:</b><br>${tags.english.map((h) => `<span class="tag">${escapeHtml(h)}</span>`).join('')}</div>
      </div>
    </div>

    <div class="section-title">גרסאות לפי פלטפורמה</div>
    ${platforms.map((k) => (r.platforms?.[k] ? platformBlock(k, r.platforms[k], r.suggestedPlatforms || []) : '')).join('')}

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

  // Wire up actions.
  $('#modalBody').querySelectorAll('[data-use-caption]').forEach((btn) => {
    btn.addEventListener('click', () => {
      $('#editCaption').value = caps[btn.dataset.useCaption] || '';
      toast('הכותרת הוחלפה');
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
