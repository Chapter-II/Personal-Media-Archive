/**
 * 共享 Drizzle 客户端单例（Next.js dev 模式下避免热重载重复创建连接池）
 *
 * 在生产中，进程级别单例由模块缓存自动保证；
 * 在 dev 中 (`pnpm dev`)，Next.js 热重载会重复 evaluate 模块，我们用 globalThis 兜底。
 */
import { createDatabase, type Database } from '@pma/db';

import { env } from './env';

declare global {
  var __pmaDb: { db: Database; client: ReturnType<typeof createDatabase>['client'] } | undefined;
}

function getOrCreate(): { db: Database; client: ReturnType<typeof createDatabase>['client'] } {
  if (env.nodeEnv === 'production') {
    return createDatabase({ url: env.databaseUrl, max: 10 });
  }
  globalThis.__pmaDb ??= createDatabase({ url: env.databaseUrl, max: 5 });
  return globalThis.__pmaDb;
}

const handle = getOrCreate();

export const db = handle.db;
export const dbClient = handle.client;
