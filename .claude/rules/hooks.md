# Claude Code Hooks System

## Hook Types

### Stop Hook

编辑文件后提示 AI 记录 pitfall。

生成器：`src/lib/hooks/stop.ts`
输出：`.claude/hooks/stop.mjs`
模板：`src/templates/claude/fdd-stop.md`

**输出规范**：
- `stdout`: 给 Claude 看的指令（用户不可见）
- `stderr`: 输出空格避免 "No stderr output" 警告
- AI 判断不值得记录时**静默跳过，不解释**

### Context Hook

触碰特定文件时注入上下文。

生成器：`src/lib/hooks/context.ts`
输出：`.claude/hooks/context.mjs`

从 `ai-context` 类型触发器生成。

### Protect Hook

阻止 AI 修改受保护的文件。

生成器：`src/lib/hooks/protect.ts`
输出：`.claude/hooks/protect.mjs`

从 `protect` 类型触发器生成。

### Guard Hook

拦截危险的 bash 命令。

生成器：`src/lib/hooks/guard.ts`
输出：`.claude/hooks/guard.mjs`

从 `command` 类型触发器生成。

## 规则文件引用链

```
hook 输出 → @.claude/rules/fdd-stop.md → @.claude/commands/fdd-record.md
```

AI 通过 @ 引用获取 JSON 格式，一次成功构建。

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

- `fdd record` 成功后
- `fdd init` 时
- 手动调用 `syncAllHooks()`

## Hook 文件格式

Hooks 是 CommonJS 模块 (`.mjs`)：

```javascript
// .claude/hooks/protect.mjs
export default {
  name: 'fdd-protect',
  event: 'before-tool-call',
  tools: ['write', 'edit'],
  async handler({ tool, input }) {
    // 检查逻辑
    if (shouldBlock) {
      return { blocked: true, message: '...' };
    }
    return { blocked: false };
  }
};
```

## 添加新 Hook

1. 在 `src/lib/hooks/` 创建生成器文件
2. 实现 `generate{Type}Hook(pitfalls, cwd)` 函数
3. 在 `src/lib/hooks/index.ts` 的 `syncAllHooks()` 中调用
4. 更新 `src/lib/hooks/settings.ts` 添加设置项
5. 在 `src/templates/claude/` 添加对应的规则模板

## 调试

```bash
# 查看生成的 hook
cat .claude/hooks/protect.mjs

# 查看 hook 配置
cat .claude/settings.json

# 手动同步
bun dev check  # 会触发 syncAllHooks
```
