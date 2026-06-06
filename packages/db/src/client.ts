import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

import * as schema from './schema/index';

export type Database = PostgresJsDatabase<typeof schema>;

interface CreateDatabaseOptions {
  url: string;
  /** 最大连接数；Worker 设小一点（如 4），Web 默认 10 */
  max?: number;
  /** 启用 SQL 调试日志 */
  debug?: boolean;
}

/**
 * 创建一个 Drizzle 数据库客户端。
 *
 * 调用方负责持有返回的 `client`（即 postgres-js `Sql` 实例）并在进程退出时 await client.end()。
 */
export function createDatabase(opts: CreateDatabaseOptions): { db: Database; client: Sql } {
  const client = postgres(opts.url, {
    max: opts.max ?? 10,
    onnotice: () => undefined,
    debug: opts.debug ? (_conn, query) => console.warn('[sql]', query) : undefined,
  });
  const db = drizzle(client, { schema });
  return { db, client };
}
