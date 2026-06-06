# Personal Media Archive

## 1. 项目定位

Personal Media Archive 是一个面向个人使用的跨平台媒体归档与知识结构化系统。

本项目的核心目标不是普通收藏夹，而是建立一个可长期保存、可检索、可结构化、可供 AI Agent 调用的个人数字资产库。

系统主要用于保存用户在网络中浏览到的各类公开内容，包括：

* 视频
* 图片
* 图文帖子
* 普通网页
* 文章
* PDF
* 音频
* 截图
* 手动上传文件
* 用户笔记

核心原则：

```text
来源可追溯
媒体可保存
内容可检索
结构可扩展
数据可导出
AI 可调用
```

---

## 2. 核心问题

当前网络内容分散在不同平台和 APP 中，存在以下问题：

1. 内容分散：不同 APP、网站、平台之间无法统一分类管理。
2. 依赖联网：回顾内容必须重新访问原平台。
3. 内容流失：原内容可能被删除、隐藏、限流、下架或更改。
4. 非结构化：视频、图片、帖子、网页等内容难以直接被 AI Agent 使用。
5. 跨平台困难：不同平台的内容展示、链接结构、媒体格式和访问方式不统一。

因此，本系统需要建立一套统一的归档管线：

```text
URL / 分享链接 / 上传文件
→ 元数据采集
→ 快照保存
→ 原始媒体或视觉复刻保存
→ OCR / ASR / 抽帧 / 转写
→ chunking / embedding
→ 搜索 / RAG / AI Agent 调用
```

---

## 3. 归档等级设计

系统采用分级归档策略。

### L0：基础来源层

```text
L0 = URL + 元数据
```

保存内容：

* 原始 URL
* canonical URL
* 平台名称
* 内容类型
* 标题
* 作者
* 发布时间
* 保存时间
* 简介 / 描述
* 标签
* 用户备注
* 平台元数据 JSON

适用对象：

* 所有内容

---

### L1-Social：社交媒体快照层

```text
L1-Social = L0 + 封面 + 截图快照
```

适用对象：

* 抖音
* 小红书
* TikTok
* Instagram
* 微博
* Bilibili
* YouTube
* Twitter / X
* 其他社交媒体内容

保存内容：

* L0 全部内容
* 封面图
* 页面截图
* 内容展示快照
* 必要时保存评论区截图或展开状态截图

目标：

即使原内容被删除，仍能看到当时保存时的页面状态。

---

### L1-Web：网页快照层

```text
L1-Web = L0 + HTML / PDF 快照
```

适用对象：

* 普通网页
* 文章
* 博客
* 新闻
* 文档页面
* 产品页
* 论坛帖

保存内容：

* L0 全部内容
* HTML 快照
* PDF 快照
* 整页截图
* 正文提取结果
* 页面内图片索引

目标：

实现网页内容的离线阅读与长期归档。

---

### L2-O：原始媒体层

```text
L2-O = L1 + 原始媒体文件
```

适用对象：

* 可合法保存原始文件的内容
* 用户手动上传的文件
* 官方下载内容
* 公开直链资源
* 平台允许导出的媒体

保存内容：

* 原始视频
* 原始图片
* 原始音频
* 原始 PDF
* 原始附件
* 文件 hash
* MIME 类型
* 文件大小
* 分辨率
* 时长
* 编码信息

说明：

L2-O 是最高价值的媒体归档等级。只有真实原始文件才应标记为 original media。

---

### L2-R：视觉复刻层

```text
L2-R = L1 + 高保真录屏 / 录音 / 截图复刻副本
```

适用对象：

* 无法直接获取原始媒体文件的平台内容
* APP 内展示内容
* 动态页面
* 社交媒体短视频
* 只能通过正常观看访问的内容

保存内容：

* 高保真录屏
* 音频录制
* 媒体区域截图
* 录制参数
* 裁剪区域
* 分辨率
* 帧率
* 是否含音频
* 是否保持原比例

说明：

L2-R 不是原始媒体文件，而是视觉复刻副本。它用于保证内容可回看、可转写、可抽帧、可索引。

---

## 4. 资产来源类型

每个资产必须标记来源类型。

```text
asset_source:
  - original_file
  - manual_upload
  - official_download
  - public_web_asset
  - html_snapshot
  - pdf_snapshot
  - screenshot_snapshot
  - visual_recording
  - browser_extension_capture
```

禁止将录屏文件标记为 original_file。

---

## 5. 核心模块

### 5.1 Ingestion API

负责接收内容入口。

输入来源：

* URL
* APP 分享链接
* 浏览器插件
* 手动上传
* 批量导入
* 用户笔记

职责：

* 创建 item
* 保存 source_url
* 标准化 URL
* 识别平台
* 识别内容类型
* 创建后台任务

---

### 5.2 Platform Detector

负责识别来源平台。

输出示例：

```json
{
  "platform": "xiaohongshu",
  "content_type": "social_video",
  "capture_strategy": "social_visual_capture"
}
```

---

### 5.3 Capture Strategy Selector

根据平台和内容类型选择采集方式。

规则示例：

```text
普通网页 → L1-Web
社交图文 → L1-Social
可下载媒体 → L2-O
不可下载媒体 → L2-R
用户上传文件 → L2-O
解析失败 → L0 或 manual_review_required
```

---

### 5.4 PC Web Capture

用于网页端内容采集。

建议技术：

* Playwright
* Chromium
* Chrome DevTools Protocol
* FFmpeg
* 虚拟显示器
* PDF 生成器
* 整页截图

能力：

* 打开网页
* 等待加载完成
* 保存 HTML
* 保存 PDF
* 保存整页截图
* 识别主内容区域
* 录制网页视频
* 生成封面图

---

### 5.5 Mobile / APP Capture

用于 APP 内容采集。

建议技术：

* Android 真机设备池
* Android Emulator 作为补充
* Appium
* ADB
* 屏幕录制
* 音频采集方案
* 设备状态控制

设备要求：

* 固定分辨率
* 固定系统版本
* 固定字体大小
* 固定亮度
* 禁止通知
* 禁止自动旋转
* 保持登录态
* 关闭无关弹窗
* 独立测试账号

---

### 5.6 Media Processing Workers

用于把非结构化媒体转为结构化数据。

处理类型：

* OCR
* ASR
* 视频抽帧
* 音频提取
* 字幕提取
* PDF 文本提取
* HTML 正文提取
* 图片描述生成
* 摘要生成
* 标签生成
* chunking
* embedding

---

### 5.7 Search & AI Layer

用于后续 AI Agent 调用。

能力：

* 关键词搜索
* 全文搜索
* 向量搜索
* 混合搜索
* 标签筛选
* 时间线筛选
* 来源平台筛选
* 内容类型筛选
* RAG 问答
* 相似内容推荐
* 主题聚类

---

## 6. 推荐技术栈

### Frontend

```text
Next.js
TypeScript
TailwindCSS
```

### Backend

```text
NestJS 或 Fastify
也可以第一版使用 Next.js API Routes
```

### Database

```text
PostgreSQL
Prisma
JSONB
pgvector
```

### Storage

```text
本地文件系统起步
后期支持 MinIO / S3 / Cloudflare R2
```

### Queue

```text
Redis
BullMQ
```

### Capture

```text
Playwright
Chromium
FFmpeg
Appium
ADB
Android Device Pool
```

### Media Processing

```text
FFmpeg
Whisper / faster-whisper
PaddleOCR / Tesseract
Apache Tika
```

### Search

```text
PostgreSQL Full Text Search
Meilisearch / Typesense
pgvector / Qdrant
```

### Deployment

```text
Docker Compose
Nginx
HTTPS
定时备份
```

---

## 7. 推荐目录结构

```text
personal-media-archive/
  apps/
    web/
    api/
    worker/
    browser-extension/
  packages/
    shared/
    adapters/
    media-processing/
  storage/
    items/
  docker/
  scripts/
  README.md
```

单个 item 的存储结构：

```text
storage/items/{item_id}/
  manifest.json
  source.json
  metadata.json

  original/
    media.mp4
    image_001.jpg
    audio.m4a
    document.pdf

  snapshot/
    cover.png
    screenshot.png
    page.html
    page.pdf

  recording/
    screen_recording.mp4
    audio_recording.m4a

  derived/
    transcript.json
    transcript.srt
    ocr.json
    frames/
      frame_0001.jpg
      frame_0002.jpg
    chunks.json
    embeddings.json

  notes/
    user_note.md
```

---

## 8. Manifest 设计

每条内容必须生成 `manifest.json`。

示例：

```json
{
  "item_id": "uuid",
  "archive_level": "L2-R",
  "source": {
    "url": "https://example.com/share/xxx",
    "canonical_url": "https://example.com/item/xxx",
    "platform": "xiaohongshu",
    "content_type": "video",
    "saved_at": "2026-06-06T12:00:00Z"
  },
  "metadata": {
    "title": "示例标题",
    "author": "作者名称",
    "published_at": null,
    "duration": 38.2,
    "language": "zh-CN"
  },
  "assets": [
    {
      "type": "cover",
      "source": "screenshot_snapshot",
      "path": "snapshot/cover.png",
      "sha256": "..."
    },
    {
      "type": "screen_recording",
      "source": "visual_recording",
      "path": "recording/screen_recording.mp4",
      "sha256": "...",
      "fidelity": {
        "resolution": "1080x1920",
        "fps": 60,
        "aspect_ratio": "9:16",
        "scale_mode": "no_stretch",
        "has_audio": true,
        "crop_status": "media_box_only"
      }
    }
  ],
  "rights": {
    "usage": "personal_archive",
    "redistribution": false,
    "watermark_removed": false,
    "drm_bypassed": false
  },
  "processing": {
    "ocr": "pending",
    "asr": "completed",
    "frame_extract": "completed",
    "chunking": "pending",
    "embedding": "pending"
  }
}
```

---

## 9. 数据库核心表

### items

```text
id
archive_level
source_url
canonical_url
platform
content_type
title
author
published_at
saved_at
status
summary
metadata_json
created_at
updated_at
```

### assets

```text
id
item_id
asset_type
asset_source
storage_path
mime_type
file_size
sha256
width
height
duration
fps
has_audio
metadata_json
created_at
```

### tags

```text
id
name
created_at
```

### item_tags

```text
item_id
tag_id
```

### chunks

```text
id
item_id
asset_id
chunk_type
text
start_time
end_time
start_offset
end_offset
embedding_id
metadata_json
created_at
```

### capture_jobs

```text
id
item_id
job_type
status
platform
strategy
attempt_count
error_type
error_message
created_at
updated_at
```

---

## 10. 任务状态

后台任务统一采用以下状态：

```text
pending
resolving
capturing
downloading
recording
processing
indexed
completed
failed
manual_review_required
```

---

## 11. 录屏与截图质量要求

### 视频录制要求

```text
分辨率：尽量匹配内容实际显示区域
横屏视频：1920x1080 或 2560x1440
竖屏视频：1080x1920
帧率：30fps 起步，短视频优先 60fps
编码：H.264 High Profile
CRF：16-20
音频：AAC 128k-192k
比例：不得拉伸
裁剪：优先裁剪到媒体主体区域
```

### 截图要求

```text
网页：优先整页截图
社交媒体：优先保存内容主体截图
图片内容：保持原比例
不要裁掉主体
不要包含无关系统栏
必要时保存多张截图
```

### 录制前检查

正式录制前必须执行：

```text
等待加载完成
等待控件隐藏
检测是否黑屏
检测是否 loading
检测是否有弹窗
检测是否有遮挡
检测是否暂停
检测音频是否存在
检测比例是否正确
```

不合格时：

```text
重新加载
点击隐藏控件
重新进入内容页
降级为截图快照
标记 manual_review_required
```

---

## 12. 合规与边界

本系统仅用于个人归档和个人知识管理。

系统设计原则：

```text
不对外传播归档媒体
不商用分发他人内容
不去水印
不移除权利信息
不绕过 DRM
不破解接口
不逆向签名
不绕过付费墙
不采集私密内容
不批量攻击平台
不使用第三方下载站作为核心依赖
```

系统允许：

```text
保存用户自己上传的文件
保存公开网页快照
保存个人正常可见内容的截图或录屏副本
保存平台允许下载或导出的原始文件
保存来源 URL 和元数据
对个人归档内容进行 OCR / ASR / 搜索 / 摘要
```

---

## 13. MVP 开发路线

### MVP 1：基础归档系统

目标：完成 L0、L1-Web、L1-Social。

功能：

```text
用户登录
URL 提交
手动上传
元数据提取
平台识别
内容类型识别
HTML 快照
PDF 快照
网页截图
社交媒体封面
社交媒体截图
标签
备注
搜索
Docker Compose 部署
```

---

### MVP 2：高保真视觉复刻

目标：完成 L2-R。

功能：

```text
PC 网页录屏
移动端内容截图
移动端内容录屏
录制区域裁剪
遮挡检测
比例检测
录制质量参数保存
manifest 生成
失败降级
manual_review_required
```

---

### MVP 3：原始媒体归档

目标：完成 L2-O。

功能：

```text
手动上传原始媒体
官方下载文件入库
公开直链媒体保存
hash 去重
文件元数据提取
原始媒体与视觉复刻区分
```

---

### MVP 4：AI 结构化

目标：为 AI Agent 做准备。

功能：

```text
OCR
ASR
视频抽帧
字幕生成
PDF 文本提取
HTML 正文提取
chunking
embedding
全文搜索
向量搜索
RAG 问答
自动摘要
自动标签
```

---

## 14. 开发原则

```text
先保存，再处理
先可用，再自动化
先支持手动兜底，再追求全自动
原始资产不可覆盖
派生资产可重建
所有文件必须有 hash
所有资产必须有 source
所有失败必须可追踪
所有内容必须可导出
不要把录屏误认为原始媒体
```

---

## 15. AI 开发 Prompt

你是一个资深全栈工程师，请根据本 README 为我开发一个个人媒体归档系统 Personal Media Archive。

开发要求：

1. 使用 Next.js + TypeScript + TailwindCSS 构建前端。
2. 使用 PostgreSQL + Prisma 管理结构化数据。
3. 使用本地文件系统作为第一版对象存储，后续可扩展到 MinIO / S3。
4. 使用 Redis + BullMQ 管理后台采集、截图、录屏、OCR、ASR、索引任务。
5. 使用 Playwright 实现网页打开、截图、HTML 快照、PDF 快照。
6. 系统必须支持 L0、L1-Social、L1-Web、L2-O、L2-R 五种归档等级。
7. 每个 item 必须生成 manifest.json。
8. 每个 asset 必须区分 asset_source，禁止将 visual_recording 标记为 original_file。
9. 第一阶段优先实现 URL 入库、元数据提取、网页截图、HTML/PDF 快照、手动上传、标签、备注、搜索。
10. 代码结构必须清晰，采集逻辑、媒体处理逻辑、存储逻辑、业务 API 必须解耦。
11. 所有后台任务必须有状态、错误信息、重试机制和 manual_review_required 降级状态。
12. 系统仅用于个人归档，不实现去水印、破解接口、绕过 DRM、绕过付费墙、批量攻击平台等功能。
13. 请先生成项目目录结构、数据库 schema、核心 API 设计、后台任务设计和 MVP 开发步骤，再逐步实现代码。
