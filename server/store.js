// Tiny JSON-file persistence layer. No external DB so the system runs anywhere
// with zero setup. Writes are atomic (write temp + rename) and debounced.

import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

let state = {
  videos: {}, // id -> video record
  platformChecks: {}, // platformKey -> { checkedAt, ...result }
  youtube: null, // OAuth connection: { tokens, channel, scope, checkedAt }
  competitors: {}, // id -> competitor record
  inspiration: {}, // id -> saved reference asset
  // Autonomous OS state
  os: { autonomyLevel: 'off', lastTickAt: null, health: null, learnings: [] },
  goals: {}, // id -> goal
  osTasks: {}, // id -> task
  agents: {}, // key -> agent
  activity: [], // append-only memory log (newest first, capped)
  opportunities: {}, // id -> opportunity
  decisions: {}, // id -> human-in-the-loop decision
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
      state = {
        videos: {},
        platformChecks: {},
        youtube: null,
        competitors: {},
        inspiration: {},
        os: { autonomyLevel: 'off', lastTickAt: null, health: null, learnings: [] },
        goals: {},
        osTasks: {},
        agents: {},
        activity: [],
        opportunities: {},
        decisions: {},
        meta: { version: 1 },
        ...parsed,
      };
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

// ---- YouTube OAuth connection ----------------------------------------------

export function getYouTube() {
  return state.youtube;
}

export function setYouTube(data) {
  state.youtube = data;
  saveNow(); // tokens are important — persist immediately
  return state.youtube;
}

export function clearYouTube() {
  state.youtube = null;
  saveNow();
}

// ---- Competitors -----------------------------------------------------------

export function listCompetitors() {
  return Object.values(state.competitors).sort(
    (a, b) => new Date(b.addedAt) - new Date(a.addedAt),
  );
}
export function getCompetitor(id) {
  return state.competitors[id] || null;
}
export function upsertCompetitor(c) {
  state.competitors[c.id] = c;
  save();
  return c;
}
export function removeCompetitor(id) {
  delete state.competitors[id];
  save();
}

// ---- Inspiration / reference assets ----------------------------------------

export function listInspiration() {
  return Object.values(state.inspiration).sort(
    (a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0),
  );
}
export function getInspiration(id) {
  return state.inspiration[id] || null;
}
export function upsertInspiration(a) {
  state.inspiration[a.id] = a;
  save();
  return a;
}
export function removeInspiration(id) {
  delete state.inspiration[id];
  save();
}

// ---- Autonomous OS ---------------------------------------------------------

export function getOS() {
  return state.os;
}
export function setOS(patch) {
  state.os = { ...state.os, ...patch };
  save();
  return state.os;
}

const collection = (key) => ({
  list: () => Object.values(state[key]),
  get: (id) => state[key][id] || null,
  upsert: (o) => { state[key][o.id] = o; save(); return o; },
  remove: (id) => { delete state[key][id]; save(); },
});

export const goals = collection('goals');
export const osTasks = collection('osTasks');
export const agents = collection('agents');
export const opportunities = collection('opportunities');
export const decisions = collection('decisions');

// Memory / activity log (newest first, capped).
export function addActivity(entry) {
  state.activity.unshift({ id: 'act-' + Math.random().toString(16).slice(2, 10), ...entry });
  if (state.activity.length > 300) state.activity.length = 300;
  save();
  return state.activity[0];
}
export function listActivity(limit = 40) {
  return state.activity.slice(0, limit);
}

export function resetOS() {
  state.os = { autonomyLevel: 'off', lastTickAt: null, health: null, learnings: [] };
  state.goals = {};
  state.osTasks = {};
  state.agents = {};
  state.activity = [];
  state.opportunities = {};
  state.decisions = {};
  save();
}
