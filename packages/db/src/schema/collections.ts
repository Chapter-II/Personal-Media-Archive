import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * 收藏夹（ADR-0009 单层 Collection + Tag 横切）
 * - 单层结构，无 parent_id
 * - 一个 Item 必须且只属于一个 Collection
 * - 预置 Inbox / Read / Watch / Star 四个默认收藏夹（由 seed 创建）
 */
export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  color: text('color'),
  isInbox: boolean('is_inbox').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

/**
 * 横切标签。Item ↔ Tag 多对多（见 item_tags）。
 */
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
