# Architecture Rules

## Module Organization

### 命令层 (`src/commands/`)

每个命令对应一个文件或目录：
- 简单命令：单文件 (如 `list.ts`, `check.ts`)
- 复杂命令：目录结构 (如 `add/index.ts`, `add/json-mode.ts`)

命令职责：
- 解析参数和选项
- 调用 lib 层函数
- 格式化输出
- 处理用户交互

### 库层 (`src/lib/`)

核心业务逻辑，按功能模块组织：

```
lib/
├── config.ts      # 配置加载
├── pitfall.ts     # Pitfall CRUD
├── schema.ts      # Zod 验证
├── gate.ts        # Gate 检查
├── id.ts          # ID 生成
├── shell-hooks.ts # Shell hook 脚本
├── trigger/       # 触发器实现
└── hooks/         # Claude hooks 生成
```

### 触发器模块 (`src/lib/trigger/`)

每种触发器类型独立实现：
- `index.ts` - 调度器，路由到具体实现
- `types.ts` - 类型定义
- `rule.ts`, `change.ts`, `dynamic.ts`, `command.ts`, `protect.ts`, `ai-context.ts`

### Hooks 模块 (`src/lib/hooks/`)

生成 Claude Code hooks：
- `index.ts` - 同步所有 hooks
- `stop.ts` - 编辑后提示 hook
- `context.ts` - 上下文注入 hook
- `protect.ts` - 保护文件 hook
- `guard.ts` - 命令拦截 hook
- `settings.ts` - settings.json 管理

### 模板 (`src/templates/`)

```
templates/
├── skills/
│   └── fdd/           # FDD skill 文档
│       ├── SKILL.md   # 主入口
│       ├── interview.md  # Interview 流程
│       ├── create.md  # 创建 Pit 格式
│       └── ...
├── specs/             # 规划文档模板
│   ├── SPEC.md
│   ├── stories.md
│   ├── flows.md
│   ├── context.md
│   ├── constraints.md
│   └── unresolved.md
└── pitfall.md         # Pit 文件模板
```

## 数据目录结构

### `.fdd/` 目录

```
.fdd/
├── specs/                    # 规划文档（Interview 产出）
│   └── {feature-name}/
│       ├── SPEC.md           # 索引 + Intent
│       ├── stories.md        # 用户故事
│       ├── flows.md          # 核心流程
│       ├── context.md        # 技术背景
│       ├── constraints.md    # 约束 + Non-Goals
│       └── unresolved.md     # 未决事项（可选）
├── pits/                     # Pit 文件
│   └── PIT-xxx-{slug}.md
├── rules/                    # 规则文件
│   └── RULE-xxx-{slug}.md
└── config.yaml               # 配置
```

### Pit 文件结构

```yaml
---
id: PIT-001
title: ...
origin: deductive | inductive  # 演绎 / 归纳
scope:
  type: permanent | temporary
  expires: 2024-03-01          # temporary 时可选
severity: critical | high | medium | low
tags: [...]
created: 2024-01-01T00:00:00Z
archived: false                # 归档标记
---

## Trigger
...

## Replay
...

## Action
...

## Verify
...
```

## 数据流

### Interview 流程（前馈/演绎）

```
用户需求 → 发散阶段 → 收敛阶段 → 元认知阶段 → specs/ + 演绎 Pit
              ↓           ↓            ↓
         stories.md  constraints.md  识别 AI 盲区
         flows.md    unresolved.md   生成演绎 Pit
         context.md
```

### Pitfall 生命周期（反馈/归纳）

```
Bug 修复 → Zod 验证 → Gate 检查 → 写入文件 → 同步 Hooks
```

### 触发器执行流

```
fdd check → 加载 pitfalls → 过滤（跳过过期/归档）→ 执行触发器 → 聚合结果
```

### Hook 同步流

```
pitfall 变更 → syncAllHooks() → 生成各类 hook 文件 → 更新 settings.json
```

## 文件命名约定

| 类型 | 格式 | 示例 |
|------|------|------|
| Pitfall | `PIT-{N}-{slug}.md` | `PIT-001-sql-injection-fix.md` |
| Rule | `RULE-{N}-{slug}.md` | `RULE-001-no-console-log.md` |
| Hook | `fdd-{type}.js` | `fdd-protect.js`, `fdd-guard.js` |
| Spec | `{name}.md` | `SPEC.md`, `stories.md` |

## 依赖规则

- 命令层可依赖库层
- 库层模块间尽量松耦合
- 触发器实现不依赖其他触发器
- Hooks 生成器可读取 pitfalls

## 导出规则

- 每个模块通过 `index.ts` 导出公开 API
- 内部函数不导出
- 类型定义放在 `types.ts`
