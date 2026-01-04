# Trigger System

## Trigger Types

### external

复用现有工具（husky/biome/scripts）进行检测。

```yaml
trigger:
  - kind: external
    tool: husky | biome | scripts
    ref: .husky/pre-push | biome.json#no-console | package.json#scripts.check
    strength: strong
```

实现：`src/lib/trigger/external.ts`

**特点**：
- 不参与 `fdd check`（由外部工具自己执行）
- `fdd validate` 检查 ref 有效性
- 创建 Pit 时检测工具是否安装

**支持的工具**：
- `husky`: Git hooks（.husky/*）
- `biome`: Lint 规则（biome.json#rule-name）
- `scripts`: npm scripts（package.json#scripts.name）

### change

Git 文件变更检测。

```yaml
trigger:
  - kind: change
    when_changed: ["prisma/schema.prisma"]
    strength: strong
```

实现：`src/lib/trigger/change.ts`

关键函数：
- `runChangeTrigger()` - 检查 git diff
- 支持 staged 和 unstaged 变更

### command

拦截 shell 命令。

```yaml
trigger:
  - kind: command
    pattern: "rm -rf /"
    action: block
    message: "This command is dangerous!"
    strength: strong
```

实现：`src/lib/trigger/command.ts`

关键函数：
- `checkCommandAgainstTriggers()` - 匹配命令模式
- 返回 block/warn/allow

### protect

保护文件不被 AI 修改。

```yaml
trigger:
  - kind: protect
    paths: [".fdd/pits/**"]
    permissions:
      create: deny
      update: deny
      delete: deny
    message: "Use fdd add --json instead"
    strength: strong
```

实现：`src/lib/trigger/protect.ts`

关键函数：
- `runProtectTrigger()` - 检查文件操作
- 生成 Claude Code protect hook

### ai-context

向 AI 注入上下文。

```yaml
trigger:
  - kind: ai-context
    when_touching: ["src/lib/database.ts"]
    context: "This area had SQL injection issues."
    strength: strong
```

实现：`src/lib/trigger/ai-context.ts`

关键函数：
- `runAiContextTrigger()` - 匹配文件路径
- 生成 Claude Code context hook

## TriggerResult 结构

```typescript
interface TriggerResult {
  triggered: boolean;
  matches?: string[];      // external: ref 信息
  changedFiles?: string[]; // change: 变更的文件
  blocked?: boolean;       // command: 是否阻止
  action?: 'block' | 'warn' | 'allow';
  error?: string;          // 错误信息
}
```

## 添加新触发器

1. 在 `src/lib/trigger/types.ts` 添加类型
2. 创建 `src/lib/trigger/{kind}.ts` 实现
3. 在 `src/lib/trigger/index.ts` 的 `runSingleTrigger()` 中注册
4. 在 `src/lib/schema.ts` 添加 Zod schema
5. 添加测试 `src/__tests__/trigger/{kind}.test.ts`

## 触发器执行流程

```
fdd check
  ↓
loadAllPitfalls()
  ↓
for each pitfall:
  for each trigger:
    runSingleTrigger(trigger)
    (external 类型跳过，返回 triggered=false)
  ↓
aggregateResults()
  ↓
formatOutput()
```
