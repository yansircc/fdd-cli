# Gate Checks

每个 pitfall 必须通过以下质量门禁。

## Gate 1: Evidence Required

Pitfall 必须包含 `evidence` 块：
- `error_snippet` 或 `command`（至少一个）
- `commit`（如果有）

```json
{
  "evidence": {
    "error_snippet": "TypeError: Cannot read property 'x' of undefined",
    "diff_summary": "Added null check before accessing property",
    "command": "bun test",
    "commit": "abc1234"
  }
}
```

**缺少 evidence 的 pitfall 将被拒绝。**

## Gate 2: Regression Required

Pitfall 必须包含 `regression` 块。

### 正常情况
```json
{
  "regression": {
    "repro": [
      "1. Create user without email",
      "2. Call sendWelcome()",
      "3. Observe error"
    ],
    "expected": "Should throw ValidationError before sending"
  }
}
```

### 无法复现时（Waiver）
```json
{
  "regression": {
    "repro": [],
    "expected": "",
    "waiver": true,
    "waiver_reason": "Issue only occurs in production with specific data"
  }
}
```

**缺少 regression 的 pitfall 将被拒绝。**

## Gate 3: Edge Required

Pitfall 必须包含 `edge` 块（至少一个负面案例）。

### 正常情况
```json
{
  "edge": {
    "negative_case": [
      "Valid email should not trigger",
      "Empty string should be caught by earlier validation"
    ],
    "expected": "Only null/undefined emails trigger this pitfall"
  }
}
```

### 无法设计负面案例时（Waiver）
```json
{
  "edge": {
    "negative_case": [],
    "expected": "",
    "waiver": true,
    "waiver_reason": "All inputs of this type should trigger the check"
  }
}
```

**缺少 edge 的 pitfall 将被拒绝。**

## Gate 4: Weak Trigger Marking

如果触发器只使用字符串匹配，必须：
- 标记 `strength: weak`
- 生成 TODO 说明如何升级

```json
{
  "trigger": [{
    "kind": "rule",
    "pattern": "error",
    "strength": "weak"
  }]
}
```

## Verify Levels

验证级别从强到弱：

| Level | 说明 | 示例 |
|-------|------|------|
| V0 | test/type/build | `bun test`, `tsc --noEmit` |
| V1 | lint/grep/AST | `bun lint`, 静态分析 |
| V2 | evidence 存在性 | 有错误截图或日志 |
| V3 | 结构化自证 | 人工确认理由 |

### V3 自证格式
```json
{
  "verify": {
    "level": "V3",
    "fallback": {
      "level": "V3",
      "self_proof": [
        "Manually verified fix works",
        "No automated test possible for this UI issue"
      ]
    }
  }
}
```

## Trigger 优先原则

> **按成本效益排序：最低成本 + 最高准确度优先。**

静态/变更类触发器通常更便宜，但如果问题本质上是动态契约问题，则优先使用动态触发器。

| 优先级 | 类型 | 成本 |
|--------|------|------|
| 1 | rule | 低 |
| 2 | change | 低 |
| 3 | protect | 低 |
| 4 | command | 低 |
| 5 | dynamic | 中 |
| 6 | ai-context | 低（但无程序化检测） |
