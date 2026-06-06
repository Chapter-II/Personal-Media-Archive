/**
 * 数据库环境变量解析（无第三方校验库，保持 M1.1 依赖最小）
 */
export interface DbEnv {
  databaseUrl: string;
}

export function loadDbEnv(): DbEnv {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required. Set it in your environment or .env file. ' +
        'For local dev: postgres://pma:pma@localhost:5432/pma_dev',
    );
  }
  return { databaseUrl };
}
