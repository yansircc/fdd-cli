# 创建 Pitfall

> **必须使用 CLI**：`fdd add --json '...'`
> 禁止直接写文件。CLI 自动处理 ID 生成、门禁校验和格式化。

## 新增字段（FDD v2）

### origin（必填）

| 值 | 说明 | Gate 检查 |
|----|------|-----------|
| `deductive` | 演绎 Pit - 来自预判/Interview | evidence/regression/edge 可选 |
| `inductive` | 归纳 Pit - 来自真实错误 | evidence/regression/edge 必填 |

### scope（必填）

```json
// 长期（项目级）
{
  "scope": {
    "type": "permanent"
  }
}

// 临时（有终止条件）
{
  "scope": {
    "type": "temporary",
    "reason": "v1.0 scope 限制",
    "expires": "2024-03-01",      // 可选：日期过期
    "branch": "feature/oauth",    // 可选：分支合并后过期
    "milestone": "v2.0"           // 可选：里程碑完成后过期
  }
}
```

## 执行步骤

### 1. 确定 Origin

- **归纳 (inductive)**：Bug 修复后，从真实错误中提取
- **演绎 (deductive)**：开发前，预防性约束

### 2. 收集上下文

从对话中提取 `evidence`（归纳必填，演绎可选）：
- `error_snippet` — 错误信息
- `diff_summary` — 修复摘要
- `command` — 触发命令
- `commit` — 相关提交

缺少信息最多问 1-2 个问题。

### 3. 设计 Trigger

| 问题类型 | 推荐 trigger.kind |
|---------|------------------|
| 语法/API 误用 | `rule` |
| 配置/环境问题 | `dynamic` |
| 依赖/版本问题 | `dynamic` |
| 文件变更触发 | `change` |
| 危险命令拦截 | `command` |
| 文件写入保护 | `protect` |
| AI 上下文提醒 | `ai-context` |

**决策流程：**
```
保护文件不被 AI 写入？→ protect
阻止危险命令？→ command
需要 AI 事前了解历史？→ ai-context
静态分析可检测？→ rule
需要运行时检查？→ dynamic
文件变更相关？→ change
```

### 4. 构建完整 JSON

#### 归纳 Pit（严格）

```json
{
  "title": "简短描述",
  "origin": "inductive",
  "scope": {"type": "permanent"},
  "severity": "high",
  "tags": ["category"],
  "evidence": {
    "error_snippet": "错误信息（必填）",
    "diff_summary": "修复摘要"
  },
  "trigger": [
    {"kind": "rule", "pattern": "pattern", "scope": ["src/**"], "strength": "strong"}
  ],
  "replay": {
    "root_cause": "根本原因（必填）"
  },
  "action": [
    {"level": "low", "kind": "transform", "action": "如何修复", "steps": ["步骤1"]}
  ],
  "verify": {
    "level": "V0",
    "checks": ["bun test"]
  },
  "regression": {
    "repro": ["复现步骤（必填）"],
    "expected": "预期表现"
  },
  "edge": {
    "negative_case": ["不触发场景（必填）"],
    "expected": "原因"
  }
}
```

#### 演绎 Pit（宽松）

```json
{
  "title": "简短描述",
  "origin": "deductive",
  "scope": {
    "type": "temporary",
    "reason": "v1.0 不做此功能",
    "expires": "2024-06-01"
  },
  "severity": "medium",
  "tags": ["non-goal"],
  "trigger": [
    {"kind": "command", "pattern": "npm install.*oauth", "action": "block", "message": "Non-Goal: 本版本不做 OAuth", "strength": "strong"}
  ],
  "replay": {
    "root_cause": "预防性约束：产品决策"
  },
  "action": [
    {"level": "low", "kind": "read", "doc": "等待 v2.0 规划"}
  ],
  "verify": {
    "level": "V3",
    "fallback": {"level": "V3", "self_proof": ["产品决策，非技术约束"]}
  }
}
```

### 5. 执行

```bash
fdd add --json '<JSON>'
```

## Trigger 示例

### rule - 静态代码匹配
```json
{"kind": "rule", "pattern": "\\.state\\.values\\(\\)", "scope": ["src/**/*.ts"], "strength": "strong"}
```

### dynamic - 运行时检查
```json
{"kind": "dynamic", "must_run": ["test -n \"$DATABASE_URL\"", "bun typecheck"], "strength": "strong"}
```

### change - 文件变更触发
```json
{"kind": "change", "when_changed": ["src/db/schema.ts"], "must_run": ["bun db:generate --dry-run"], "strength": "strong"}
```

### command - 命令拦截
```json
{"kind": "command", "pattern": "wrangler\\s+d1\\s+execute", "action": "block", "message": "使用 bun db:* 命令", "strength": "strong"}
```

### protect - 文件写入保护
```json
{"kind": "protect", "paths": [".fdd/pits/**"], "permissions": {"create": "deny", "update": "deny", "delete": "deny"}, "message": "请使用 fdd add --json", "strength": "strong"}
```

### ai-context - AI 上下文注入
```json
{"kind": "ai-context", "when_touching": ["src/lib/database.ts", "src/db/**"], "context": "此区域曾发生 SQL 注入问题，使用 parameterized queries。", "strength": "strong"}
```

## 字段参考

| 字段 | 值 | 说明 |
|-----|---|-----|
| origin | deductive/inductive | **必填** 来源类型 |
| scope.type | permanent/temporary | **必填** 生命周期 |
| scope.expires | ISO date | 临时 Pit 过期日期 |
| severity | critical/high/medium/low | 严重程度 |
| trigger[].kind | rule/change/dynamic/command/protect/ai-context | 触发器类型 |
| trigger[].strength | strong/weak | 检测可靠度 |
| trigger[].action | block/warn | command 专用 |
| trigger[].paths | glob[] | protect 专用 |
| trigger[].permissions | {create,update,delete} | protect 专用 |
| trigger[].when_touching | glob[] | ai-context 专用 |
| trigger[].context | string | ai-context 专用 |
| replay.root_cause | string | **必填** |
| action[].level | low/medium/high | 风险等级 |
| action[].kind | transform/read/run | 操作类型 |
| verify.level | V0-V3 | V0 最强 |

## Waiver 格式（仅归纳 Pit）

当无法提供 regression 或 edge 时：
```json
{"regression": {"repro": [], "expected": "", "waiver": true, "waiver_reason": "原因"}}
{"edge": {"negative_case": [], "expected": "", "waiver": true, "waiver_reason": "原因"}}
```

## V3 自证格式

当无法提供 V0-V2 验证时：
```json
{"verify": {"level": "V3", "fallback": {"level": "V3", "self_proof": ["确认理由"]}}}
```
