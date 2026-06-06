# ADR-0001：技术栈选型

- 日期：2026-06-06
- 状态：Accepted
- 影响范围：全局

## 背景

PersonalMediaArchive 是单用户自托管的个人媒体归档与知识管理系统，部署在云 VPS 上，需要：

- Web UI + API + Worker 一体
- 服务端可控的无头浏览器和录屏能力
- 异步任务调度
- 结构化数据 + 半结构化元数据（JSONB）
- 大文件上传与对象存储
- 浏览器扩展（桌面端入口）
- 单用户，但有移动端、扩展、Web 三种客户端，必须共享 API

约束：

- 单 VPS 起步、服务越少越好
- 类型安全是硬要求（避免长期 schema 漂移）
- 备份越简单越好
- 移植性高（不锁单一云厂商）

## 可选方案

### A. Next.js 全栈 + Prisma + PostgreSQL + Redis + BullMQ + magic link
- 优点：业界主流、文档生态最大、招人/AI 接手熟悉度高
- 缺点：Prisma 运行时重、Redis 是单服务额外开销、magic link 需要 SMTP

### B. Next.js + Drizzle + PostgreSQL + pg-boss + 主密码+TOTP（选定）
- 优点：服务从 5 降到 4（去 Redis）、零 SMTP 依赖、Drizzle 接近 SQL 且边缘运行时友好
- 缺点：Drizzle 生态比 Prisma 小，pg-boss 没有 Bull Board 之类现成 UI

### C. SvelteKit / Remix + 其他栈
- 优点：体积小、性能好
- 缺点：生态小，AI 接手成本高，无法弥补 A/B 的劣势

### D. SQLite + Litestream 取代 Postgres
- 优点：零配置、单文件、Litestream 自动复制到 R2
- 缺点：JSONB 弱、未来 MVP3 想接 pgvector 要换库、并发写串行

## 决策

采用方案 B：

```text
Frontend / API: Next.js + TypeScript + TailwindCSS + tRPC + TanStack Query + Zustand
Database:       PostgreSQL + Drizzle + JSONB
Queue:          pg-boss
Upload:         tus protocol（tusd + tus-js-client）
Headless:       Playwright + Chromium + CDP
Recording:      Xvfb + PulseAudio + FFmpeg
Storage:        本地磁盘 → Cloudflare R2
Auth:           主密码 + TOTP + Argon2 + 加密 cookie vault
Logging:        Pino + 自托管 Sentry / GlitchTip
Tests:          Vitest + Playwright Test
Deploy:         Docker Compose + Caddy + Let's Encrypt
```

## 理由

- **Next.js 全栈**：一个仓库一份部署，AI 接手友好；tRPC 把"前后端类型同步"这个最大维护负担消除
- **Drizzle 而非 Prisma**：见 ADR-0005
- **pg-boss 而非 BullMQ**：见 ADR-0006
- **主密码 + TOTP 而非 magic link**：见 ADR-0007
- **PostgreSQL 而非 SQLite**：保留 pgvector 升级空间，JSONB 用得多
- **R2 而非 S3**：R2 出口流量免费，对要播放归档视频的场景关键
- **Caddy 而非 Nginx**：自动 HTTPS，单人项目省配置

## 影响

- 代码：单一 monorepo，apps/web、apps/worker、packages/*
- 数据：所有持久化集中在 Postgres，加密 cookie 表
- 部署：Docker Compose 5 个服务（caddy / web / tusd / worker / postgres）
- 团队：单人开发，AI 协同友好

## 风险

| 风险 | 缓解 |
|---|---|
| Drizzle 生态相对小，遇到边界场景查不到答案 | 评估替换为 Kysely / Postgres.js 的成本，schema 不复杂迁移可控 |
| pg-boss 无 UI 监控 | 自建简单 admin 视图查 jobs 表，或 M3 之后再决定要不要换 |
| Xvfb + PulseAudio 在 Docker 中调试复杂 | M2 单路跑通后封装为可复用镜像 |
| 单 VPS 单点故障 | 备份策略覆盖（DB 每日 + R2 持续同步） |

## 复核条件

- 单机录制并发需求超过 8 路 → 重新评估 worker 编排
- pg-boss 跟不上吞吐 → 考虑 BullMQ + Redis
- 单用户变多用户 → 重新评估 Auth、权限模型、隔离
- 需要边缘部署 → 重新评估 Drizzle 之外的 schema 工具

## 相关

- README §7、§10
- ADR-0005、0006、0007
