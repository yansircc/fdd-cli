---
name: fdd
description: Feedforward & Feedback Driven Development - 前馈驱动（演绎约束）+ 反馈驱动（归纳约束）。用于：1) 开发前通过 Interview 厘清想法、创建演绎 Pit；2) Bug 修复后创建归纳 Pit 防止复发；3) 查看和管理现有 Pit。
---

# FDD - Feedforward & Feedback Driven Development

> 前馈驱动 + 反馈驱动开发

## 双 F 模型

```
FDD = Feedforward + Feedback

Feedforward（前馈/演绎）
  来源：AI 元认知 —— "我知道未来的我不知道"
  时机：开发前
  产出：specs/ 文档 + 演绎 Pit

Feedback（反馈/归纳）
  来源：真实错误
  时机：Bug 修复后
  产出：归纳 Pit
```

| | Feedforward（前馈） | Feedback（反馈） |
|--|---------------------|------------------|
| 来源 | AI 元认知 / Interview | 真实错误 |
| 时机 | 开发前 | Bug 修复后 |
| Origin | `deductive` | `inductive` |
| 产出 | specs/ + 演绎 Pit | 归纳 Pit |
| Gate 检查 | 宽松 | 严格 |

## 目录结构

```
.fdd/
├── specs/                       # 规划文档
│   └── {feature-name}/
│       ├── SPEC.md              # 索引 + Intent
│       ├── stories.md           # 用户故事
│       ├── flows.md             # 核心流程
│       ├── context.md           # 技术背景
│       ├── constraints.md       # 约束 + Non-Goals
│       └── unresolved.md        # 未决事项（可选）
├── pits/
│   └── PIT-xxx.md
└── config.yaml
```

## 快速开始

### 场景 1: 开发前（前馈/演绎）

使用 Interview 流程厘清想法、定义约束、识别 AI 认知盲区：

详见：[interview.md](interview.md)

**产出**：
- `specs/{feature}/` 文档（给人看）
- 演绎 Pit（给 AI 执行，只有 AI 容易犯错的才生成）

### 场景 2: Bug 修复后（反馈/归纳）

1. **判断是否值得记录**
   - 问自己：能否帮助未来没有当前 context 的 AI 避免踩同样的坑？
   - 能 → 继续
   - 不能 → 静默跳过

2. **检查现有 Pitfalls**
   ```bash
   fdd list
   ```

3. **询问用户确认**
   - 使用 AskUserQuestion 工具
   - 用户跳过 → 完全丢弃

4. **构建 JSON 并执行**
   - `origin: "inductive"` + 必填 evidence/regression/edge
   - 执行 `fdd add --json '{...}'`

格式参考：[create.md](create.md)

### 查看现有 Pitfalls

```bash
fdd list                    # 所有生效的 Pit
fdd list --origin deductive # 只看演绎 Pit
fdd list --origin inductive # 只看归纳 Pit
fdd list --scope temporary  # 只看临时 Pit
fdd list --archived         # 只看已归档
```

## 核心概念

### 演绎约束的价值

**AI 的元认知** = "知道自己不知道什么"

Pit 筛选标准：

> **如果这个约束不记录，未来没有当前上下文的 AI 大概率会犯同样的错**

| 信号 | 示例 |
|------|------|
| 知识截止 | 新框架、新 API |
| 反直觉约定 | "用 UTC+8 存储" |
| 项目特有 | "禁止用 lodash" |
| 经典陷阱 | 时区、浮点、并发 |
| 上下文易失 | "上次决定用方案 A" |

### constraints.md vs Pit

**不是所有约束都生成 Pit**：

```
constraints.md（所有约束）
    │
    ├── P99 < 500ms          → 难以检测，只留在文档
    ├── Token 15 分钟过期     → 可检测，但 AI 不易犯错，不生成 Pit
    ├── 用 day.js 不用 moment → AI 容易犯错 → 生成演绎 Pit ✓
    └── 时区用 UTC+8          → AI 容易犯错 → 生成演绎 Pit ✓
```

### TRAV 协议

每个 Pit 包含四部分：
- **T**rigger — 如何检测这个问题
- **R**eplay — 根因分析
- **A**ction — 如何修复
- **V**erify — 如何验证修复

详见：[gates.md](gates.md)

### Origin（来源）

| Origin | 说明 | Gate 检查 |
|--------|------|-----------|
| `deductive` | 演绎 Pit - 来自预判 | evidence/regression/edge 可选 |
| `inductive` | 归纳 Pit - 来自真实错误 | evidence/regression/edge 必填 |

### Scope（生命周期）

| Type | 说明 |
|------|------|
| `permanent` | 长期 - 项目级约束 |
| `temporary` | 临时 - 有终止条件（日期/分支/里程碑） |

### 触发器类型

6 种触发器用于检测问题：
- `rule` — 静态代码匹配
- `change` — Git 文件变更
- `dynamic` — 运行时检查
- `command` — 命令拦截
- `protect` — 文件保护
- `ai-context` — AI 上下文注入

详见：[triggers.md](triggers.md)

## 示例

参见：[examples.md](examples.md)
