const { ensureSchema, getDocumentFileById } = require('../_lib/db');
const { isValidDocId } = require('../_lib/docs');
const { requireWriteAuth, authMode } = require('../_lib/auth');
const { readJson, sendJson, handleOptions } = require('../_lib/http');

/**
 * Send a stored document file to the authenticated Telegram user via Bot API.
 * POST { employeeId, docId, fileId }
 */
module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  try {

    const auth = requireWriteAuth(req);
    if (!auth.ok) return sendJson(res, auth.status || 401, { error: auth.error });

    const { botToken } = authMode();
    if (!botToken) {
      return sendJson(res, 503, {
        error: 'BOT_TOKEN not configured — cannot send to Telegram',
        code: 'NO_BOT_TOKEN',
      });
    }

    const chatId = auth.user?.id;
    if (!chatId) {
      return sendJson(res, 400, {
        error:
          'Telegram user id required. Open Mini App from the bot so initData includes user, or use Telegram auth.',
        code: 'NO_TELEGRAM_USER',
      });
    }

    const body = await readJson(req);
    const employeeId = (body.employeeId || '').trim();
    const docId = (body.docId || '').trim();
    const fileId = (body.fileId || '').trim();
    if (!employeeId || !docId || !fileId) {
      return sendJson(res, 400, { error: 'employeeId, docId, and fileId are required' });
    }
    if (!isValidDocId(docId)) return sendJson(res, 400, { error: 'Invalid document id' });

    await ensureSchema();
    const doc = await getDocumentFileById(employeeId, docId, fileId);
    if (!doc || (!doc.file_url && !doc.file_data)) {
      return sendJson(res, 404, { error: 'File not found' });
    }

    const caption = body.caption || doc.filename || docId;
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;

    let tgRes;
    if (doc.file_url && /^https?:\/\//i.test(doc.file_url)) {
      tgRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          document: doc.file_url,
          caption: String(caption).slice(0, 1024),
        }),
      });
    } else {
      const buffer = Buffer.from(doc.file_data, 'base64');
      const form = new FormData();
      form.append('chat_id', String(chatId));
      form.append('caption', String(caption).slice(0, 1024));
      const blob = new Blob([buffer], { type: doc.mime_type || 'application/octet-stream' });
      form.append('document', blob, doc.filename || `${docId}.bin`);
      tgRes = await fetch(apiUrl, { method: 'POST', body: form });
    }

    const tgData = await tgRes.json().catch(() => ({}));
    if (!tgRes.ok || !tgData.ok) {
      console.error('Telegram sendDocument failed', tgData);
      return sendJson(res, 502, {
        error: tgData.description || 'Telegram sendDocument failed',
        code: 'TELEGRAM_SEND_FAILED',
      });
    }

    return sendJson(res, 200, { ok: true, messageId: tgData.result?.message_id });
  } catch (err) {
    console.error(err);
    const status = err.statusCode || 500;
    return sendJson(res, status, { error: err.message || 'Server error' });
  }
};
