# Personal Media Archive

Personal Media Archive 是一个面向个人使用的媒体归档与知识结构化系统。

它不是普通收藏夹，而是把网络内容、上传文件和个人笔记保存为一个可追溯、可检索、可导出、可被 AI Agent 使用的个人数字资产库。

核心原则：

```text
来源可追溯
资产可保存
内容可检索
结构可扩展
数据可导出
AI 可调用
```

---

## 2. 项目目标

当前个人内容分散在不同网站、APP 和平台中，存在：

1. 内容分散，难以统一管理。
2. 原链接依赖联网，内容可能失效。
3. 视频、图片、网页、帖子、PDF 等格式不统一。
4. 非结构化内容难以被搜索和 AI 使用。

系统建立一条统一归档管线：

```text
URL / 分享链接 / 上传文件 / 用户笔记
→ 客户端就近采集（可选携带截图、HTML、cookie、共享媒体）
→ 标准化来源
→ Pre-flight 侦察内容类型
→ 在 原始文件 / 网络流抓取 / 视觉复刻 中按优先级选择归档方式
→ 提取文本与元数据
→ 建立搜索索引
→ 供用户检索和 AI 调用
```

---

## 3. 核心数据模型

### Item

一个被归档的内容条目，对应一条 URL 或一份上传。

保存：

```text
id
source_url
canonical_url
platform
content_type
title
author
published_at
saved_at
archive_level
status
collection_id
metadata_json
```

每个 Item 必须归属一个 Collection。Tag 通过多对多关联。

### Snapshot

同一个 Item 可被重复归档，每次重提生成一条 Snapshot。历史版本保留，UI 默认展示最新版，可切换查看旧版。

保存：

```text
id
item_id
version
captured_at
capture_method
detected_video_duration_sec
recorded_duration_sec
cropped_to_video_element
pre_flight_log_json
status
```

`capture_method` 取值：

```text
html_pdf_screenshot     普通网页快照
screenshot_carousel     图集逐张截图
network_capture         拦截浏览器自身请求的视频流
visual_recording        屏幕录制 + 音频
livestream_recording    直播录制（用户授权）
upload                  用户直接上传
```

### Asset

一个 Snapshot 下的实际文件或快照。

保存：

```text
id
snapshot_id
asset_type
asset_source
storage_path
mime_type
file_size
sha256
width / height / duration
metadata_json
```

### Collection

收藏夹。单层结构，无嵌套。一个 Item 必须且只属于一个 Collection。

保存：

```text
id
name
sort_order
color
created_at
```

### Tag

跨收藏夹的横切标签，可手动或自动添加。Item 与 Tag 多对多。

### CookieProfile

平台级登录态，用于 Worker 录制时注入 Chromium。

保存：

```text
id
platform
cookies_encrypted
user_agent
expires_at
last_validated_at
```

cookies 字段以 AES-GCM 加密存储，密钥保存在服务器本地（不入数据库备份）。仅供本机 Worker 解密注入，永不导出、永不外传。

### Manifest

每个 Item 生成 `manifest.json`，描述来源、归档等级、所有 Snapshot 列表、资产清单、处理状态和合规信息。

### Job

后台任务，用于异步执行 Pre-flight 侦察、网络流抓取、录屏、截图、文本提取、OCR、ASR、索引等。

### Chunk

从网页正文、OCR、ASR、PDF 或笔记中提取的可检索文本片段。

---

## 4. 归档等级

```text
L0   来源与元数据
L1   快照归档
L2-O 原始媒体归档
L2-N 网络流抓取归档
L2-R 视觉复刻归档
```

### L0：来源与元数据

```text
L0 = URL + 元数据
```

适用于所有内容。即使采集失败，也至少保留来源、标题、平台、时间、备注和原始元数据。

### L1：快照归档

```text
L1 = L0 + 页面 / 社交媒体快照
```

用于普通网页、文章、博客、帖子、社交媒体内容。

保存：

```text
HTML 快照
PDF 快照
整页截图
封面图
正文提取结果
```

目标是让内容在原链接失效后仍可回看和检索。

### L2-O：原始媒体归档

```text
L2-O = L1 + 真实原始文件
```

用于用户上传、官方下载、公开直链资源。

保存：

```text
原始视频 / 图片 / 音频 / PDF / 附件
文件 hash
MIME 类型
文件大小
媒体元数据
```

只有真实原始文件才能标记为 `original_file`。

### L2-N：网络流抓取归档

```text
L2-N = L1 + 浏览器合法请求的媒体流
```

用于平台内容：Chromium 自身在播放时会请求 HLS manifest（.m3u8）或分段 MP4。Worker 拦截这些 URL，在同一会话上下文（UA / Referer / cookies）内按浏览器的下载方式拉取并拼回完整文件。

保存：

```text
拼好的媒体文件（MP4 / WebM / MP3 等）
stream manifest（如 .m3u8）
原始分段 URL 与响应头
拦截时间戳
```

L2-N **不是** `original_file`，来源是平台分发的流式资源、不是用户上传或平台明示的下载入口。`asset_source = network_capture`。

边界：

```text
不绕 DRM
不破解签名
不伪造请求
不解密加密流
任何分段加密、签名失效、manifest 不可拼接 → 必须降级到 L2-R
```

### L2-R：视觉复刻归档

```text
L2-R = L1 + 录屏 / 录音 / 高保真截图
```

用于 L2-N 失败或不适用的场景：图集逐张截图、直播录制、加密流回退、复杂交互页面。

保存：

```text
屏幕录制
音频录制
媒体区域截图
录制参数
裁剪信息
是否含音频
```

L2-R 不是原始媒体，只是个人可见内容的视觉复刻副本。

### 归档等级选择优先级

```text
能拿到原始文件                → L2-O
否则能从合法网络流抓回完整资源  → L2-N
否则视觉复刻                  → L2-R
全部失败                      → 保留 L1，标记 manual_review_required
```

---

## 5. 资产来源

每个 asset 必须标记来源类型。

```text
original_file
manual_upload
official_download
public_web_asset
html_snapshot
pdf_snapshot
screenshot_snapshot
network_capture
visual_recording
browser_extension_capture
```

禁止将录屏、截图、网络流抓取或转码文件标记为 `original_file`。

---

## 6. 入口与客户端

所有入口最终走同一个 API：`POST /api/items`，统一请求体：

```text
{
  source_url
  client_type           extension | tray | android | ios_shortcut | web | email
  captured_at
  collection_id?
  visible_screenshot?
  page_html?
  page_cookies?
  shared_media?
  user_agent
  viewport?
  note?
}
```

客户端按"我能拿到什么就传什么"原则，尽量携带本地上下文，让服务端决定归档策略。

### 桌面

```text
浏览器扩展（Chrome / Edge，Manifest V3）
  快捷键 / 右键菜单提交当前页
  自动携带 URL、HTML、可见截图、视口信息
  可选携带当前 cookie（用户授权后开启）

托盘 daemon（Windows / macOS / Linux）
  剪贴板监听，复制 URL 后弹通知"归档？"
  作为浏览器扩展之外的兜底入口
```

### iOS

```text
iOS Shortcut（用户导入）
  绑定 Action Button / 背部双击 / 系统分享菜单
  读取剪贴板 URL 或分享传入的数据
  调用 POST /api/items
  无需开发原生 App
```

### Android

```text
原生 App
  前台服务监听剪贴板
  Android 11+ 悬浮气泡显示"归档"按钮（SYSTEM_ALERT_WINDOW）
  系统分享菜单兜底
  常驻通知，进入电池白名单后稳定运行
  国产 ROM 需手动加入自启动和省电白名单
```

### 通用

```text
Web 表单     粘贴 URL / 上传文件
邮件入口（预留）：转发邮件到固定地址即归档
```

---

## 7. 最小架构

```text
Frontend  Next.js + React + TailwindCSS
  数据层  tRPC + TanStack Query（端到端类型自动对齐）
  状态    Zustand
  收藏夹视图（单层 Collection）
  时间线视图
  Item 详情页（多版本 Snapshot 切换）
  Cookie Vault 登录抽屉
  设置 / 备份 / 导出

API  Next.js API Routes + tRPC
  tRPC 路由给 Web UI；裸 REST 端点给浏览器扩展和移动端
  统一 POST /api/items
  Auth: 主密码 + TOTP + Argon2 + API token
  CRUD: Item / Snapshot / Collection / Tag / CookieProfile
  入队 Job

Upload  tus protocol（tusd 服务端 + tus-js-client）
  可恢复分片上传，适配手机录屏等大文件场景

Worker  pg-boss（基于 PostgreSQL 的队列，无 Redis）
  Pre-flight 侦察
  L2-N 网络流抓取（优先）
  L2-R 视觉录屏（Xvfb + PulseAudio + Chromium + FFmpeg）
  截图 / PDF / HTML 快照
  文本与媒体派生（OCR / ASR 等，MVP2 起）
  默认 concurrency = 2，由环境变量 WORKER_CONCURRENCY 控制
  每个 worker slot 整组独占：独立 Xvfb 显示器 + 独立 PulseAudio sink + 独立 Chromium

Storage  StorageAdapter 抽象
  M1 - M6：LocalDiskAdapter
  M7：R2Adapter（Cloudflare R2，S3 兼容，出口流量免费）
  接口稳定，业务层无感知切换

Database  PostgreSQL + Drizzle + JSONB
  Item / Snapshot / Asset / Collection / Tag / CookieProfile / Job / Chunk
  同时承担队列后端（pg-boss 表）

Observability  Pino 结构化日志 + 自托管 Sentry / GlitchTip

Search
  MVP1：PostgreSQL 全文搜索（tsvector）
  MVP2 起：增加向量索引（pgvector）
```

技术栈摘要：

```text
Frontend / API: Next.js + TypeScript + TailwindCSS + tRPC + TanStack Query + Zustand
Database:       PostgreSQL + Drizzle + JSONB
Queue:          pg-boss（Postgres 内建队列，无 Redis）
Upload:         tus protocol（tusd + tus-js-client）
Headless:       Playwright + Chromium + CDP
Recording:      Xvfb + PulseAudio + FFmpeg
Storage:        本地磁盘 → Cloudflare R2
Auth:           主密码 + TOTP + Argon2 + 加密 cookie vault
Logging:        Pino + 自托管 Sentry / GlitchTip
Tests:          Vitest + Playwright Test
Deploy:         Docker Compose，HTTPS via Caddy + Let's Encrypt
```

---

## 8. 核心流程

### 提交

```text
客户端 POST /api/items
→ 鉴权、校验 URL
→ 解析平台、内容类型、canonical URL
→ 查重：
    同 canonical URL 已存在 → 视为同一 Item 的新 Snapshot
    否则新建 Item
→ 携带的 cookies / screenshot / shared_media 先落到临时存储
→ 入队 Job（Pre-flight）
→ 立即返回 item_id 与 snapshot_id（pending 状态）
```

### Pre-flight 侦察

```text
启动一个 Worker slot（独立 Xvfb + 独立 PulseAudio sink）
注入对应平台的 CookieProfile（如存在）
Chromium 打开 URL
注入 JS 扫描：
  - <video> 元素、video.duration、bounding rect
  - 网络面板抓 .m3u8 / MP4 / 媒体响应
  - 图集、长文、直播标记
分类：
  VIDEO_FINITE | VIDEO_LIVESTREAM | IMAGE_CAROUSEL | ARTICLE | MIXED
决策 capture_method（按优先级）：
  捕获到完整、未加密、可拼接的网络流          → network_capture
  否则有视频元素                              → visual_recording
  否则是直播                                  → livestream_recording（需用户授权）
  否则是图集                                  → screenshot_carousel
  否则                                        → html_pdf_screenshot
```

### 抓取与录制

```text
network_capture：
  · Pre-flight 已收集 manifest 与分段 URL 列表
  · Worker 在同一会话上下文（UA / Referer / cookies）按浏览器方式拉取分段
  · 拼接为 MP4 / WebM
  · 任何加密、签名失效、分段缺失 → 立即降级到 visual_recording

visual_recording (VIDEO_FINITE)：
  · FFmpeg duration = video.duration + 2 秒
  · 同步监听 JS 的 video.ended 事件，提前结束信号优先
  · 录后 ffmpeg crop 到 <video> 元素矩形
  · 硬上限 30 分钟（安全网）
  · 音频经 PulseAudio sink 隔离录入，避免多任务串音

livestream_recording：
  · 必须用户授权（提交时显式选择或全局默认时长）
  · 录满配置时长即停

screenshot_carousel：
  · 逐张滑动 + 截图 + 元数据
  · 不启动 FFmpeg

html_pdf_screenshot：
  · 整页 PDF + 完整 HTML + 首屏截图
```

### 后置

```text
计算所有 asset 的 sha256
写 manifest.json
提取文本（HTML 正文、PDF 文本）→ Chunk
建立全文搜索索引
Snapshot.status = completed
Item.archive_level 更新为本次实际达到的最高等级
失败 → status = failed，记录 pre_flight_log_json 与堆栈，标记 manual_review_required
```

### 任务状态

```text
pending
pre_flight
capturing
processing
indexed
completed
failed
manual_review_required
```

---

## 9. 存储结构

```text
storage/items/{item_id}/
  manifest.json
  source.json
  metadata.json

  snapshots/{snapshot_id}/
    snapshot.json
    original/      只放真实原始文件
    network/       L2-N 抓回的拼接流和 manifest
    snapshot/      网页快照、PDF、截图、封面
    recording/     录屏、录音
    derived/       OCR、ASR、抽帧、chunk、embedding
    notes/         用户笔记
```

约定：

```text
original/  只放真实原始文件
network/   只放 L2-N 抓取结果，asset_source = network_capture
snapshot/  放网页、PDF、截图、封面
recording/ 放录屏和录音
derived/   派生资产，可重建
notes/     用户笔记
```

所有读写都走 StorageAdapter 接口，业务层不直接接磁盘或 S3。

---

## 10. MVP 路线

### MVP 1：基础归档 + 服务端自动录制

目标：跑通"客户端提交 → 服务器自动归档 → Web 查看"的完整闭环。

包含：

```text
后端：Next.js + tRPC + Drizzle + PostgreSQL + pg-boss
鉴权：主密码 + TOTP + Argon2 + API token
上传：tus protocol（适配手机录屏等大文件可恢复上传）
API：tRPC（Web UI）+ POST /api/items（扩展与移动端）、CRUD Collection / Tag、查询分页
Worker：
  · Pre-flight 侦察
  · L1 快照（HTML + PDF + 整页截图）
  · L2-N 网络流抓取（优先）
  · L2-R 视觉录屏（含音频，PulseAudio sink 隔离）
  · 默认 concurrency = 2，可配
Cookie Vault：Web UI 登录抽屉，AES-GCM 加密
Storage：LocalDiskAdapter（M7 之后接 R2）
浏览器扩展：Chrome / Edge，提交 URL + 截图 + HTML + cookie
Web UI：
  · 收藏夹（单层 Collection + Tag）
  · 时间线
  · Item 详情 + 多版本 Snapshot 切换
  · Cookie Vault 登录抽屉
  · 全量导出（JSON + 原始文件包）
部署：Docker Compose、HTTPS via Caddy、备份脚本
```

暂不做：

```text
Android 原生 App（推到 MVP2）
iOS Shortcut（推到 MVP2）
Firefox 扩展（推到 MVP2）
OCR / ASR / 抽帧 / 文本分块
向量搜索 / RAG / AI 问答
自动主题聚类 / 摘要 / 自动标签
真机 / 模拟器设备池
```

里程碑：

```text
M1  基础后端骨架     Next.js + Prisma + Auth + Item / Collection CRUD
M2  Pre-flight + 录屏  Xvfb / PulseAudio / Chromium / FFmpeg 单路跑通
M3  并发与队列        BullMQ、资源隔离、N 路并发
M4  Cookie Vault     登录抽屉 + 加密存储 + Worker 注入
M5  浏览器扩展        Chrome / Edge 提交端
M6  Web UI 主界面     收藏夹 + 时间线 + 详情 + 版本切换
M7  对象存储接入      R2Adapter，本地磁盘转缓冲
M8  部署与备份        Docker Compose、HTTPS、备份、导出
M9  端到端打磨        cookie 过期重登、错误重试、文档
```

### MVP 2：结构化处理与移动端入口

目标：让归档内容可检索、可引用、可被 AI 使用，并扩展入口覆盖。

包含：

```text
HTML 正文提取
PDF 文本提取
OCR
ASR（Whisper）
视频抽帧
chunking
全文搜索增强
摘要和自动标签
Android 原生 App（前台服务 + 悬浮气泡）
iOS Shortcut
Firefox 扩展
```

### MVP 3：高保真复刻与 AI

目标：处理 MVP1 / MVP2 触达不到的内容，并开放 AI 能力。

包含：

```text
真机 / 模拟器设备池（覆盖纯 APP 内容）
录制质量自动检查
向量搜索
RAG 问答
AI Agent 查询接口
更丰富的导出格式
```

---

## 11. 开发原则

```text
先保存，再处理
先手动可用，再逐步自动化
原始资产不可覆盖
派生资产可重建
所有资产必须有 hash
所有资产必须有 source
所有失败必须可追踪
所有内容必须可导出
录屏不能冒充原始媒体
网络流抓取不能冒充原始文件
重提交生成新 Snapshot，不覆盖历史版
存储路径走 StorageAdapter，业务层不直接接磁盘或 S3
Worker 资源以 slot 为单位整组隔离（显示器 + 音频 + Chromium）
Pre-flight 决策与降级路径必须写入 snapshot 日志
```

---

## 12. 合规边界

本系统仅用于个人归档和个人知识管理。

允许：

```text
保存用户自己上传的文件
保存公开网页快照
保存个人正常可见内容的截图或录屏副本
拦截浏览器自身合法请求的媒体流并保存
保存平台允许下载或导出的原始文件
保存来源 URL 和元数据
对个人归档内容进行 OCR / ASR / 搜索 / 摘要
本地加密保存平台 cookies 供个人会话复用
```

不做：

```text
不对外传播归档媒体
不商用分发他人内容
不去水印
不移除权利信息
不绕过 DRM
不绕过付费墙
不破解接口
不逆向签名
不伪造请求或解密加密流
不采集私密内容
不批量攻击平台
不依赖第三方下载站
不导出或共享 cookies
```
