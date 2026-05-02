/**
 * Browser-safe JWT payload decode (no signature verification).
 * Handles base64url padding.
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/** @returns {number | null} expiry as milliseconds since epoch */
export function getJwtExpiresAtMs(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000;
}

export function isJwtExpired(token, skewMs = 30_000) {
  const expMs = getJwtExpiresAtMs(token);
  if (expMs == null) return false;
  return Date.now() >= expMs - skewMs;
}

export function getJwtSecondsUntilExpiry(token) {
  const expMs = getJwtExpiresAtMs(token);
  if (expMs == null) return null;
  return Math.floor((expMs - Date.now()) / 1000);
}
