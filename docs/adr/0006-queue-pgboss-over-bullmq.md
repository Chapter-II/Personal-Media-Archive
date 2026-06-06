# ADR-0006：队列选 pg-boss 而非 BullMQ + Redis

- 日期：2026-06-06
- 状态：Accepted
- 影响范围：Worker、部署、备份

## 背景

后端需要异步处理：Pre-flight 侦察、视频抓取 / 录制、截图、PDF、后期 OCR / ASR / 索引。任务特征：

- 单任务长（视频录制可达 30 分钟）
- 默认并发 2，可配，最高也就 8-10（受 CPU / RAM 限制）
- 吞吐很低（个人单用户，每天可能几十条 URL）
- 必须可靠（不能掉任务）
- 需要重试、优先级、状态机

## 可选方案

### A. BullMQ + Redis
- 优点：业界事实标准、Bull Board UI 现成、文档丰富、重试 / 优先级 / cron 完整、AI 熟悉度高
- 缺点：多一个 Redis 服务、跨 DB 事务难、单 VPS 多一份内存占用

### B. pg-boss（选定）
- 优点：
  - 复用 Postgres，不增加服务
  - 任务和业务数据同事务（提交 Item + 入队 atomic）
  - 备份只需备 Postgres 一处
  - 持久性自动具备
- 缺点：吞吐上限低于 BullMQ（但本项目根本用不到）；无现成 UI

### C. graphile-worker
- 优点：和 pg-boss 同类，Postgres 内建，性能优秀
- 缺点：生态偏小，API 比 pg-boss 略低层

### D. Temporal
- 优点：工作流引擎、长时间运行任务一等公民
- 缺点：极重，个人项目过度工程

### E. 进程内队列（无持久化）
- 优点：零依赖
- 缺点：进程崩溃 = 任务丢失，违反"可追溯"原则

## 决策

采用 pg-boss。

```text
依赖:       pg-boss
存储:       Postgres（pgboss schema，独立 schema）
监控:       自建简单 admin 视图（M3 之后）或定期查 jobs 表
并发:       默认 2，由 WORKER_CONCURRENCY 控制
重试:       指数退避，最多 5 次
死信:       超过重试上限的 job 标记 manual_review_required
```

## 理由

- **并发只 2**：Redis 的高吞吐能力完全用不上，留它是增量复杂度无对应收益
- **同事务**：提交 Item 和入队是原子操作，避免"业务写入成功但入队失败"的边界 bug
- **备份简单**：dump Postgres = 包含所有任务状态，恢复后任务能继续
- **服务数减一**：单 VPS 部署越少越好
- **无 SMTP / 外部服务依赖**：和 ADR-0007 同理，去外部依赖

## 影响

- 代码：`packages/db` 暴露 pg-boss 实例；`apps/worker` 注册 job handlers
- 数据：pgboss 在独立 schema 下，备份策略不变
- 部署：docker-compose 少一个 `redis` 服务
- 监控：没有现成 Bull Board，M3 之后写一个最小的 admin 页（jobs 表 + 状态聚合）

## 风险

| 风险 | 缓解 |
|---|---|
| 吞吐打不上去 | 单用户场景永远到不了上限；真撞墙再换 BullMQ |
| 缺监控 UI | 写最小 admin 视图（< 200 行） |
| pg-boss 项目活跃度 | 现状活跃；停滞时迁移到 graphile-worker 较容易 |
| 长任务锁住 worker | pg-boss 的 keepalive 机制配置合理（heartbeat、expireInSeconds） |

## 复核条件

- 吞吐持续 > 50 jobs/s → 评估 BullMQ
- 并发任务数 > 16 → 重新评估 worker 编排
- 需要复杂工作流（fork/join、补偿） → 评估 Temporal

## 相关

- ADR-0001
- README §7 Worker 章节
