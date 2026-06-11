// YouTube Shorts publishing (Phase 1). OAuth 2.0 authorization-code flow with
// offline access, plus resumable video upload via the YouTube Data API v3.
//
// No SDK — uses global fetch against documented Google endpoints. Tokens are
// persisted in the local JSON store (which is git-ignored). Publishing is
// always manual and is gated by the caller (server.js) behind the approval
// checklist; this module just performs the requested actions.

import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { getYouTube, setYouTube, clearYouTube } from './store.js';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CHANNELS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true';
const UPLOAD_ENDPOINT =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';

const MIME_BY_EXT = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
};

export function isConfigured() {
  return !!(config.youtube.clientId && config.youtube.clientSecret);
}

// ---- OAuth flow ------------------------------------------------------------

export function buildAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: config.youtube.clientId,
    redirect_uri: config.youtube.redirectUri,
    response_type: 'code',
    scope: config.youtube.scopes.join(' '),
    access_type: 'offline', // request a refresh token
    prompt: 'consent', // force refresh_token issuance on re-consent
    include_granted_scopes: 'true',
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

async function tokenRequest(body) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Token endpoint ${res.status}: ${data.error_description || data.error || 'unknown'}`);
  }
  return data;
}

// Exchanges an authorization code for tokens, persists them, and fetches the
// channel so we can show its name immediately.
export async function exchangeCode(code) {
  const data = await tokenRequest({
    code,
    client_id: config.youtube.clientId,
    client_secret: config.youtube.clientSecret,
    redirect_uri: config.youtube.redirectUri,
    grant_type: 'authorization_code',
  });

  const now = Date.now();
  const stored = {
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiry: now + (data.expires_in || 3600) * 1000,
      scope: data.scope || config.youtube.scopes.join(' '),
      tokenType: data.token_type || 'Bearer',
    },
    channel: null,
    connectedAt: new Date(now).toISOString(),
    checkedAt: new Date(now).toISOString(),
  };
  setYouTube(stored);

  // Best-effort channel fetch (don't fail the whole connect on this).
  try {
    await recheck();
  } catch (err) {
    console.error('[youtube] Channel fetch after connect failed:', err.message);
  }
  return getYouTube();
}

// Returns a valid access token, refreshing it if expired.
async function getAccessToken() {
  const stored = getYouTube();
  if (!stored || !stored.tokens) throw new Error('YouTube is not connected');

  const { tokens } = stored;
  if (tokens.accessToken && tokens.expiry && tokens.expiry > Date.now() + 60_000) {
    return tokens.accessToken;
  }
  if (!tokens.refreshToken) {
    throw new Error('No refresh token — reconnect YouTube');
  }

  const data = await tokenRequest({
    client_id: config.youtube.clientId,
    client_secret: config.youtube.clientSecret,
    refresh_token: tokens.refreshToken,
    grant_type: 'refresh_token',
  });

  const updated = {
    ...stored,
    tokens: {
      ...tokens,
      accessToken: data.access_token,
      expiry: Date.now() + (data.expires_in || 3600) * 1000,
      scope: data.scope || tokens.scope,
    },
  };
  setYouTube(updated);
  return updated.tokens.accessToken;
}

async function fetchChannel(accessToken) {
  const res = await fetch(CHANNELS_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Channels API ${res.status}: ${data.error?.message || 'unknown'}`);
  }
  const item = (data.items || [])[0];
  return item ? { id: item.id, title: item.snippet?.title || null } : null;
}

// ---- Connection status -----------------------------------------------------

function grantedScopes() {
  const stored = getYouTube();
  return (stored?.tokens?.scope || '').split(/\s+/).filter(Boolean);
}

function missingPermissions() {
  const granted = new Set(grantedScopes());
  return config.youtube.scopes.filter((s) => !granted.has(s));
}

// Builds the connection card from STORED data only (no network). This is what
// the Connections page renders.
export function getCardSync() {
  const stored = getYouTube();
  const connected = !!(stored && stored.tokens && stored.tokens.refreshToken);
  const missing = missingPermissions();
  const hasUploadScope = grantedScopes().includes(
    'https://www.googleapis.com/auth/youtube.upload',
  );

  return {
    key: 'youtube',
    name: 'YouTube',
    nameHe: 'יוטיוב',
    connected,
    status: connected ? 'Connected' : 'Not connected',
    statusHe: connected ? 'מחובר' : 'לא מחובר',
    accountName: stored?.channel?.title || null,
    channelId: stored?.channel?.id || null,
    requiredPermissions: config.youtube.scopes,
    missingPermissions: connected ? missing : config.youtube.scopes,
    missingCredentials: isConfigured() ? [] : ['YT_CLIENT_ID', 'YT_CLIENT_SECRET'],
    configured: isConfigured(),
    canUpload: connected && hasUploadScope,
    // Phase 1: YouTube is the one platform where publishing is enabled.
    canPublish: connected && hasUploadScope,
    publishDisabledReason: connected
      ? null
      : 'התחברו ל-YouTube כדי לאפשר פרסום.',
    privacyStatus: config.youtube.privacyStatus,
    connectedAt: stored?.connectedAt || null,
    checkedAt: stored?.checkedAt || null,
    authUrlPath: '/api/youtube/oauth/start',
  };
}

// Refreshes the token + channel and persists checkedAt. Returns the card.
export async function recheck() {
  const stored = getYouTube();
  if (!stored || !stored.tokens?.refreshToken) {
    return getCardSync();
  }
  const accessToken = await getAccessToken();
  const channel = await fetchChannel(accessToken);
  setYouTube({
    ...getYouTube(),
    channel,
    checkedAt: new Date().toISOString(),
  });
  return getCardSync();
}

export function disconnect() {
  clearYouTube();
  return getCardSync();
}

// ---- Publishing ------------------------------------------------------------

// Performs a resumable upload of the video as a YouTube Short. Returns
// { videoId, url, publishedAt }. Throws on any failure (caller records it).
export async function publishShort({ filePath, title, description, tags, privacyStatus }) {
  if (!fs.existsSync(filePath)) throw new Error('Video file not found on disk');
  const size = fs.statSync(filePath).size;
  if (size > config.youtube.maxUploadBytes) {
    throw new Error(`File too large for upload (${size} bytes > limit)`);
  }

  const accessToken = await getAccessToken();
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_BY_EXT[ext] || 'video/*';

  const metadata = {
    snippet: {
      title: (title || 'MOOD Short').slice(0, 100),
      description: (description || '').slice(0, 5000),
      tags: (tags || []).slice(0, 60),
      categoryId: config.youtube.categoryId,
    },
    status: {
      privacyStatus: privacyStatus || config.youtube.privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };

  // Step 1: initiate the resumable session.
  const initRes = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(size),
    },
    body: JSON.stringify(metadata),
  });
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(`Upload init ${initRes.status}: ${err.error?.message || 'unknown'}`);
  }
  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) throw new Error('No resumable upload URL returned by YouTube');

  // Step 2: upload the bytes. Shorts are small, so a single PUT is fine.
  const fileBytes = fs.readFileSync(filePath);
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType, 'Content-Length': String(size) },
    body: fileBytes,
  });
  const result = await putRes.json().catch(() => ({}));
  if (!putRes.ok) {
    throw new Error(`Upload ${putRes.status}: ${result.error?.message || 'unknown'}`);
  }
  if (!result.id) throw new Error('Upload succeeded but no video ID returned');

  return {
    videoId: result.id,
    url: `https://www.youtube.com/shorts/${result.id}`,
    publishedAt: new Date().toISOString(),
    privacyStatus: metadata.status.privacyStatus,
  };
}
