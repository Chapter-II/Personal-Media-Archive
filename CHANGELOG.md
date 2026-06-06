# Changelog

本项目的所有显著变更记录于此。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- 项目工程文档体系（CONTRIBUTING / ARCHITECTURE / ROADMAP / ADR / Ops runbooks / GitHub 模板 / CI 占位工作流）
- README 完整规划（数据模型、归档等级 L0-L2R、入口与客户端、最小架构、MVP 路线、合规边界）
- 初始 ADR：技术栈、归档等级、抓取优先级、Cookie Vault 加密、ORM、队列、Auth、版本化、收藏夹模型
- pnpm monorepo 骨架（M1.0）：根配置、`apps/` 与 `packages/` 工作空间、`@pma/shared` 占位包
- 工程化工具链：TypeScript strict、ESLint 9 flat config + typed linting、Prettier 3、commitlint、lint-staged、Husky v9（pre-commit、commit-msg）
- CI 正式启用 typecheck / lint / format 校验
- `@pma/db` Drizzle 数据层（M1.1）：10 张表 + 7 PG 枚举 + 检查约束 + 索引（含 partial index）
- 表设计：users / sessions / api_tokens / collections / tags / items / item_tags / snapshots / assets / cookie_profiles
- drizzle-kit 迁移工具链 + `db:migrate` 与 `db:seed` 脚本
- 幂等 seed：预置 4 个默认收藏夹（Inbox / Read / Watch / Star）
- Docker Compose：本地开发用 Postgres 16 服务，含 healthcheck
- `.env.example` 与 `packages/db/.env.example` 文档化环境变量
- `@pma/web` Next.js 15 应用骨架（M1.2）：App Router、TypeScript strict、Tailwind v4
- 健康检查端点：`GET /healthz` 返回 schema 版本与 uptime；`GET /healthz/db` 跑 SELECT 1 校验连通
- Pino 结构化日志，含 cookies / tokens / password 字段 redaction
- 模块化共享：`packages/db` 重导出 `sql`/`eq`/`and` 等查询工具，apps 不直接依赖 drizzle-orm
- 服务端单例 DB 客户端，dev 模式下用 globalThis 兜底防止 HMR 重连

### Changed

- CONTRIBUTING.md 的 Node 版本说明同步实际开发环境（24.14.0）

### Fixed

- 无

### Removed

- 无

---

## 模板（每次发版按此结构追加）

```text
## [x.y.z] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...

### Security
- ...
```
