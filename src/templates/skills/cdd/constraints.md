# CDD 约束定义

## 文件结构

```
.cdd/
├── 00-context.md           # 全局约束（写一次）
├── features/{name}/
│   ├── 01-constraints.md   # 功能约束
│   ├── 02-validators.md    # 验证器
│   └── 03-convergence.md   # 收敛状态
└── changes/                # 变更记录
```

## 00-context.md 模板

```markdown
# Context (Global)

## Invariants
- 数据必须强一致
- 所有变更必须可测试

## Forbidden
- 禁止跨 domain 直接调用
- 禁止无 validator 的约束

## Environment
- Language: TypeScript 5.x
- Runtime: Node.js 20+
```

## 01-constraints.md 模板

```markdown
# Constraints — {feature}

## Intent
当 X 发生时，系统必须 Y，且 Z 不能发生。

## Behavioral Constraints
- BC-01: 登录失败返回通用错误
- BC-02: Token 15 分钟过期

## Resource Constraints
- RC-01: P99 < 500ms
- RC-02: 内存 < 50MB

## Structural Constraints
- SC-01: 逻辑在 src/auth/ 模块
- SC-02: 不依赖 src/user/ 内部实现

## Non-Goals (Hard Stop)
- 不做 OAuth（本版本）
- 不做多因素认证

## Unresolved
- UC-01: 锁定解锁机制？（待产品确认）
```

## 约束编号

| 前缀 | 类型 | 示例 |
|------|------|------|
| BC | 行为 | BC-01: Token 15 分钟过期 |
| RC | 资源 | RC-01: P99 < 500ms |
| SC | 结构 | SC-01: 逻辑在 auth/ 模块 |
| UC | 未决 | UC-01: 解锁机制待定 |

## 写作原则

1. **可验证** — 每条约束必须能写测试或 lint
2. **Non-Goals 是硬约束** — AI 禁止实现
3. **Unresolved 必须显式声明** — 即使为空也要写 `## Unresolved\n(无)` 表明已思考过
4. **Unresolved 阻塞合并** — 有未决项时必须解决后才能 merge

## 与 FDD 映射

| CDD 约束 | FDD 触发器 | 预防性 Pitfall |
|----------|-----------|---------------|
| BC | `rule` / `dynamic` | ✅ 推荐 |
| RC | `dynamic` (benchmark) | ⚠️ 可选 |
| SC | `rule` (lint) / `change` | ✅ 推荐 |
| Non-Goals | `protect` / `command` | ✅ 强烈推荐 |

**预防性 Pitfall**：在 Bug 发生前，基于 CDD 约束主动添加 FDD Pitfall。
适合高风险、可自动检测、硬性禁止的约束。
