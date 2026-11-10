const {
  ensureSchema,
  setDocumentPresent,
  saveDocumentFile,
} = require('../../../_lib/db');
const { isValidDocId } = require('../../../_lib/docs');
const { requireWriteAuth } = require('../../../_lib/auth');
const { readJson, sendJson, handleOptions } = require('../../../_lib/http');
const { storeFile } = require('../../../_lib/store');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const id = req.query?.id;
  const docId = req.query?.docId;
  if (!id || !docId) return sendJson(res, 400, { error: 'Missing id or docId' });
  if (!isValidDocId(docId)) return sendJson(res, 400, { error: 'Invalid document id' });

  try {
    await ensureSchema();

    if (req.method === 'PATCH') {
      const auth = requireWriteAuth(req);
      if (!auth.ok) return sendJson(res, auth.status || 401, { error: auth.error });

      const body = await readJson(req);
      if (typeof body.present !== 'boolean') {
        return sendJson(res, 400, { error: 'present (boolean) is required' });
      }
      try {
        const employee = await setDocumentPresent(id, docId, body.present);
        if (!employee) return sendJson(res, 404, { error: 'Employee not found' });
        return sendJson(res, 200, { employee });
      } catch (err) {
        if (err.code === 'FILE_REQUIRED' || err.statusCode === 400) {
          return sendJson(res, 400, {
            error: err.message || 'File required before marking document present',
            code: 'FILE_REQUIRED',
          });
        }
        throw err;
      }
    }

    if (req.method === 'POST') {
      const auth = requireWriteAuth(req);
      if (!auth.ok) return sendJson(res, auth.status || 401, { error: auth.error });

      const body = await readJson(req);
      const filename = (body.filename || '').trim();
      const base64 = body.data || body.base64;
      if (!filename || !base64) {
        return sendJson(res, 400, { error: 'filename and data (base64) are required' });
      }

      const stored = await storeFile({
        filename,
        mimeType: body.mimeType || body.type,
        base64,
      });

      const employee = await saveDocumentFile(id, docId, {
        filename,
        mimeType: stored.mimeType,
        fileUrl: stored.fileUrl,
        fileData: stored.fileData,
        date: body.date,
      });
      if (!employee) return sendJson(res, 404, { error: 'Employee not found' });
      return sendJson(res, 200, { employee });
    }

    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    const status = err.statusCode || 500;
    return sendJson(res, status, { error: err.message || 'Server error' });
  }
};
