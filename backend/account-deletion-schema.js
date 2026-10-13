const requiredReferences = [
  ['conversations', 'participant1_id'],
  ['conversations', 'participant2_id'],
  ['messages', 'sender_id'],
];

function hasSafeAccountDeletionSchema(rows) {
  return requiredReferences.every(([tableName, columnName]) =>
    rows.some(row =>
      row.table_name === tableName &&
      row.column_name === columnName &&
      String(row.delete_rule).toUpperCase() === 'SET NULL' &&
      String(row.is_nullable).toUpperCase() === 'YES'
    )
  );
}

module.exports = { hasSafeAccountDeletionSchema };
