// Zero-dependency HTTP server: serves the dashboard UI, a JSON API, and
// streams the watched videos (with HTTP range support for in-browser preview).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import {
  config,
  VIDEO_STATUSES,
  APPROVAL_ITEMS,
  PUBLISH_GATED_STATUSES,
} from './config.js';
import * as store from './store.js';
import * as watcher from './watcher.js';
import { runChecks, getConnections } from './platforms.js';
import * as youtube from './youtube.js';
import * as demo from './demo.js';
import * as research from './research.js';
import * as autonomy from './autonomy.js';
import { hasFfmpeg } from './frames.js';
import { isAvailable as transcriptionAvailable } from './transcribe.js';
import { isConfigured as claudeConfigured } from './claude.js';
import crypto from 'node:crypto';

store.load();

// Short-lived OAuth state tokens (CSRF protection for the YouTube flow).
const oauthStates = new Map(); // state -> expiry(ms)
function newOAuthState() {
  const s = crypto.randomBytes(16).toString('hex');
  oauthStates.set(s, Date.now() + 10 * 60 * 1000);
  return s;
}
function consumeOAuthState(s) {
  const exp = oauthStates.get(s);
  oauthStates.delete(s);
  return !!exp && exp > Date.now();
}

function approvalComplete(approval) {
  return APPROVAL_ITEMS.every((i) => approval && approval[i.key]);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function notFound(res, msg = 'Not found') {
  sendJson(res, 404, { error: msg });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

// ---- Static files ----------------------------------------------------------

function serveStatic(req, res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  // Prevent path traversal.
  const safe = path
    .normalize(rel)
    .replace(/^(\.\.[/\\])+/, '')
    .replace(/^\//, '');
  const filePath = path.join(config.publicDir, safe);

  if (!filePath.startsWith(config.publicDir)) return notFound(res);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return notFound(res, 'File not found');
  }
  const ext = path.extname(filePath).toLowerCase();
  const body = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': body.length,
  });
  res.end(body);
}

// ---- Video streaming with range support ------------------------------------

function streamVideo(req, res, id) {
  const video = store.getVideo(id);
  if (!video || !fs.existsSync(video.path)) {
    return notFound(res, 'Video file not found');
  }
  const stat = fs.statSync(video.path);
  const total = stat.size;
  const ext = path.extname(video.path).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  const range = req.headers.range;

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    let start = match && match[1] ? parseInt(match[1], 10) : 0;
    let end = match && match[2] ? parseInt(match[2], 10) : total - 1;
    if (isNaN(start) || start < 0) start = 0;
    if (isNaN(end) || end >= total) end = total - 1;
    if (start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${total}` });
      return res.end();
    }
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': contentType,
    });
    fs.createReadStream(video.path, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(video.path).pipe(res);
  }
}

// ---- API -------------------------------------------------------------------

async function handleApi(req, res, pathname, url) {
  // GET /api/health  — System Health panel data
  if (req.method === 'GET' && pathname === '/api/health') {
    const ytCard = youtube.getCardSync();
    const transcription = await transcriptionAvailable();
    return sendJson(res, 200, {
      ok: true,
      version: '0.1.0',
      demoMode: config.demoMode,
      watchDir: config.watchDir,
      ffmpegAvailable: await hasFfmpeg(),
      claudeConfigured: claudeConfigured(),
      transcriptionConfigured: transcription.configured,
      transcriptionMethod: transcription.method,
      youtubeConfigured: youtube.isConfigured(),
      youtubeConnected: !!ytCard.connected,
      youtubeConnectionIsDemo: !!ytCard.demo,
      researchConfigured: research.isYouTubeConfigured(),
      // Publishing is enabled (YouTube only) but always manual + gated; in demo
      // mode every publish is simulated.
      publishablePlatforms: ['youtube'],
    });
  }

  // GET /api/videos
  if (req.method === 'GET' && pathname === '/api/videos') {
    return sendJson(res, 200, {
      videos: store.listVideos(),
      statuses: VIDEO_STATUSES,
      approvalItems: APPROVAL_ITEMS,
      gatedStatuses: PUBLISH_GATED_STATUSES,
    });
  }

  // GET /api/videos/:id
  let m = pathname.match(/^\/api\/videos\/([^/]+)$/);
  if (m && req.method === 'GET') {
    const v = store.getVideo(m[1]);
    return v ? sendJson(res, 200, v) : notFound(res, 'Video not found');
  }

  // PATCH /api/videos/:id  — update status, edits, transcript and/or approval
  if (m && req.method === 'PATCH') {
    const v = store.getVideo(m[1]);
    if (!v) return notFound(res, 'Video not found');
    const body = await readBody(req);
    const patch = {};

    if (body.edits && typeof body.edits === 'object') {
      patch.edits = { ...v.edits, ...body.edits };
    }

    // Manual transcript editing.
    if (typeof body.transcript === 'string') {
      patch.transcript = {
        ...(v.transcript || {}),
        text: body.transcript,
        available: body.transcript.trim().length > 0,
        editedManually: true,
        source: 'manual',
      };
    }

    // Approval checklist — merge only known boolean items.
    if (body.approval && typeof body.approval === 'object') {
      const merged = { ...(v.approval || {}) };
      for (const item of APPROVAL_ITEMS) {
        if (typeof body.approval[item.key] === 'boolean') {
          merged[item.key] = body.approval[item.key];
        }
      }
      patch.approval = merged;
    }

    // Status change — gate publish-related statuses behind the full checklist.
    if (body.status) {
      if (!VIDEO_STATUSES.includes(body.status)) {
        return sendJson(res, 400, { error: 'Invalid status' });
      }
      if (PUBLISH_GATED_STATUSES.includes(body.status)) {
        const approval = patch.approval || v.approval || {};
        const missing = APPROVAL_ITEMS.filter((i) => !approval[i.key]);
        if (missing.length) {
          return sendJson(res, 422, {
            error: 'Approval checklist incomplete',
            missing: missing.map((i) => i.key),
            message: 'יש להשלים את כל סעיפי רשימת האישור לפני מעבר לסטטוס זה.',
          });
        }
      }
      patch.status = body.status;
    }

    const updated = store.updateVideo(m[1], patch);
    return sendJson(res, 200, updated);
  }

  // POST /api/videos/:id/regenerate-from-transcript
  m = pathname.match(/^\/api\/videos\/([^/]+)\/regenerate-from-transcript$/);
  if (m && req.method === 'POST') {
    const updated = await watcher.regenerateFromTranscript(m[1]);
    return updated ? sendJson(res, 200, updated) : notFound(res, 'Video not found');
  }

  // POST /api/videos/:id/reanalyze
  m = pathname.match(/^\/api\/videos\/([^/]+)\/reanalyze$/);
  if (m && req.method === 'POST') {
    const updated = await watcher.reanalyze(m[1]);
    return updated ? sendJson(res, 200, updated) : notFound(res, 'Video not found');
  }

  // GET /api/videos/:id/file  — stream for preview
  m = pathname.match(/^\/api\/videos\/([^/]+)\/file$/);
  if (m && req.method === 'GET') {
    return streamVideo(req, res, m[1]);
  }

  // POST /api/scan  — trigger an immediate folder scan
  if (req.method === 'POST' && pathname === '/api/scan') {
    await watcher.scan();
    return sendJson(res, 200, { ok: true, videos: store.listVideos() });
  }

  // POST /api/videos/:id/publish/youtube  — manual, gated YouTube Shorts publish
  m = pathname.match(/^\/api\/videos\/([^/]+)\/publish\/youtube$/);
  if (m && req.method === 'POST') {
    return publishYouTube(res, m[1]);
  }

  // GET /api/connections
  if (req.method === 'GET' && pathname === '/api/connections') {
    return sendJson(res, 200, {
      platforms: getConnections(),
      // Phase 1: only YouTube can publish.
      publishablePlatforms: ['youtube'],
    });
  }

  // POST /api/connections/check  — re-run checks (refreshes YouTube live)
  if (req.method === 'POST' && pathname === '/api/connections/check') {
    runChecks();
    try {
      await youtube.recheck();
    } catch (err) {
      console.error('[connections] YouTube recheck failed:', err.message);
    }
    return sendJson(res, 200, {
      platforms: getConnections(),
      publishablePlatforms: ['youtube'],
    });
  }

  // --- YouTube OAuth ---
  // GET /api/youtube/oauth/start  — redirect to Google consent
  if (req.method === 'GET' && pathname === '/api/youtube/oauth/start') {
    if (!youtube.isConfigured()) {
      return sendJson(res, 400, {
        error: 'YouTube OAuth not configured (set YT_CLIENT_ID and YT_CLIENT_SECRET)',
      });
    }
    return redirect(res, youtube.buildAuthUrl(newOAuthState()));
  }

  // GET /api/youtube/oauth/callback  — exchange code, then back to UI
  if (req.method === 'GET' && pathname === '/api/youtube/oauth/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    if (error) return redirect(res, `/connections.html?yt=error&msg=${encodeURIComponent(error)}`);
    if (!code || !state || !consumeOAuthState(state)) {
      return redirect(res, '/connections.html?yt=error&msg=invalid_state');
    }
    try {
      await youtube.exchangeCode(code);
      return redirect(res, '/connections.html?yt=connected');
    } catch (err) {
      return redirect(res, `/connections.html?yt=error&msg=${encodeURIComponent(err.message)}`);
    }
  }

  // POST /api/youtube/disconnect
  if (req.method === 'POST' && pathname === '/api/youtube/disconnect') {
    return sendJson(res, 200, { platform: youtube.disconnect() });
  }

  // --- Autonomous OS ---
  if (req.method === 'GET' && pathname === '/api/os') {
    return sendJson(res, 200, autonomy.snapshot());
  }
  if (req.method === 'POST' && pathname === '/api/os/autonomy') {
    const body = await readBody(req);
    try {
      autonomy.setAutonomy(body.level);
      return sendJson(res, 200, autonomy.snapshot());
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }
  if (req.method === 'POST' && pathname === '/api/os/goals') {
    const body = await readBody(req);
    if (!body.title) return sendJson(res, 400, { error: 'title required' });
    autonomy.addGoal({ title: body.title, description: body.description });
    // Immediately advance once so the user sees work begin.
    autonomy.tick({ force: true });
    return sendJson(res, 200, autonomy.snapshot());
  }
  if (req.method === 'POST' && pathname === '/api/os/tick') {
    autonomy.tick({ force: true });
    return sendJson(res, 200, autonomy.snapshot());
  }
  let dm = pathname.match(/^\/api\/os\/decisions\/([^/]+)$/);
  if (dm && req.method === 'POST') {
    const body = await readBody(req);
    autonomy.resolveDecision(dm[1], body.action === 'approve' ? 'approve' : 'reject');
    return sendJson(res, 200, autonomy.snapshot());
  }
  let om = pathname.match(/^\/api\/os\/opportunities\/([^/]+)$/);
  if (om && req.method === 'POST') {
    const body = await readBody(req);
    if (body.action === 'accept') autonomy.acceptOpportunity(om[1]);
    else autonomy.dismissOpportunity(om[1]);
    return sendJson(res, 200, autonomy.snapshot());
  }

  // --- Competitor research ---
  if (req.method === 'GET' && pathname === '/api/competitors') {
    return sendJson(res, 200, { competitors: store.listCompetitors() });
  }
  if (req.method === 'POST' && pathname === '/api/competitors') {
    const body = await readBody(req);
    if (!body.name) return sendJson(res, 400, { error: 'name required' });
    const id = 'comp-' + crypto.randomBytes(4).toString('hex');
    const c = store.upsertCompetitor({
      id,
      name: String(body.name).slice(0, 120),
      platforms: { youtube: (body.youtube || '').trim() },
      youtube: (body.youtube || '').trim(),
      niche: (body.niche || '').slice(0, 120),
      notes: (body.notes || '').slice(0, 500),
      addedAt: new Date().toISOString(),
      recent: [],
      insight: null,
      checkedAt: null,
    });
    return sendJson(res, 200, c);
  }
  m = pathname.match(/^\/api\/competitors\/([^/]+)$/);
  if (m && req.method === 'DELETE') {
    store.removeCompetitor(m[1]);
    return sendJson(res, 200, { ok: true });
  }
  m = pathname.match(/^\/api\/competitors\/([^/]+)\/refresh$/);
  if (m && req.method === 'POST') {
    return refreshCompetitor(res, m[1]);
  }

  // --- Similar-asset discovery (inspiration) ---
  if (req.method === 'GET' && pathname === '/api/inspiration') {
    return sendJson(res, 200, { inspiration: store.listInspiration() });
  }
  if (req.method === 'POST' && pathname === '/api/inspiration/discover') {
    const body = await readBody(req);
    return discoverAssets(res, body);
  }
  if (req.method === 'POST' && pathname === '/api/inspiration/save') {
    const body = await readBody(req);
    const a = body.asset;
    if (!a || !a.videoId) return sendJson(res, 400, { error: 'asset required' });
    const saved = store.upsertInspiration({ ...a, id: a.videoId, status: 'saved', savedAt: new Date().toISOString() });
    return sendJson(res, 200, saved);
  }
  m = pathname.match(/^\/api\/inspiration\/([^/]+)$/);
  if (m && req.method === 'DELETE') {
    store.removeInspiration(m[1]);
    return sendJson(res, 200, { ok: true });
  }
  if (m && req.method === 'PATCH') {
    const a = store.getInspiration(m[1]);
    if (!a) return notFound(res, 'Not found');
    const body = await readBody(req);
    return sendJson(res, 200, store.upsertInspiration({ ...a, status: body.status || a.status }));
  }

  // --- Demo mode (guarded) ---
  if (pathname.startsWith('/api/demo/')) {
    if (!config.demoMode) {
      return sendJson(res, 403, { error: 'Demo mode is off (set DEMO_MODE=true)' });
    }
    // POST /api/demo/seed — create sample videos if absent
    if (req.method === 'POST' && pathname === '/api/demo/seed') {
      return sendJson(res, 200, { videos: demo.seedDemoVideos() });
    }
    // POST /api/demo/reset — re-seed sample data to its initial state
    if (req.method === 'POST' && pathname === '/api/demo/reset') {
      demo.clearDemoVideos();
      demo.clearDemoResearch();
      demo.clearDemoOS();
      demo.seedDemoResearch();
      demo.seedDemoOS();
      return sendJson(res, 200, { videos: demo.seedDemoVideos(), runTargetId: demo.RUN_TARGET_ID });
    }
    return notFound(res, 'Unknown demo route');
  }

  return notFound(res, 'Unknown API route');
}

// Manual, server-gated YouTube Shorts publish. Re-checks every condition
// server-side regardless of what the client believes.
async function publishYouTube(res, id) {
  const v = store.getVideo(id);
  if (!v) return notFound(res, 'Video not found');

  // Gate 1: status must be Ready to publish.
  if (v.status !== 'Ready to publish') {
    return sendJson(res, 409, {
      error: 'Not ready',
      message: 'יש להעביר את הסטטוס ל"מוכן לפרסום" לפני פרסום.',
    });
  }
  // Gate 2: approval checklist complete.
  if (!approvalComplete(v.approval)) {
    return sendJson(res, 422, {
      error: 'Approval incomplete',
      message: 'יש להשלים את כל סעיפי רשימת האישור לפני פרסום.',
    });
  }
  // Gate 3: YouTube selected as a target platform.
  if (!(v.edits?.platforms || []).includes('youtube')) {
    return sendJson(res, 409, {
      error: 'YouTube not selected',
      message: 'יש לבחור "YouTube Shorts" ברשימת הפלטפורמות.',
    });
  }
  // Gate 4: YouTube connected and able to upload.
  const card = youtube.getCardSync();
  if (!card.canPublish) {
    return sendJson(res, 409, {
      error: 'YouTube not connected',
      message: 'יש להתחבר ל-YouTube בעמוד חיבורי הפלטפורמות.',
    });
  }
  // Demo mode (or a demo video) NEVER publishes for real — it simulates.
  const isDemo = config.demoMode || v.demo;

  // Gate 5: file exists (skipped for demo, which has no real file).
  if (!isDemo && !fs.existsSync(v.path)) {
    return sendJson(res, 409, { error: 'File missing', message: 'קובץ הווידאו לא נמצא.' });
  }

  // Build title/description/tags from the APPROVED edits.
  const caption = (v.edits.caption || '').trim();
  const title = (caption.split('\n')[0] || v.filename).trim().slice(0, 100);
  const hashtags = (v.edits.hashtags || '').trim();
  const tags = hashtags
    .split(/\s+/)
    .map((t) => t.replace(/^#/, ''))
    .filter(Boolean);
  let description = caption;
  if (hashtags) description += `\n\n${hashtags}`;
  if (!/#shorts/i.test(description)) description += `\n#Shorts`;

  // Mark uploading.
  const prevPublish = v.publish || {};
  store.updateVideo(id, {
    publish: { ...prevPublish, youtube: { status: 'uploading', startedAt: new Date().toISOString() } },
  });

  try {
    let result;
    if (isDemo) {
      // Simulated upload — no network, nothing posted.
      const vid = 'DEMO_' + crypto.randomBytes(4).toString('hex');
      result = {
        videoId: vid,
        url: `https://www.youtube.com/shorts/${vid}`,
        publishedAt: new Date().toISOString(),
        privacyStatus: 'unlisted',
        demo: true,
      };
    } else {
      result = await youtube.publishShort({ filePath: v.path, title, description, tags });
    }
    const yt = {
      status: 'published',
      videoId: result.videoId,
      url: result.url,
      publishedAt: result.publishedAt,
      privacyStatus: result.privacyStatus,
      title,
      demo: !!isDemo,
      error: null,
    };
    const history = [
      ...(v.publishHistory || []),
      { platform: 'youtube', status: 'published', at: result.publishedAt, videoId: result.videoId, url: result.url, privacyStatus: result.privacyStatus, demo: !!isDemo },
    ];
    const updated = store.updateVideo(id, {
      status: 'Published',
      publish: { ...prevPublish, youtube: yt },
      publishHistory: history,
    });
    return sendJson(res, 200, updated);
  } catch (err) {
    // Failure: keep status as "Ready to publish" and record the error.
    const yt = { status: 'failed', error: err.message, failedAt: new Date().toISOString() };
    const history = [
      ...(v.publishHistory || []),
      { platform: 'youtube', status: 'failed', at: new Date().toISOString(), error: err.message },
    ];
    const updated = store.updateVideo(id, {
      publish: { ...prevPublish, youtube: yt },
      publishHistory: history,
    });
    return sendJson(res, 502, { error: 'Publish failed', message: err.message, video: updated });
  }
}

// Refresh a competitor's recent content + AI insight (live when keyed).
async function refreshCompetitor(res, id) {
  const c = store.getCompetitor(id);
  if (!c) return notFound(res, 'Competitor not found');
  const ref = c.platforms?.youtube || c.youtube;
  let recent = [];
  let mode = 'demo';
  try {
    if (research.isYouTubeConfigured() && !c.demo && !config.demoMode && ref) {
      recent = await research.competitorRecent(ref, 6);
      mode = 'live';
    } else if (c.demo || config.demoMode) {
      recent = c.recent && c.recent.length ? c.recent : demo.demoCompetitorRecent();
      mode = 'demo';
    } else {
      recent = c.recent || [];
      mode = 'no-key';
    }
  } catch (err) {
    recent = c.recent || [];
    mode = 'error:' + err.message.slice(0, 80);
  }
  let insight = null;
  try {
    insight = await research.competitorInsight(c.name, recent);
  } catch { /* leave null */ }
  const updated = store.upsertCompetitor({ ...c, recent, insight, checkedAt: new Date().toISOString(), refreshMode: mode });
  return sendJson(res, 200, updated);
}

// Discover similar reference assets (links + metadata + adapt notes). Never
// downloads media — inspiration only.
async function discoverAssets(res, body) {
  const q = (body.query || '').trim();
  let assets = [];
  let mode = 'demo';
  if (config.demoMode || !research.isYouTubeConfigured()) {
    assets = demo.demoDiscover();
    mode = config.demoMode ? 'demo' : 'no-key';
  } else {
    const query = q || config.research.keywords.slice(0, 3).join(' ');
    try {
      const found = await research.searchYouTube(query, 8);
      assets = await research.adaptNotes(found);
      mode = 'live';
    } catch (err) {
      assets = demo.demoDiscover();
      mode = 'error:' + err.message.slice(0, 80);
    }
  }
  return sendJson(res, 200, { assets, mode, query: q });
}

// ---- Server ----------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith('/api/')) {
      return await handleApi(req, res, pathname, url);
    }
    return serveStatic(req, res, pathname);
  } catch (err) {
    console.error('[server] Unhandled error:', err);
    if (!res.headersSent) sendJson(res, 500, { error: 'Internal server error' });
    else res.end();
  }
});

server.listen(config.port, config.host, () => {
  console.log('────────────────────────────────────────────');
  console.log('  MOOD — Social Video Review');
  console.log('────────────────────────────────────────────');
  console.log(`  Dashboard:   http://localhost:${config.port}/`);
  console.log(`  Connections: http://localhost:${config.port}/connections.html`);
  console.log(`  Watch dir:   ${config.watchDir}`);
  console.log(
    `  Publishing:  YouTube Shorts only — manual + approval-gated${
      youtube.isConfigured() ? '' : ' (set YT_CLIENT_ID/SECRET to enable)'
    }`,
  );
  console.log('────────────────────────────────────────────');
  watcher.start();

  // Autonomous tick: the org advances safe work on its own when autonomy is on.
  // Bounded per cycle; outward actions still require approval.
  setInterval(() => {
    try {
      const lvl = store.getOS().autonomyLevel;
      if (lvl && lvl !== 'off') autonomy.tick();
    } catch (err) {
      console.error('[autonomy] tick error:', err.message);
    }
  }, 20000);
});

function shutdown() {
  console.log('\n[server] Shutting down…');
  watcher.stop();
  store.saveNow();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
