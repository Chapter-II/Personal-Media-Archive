import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * 归档等级（README §4 / ADR-0002）
 * L2-O / L2-N / L2-R 在 PG 枚举里写成 L2_O / L2_N / L2_R（PG 枚举值不能含连字符前导）
 */
export const archiveLevelEnum = pgEnum('archive_level', ['L0', 'L1', 'L2_O', 'L2_N', 'L2_R']);

/**
 * Item 状态（README §7）
 */
export const itemStatusEnum = pgEnum('item_status', [
  'pending',
  'capturing',
  'processing',
  'completed',
  'failed',
  'manual_review_required',
]);

/**
 * Snapshot 状态（README §8）
 */
export const snapshotStatusEnum = pgEnum('snapshot_status', [
  'pending',
  'pre_flight',
  'capturing',
  'processing',
  'indexed',
  'completed',
  'failed',
  'manual_review_required',
]);

/**
 * 抓取方法（README §3 Snapshot.capture_method）
 */
export const captureMethodEnum = pgEnum('capture_method', [
  'html_pdf_screenshot',
  'screenshot_carousel',
  'network_capture',
  'visual_recording',
  'livestream_recording',
  'upload',
]);

/**
 * 资产类型
 */
export const assetTypeEnum = pgEnum('asset_type', [
  'video',
  'audio',
  'image',
  'html',
  'pdf',
  'json',
  'text',
  'manifest',
  'other',
]);

/**
 * 资产来源（README §5 / ADR-0002 边界）
 * 禁止把录屏 / 截图 / 网络流抓取标为 original_file —— 由应用层与 DB 约束共同把守。
 */
export const assetSourceEnum = pgEnum('asset_source', [
  'original_file',
  'manual_upload',
  'official_download',
  'public_web_asset',
  'html_snapshot',
  'pdf_snapshot',
  'screenshot_snapshot',
  'network_capture',
  'visual_recording',
  'browser_extension_capture',
]);

/**
 * API token 作用域
 */
export const apiTokenScopeEnum = pgEnum('api_token_scope', ['submit', 'admin']);
