# Roadmap

PersonalMediaArchive 的里程碑与执行计划。每个里程碑对应一组 GitHub Issues（label: `milestone:Mx`），完成后在 CHANGELOG 记录。

详细 MVP 划分见 [README §10](./README.md)。本文档侧重 **当前执行状态** 与 **下一步**。

---

## 当前状态

```text
阶段：M0 工程基建
状态：进行中
```

工程文档与基础设施搭建中，尚未开始业务代码。

---

## MVP 1：基础归档 + 服务端自动录制

目标：跑通"客户端提交 → 服务器自动归档 → Web 查看"的完整闭环。

### 里程碑

| 编号 | 名称 | 目标 | 关联 Issue label |
|---|---|---|---|
| **M0** | 工程基建 | 文档体系、CI、commitlint、lint、test 框架就绪 | `milestone:M0` |
| **M1** | 后端骨架 | Next.js + tRPC + Drizzle + Postgres + Auth + Item/Collection CRUD | `milestone:M1` |
| **M2** | Pre-flight + 录屏 | Xvfb / PulseAudio / Chromium / FFmpeg 单路跑通 | `milestone:M2` |
| **M3** | 并发与队列 | pg-boss 接入、资源 slot 隔离、N 路并发 | `milestone:M3` |
| **M4** | Cookie Vault | 登录抽屉、AES-GCM、Worker 注入 | `milestone:M4` |
| **M5** | 浏览器扩展 | Chrome / Edge MV3 提交端 | `milestone:M5` |
| **M6** | Web UI 主界面 | 收藏夹 + 时间线 + 详情 + Snapshot 版本切换 | `milestone:M6` |
| **M7** | 对象存储接入 | R2Adapter，本地磁盘转缓冲 | `milestone:M7` |
| **M8** | 部署与备份 | Docker Compose、HTTPS、备份、导出 | `milestone:M8` |
| **M9** | 端到端打磨 | Cookie 过期重登、错误重试、文档完善 | `milestone:M9` |

### 验收标准

- 端到端能提交一条抖音 / 小红书 / B 站 / 普通网页 URL，得到 L1+L2-N 或 L1+L2-R 归档
- Web 可查看历史 snapshot、按收藏夹分组、按时间倒序
- 浏览器扩展一键提交
- 全量导出 JSON + 媒体包
- Docker Compose 一键部署

### 不在 MVP1 范围

- Android 原生 App、iOS Shortcut（→ MVP2）
- Firefox 扩展（→ MVP2）
- OCR / ASR / 抽帧 / 文本分块（→ MVP2）
- 向量搜索 / RAG / AI 问答（→ MVP3）
- 真机 / 模拟器设备池（→ MVP3）

---

## MVP 2：结构化处理与移动端入口

```text
HTML 正文提取
PDF 文本提取
OCR
ASR（Whisper）
视频抽帧
chunking
全文搜索增强
摘要 / 自动标签
Android 原生 App（前台服务 + 悬浮气泡）
iOS Shortcut
Firefox 扩展
```

---

## MVP 3：高保真复刻与 AI

```text
真机 / 模拟器设备池
录制质量自动检查
向量搜索（pgvector）
RAG 问答
AI Agent 查询接口
更丰富的导出格式
```

---

## 路线变更规则

- 调整里程碑顺序：在 PR 描述说明理由，更新本文档
- 删除里程碑：写 ADR 说明
- 新增里程碑：写 ADR 说明 + 更新本文档与 README §10

历史决策见 `docs/adr/`。
