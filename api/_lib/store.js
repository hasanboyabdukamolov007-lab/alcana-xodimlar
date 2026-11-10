const MAX_INLINE_BYTES = 3.5 * 1024 * 1024; // under Vercel hobby body limit

/**
 * Store a file in Vercel Blob (if configured) or return base64 for DB storage.
 * @param {{ filename: string, mimeType?: string, base64: string, prefix?: string }} opts
 */
async function storeFile({ filename, mimeType, base64, prefix = 'staff-docs' }) {
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) throw Object.assign(new Error('Empty file'), { statusCode: 400 });
  if (buffer.length > MAX_INLINE_BYTES) {
    throw Object.assign(
      new Error(`File too large (max ~${Math.floor(MAX_INLINE_BYTES / (1024 * 1024))}MB on this plan)`),
      { statusCode: 413 }
    );
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = require('@vercel/blob');
    const safeName = String(filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await put(`${prefix}/${Date.now()}-${safeName}`, buffer, {
      access: 'public',
      contentType: mimeType || 'application/octet-stream',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { fileUrl: blob.url, fileData: null, mimeType: mimeType || blob.contentType };
  }

  return {
    fileUrl: null,
    fileData: base64,
    mimeType: mimeType || 'application/octet-stream',
  };
}

module.exports = { storeFile, MAX_INLINE_BYTES };
