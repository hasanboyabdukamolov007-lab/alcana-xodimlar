const {
  ensureSchema,
  listEmployees,
  createEmployee,
} = require('../_lib/db');
const { requireWriteAuth } = require('../_lib/auth');
const { readJson, sendJson, handleOptions } = require('../_lib/http');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    await ensureSchema();

    if (req.method === 'GET') {
      const employees = await listEmployees();
      return sendJson(res, 200, { employees });
    }

    if (req.method === 'POST') {
      const auth = requireWriteAuth(req);
      if (!auth.ok) return sendJson(res, auth.status || 401, { error: auth.error });

      const body = await readJson(req);
      const name = (body.name || '').trim();
      if (!name) return sendJson(res, 400, { error: 'name is required' });

      const employee = await createEmployee({
        name,
        position: body.position || {},
        photo: body.photo || '',
      });
      return sendJson(res, 201, { employee });
    }

    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    const status = err.statusCode || 500;
    return sendJson(res, status, { error: err.message || 'Server error' });
  }
};
