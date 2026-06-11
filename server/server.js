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

store.load();

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
  // GET /api/health
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      watchDir: config.watchDir,
      version: '0.1.0',
      publishingEnabled: false,
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

  // GET /api/connections
  if (req.method === 'GET' && pathname === '/api/connections') {
    return sendJson(res, 200, { platforms: getConnections(), publishingEnabled: false });
  }

  // POST /api/connections/check  — re-run connection checks
  if (req.method === 'POST' && pathname === '/api/connections/check') {
    return sendJson(res, 200, { platforms: runChecks(), publishingEnabled: false });
  }

  return notFound(res, 'Unknown API route');
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
  console.log('  MOOD — Social Video Review (v1, review only)');
  console.log('────────────────────────────────────────────');
  console.log(`  Dashboard:   http://localhost:${config.port}/`);
  console.log(`  Connections: http://localhost:${config.port}/connections.html`);
  console.log(`  Watch dir:   ${config.watchDir}`);
  console.log('  Publishing:  DISABLED (review & recommendations only)');
  console.log('────────────────────────────────────────────');
  watcher.start();
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
