# Architecture Decision Records (ADR)

本目录记录 PersonalMediaArchive 的重要架构决策。每个 ADR 是一个不可变的历史快照：决策做出时的背景、可选方案、最终选择和理由。

## 写 ADR 的触发条件

- 选择或替换核心技术栈（语言、框架、数据库、队列、ORM）
- 跨模块的架构设计（模块边界、数据流、抽象层）
- 合规边界调整
- 安全机制选型（加密、认证、授权）
- 业务模型的关键约束（如版本化、收藏夹归属、归档等级）

**不**触发：依赖小版本升级、模块内部重构、UI 微调、命名优化、临时性 bug 修复。

## 写 ADR 的原则

1. **不可编辑**：已 `Accepted` 的 ADR 不修改。要变更就写一份 superseding ADR，并在新 ADR 中引用旧的、在旧 ADR header 标注 `Superseded by ADR-XXXX`
2. **编号递增**：从 `0001` 开始，4 位数，不复用、不跳号
3. **当下视角**：写决策时的背景，不预测未来；后续若现实变化用新 ADR 取代
4. **诚实写理由**：决定一个方案前考虑的所有真实选项都要列，包括最终被否的，并说明否决理由
5. **必含复核条件**：什么情况下应该回头审视这个决策（"若并发要求超过 100/s 则重新评估队列选型"）

## 模板

```markdown
# ADR-XXXX：<决策标题>

- 日期：YYYY-MM-DD
- 状态：Proposed | Accepted | Deprecated | Superseded by ADR-YYYY
- 影响范围：<模块 / 子系统>

## 背景

<问题、约束、动机>

## 可选方案

### A. <方案 A>
- 优点
- 缺点

### B. <方案 B>
- 优点
- 缺点

## 决策

选择 X。

## 理由

<为什么选 X，否决其他方案的具体原因>

## 影响

- 代码层面：<...>
- 数据层面：<...>
- 部署层面：<...>
- 团队层面：<...>

## 风险

<已知风险与缓解措施>

## 复核条件

<什么情况下应回头重新评估>

## 相关

- 关联 ADR
- 关联 Issue / PR
- README 章节
```

## 索引

| 编号 | 标题 | 状态 | 影响范围 |
|---|---|---|---|
| [0001](./0001-tech-stack.md) | 技术栈选型 | Accepted | 全局 |
| [0002](./0002-archive-levels.md) | 归档等级 L0 - L2R 划分 | Accepted | 数据模型 |
| [0003](./0003-capture-priority-strategy.md) | 抓取优先级 L2-O > L2-N > L2-R | Accepted | Worker |
| [0004](./0004-cookie-vault-encryption.md) | Cookie Vault 加密方案（AES-GCM） | Accepted | 安全 |
| [0005](./0005-orm-drizzle-over-prisma.md) | ORM 选 Drizzle | Accepted | 数据层 |
| [0006](./0006-queue-pgboss-over-bullmq.md) | 队列选 pg-boss | Accepted | Worker |
| [0007](./0007-auth-master-password-totp.md) | Auth 选主密码 + TOTP | Accepted | 安全 |
| [0008](./0008-resubmit-versioning.md) | 重提交语义：Snapshot 版本化 | Accepted | 数据模型 |
| [0009](./0009-collection-single-layer-tags.md) | 收藏夹模型：单层 Collection + Tag | Accepted | 数据模型 |
