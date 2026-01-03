---
name: fdd
description: Feedback-Driven Development - 将 bug 修复编译成可触发的 pitfall。当修复 bug 后想防止复发、被 stop hook 触发、用户要求创建 pit、或想查看现有 pitfall 时使用。
---

# FDD - Feedback-Driven Development

> AI 上下文易逝，但代码库永存。遇到错误时，趁热将修复编译成可触发的 pitfall。

## 快速开始

### 创建 Pitfall

```bash
fdd add --json '<JSON>'
```

格式参考：[create.md](create.md)

### 查看现有 Pitfalls

```bash
fdd list
```

**重要**：创建新 pitfall 前，先运行 `fdd list` 检查是否已有类似记录，避免重复。

## 核心概念

### TRAV 协议

每个 pitfall 包含四部分：
- **T**rigger — 如何检测这个问题
- **R**eplay — 根因分析
- **A**ction — 如何修复
- **V**erify — 如何验证修复

详见：[gates.md](gates.md)

### 触发器类型

6 种触发器用于检测问题：
- `rule` — 静态代码匹配
- `change` — Git 文件变更
- `dynamic` — 运行时检查
- `command` — 命令拦截
- `protect` — 文件保护
- `ai-context` — AI 上下文注入

详见：[triggers.md](triggers.md)

## 创建 Pitfall 流程

1. **判断是否值得记录**
   - 问自己：如果记录为 PIT，能否帮助未来没有当前 context 的 AI agent 避免踩同样的坑？
   - 能 → 继续
   - 不能 → 静默跳过，不解释

2. **检查现有 Pitfalls**
   ```bash
   fdd list
   ```
   确认没有类似记录

3. **询问用户确认**
   - 使用 AskUserQuestion 工具
   - 选项：记录 / 跳过
   - 用户跳过 → 完全丢弃

4. **构建 JSON 并执行**
   - 参考 [create.md](create.md) 构建完整 JSON
   - 执行 `fdd add --json '{...}'`

## 示例

参见：[examples.md](examples.md)
