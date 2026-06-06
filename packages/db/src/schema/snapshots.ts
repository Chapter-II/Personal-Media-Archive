import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { assetSourceEnum, assetTypeEnum, captureMethodEnum, snapshotStatusEnum } from './enums';
import { items } from './items';

/**
 * Snapshot：Item 的一次归档结果（ADR-0008 版本化）
 * - 每次重提同 canonical_url 都新建一条 Snapshot，version 递增
 * - UNIQUE (item_id, version) 保证版本号在 Item 内单调
 * - pre_flight_log 记录侦察阶段的完整决策日志（ADR-0003）
 */
export const snapshots = pgTable(
  'snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    captureMethod: captureMethodEnum('capture_method').notNull(),
    detectedVideoDurationSec: numeric('detected_video_duration_sec', {
      precision: 12,
      scale: 3,
    }),
    recordedDurationSec: numeric('recorded_duration_sec', { precision: 12, scale: 3 }),
    croppedToVideoElement: boolean('cropped_to_video_element').notNull().default(false),
    preFlightLog: jsonb('pre_flight_log').$type<Record<string, unknown>>().notNull().default({}),
    status: snapshotStatusEnum('status').notNull().default('pending'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    itemVersionUnique: unique('snapshots_item_version_unique').on(table.itemId, table.version),
    statusIdx: index('snapshots_status_idx').on(table.status),
    capturedAtIdx: index('snapshots_captured_at_idx').on(table.capturedAt),
    versionPositive: check('snapshots_version_positive', sql`${table.version} >= 1`),
  }),
);

/**
 * Asset：Snapshot 下的实际文件
 * - sha256 NOT NULL：所有资产必须有 hash（README §10 开发原则）
 * - asset_source：限定来源类型，从语义上禁止录屏 / 截图被标记为 original_file
 * - 应用层会进一步在 service 层校验 asset_source 与 capture_method 的兼容性
 */
export const assets = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    snapshotId: uuid('snapshot_id')
      .notNull()
      .references(() => snapshots.id, { onDelete: 'cascade' }),
    assetType: assetTypeEnum('asset_type').notNull(),
    assetSource: assetSourceEnum('asset_source').notNull(),
    storagePath: text('storage_path').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    sha256: text('sha256').notNull(),
    width: integer('width'),
    height: integer('height'),
    durationSec: numeric('duration_sec', { precision: 12, scale: 3 }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    snapshotIdx: index('assets_snapshot_idx').on(table.snapshotId),
    sha256Idx: index('assets_sha256_idx').on(table.sha256),
    sha256LowerCheck: check('assets_sha256_lowercase_hex', sql`${table.sha256} ~ '^[a-f0-9]{64}$'`),
    fileSizePositive: check('assets_file_size_non_negative', sql`${table.fileSize} >= 0`),
  }),
);

export type Snapshot = typeof snapshots.$inferSelect;
export type NewSnapshot = typeof snapshots.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
