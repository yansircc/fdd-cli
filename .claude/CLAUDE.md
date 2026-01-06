# FDD CLI - Claude Code Instructions

> Feedforward & Feedback Driven Development CLI
> 前馈驱动 + 反馈驱动开发

## Quick Reference

```bash
bun dev <cmd>          # 开发运行
bun test               # 运行测试
bun lint               # 代码检查
bun build              # 构建
```

## Project Overview

FDD CLI 是一个前馈驱动 + 反馈驱动的开发工具。

### 双 F 模型

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

### 核心功能

1. **Interview 流程** - 发散→收敛→元认知，产出规划文档和演绎 Pit
2. **Pitfall 记录** - 将修复过程结构化为 TRAV 协议
3. **触发器系统** - 6 种触发器检测潜在问题
4. **Claude Code 集成** - 自动生成 hooks 提供上下文和保护

## Core Concepts

### Origin（来源）

| Origin | 说明 | Gate 检查 |
|--------|------|-----------|
| `deductive` | 演绎 Pit - 来自 AI 预判 | evidence/regression/edge 可选 |
| `inductive` | 归纳 Pit - 来自真实错误 | evidence/regression/edge 必填 |

### Scope（生命周期）

| Type | 说明 |
|------|------|
| `permanent` | 长期 - 项目级约束 |
| `temporary` | 临时 - 有终止条件（日期/分支/里程碑） |

### TRAV Protocol

每个 pitfall 包含四部分：
- **T**rigger - 如何检测这个问题
- **R**eplay - 根因分析
- **A**ction - 如何修复
- **V**erify - 如何验证修复

### Trigger Types

| Kind | 用途 | 示例 |
|------|------|------|
| `external` | 复用现有工具 | husky/biome/scripts |
| `change` | Git 文件变更检测 | schema 变更时触发 |
| `command` | 拦截 shell 命令 | 阻止危险命令 |
| `protect` | 保护文件不被 AI 修改 | 防止意外覆盖 |
| `inject-context` | 向 AI 注入上下文 | 提醒历史问题 |

### Gate Checks

创建 pitfall 前必须通过的检查：

**归纳 Pit（origin: inductive）**：
1. **Evidence** - 必须有 error_snippet 或 command
2. **Regression** - 必须有复现步骤或豁免说明
3. **Edge** - 必须有边界情况或豁免说明

**演绎 Pit（origin: deductive）**：
- Evidence/Regression/Edge 可选
- 只需 trigger/replay/action/verify

## Key Directories

```
src/
├── commands/          # CLI 命令实现
├── lib/
│   ├── trigger/       # 触发器实现
│   ├── hooks/         # Claude Code hooks 生成器
│   └── schema.ts      # Zod schema 定义
├── templates/
│   ├── skills/fdd/    # FDD skill 文档
│   └── specs/         # 规划文档模板
└── types/             # TypeScript 类型

templates/             # 构建后的模板（不要手动编辑）
tests/e2e/             # E2E 测试

.fdd/                  # FDD 数据目录
├── specs/             # 规划文档
│   └── {feature}/
│       ├── SPEC.md
│       ├── stories.md
│       ├── flows.md
│       ├── context.md
│       ├── constraints.md
│       └── unresolved.md
├── pits/              # Pit 文件
└── config.yaml

.claude/               # Claude Code hooks
```

## Development Guidelines

- **构建前**: 修改 `src/templates/`，不是根目录的 `templates/`
- **测试**: 单元测试在 `src/__tests__/`，E2E 测试在 `tests/e2e/`
- **Hook 输出**: stdout 给 Claude 看，stderr 输出空格避免警告

## Rules Reference

详细规则请查看：
- @.claude/rules/architecture.md - 架构设计
- @.claude/rules/coding-standards.md - 代码规范
- @.claude/rules/triggers.md - 触发器系统
- @.claude/rules/hooks.md - Hooks 系统
- @.claude/rules/testing.md - 测试规范
- @.claude/rules/commands.md - 命令参考

## Common Tasks

### 添加新的触发器类型

1. 在 `src/lib/trigger/` 创建实现文件
2. 在 `src/lib/trigger/types.ts` 添加类型
3. 在 `src/lib/trigger/index.ts` 注册
4. 在 `src/lib/schema.ts` 添加 Zod schema
5. 添加单元测试

### 添加新的 Hook 类型

1. 在 `src/lib/hooks/` 创建生成器
2. 在 `src/lib/hooks/index.ts` 注册
3. 更新 `.claude/settings.json` 结构

### 修改 Pitfall 结构

1. 更新 `src/types/index.ts` 类型定义
2. 更新 `src/lib/schema.ts` Zod schema
3. 更新 `src/templates/pitfall.md` 模板
4. 运行 `bun build` 复制模板
