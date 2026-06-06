import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { bytea } from './custom-types';

/**
 * Cookie Vault（ADR-0004）
 * - cookies_encrypted: AES-256-GCM 加密，前 12 字节 IV + 16 字节 tag + 密文
 * - 加密密钥在宿主机文件系统（/etc/pma/secret.key 0600），不入数据库备份
 * - 日志 / Sentry / 错误堆栈中禁止包含解密后的 cookies（Logger 配 redaction）
 */
export const cookieProfiles = pgTable('cookie_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: text('platform').notNull().unique(),
  cookiesEncrypted: bytea('cookies_encrypted').notNull(),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  lastValidatedAt: timestamp('last_validated_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export type CookieProfile = typeof cookieProfiles.$inferSelect;
export type NewCookieProfile = typeof cookieProfiles.$inferInsert;
