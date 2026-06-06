# ADR-0003：抓取优先级 L2-O > L2-N > L2-R

- 日期：2026-06-06
- 状态：Accepted
- 影响范围：Worker（Pre-flight 决策、capture method 路由）

## 背景

确定了 L2-O / L2-N / L2-R 三类资产形态（ADR-0002）后，需要回答：

> 当一条 URL 同时有多种归档可能时，Worker 默认选哪一种？

实际场景：

- 抖音视频网页版：能从 Chromium 拦截到分段流（L2-N），也能屏幕录制（L2-R）
- B 站视频：可能有官方 mp4 直链（L2-O），有 HLS 流（L2-N），也能录屏（L2-R）
- 小红书图集：通常只能视觉复刻（L2-R 中的 screenshot_carousel）

策略不一致会导致：

- 同样的内容不同时间归档结果不一样
- 用户无法预测会拿到什么
- 工程上 Pre-flight 分支爆炸

## 可选方案

### A. 永远视觉复刻（最稳）
- 优点：单一路径、合规边界最清晰
- 缺点：画质差、文件大、CPU 浪费

### B. 永远网络流抓取（最快最高质）
- 优点：高画质、文件小、CPU 低
- 缺点：碰到 DRM / 加密 / 签名失效就失败，没有兜底

### C. 按优先级 L2-O > L2-N > L2-R 降级（选定）
- 优点：拿到最高可得的画质，每一级都有明确的失败 → 降级路径
- 缺点：Pre-flight 决策树要写清楚，否则边界条件容易遗漏

### D. 用户每次手选
- 优点：极致灵活
- 缺点：违反"懒人入口"原则，不能做到自动化

## 决策

采用方案 C：

```text
Pre-flight 决策树（按顺序）：

1. 页面声明了官方下载入口（download 链接、文件直链）？
   → L2-O original_file
2. Chromium 自身播放时能拦截到完整、未加密、可拼接的流？
   → L2-N network_capture
3. 页面有有限时长视频元素？
   → L2-R visual_recording（按 video.duration + 2s 自适应）
4. 页面是直播流？
   → L2-R livestream_recording（需用户授权时长）
5. 页面是图集？
   → L2-R screenshot_carousel
6. 页面是长文 / 普通网页？
   → L1 html_pdf_screenshot

任何一级失败（DRM、加密、签名失效、分段缺失） → 立即降级到下一级
全部失败 → 保留 L0+L1，状态 manual_review_required
```

## 理由

- **L2-O 优先**：真实原始文件保真度最高、文件最小、合规最干净
- **L2-N 次选**：浏览器自身就要请求的流，无 DRM、无破解，画质比录屏好 5-10 倍
- **L2-R 兜底**：任何加密 / 签名失败的场景，视觉复刻都能用，是最稳的最后一道防线
- **降级而非重试**：一次 Pre-flight 决定一次 capture method；不在同一 snapshot 里多重抓取
- **每次决策写日志**：Pre-flight 的判断结果存入 `Snapshot.pre_flight_log_json`，便于排错

## 影响

- 代码：`packages/capture` 中实现决策树状态机
- 数据：`Snapshot.capture_method` 必须记录最终选用的方法
- 合规：任何"为拿到内容而绕过签名 / 解密"的代码路径都被禁止（README §12）
- 性能：L2-N 比 L2-R 快 5-10 倍，对常见场景显著提速

## 风险

| 风险 | 缓解 |
|---|---|
| L2-N 被误标为 `original_file` | 类型层强制 `asset_source = network_capture`；ADR-0002 已限定枚举 |
| 降级失败链长，最终用户拿不到任何媒体 | 仍保留 L1 快照 + 标记 manual_review_required，至少有 HTML 和截图 |
| 平台改版导致 Pre-flight 失败率上升 | 写入日志便于追溯，定期 review |
| L2-N 抓回的拼接文件损坏未察觉 | M2 阶段加 ffprobe 校验，损坏自动降级到 L2-R |

## 复核条件

- 出现稳定的、合规的、官方导出形态（如平台官方 API） → 加 L2-E 优先级最高
- L2-N 失败率长期高于 30% → 评估是否调整为 L2-R 优先

## 相关

- README §4、§8
- ADR-0002
