// Platform connection checks.
//
// YouTube is real (Phase 1): its card reflects the OAuth connection and can
// publish. Instagram / Facebook / TikTok remain env-based stubs that cannot
// publish yet — their cards report whether credentials *exist*, nothing more.

import { PLATFORMS } from './config.js';
import { setPlatformCheck, getPlatformChecks } from './store.js';
import { getCardSync as youtubeCard } from './youtube.js';

function checkOne(platform) {
  // YouTube uses the live OAuth card, not the env-stub path.
  if (platform.key === 'youtube') return youtubeCard();

  const missingCredentials = platform.credentialEnv.filter(
    (name) => !process.env[name],
  );
  const connected = missingCredentials.length === 0;

  // Account name comes from a per-platform env var, e.g. IG_ACCOUNT_NAME.
  const accountName = platform.accountEnv
    ? process.env[platform.accountEnv] || null
    : null;

  // Until a real token check is implemented, we report capability based on
  // whether credentials exist. Publishing stays disabled by policy in v1.
  const canUpload = connected; // could technically upload if connected
  const canPublish = false; // disabled in v1 — review only, never publish

  return {
    key: platform.key,
    name: platform.name,
    nameHe: platform.nameHe,
    connected,
    status: connected ? 'Connected' : 'Not connected',
    statusHe: connected ? 'מחובר' : 'לא מחובר',
    accountName,
    requiredPermissions: platform.requiredPermissions,
    // When not connected, every permission is effectively "missing".
    missingPermissions: connected ? [] : platform.requiredPermissions,
    missingCredentials,
    canUpload,
    canPublish,
    publishDisabledReason:
      'פרסום מושבת בגרסה זו (v1) — המערכת לבדיקה והמלצות בלבד.',
    checkedAt: new Date().toISOString(),
  };
}

// Runs checks for all platforms and persists the results with a timestamp.
export function runChecks() {
  const results = PLATFORMS.map((p) => {
    const result = checkOne(p);
    setPlatformCheck(p.key, result);
    return result;
  });
  return results;
}

// Returns the last persisted checks, falling back to a fresh run.
export function getConnections() {
  const stored = getPlatformChecks();
  if (!stored || Object.keys(stored).length === 0) {
    return runChecks();
  }
  // Keep order consistent with PLATFORMS definition. YouTube is always live
  // (never served from the persisted stub) so its OAuth state is current.
  return PLATFORMS.map((p) =>
    p.key === 'youtube' ? youtubeCard() : stored[p.key] || checkOne(p),
  );
}
