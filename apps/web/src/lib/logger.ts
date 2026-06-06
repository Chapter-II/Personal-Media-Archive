/**
 * Pino 结构化日志（CONTRIBUTING §4）
 *
 * 关键 redaction 路径来自 ADR-0004：cookies / 密码 / token 必须在序列化前被擦除。
 * 派生 logger 时不重新设置 redact，确保子日志也走同一组规则。
 */
import { pino } from 'pino';

import { env } from './env';

const REDACTED_PATHS = [
  // Headers / cookies
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  // 业务字段
  '*.cookies',
  '*.cookies_encrypted',
  '*.totp_secret',
  '*.totp_secret_encrypted',
  '*.master_password_hash',
  '*.token_hash',
  '*.password',
  '*.token',
  // 嵌套
  'user.password',
  'user.totp_secret',
];

export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED]',
  },
  base: {
    service: 'pma-web',
    env: env.nodeEnv,
  },
  ...(env.nodeEnv === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
        },
      }
    : {}),
});

export type Logger = typeof logger;
