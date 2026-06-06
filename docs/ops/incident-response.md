# Incident Response Runbook

出事时的检查清单与处置步骤。M8 后随实际事件填实细节。

## 健康检查端点

| 端点 | 含义 | 期望响应 |
|---|---|---|
| `GET /healthz` | 应用存活 | 200 + `{ ok: true }` |
| `GET /healthz/db` | DB 连通 | 200 + 连接耗时 |
| `GET /healthz/queue` | pg-boss 工作中 | 200 + 队列深度 |
| `GET /healthz/storage` | 存储后端可写 | 200 + 写测耗时 |

## 常见症状速查

### 1. 站点 502 / 503

```text
1. SSH 登录 VPS
2. docker compose ps   查容器状态
3. 若 web 容器挂：
   docker compose logs --tail=200 web
4. 若 caddy 起不来：检查 80/443 端口占用
5. docker compose up -d 重启
```

### 2. 录制任务卡住

```text
1. docker compose logs --tail=200 worker
2. 看是否在某个 URL 卡住（无超时）
3. 查 jobs 表：SELECT * FROM pgboss.job WHERE state = 'active'
4. 必要时：手动 mark 该 job failed，触发降级到 L2-R
5. 检查 Xvfb / PulseAudio 进程是否泄漏
```

### 3. DB 磁盘满

```text
1. df -h
2. du -sh postgres-data/  storage/  /var/lib/docker
3. 优先清理：旧 snapshot 的 derived/ 派生资产（可重建）
4. R2 已接入则把本地 storage/ 推到 R2 后清本地
5. 长期：扩容 / 增加 R2 同步频率
```

### 4. Cookie 解密失败 / 平台登录态过期

```text
症状：Worker 日志频繁出现 "login wall" / 跳转登录页
1. Web UI 进 Cookie Vault 抽屉
2. 重新登录该平台
3. 看 Vault 内 expires_at 字段
4. 不需要重启服务
```

### 5. 被滥用 / 高 CPU

```text
1. docker stats
2. 看是否有 worker 进程跑飞（FFmpeg 卡死）
3. SIGTERM 杀掉 → pg-boss 会重试 → 必要时 mark job failed
4. 长期：增加 worker 内存 / CPU 上限（cgroup）
```

## 致命场景

### A. 数据库损坏

```text
1. 立刻停 web + worker
2. 评估损坏程度：pg_dump 试一下
3. 不可恢复时按 backup.md 流程从最近备份恢复
4. 写复盘记录到 GitHub Issue（label: incident）
```

### B. Cookie Vault 密钥丢失

```text
1. 历史 cookies 不可解密
2. 不影响数据库本身和媒体资产
3. 步骤：
   a. 生成新密钥
   b. 用户重新登录每个平台
   c. 旧的 cookies_encrypted 字段标记为 invalid，可删
4. 复盘：检查为什么离线备份没救回来
```

### C. 公网 IP 被攻击 / 扫描

```text
1. ufw 临时封 IP 段
2. fail2ban 检查是否生效
3. 看登录日志：是否有暴力破解
4. 长期：考虑 Cloudflare Tunnel 隐藏源站
```

## 复盘要求

任何 P0 / P1 事件后：

1. 在 GitHub 开 Issue（`label: incident`）
2. 记录：时间线、根因、影响、临时处置、永久修复
3. 如导出经验教训影响架构 → 写 ADR
4. 如形成新规范 → 更新 CONTRIBUTING.md 或 ADR

## 相关

- [deploy.md](./deploy.md)
- [backup.md](./backup.md)
