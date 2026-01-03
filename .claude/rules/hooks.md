# Claude Code Hooks System

## Hook Types

### Stop Hook

编辑文件后提示 AI 记录 pitfall。

生成器：`src/lib/hooks/stop.ts`
输出：`.claude/hooks/fdd-stop.cjs`

**输出规范**：
- stdout: JSON `{"decision": "block", "reason": "[FDD] 修复: <files> → @.claude/skills/fdd/stop.md"}`
- exit(0) + JSON 格式，Claude 读取 `reason` 字段
- AI 先阅读 `stop.md` 快速判断，值得记录时再阅读 `create.md`
- 不值得记录时**静默跳过，不解释**

### Context Hook

触碰特定文件时注入上下文。

生成器：`src/lib/hooks/context.ts`
输出：`.claude/hooks/fdd-context.cjs`

**输出规范**：
- 输出 `注意: [title] @.fdd/pitfalls/pit-xxx.md`
- 直接引用 pitfall 文件作为上下文

从 `ai-context` 类型触发器生成。

### Protect Hook

阻止 AI 修改受保护的文件。

生成器：`src/lib/hooks/protect.ts`
输出：`.claude/hooks/fdd-protect.cjs`

从 `protect` 类型触发器生成。硬性拦截，直接阻止操作。

### Guard Hook

拦截危险的 bash 命令。

生成器：`src/lib/hooks/guard.ts`
输出：`.claude/hooks/fdd-guard.cjs`

从 `command` 类型触发器生成。硬性拦截，直接阻止命令执行。

## Skill 引用链

```
stop hook 输出 → @.claude/skills/fdd/stop.md → @create.md
context hook 输出 → @.fdd/pitfalls/pit-xxx.md
```

## Hook 配置

### settings.json

`.claude/settings.json` 存储 hook 状态：

```json
{
  "hooks": {
    "protect": { "enabled": true },
    "context": { "enabled": true },
    "guard": { "enabled": true },
    "stop": { "enabled": true }
  }
}
```

管理：`src/lib/hooks/settings.ts`

## 同步机制

### syncAllHooks()

```typescript
// src/lib/hooks/index.ts
async function syncAllHooks(cwd: string) {
  const pitfalls = await loadAllPitfalls(cwd);

  await Promise.all([
    generateProtectHook(pitfalls, cwd),
    generateContextHook(pitfalls, cwd),
    generateGuardHook(pitfalls, cwd),
    generateStopHook(cwd),
  ]);

  await updateSettings(cwd);
}
```

### 触发时机

- `fdd add` 成功后
- `fdd init` 时
- 手动调用 `syncAllHooks()`

## 添加新 Hook

1. 在 `src/lib/hooks/` 创建生成器文件
2. 实现 `generate{Type}Hook(pitfalls, cwd)` 函数
3. 在 `src/lib/hooks/index.ts` 的 `syncAllHooks()` 中调用
4. 更新 `src/lib/hooks/settings.ts` 添加设置项

## 调试

```bash
# 查看生成的 hook
cat .claude/hooks/fdd-protect.cjs

# 查看 hook 配置
cat .claude/settings.json

# 手动同步
bun dev check  # 会触发 syncAllHooks
```
