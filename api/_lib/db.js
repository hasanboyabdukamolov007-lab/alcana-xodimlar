const { createClient } = require('@libsql/client');
const { randomUUID } = require('crypto');
const path = require('path');
const { DOC_IDS } = require('./docs');

let client;
let ready;

function getDbUrl() {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  // Local / smoke-test fallback (works with @libsql/client file: URLs)
  const filePath = path.join(process.cwd(), 'data', 'alcana.db');
  return `file:${filePath}`;
}

function getClient() {
  if (client) return client;
  const url = getDbUrl();
  const authToken = process.env.TURSO_AUTH_TOKEN;
  client = createClient(authToken ? { url, authToken } : { url });
  return client;
}

async function ensureSchema() {
  if (ready) return getClient();
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      position_uz TEXT NOT NULL DEFAULT '',
      position_ru TEXT NOT NULL DEFAULT '',
      position_en TEXT NOT NULL DEFAULT '',
      photo TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      employee_id TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      present INTEGER NOT NULL DEFAULT 0,
      filename TEXT,
      date TEXT,
      file_url TEXT,
      file_data TEXT,
      mime_type TEXT,
      PRIMARY KEY (employee_id, doc_id),
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `);
  ready = true;
  return db;
}

function documentHasFile(d) {
  return Boolean(d && (d.file_url || d.file_data));
}

function rowToEmployee(row, docsRows) {
  const documents = {};
  for (const id of DOC_IDS) {
    documents[id] = { present: false };
  }
  for (const d of docsRows || []) {
    // Confirmed/complete only when a file is stored — ignore empty present flags.
    const hasFile = documentHasFile(d);
    documents[d.doc_id] = {
      present: hasFile,
      filename: hasFile ? d.filename || undefined : undefined,
      date: hasFile ? d.date || undefined : undefined,
      url: hasFile ? d.file_url || undefined : undefined,
      mimeType: hasFile ? d.mime_type || undefined : undefined,
      hasFile,
    };
  }
  return {
    id: row.id,
    name: row.name,
    position: {
      uz: row.position_uz || '',
      ru: row.position_ru || '',
      en: row.position_en || '',
    },
    photo: row.photo || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    documents,
  };
}

async function listEmployees() {
  const db = await ensureSchema();
  const { rows } = await db.execute('SELECT * FROM employees ORDER BY name COLLATE NOCASE ASC');
  const result = [];
  for (const row of rows) {
    const docs = await db.execute({
      sql: 'SELECT doc_id, present, filename, date, file_url, mime_type, CASE WHEN file_data IS NOT NULL AND length(file_data) > 0 THEN 1 ELSE 0 END AS has_data FROM documents WHERE employee_id = ?',
      args: [row.id],
    });
    // Re-map has_data into file_data presence without sending blobs in list
    const docsRows = docs.rows.map((d) => ({
      ...d,
      file_data: d.has_data ? '1' : null,
    }));
    result.push(rowToEmployee(row, docsRows));
  }
  return result;
}

async function getEmployee(id) {
  const db = await ensureSchema();
  const { rows } = await db.execute({
    sql: 'SELECT * FROM employees WHERE id = ?',
    args: [id],
  });
  if (!rows.length) return null;
  const docs = await db.execute({
    sql: 'SELECT doc_id, present, filename, date, file_url, mime_type, CASE WHEN file_data IS NOT NULL AND length(file_data) > 0 THEN 1 ELSE 0 END AS has_data FROM documents WHERE employee_id = ?',
    args: [id],
  });
  const docsRows = docs.rows.map((d) => ({
    ...d,
    file_data: d.has_data ? '1' : null,
  }));
  return rowToEmployee(rows[0], docsRows);
}

async function createEmployee({ name, position, photo }) {
  const db = await ensureSchema();
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO employees (id, name, position_uz, position_ru, position_en, photo, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      name.trim(),
      (position?.uz || '').trim(),
      (position?.ru || '').trim(),
      (position?.en || '').trim(),
      (photo || '').trim(),
      now,
      now,
    ],
  });
  for (const docId of DOC_IDS) {
    await db.execute({
      sql: `INSERT INTO documents (employee_id, doc_id, present) VALUES (?, ?, 0)`,
      args: [id, docId],
    });
  }
  return getEmployee(id);
}

async function updateEmployee(id, { name, position, photo }) {
  const db = await ensureSchema();
  const existing = await getEmployee(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE employees SET
            name = ?,
            position_uz = ?,
            position_ru = ?,
            position_en = ?,
            photo = ?,
            updated_at = ?
          WHERE id = ?`,
    args: [
      name != null ? String(name).trim() : existing.name,
      position?.uz != null ? String(position.uz).trim() : existing.position.uz,
      position?.ru != null ? String(position.ru).trim() : existing.position.ru,
      position?.en != null ? String(position.en).trim() : existing.position.en,
      photo != null ? String(photo).trim() : existing.photo,
      now,
      id,
    ],
  });
  return getEmployee(id);
}

async function deleteEmployee(id) {
  const db = await ensureSchema();
  const existing = await getEmployee(id);
  if (!existing) return false;
  await db.execute({ sql: 'DELETE FROM documents WHERE employee_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM employees WHERE id = ?', args: [id] });
  return true;
}

async function setDocumentPresent(employeeId, docId, present) {
  const db = await ensureSchema();
  const emp = await getEmployee(employeeId);
  if (!emp) return null;
  const nowDate = new Date().toISOString().split('T')[0];
  if (!present) {
    await db.execute({
      sql: `INSERT INTO documents (employee_id, doc_id, present, filename, date, file_url, file_data, mime_type)
            VALUES (?, ?, 0, NULL, NULL, NULL, NULL, NULL)
            ON CONFLICT(employee_id, doc_id) DO UPDATE SET
              present = 0, filename = NULL, date = NULL, file_url = NULL, file_data = NULL, mime_type = NULL`,
      args: [employeeId, docId],
    });
  } else {
    const existing = await getDocumentFile(employeeId, docId);
    if (!documentHasFile(existing)) {
      const err = new Error('File required before marking document present');
      err.statusCode = 400;
      err.code = 'FILE_REQUIRED';
      throw err;
    }
    await db.execute({
      sql: `INSERT INTO documents (employee_id, doc_id, present, date)
            VALUES (?, ?, 1, ?)
            ON CONFLICT(employee_id, doc_id) DO UPDATE SET
              present = 1,
              date = COALESCE(documents.date, excluded.date)`,
      args: [employeeId, docId, nowDate],
    });
  }
  await db.execute({
    sql: 'UPDATE employees SET updated_at = ? WHERE id = ?',
    args: [new Date().toISOString(), employeeId],
  });
  return getEmployee(employeeId);
}

async function saveDocumentFile(employeeId, docId, { filename, mimeType, fileUrl, fileData }) {
  const db = await ensureSchema();
  const emp = await getEmployee(employeeId);
  if (!emp) return null;
  const date = new Date().toISOString().split('T')[0];
  await db.execute({
    sql: `INSERT INTO documents (employee_id, doc_id, present, filename, date, file_url, file_data, mime_type)
          VALUES (?, ?, 1, ?, ?, ?, ?, ?)
          ON CONFLICT(employee_id, doc_id) DO UPDATE SET
            present = 1,
            filename = excluded.filename,
            date = excluded.date,
            file_url = excluded.file_url,
            file_data = excluded.file_data,
            mime_type = excluded.mime_type`,
    args: [employeeId, docId, filename, date, fileUrl || null, fileData || null, mimeType || null],
  });
  await db.execute({
    sql: 'UPDATE employees SET updated_at = ? WHERE id = ?',
    args: [new Date().toISOString(), employeeId],
  });
  return getEmployee(employeeId);
}

async function getDocumentFile(employeeId, docId) {
  const db = await ensureSchema();
  const { rows } = await db.execute({
    sql: 'SELECT * FROM documents WHERE employee_id = ? AND doc_id = ?',
    args: [employeeId, docId],
  });
  return rows[0] || null;
}

function backendConfigured() {
  return Boolean(process.env.TURSO_DATABASE_URL) || process.env.NODE_ENV !== 'production';
}

module.exports = {
  ensureSchema,
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setDocumentPresent,
  saveDocumentFile,
  getDocumentFile,
  backendConfigured,
  getDbUrl,
};
