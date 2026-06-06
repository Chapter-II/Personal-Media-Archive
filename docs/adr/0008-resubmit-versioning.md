# ADR-0008：重提交语义采用 Snapshot 版本化

- 日期：2026-06-06
- 状态：Accepted
- 影响范围：数据模型、UI、存储

## 背景

同一条 URL 可能被多次提交：

- 用户复制了链接两次
- 内容被编辑后再归档
- 失败重试
- 用户想"刷新"一份新快照

需要决定：第二次提交时系统做什么。

## 可选方案

### A. 去重：第二次返回原 Item，不做新归档
- 优点：简单清爽
- 缺点：内容变化无法捕捉、用户主动想刷新没办法

### B. 总是新建独立 Item
- 优点：最宽松
- 缺点：相同 URL 出现 N 个独立 Item，重复冗余、搜索结果污染

### C. Snapshot 版本化：同 canonical URL 合并到同 Item，每次新建 Snapshot（选定）
- 优点：保留时间差异（如帖子被编辑前后）；UI 可切换历史版；不污染列表
- 缺点：实现稍复杂；存储成本随重提次数线性增长

### D. 版本化但保留单一 Snapshot
- 优点：节省存储
- 缺点：失去"内容变化追溯"能力

## 决策

采用方案 C：

```text
查重键: canonical_url（已规范化的 URL，去除追踪参数、统一 scheme）

第一次提交:
  INSERT Item (canonical_url, ...)
  INSERT Snapshot (item_id, version=1, ...)

第 N 次提交:
  SELECT Item WHERE canonical_url = ?
  INSERT Snapshot (item_id=existing.id, version=max(version)+1, ...)

UI 默认显示:
  按 version 倒序，展示最新一版
  侧边栏列出所有历史版，可切换

Item.archive_level:
  取所有 Snapshot 的最高等级

资产存储:
  storage/items/{item_id}/snapshots/{snapshot_id}/...
  每版独立目录，不互相覆盖
```

## 理由

- **Item / Snapshot 分离对应"内容 / 归档行为"**：一个内容可以被归档多次
- **不去重**：用户主动重提就是想刷新；自动去重剥夺了用户控制权
- **不新建 Item**：相同 URL 多个 Item 会破坏收藏夹和搜索的体验
- **保留历史版**：帖子被编辑、被删除前后差异对个人归档极有价值
- **存储成本可接受**：单用户量级，每月最多几百次重提，每次几十 MB；R2 价格忽略不计

## 影响

- 数据：`Snapshot` 表新增 `version` 列；`Item` 与 `Snapshot` 一对多
- API：`POST /api/items` 实际行为是 upsert Item + 创建 Snapshot
- UI：详情页要支持版本切换；版本列表显示 capture_method 差异、文件差异
- 存储：路径含 snapshot_id，每版独立，可单独删除

## 风险

| 风险 | 缓解 |
|---|---|
| 用户误操作刷出大量版本 | UI 提示当前已有 N 版；高频重提（< 1h 内 > 3 次）默认走去重 |
| 存储无限增长 | 提供"保留最近 N 版 + 重要版本钉选"管理（M9 阶段） |
| canonical_url 规范化不准 | 测试覆盖各平台 URL 形态；归一化错误时人工合并 |

## 复核条件

- 用户反复抱怨版本太多 → 考虑默认去重、显式开关刷新
- 存储成本逼近限制 → 引入版本压缩 / 折叠策略

## 相关

- README §3 Snapshot
- ADR-0002（归档等级）
- ADR-0009（收藏夹模型）
