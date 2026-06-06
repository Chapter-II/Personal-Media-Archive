import { index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { collections, tags } from './collections';
import { archiveLevelEnum, itemStatusEnum } from './enums';

/**
 * Item：一条被归档的内容（README §3）
 * - canonical_url 唯一，重提同 URL 走 Snapshot 版本化（ADR-0008）
 * - archive_level 取所有 Snapshot 的最高等级（应用层维护）
 * - collection_id NOT NULL，强制归属（ADR-0009）
 *   ON DELETE RESTRICT：删除 Collection 前必须先移走 Items，避免误删
 */
export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'restrict' }),
    sourceUrl: text('source_url').notNull(),
    canonicalUrl: text('canonical_url').notNull().unique(),
    platform: text('platform'),
    contentType: text('content_type'),
    title: text('title'),
    author: text('author'),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
    savedAt: timestamp('saved_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    archiveLevel: archiveLevelEnum('archive_level').notNull().default('L0'),
    status: itemStatusEnum('status').notNull().default('pending'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    collectionIdx: index('items_collection_idx').on(table.collectionId),
    platformIdx: index('items_platform_idx').on(table.platform),
    statusIdx: index('items_status_idx').on(table.status),
    savedAtIdx: index('items_saved_at_idx').on(table.savedAt),
  }),
);

/**
 * Item ↔ Tag 多对多
 */
export const itemTags = pgTable(
  'item_tags',
  {
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.itemId, table.tagId] }),
    tagIdx: index('item_tags_tag_idx').on(table.tagId),
  }),
);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type ItemTag = typeof itemTags.$inferSelect;
export type NewItemTag = typeof itemTags.$inferInsert;
