// Key-frame extraction. Uses ffmpeg to pull a handful of evenly-spaced frames
// from a video so the recommendation engine can "see" the actual content.
//
// ffmpeg is optional: when it isn't installed, extraction returns an empty set
// and the caller degrades gracefully (metadata-only analysis). Frames are
// written to a per-video temp dir, read as base64 JPEGs, then cleaned up.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);

let ffmpegAvailable = null;

export async function hasFfmpeg() {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  try {
    await execFileAsync('ffmpeg', ['-version']);
    ffmpegAvailable = true;
  } catch {
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

// Picks evenly-spaced timestamps across the clip, skipping the very first/last
// moments (often black frames or fades).
function frameTimestamps(durationSec, count) {
  if (!durationSec || durationSec <= 0) {
    // Unknown duration — grab a few frames from the start as a best effort.
    return Array.from({ length: count }, (_, i) => i * 1.5);
  }
  const usable = Math.max(durationSec - 0.5, 0.1);
  const start = Math.min(0.5, usable * 0.05);
  const stops = [];
  for (let i = 0; i < count; i++) {
    const frac = count === 1 ? 0.5 : i / (count - 1);
    stops.push(+(start + frac * (usable - start)).toFixed(2));
  }
  return stops;
}

// Extracts up to `count` frames. Returns an array of
// { base64, mediaType, timestampSec }. Downscales to keep image tokens modest.
export async function extractFrames(filePath, { count = 6, durationSec = null, maxWidth = 768 } = {}) {
  if (!(await hasFfmpeg())) return [];

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mood-frames-'));
  const timestamps = frameTimestamps(durationSec, count);
  const frames = [];

  try {
    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      const out = path.join(tmpDir, `frame-${i}.jpg`);
      try {
        // -ss before -i = fast seek; scale keeps aspect, caps width.
        await execFileAsync('ffmpeg', [
          '-ss', String(ts),
          '-i', filePath,
          '-frames:v', '1',
          '-vf', `scale='min(${maxWidth},iw)':-2`,
          '-q:v', '4',
          '-y',
          out,
        ]);
        if (fs.existsSync(out) && fs.statSync(out).size > 0) {
          frames.push({
            base64: fs.readFileSync(out).toString('base64'),
            mediaType: 'image/jpeg',
            timestampSec: ts,
          });
        }
      } catch (err) {
        // Skip a frame we couldn't grab (e.g. timestamp past end) and continue.
        console.error(`[frames] Could not extract frame at ${ts}s:`, err.message);
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  return frames;
}
