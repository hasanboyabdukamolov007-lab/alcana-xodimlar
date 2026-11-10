const {
  ensureSchema,
  getEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../_lib/db');
const { requireWriteAuth } = require('../_lib/auth');
const { readJson, sendJson, handleOptions } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const id = req.query?.id;
  if (!id) return sendJson(res, 400, { error: 'Missing employee id' });

  try {

    await ensureSchema();

    if (req.method === 'GET') {
      const employee = await getEmployee(id);
      if (!employee) return sendJson(res, 404, { error: 'Employee not found' });
      return sendJson(res, 200, { employee });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const auth = requireWriteAuth(req);
      if (!auth.ok) return sendJson(res, auth.status || 401, { error: auth.error });

      const body = await readJson(req);
      const employee = await updateEmployee(id, body);
      if (!employee) return sendJson(res, 404, { error: 'Employee not found' });
      return sendJson(res, 200, { employee });
    }

    if (req.method === 'DELETE') {
      const auth = requireWriteAuth(req);
      if (!auth.ok) return sendJson(res, auth.status || 401, { error: auth.error });

      const ok = await deleteEmployee(id);
      if (!ok) return sendJson(res, 404, { error: 'Employee not found' });
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    const status = err.statusCode || 500;
    return sendJson(res, status, { error: err.message || 'Server error' });
  }
};
