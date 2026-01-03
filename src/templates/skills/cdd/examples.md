# CDD 示例

## 用户认证功能（完整版）

### Stage 1: 发散

```
D1: 用户故事
- 作为用户，我希望登录系统，以便访问个人数据
- 作为管理员，我希望查看登录日志，以便审计

D2: 功能描述
- 核心流程：输入凭证 → 验证 → 返回 Token
- 场景：正常登录、密码错误、账户锁定
```

### 00-prd.md

```markdown
# PRD — Auth

## 用户故事
- 作为用户，我希望安全登录，以便访问个人数据
- 作为管理员，我希望查看登录日志，以便审计异常

## 功能描述
1. 用户输入邮箱/密码
2. 系统验证凭证
3. 成功返回 Token，失败返回错误

## 成功标志
- 用户能正常登录
- 暴力破解被阻止
```

### 复杂度评估 → 完整版
- 涉及模块：3（auth, user, log）
- 风险：高（安全相关）

### Stage 2: 收敛

```
C1: 失败条件 → 密码泄露、暴力破解、Token 盗用
C2: 资源限制 → P99 < 500ms
C4: Non-Goals → OAuth、MFA、记住我
C5: Unresolved → 锁定解锁机制、Token 刷新策略
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

<!-- 如果无不确定项，写：
## Unresolved
(无)
-->
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

## 预防性 Pitfall 建议

Interview 完成后，AI 主动询问：

```
这些约束中，以下几条适合预防性添加为 Pitfall：

| 约束 | 触发器 | 理由 |
|------|--------|------|
| BC-02 密码哈希 | rule | 检测明文密码存储 |
| SC-02 模块边界 | protect | 阻止跨模块依赖 |
| Non-Goal: OAuth | command | 阻止安装 OAuth 库 |

要现在添加吗？
```

### 预防性 Pitfall 示例

```bash
# BC-02: 禁止明文密码（预防性，Bug 还没发生）
fdd add --json '{
  "title": "密码必须哈希存储",
  "trigger": [{"kind": "rule", "pattern": "password\\s*[=:]\\s*[\"'\'']", "scope": ["src/**"]}],
  "replay": {"root_cause": "预防性约束：CDD BC-02"},
  "verify": {"level": "V0", "checks": ["bun test:security"]}
}'

# Non-Goal: 阻止安装 OAuth 库
fdd add --json '{
  "title": "本版本不做 OAuth",
  "trigger": [{"kind": "command", "pattern": "npm install.*(passport|oauth)", "action": "block", "message": "Non-Goal: 本版本不做 OAuth"}],
  "replay": {"root_cause": "预防性约束：CDD Non-Goal"},
  "verify": {"level": "V3", "fallback": {"level": "V3", "self_proof": ["Non-Goal 明确排除"]}}
}'
```

### Bug 修复后转化（传统 FDD）

```bash
fdd add --json '{
  "title": "SQL 注入：用户查询必须参数化",
  "trigger": [{"kind": "rule", "pattern": "\\$\\{.*\\}.*FROM\\s+users", "scope": ["src/auth/**"]}],
  "replay": {"root_cause": "模板字符串拼接 SQL"},
  "verify": {"level": "V0", "checks": ["bun test:security"]}
}'
```
