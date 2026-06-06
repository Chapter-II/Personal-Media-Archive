# ADR-0005：ORM 选 Drizzle 而非 Prisma

- 日期：2026-06-06
- 状态：Accepted
- 影响范围：数据层

## 背景

Next.js + PostgreSQL + JSONB 组合下选择类型安全的数据访问层。schema 不极端复杂（约 10 张表），但有以下特点：

- 大量 JSONB 字段（metadata、pre_flight_log、manifest）
- 未来要接 PostgreSQL 全文搜索（tsvector）、向量搜索（pgvector）
- 单 VPS 部署，未来可能尝试边缘运行时
- 复杂查询会用到（关联多表 + JSONB 路径过滤 + 全文匹配）

## 可选方案

### A. Prisma
- 优点：DX 最好、文档生态最大、社区最熟、Prisma Studio UI 现成
- 缺点：
  - 生成的 client 运行时较重（~10MB）
  - JSONB 字段类型靠 `Json` 通配，没有路径级类型
  - 复杂查询（窗口函数、CTE、JSONB 操作）要 `$queryRaw` 回退
  - 不支持 PostgreSQL 全部高级特性（如 pgvector 要插件）
  - 边缘运行时支持长期别扭
  - 迁移系统对手动 SQL 不友好

### B. Drizzle（选定）
- 优点：
  - 接近 SQL 的查询 API，复杂查询无须回退
  - 运行时极薄，无 codegen 二进制
  - 类型推导覆盖 JSONB 字段（可定义 schema 类型）
  - 边缘运行时原生支持
  - 迁移命令清晰、对手写 SQL 友好
- 缺点：生态比 Prisma 小、Drizzle Studio 较新

### C. Kysely
- 优点：纯查询构建器、最薄、最强类型
- 缺点：不带 schema 管理，要配额外迁移工具，偏裸

### D. Postgres.js + 手写 SQL
- 优点：最大控制、性能最优
- 缺点：类型靠手维护、易出错、AI 接手成本高

## 决策

采用 Drizzle。

```text
ORM:        drizzle-orm
Schema:     packages/db/schema.ts
迁移:       drizzle-kit generate / migrate
连接:       postgres-js 驱动
```

## 理由

- **接近 SQL** 适合本项目的混合查询场景：JSONB 路径过滤、全文搜索、未来 pgvector
- **运行时薄**：Worker 进程多，Prisma 的开销在多实例下放大
- **类型推导**：JSONB 字段可定义 TS 类型，避免 `Json` 通配
- **边缘运行时**：保留把 API 部分推到 Cloudflare Workers 的可能性
- **复杂查询无须回退**：Prisma 的 `$queryRaw` 会失去类型安全

## 影响

- 代码：`packages/db` 维护 schema、migrations、repository pattern
- 迁移：使用 `drizzle-kit`，迁移文件提交到 git
- 测试：testcontainers 起一次性 Postgres 跑集成测试
- 学习曲线：从 Prisma 转过来要熟悉新 API；AI 接手有少量摩擦但社区文档够用

## 风险

| 风险 | 缓解 |
|---|---|
| Drizzle 遇到边界场景无答案 | schema 不复杂，必要时降级到 raw SQL；Kysely 是逃生路径 |
| 迁移工具有 bug | 关键变更前手动验证生成的 SQL |
| 团队不熟悉 | 单人开发，无团队问题；AI 协同熟悉度足够 |

## 复核条件

- Drizzle 项目停滞或被弃 → 评估迁移到 Kysely
- 出现 Drizzle 无法表达的查询需求 → 用 raw SQL 兜底，不必整体替换

## 相关

- ADR-0001
- CONTRIBUTING.md §3 数据库命名
