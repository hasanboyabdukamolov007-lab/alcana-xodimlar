#!/usr/bin/env node
/**
 * Leader password gate smoke test.
 * Start server with: LEADER_PASSWORD=test-leader-pass npm run dev
 * Then: LEADER_PASSWORD=test-leader-pass node scripts/smoke-access-test.js
 */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const PASS = process.env.LEADER_PASSWORD || process.env.ACCESS_PASSWORD || 'test-leader-pass';

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
  console.log('Access-gate smoke', BASE);

  const health = await req('GET', '/api/health');
  assert(health.status === 200 && health.data.ok, 'health failed');
  assert(health.data.accessRequired === true, `expected accessRequired true: ${JSON.stringify(health.data)}`);
  console.log('✓ health accessRequired');

  const blocked = await req('GET', '/api/employees');
  assert(
    blocked.status === 401 && blocked.data.code === 'LEADER_PASSWORD_REQUIRED',
    `expected lock without password: ${JSON.stringify(blocked)}`
  );
  console.log('✓ list blocked without password');

  const wrong = await req('GET', '/api/employees', null, { 'X-Leader-Password': 'wrong' });
  assert(wrong.status === 401, `wrong password should 401: ${JSON.stringify(wrong)}`);
  console.log('✓ wrong password rejected');

  const ok = await req('GET', '/api/employees', null, { 'X-Leader-Password': PASS });
  assert(ok.status === 200 && Array.isArray(ok.data.employees), `unlock failed: ${JSON.stringify(ok)}`);
  console.log('✓ list with leader password');

  const created = await req(
    'POST',
    '/api/employees',
    { name: 'Access Gate User', position: {} },
    { 'X-Leader-Password': PASS }
  );
  assert(created.status === 201 && created.data.employee?.id, `create failed: ${JSON.stringify(created)}`);
  const id = created.data.employee.id;
  console.log('✓ create with password', id);

  await req('DELETE', `/api/employees/${id}`, null, { 'X-Leader-Password': PASS });
  console.log('✓ cleanup delete');

  console.log('\nAccess gate smoke passed.');
}

main().catch((err) => {
  console.error('\nACCESS SMOKE FAILED:', err.message);
  process.exit(1);
});
