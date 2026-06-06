# Contributing

本文档定义 PersonalMediaArchive 的开发流程、工程约定和质量门槛。所有提交（包括独自开发）都遵循同一套规则，让代码、git 历史、Issues 和 PR 共同构成项目的开发记录。

---

## 1. 工程基线

### 语言与运行时

- TypeScript 严格模式（`strict: true`、`noUncheckedIndexedAccess: true`、`noImplicitAny: true`）
- Node.js LTS（22.x）
- pnpm 作为包管理器

### 代码质量工具

| 工具 | 用途 |
|---|---|
| ESLint | Lint 规则强制（含 `@typescript-eslint/no-explicit-any: error`、`no-floating-promises`） |
| Prettier | 格式化 |
| commitlint | Commit message 校验 |
| Husky + lint-staged | 本地 pre-commit 拦截 |
| Vitest | 单元测试 |
| Playwright Test | 端到端测试 |
| GitHub Actions | PR CI 闭门考试 |

### 禁止事项（工具强制）

> 这些规则尽量由类型、Lint、CI、DB 约束强制执行，而非靠纪律。

- 禁止 `any`。如必须用，注释 `// any: <理由>`，且不能批量
- 禁止未处理的 Promise（`no-floating-promises`）
- 禁止前后端重复维护数据类型 → 通过 tRPC 端到端类型对齐
- 禁止把业务逻辑写在页面组件 → 业务逻辑放 `lib/` 或 `services/`
- 禁止把采集 / 存储 / 媒体处理混在同一模块 → 按模块边界分离
- 禁止无错误处理的后台任务 → Job 必须有 try/catch + 状态机记录
- 禁止无来源记录的资产 → DB schema `asset_source NOT NULL`
- 禁止无 hash 的归档资产 → DB schema `sha256 NOT NULL`
- 禁止录屏冒充原始媒体 → `asset_source` 枚举不含 `original_file` 给 `visual_recording`
- 禁止引入未说明的依赖 → PR 模板必须列出新依赖与理由
- 禁止架构变更不写 ADR
- 禁止 commit 不含 issue 编号（commitlint 校验）

---

## 2. 分支与提交流程

### 分支命名

```text
feat/<issue#>-<short-desc>    新功能
fix/<issue#>-<short-desc>     bug 修复
docs/<issue#>-<short-desc>    文档
refactor/<issue#>-<short-desc> 重构（无行为变化）
chore/<issue#>-<short-desc>   构建 / 依赖 / 配置
```

例：`feat/12-item-create-endpoint`

### Commit 规范（Conventional Commits）

```text
<type>(<scope>): <subject> (#<issue>)

<optional body>

<optional footer>
```

`type` 取值：

```text
feat       新功能
fix        bug 修复
docs       文档
refactor   重构
perf       性能
test       测试
build      构建系统 / 依赖
ci         CI 配置
chore      其他
revert     回滚
```

例：

```text
feat(worker): add pre-flight content detection (#12)
fix(api): handle empty cookies in vault decrypt (#23)
docs(adr): record drizzle over prisma decision (#0)
```

### PR 流程

1. 从 `main` 拉分支
2. 开发并本地通过 `pnpm test && pnpm typecheck && pnpm lint`
3. 推送，开 Draft PR，填 PR 模板
4. CI 必须全绿
5. 自我代码评审 → Ready for review
6. 合并方式：**Squash and merge**，保留 issue 编号在标题
7. PR 合并 = 关联 issue 自动 close（"Closes #N"）

---

## 3. 命名约定

### 代码

| 类型 | 风格 | 例子 |
|---|---|---|
| 变量 / 函数 | `camelCase` | `createItem`, `parsedUrl` |
| 类型 / 接口 / Class | `PascalCase` | `Snapshot`, `CookieProfile` |
| 常量 | `UPPER_SNAKE_CASE` | `WORKER_CONCURRENCY` |
| 文件（组件） | `PascalCase.tsx` | `CollectionList.tsx` |
| 文件（其他） | `kebab-case.ts` | `parse-url.ts` |
| 路由文件夹 | `kebab-case` | `app/items/[id]/page.tsx` |

### API

- tRPC procedure：动词 + 名词，`createItem`、`listSnapshots`
- REST 端点：复数名词，`POST /api/items`、`GET /api/items/:id`
- 错误码：枚举字符串，`ERR_ITEM_NOT_FOUND`、`ERR_CAPTURE_TIMEOUT`

### 数据库（Drizzle / Postgres）

- 表名：`snake_case` 复数，`items`、`cookie_profiles`
- 列名：`snake_case`，`source_url`、`created_at`
- 主键：`id`（UUID v7 优先）
- 外键：`<entity>_id`，`item_id`、`snapshot_id`
- 时间戳：`created_at`、`updated_at`、`*_at`
- 枚举类型：`<entity>_<field>_enum`

### 文件存储

```text
storage/items/{item_id}/snapshots/{snapshot_id}/{category}/{filename}
```

文件名含 hash 前缀防冲突：`{sha256_8}_{original_name}`。

---

## 4. 错误处理与日志

### 错误处理

- API 层：所有错误转换为带 `error_code` 的结构化响应
- Worker 层：每个 Job 必须 try/catch；失败要写 `Job.error_log_json` + Snapshot 状态机
- 客户端层：错误 boundary + Toast 反馈

### 日志（Pino）

```text
trace  仅本地调试
debug  开发环境默认
info   关键业务事件（item 创建、job 入队完成）
warn   降级 / 重试 / 非致命异常
error  失败需关注
fatal  进程级崩溃
```

- 不打印 PII / cookie / token
- 必带字段：`request_id`、`user_id`、`item_id` / `job_id`（按上下文）
- 生产环境同时发送至 Sentry / GlitchTip

---

## 5. 测试规范

| 层级 | 工具 | 覆盖目标 |
|---|---|---|
| 单元测试 | Vitest | `lib/`、`services/`、纯函数、解析器 |
| 集成测试 | Vitest + testcontainers | tRPC procedures、DB 查询 |
| 端到端 | Playwright Test | 关键用户流（提交 URL、查看 snapshot） |
| Worker | Vitest | Pre-flight 决策树、录制策略选择 |

强制覆盖率：核心 `lib/` 与 `services/` ≥ 80%，其余目录无强制。

---

## 6. 文档更新责任

### 改代码必须更新

| 改动类型 | 必须更新 |
|---|---|
| 架构 / 跨模块变更 | 新写一份 ADR + 更新 ARCHITECTURE.md |
| 新外部依赖 | PR 描述列出 + 在 CHANGELOG 记录 |
| 用户可见行为变更 | CHANGELOG.md |
| 部署或运维流程变更 | docs/ops/ 对应 runbook |
| 命名 / 约定变更 | 本文档 |

### 不需要写文档

- 内部重构、命名优化、单元测试补丁、依赖小版本升级、纯 lint 修复
- 这些事 git log 已经记录足够，PR 描述简短说明即可

---

## 7. ADR 写作

详见 `docs/adr/README.md`。简版规则：

- 触发条件：架构选型、技术栈替换、跨模块设计、合规边界调整
- 不触发：库的小版本升级、内部函数重构、UI 微调
- 模板：背景 / 选项 / 决策 / 理由 / 影响 / 风险 / 复核条件
- 不可编辑已 accepted 的 ADR，要变更就写新的 superseding ADR

---

## 8. 依赖管理

- 添加新依赖前在 PR 描述说明：**用途、替代方案、包大小、维护活跃度**
- 优先选择：单一职责小库 > 大而全框架
- 严禁：已弃用、超过 1 年无维护、license 不兼容（GPL/AGPL）
- 锁版本：pnpm lockfile 必须提交
- 安全：Dependabot / Renovate 自动 PR，CI 跑 `pnpm audit`

---

## 9. 安全与合规

详见 README §12。开发时关键边界：

- Cookies 加密存储，密钥不入 git、不入数据库备份
- 不绕 DRM / 不破签名 / 不伪造请求 / 不解密加密流
- 录屏、网络流抓取均不标记为 `original_file`
- 不导出 cookies、不分享归档媒体给第三方

---

## 10. 当被 AI 接手时

如果你是 AI agent 接手这个项目，按这个顺序读：

```text
1. README.md             项目是什么
2. ARCHITECTURE.md       系统当前架构
3. ROADMAP.md            正在做什么、下一步
4. docs/adr/README.md    重要决策的索引
5. 相关代码模块本身
6. 按需 git log / GitHub Issues 查询历史
```

不要从 `git log` 顺读全部历史——按需查询。
