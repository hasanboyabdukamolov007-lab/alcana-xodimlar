const {
  ensureSchema,
  getEmployee,
  saveEmployeePhoto,
  getEmployeePhotoRow,
  clearEmployeePhoto,
} = require('../../_lib/db');
const { requireWriteAuth } = require('../../_lib/auth');
const { leaderAccessDenial } = require('../../_lib/access');
const { readJson, sendJson, handleOptions, setCors } = require('../../_lib/http');
const { storeFile } = require('../../_lib/store');

const IMAGE_MIME = /^(image\/(jpeg|jpg|png|webp|gif|heic|heif))$/i;

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const id = req.query?.id;
  if (!id) return sendJson(res, 400, { error: 'Missing employee id' });

  try {
    const denied = leaderAccessDenial(req);
    if (denied) return sendJson(res, denied.status, denied.body);

    await ensureSchema();

    if (req.method === 'GET') {
      const row = await getEmployeePhotoRow(id);
      if (!row) return sendJson(res, 404, { error: 'Employee not found' });

      // External / blob URL stored on photo field
      if (row.photo && /^https?:\/\//i.test(row.photo) && !row.photo_data) {
        setCors(res);
        res.statusCode = 302;
        res.setHeader('Location', row.photo);
        res.end();
        return;
      }

      if (!row.photo_data) {
        return sendJson(res, 404, { error: 'Photo not found' });
      }

      const buffer = Buffer.from(row.photo_data, 'base64');
      setCors(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', row.photo_mime || 'image/jpeg');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.end(buffer);
      return;
    }

    if (req.method === 'DELETE') {
      const auth = requireWriteAuth(req);
      if (!auth.ok) return sendJson(res, auth.status || 401, { error: auth.error });

      const employee = await clearEmployeePhoto(id);
      if (!employee) return sendJson(res, 404, { error: 'Employee not found' });
      return sendJson(res, 200, { employee });
    }

    if (req.method === 'POST') {
      const auth = requireWriteAuth(req);
      if (!auth.ok) return sendJson(res, auth.status || 401, { error: auth.error });

      const existing = await getEmployee(id);
      if (!existing) return sendJson(res, 404, { error: 'Employee not found' });

      const body = await readJson(req);
      const filename = (body.filename || 'photo.jpg').trim();
      const base64 = body.data || body.base64;
      const mimeType = body.mimeType || body.type || 'image/jpeg';

      if (!base64) {
        return sendJson(res, 400, { error: 'data (base64) is required' });
      }
      if (!IMAGE_MIME.test(mimeType) && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(filename)) {
        return sendJson(res, 400, { error: 'Only image files are allowed' });
      }

      const stored = await storeFile({
        filename,
        mimeType,
        base64,
        prefix: 'staff-photos',
      });

      let photoUrl = stored.fileUrl;
      let photoData = stored.fileData;
      let photoMime = stored.mimeType;

      if (!photoUrl && photoData) {
        // Serve via this endpoint so list responses stay small
        photoUrl = `/api/employees/${id}/photo`;
      }

      const employee = await saveEmployeePhoto(id, {
        photoUrl,
        photoData,
        photoMime,
      });
      return sendJson(res, 200, { employee });
    }

    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    const status = err.statusCode || 500;
    return sendJson(res, status, { error: err.message || 'Server error' });
  }
};
