/**
 * GET /healthz —— 应用存活检查（docs/ops/incident-response.md）
 *
 * 不连数据库；只要 Node 进程在跑、Next 能响应，就返回 200。
 * Caddy / 反代的 health probe 用这条。
 */
import { NextResponse } from 'next/server';

import { SCHEMA_VERSION } from '@pma/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const startedAt = Date.now();

export function GET(): NextResponse {
  return NextResponse.json({
    ok: true,
    service: 'pma-web',
    schema_version: SCHEMA_VERSION,
    uptime_sec: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
}
