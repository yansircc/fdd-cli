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

## 两阶段流程

```
Phase 1: 发散 (Diverge)
    ↓ 用户故事 + 功能描述 → 00-prd.md
    ↓
复杂度评估
    ├─ 简单 → 简化版（只写 01-constraints.md）
    └─ 复杂 → 完整版
           ↓
Phase 2: 收敛 (Converge)
    ↓ 约束 + 验证器 + 收敛状态
```

详见：[interview.md](interview.md)

## 适用边界

| 完整版 ✅ | 简化版 ⚡ | 跳过 ❌ |
|----------|----------|--------|
| 多模块/高风险 | 中等复杂度 | 单文件 bug fix |
| 新功能开发 | 小功能增强 | 纯 UI 调整 |

**简化版**：只写 `01-constraints.md`，跳过验证器和收敛状态。

## 文件结构

```
.cdd/
├── 00-context.md           # 全局约束（写一次）
├── features/{name}/
│   ├── 00-prd.md           # 用户故事 + 功能描述（发散产出）
│   ├── 01-constraints.md   # 约束定义（收敛产出）
│   ├── 02-validators.md    # 验证器（完整版）
│   └── 03-convergence.md   # 收敛状态（完整版）
└── changes/                # 变更记录
```

## 核心文档

| 文件 | 阶段 | 用途 |
|------|------|------|
| 00-prd.md | 发散 | 用户故事 + 功能描述 |
| 01-constraints.md | 收敛 | BC/RC/SC 约束、Non-Goals、Unresolved |
| 02-validators.md | 收敛 | V0-V3 验证器映射 |
| 03-convergence.md | 收敛 | 收敛指标、Merge 决策 |

## 约束类型

| 前缀 | 类型 | 示例 |
|------|------|------|
| BC | 行为约束 | Token 15 分钟过期 |
| RC | 资源约束 | P99 < 500ms |
| SC | 结构约束 | 逻辑在 auth/ 模块内 |
| UC | 未决约束 | 解锁机制待定 |

## 与 FDD 集成

Stage 2 收敛完成后，进入 Stage 3 预防性 Pitfall。

详见：[fdd.md](fdd.md)
