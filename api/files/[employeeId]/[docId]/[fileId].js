const { ensureSchema, getDocumentFileById } = require('../../../_lib/db');
const { isValidDocId } = require('../../../_lib/docs');
const { setCors, handleOptions, sendJson } = require('../../../_lib/http');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });

  const employeeId = req.query?.employeeId;
  const docId = req.query?.docId;
  const fileId = req.query?.fileId;
  if (!employeeId || !docId || !fileId) return sendJson(res, 400, { error: 'Missing params' });
  if (!isValidDocId(docId)) return sendJson(res, 400, { error: 'Invalid document id' });

  try {
    await ensureSchema();
    const doc = await getDocumentFileById(employeeId, docId, fileId);
    if (!doc || (!doc.file_url && !doc.file_data)) {
      return sendJson(res, 404, { error: 'File not found' });
    }

    if (doc.file_url) {
      setCors(res);
      res.statusCode = 302;
      res.setHeader('Location', doc.file_url);
      res.end();
      return;
    }

    const buffer = Buffer.from(doc.file_data, 'base64');
    setCors(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${(doc.filename || docId).replace(/"/g, '')}"`
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(buffer);
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err.message || 'Server error' });
  }
};
