# FDD (Feedback-Driven Development)

> **趁 AI 还记得，把一次修复编译成"可触发、可回归"的坑位**

## 黄金路径

1. 人类 + AI 协作完成一次修复（此时上下文还热）
2. 立刻运行：`/fdd-record`（Claude 场景）或 `fdd record`（终端场景）
3. AI 自动完成：DRRV 生成 → regression 测试 → edge 测试
4. 坑位写入 `.fdd/pitfalls/`，从此成为 repo 的长期记忆

## 目录结构

```
.fdd/
├── pitfalls/     # 坑位条目（DRRV 协议）
├── rules/        # 长期不变量（架构契约、禁令）
└── config.yaml   # 全局策略
```

## DRRV 协议

每个坑位必须包含：

- **Detect（抓现行）**：如何检测到这个问题
- **Replay（放回放）**：问题是怎么发生的
- **Remedy（给方案）**：如何修复
- **Verify（过安检）**：如何验证修复成功

## 硬门禁

坑位必须包含：
- `evidence`：原始证据（error_snippet 或 command）
- `regression`：回归测试（或 waiver + reason）
- `edge`：误诊边界测试（或 waiver + reason）

缺失任一项将无法写入。

## 命令

- `/fdd-record`：在 Claude 中一键编译坑位
- `fdd record`：在终端中记录坑位
- `fdd list`：列出所有坑位
