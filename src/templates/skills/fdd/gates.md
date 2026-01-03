# Gate Checks

每个 Pit 必须通过质量门禁。**演绎 Pit 的门禁更宽松。**

## 演绎 vs 归纳

| Gate | 归纳 Pit | 演绎 Pit |
|------|----------|----------|
| Gate 1: Evidence | **必填** | 可选 |
| Gate 2: Regression | **必填或 waiver** | 可选 |
| Gate 3: Edge | **必填或 waiver** | 可选 |
| Gate 4-8 | 必填 | 必填 |

## Gate 1: Evidence Required（仅归纳）

**归纳 Pit** 必须包含 `evidence` 块：
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

**演绎 Pit 可以省略 evidence。**

## Gate 2: Regression Required（仅归纳）

**归纳 Pit** 必须包含 `regression` 块。

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

**演绎 Pit 可以省略 regression。**

## Gate 3: Edge Required（仅归纳）

**归纳 Pit** 必须包含 `edge` 块（至少一个负面案例）。

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

**演绎 Pit 可以省略 edge。**

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

## Gate 5: Trigger Field Validation

每种 trigger.kind 有必填字段：

| kind | 必填字段 |
|------|----------|
| rule | pattern |
| command | pattern |
| dynamic | must_run |
| change | when_changed |
| protect | paths |
| ai-context | when_touching, context |

## Gate 6: Replay Required

所有 Pit 必须包含 `replay.root_cause`：

```json
{
  "replay": {
    "root_cause": "根本原因（必填）"
  }
}
```

## Gate 7: Action Required

所有 Pit 必须包含至少一个 action：

```json
{
  "action": [{
    "level": "low",
    "kind": "transform",
    "action": "如何修复",
    "steps": ["步骤1", "步骤2"]
  }]
}
```

## Gate 8: Verify Required

所有 Pit 必须包含 verify：

| Level | 必填 |
|-------|------|
| V0, V1 | checks |
| V2 | evidence 存在 |
| V3 | fallback.self_proof |

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

| 优先级 | 类型 | 成本 |
|--------|------|------|
| 1 | rule | 低 |
| 2 | change | 低 |
| 3 | protect | 低 |
| 4 | command | 低 |
| 5 | dynamic | 中 |
| 6 | ai-context | 低（但无程序化检测） |
