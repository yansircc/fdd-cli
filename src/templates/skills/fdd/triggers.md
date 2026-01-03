# 触发器类型

FDD 支持 6 种触发器，用于检测和预防问题。

## rule - 静态代码匹配

使用 grep 进行模式匹配，检测代码反模式。

```json
{
  "kind": "rule",
  "tool": "grep",
  "pattern": "console\\.log",
  "scope": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts"],
  "strength": "strong"
}
```

**适用场景**：
- 检测已知的反模式
- 查找被禁用的 API 调用
- 发现硬编码的敏感信息

## change - Git 文件变更

监控特定文件的变更，触发验证检查。

```json
{
  "kind": "change",
  "when_changed": ["prisma/schema.prisma", "src/db/**"],
  "must_run": ["bun db:generate --dry-run"],
  "strength": "strong"
}
```

**适用场景**：
- Schema 变更后验证迁移
- 配置文件变更后重新检查
- 依赖更新后运行测试

## dynamic - 运行时检查

执行 shell 命令进行动态验证。

```json
{
  "kind": "dynamic",
  "must_run": [
    "test -n \"$DATABASE_URL\"",
    "bun typecheck"
  ],
  "strength": "strong"
}
```

**适用场景**：
- 环境变量检查
- 类型检查
- 运行时依赖验证

## command - 命令拦截

拦截危险的 shell 命令。

```json
{
  "kind": "command",
  "pattern": "rm\\s+-rf\\s+/",
  "action": "block",
  "message": "禁止删除根目录！",
  "strength": "strong"
}
```

**action 选项**：
- `block` — 阻止执行
- `warn` — 警告但允许执行

**适用场景**：
- 阻止危险的数据库操作
- 防止误删重要文件
- 拦截生产环境敏感命令

## protect - 文件保护

保护文件不被 AI 直接修改。

```json
{
  "kind": "protect",
  "paths": [".fdd/pitfalls/**", "config/production.yaml"],
  "exclude": ["*.bak"],
  "permissions": {
    "create": "deny",
    "update": "deny",
    "delete": "deny"
  },
  "message": "请使用 fdd add --json 创建 pitfall",
  "strength": "strong"
}
```

**permissions 选项**：
- `create` — 创建新文件
- `update` — 修改现有文件
- `delete` — 删除文件

值：`allow` 或 `deny`

**适用场景**：
- 保护 pitfall 文件
- 保护生产配置
- 防止意外覆盖

## ai-context - AI 上下文注入

当 AI 修改特定文件时，自动注入历史经验。

```json
{
  "kind": "ai-context",
  "when_touching": ["src/lib/database.ts", "src/db/**"],
  "context": "此区域曾发生 SQL 注入问题。修改时请使用 parameterized queries，不要拼接 SQL 字符串。",
  "strength": "strong"
}
```

**适用场景**：
- 提醒历史安全问题
- 注入架构约束
- 传递团队经验

## strength 说明

- `strong` — 可靠的程序化检测
- `weak` — 仅基于字符串匹配，可能误报

弱触发器应标记 TODO，说明如何升级为强触发器。
