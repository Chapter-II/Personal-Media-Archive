# ADR-0004：Cookie Vault 加密方案（AES-GCM）

- 日期：2026-06-06
- 状态：Accepted
- 影响范围：安全、数据层

## 背景

服务端 Worker 需要在 Chromium 实例中复用用户的平台登录态（cookies），以便采集需要登录才能查看的内容。Cookies 是高敏感数据：

- 等同于平台账号的"会话身份"
- 泄露 = 平台账号被人接管
- 存数据库就意味着 DB 备份、日志、内存 dump 都可能扩散

需求：

- 静态加密存储
- Worker 注入时能在受控环境内解密
- 密钥不能跟数据一起备份
- 不导出、不分享

## 可选方案

### A. 明文存储
- 优点：实现零成本
- 缺点：完全不可接受

### B. AES-GCM 应用层加密，密钥放环境变量 / 文件（选定）
- 优点：实现简单、广泛支持、性能好
- 缺点：密钥保护取决于 VPS 系统安全；如果 VPS 被入侵，密钥和数据库都在同一台机器

### C. 使用 HashiCorp Vault / KMS 等专业密钥管理
- 优点：行业标准、密钥与数据物理隔离
- 缺点：单 VPS 部署引入第三方服务、复杂度高、个人项目过度工程

### D. Postgres 内置 pgcrypto
- 优点：DB 层加密
- 缺点：密钥仍要传入 DB（要么放 .pgpass，要么应用层传），物理隔离效果有限

## 决策

采用方案 B：

```text
加密：AES-256-GCM（NIST 推荐 AEAD 模式）
随机数：每条记录独立 96-bit IV
密钥：32 字节随机，存放于
  - 开发：.env.local（gitignore）
  - 生产：宿主机 /etc/pma/secret.key (0600, root:pma)，容器只读挂载
密钥派生：HKDF（如果未来要从主密码派生子密钥）
明文格式：JSON.stringify(cookies array)
密文存储：BYTEA 列，前缀 12 字节 IV + 16 字节 tag + 密文
```

数据库 schema：

```sql
cookie_profiles
  id                UUID PRIMARY KEY
  platform          TEXT NOT NULL
  cookies_encrypted BYTEA NOT NULL     -- iv (12) || tag (16) || ciphertext
  user_agent        TEXT
  expires_at        TIMESTAMPTZ
  last_validated_at TIMESTAMPTZ
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
```

操作约束：

- 密钥仅本机 Worker 进程能读
- DB 逻辑备份**包含**密文表，但密钥不在备份中（备份不含完整身份）
- 任何 API 端点不返回 cookies 明文
- 日志、Sentry、错误堆栈中禁止包含解密后的 cookies（在 logger 配置 redaction）

## 理由

- **AES-GCM**：业界主流 AEAD，原生支持 Node.js crypto，性能极好
- **应用层而非数据库层**：DB dump 即使泄露也不可读，物理隔离条件最强
- **密钥与数据库分离**：密钥放文件、限 0600 权限，DB 备份不含密钥
- **不引入 Vault / KMS**：个人单 VPS 项目，第三方服务成本不划算
- **密钥支持轮换**：留好 `key_version` 字段（schema 后期增），未来可滚动替换

## 影响

- 代码：`packages/vault` 提供 `encryptCookies` / `decryptCookies` / `injectIntoChromium`
- 数据：`cookie_profiles` 表加密字段、备份策略
- 部署：宿主机要准备 secret.key 文件，部署脚本要校验存在
- 安全：Logger 必须对 cookies 字段做 redaction

## 风险

| 风险 | 缓解 |
|---|---|
| VPS 被入侵 → 密钥与数据同被读 | VPS 全盘加密 + 最小权限服务账户 + 防火墙 + 定期 patch；个人项目无法完全消除 |
| 密钥误删导致历史 cookies 不可解 | 部署脚本强制备份密钥到独立离线存储 |
| 密钥未来要轮换 | schema 预留 `key_version`，轮换写新版加密、读时按版本选密钥 |
| 日志泄露明文 | Pino redaction 配置 + 单元测试覆盖 |

## 复核条件

- 出现专用密钥管理基础设施 → 评估迁移到 KMS
- 出现多用户场景 → 考虑每用户独立密钥
- 出现合规要求（如硬性 HSM 要求） → 整体重新设计

## 相关

- README §3 CookieProfile、§12
- CONTRIBUTING.md §9
