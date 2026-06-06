/**
 * 服务端环境变量。
 *
 * Next.js 中此模块只在 server-only 路径里 import。
 * 全局校验在进程启动时执行一次（参见 src/lib/db.ts 与 src/lib/logger.ts 的模块初始化）。
 */
export interface Env {
  nodeEnv: 'development' | 'production' | 'test';
  databaseUrl: string;
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}

const VALID_LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
type LogLevel = (typeof VALID_LOG_LEVELS)[number];
const VALID_LOG_LEVELS_SET = new Set<string>(VALID_LOG_LEVELS);

function isLogLevel(value: string): value is LogLevel {
  return VALID_LOG_LEVELS_SET.has(value);
}

function parseLogLevel(raw: string | undefined, fallback: LogLevel): LogLevel {
  if (raw && isLogLevel(raw)) {
    return raw;
  }
  return fallback;
}

function parseNodeEnv(raw: string | undefined): Env['nodeEnv'] {
  if (raw === 'production' || raw === 'test') return raw;
  return 'development';
}

function loadEnv(): Env {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required (set in .env or process environment)');
  }

  const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
  const defaultLevel: LogLevel = nodeEnv === 'production' ? 'info' : 'debug';

  return {
    nodeEnv,
    databaseUrl,
    logLevel: parseLogLevel(process.env.LOG_LEVEL, defaultLevel),
  };
}

export const env: Env = loadEnv();
