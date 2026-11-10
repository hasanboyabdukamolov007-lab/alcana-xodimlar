#!/usr/bin/env node
/**
 * Smoke-test API against a running local server (npm run dev).
 * Or starts its own ephemeral checks via direct handler calls if BASE_URL unset —
 * prefers BASE_URL=http://127.0.0.1:8080
 */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';

async function req(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log('Smoke testing', BASE);

  const health = await req('GET', '/api/health');
  assert(health.status === 200 && health.data.ok, `health failed: ${JSON.stringify(health)}`);
  console.log('✓ health', health.data.database);

  const created = await req('POST', '/api/employees', {
    name: 'Smoke Test User',
    position: { uz: 'Tester', ru: 'Тестер', en: 'Tester' },
    photo: '',
  });
  assert(created.status === 201 && created.data.employee?.id, `create failed: ${JSON.stringify(created)}`);
  const id = created.data.employee.id;
  console.log('✓ create employee', id);

  const list = await req('GET', '/api/employees');
  assert(list.status === 200 && list.data.employees.some((e) => e.id === id), 'list missing employee');
  console.log('✓ list employees', list.data.employees.length);

  const toggled = await req('PATCH', `/api/employees/${id}/docs/passport`, { present: true });
  assert(toggled.status === 200 && toggled.data.employee.documents.passport.present, 'toggle failed');
  console.log('✓ mark passport present');

  const sample = Buffer.from('smoke-pdf-content').toString('base64');
  const uploaded = await req('POST', `/api/employees/${id}/docs/contract`, {
    filename: 'contract-smoke.pdf',
    mimeType: 'application/pdf',
    data: sample,
  });
  assert(
    uploaded.status === 200 &&
      uploaded.data.employee.documents.contract.present &&
      uploaded.data.employee.documents.contract.filename === 'contract-smoke.pdf',
    `upload failed: ${JSON.stringify(uploaded)}`
  );
  console.log('✓ upload contract');

  const file = await fetch(`${BASE}/api/files/${id}/contract`);
  assert(file.status === 200, `file download status ${file.status}`);
  const buf = Buffer.from(await file.arrayBuffer());
  assert(buf.toString() === 'smoke-pdf-content', 'file content mismatch');
  console.log('✓ download file');

  const updated = await req('PUT', `/api/employees/${id}`, {
    name: 'Smoke Test User Updated',
    position: { uz: 'Katta tester', ru: 'Старший тестер', en: 'Senior Tester' },
  });
  assert(updated.status === 200 && updated.data.employee.name.includes('Updated'), 'update failed');
  console.log('✓ update employee');

  // Tiny 1x1 PNG
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const photoUp = await req('POST', `/api/employees/${id}/photo`, {
    filename: 'avatar.png',
    mimeType: 'image/png',
    data: pngBase64,
  });
  assert(
    photoUp.status === 200 &&
      photoUp.data.employee?.photo &&
      String(photoUp.data.employee.photo).includes(`/api/employees/${id}/photo`),
    `photo upload failed: ${JSON.stringify(photoUp)}`
  );
  console.log('✓ upload employee photo');

  const photoGet = await fetch(`${BASE}/api/employees/${id}/photo`);
  assert(photoGet.status === 200, `photo GET status ${photoGet.status}`);
  assert(
    String(photoGet.headers.get('content-type') || '').includes('image/'),
    `photo content-type ${photoGet.headers.get('content-type')}`
  );
  console.log('✓ download employee photo');

  const photoCleared = await req('DELETE', `/api/employees/${id}/photo`);
  assert(
    photoCleared.status === 200 && photoCleared.data.employee?.photo === '',
    `photo clear failed: ${JSON.stringify(photoCleared)}`
  );
  console.log('✓ clear employee photo');

  const deleted = await req('DELETE', `/api/employees/${id}`);
  assert(deleted.status === 200 && deleted.data.ok, 'delete failed');
  console.log('✓ delete employee');

  console.log('\nAll API smoke tests passed.');
}

main().catch((err) => {
  console.error('\nSMOKE TEST FAILED:', err.message);
  process.exit(1);
});
