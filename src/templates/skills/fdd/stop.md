# FDD Stop Hook 处理规则

当你看到 `[FDD] 修复:` 消息时，执行以下步骤：

## 1. 判断是否值得记录

思考：**如果记录为 PIT，能否帮助未来没有当前 context 的 AI agent 避免踩同样的坑？**

- 能 → 询问用户
- 不能 → **静默跳过，输出 DONE 即可。**

## 2. 询问用户（仅当值得记录时）

使用 AskUserQuestion 工具：
- 问题："是否记录为 PIT？"
- 选项：
  - "记录"
  - "跳过"

## 3. 如果用户选择"记录"

**先读取 [create.md](create.md) 获取完整的 JSON 格式和字段参考。**

## 4. 执行记录

按照 `create.md` 中的模板构建完整 JSON，然后执行：

```bash
fdd add --json '{...}'
```
