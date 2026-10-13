const test = require('node:test');
const assert = require('node:assert/strict');
const { hasSafeAccountDeletionSchema } = require('./account-deletion-schema');

const safeRows = [
  { table_name: 'conversations', column_name: 'participant1_id', delete_rule: 'SET NULL', is_nullable: 'YES' },
  { table_name: 'conversations', column_name: 'participant2_id', delete_rule: 'SET NULL', is_nullable: 'YES' },
  { table_name: 'messages', column_name: 'sender_id', delete_rule: 'SET NULL', is_nullable: 'YES' },
];

test('PostgreSQL deletion guard accepts nullable SET NULL message references', () => {
  assert.equal(hasSafeAccountDeletionSchema(safeRows), true);
});

test('PostgreSQL deletion guard rejects cascading or non-null references', () => {
  assert.equal(hasSafeAccountDeletionSchema([
    ...safeRows.slice(1),
    { ...safeRows[0], delete_rule: 'CASCADE', is_nullable: 'NO' },
  ]), false);
  assert.equal(hasSafeAccountDeletionSchema(safeRows.slice(1)), false);
});
