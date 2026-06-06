/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace 源码直接被 Next 编译，避免 dist/ 中间产物
  transpilePackages: ['@pma/db', '@pma/shared'],
  // 服务端运行时直接 require，不进 Next bundler：
  // - postgres：纯 ESM
  // - pino + pino-pretty：用 worker_threads，被 bundle 后找不到 vendor 路径
  serverExternalPackages: ['postgres', 'pino', 'pino-pretty', 'thread-stream'],
  // 严格模式
  reactStrictMode: true,
  // 关闭 X-Powered-By
  poweredByHeader: false,
  // 健康检查不缓存
  headers() {
    return Promise.resolve([
      {
        source: '/healthz/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
    ]);
  },
};

export default nextConfig;
