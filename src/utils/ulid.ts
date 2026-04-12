/**
 * Generates a time-sortable unique ID suitable for SQLite primary keys.
 * Format: 26-char base32 string (same layout as ULID spec).
 * Uses expo-crypto for cryptographically secure random bytes.
 */

import * as Crypto from 'expo-crypto';

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(ms: number, len: number): string {
  let str = '';
  for (let i = len - 1; i >= 0; i--) {
    str = ENCODING[ms % 32] + str;
    ms = Math.floor(ms / 32);
  }
  return str;
}

function encodeRandom(bytes: Uint8Array): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += ENCODING[bytes[i] % 32];
  }
  return str;
}

export function ulid(): string {
  const ms = Date.now();
  const randomBytes = Crypto.getRandomValues(new Uint8Array(10));
  return encodeTime(ms, 10) + encodeRandom(randomBytes);
}
