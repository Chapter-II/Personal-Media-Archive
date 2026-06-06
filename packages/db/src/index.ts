export { createDatabase, type Database } from './client';
export { loadDbEnv, type DbEnv } from './env';
export * as schema from './schema/index';

/**
 * 从 drizzle-orm 重新导出查询时常用工具，避免业务包再直接依赖 drizzle-orm。
 */
export { sql, eq, and, or, not, isNull, isNotNull, desc, asc, count } from 'drizzle-orm';
