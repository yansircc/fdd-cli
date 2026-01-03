# Pitfall 示例

## 归纳 Pit（来自真实错误）

### 示例 1: SQL 注入防护 (rule)

```json
{
  "title": "SQL 注入：禁止字符串拼接 SQL",
  "origin": "inductive",
  "scope": {"type": "permanent"},
  "severity": "critical",
  "tags": ["security", "database"],
  "evidence": {
    "error_snippet": "SQL injection vulnerability detected",
    "diff_summary": "Changed string concatenation to parameterized query"
  },
  "trigger": [{
    "kind": "rule",
    "pattern": "\\$\\{.*\\}.*(?:SELECT|INSERT|UPDATE|DELETE)",
    "scope": ["src/db/**/*.ts"],
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "Developer used template literals to build SQL queries"
  },
  "action": [{
    "level": "high",
    "kind": "transform",
    "action": "Use parameterized queries",
    "steps": ["Replace template literal with placeholder", "Pass values as second argument"]
  }],
  "verify": {
    "level": "V0",
    "checks": ["bun test:security"]
  },
  "regression": {
    "repro": ["Input: '; DROP TABLE users; --", "Execute query"],
    "expected": "Query should use parameterized input"
  },
  "edge": {
    "negative_case": ["Hardcoded SQL without variables"],
    "expected": "Static SQL is safe"
  }
}
```

### 示例 2: Schema 变更检测 (change)

```json
{
  "title": "Schema 变更需要运行迁移",
  "origin": "inductive",
  "scope": {"type": "permanent"},
  "severity": "high",
  "tags": ["database", "migration"],
  "evidence": {
    "error_snippet": "Column 'email' does not exist",
    "command": "bun db:push"
  },
  "trigger": [{
    "kind": "change",
    "when_changed": ["prisma/schema.prisma"],
    "must_run": ["bun db:generate", "bun db:migrate"],
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "Schema was modified but migration was not generated"
  },
  "action": [{
    "level": "medium",
    "kind": "run",
    "action": "Generate and apply migration",
    "steps": ["bun db:generate", "bun db:migrate"]
  }],
  "verify": {
    "level": "V0",
    "checks": ["bun db:push --dry-run"]
  },
  "regression": {
    "repro": ["Modify schema.prisma", "Run app without migration"],
    "expected": "Should fail with column not found"
  },
  "edge": {
    "negative_case": ["Adding comments to schema"],
    "expected": "Comments don't require migration"
  }
}
```

### 示例 3: 危险命令拦截 (command)

```json
{
  "title": "禁止直接操作生产数据库",
  "origin": "inductive",
  "scope": {"type": "permanent"},
  "severity": "critical",
  "tags": ["safety", "database"],
  "evidence": {
    "error_snippet": "Accidentally deleted production data",
    "command": "wrangler d1 execute prod-db --command='DELETE FROM users'"
  },
  "trigger": [{
    "kind": "command",
    "pattern": "wrangler\\s+d1\\s+execute\\s+prod",
    "action": "block",
    "message": "禁止直接操作生产数据库！使用 bun db:prod:* 命令",
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "Developer executed raw SQL on production without safety checks"
  },
  "action": [{
    "level": "low",
    "kind": "transform",
    "action": "Use wrapped commands with confirmation",
    "steps": ["Use bun db:prod:query instead"]
  }],
  "verify": {
    "level": "V1",
    "checks": ["Command should be blocked by guard"]
  },
  "regression": {
    "repro": ["Run: wrangler d1 execute prod-db"],
    "expected": "Command should be blocked"
  },
  "edge": {
    "negative_case": ["wrangler d1 execute dev-db"],
    "expected": "Dev database operations are allowed"
  }
}
```

---

## 演绎 Pit（预防性约束）

### 示例 4: 技术栈约定 (ai-context)

```json
{
  "title": "使用 day.js 处理日期",
  "origin": "deductive",
  "scope": {"type": "permanent"},
  "severity": "medium",
  "tags": ["convention", "date"],
  "trigger": [{
    "kind": "ai-context",
    "when_touching": ["src/**/*.ts"],
    "context": "本项目使用 day.js 处理日期，不是 moment。格式统一用 YYYY/MM/DD。",
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "AI 预判：对 day.js API 不够熟悉"
  },
  "action": [{
    "level": "low",
    "kind": "read",
    "doc": "https://day.js.org/docs/en/parse/string-format"
  }],
  "verify": {
    "level": "V3",
    "fallback": {
      "level": "V3",
      "self_proof": ["预防性约束，基于项目约定"]
    }
  }
}
```

### 示例 5: Non-Goal 阻止 (command)

```json
{
  "title": "v1.0 不做 OAuth",
  "origin": "deductive",
  "scope": {
    "type": "temporary",
    "reason": "产品决策：v1.0 scope 限制",
    "milestone": "v2.0"
  },
  "severity": "medium",
  "tags": ["non-goal", "auth"],
  "trigger": [{
    "kind": "command",
    "pattern": "npm install.*(passport|oauth|@auth)",
    "action": "block",
    "message": "Non-Goal: 本版本不做 OAuth，请等待 v2.0",
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "预防性约束：产品决策"
  },
  "action": [{
    "level": "low",
    "kind": "read",
    "doc": "等待 v2.0 规划，届时重新评估"
  }],
  "verify": {
    "level": "V3",
    "fallback": {
      "level": "V3",
      "self_proof": ["产品决策，非技术约束"]
    }
  }
}
```

### 示例 6: 反直觉约定 (ai-context)

```json
{
  "title": "时区存储为 UTC+8",
  "origin": "deductive",
  "scope": {"type": "permanent"},
  "severity": "high",
  "tags": ["convention", "timezone"],
  "trigger": [{
    "kind": "ai-context",
    "when_touching": ["src/**/*.ts"],
    "context": "所有时间存储为 UTC+8（北京时间），显示时不需转换。new Date() 返回的是本地时间，直接存储即可。",
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "AI 预判：通常项目用 UTC 存储，但本项目用 UTC+8"
  },
  "action": [{
    "level": "low",
    "kind": "transform",
    "steps": [
      "存储时直接使用 new Date()",
      "不要调用 .toISOString()（会转为 UTC）",
      "显示时不需要时区转换"
    ]
  }],
  "verify": {
    "level": "V3",
    "fallback": {
      "level": "V3",
      "self_proof": ["项目约定，与主流做法不同"]
    }
  }
}
```

### 示例 7: 禁止使用特定库 (rule)

```json
{
  "title": "禁止使用 lodash",
  "origin": "deductive",
  "scope": {"type": "permanent"},
  "severity": "low",
  "tags": ["convention", "dependency"],
  "trigger": [{
    "kind": "rule",
    "pattern": "from ['\"]lodash",
    "scope": ["src/**/*.ts"],
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "项目约定：使用原生方法或 es-toolkit"
  },
  "action": [{
    "level": "low",
    "kind": "transform",
    "steps": [
      "使用原生 Array/Object 方法",
      "如需工具函数，使用 es-toolkit"
    ]
  }],
  "verify": {
    "level": "V1",
    "checks": ["bun lint"]
  }
}
```

### 示例 8: 文件保护 (protect)

```json
{
  "title": "保护配置文件",
  "origin": "deductive",
  "scope": {"type": "permanent"},
  "severity": "medium",
  "tags": ["protection", "config"],
  "trigger": [{
    "kind": "protect",
    "paths": [".env.production", "wrangler.toml"],
    "permissions": {
      "create": "allow",
      "update": "deny",
      "delete": "deny"
    },
    "message": "生产配置文件不应被 AI 修改，请人工操作",
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "预防性约束：保护敏感配置"
  },
  "action": [{
    "level": "low",
    "kind": "read",
    "doc": "生产配置变更需要人工审核"
  }],
  "verify": {
    "level": "V3",
    "fallback": {
      "level": "V3",
      "self_proof": ["安全约束，保护敏感文件"]
    }
  }
}
```
