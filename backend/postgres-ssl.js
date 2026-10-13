const fs = require('fs');
const path = require('path');

function createPostgresSslOptions({ caPath, caPem, baseDir = __dirname } = {}) {
  if (caPath && caPem) {
    throw new Error('Set only one of DATABASE_SSL_CA_PATH or DATABASE_SSL_CA');
  }

  let ca = caPem;
  if (caPath) {
    try {
      ca = fs.readFileSync(path.resolve(baseDir, caPath), 'utf8');
    } catch (error) {
      throw new Error(`Could not read DATABASE_SSL_CA_PATH (${error.code || 'file error'})`);
    }
  }

  if (ca) ca = ca.replace(/\\n/g, '\n');
  return { rejectUnauthorized: true, ...(ca ? { ca } : {}) };
}

module.exports = { createPostgresSslOptions };
