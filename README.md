# MOOD — Social Video Review (v1)

MOOD AI automation system for short-form social videos. It watches a folder,
analyzes each video (vision + speech), and recommends Hebrew captions, hooks,
hashtags, platforms and posting times. Publishing is being rolled out **safely
in phases** — **Phase 1 is YouTube Shorts only**, manual and gated.

> ⚠️ **Nothing publishes automatically.** Publishing happens only when you
> click the button, only for YouTube Shorts, and only after a server-enforced
> approval checklist passes. Instagram, Facebook and TikTok are **not** built
> for publishing yet — their Connections cards are status stubs only.

## What it does

1. **Watches** `content/social-videos-to-review/` (configurable) and detects new
   videos automatically.
2. **Analyzes** each video — duration, resolution, aspect ratio, audio, codec —
   and flags readiness issues (too long for Reels, not 9:16, no audio, etc.).
3. **Looks at and listens to the content** — extracts key frames *and*
   transcribes the speech (Hebrew/English), then sends both to Claude for
   content-based analysis (see "Content-based recommendations").
4. **Recommends**, per video, a Hebrew **content analysis** plus four styles —
   **MOOD Brand**, **Emotional**, **Funny Israeli**, **Direct Response** — each
   with its own **hook**, **caption**, **CTA**, **hashtags** (Hebrew + English),
   **suggested platform**, and **suggested posting time**. Captions are based on
   both what is **seen** and what is **said**.
5. Lets you **preview** the video, **read and edit the transcript**, and
   **regenerate** recommendations from the (edited) transcript.
6. Lets you **edit** Caption / Hashtags / CTA / Platforms / Publish time — one
   click copies a whole style into the editable fields.
7. Tracks **status**: New · Needs review · Approved · Ready to publish ·
   Published · Failed — with a **pre-publish approval checklist** that gates the
   publish-ready statuses.

The UI is **Hebrew, RTL, and mobile-friendly**.

## Quick start

Node ≥ 20. One dependency (the Anthropic SDK) — install it once:

```bash
npm install
npm start
# Dashboard:   http://localhost:4310/
# Connections: http://localhost:4310/connections.html
```

Drop a video (`.mp4`, `.mov`, `.m4v`, `.webm`, `.mkv`, `.avi`) into
`content/social-videos-to-review/` and it appears in the dashboard within a few
seconds (or click **🔄 סרוק את התיקייה**).

## Content-based recommendations (Claude)

When `ANTHROPIC_API_KEY` is set, each new video is analyzed by its **actual
content**, not templates:

1. **Key frames** are extracted from the video with `ffmpeg` (evenly spaced
   across the clip, downscaled to keep token cost modest).
2. **Speech is transcribed** (see "Audio transcription" below).
3. The frames + transcript + technical metadata are sent to **Claude**
   (`claude-opus-4-8` by default), which describes what it sees and hears, then
   writes the four Hebrew styles — based on both **what is seen and what is
   said** — each constrained to a strict JSON schema so the output is always
   valid.
4. The dashboard shows the **content analysis**, detected elements, the
   transcript, and the four styles; the recommendation source (vision / text /
   fallback) is labeled.

**Requirements & graceful degradation:**

- `ffmpeg` must be on `PATH` for frame extraction and audio. Without it, Claude
  is called with metadata only (labeled "claude-text").
- Without `ANTHROPIC_API_KEY` — or if a Claude call fails — the system falls
  back to an offline heuristic that produces the same four-style structure, so
  the dashboard always works. The fallback reason is surfaced in the UI.
- `ffprobe` (also part of ffmpeg) enriches the technical analysis (duration,
  resolution, audio, codec, fps); without it, filesystem metadata is used.

This still **never publishes** — it only generates recommendations for review.

## Audio transcription

When a video has an audio track, its speech (Hebrew or English) is transcribed
and fed into the Claude prompt alongside the frames. Anthropic's API has no
speech-to-text, so transcription is **pluggable and optional**:

- Audio is extracted with `ffmpeg`, then transcribed via **either** a
  Whisper-compatible HTTP endpoint (`TRANSCRIBE_API_URL` — e.g. self-hosted
  Whisper or any OpenAI-`/audio/transcriptions`-compatible service) **or** a
  local `whisper` CLI (`WHISPER_BIN`). Language is auto-detected.
- If the video has **no audio**, no transcriber is configured, or transcription
  fails, the system continues normally without a transcript — no error.
- In the dashboard you can **read the transcript, edit it manually**, and click
  **"Regenerate from transcript"** to re-run the recommendations against the
  edited transcript (frames are re-read; audio is not re-transcribed).

## Publishing to YouTube Shorts (Phase 1)

YouTube is the only platform wired for publishing. It is **manual** and gated.

**Connect (one-time):**

1. In Google Cloud, enable **YouTube Data API v3** and create an **OAuth 2.0
   client** of type *Web application*.
2. Add the redirect URI to the client's *Authorized redirect URIs*:
   `http://localhost:4310/api/youtube/oauth/callback` (match `YT_REDIRECT_URI`).
3. Set `YT_CLIENT_ID` / `YT_CLIENT_SECRET`, start the app, open **Platform
   Connections**, and click **Connect YouTube**. The refresh token is stored
   locally in `data/store.json` (git-ignored).

The YouTube connection card shows: Connected / Not connected · channel name ·
can-upload · last checked · missing permissions.

**Publish a video:** the **"Publish to YouTube Shorts"** button appears in a
video's detail view and is enabled **only when all** of these hold (the server
re-checks every one and rejects the request otherwise):

- status is **Ready to publish**
- the **approval checklist** is fully complete
- **YouTube is connected** (and can upload)
- **YouTube Shorts** is selected in the video's Platforms

On click (after a confirm dialog) the approved **caption** becomes the title
(first line) + description, the approved **hashtags** go into the description
(with `#Shorts` ensured), and the file is uploaded via the Data API. The system
records the **video ID, published URL, publish time, upload status, privacy, and
any error**, and keeps a **publish history** per video. If the upload fails, the
video **stays "Ready to publish"** and the error is shown.

Privacy defaults to `public` (a real Short); set `YT_PRIVACY_STATUS=unlisted` or
`private` to test the full flow without a public post. Nothing is ever published
automatically — only on your manual click.

## Pre-publish approval checklist

Before a video can move to a publish-ready status, a six-item checklist must be
confirmed (per video): **Caption reviewed · Hashtags reviewed · Platform
selected · Video preview checked · Rights/permissions confirmed · Publish time
selected**. The server **enforces** this — attempting to set `Ready to publish`
(or `Published`) with any item unchecked is rejected (HTTP 422), and the
dashboard locks those options until the checklist is complete. Nothing is
published either way; this only gates the status transition.

## Configuration

Copy `.env.example` and set values, or export them in your shell. Key options:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `4310`). |
| `WATCH_DIR` | Absolute path to the watched folder. Point at your real `/content/social-videos-to-review/` in production. |
| `BRAND_NAME` / `BRAND_HANDLE` / `BRAND_CTA` / `BRAND_DESCRIPTION` | Brand defaults; `BRAND_DESCRIPTION` is the brand context fed to Claude. |
| `ANTHROPIC_API_KEY` | Enables content-based Claude analysis. Unset → offline heuristic. |
| `CLAUDE_MODEL` / `CLAUDE_FRAME_COUNT` / `CLAUDE_MAX_TOKENS` | Model (default `claude-opus-4-8`), frames per video, output token cap. |
| `TRANSCRIBE_API_URL` / `TRANSCRIBE_API_KEY` / `TRANSCRIBE_MODEL` | Whisper-compatible STT endpoint (preferred transcription path). |
| `WHISPER_BIN` / `WHISPER_MODEL` / `TRANSCRIBE_LANGUAGE` | Local `whisper` CLI fallback; language (`''` = auto). |
| `YT_CLIENT_ID` / `YT_CLIENT_SECRET` / `YT_REDIRECT_URI` | YouTube OAuth client for publishing (Phase 1). |
| `YT_PRIVACY_STATUS` / `YT_CATEGORY_ID` | Published-Short privacy (`public`/`unlisted`/`private`) and category. |
| `IG_*`, `FB_*`, `TIKTOK_*` | Connection-check stubs only — not built for publishing yet. |

## Platform Connections page

Shows, for each platform: Connected / Not connected · account/channel name ·
missing permissions · last connection check · can-upload · can-publish.

- **YouTube** is **live** (OAuth): connect/disconnect from this page; `can
  publish` is **Yes** once connected.
- **Instagram / Facebook / TikTok** are **stubs** in this phase — they report
  "connected" when their credential env vars are present but **cannot publish**.

## Project layout

```
server/
  config.js      # central config + platform/status/Claude definitions
  store.js       # JSON persistence (data/store.json)
  analyzer.js    # video analysis (ffprobe if available, graceful fallback)
  frames.js      # key-frame extraction with ffmpeg (graceful fallback)
  transcribe.js  # audio extraction + speech-to-text (HTTP Whisper or CLI)
  claude.js      # Claude API client: vision + transcript + structured output
  recommend.js   # orchestrates frames+transcript → Claude → 4 styles; fallback
  youtube.js     # YouTube OAuth + resumable Shorts upload (Phase 1)
  platforms.js   # connection cards (YouTube live; others are stubs)
  watcher.js     # folder watching + per-video processing
  server.js      # HTTP server: UI, JSON API, range-based video streaming
public/          # RTL Hebrew dashboard + connections page (vanilla JS/CSS)
content/social-videos-to-review/   # watched folder (videos are git-ignored)
```

## API (summary)

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/videos` | List all videos. |
| `GET` | `/api/videos/:id` | One video with analysis, transcript + recommendations. |
| `PATCH` | `/api/videos/:id` | Update `status`, `edits`, `transcript`, and/or `approval`. Publish-gated statuses require a complete checklist (else 422). |
| `POST` | `/api/videos/:id/reanalyze` | Re-run analysis + transcription + recommendations. |
| `POST` | `/api/videos/:id/regenerate-from-transcript` | Regenerate recommendations from the current (edited) transcript. |
| `GET` | `/api/videos/:id/file` | Stream the video (HTTP range supported). |
| `POST` | `/api/videos/:id/publish/youtube` | Manual, gated YouTube Shorts publish. |
| `POST` | `/api/scan` | Trigger an immediate folder scan. |
| `GET` | `/api/connections` | Platform connection statuses (YouTube live). |
| `POST` | `/api/connections/check` | Re-run checks; refreshes YouTube live. |
| `GET` | `/api/youtube/oauth/start` | Begin YouTube OAuth (redirects to Google). |
| `GET` | `/api/youtube/oauth/callback` | OAuth redirect handler (stores tokens). |
| `POST` | `/api/youtube/disconnect` | Disconnect the YouTube account. |

## Roadmap (next phases)

- Instagram Reels, Facebook Reels, and TikTok publishing (same gated, manual
  pattern as YouTube) — **not built yet**.
- Scheduled publishing at the chosen publish time (still manual-trigger today).
- Resumable/chunked upload for very large files (current path buffers the file).
