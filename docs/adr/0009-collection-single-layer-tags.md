# ADR-0009：收藏夹模型采用单层 Collection + Tag 横切

- 日期：2026-06-06
- 状态：Accepted
- 影响范围：数据模型、UI

## 背景

需要为归档内容提供组织和检索结构。常见模型有：单层 collection、嵌套文件夹、纯 tag 等。

MVP1 阶段用户明确希望：先 Archive，检索体验前期简单，按收藏夹分类 + 时间排序即可。

## 可选方案

### A. 多层嵌套文件夹
- 优点：心智接近浏览器书签
- 缺点：实现复杂、移动 / 重命名时 path 维护麻烦、UI 复杂

### B. 单层 Collection + Tag 横切（选定）
- 优点：心智简单（一个 Item 在一个收藏夹）；Tag 灵活横切；UI 易做
- 缺点：未来要嵌套要再升级

### C. 纯 Tag
- 优点：最灵活
- 缺点：没有"默认归属"，每条内容必须手动加 tag 否则散落

### D. Collection + Tag + 多归属
- 优点：极致灵活
- 缺点：删除收藏夹时的级联语义复杂；用户心智负担重

## 决策

采用方案 B：

```text
Collection（单层）:
  id, name, sort_order, color, created_at
  无 parent_id，永远扁平

Item:
  collection_id NOT NULL    必须归属一个 Collection
  一个 Item 只能在一个 Collection 里

Tag（横切）:
  id, name, color, created_at
  Item ↔ Tag 多对多

UI 默认视图:
  侧栏列出所有 Collection
  主视图按时间倒序展示当前 Collection 的 Items
  Tag 作为过滤器叠加（chips）
```

预置 Collection：

```text
Inbox   未分类，新提交默认归此处
Read    需要阅读的文章
Watch   需要看的视频
Star    标记为重要
```

## 理由

- **单层够用**：MVP1 心智简单，避免 path 维护成本
- **强制归属**：所有 Item 必有 collection_id，避免"散落"状态
- **Tag 横切补充**：跨 Collection 的主题汇总（如"AI 相关"可以横切多个 Collection）
- **未来可升级**：要嵌套时把 Collection 加 `parent_id` 即可，不动 Item

## 影响

- 数据：`Item.collection_id NOT NULL`；`Tag` 表 + `item_tags` 多对多
- API：CRUD Collection、CRUD Tag、移动 Item 到其他 Collection 的端点
- UI：侧栏 Collection 列表（拖拽排序）+ 顶栏 Tag 过滤
- 初始化：部署时种子数据预置 4 个默认 Collection

## 风险

| 风险 | 缓解 |
|---|---|
| 用户希望嵌套 | 后续 ADR 升级为嵌套，加 parent_id；现有数据零迁移成本 |
| Inbox 堆积 | UI 显眼提示 Inbox 计数，引导整理 |
| 删除 Collection 时 Item 怎么办 | 强制要求先将 Items 移到其他 Collection，否则不能删（或自动移到 Inbox） |

## 复核条件

- 用户使用半年后 Inbox 始终在膨胀 → 考虑自动归类（基于 platform 或 content_type）
- 用户明确需要嵌套 → 升级为 Collection.parent_id

## 相关

- README §3 Collection、§7 Frontend
- ADR-0008（Snapshot 版本化）
