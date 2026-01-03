# Trigger System

## Trigger Types

### rule

Grep 模式匹配，检测代码反模式。

```yaml
trigger:
  - kind: rule
    pattern: "console\\.log"
    scope: ["src/**/*.ts"]
    exclude: ["**/*.test.ts"]
```

实现：`src/lib/trigger/rule.ts`

关键函数：
- `runRuleTrigger()` - 执行 grep 搜索
- 使用 `Bun.spawn` 调用 grep

### change

Git 文件变更检测。

```yaml
trigger:
  - kind: change
    paths: ["prisma/schema.prisma"]
```

实现：`src/lib/trigger/change.ts`

关键函数：
- `runChangeTrigger()` - 检查 git diff
- 支持 staged 和 unstaged 变更

### dynamic

运行 shell 命令进行检查。

```yaml
trigger:
  - kind: dynamic
    command: "npm run typecheck"
    expect_failure: false
```

实现：`src/lib/trigger/dynamic.ts`

关键函数：
- `runDynamicTrigger()` - 执行命令
- 检查退出码

### command

拦截 shell 命令。

```yaml
trigger:
  - kind: command
    pattern: "rm -rf /"
    action: block
    message: "This command is dangerous!"
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
    paths: [".fdd/pitfalls/**"]
    permissions:
      create: deny
      update: deny
      delete: deny
    message: "Use fdd add --json instead"
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
    strength: strong  # strong | medium | weak
```

实现：`src/lib/trigger/ai-context.ts`

关键函数：
- `runAiContextTrigger()` - 匹配文件路径
- 生成 Claude Code context hook

## TriggerResult 结构

```typescript
interface TriggerResult {
  triggered: boolean;
  matches?: string[];      // rule: 匹配的行
  changedFiles?: string[]; // change: 变更的文件
  output?: string;         // dynamic: 命令输出
  blocked?: boolean;       // command: 是否阻止
  action?: 'block' | 'warn' | 'allow';
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
  ↓
aggregateResults()
  ↓
formatOutput()
```
