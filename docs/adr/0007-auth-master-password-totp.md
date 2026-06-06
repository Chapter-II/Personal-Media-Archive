# ADR-0007：Auth 采用主密码 + TOTP

- 日期：2026-06-06
- 状态：Accepted
- 影响范围：安全、用户体验、部署依赖

## 背景

单用户自托管系统，但暴露在公网（云 VPS）。需要登录认证，要求：

- 安全（公网攻击面）
- 部署依赖最少（不引入额外服务）
- 离线可登录（VPS 网络问题不影响自己登录）
- 多客户端共用（Web UI、浏览器扩展、Android、iOS）

## 可选方案

### A. Magic Link
- 优点：无密码体验好
- 缺点：必须 SMTP（自建容易被收件方拒收）或第三方（Resend / Postmark）

### B. 主密码 + TOTP 二步验证（选定）
- 优点：零外部依赖、离线可用、单人自己掌控
- 缺点：要记一个强密码、初次扫码绑 TOTP

### C. GitHub / Google OAuth
- 优点：一键登录、零密码
- 缺点：绑定第三方账号、内网 callback 麻烦、第三方挂掉就登不上

### D. Passkey / WebAuthn
- 优点：最现代、最安全
- 缺点：自托管 RP 配置复杂、跨设备体验良莠不齐、Safari/iOS 兼容偶有坑

### E. 简单密码（无 TOTP）
- 优点：最简单
- 缺点：暴露在公网风险太高，被字典攻击概率不低

## 决策

采用方案 B：

```text
主密码:    Argon2id 哈希（memory=64MB、time=3、parallelism=4）
TOTP:      RFC 6238 TOTP，时间窗口 30s，验证窗口 ±1
登录会话:  HttpOnly + Secure + SameSite=Strict cookie
会话存储:  Postgres sessions 表
API token: 长寿命 token 供浏览器扩展、Android、iOS Shortcut 用
            Argon2id 哈希存储，签发时只显示一次明文
速率限制:  per-IP 5 次失败 / 15 分钟，触发后 15 分钟封锁
```

## 理由

- **零外部依赖**：不需要 SMTP、不依赖 GitHub/Google、不需要 WebAuthn RP 配置
- **离线可用**：自己始终能登录
- **单人项目**：注册流程不存在，部署时初始化主密码即可
- **TOTP 弥补密码弱点**：即使密码泄露，没有 TOTP 也进不来
- **API token 走单独路径**：客户端不必反复登录

## 影响

- 代码：`packages/auth` 实现主密码 + TOTP；Argon2 哈希；session 管理
- 数据：`users`、`sessions`、`api_tokens` 表
- 部署：首次启动有 setup 流程：设置主密码 + 扫码绑 TOTP
- UX：登录两步（密码 + 6 位数）

## 风险

| 风险 | 缓解 |
|---|---|
| 主密码弱 / 复用 | setup 流程强制最小强度 + 提示用密码管理器 |
| TOTP 设备丢失 | setup 时生成 10 个一次性恢复码，建议打印保存 |
| API token 泄露 | 每个 token 可单独吊销；签发时记录用途与签发设备 |
| 暴力破解 | 速率限制 + Argon2 慢哈希 |
| 公网扫描攻击 | 配 fail2ban；考虑限制登录端点 IP 白名单（家用 IP 段） |

## 复核条件

- 自托管 Passkey 工具链成熟稳定 → 评估迁移
- 出现多用户场景 → 重新设计（每用户独立密码 + 共享 session 策略）
- 出现合规要求（如强制 SSO） → 接入 OIDC

## 相关

- ADR-0001
- ADR-0004（Cookie Vault 加密）
- CONTRIBUTING.md §9
