// Video analysis. Uses ffprobe when it is available on the host for rich
// metadata (duration, resolution, audio, codec). When ffprobe is missing it
// degrades gracefully to filesystem metadata so the system still works.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const execFileAsync = promisify(execFile);

let ffprobeAvailable = null; // cached detection result

async function hasFfprobe() {
  if (ffprobeAvailable !== null) return ffprobeAvailable;
  try {
    await execFileAsync('ffprobe', ['-version']);
    ffprobeAvailable = true;
  } catch {
    ffprobeAvailable = false;
  }
  return ffprobeAvailable;
}

async function probe(filePath) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    filePath,
  ]);
  return JSON.parse(stdout);
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function aspectRatioLabel(width, height) {
  if (!width || !height) return null;
  const d = gcd(width, height);
  const w = width / d;
  const h = height / d;
  // Common social ratios.
  const ratio = width / height;
  if (Math.abs(ratio - 9 / 16) < 0.03) return '9:16';
  if (Math.abs(ratio - 16 / 9) < 0.03) return '16:9';
  if (Math.abs(ratio - 1) < 0.03) return '1:1';
  if (Math.abs(ratio - 4 / 5) < 0.03) return '4:5';
  return `${w}:${h}`;
}

// Builds the human-facing readiness assessment: is the clip good to go, and
// which notes should the operator see before approving.
function assessReadiness(meta) {
  const notes = [];
  const { durationSec, width, height, hasAudio, aspectRatio, sizeBytes } = meta;

  if (!meta.probed) {
    notes.push(
      'לא ניתן לנתח את הווידאו לעומק (ffprobe לא מותקן). מוצגים נתוני קובץ בלבד.',
    );
  }

  if (durationSec != null) {
    if (durationSec < 3) {
      notes.push('הסרטון קצר מאוד (פחות מ-3 שניות) — ייתכן שלא יתאים לרילז.');
    }
    if (durationSec > 90) {
      notes.push(
        `הסרטון ארוך (${Math.round(durationSec)} שניות). Instagram Reels ו-TikTok מעדיפים עד 90 שניות.`,
      );
    }
    if (durationSec > 60) {
      notes.push('YouTube Shorts מוגבל ל-60 שניות — ייתכן שצריך לקצר.');
    }
  }

  if (aspectRatio && aspectRatio !== '9:16') {
    notes.push(
      `יחס המסך הוא ${aspectRatio}. לרילז ולשורטס מומלץ פורמט אנכי 9:16.`,
    );
  }

  if (hasAudio === false) {
    notes.push('לא זוהה אודיו בסרטון. כדאי להוסיף מוזיקה או קריינות.');
  }

  if (width && height && (width < 720 || height < 720)) {
    notes.push('רזולוציה נמוכה — מומלץ לפחות 1080x1920 לאיכות מיטבית.');
  }

  if (sizeBytes && sizeBytes > 300 * 1024 * 1024) {
    notes.push('קובץ גדול מ-300MB — ייתכנו מגבלות העלאה בחלק מהפלטפורמות.');
  }

  // "Ready" means we have no blocking notes. Anything in notes is advisory.
  const blocking = notes.filter(
    (n) => n.includes('קצר מאוד') || n.includes('לעומק'),
  );

  return {
    ready: durationSec == null ? false : blocking.length === 0,
    notes,
  };
}

export async function analyzeVideo(filePath) {
  const stat = fs.statSync(filePath);
  const meta = {
    probed: false,
    sizeBytes: stat.size,
    durationSec: null,
    width: null,
    height: null,
    aspectRatio: null,
    fps: null,
    videoCodec: null,
    audioCodec: null,
    hasAudio: null,
    bitrate: null,
    ext: path.extname(filePath).toLowerCase(),
  };

  if (await hasFfprobe()) {
    try {
      const data = await probe(filePath);
      const videoStream = (data.streams || []).find(
        (s) => s.codec_type === 'video',
      );
      const audioStream = (data.streams || []).find(
        (s) => s.codec_type === 'audio',
      );

      meta.probed = true;
      meta.durationSec = data.format?.duration
        ? Number(data.format.duration)
        : null;
      meta.bitrate = data.format?.bit_rate ? Number(data.format.bit_rate) : null;

      if (videoStream) {
        meta.width = videoStream.width || null;
        meta.height = videoStream.height || null;
        meta.videoCodec = videoStream.codec_name || null;
        meta.aspectRatio = aspectRatioLabel(meta.width, meta.height);
        if (videoStream.avg_frame_rate && videoStream.avg_frame_rate !== '0/0') {
          const [n, d] = videoStream.avg_frame_rate.split('/').map(Number);
          if (d) meta.fps = Math.round((n / d) * 100) / 100;
        }
      }

      meta.hasAudio = !!audioStream;
      meta.audioCodec = audioStream?.codec_name || null;
    } catch (err) {
      console.error('[analyzer] ffprobe failed:', err.message);
    }
  }

  meta.readiness = assessReadiness(meta);
  meta.analyzedAt = new Date().toISOString();
  return meta;
}
