const {
  ensureSchema,
  updateDocumentFileDate,
  deleteDocumentFile,
} = require('../../../../../_lib/db');
const { isValidDocId } = require('../../../../../_lib/docs');
const { requireWriteAuth } = require('../../../../../_lib/auth');
const { leaderAccessDenial } = require('../../../../../_lib/access');
const { readJson, sendJson, handleOptions } = require('../../../../../_lib/http');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const id = req.query?.id;
  const docId = req.query?.docId;
  const fileId = req.query?.fileId;
  if (!id || !docId || !fileId) {
    return sendJson(res, 400, { error: 'Missing id, docId, or fileId' });
  }
  if (!isValidDocId(docId)) return sendJson(res, 400, { error: 'Invalid document id' });

  try {
    const denied = leaderAccessDenial(req);
    if (denied) return sendJson(res, denied.status, denied.body);

    await ensureSchema();
    const auth = requireWriteAuth(req);
    if (!auth.ok) return sendJson(res, auth.status || 401, { error: auth.error });

    if (req.method === 'PATCH') {
      const body = await readJson(req);
      const date = (body.date || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return sendJson(res, 400, { error: 'date (YYYY-MM-DD) is required' });
      }
      const employee = await updateDocumentFileDate(id, docId, fileId, date);
      if (!employee) return sendJson(res, 404, { error: 'File or employee not found' });
      return sendJson(res, 200, { employee });
    }

    if (req.method === 'DELETE') {
      try {
        const employee = await deleteDocumentFile(id, docId, fileId);
        if (!employee) return sendJson(res, 404, { error: 'Employee not found' });
        return sendJson(res, 200, { employee });
      } catch (err) {
        if (err.statusCode === 404) return sendJson(res, 404, { error: err.message });
        throw err;
      }
    }

    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    const status = err.statusCode || 500;
    return sendJson(res, status, { error: err.message || 'Server error' });
  }
};
