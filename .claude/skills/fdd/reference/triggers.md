# 触发器类型

FDD 支持 6 种触发器。

## rule - 静态代码匹配

```json
{
  "kind": "rule",
  "pattern": "console\\.log",
  "scope": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts"],
  "strength": "strong"
}
```

**适用**：检测反模式、禁用 API、硬编码敏感信息

## change - Git 文件变更

```json
{
  "kind": "change",
  "when_changed": ["db/schema.*", "migrations/**"],
  "must_run": ["npm run db:generate"],
  "strength": "strong"
}
```

**适用**：Schema 变更验证、配置变更检查、依赖更新测试

## dynamic - 运行时检查

```json
{
  "kind": "dynamic",
  "must_run": ["test -n \"$DATABASE_URL\"", "npm run typecheck"],
  "strength": "strong"
}
```

**适用**：环境变量检查、类型检查、运行时依赖验证

## command - 命令拦截

```json
{
  "kind": "command",
  "pattern": "rm\\s+-rf\\s+/",
  "action": "block",
  "message": "Dangerous command blocked",
  "strength": "strong"
}
```

**action**：`block`（阻止）| `warn`（警告）

**适用**：阻止危险操作、防止误删、拦截生产敏感命令

## protect - 文件保护

```json
{
  "kind": "protect",
  "paths": ["config/prod.*", ".env.production"],
  "permissions": {"create": "deny", "update": "deny", "delete": "deny"},
  "message": "Protected file",
  "strength": "strong"
}
```

**permissions**：`create` | `update` | `delete`，值：`allow` | `deny`

**适用**：保护 Pit 文件、生产配置、关键文件

## ai-context - AI 上下文注入

```json
{
  "kind": "ai-context",
  "when_touching": ["src/db/**", "src/auth/**"],
  "context": "This area had security issues. Use parameterized queries.",
  "strength": "strong"
}
```

**适用**：提醒历史问题、注入架构约束、传递团队经验

## strength

- `strong`：可靠的程序化检测
- `weak`：仅字符串匹配，可能误报

弱触发器应标记 TODO 说明如何升级。
