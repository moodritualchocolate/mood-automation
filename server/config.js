// Central configuration for the Social Video Review system.
// Everything is overridable via environment variables so the same code runs
// on a laptop, a server, or an ephemeral cloud container.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

const env = process.env;

const PORT = Number(env.PORT) || 4310;

export const config = {
  port: PORT,
  host: env.HOST || '0.0.0.0',

  // Live demo mode. Seeds sample videos and a simulated YouTube connection so
  // the full flow can be shown end-to-end. Demo mode NEVER publishes for real —
  // "Test Upload" is always simulated.
  demoMode: env.DEMO_MODE === 'true',

  // The folder the system watches for new videos. Defaults to the in-repo
  // content folder; point WATCH_DIR at an absolute path (e.g. an external
  // "/content/social-videos-to-review/") in production.
  watchDir: env.WATCH_DIR
    ? path.resolve(env.WATCH_DIR)
    : path.join(ROOT, 'content', 'social-videos-to-review'),

  dataDir: path.join(ROOT, 'data'),
  storeFile: path.join(ROOT, 'data', 'store.json'),
  publicDir: path.join(ROOT, 'public'),

  // How often to re-scan the watch folder as a safety net behind fs.watch.
  scanIntervalMs: Number(env.SCAN_INTERVAL_MS) || 5000,

  // Recognised video extensions.
  videoExtensions: ['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi'],

  // Brand defaults used by the recommendation engine.
  brand: {
    name: env.BRAND_NAME || 'MOOD',
    handle: env.BRAND_HANDLE || '@moodritualchocolate',
    cta: env.BRAND_CTA || 'הזמינו עכשיו דרך הקישור בביו 🍫',
    // Short brand context fed to Claude so recommendations stay on-brand.
    description:
      env.BRAND_DESCRIPTION ||
      'MOOD Ritual Chocolate — שוקולד וקקאו טקסי, נקי ואמיתי, לרגע של איזון ושלווה ביום. קהל ישראלי, מותג פרימיום עם נגיעה חמה ואותנטית.',
  },

  // Claude API integration for content-based recommendations. When no API key
  // is present the system falls back to the offline heuristic engine.
  claude: {
    apiKey: env.ANTHROPIC_API_KEY || '',
    // Default to the most capable model; override with CLAUDE_MODEL if desired.
    model: env.CLAUDE_MODEL || 'claude-opus-4-8',
    // Number of key frames to extract and send to the model per video.
    frameCount: Number(env.CLAUDE_FRAME_COUNT) || 6,
    maxTokens: Number(env.CLAUDE_MAX_TOKENS) || 16000,
  },

  // Audio speech-to-text. Anthropic's API has no STT, so transcription is
  // pluggable: a Whisper-compatible HTTP endpoint (preferred) or a local
  // `whisper` CLI. When neither is available — or the video has no audio — the
  // system continues without a transcript.
  transcription: {
    enabled: env.TRANSCRIBE_ENABLED !== 'false',
    // OpenAI-compatible /audio/transcriptions endpoint (self-hosted Whisper,
    // Groq, etc.). Generic multipart upload — provider-neutral.
    httpUrl: env.TRANSCRIBE_API_URL || '',
    httpKey: env.TRANSCRIBE_API_KEY || '',
    model: env.TRANSCRIBE_MODEL || 'whisper-1',
    // '' = auto-detect (handles Hebrew/English). Set 'he' or 'en' to force.
    language: env.TRANSCRIBE_LANGUAGE || '',
    // Local OpenAI-Whisper CLI binary, used if no HTTP endpoint is configured.
    whisperBin: env.WHISPER_BIN || 'whisper',
    whisperModel: env.WHISPER_MODEL || 'base',
  },

  // YouTube Shorts publishing (Phase 1 — the only platform that can publish).
  // OAuth 2.0 authorization-code flow with offline access (refresh token).
  // Publishing is manual-only and server-gated by the approval checklist.
  youtube: {
    clientId: env.YT_CLIENT_ID || '',
    clientSecret: env.YT_CLIENT_SECRET || '',
    redirectUri:
      env.YT_REDIRECT_URI || `http://localhost:${PORT}/api/youtube/oauth/callback`,
    // public | unlisted | private. Default 'public' = a real Short; set to
    // 'unlisted'/'private' for safe end-to-end testing without a public post.
    privacyStatus: env.YT_PRIVACY_STATUS || 'public',
    categoryId: env.YT_CATEGORY_ID || '22', // People & Blogs
    scopes: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
    ],
    // Safety cap for the in-memory upload buffer (Shorts are small).
    maxUploadBytes: Number(env.YT_MAX_UPLOAD_BYTES) || 300 * 1024 * 1024,
  },
};

// The pre-publish approval checklist. Every item must be confirmed before a
// video may move to a publish-gated status. (Publishing itself is still
// disabled — this only gates the status transition.)
export const APPROVAL_ITEMS = [
  { key: 'captionReviewed', labelHe: 'הכותרת נבדקה' },
  { key: 'hashtagsReviewed', labelHe: 'ההאשטגים נבדקו' },
  { key: 'platformSelected', labelHe: 'נבחרה פלטפורמה' },
  { key: 'previewChecked', labelHe: 'התצוגה המקדימה נבדקה' },
  { key: 'rightsConfirmed', labelHe: 'אושרו זכויות/הרשאות' },
  { key: 'publishTimeSelected', labelHe: 'נבחר זמן פרסום' },
];

// Statuses that require the full approval checklist before they can be set.
export const PUBLISH_GATED_STATUSES = ['Ready to publish', 'Published'];

export const VIDEO_STATUSES = [
  'New',
  'Needs review',
  'Approved',
  'Ready to publish',
  'Published',
  'Failed',
];

// Platforms the system can connect to. Connection state is read from
// environment variables — when credentials are absent we simply report the
// platform as "Not connected" together with the permissions it would need.
// NOTE: this v1 never publishes. It only reports whether a connection *could*
// work, so the operator can verify wiring before any automation is enabled.
export const PLATFORMS = [
  {
    key: 'instagram',
    name: 'Instagram',
    nameHe: 'אינסטגרם',
    // Env vars that, when present, indicate credentials are configured.
    credentialEnv: ['IG_ACCESS_TOKEN', 'IG_BUSINESS_ID'],
    accountEnv: 'IG_ACCOUNT_NAME',
    requiredPermissions: [
      'instagram_basic',
      'instagram_content_publish',
      'pages_read_engagement',
    ],
  },
  {
    key: 'facebook',
    name: 'Facebook',
    nameHe: 'פייסבוק',
    credentialEnv: ['FB_PAGE_ACCESS_TOKEN', 'FB_PAGE_ID'],
    accountEnv: 'FB_ACCOUNT_NAME',
    requiredPermissions: [
      'pages_manage_posts',
      'pages_read_engagement',
      'publish_video',
    ],
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    nameHe: 'טיקטוק',
    credentialEnv: ['TIKTOK_ACCESS_TOKEN', 'TIKTOK_OPEN_ID'],
    accountEnv: 'TIKTOK_ACCOUNT_NAME',
    requiredPermissions: ['video.upload', 'video.publish', 'user.info.basic'],
  },
  {
    key: 'youtube',
    name: 'YouTube',
    nameHe: 'יוטיוב',
    credentialEnv: ['YT_ACCESS_TOKEN', 'YT_CHANNEL_ID'],
    accountEnv: 'YT_ACCOUNT_NAME',
    requiredPermissions: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
    ],
  },
];
