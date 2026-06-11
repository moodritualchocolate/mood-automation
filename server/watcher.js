// Watches the configured folder for new/changed videos. Uses fs.watch for
// instant detection plus an interval re-scan as a robustness net (fs.watch is
// unreliable across platforms and network filesystems).
//
// When a new video is detected it is analyzed and given recommendations, then
// stored with status "New".

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config, APPROVAL_ITEMS } from './config.js';
import { analyzeVideo } from './analyzer.js';
import { generateRecommendations } from './recommend.js';
import { transcribe } from './transcribe.js';
import {
  listVideos,
  getVideoByPath,
  upsertVideo,
  getVideo,
  updateVideo,
  removeVideo,
} from './store.js';

// Tracks files we're already processing so concurrent events don't double-add.
const inFlight = new Set();

// Maps a suggested platform label (from recommendations) to the checkbox keys
// used by the manual-edit "Platforms" field.
const PLATFORM_LABEL_TO_KEY = {
  'Instagram Reels': 'instagram',
  TikTok: 'tiktok',
  'Facebook Reels': 'facebook',
  'YouTube Shorts': 'youtube',
};

function isVideo(file) {
  return config.videoExtensions.includes(path.extname(file).toLowerCase());
}

// Fresh, all-unchecked approval checklist.
function defaultApproval() {
  return Object.fromEntries(APPROVAL_ITEMS.map((i) => [i.key, false]));
}

// Normalizes a transcribe() result into the stored transcript record.
function transcriptRecord(result) {
  return {
    available: !!(result && result.text),
    text: result?.text || '',
    language: result?.language || null,
    source: result?.source || 'none',
    transcribedAt: new Date().toISOString(),
    editedManually: false,
  };
}

// Builds the initial manual-edit draft from the MOOD Brand style.
function defaultEdits(recommendations) {
  const s = recommendations?.styles?.moodBrand || {};
  const hashtags = [
    ...(s.hashtags?.hebrew || []),
    ...(s.hashtags?.english || []),
  ].join(' ');
  const key = PLATFORM_LABEL_TO_KEY[s.suggestedPlatform];
  return {
    caption: s.caption || '',
    hashtags,
    cta: s.cta || '',
    platforms: key ? [key] : [],
    publishTime: '',
  };
}

function makeId(absPath) {
  return crypto.createHash('sha1').update(absPath).digest('hex').slice(0, 12);
}

// Waits until a file stops growing — handles partially-copied uploads.
async function waitUntilStable(absPath, { tries = 10, intervalMs = 600 } = {}) {
  let lastSize = -1;
  for (let i = 0; i < tries; i++) {
    let size;
    try {
      size = fs.statSync(absPath).size;
    } catch {
      return false; // file vanished
    }
    if (size > 0 && size === lastSize) return true;
    lastSize = size;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return true; // give up waiting, proceed anyway
}

async function processFile(absPath) {
  if (inFlight.has(absPath)) return;
  if (!isVideo(absPath)) return;
  if (getVideoByPath(absPath)) return; // already known

  inFlight.add(absPath);
  try {
    const stable = await waitUntilStable(absPath);
    if (!stable || !fs.existsSync(absPath)) return;
    if (getVideoByPath(absPath)) return; // re-check after the wait

    const stat = fs.statSync(absPath);
    const filename = path.basename(absPath);
    const id = makeId(absPath);

    console.log(`[watcher] New video detected: ${filename}`);

    const analysis = await analyzeVideo(absPath);

    // Transcribe speech (best-effort; null when no audio / no transcriber).
    const transcriptResult = await transcribe({ filePath: absPath, meta: analysis });
    const transcript = transcriptRecord(transcriptResult);

    const recommendations = await generateRecommendations({
      filePath: absPath,
      filename,
      analysis,
      transcript: transcript.text,
    });

    const now = new Date().toISOString();
    const video = {
      id,
      filename,
      path: absPath,
      relPath: path.relative(config.watchDir, absPath),
      ext: path.extname(absPath).toLowerCase(),
      sizeBytes: stat.size,
      addedAt: now,
      modifiedAt: stat.mtime.toISOString(),
      status: 'New',
      analysis,
      transcript,
      recommendations,
      // Manual, operator-editable fields, pre-filled from the MOOD Brand style
      // so the operator starts from a sensible on-brand draft.
      edits: defaultEdits(recommendations),
      // Pre-publish approval checklist (all unchecked initially).
      approval: defaultApproval(),
      createdAt: now,
      updatedAt: now,
    };

    upsertVideo(video);
    console.log(`[watcher] Stored "${filename}" as id=${id}`);
  } catch (err) {
    console.error('[watcher] Error processing file:', absPath, err.message);
  } finally {
    inFlight.delete(absPath);
  }
}

// Full scan of the watch directory. Adds new files and prunes records whose
// underlying file has disappeared (but keeps already-published records).
export async function scan() {
  ensureWatchDir();
  let entries = [];
  try {
    entries = fs.readdirSync(config.watchDir, { withFileTypes: true });
  } catch (err) {
    console.error('[watcher] Cannot read watch dir:', err.message);
    return;
  }

  const present = new Set();
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!isVideo(entry.name)) continue;
    const abs = path.join(config.watchDir, entry.name);
    present.add(abs);
    await processFile(abs);
  }

  // Mark missing files so the dashboard can flag them, without losing data.
  for (const v of listVideos()) {
    if (!present.has(v.path) && !v.missing && v.status !== 'Published') {
      updateVideo(v.id, { missing: true });
    } else if (present.has(v.path) && v.missing) {
      updateVideo(v.id, { missing: false });
    }
  }
}

function ensureWatchDir() {
  if (!fs.existsSync(config.watchDir)) {
    fs.mkdirSync(config.watchDir, { recursive: true });
    console.log(`[watcher] Created watch dir: ${config.watchDir}`);
  }
}

let fsWatcher = null;
let intervalTimer = null;

export function start() {
  ensureWatchDir();
  console.log(`[watcher] Watching: ${config.watchDir}`);

  // Instant detection.
  try {
    fsWatcher = fs.watch(config.watchDir, (eventType, filename) => {
      if (!filename) return;
      const abs = path.join(config.watchDir, filename);
      // Defer slightly to let the file settle before we stat it.
      setTimeout(() => {
        if (fs.existsSync(abs)) processFile(abs);
      }, 200);
    });
  } catch (err) {
    console.error('[watcher] fs.watch unavailable, relying on polling:', err.message);
  }

  // Initial scan + safety-net polling.
  scan();
  intervalTimer = setInterval(scan, config.scanIntervalMs);
}

export function stop() {
  if (fsWatcher) fsWatcher.close();
  if (intervalTimer) clearInterval(intervalTimer);
}

// Full re-analyze (used by the "re-analyze" action): re-runs metadata analysis,
// re-transcribes the audio, and regenerates recommendations. Preserves the
// operator's manual edits and approval checklist.
export async function reanalyze(id) {
  const video = getVideo(id);
  if (!video) return null;
  if (!fs.existsSync(video.path)) {
    return updateVideo(id, { missing: true });
  }
  const analysis = await analyzeVideo(video.path);
  const transcriptResult = await transcribe({ filePath: video.path, meta: analysis });
  const transcript = transcriptRecord(transcriptResult);
  const recommendations = await generateRecommendations({
    filePath: video.path,
    filename: video.filename,
    analysis,
    transcript: transcript.text,
  });
  return updateVideo(id, { analysis, transcript, recommendations, missing: false });
}

// Regenerates recommendations from the CURRENT (possibly hand-edited) transcript
// without re-transcribing. Re-extracts frames so the visual context is fresh.
// Preserves manual edits and the approval checklist.
export async function regenerateFromTranscript(id) {
  const video = getVideo(id);
  if (!video) return null;
  if (!fs.existsSync(video.path)) {
    return updateVideo(id, { missing: true });
  }
  const recommendations = await generateRecommendations({
    filePath: video.path,
    filename: video.filename,
    analysis: video.analysis,
    transcript: video.transcript?.text || '',
  });
  return updateVideo(id, { recommendations });
}

export { removeVideo };
