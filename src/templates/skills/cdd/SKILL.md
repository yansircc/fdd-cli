---
name: cdd
description: Convergence-Driven Development - 收敛驱动开发。通过约束缩小解空间，通过验证淘汰不稳定解。当需要定义约束边界、Interview 完善需求、或建立收敛状态时使用。
---

# CDD - Convergence-Driven Development

> 通过显式约束缩小解空间，通过可执行验证淘汰不稳定解，通过单调增量确保收敛。

## 三大公理

| 公理 | 含义 |
|------|------|
| 约束 | 没有约束，就没有工程 |
| 验证 | 不能验证的约束，不具备约束力 |
| 收敛 | 若进展不可证明为单调，则收敛不可相信 |

## CDD vs FDD

| | CDD | FDD |
|--|-----|-----|
| 职责 | 定义"什么是合法的" | 检测"什么正在违法" |
| 产出 | 规范文档 | Pitfall 实例 |
| 时机 | 功能开始前 | Bug 修复后 |

## 快速开始

### Interview 模式（推荐）

```
使用 AskUserQuestionTool 访谈我，完善约束规范。
问：失败条件、资源限制、禁止事项、不确定项。
```

详见：[interview.md](interview.md)

### 文件结构

```
.cdd/
├── 00-context.md           # 全局约束
├── features/{name}/
│   ├── 01-constraints.md   # 约束定义
│   ├── 02-validators.md    # 验证器
│   └── 03-convergence.md   # 收敛状态
└── changes/                # 变更记录
```

## 核心文档

| 文件 | 用途 | 详见 |
|------|------|------|
| 00-context.md | 全局不变量、禁止事项、环境约束 | [constraints.md](constraints.md) |
| 01-constraints.md | BC/RC/SC 约束、Non-Goals、Unresolved | [constraints.md](constraints.md) |
| 02-validators.md | V0-V3 验证器映射 | [validators.md](validators.md) |
| 03-convergence.md | 收敛指标、Merge 决策 | [convergence.md](convergence.md) |

## 约束类型

| 前缀 | 类型 | 示例 |
|------|------|------|
| BC | 行为约束 | Token 15 分钟过期 |
| RC | 资源约束 | P99 < 500ms |
| SC | 结构约束 | 逻辑在 auth/ 模块内 |
| UC | 未决约束 | 解锁机制待定 |

## 与 FDD 集成

CDD 约束 → FDD Pitfall：

```bash
# CDD: BC-01 禁止 SQL 字符串拼接
fdd add --json '{"title":"SQL注入防护","trigger":[{"kind":"rule","pattern":"\\$\\{.*\\}.*SELECT"}],...}'
```
