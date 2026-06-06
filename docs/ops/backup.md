# Backup Runbook

数据备份与恢复策略。M8 后填实细节。

## 备份目标

| 数据 | 重要性 | 备份策略 |
|---|---|---|
| PostgreSQL 主数据 | 极高 | 每日 logical dump + 持续 WAL 归档 |
| 媒体资产（storage/） | 高 | M7+ 自动同步至 R2；本地保留 7 天 |
| Cookie Vault 密钥 | 致命 | 离线加密备份（U 盘 / 密码管理器）；**不要**和 DB 备份一起 |
| 应用配置（.env） | 中 | 部署前手工备份 |
| 用户上传未归档文件 | 低 | tusd 临时目录，不备份 |

## 每日自动备份

```bash
# crontab，每天 03:00 跑
0 3 * * * /opt/pma/scripts/backup-daily.sh
```

脚本（M8 写实）：

```text
1. pg_dump --format=custom > /backup/pma-YYYY-MM-DD.dump
2. 加密：age -r <pubkey> -o pma-YYYY-MM-DD.dump.age
3. 上传到独立 R2 桶（不同凭据）
4. 本地保留最近 7 份
5. 健康检查 ping
```

## Cookie Vault 密钥备份

- 设置主密码 + 绑 TOTP 后立刻：
  - 把 `/opt/pma/secrets/cookie-vault.key` 复制到 U 盘
  - 同时把恢复码（10 个一次性）打印或截图存离线
- **绝不**和数据库备份放同一存储位置

## 恢复流程

```text
1. 拉起空 VPS + Docker
2. 还原 .env 和 secrets/cookie-vault.key
3. docker compose up -d postgres
4. age -d pma-YYYY-MM-DD.dump.age | pg_restore -d pma
5. drizzle-kit migrate（如有未上线的迁移）
6. docker compose up -d
7. 用恢复码 / TOTP 二选一登录
8. 检查 Cookie Vault：所有 platform 的 cookies 应能正常解密
```

## 演练

每季度做一次完整恢复演练：在临时 VPS 上跑一次"零状态 → 全恢复"，验证备份未损坏。

## 相关

- [deploy.md](./deploy.md)
- [ADR-0004 Cookie Vault](../adr/0004-cookie-vault-encryption.md)
