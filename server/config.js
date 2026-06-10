// Central configuration for the Social Video Review system.
// Everything is overridable via environment variables so the same code runs
// on a laptop, a server, or an ephemeral cloud container.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

const env = process.env;

export const config = {
  port: Number(env.PORT) || 4310,
  host: env.HOST || '0.0.0.0',

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
  },
};

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
