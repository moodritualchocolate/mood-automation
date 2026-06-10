// Tiny JSON-file persistence layer. No external DB so the system runs anywhere
// with zero setup. Writes are atomic (write temp + rename) and debounced.

import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

let state = {
  videos: {}, // id -> video record
  platformChecks: {}, // platformKey -> { checkedAt, ...result }
  meta: { version: 1 },
};

let writeTimer = null;

function ensureDataDir() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
}

export function load() {
  ensureDataDir();
  try {
    if (fs.existsSync(config.storeFile)) {
      const raw = fs.readFileSync(config.storeFile, 'utf8');
      const parsed = JSON.parse(raw);
      state = { videos: {}, platformChecks: {}, meta: { version: 1 }, ...parsed };
    }
  } catch (err) {
    console.error('[store] Failed to read store, starting fresh:', err.message);
  }
  return state;
}

function flush() {
  ensureDataDir();
  const tmp = config.storeFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, config.storeFile);
}

// Debounced save so rapid mutations don't thrash the disk.
export function save() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      flush();
    } catch (err) {
      console.error('[store] Failed to write store:', err.message);
    }
  }, 150);
}

export function saveNow() {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  flush();
}

// ---- Videos ----------------------------------------------------------------

export function listVideos() {
  return Object.values(state.videos).sort(
    (a, b) => new Date(b.addedAt) - new Date(a.addedAt),
  );
}

export function getVideo(id) {
  return state.videos[id] || null;
}

export function getVideoByPath(filePath) {
  const abs = path.resolve(filePath);
  return Object.values(state.videos).find((v) => v.path === abs) || null;
}

export function upsertVideo(video) {
  state.videos[video.id] = video;
  save();
  return video;
}

export function updateVideo(id, patch) {
  const existing = state.videos[id];
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  state.videos[id] = updated;
  save();
  return updated;
}

export function removeVideo(id) {
  delete state.videos[id];
  save();
}

// ---- Platform checks -------------------------------------------------------

export function setPlatformCheck(key, result) {
  state.platformChecks[key] = result;
  save();
}

export function getPlatformChecks() {
  return state.platformChecks;
}
