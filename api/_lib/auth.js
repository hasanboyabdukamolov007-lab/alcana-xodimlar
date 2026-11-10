const crypto = require('crypto');

function getHeader(req, name) {
  const key = Object.keys(req.headers || {}).find((h) => h.toLowerCase() === name.toLowerCase());
  return key ? req.headers[key] : undefined;
}

function parseInitData(initData) {
  const params = new URLSearchParams(initData);
  const data = {};
  for (const [k, v] of params.entries()) data[k] = v;
  return data;
}

/**
 * Validate Telegram WebApp initData (HMAC-SHA256).
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateTelegramInitData(initData, botToken, maxAgeSec = 86400) {
  if (!initData || !botToken) return { ok: false, reason: 'missing' };
  const data = parseInitData(initData);
  const hash = data.hash;
  if (!hash) return { ok: false, reason: 'no_hash' };

  const pairs = [];
  for (const [k, v] of Object.entries(data)) {
    if (k === 'hash') continue;
    pairs.push(`${k}=${v}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Compare hex strings (not decoded buffers) so trailing junk cannot pass
  if (!/^[0-9a-f]{64}$/i.test(hash) || !timingSafeEqualString(computed, hash.toLowerCase())) {
    return { ok: false, reason: 'bad_hash' };
  }

  if (data.auth_date) {
    const age = Math.floor(Date.now() / 1000) - Number(data.auth_date);
    if (Number.isFinite(age) && age > maxAgeSec) {
      return { ok: false, reason: 'expired' };
    }
  }

  let user = null;
  try {
    user = data.user ? JSON.parse(data.user) : null;
  } catch {
    user = null;
  }
  return { ok: true, user, authDate: data.auth_date };
}

function authMode() {
  const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const adminToken = process.env.ADMIN_API_TOKEN;
  return {
    botToken: botToken || null,
    adminToken: adminToken || null,
    requireAuth: Boolean(botToken || adminToken),
  };
}

/**
 * Protect write APIs.
 * Accepts:
 * - X-Telegram-Init-Data / Authorization: tma <initData> (validated with BOT_TOKEN)
 * - X-Admin-Token or Authorization: Bearer <ADMIN_API_TOKEN>
 * If neither BOT_TOKEN nor ADMIN_API_TOKEN is set, writes are allowed (local/dev only).
 */
function requireWriteAuth(req) {
  const { botToken, adminToken, requireAuth } = authMode();
  if (!requireAuth) {
    return { ok: true, mode: 'open_dev' };
  }

  const adminHeader = getHeader(req, 'x-admin-token');
  const authHeader = getHeader(req, 'authorization') || '';
  const bearer = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  const providedAdmin = adminHeader || bearer;
  if (adminToken && providedAdmin && timingSafeEqualString(providedAdmin, adminToken)) {
    return { ok: true, mode: 'admin' };
  }

  const initData =
    getHeader(req, 'x-telegram-init-data') ||
    (authHeader.match(/^tma\s+(.+)$/i)?.[1] ?? null);

  if (botToken && initData) {
    const result = validateTelegramInitData(initData, botToken);
    if (result.ok) return { ok: true, mode: 'telegram', user: result.user };
    return { ok: false, status: 401, error: `Invalid Telegram initData (${result.reason})` };
  }

  return {
    ok: false,
    status: 401,
    error: 'Unauthorized: send Telegram initData or X-Admin-Token',
  };
}

function timingSafeEqualString(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

module.exports = {
  requireWriteAuth,
  authMode,
  validateTelegramInitData,
  getHeader,
};
