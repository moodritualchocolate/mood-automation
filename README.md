# MOOD — Social Video Review (v1)

MOOD AI automation system. This first version is a **review & recommendation**
tool for short-form social videos. It watches a folder, analyzes each video,
and recommends Hebrew captions, hooks, hashtags, platforms and posting times —
**without publishing anything**.

> ⚠️ **Review only.** This version never uploads or publishes. The Platform
> Connections page only checks whether a connection *could* work, so you can
> verify the wiring before any automation is enabled in a later version.

## What it does

1. **Watches** `content/social-videos-to-review/` (configurable) and detects new
   videos automatically.
2. **Analyzes** each video — duration, resolution, aspect ratio, audio, codec —
   and flags readiness issues (too long for Reels, not 9:16, no audio, etc.).
3. **Recommends**, per video:
   - A short **hook** for the first line.
   - Four **Hebrew caption** styles: emotional, funny-Israeli, clean-brand,
     direct-sales.
   - **Hashtags** in Hebrew and English.
   - **Platform-specific versions** for Instagram Reels, TikTok, Facebook Reels
     and YouTube Shorts (tailored caption, hashtags, max length, suggested time).
   - **Suggested platforms** and **posting time**.
4. Lets you **preview** the video in the dashboard.
5. Lets you **edit** Caption / Hashtags / CTA / Platforms / Publish time.
6. Tracks **status**: New · Needs review · Approved · Ready to publish ·
   Published · Failed.

The UI is **Hebrew, RTL, and mobile-friendly**.

## Quick start

No dependencies to install — it runs on Node.js built-ins (Node ≥ 20).

```bash
npm start
# Dashboard:   http://localhost:4310/
# Connections: http://localhost:4310/connections.html
```

Drop a video (`.mp4`, `.mov`, `.m4v`, `.webm`, `.mkv`, `.avi`) into
`content/social-videos-to-review/` and it appears in the dashboard within a few
seconds (or click **🔄 סרוק את התיקייה**).

### Optional: richer analysis with ffprobe

If `ffprobe` (part of ffmpeg) is on the host `PATH`, the analyzer extracts full
metadata (duration, resolution, audio, codec, fps). Without it, the system
degrades gracefully to filesystem metadata and notes that deep analysis is
unavailable.

## Configuration

Copy `.env.example` and set values, or export them in your shell. Key options:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `4310`). |
| `WATCH_DIR` | Absolute path to the watched folder. Point at your real `/content/social-videos-to-review/` in production. |
| `BRAND_NAME` / `BRAND_HANDLE` / `BRAND_CTA` | Brand defaults used in recommendations. |
| `IG_*`, `FB_*`, `TIKTOK_*`, `YT_*` | Per-platform credentials used only for connection checks (see `.env.example`). |

## Platform Connections page

Shows, for Instagram / Facebook / TikTok / YouTube:

- Connected / Not connected
- Missing permissions
- Account name
- Last connection check
- Can upload video: Yes/No
- Can publish: **No** (disabled by policy in v1)

A platform is reported "Connected" when its credential env vars are present.

## Project layout

```
server/
  config.js      # central config + platform & status definitions
  store.js       # zero-dependency JSON persistence (data/store.json)
  analyzer.js    # video analysis (ffprobe if available, graceful fallback)
  recommend.js   # Hebrew caption/hashtag/platform recommendation engine
  platforms.js   # platform connection checks (no publishing)
  watcher.js     # folder watching + per-video processing
  server.js      # HTTP server: UI, JSON API, range-based video streaming
public/          # RTL Hebrew dashboard + connections page (vanilla JS/CSS)
content/social-videos-to-review/   # watched folder (videos are git-ignored)
```

## API (summary)

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/videos` | List all videos. |
| `GET` | `/api/videos/:id` | One video with analysis + recommendations. |
| `PATCH` | `/api/videos/:id` | Update `status` and/or manual `edits`. |
| `POST` | `/api/videos/:id/reanalyze` | Re-run analysis + recommendations. |
| `GET` | `/api/videos/:id/file` | Stream the video (HTTP range supported). |
| `POST` | `/api/scan` | Trigger an immediate folder scan. |
| `GET` | `/api/connections` | Platform connection statuses. |
| `POST` | `/api/connections/check` | Re-run connection checks. |

## Roadmap (not in v1)

- Real platform token validation on the Connections page.
- Swap the heuristic recommendation engine for a Claude API call (the
  `recommend.generate()` interface is already structured for this).
- Actual scheduling/publishing — intentionally **out of scope** for v1.
