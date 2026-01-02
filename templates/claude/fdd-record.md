---
description: 把刚完成的修复编译成可触发坑位（趁热，一键完成）
---

# STOP - READ THIS FIRST

> **必须使用 `fdd record --json '...'` 命令。**
>
> **禁止直接写文件。禁止用 Write/Edit 工具操作 pitfall 文件。**
>
> CLI 会自动处理 ID 生成、门禁校验和格式化。

---

## Task

将刚完成的修复编译成可触发、可回归测试的坑位。

## Execution Protocol

### Step 1: Collect Context

从当前对话中提取：

| Field | Source |
|-------|--------|
| `evidence.error_snippet` | 错误日志/症状 |
| `evidence.diff_summary` | 修复 diff |
| `evidence.command` | 触发命令 |
| `evidence.commit` | Commit hash（如有） |

如缺少关键信息，**最多问 1-2 个澄清问题**。

### Step 2: Design Detector (CRITICAL - 花时间思考)

> **检测器设计是 pitfall 的核心价值。不要走捷径。**

#### Q1: 问题的本质是什么？（决定检测策略）

| 问题类型 | 特征 | 推荐检测方式 |
|---------|------|-------------|
| **语法/API 误用** | 特定代码模式 | `rule` (grep/AST) |
| **配置/环境问题** | 缺少环境变量、配置项错误 | `dynamic` (shell 脚本) |
| **依赖/版本问题** | 包版本不匹配、缺少依赖 | `dynamic` (检查 package.json) |
| **构建/编译问题** | 特定构建配置导致 | `dynamic` (运行构建检查) |
| **运行时状态问题** | 只在运行时暴露 | `dynamic` (运行测试/脚本) |
| **文件变更触发** | 某类文件改动后需检查 | `change` + 验证命令 |
| **危险命令** | 需要阻止特定 CLI 命令执行 | `command` (regex 匹配命令) |

**如果你第一反应是写 grep pattern，先停下来问自己：**
- 这个问题真的能用字符串匹配检测到吗？
- 有没有变体会逃过 pattern？
- 是否需要运行时验证才能确认？

#### Q2: 选择检测器类型

```
问题是要阻止某个危险命令吗？
├─ YES → 用 command (regex 匹配，自动拦截)
│
└─ NO  → 问题能用静态代码分析检测吗？
         ├─ YES → 用 rule (grep/lint/AST)
         │
         └─ NO  → 问题需要运行时/环境检查吗？
                  ├─ YES → 用 dynamic (shell 脚本)
                  └─ 问题与文件变更相关？
                     └─ YES → 用 change + must_run
```

> **一个 pitfall = 一个 detector。** 如需多个检查，放在同一个 detector 的 `must_run` 数组中。

**对于 `command` 类型：**
- pattern: 用于匹配命令的正则表达式
- action: `block`（阻止执行）或 `warn`（警告但允许执行）
- message: 可选的自定义提示消息
- 用户在项目目录下运行匹配的命令时会自动触发

#### Q3: 设计检测器细节

**对于 `rule` 类型：**
- pattern 是否太宽泛（误报）或太狭窄（漏报）？
- scope 是否覆盖所有可能出现的位置？
- 是否需要 exclude 排除合法用例？

**对于 `dynamic` 类型：**
- 写一个 shell 命令/脚本，成功 (exit 0) = 正常，失败 (exit 1) = 检测到问题
- 考虑：环境检查、配置验证、依赖检查、类型检查、测试运行

**对于 `change` 类型：**
- when_changed: 哪些文件变更应触发检查？
- must_run: 触发后运行什么验证？

---

### Step 3: Detector Examples (按类型)

#### Example A: 语法/API 误用 → rule

```json
{
  "detect": [
    {
      "kind": "rule",
      "tool": "grep",
      "pattern": "\\.state\\.values\\(\\)",
      "scope": ["src/**/*.tsx", "src/**/*.ts"],
      "exclude": ["**/*.test.*"],
      "strength": "strong"
    }
  ]
}
```

#### Example B: 环境/配置问题 → dynamic

```json
{
  "detect": [
    {
      "kind": "dynamic",
      "must_run": [
        "test -n \"$DATABASE_URL\" || (echo 'DATABASE_URL not set' && exit 1)"
      ],
      "strength": "strong"
    }
  ]
}
```

#### Example C: 依赖版本问题 → dynamic

```json
{
  "detect": [
    {
      "kind": "dynamic",
      "must_run": [
        "node -e \"const pkg = require('./package.json'); if (!pkg.dependencies?.['zod']?.startsWith('^3.')) { console.error('zod must be ^3.x'); process.exit(1); }\""
      ],
      "strength": "strong"
    }
  ]
}
```

#### Example D: 构建配置问题 → dynamic

```json
{
  "detect": [
    {
      "kind": "dynamic",
      "must_run": [
        "grep -q '\"outDir\": \"dist\"' tsconfig.json || (echo 'outDir must be dist' && exit 1)"
      ],
      "strength": "strong"
    }
  ]
}
```

#### Example E: 类型错误模式 → dynamic

```json
{
  "detect": [
    {
      "kind": "dynamic",
      "must_run": [
        "! bun tsc --noEmit 2>&1 | grep -q 'TS2345'"
      ],
      "strength": "strong"
    }
  ]
}
```

#### Example F: 文件变更触发 → change

```json
{
  "detect": [
    {
      "kind": "change",
      "when_changed": ["src/db/schema.ts", "src/db/migrations/**"],
      "must_run": [
        "bun run db:generate --dry-run"
      ],
      "strength": "strong"
    }
  ]
}
```

#### Example G: 多条件检查（单个 dynamic detector）

```json
{
  "detect": [
    {
      "kind": "dynamic",
      "must_run": [
        "test -n \"$DATABASE_URL\"",
        "test -n \"$REDIS_URL\"",
        "node -e \"require('./config.json')\""
      ],
      "strength": "strong"
    }
  ]
}
```

> `must_run` 数组中的命令**全部成功**才算通过，任一失败即触发检测。

#### Example H: 危险命令拦截 → command

```json
{
  "detect": [
    {
      "kind": "command",
      "pattern": "wrangler\\s+d1\\s+(execute|migrations)",
      "action": "block",
      "message": "禁止直接使用 wrangler 操作 D1 数据库，请使用 bun db:* 命令",
      "strength": "strong"
    }
  ]
}
```

#### Example I: 危险命令警告（但不阻止）

```json
{
  "detect": [
    {
      "kind": "command",
      "pattern": "git\\s+push\\s+.*--force",
      "action": "warn",
      "message": "强制推送可能覆盖他人提交，请确认你知道自己在做什么",
      "strength": "strong"
    }
  ]
}
```

> **command detector 特点：**
> - 在用户运行命令时**实时拦截**（需要先运行 `fdd init` 安装 shell hook）
> - `action: block` 阻止命令执行，`action: warn` 只显示警告
> - 自动显示 pitfall 的 remedy 信息

---

### Step 4: Analyze Root Cause (Replay)

> **Replay 是理解问题的关键。必须填写 root_cause。**

```json
{
  "replay": {
    "root_cause": "问题发生的根本原因（必填）",
    "trigger_condition": "什么条件下会触发",
    "affected_scope": ["受影响的模块/文件"]
  }
}
```

**示例：**
```json
{
  "replay": {
    "root_cause": "使用了 Collection.state.values() 而不是 useLiveQuery，导致数据不响应式更新",
    "trigger_condition": "在 React 组件中直接访问 TanStack DB 的 state",
    "affected_scope": ["src/components/**", "src/hooks/**"]
  }
}
```

---

### Step 5: Build Complete JSON

```json
{
  "title": "简短描述性标题",
  "severity": "high",
  "tags": ["category1", "category2"],
  "evidence": {
    "error_snippet": "出了什么问题",
    "diff_summary": "修复改了什么"
  },
  "detect": [
    // 根据问题类型选择合适的检测器，参考上面的示例
  ],
  "replay": {
    "root_cause": "根本原因（必填）",
    "trigger_condition": "触发条件",
    "affected_scope": ["影响范围"]
  },
  "remedy": [
    {
      "level": "low",
      "kind": "transform",
      "action": "如何修复",
      "steps": ["步骤 1", "步骤 2"]
    }
  ],
  "verify": {
    "level": "V0",
    "checks": ["bun test", "bun typecheck"]
  },
  "regression": {
    "repro": ["复现步骤"],
    "expected": "bug 存在时的表现"
  },
  "edge": {
    "negative_case": ["不应触发的类似场景"],
    "expected": "为什么它不同"
  }
}
```

### Step 6: Execute CLI Command

```bash
fdd record --json '<your JSON here>'
```

### Step 7: Verify Output

CLI 返回：
```json
{
  "success": true,
  "id": "PIT-003",
  "path": ".fdd/pitfalls/pit-003-short-title.md",
  "warnings": []
}
```

如果 `success: false`，修复错误后重试。

---

## Field Reference

### severity
`critical` | `high` | `medium` | `low`

### detect[].kind
- `rule` - 静态分析 (grep/lint/AST)，**必须有 pattern**
- `change` - 基于 git 文件变更，**必须有 when_changed**
- `dynamic` - 运行时命令检测，**必须有 must_run**
- `command` - 命令拦截，**必须有 pattern** (regex)，可选 action/message

### detect[].action (仅 command 类型)
- `block` (默认) - 阻止命令执行
- `warn` - 显示警告但允许执行

### detect[].message (仅 command 类型)
自定义提示消息，显示给用户

### detect[].strength
`strong` (可靠) | `weak` (可能有误报，需标记)

### replay
- `root_cause` - 根本原因（**必填**）
- `trigger_condition` - 触发条件（可选）
- `affected_scope` - 影响范围（可选）

### remedy[].level
`low` (安全) | `medium` (中等风险) | `high` (高风险)

### remedy[].kind
`transform` (代码变更) | `read` (文档) | `run` (命令)

> **注意**：remedy 必须有 action、steps 或 doc 之一

### verify.level
- `V0` (test/type/build) - **必须有 checks**
- `V1` (lint/grep) - **必须有 checks**
- `V2` (证据) - checks 可选
- `V3` (自证) - **必须有 fallback.self_proof**

**V3 示例：**
```json
{
  "verify": {
    "level": "V3",
    "fallback": {
      "level": "V3",
      "self_proof": ["已通过代码审查确认修复正确"]
    }
  }
}
```

### Waivers

如果无法提供 regression 或 edge：
```json
{
  "regression": {
    "repro": [],
    "expected": "",
    "waiver": true,
    "waiver_reason": "为什么无法复现"
  }
}
```

---

## Detector Design Checklist

在提交前检查：

- [ ] **问题类型正确识别**：是语法问题还是环境/配置/依赖问题？还是需要阻止某个命令？
- [ ] **检测器类型匹配**：rule/dynamic/change/command 是否适合问题类型？
- [ ] **command 优先考虑**：如果问题是"禁止某个命令"，用 command 而不是 dynamic
- [ ] **dynamic 优先考虑**：如果 pattern 不够可靠，是否应该用 shell 脚本？
- [ ] **多条件合并**：多个检查是否合并到单个 detector 的 `must_run` 中？
- [ ] **strength 标记准确**：弱检测器是否标记为 weak？
- [ ] **command action 选择**：是需要 block 还是 warn？

---

## Why CLI, Not Direct File Write?

| Direct Write | CLI |
|--------------|-----|
| ❌ 手动 ID 生成 | ✅ 自动顺序 ID |
| ❌ 无校验 | ✅ 门禁检查 |
| ❌ 格式错误 | ✅ 正确 YAML frontmatter |
| ❌ 静默失败 | ✅ 明确成功/失败输出 |
