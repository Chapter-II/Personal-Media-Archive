# Deploy Runbook

PersonalMediaArchive 的部署流程。本文档随实际部署演进——当前为 MVP1 规划骨架，等 M8 落地后逐项填实。

## 目标环境

- 云 VPS：4 vCPU / 8GB RAM / 80GB SSD（推荐起步）
- OS：Ubuntu 24.04 LTS
- 公网 IP + 已解析的域名

## 软件前置

```bash
# 基础工具
apt update && apt install -y curl git ufw fail2ban

# Docker + Compose plugin
# Compose v2 是 Docker CLI plugin，需要单独装：
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin
# 验证：docker compose version 应输出 v2.x

# 防火墙
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 目录约定

```text
/opt/pma/                      项目根
  docker-compose.yml
  .env                         敏感环境变量（0600，root:pma 持有）
  Caddyfile                    反代配置
  storage/                     本地媒体卷
  postgres-data/               DB 数据卷
  secrets/
    cookie-vault.key           Cookie Vault 主密钥（0600）
```

## 部署步骤（M8 后填实）

```text
1. 克隆仓库到 /opt/pma
2. 准备 .env（DATABASE_URL、COOKIE_VAULT_KEY_PATH、域名、邮件等）
3. 生成 Cookie Vault 主密钥并存到 secrets/
4. docker compose up -d postgres
5. 等 Postgres ready，跑 drizzle-kit migrate
6. docker compose up -d
7. 首次访问域名 → 进入 setup 流程：设主密码、绑 TOTP、生成恢复码
```

## Caddy 配置示例

```text
example.com {
    reverse_proxy /api/upload/* tusd:1080
    reverse_proxy web:3000
}
```

## 环境变量清单（M8 完善）

```text
DATABASE_URL=postgres://...
COOKIE_VAULT_KEY_PATH=/run/secrets/cookie-vault.key
WORKER_CONCURRENCY=2
STORAGE_BACKEND=local | r2
LOCAL_STORAGE_PATH=/opt/pma/storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_BUCKET=...
SENTRY_DSN=...
NODE_ENV=production
```

## 升级流程

```text
1. 在分支上 build + test 通过
2. SSH 登录 VPS
3. git pull
4. docker compose pull
5. docker compose run --rm web pnpm db:migrate
6. docker compose up -d
7. 跑健康检查（见 incident-response.md）
```

## 回滚

```text
1. git checkout <previous-tag>
2. docker compose up -d
3. 数据库回滚：
   - 优先 forward-fix（写新迁移修复，不回退）
   - 必须回退时按 drizzle migration 反向 SQL
```

## 相关

- [backup.md](./backup.md)
- [incident-response.md](./incident-response.md)
- [ADR-0001](../adr/0001-tech-stack.md)
