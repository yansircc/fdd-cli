# FDD Stop Hook 处理

当看到 `[FDD] 修复:` 消息时：

## 1. 判断价值

**能帮未来没有当前 context 的 AI 避坑？**

- 能 → 继续
- 不能 → 静默跳过

## 2. 询问用户

使用 AskUserQuestionTool：

```
是否记录为 Pit？
- [记录]
- [跳过]
```

## 3. 设计 Pit

读取 [create.md](create.md)，设计 Pit：

- 收集 evidence（错误信息、修复摘要）
- 选择 trigger 类型
- 确定 scope 和 severity

## 4. Challenge（必须）

使用 AskUserQuestionTool 展示设计：

```
## Pit 设计预览

**标题**: {title}
**Trigger**: {kind} - {pattern/scope}
**根因**: {root_cause}
**验证**: {verify.level}

确认创建？
- [创建]
- [调整]
- [跳过]
```

## 5. 执行

确认后执行：

```bash
fdd add --json '{...}'
```
