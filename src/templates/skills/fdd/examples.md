# Pitfall 示例

## 示例 1: SQL 注入防护 (rule)

```json
{
  "title": "SQL 注入：禁止字符串拼接 SQL",
  "severity": "critical",
  "tags": ["security", "database"],
  "evidence": {
    "error_snippet": "SQL injection vulnerability detected",
    "diff_summary": "Changed string concatenation to parameterized query"
  },
  "trigger": [{
    "kind": "rule",
    "tool": "grep",
    "pattern": "\\$\\{.*\\}.*(?:SELECT|INSERT|UPDATE|DELETE)",
    "scope": ["src/db/**/*.ts"],
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "Developer used template literals to build SQL queries, allowing user input to be executed as SQL"
  },
  "action": [{
    "level": "high",
    "kind": "transform",
    "action": "Use parameterized queries",
    "steps": [
      "Replace template literal with placeholder",
      "Pass values as second argument to query()"
    ]
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

## 示例 2: Schema 变更检测 (change)

```json
{
  "title": "Schema 变更需要运行迁移",
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

## 示例 3: 危险命令拦截 (command)

```json
{
  "title": "禁止直接操作生产数据库",
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
    "steps": ["Use bun db:prod:query instead", "Confirm before execution"]
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

## 示例 4: AI 上下文注入 (ai-context)

```json
{
  "title": "认证模块历史问题提醒",
  "severity": "medium",
  "tags": ["security", "auth"],
  "evidence": {
    "error_snippet": "JWT token was not validated properly",
    "diff_summary": "Added token expiry check"
  },
  "trigger": [{
    "kind": "ai-context",
    "when_touching": ["src/lib/auth/**", "src/middleware/auth.ts"],
    "context": "此区域曾发生 JWT 验证问题。修改时请确保：1) 验证 token 签名 2) 检查 token 过期 3) 验证 issuer 和 audience",
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "JWT validation was incomplete, allowing expired tokens"
  },
  "action": [{
    "level": "medium",
    "kind": "read",
    "action": "Review JWT validation checklist",
    "steps": ["Check signature", "Check expiry", "Check issuer/audience"]
  }],
  "verify": {
    "level": "V0",
    "checks": ["bun test:auth"]
  },
  "regression": {
    "repro": ["Use expired JWT token", "Access protected route"],
    "expected": "Should return 401 Unauthorized"
  },
  "edge": {
    "negative_case": ["Valid token with correct claims"],
    "expected": "Should pass validation"
  }
}
```

## 示例 5: 文件保护 (protect)

```json
{
  "title": "保护 pitfall 文件不被直接编辑",
  "severity": "low",
  "tags": ["fdd", "protection"],
  "evidence": {
    "error_snippet": "Pitfall file was corrupted by direct edit",
    "diff_summary": "N/A"
  },
  "trigger": [{
    "kind": "protect",
    "paths": [".fdd/pitfalls/**"],
    "exclude": ["*.bak"],
    "permissions": {
      "create": "deny",
      "update": "deny",
      "delete": "deny"
    },
    "message": "请使用 fdd add --json 创建 pitfall，不要直接编辑文件",
    "strength": "strong"
  }],
  "replay": {
    "root_cause": "AI directly edited pitfall file, breaking YAML frontmatter format"
  },
  "action": [{
    "level": "low",
    "kind": "transform",
    "action": "Use CLI instead of direct file edit",
    "steps": ["Run fdd add --json '{...}'"]
  }],
  "verify": {
    "level": "V1",
    "checks": ["Attempt to edit should be blocked by protect hook"]
  },
  "regression": {
    "repro": ["Try to Write to .fdd/pitfalls/xxx.md"],
    "expected": "Should be blocked by protect hook"
  },
  "edge": {
    "negative_case": ["Editing .fdd/config.yaml"],
    "expected": "Config file is not protected"
  }
}
```
