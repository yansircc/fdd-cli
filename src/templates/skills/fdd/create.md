# 创建 Pitfall

> **必须使用 CLI**：`fdd add --json '...'`
> 禁止直接写文件。CLI 自动处理 ID 生成、门禁校验和格式化。

## 执行步骤

### 1. 收集上下文

从对话中提取 `evidence`：
- `error_snippet` — 错误信息
- `diff_summary` — 修复摘要
- `command` — 触发命令
- `commit` — 相关提交

缺少信息最多问 1-2 个问题。

### 2. 设计 Trigger

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

### 3. 构建完整 JSON

```json
{
  "title": "简短描述",
  "severity": "high",
  "tags": ["category"],
  "evidence": {
    "error_snippet": "错误信息",
    "diff_summary": "修复摘要"
  },
  "trigger": [
    {"kind": "rule", "tool": "grep", "pattern": "pattern", "scope": ["src/**"], "strength": "strong"}
  ],
  "replay": {
    "root_cause": "根本原因（必填）"
  },
  "action": [
    {"level": "low", "kind": "transform", "action": "如何修复", "steps": ["步骤1", "步骤2"]}
  ],
  "verify": {
    "level": "V0",
    "checks": ["bun test"]
  },
  "regression": {
    "repro": ["复现步骤"],
    "expected": "预期表现"
  },
  "edge": {
    "negative_case": ["不触发场景"],
    "expected": "原因"
  }
}
```

### 4. 执行

```bash
fdd add --json '<JSON>'
```

## Trigger 示例

### rule - 静态代码匹配
```json
{"kind": "rule", "tool": "grep", "pattern": "\\.state\\.values\\(\\)", "scope": ["src/**/*.ts"], "strength": "strong"}
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
{"kind": "protect", "paths": [".fdd/pitfalls/**"], "permissions": {"create": "deny", "update": "deny", "delete": "deny"}, "message": "请使用 fdd add --json", "strength": "strong"}
```

### ai-context - AI 上下文注入
```json
{"kind": "ai-context", "when_touching": ["src/lib/database.ts", "src/db/**"], "context": "此区域曾发生 SQL 注入问题，使用 parameterized queries。", "strength": "strong"}
```

## 字段参考

| 字段 | 值 | 说明 |
|-----|---|-----|
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

## Waiver 格式

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
