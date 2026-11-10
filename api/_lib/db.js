const { createClient } = require('@libsql/client');
const { randomUUID } = require('crypto');
const path = require('path');
const { DOC_IDS, LEGACY_DOC_IDS } = require('./docs');

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
  await db.execute(`
    CREATE TABLE IF NOT EXISTS document_files (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      date TEXT,
      file_url TEXT,
      file_data TEXT,
      mime_type TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `);
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_document_files_emp_doc ON document_files(employee_id, doc_id)`
  );

  // Profile photo binary (used when Vercel Blob is not configured)
  for (const col of ['photo_data TEXT', 'photo_mime TEXT']) {
    try {
      await db.execute(`ALTER TABLE employees ADD COLUMN ${col}`);
    } catch (err) {
      const msg = String(err?.message || err);
      if (!/duplicate column/i.test(msg)) throw err;
    }
  }

  await migrateLegacyDocumentFiles(db);
  await ensureDocSlotsForAllEmployees(db);

  ready = true;
  return db;
}

/** Move single-file rows from documents → document_files (once). */
async function migrateLegacyDocumentFiles(db) {
  const { rows } = await db.execute(`
    SELECT employee_id, doc_id, filename, date, file_url, file_data, mime_type
    FROM documents
    WHERE (file_url IS NOT NULL AND length(file_url) > 0)
       OR (file_data IS NOT NULL AND length(file_data) > 0)
  `);
  for (const row of rows) {
    const existing = await db.execute({
      sql: `SELECT id FROM document_files WHERE employee_id = ? AND doc_id = ? LIMIT 1`,
      args: [row.employee_id, row.doc_id],
    });
    if (existing.rows.length) continue;
    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO document_files
              (id, employee_id, doc_id, filename, date, file_url, file_data, mime_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        row.employee_id,
        row.doc_id,
        row.filename || `${row.doc_id}.bin`,
        row.date || now.split('T')[0],
        row.file_url || null,
        row.file_data || null,
        row.mime_type || null,
        now,
      ],
    });
    // Clear legacy blob columns (metadata slot row may remain)
    await db.execute({
      sql: `UPDATE documents SET filename = NULL, file_url = NULL, file_data = NULL, mime_type = NULL
            WHERE employee_id = ? AND doc_id = ?`,
      args: [row.employee_id, row.doc_id],
    });
  }
}

async function ensureDocSlotsForAllEmployees(db) {
  const { rows } = await db.execute('SELECT id FROM employees');
  for (const row of rows) {
    for (const docId of DOC_IDS) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO documents (employee_id, doc_id, present) VALUES (?, ?, 0)`,
        args: [row.id, docId],
      });
    }
  }
}

function mapFileRow(d) {
  const hasFile = Boolean(d.file_url || d.file_data || d.has_data);
  return {
    id: d.id,
    filename: d.filename || undefined,
    date: d.date || undefined,
    url: d.file_url || undefined,
    mimeType: d.mime_type || undefined,
    hasFile,
  };
}

function buildDocumentSlot(docId, fileRows) {
  const files = (fileRows || []).map(mapFileRow).filter((f) => f.hasFile || f.filename);
  const first = files[0];
  const present = files.length > 0;
  return {
    present,
    hasFile: present,
    files,
    // Backward-compatible single-file fields (first / latest)
    filename: first?.filename,
    date: first?.date,
    url: first?.url,
    mimeType: first?.mimeType,
  };
}

function rowToEmployee(row, fileRowsByDoc) {
  const documents = {};
  for (const id of DOC_IDS) {
    documents[id] = buildDocumentSlot(id, fileRowsByDoc?.[id] || []);
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

async function loadFileRowsForEmployee(db, employeeId) {
  const docs = await db.execute({
    sql: `SELECT id, doc_id, filename, date, file_url, mime_type,
                 CASE WHEN file_data IS NOT NULL AND length(file_data) > 0 THEN 1 ELSE 0 END AS has_data
          FROM document_files
          WHERE employee_id = ?
          ORDER BY date ASC, created_at ASC`,
    args: [employeeId],
  });
  const byDoc = {};
  for (const d of docs.rows) {
    if (!DOC_IDS.includes(d.doc_id) && !LEGACY_DOC_IDS.includes(d.doc_id)) continue;
    if (!DOC_IDS.includes(d.doc_id)) continue; // drop removed types from API
    if (!byDoc[d.doc_id]) byDoc[d.doc_id] = [];
    byDoc[d.doc_id].push({
      ...d,
      file_data: d.has_data ? '1' : null,
    });
  }
  return byDoc;
}

async function listEmployees() {
  const db = await ensureSchema();
  const { rows } = await db.execute('SELECT * FROM employees ORDER BY name COLLATE NOCASE ASC');
  const result = [];
  for (const row of rows) {
    const byDoc = await loadFileRowsForEmployee(db, row.id);
    result.push(rowToEmployee(row, byDoc));
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
  const byDoc = await loadFileRowsForEmployee(db, id);
  return rowToEmployee(rows[0], byDoc);
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
  await db.execute({ sql: 'DELETE FROM document_files WHERE employee_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM documents WHERE employee_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM employees WHERE id = ?', args: [id] });
  return true;
}

async function countFiles(employeeId, docId) {
  const db = await ensureSchema();
  const { rows } = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM document_files WHERE employee_id = ? AND doc_id = ?`,
    args: [employeeId, docId],
  });
  return Number(rows[0]?.c || 0);
}

async function setDocumentPresent(employeeId, docId, present) {
  const db = await ensureSchema();
  const emp = await getEmployee(employeeId);
  if (!emp) return null;
  if (!present) {
    await db.execute({
      sql: 'DELETE FROM document_files WHERE employee_id = ? AND doc_id = ?',
      args: [employeeId, docId],
    });
    await db.execute({
      sql: `INSERT INTO documents (employee_id, doc_id, present, filename, date, file_url, file_data, mime_type)
            VALUES (?, ?, 0, NULL, NULL, NULL, NULL, NULL)
            ON CONFLICT(employee_id, doc_id) DO UPDATE SET
              present = 0, filename = NULL, date = NULL, file_url = NULL, file_data = NULL, mime_type = NULL`,
      args: [employeeId, docId],
    });
  } else {
    const c = await countFiles(employeeId, docId);
    if (c < 1) {
      const err = new Error('File required before marking document present');
      err.statusCode = 400;
      err.code = 'FILE_REQUIRED';
      throw err;
    }
    const nowDate = new Date().toISOString().split('T')[0];
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

async function saveDocumentFile(employeeId, docId, { filename, mimeType, fileUrl, fileData, date }) {
  const db = await ensureSchema();
  const emp = await getEmployee(employeeId);
  if (!emp) return null;
  const fileDate = (date && String(date).trim()) || new Date().toISOString().split('T')[0];
  const fileId = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO document_files
            (id, employee_id, doc_id, filename, date, file_url, file_data, mime_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      fileId,
      employeeId,
      docId,
      filename,
      fileDate,
      fileUrl || null,
      fileData || null,
      mimeType || null,
      now,
    ],
  });
  await db.execute({
    sql: `INSERT INTO documents (employee_id, doc_id, present, date)
          VALUES (?, ?, 1, ?)
          ON CONFLICT(employee_id, doc_id) DO UPDATE SET
            present = 1,
            date = excluded.date`,
    args: [employeeId, docId, fileDate],
  });
  await db.execute({
    sql: 'UPDATE employees SET updated_at = ? WHERE id = ?',
    args: [now, employeeId],
  });
  return getEmployee(employeeId);
}

async function updateDocumentFileDate(employeeId, docId, fileId, date) {
  const db = await ensureSchema();
  const emp = await getEmployee(employeeId);
  if (!emp) return null;
  const result = await db.execute({
    sql: `UPDATE document_files SET date = ?
          WHERE id = ? AND employee_id = ? AND doc_id = ?`,
    args: [String(date).trim(), fileId, employeeId, docId],
  });
  if (!result.rowsAffected && result.rowsAffected !== 0) {
    // libsql may not expose rowsAffected consistently — verify existence
  }
  const row = await getDocumentFileById(employeeId, docId, fileId);
  if (!row) return null;
  await db.execute({
    sql: 'UPDATE employees SET updated_at = ? WHERE id = ?',
    args: [new Date().toISOString(), employeeId],
  });
  return getEmployee(employeeId);
}

async function deleteDocumentFile(employeeId, docId, fileId) {
  const db = await ensureSchema();
  const emp = await getEmployee(employeeId);
  if (!emp) return null;
  const row = await getDocumentFileById(employeeId, docId, fileId);
  if (!row) {
    const err = new Error('File not found');
    err.statusCode = 404;
    throw err;
  }
  await db.execute({
    sql: 'DELETE FROM document_files WHERE id = ? AND employee_id = ? AND doc_id = ?',
    args: [fileId, employeeId, docId],
  });
  const remaining = await countFiles(employeeId, docId);
  if (remaining < 1) {
    await db.execute({
      sql: `UPDATE documents SET present = 0, filename = NULL, date = NULL, file_url = NULL, file_data = NULL, mime_type = NULL
            WHERE employee_id = ? AND doc_id = ?`,
      args: [employeeId, docId],
    });
  }
  await db.execute({
    sql: 'UPDATE employees SET updated_at = ? WHERE id = ?',
    args: [new Date().toISOString(), employeeId],
  });
  return getEmployee(employeeId);
}

async function getDocumentFile(employeeId, docId) {
  // Latest file for backward-compatible /api/files/:emp/:docId
  const db = await ensureSchema();
  const { rows } = await db.execute({
    sql: `SELECT * FROM document_files
          WHERE employee_id = ? AND doc_id = ?
          ORDER BY date DESC, created_at DESC
          LIMIT 1`,
    args: [employeeId, docId],
  });
  return rows[0] || null;
}

async function getDocumentFileById(employeeId, docId, fileId) {
  const db = await ensureSchema();
  const { rows } = await db.execute({
    sql: `SELECT * FROM document_files WHERE id = ? AND employee_id = ? AND doc_id = ?`,
    args: [fileId, employeeId, docId],
  });
  return rows[0] || null;
}

async function saveEmployeePhoto(employeeId, { photoUrl, photoData, photoMime }) {
  const db = await ensureSchema();
  const existing = await getEmployee(employeeId);
  if (!existing) return null;
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE employees SET
            photo = ?,
            photo_data = ?,
            photo_mime = ?,
            updated_at = ?
          WHERE id = ?`,
    args: [photoUrl || '', photoData || null, photoMime || null, now, employeeId],
  });
  return getEmployee(employeeId);
}

async function getEmployeePhotoRow(employeeId) {
  const db = await ensureSchema();
  const { rows } = await db.execute({
    sql: 'SELECT id, photo, photo_data, photo_mime FROM employees WHERE id = ?',
    args: [employeeId],
  });
  return rows[0] || null;
}

async function clearEmployeePhoto(employeeId) {
  return saveEmployeePhoto(employeeId, {
    photoUrl: '',
    photoData: null,
    photoMime: null,
  });
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
  updateDocumentFileDate,
  deleteDocumentFile,
  getDocumentFile,
  getDocumentFileById,
  saveEmployeePhoto,
  getEmployeePhotoRow,
  clearEmployeePhoto,
  backendConfigured,
  getDbUrl,
};
