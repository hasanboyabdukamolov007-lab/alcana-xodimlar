const { ensureSchema, backendConfigured, getDbUrl } = require('./_lib/db');
const { authMode } = require('./_lib/auth');
const { sendJson, handleOptions } = require('./_lib/http');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    await ensureSchema();
    const auth = authMode();
    const usingTurso = Boolean(process.env.TURSO_DATABASE_URL);
    return sendJson(res, 200, {
      ok: true,
      backend: true,
      database: usingTurso ? 'turso' : 'local-sqlite',
      databaseConfigured: backendConfigured(),
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      authRequired: auth.requireAuth,
      authModes: {
        telegramInitData: Boolean(auth.botToken),
        adminToken: Boolean(auth.adminToken),
      },
      // never expose secrets or full local paths in production
      dbHint: usingTurso ? 'turso' : 'file',
    });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { ok: false, error: err.message || 'DB error' });
  }
};
