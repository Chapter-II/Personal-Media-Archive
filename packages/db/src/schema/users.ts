import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { apiTokenScopeEnum } from './enums';

/**
 * 用户表。MVP1 阶段单用户，但 schema 已为多用户预留。
 * - master_password_hash：Argon2id 哈希
 * - totp_secret：TOTP 共享密钥（base32），由应用层用 Cookie Vault 同一组密钥加密后写入
 * - recovery_codes_hashes：每个一次性恢复码的 Argon2id 哈希
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  masterPasswordHash: text('master_password_hash').notNull(),
  totpSecretEncrypted: text('totp_secret_encrypted').notNull(),
  recoveryCodesHashes: text('recovery_codes_hashes').array().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

/**
 * 会话：浏览器登录后的服务端 session（cookie 引用此 id）。
 */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index('sessions_user_idx').on(table.userId),
    expiresIdx: index('sessions_expires_idx').on(table.expiresAt),
  }),
);

/**
 * API token：长寿命令牌，供浏览器扩展、Android、iOS Shortcut 使用。
 * - token_hash：Argon2id 哈希；明文仅在签发时一次性返回
 * - scope：submit（仅创建 Item）或 admin（全权限）
 */
export const apiTokens = pgTable(
  'api_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tokenHash: text('token_hash').notNull(),
    scope: apiTokenScopeEnum('scope').notNull().default('submit'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'date' }),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    userIdx: index('api_tokens_user_idx').on(table.userId),
    activeIdx: index('api_tokens_active_idx')
      .on(table.userId)
      .where(sql`${table.revokedAt} IS NULL`),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;
