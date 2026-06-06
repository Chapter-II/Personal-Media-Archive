<!--
PR 标题格式：<type>(<scope>): <subject> (#issue)
例：feat(worker): add pre-flight content detection (#12)
-->

## 摘要

<!-- 一段话说明这个 PR 做了什么、为什么 -->

## 关联

- Closes #<!-- issue 编号 -->
- 相关 ADR：<!-- ADR-XXXX 或 N/A -->
- 相关里程碑：<!-- M0 / M1 / ... -->

## 变更类型

<!-- 勾选适用项 -->

- [ ] feat 新功能
- [ ] fix bug 修复
- [ ] docs 文档
- [ ] refactor 重构（行为不变）
- [ ] perf 性能
- [ ] test 测试
- [ ] build / ci 构建或 CI
- [ ] chore 杂项

## 检查清单

- [ ] 本地通过 `pnpm typecheck`
- [ ] 本地通过 `pnpm lint`
- [ ] 本地通过 `pnpm test`
- [ ] 新增 / 修改业务逻辑都有测试覆盖
- [ ] 修改了 schema / 迁移已生成并校验
- [ ] 没有引入 `any`（如有，在注释里写明理由）
- [ ] 没有未处理的 Promise
- [ ] 修改了用户可见行为 → 已更新 CHANGELOG.md
- [ ] 修改了架构 → 已写 ADR 并更新 ARCHITECTURE.md
- [ ] 修改了部署 / 运维流程 → 已更新 docs/ops/
- [ ] 涉及合规边界 → 已对照 README §12

## 新增依赖

<!-- 如无可写 "无"；如有，每条说明：包名 / 用途 / 替代方案 / 大小 / 维护活跃度 -->

无

## 截图 / 录屏（如适用）

<!-- UI 变更附前后对比 -->

## 部署注意

<!-- 是否需要新环境变量、迁移、初始化脚本、用户重新登录等 -->

无
