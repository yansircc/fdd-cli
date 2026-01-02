# Architecture Rules

## Module Organization

### 命令层 (`src/commands/`)

每个命令对应一个文件或目录：
- 简单命令：单文件 (如 `list.ts`, `check.ts`)
- 复杂命令：目录结构 (如 `record/index.ts`, `record/interactive.ts`)

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

## 数据流

### Pitfall 生命周期

```
用户输入 → Zod 验证 → Gate 检查 → 写入文件 → 同步 Hooks
```

### 触发器执行流

```
fdd check → 加载 pitfalls → 对每个 pitfall 执行触发器 → 聚合结果
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
| Hook | `{type}.mjs` | `protect.mjs`, `guard.mjs` |

## 依赖规则

- 命令层可依赖库层
- 库层模块间尽量松耦合
- 触发器实现不依赖其他触发器
- Hooks 生成器可读取 pitfalls

## 导出规则

- 每个模块通过 `index.ts` 导出公开 API
- 内部函数不导出
- 类型定义放在 `types.ts`
