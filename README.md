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
3. **Looks at the actual content** — extracts key frames and sends them to
   Claude for content-based analysis (see "Content-based recommendations").
4. **Recommends**, per video, a Hebrew **content analysis** plus four styles —
   **MOOD Brand**, **Emotional**, **Funny Israeli**, **Direct Response** — each
   with its own **hook**, **caption**, **CTA**, **hashtags** (Hebrew + English),
   **suggested platform**, and **suggested posting time**.
5. Lets you **preview** the video in the dashboard.
6. Lets you **edit** Caption / Hashtags / CTA / Platforms / Publish time — one
   click copies a whole style into the editable fields.
7. Tracks **status**: New · Needs review · Approved · Ready to publish ·
   Published · Failed.

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
2. The frames + technical metadata are sent to **Claude**
   (`claude-opus-4-8` by default), which describes what it sees and writes the
   four Hebrew styles, each constrained to a strict JSON schema so the output is
   always valid.
3. The dashboard shows the **content analysis**, detected elements, and the four
   styles; the recommendation source (vision / text / fallback) is labeled.

**Requirements & graceful degradation:**

- `ffmpeg` must be on `PATH` for frame extraction. Without it, Claude is called
  with metadata only (labeled "claude-text").
- Without `ANTHROPIC_API_KEY` — or if a Claude call fails — the system falls
  back to an offline heuristic that produces the same four-style structure, so
  the dashboard always works. The fallback reason is surfaced in the UI.
- `ffprobe` (also part of ffmpeg) enriches the technical analysis (duration,
  resolution, audio, codec, fps); without it, filesystem metadata is used.

This still **never publishes** — it only generates recommendations for review.

## Configuration

Copy `.env.example` and set values, or export them in your shell. Key options:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `4310`). |
| `WATCH_DIR` | Absolute path to the watched folder. Point at your real `/content/social-videos-to-review/` in production. |
| `BRAND_NAME` / `BRAND_HANDLE` / `BRAND_CTA` / `BRAND_DESCRIPTION` | Brand defaults; `BRAND_DESCRIPTION` is the brand context fed to Claude. |
| `ANTHROPIC_API_KEY` | Enables content-based Claude analysis. Unset → offline heuristic. |
| `CLAUDE_MODEL` / `CLAUDE_FRAME_COUNT` / `CLAUDE_MAX_TOKENS` | Model (default `claude-opus-4-8`), frames per video, output token cap. |
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
  config.js      # central config + platform/status/Claude definitions
  store.js       # JSON persistence (data/store.json)
  analyzer.js    # video analysis (ffprobe if available, graceful fallback)
  frames.js      # key-frame extraction with ffmpeg (graceful fallback)
  claude.js      # Claude API client: vision + structured Hebrew output
  recommend.js   # orchestrates frames → Claude → 4 styles; heuristic fallback
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

## Roadmap (not yet)

- Real platform token validation on the Connections page.
- Audio/speech transcription fed into the Claude prompt for richer context.
- Actual scheduling/publishing — intentionally **out of scope** for this
  review-only version.
