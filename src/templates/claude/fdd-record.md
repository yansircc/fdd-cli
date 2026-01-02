---
description: 把刚完成的修复编译成可触发坑位（趁热，一键完成）
---

# STOP - 必须使用 CLI

> **使用 `fdd record --json '...'` 命令。禁止直接写文件。**
> CLI 自动处理 ID 生成、门禁校验和格式化。

## 执行步骤

### 1. 收集上下文

从对话中提取 `evidence`：`error_snippet`、`diff_summary`、`command`、`commit`。缺少信息最多问 1-2 个问题。

### 2. 设计 Trigger（关键步骤）

| 问题类型 | 推荐 trigger.kind | 示例 |
|---------|------------------|------|
| 语法/API 误用 | `rule` | grep 匹配代码模式 |
| 配置/环境问题 | `dynamic` | shell 脚本检查环境 |
| 依赖/版本问题 | `dynamic` | 检查 package.json |
| 文件变更触发 | `change` | schema 变更后验证 |
| 危险命令拦截 | `command` | 阻止 `wrangler d1` |
| 文件写入保护 | `protect` | 禁止直接写入 `.fdd/` |

**决策流程：**
```
保护文件不被 AI 写入？→ protect
阻止危险命令？→ command
静态分析可检测？→ rule
需要运行时检查？→ dynamic
文件变更相关？→ change
```

### 3. Trigger 示例

#### rule - 静态代码匹配
```json
{"kind": "rule", "tool": "grep", "pattern": "\\.state\\.values\\(\\)", "scope": ["src/**/*.ts"], "strength": "strong"}
```

#### dynamic - 运行时检查
```json
{"kind": "dynamic", "must_run": ["test -n \"$DATABASE_URL\"", "bun typecheck"], "strength": "strong"}
```

#### change - 文件变更触发
```json
{"kind": "change", "when_changed": ["src/db/schema.ts"], "must_run": ["bun db:generate --dry-run"], "strength": "strong"}
```

#### command - 命令拦截
```json
{"kind": "command", "pattern": "wrangler\\s+d1\\s+execute", "action": "block", "message": "使用 bun db:* 命令", "strength": "strong"}
```

#### protect - 文件写入保护
```json
{"kind": "protect", "paths": [".fdd/pitfalls/**"], "exclude": ["*.bak"], "permissions": {"create": "deny", "update": "deny", "delete": "deny"}, "message": "请使用 fdd record --json", "strength": "strong"}
```

### 4. 构建完整 JSON

```json
{
  "title": "简短描述",
  "severity": "high",
  "tags": ["category"],
  "evidence": {"error_snippet": "错误", "diff_summary": "修复"},
  "trigger": [{"kind": "...", "...": "..."}],
  "replay": {"root_cause": "根本原因（必填）"},
  "action": [{"level": "low", "kind": "transform", "action": "如何修复", "steps": ["步骤"]}],
  "verify": {"level": "V0", "checks": ["bun test"]},
  "regression": {"repro": ["复现步骤"], "expected": "预期表现"},
  "edge": {"negative_case": ["不触发场景"], "expected": "原因"}
}
```

### 5. 执行

```bash
fdd record --json '<JSON>'
```

## 字段参考

| 字段 | 值 | 说明 |
|-----|---|-----|
| severity | critical/high/medium/low | 严重程度 |
| trigger[].kind | rule/change/dynamic/command/protect | 触发器类型 |
| trigger[].strength | strong/weak | 检测可靠度 |
| trigger[].action | block/warn | command 专用 |
| trigger[].paths | glob[] | protect 专用 - 保护路径 |
| trigger[].permissions | {create,update,delete} | protect 专用 - CUD 权限 |
| replay.root_cause | string | **必填** |
| action[].level | low/medium/high | 风险等级 |
| action[].kind | transform/read/run | 操作类型 |
| verify.level | V0-V3 | V0 最强，V3 最弱 |

**Waiver 格式：**
```json
{"regression": {"repro": [], "expected": "", "waiver": true, "waiver_reason": "原因"}}
```

**V3 自证格式：**
```json
{"verify": {"level": "V3", "fallback": {"level": "V3", "self_proof": ["确认理由"]}}}
```
