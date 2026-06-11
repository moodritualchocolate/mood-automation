// Audio speech-to-text. Anthropic's Messages API does not do transcription, so
// this module is pluggable and best-effort:
//
//   1. Extract a mono 16kHz WAV from the video with ffmpeg (only if it has
//      audio).
//   2. Transcribe via a Whisper-compatible HTTP endpoint (preferred) or a local
//      `whisper` CLI.
//
// If the video has no audio, no transcriber is configured/available, or any
// step fails, transcription returns null and the caller continues normally.
// Whisper auto-detects language, so Hebrew and English are both handled.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { config } from './config.js';
import { hasFfmpeg } from './frames.js';

const execFileAsync = promisify(execFile);

let whisperAvailable = null;

async function hasWhisperCli() {
  if (whisperAvailable !== null) return whisperAvailable;
  try {
    await execFileAsync(config.transcription.whisperBin, ['--help']);
    whisperAvailable = true;
  } catch {
    whisperAvailable = false;
  }
  return whisperAvailable;
}

// Extracts audio to a temp WAV. Returns the path, or null if extraction fails
// (e.g. the file genuinely has no audio stream).
async function extractAudio(filePath, tmpDir) {
  const out = path.join(tmpDir, 'audio.wav');
  try {
    await execFileAsync('ffmpeg', [
      '-i', filePath,
      '-vn', // drop video
      '-ac', '1', // mono
      '-ar', '16000', // 16kHz
      '-f', 'wav',
      '-y',
      out,
    ]);
    if (fs.existsSync(out) && fs.statSync(out).size > 1024) return out;
    return null;
  } catch (err) {
    // No audio stream, or ffmpeg failed — treat as "no transcript".
    return null;
  }
}

// Whisper-compatible HTTP endpoint (OpenAI /audio/transcriptions shape).
async function transcribeViaHttp(audioPath) {
  const { httpUrl, httpKey, model, language } = config.transcription;
  const bytes = fs.readFileSync(audioPath);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'audio/wav' }), 'audio.wav');
  form.append('model', model);
  form.append('response_format', 'json');
  if (language) form.append('language', language);

  const headers = {};
  if (httpKey) headers['Authorization'] = `Bearer ${httpKey}`;

  const res = await fetch(httpUrl, { method: 'POST', headers, body: form });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Transcription HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  return {
    text: (data.text || '').trim(),
    language: data.language || language || null,
    source: 'http',
  };
}

// Local OpenAI-Whisper CLI.
async function transcribeViaWhisperCli(audioPath, tmpDir) {
  const { whisperBin, whisperModel, language } = config.transcription;
  const args = [audioPath, '--model', whisperModel, '--output_dir', tmpDir, '--output_format', 'txt'];
  if (language) args.push('--language', language);
  await execFileAsync(whisperBin, args, { timeout: 600000 });

  const base = path.basename(audioPath, path.extname(audioPath));
  const txtPath = path.join(tmpDir, `${base}.txt`);
  const text = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, 'utf8').trim() : '';
  return { text, language: language || null, source: 'whisper-cli' };
}

// Quick sync check: is an HTTP transcription endpoint configured?
export function isConfigured() {
  const t = config.transcription;
  return t.enabled && !!t.httpUrl;
}

// Fuller async check (also detects a local whisper CLI). Used by System Health.
export async function isAvailable() {
  const t = config.transcription;
  if (!t.enabled) return { configured: false, method: 'disabled' };
  if (t.httpUrl) return { configured: true, method: 'http' };
  if (await hasWhisperCli()) return { configured: true, method: 'whisper-cli' };
  return { configured: false, method: 'none' };
}

// Main entry point. Returns { text, language, source } or null.
export async function transcribe({ filePath, meta }) {
  const t = config.transcription;
  if (!t.enabled) return null;

  // Skip when we know there's no audio. (meta.hasAudio === null means unknown —
  // we still try, and extraction will simply fail if there's no stream.)
  if (meta?.hasAudio === false) return null;

  if (!(await hasFfmpeg())) return null;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mood-audio-'));
  try {
    const audioPath = await extractAudio(filePath, tmpDir);
    if (!audioPath) return null; // no audio stream

    if (t.httpUrl) {
      return await transcribeViaHttp(audioPath);
    }
    if (await hasWhisperCli()) {
      return await transcribeViaWhisperCli(audioPath, tmpDir);
    }

    // Audio exists but no transcriber is available.
    console.warn('[transcribe] Audio present but no transcriber configured (set TRANSCRIBE_API_URL or install whisper).');
    return null;
  } catch (err) {
    console.error('[transcribe] Failed:', err.message);
    return null;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
