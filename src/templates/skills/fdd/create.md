# 创建 Pitfall

> **必须使用 CLI**：`fdd add --json '...'`
> **必须用户确认**：创建前调用 AskUserQuestionTool 展示设计

## 流程

```
1. 收集上下文
2. 设计 Pit（trigger、scope 等）
3. Challenge：展示设计，用户确认
4. 执行 fdd add --json
```

## 1. 收集上下文

- **归纳 (inductive)**：从 Bug 修复中提取 evidence（必填）
- **演绎 (deductive)**：从 Interview 识别的风险点（evidence 可选）

缺少信息最多问 1-2 个问题。

## 2. 设计 Pit

### Trigger 选择

```
保护文件？→ protect
阻止命令？→ command
AI 需了解历史？→ ai-context
静态可检测？→ rule
运行时检查？→ dynamic
文件变更？→ change
```

### 路径规则

- **禁止假设**：项目未开始时用通用模式 `src/**/*.ts`
- **开发后细化**：代码结构确定后可更新

详见：[triggers.md](triggers.md)

## 3. Challenge（必须）

使用 AskUserQuestionTool 展示设计：

```
## Pit 设计预览

**标题**: {title}
**类型**: {origin} / {scope.type}
**Trigger**:
  - kind: {kind}
  - pattern/paths: {value}
  - scope: {scope}

**风险**: {AI 可能怎么犯错}
**验证**: {verify.level}

---
确认创建？
- [创建] 确认无误
- [调整] 需要修改（说明哪里）
- [跳过] 不需要此 Pit
```

用户选择"调整"时，根据反馈修改后再次确认。

## 4. 构建 JSON

### 归纳 Pit（严格）

```json
{
  "title": "简短描述",
  "origin": "inductive",
  "scope": {"type": "permanent"},
  "severity": "high",
  "tags": ["category"],
  "evidence": {"error_snippet": "错误信息", "diff_summary": "修复摘要"},
  "trigger": [{"kind": "rule", "pattern": "pattern", "scope": ["src/**"], "strength": "strong"}],
  "replay": {"root_cause": "根本原因"},
  "action": [{"level": "low", "kind": "transform", "steps": ["步骤1"]}],
  "verify": {"level": "V0", "checks": ["npm test"]},
  "regression": {"repro": ["复现步骤"], "expected": "预期"},
  "edge": {"negative_case": ["不触发场景"], "expected": "原因"}
}
```

### 演绎 Pit（宽松）

```json
{
  "title": "简短描述",
  "origin": "deductive",
  "scope": {"type": "permanent"},
  "severity": "medium",
  "tags": ["convention"],
  "trigger": [{"kind": "ai-context", "when_touching": ["src/**"], "context": "提示信息", "strength": "strong"}],
  "replay": {"root_cause": "预防性约束"},
  "action": [{"level": "low", "kind": "read", "doc": "参考文档"}],
  "verify": {"level": "V3", "fallback": {"level": "V3", "self_proof": ["确认理由"]}}
}
```

## 5. 执行

```bash
fdd add --json '<JSON>'
```

## 命名规则

- **文件名**：纯英文 slug，如 `pit-001-code-first-sync.md`
- **禁止**：中英混合如 `pit-001-同步优先.md`

## 正文规则

- **禁止重复**：正文不复述 frontmatter
- **可以省略**：无补充内容时省略正文

## 字段参考

| 字段 | 值 | 说明 |
|-----|---|-----|
| origin | deductive/inductive | **必填** |
| scope.type | permanent/temporary | **必填** |
| severity | critical/high/medium/low | 严重程度 |
| trigger[].kind | rule/change/dynamic/command/protect/ai-context | 触发器 |
| trigger[].strength | strong/weak | 可靠度 |
| replay.root_cause | string | **必填** |
| verify.level | V0-V3 | V0 最强 |

## Waiver 格式（仅归纳）

```json
{"regression": {"repro": [], "expected": "", "waiver": true, "waiver_reason": "原因"}}
```
