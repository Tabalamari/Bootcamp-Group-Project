const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createPostgresSslOptions } = require('./postgres-ssl');

test('PostgreSQL SSL always verifies the server and accepts a configured CA', () => {
  const options = createPostgresSslOptions({ caPem: '-----BEGIN CERTIFICATE-----\\nexample\\n-----END CERTIFICATE-----' });
  assert.equal(options.rejectUnauthorized, true);
  assert.equal(options.ca, '-----BEGIN CERTIFICATE-----\nexample\n-----END CERTIFICATE-----');
});

test('PostgreSQL SSL can load the Supabase CA from a local file', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bootcamp-ca-'));
  try {
    fs.writeFileSync(path.join(directory, 'supabase-ca.crt'), 'public-root-certificate');
    assert.deepEqual(createPostgresSslOptions({ caPath: 'supabase-ca.crt', baseDir: directory }), {
      rejectUnauthorized: true,
      ca: 'public-root-certificate',
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('PostgreSQL SSL rejects conflicting CA settings and keeps verification enabled without a CA', () => {
  assert.throws(() => createPostgresSslOptions({ caPath: 'ca.crt', caPem: 'pem' }), /Set only one/);
  assert.deepEqual(createPostgresSslOptions(), { rejectUnauthorized: true });
});
