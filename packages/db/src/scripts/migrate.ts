/**
 * Drizzle 迁移执行器
 *
 * 用法：
 *   pnpm --filter @pma/db db:migrate
 *
 * 读取 DATABASE_URL 环境变量，应用 drizzle/ 下的所有未执行迁移。
 * 适用于本地 dev、CI、生产部署的统一入口。
 */
import 'dotenv/config';

import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { createDatabase } from '../client.js';
import { loadDbEnv } from '../env.js';

async function main(): Promise<void> {
  const env = loadDbEnv();
  const { db, client } = createDatabase({ url: env.databaseUrl, max: 1 });

  const here = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(here, '../../drizzle');

  console.warn(`[migrate] applying migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.warn('[migrate] done');

  await client.end();
}

main().catch((err: unknown) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
