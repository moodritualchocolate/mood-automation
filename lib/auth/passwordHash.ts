/**
 * PASSWORD HASH (scrypt · stdlib only · no new npm deps)
 *
 * Per directive: scrypt for this phase. argon2id deferred.
 *
 * Parameters: N=2**15, r=8, p=1, keyLen=64 (OWASP minimum, ~80ms).
 * Timing-safe verify via crypto.timingSafeEqual.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SCRYPT_N = 1 << 15;     // 32768
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SALT_BYTES = 16;

export interface PasswordHashResult {
  passwordHash: string;   // hex
  passwordSalt: string;   // hex
}

export function hashPassword(password: string): PasswordHashResult {
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('password must be at least 12 characters');
  }
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P,
  });
  return {
    passwordHash: hash.toString('hex'),
    passwordSalt: salt.toString('hex'),
  };
}

export function verifyPassword(
  password: string,
  passwordHash: string,
  passwordSalt: string,
): boolean {
  if (typeof password !== 'string' || password.length === 0) return false;
  const salt = Buffer.from(passwordSalt, 'hex');
  const expected = Buffer.from(passwordHash, 'hex');
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P,
  });
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
