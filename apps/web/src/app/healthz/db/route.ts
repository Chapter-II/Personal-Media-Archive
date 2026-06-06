/**
 * GET /healthz/db —— 数据库连通检查（docs/ops/incident-response.md）
 *
 * SELECT 1 + 计时。失败返回 503 + 错误码（不泄露内部细节）。
 */
import { NextResponse } from 'next/server';

import { sql } from '@pma/db';
import { ERROR_CODES } from '@pma/shared';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  const startedAt = performance.now();
  try {
    await db.execute(sql`SELECT 1`);
    const elapsedMs = Math.round(performance.now() - startedAt);
    return NextResponse.json({ ok: true, elapsed_ms: elapsedMs });
  } catch (err) {
    logger.error({ err }, 'healthz/db failed');
    return NextResponse.json({ ok: false, error_code: ERROR_CODES.ERR_INTERNAL }, { status: 503 });
  }
}
