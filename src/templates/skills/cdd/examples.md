# CDD 示例

## 用户认证功能

### Interview 摘要

```
Q: 失败条件？ → 密码泄露、暴力破解、Token 盗用
Q: 性能要求？ → P99 < 500ms
Q: 不做什么？ → OAuth、MFA、记住我
Q: 不确定项？ → 锁定解锁机制、Token 刷新策略
```

### 01-constraints.md

```markdown
# Constraints — Auth

## Intent
验证凭证返回 Token，不泄露用户存在性，防暴力破解。

## Behavioral
- BC-01: 登录失败返回 "Invalid credentials"
- BC-02: 密码 bcrypt 哈希，cost ≥ 12
- BC-03: Token 15 分钟过期
- BC-04: 5 次失败锁定 30 分钟

## Resource
- RC-01: P99 < 500ms
- RC-02: bcrypt 使用 worker

## Structural
- SC-01: 逻辑在 src/auth/
- SC-02: 不依赖 src/user/ 内部

## Non-Goals
- 不做 OAuth/SSO
- 不做 MFA
- 不做"记住我"

## Unresolved
- UC-01: 锁定解锁机制？
- UC-02: Token 刷新策略？
```

### 02-validators.md

```markdown
# Validators — Auth

| 约束 | 验证器 | 级别 |
|------|--------|------|
| BC-01 | 错误信息测试 | V0 |
| BC-02 | 哈希安全测试 | V0 |
| BC-03 | Token 过期测试 | V0 |
| BC-04 | 锁定测试 | V0 |
| RC-01 | 性能基准 | V0 |
| SC-01 | 模块边界 lint | V1 |

Missing: UC-01, UC-02（未解决）
Coverage: 100%（已解决约束）
```

### 03-convergence.md

```markdown
# Convergence — Auth

## Status: BLOCKED

| 指标 | 值 |
|------|-----|
| Unresolved | 2 |
| Coverage | 100%* |

Blocking: UC-01（待产品）, UC-02（待安全）
Merge: ❌ NO
```

## 与 FDD 集成

发现 Bug 后转化为 Pitfall：

```bash
fdd add --json '{
  "title": "SQL 注入：用户查询必须参数化",
  "trigger": [{"kind": "rule", "pattern": "\\$\\{.*\\}.*FROM\\s+users", "scope": ["src/auth/**"]}],
  "replay": {"root_cause": "模板字符串拼接 SQL"},
  "verify": {"level": "V0", "checks": ["bun test:security"]}
}'
```
