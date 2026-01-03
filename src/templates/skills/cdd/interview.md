# CDD Interview

> 让 AI 通过 AskUserQuestionTool 深度访谈，发现约束盲区。

## 触发 Prompt

```
使用 AskUserQuestionTool 访谈我，完善 CDD 规范。
问：失败条件、资源限制、禁止事项、不确定项。
每次 1-2 个问题，持续问直到足够清晰，然后生成规范。
```

## 问题框架

### Phase 1: 意图
- 这个功能要解决什么问题？
- 成功的标志是什么？

### Phase 2: 失败条件 → BC
- 什么情况算失败？
- 边界情况有哪些？
- 并发/一致性要求？

### Phase 3: 资源限制 → RC
- 响应时间要求？（P50/P99）
- 内存/CPU 限制？
- 成本/预算约束？

### Phase 4: 结构约束 → SC
- 放在哪个模块？
- 哪些模块不能依赖？
- API 需要向后兼容吗？

### Phase 5: 禁止事项 → Non-Goals
- 这个版本不做什么？
- 哪些技术方案排除？

### Phase 6: 不确定项 → UC ⚠️
- 哪些还没想清楚？
- 哪些需要更多信息？
- **必须显式声明**：即使无不确定项，也要写 `## Unresolved\n(无)`

### Phase 7: 验证方式
- 如何验证约束？
- 哪些可以自动化？

## 输出

Interview 完成后生成：
- `01-constraints.md` — 从问答提取 BC/RC/SC/Non-Goals/UC
- `02-validators.md` — 每条约束的验证方式
- `03-convergence.md` — 初始收敛状态

## 预防性 Pitfall 建议

**Interview 完成后，主动询问用户**：

```
这些约束中，以下几条适合预防性添加为 FDD Pitfall：

| 约束 | 建议触发器 | 理由 |
|------|-----------|------|
| BC-01 | rule | 可用 grep 检测危险模式 |
| SC-02 | protect | 需要阻止 AI 修改特定文件 |
| Non-Goal: 不做 X | command | 需要阻止相关命令执行 |

要现在添加吗？（可以之后再加）
```

### 适合预防性 Pitfall 的约束特征

- ⚠️ 高风险（安全、数据一致性）
- 🔍 可自动检测（有明确的代码模式）
- 🚫 硬性禁止（Non-Goals、Forbidden）
- 🔄 容易复发（常见错误模式）
