/**
 * AUTH TYPES (shared)
 *
 * UserRecord and SessionRecord are PII-bearing. Pure-data shapes.
 * The store NEVER returns passwordHash / passwordSalt / tokenHash
 * over any GET route. The session cookie is the only carrier of
 * the raw token; the store keeps a salted hash.
 */

export type UserId = string;     // 'user-<base36>-<seq>'
export type SessionId = string;  // 'sess-<base36>-<seq>'

export interface UserRecord {
  userId: UserId;
  /** Lowercased + trimmed. Unique platform-wide. */
  email: string;
  displayName: string;
  /** scrypt-derived key, hex-encoded. Never serialized to a route response. */
  passwordHash: string;
  /** Per-user salt, hex-encoded. Never serialized to a route response. */
  passwordSalt: string;
  /** Operator who created the record (self-register: same userId). */
  createdBy: UserId;
  createdAt: number;
  /** A disabled user cannot authenticate. */
  disabledAt?: number;
  /** Failed-login counter (reset on success). */
  failedLoginCount: number;
  /** Wallclock until which login is rate-limited. 0 = no lockout. */
  lockedUntil: number;
  operatorNote?: string;
}

export interface SessionRecord {
  sessionId: SessionId;
  userId: UserId;
  /** sha-256 of the raw token + sessionId. Never serialized. */
  tokenHash: string;
  createdAt: number;
  /** Sliding-expiry · last-seen update on each `me` hit. */
  lastSeenAt: number;
  /** Hard absolute expiry. Always <= createdAt + ABSOLUTE_TTL_MS. */
  expiresAt: number;
  revokedAt?: number;
  revokedReason?: string;
  /** Operator-readable hint · NOT raw IP / UA. */
  contextHint?: string;
}

/** Safe shape returned over HTTP. PII-stripped. */
export interface SafeUser {
  userId: UserId;
  email: string;
  displayName: string;
  createdAt: number;
  disabledAt?: number;
}

export function toSafeUser(u: UserRecord): SafeUser {
  return {
    userId: u.userId, email: u.email, displayName: u.displayName,
    createdAt: u.createdAt, disabledAt: u.disabledAt,
  };
}

/** Resolved auth context returned by `resolveSession`. */
export interface AuthContext {
  session: SessionRecord;
  user: UserRecord;
}
