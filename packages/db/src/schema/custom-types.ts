import { customType } from 'drizzle-orm/pg-core';

/**
 * PostgreSQL BYTEA → Node.js Buffer
 * 用于 Cookie Vault 加密 blob 等二进制数据（ADR-0004）。
 */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});
