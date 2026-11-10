const crypto = require('crypto');
const { getHeader } = require('./auth');

/**
 * Leader / access password from env.
 * Set either LEADER_PASSWORD or ACCESS_PASSWORD in Vercel (and bot .env).
 * Do not commit real values — placeholders only in .env.example.
 */
function getLeaderPassword() {
  const raw = process.env.LEADER_PASSWORD || process.env.ACCESS_PASSWORD || '';
  const value = String(raw).trim();
  return value || null;
}

function accessConfigured() {
  return Boolean(getLeaderPassword());
}

function timingSafeEqualString(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function extractProvidedPassword(req) {
  const header =
    getHeader(req, 'x-leader-password') ||
    getHeader(req, 'x-access-password') ||
    '';
  if (header) return String(header).trim();

  const authHeader = getHeader(req, 'authorization') || '';
  const accessBearer = authHeader.match(/^Access\s+(.+)$/i)?.[1];
  if (accessBearer) return String(accessBearer).trim();

  // Query fallback for openLink / <img src> (avoid sharing these URLs)
  const q = req.query || {};
  if (q.access) return String(q.access).trim();
  if (q.leader_password) return String(q.leader_password).trim();
  return '';
}

/**
 * When LEADER_PASSWORD / ACCESS_PASSWORD is set, require a matching password.
 * When unset, access is open (local/dev).
 */
function requireLeaderAccess(req) {
  const expected = getLeaderPassword();
  if (!expected) {
    return { ok: true, mode: 'open_dev', accessRequired: false };
  }
  const provided = extractProvidedPassword(req);
  if (!provided || !timingSafeEqualString(provided, expected)) {
    return {
      ok: false,
      status: 401,
      error: 'Leader password required',
      code: 'LEADER_PASSWORD_REQUIRED',
      accessRequired: true,
    };
  }
  return { ok: true, mode: 'leader_password', accessRequired: true };
}

/**
 * @returns {null | { status: number, body: object }} denial payload, or null if allowed
 */
function leaderAccessDenial(req) {
  const access = requireLeaderAccess(req);
  if (access.ok) return null;
  return {
    status: access.status || 401,
    body: {
      error: access.error || 'Leader password required',
      code: access.code || 'LEADER_PASSWORD_REQUIRED',
      accessRequired: true,
    },
  };
}

module.exports = {
  getLeaderPassword,
  accessConfigured,
  requireLeaderAccess,
  extractProvidedPassword,
  leaderAccessDenial,
};
