#!/usr/bin/env node
/**
 * Smoke-test API against a running local server (npm run dev).
 * Prefers BASE_URL=http://127.0.0.1:8080
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

  // New doc types present; removed no_criminal
  const docs = created.data.employee.documents || {};
  assert(docs.nps && docs.life_wheel && docs.currency_pledge && docs.illegal_info_pledge, 'missing new doc slots');
  assert(!docs.no_criminal, 'no_criminal should be removed');
  console.log('✓ document checklist ids');

  const list = await req('GET', '/api/employees');
  assert(list.status === 200 && list.data.employees.some((e) => e.id === id), 'list missing employee');
  console.log('✓ list employees', list.data.employees.length);

  const blocked = await req('PATCH', `/api/employees/${id}/docs/passport`, { present: true });
  assert(
    blocked.status === 400 && blocked.data.code === 'FILE_REQUIRED',
    `expected FILE_REQUIRED without file: ${JSON.stringify(blocked)}`
  );
  assert(
    !blocked.data.employee?.documents?.passport?.present,
    'passport must stay incomplete without a file'
  );
  console.log('✓ reject present without file');

  const sample = Buffer.from('smoke-pdf-content').toString('base64');
  const uploaded = await req('POST', `/api/employees/${id}/docs/contract`, {
    filename: 'contract-smoke.pdf',
    mimeType: 'application/pdf',
    data: sample,
    date: '2026-01-15',
  });
  assert(
    uploaded.status === 200 &&
      uploaded.data.employee.documents.contract.present &&
      uploaded.data.employee.documents.contract.hasFile &&
      uploaded.data.employee.documents.contract.files?.length === 1 &&
      uploaded.data.employee.documents.contract.files[0].filename === 'contract-smoke.pdf' &&
      uploaded.data.employee.documents.contract.files[0].date === '2026-01-15',
    `upload failed: ${JSON.stringify(uploaded)}`
  );
  const fileId1 = uploaded.data.employee.documents.contract.files[0].id;
  console.log('✓ upload contract (auto-complete + date)');

  const uploaded2 = await req('POST', `/api/employees/${id}/docs/contract`, {
    filename: 'contract-smoke-v2.pdf',
    mimeType: 'application/pdf',
    data: Buffer.from('smoke-pdf-v2').toString('base64'),
    date: '2026-02-01',
  });
  assert(
    uploaded2.status === 200 &&
      uploaded2.data.employee.documents.contract.files?.length === 2,
    `multi-file upload failed: ${JSON.stringify(uploaded2)}`
  );
  const fileId2 = uploaded2.data.employee.documents.contract.files[1].id;
  console.log('✓ upload second contract file');

  const retoggle = await req('PATCH', `/api/employees/${id}/docs/contract`, { present: true });
  assert(
    retoggle.status === 200 && retoggle.data.employee.documents.contract.present,
    `re-confirm with file failed: ${JSON.stringify(retoggle)}`
  );
  console.log('✓ mark present allowed after upload');

  const file = await fetch(`${BASE}/api/files/${id}/contract/${fileId1}`);
  assert(file.status === 200, `file download status ${file.status}`);
  const buf = Buffer.from(await file.arrayBuffer());
  assert(buf.toString() === 'smoke-pdf-content', 'file content mismatch');
  console.log('✓ download file by id');

  const legacy = await fetch(`${BASE}/api/files/${id}/contract`);
  assert(legacy.status === 200, `legacy file download status ${legacy.status}`);
  console.log('✓ download latest file (legacy path)');

  const dated = await req('PATCH', `/api/employees/${id}/docs/contract/files/${fileId2}`, {
    date: '2026-03-01',
  });
  assert(
    dated.status === 200 &&
      dated.data.employee.documents.contract.files.find((f) => f.id === fileId2)?.date ===
        '2026-03-01',
    `date update failed: ${JSON.stringify(dated)}`
  );
  console.log('✓ update file date');

  const removed = await req('DELETE', `/api/employees/${id}/docs/contract/files/${fileId1}`);
  assert(
    removed.status === 200 && removed.data.employee.documents.contract.files?.length === 1,
    `file delete failed: ${JSON.stringify(removed)}`
  );
  console.log('✓ delete one file (slot still complete)');

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

  // Telegram send without initData user should fail with NO_TELEGRAM_USER or NO_BOT_TOKEN
  const tgSend = await req('POST', '/api/telegram/send-document', {
    employeeId: id,
    docId: 'contract',
    fileId: fileId2,
  });
  assert(
    tgSend.status === 400 || tgSend.status === 503,
    `expected telegram send to require user/bot: ${JSON.stringify(tgSend)}`
  );
  console.log('✓ telegram send guards (no user / no bot)');

  const deleted = await req('DELETE', `/api/employees/${id}`);
  assert(deleted.status === 200 && deleted.data.ok, 'delete failed');
  console.log('✓ delete employee');

  console.log('\nAll API smoke tests passed.');
}

main().catch((err) => {
  console.error('\nSMOKE TEST FAILED:', err.message);
  process.exit(1);
});
