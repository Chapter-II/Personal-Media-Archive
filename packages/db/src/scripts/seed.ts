/**
 * 幂等 seed：保证四个默认 Collection 存在（ADR-0009）
 *
 * 用法：
 *   pnpm --filter @pma/db db:seed
 *
 * Inbox 是新提交内容的默认归属。Read / Watch / Star 是常用分类示范。
 */
import 'dotenv/config';

import { createDatabase } from '../client';
import { loadDbEnv } from '../env';
import { collections, type NewCollection } from '../schema/collections';

const DEFAULT_COLLECTIONS: NewCollection[] = [
  { name: 'Inbox', sortOrder: 0, color: '#94a3b8', isInbox: true },
  { name: 'Read', sortOrder: 10, color: '#60a5fa', isInbox: false },
  { name: 'Watch', sortOrder: 20, color: '#f472b6', isInbox: false },
  { name: 'Star', sortOrder: 30, color: '#facc15', isInbox: false },
];

async function main(): Promise<void> {
  const env = loadDbEnv();
  const { db, client } = createDatabase({ url: env.databaseUrl, max: 1 });

  // ON CONFLICT (name) DO NOTHING：幂等，重复跑 seed 不会重复插入也不会失败
  const inserted = await db
    .insert(collections)
    .values(DEFAULT_COLLECTIONS)
    .onConflictDoNothing({ target: collections.name })
    .returning({ id: collections.id, name: collections.name });

  if (inserted.length === 0) {
    console.warn('[seed] all default collections already exist, no-op');
  } else {
    console.warn(
      `[seed] inserted ${inserted.length} collections:`,
      inserted.map((c) => c.name),
    );
  }

  await client.end();
}

main().catch((err: unknown) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
