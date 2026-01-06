# FDD CLI

> 让 Claude Code 不再重蹈覆辙

## 为什么需要 FDD？

用 Claude Code 写代码很爽，但这些问题你一定遇到过：

| 痛点 | 具体表现 |
|------|----------|
| AI 重复犯错 | 上周刚告诉它"这个项目用 bun 不用 npm"，今天又 `npm install` 了 |
| AI 乱改文件 | 改着改着把 `.env` 配置覆盖了，或者动了不该动的核心文件 |
| AI 跑错命令 | 用 `rm` 删文件需要交互确认，AI 卡住了；应该用 `rm -f` |
| 知识无法沉淀 | 每次开新 session 都要重新交代背景，踩过的坑没地方记 |

**FDD 解决这些问题**：把踩过的坑（Pit）结构化记录，自动生成 Claude Code hooks，让 AI 不再重蹈覆辙。

---

## 真实场景

### 场景 1：阻止 AI 乱改文件（protect）

**痛点**：AI 经常不小心覆盖了 `.env`、`package.json` 这类关键文件。

**解法**：创建一个 protect 触发器，硬性阻止修改。

```yaml
# .fdd/pits/PIT-001-protect-env.md
trigger:
  - kind: protect
    paths: [".env", ".env.*"]
    permissions:
      create: deny
      update: deny
      delete: deny
    message: "环境变量文件禁止直接修改，请手动编辑"
```

**效果**：AI 尝试写入 `.env` 时会被 hook 拦截，收到提示信息。

---

### 场景 2：拦截/修正命令（command）

**痛点**：
- 项目用 bun，但 AI 习惯跑 `npm install`
- AI 用 `rm` 删文件时需要交互确认，但 AI 无法交互

**解法**：创建 command 触发器，拦截或修正命令。

```yaml
# 场景 A：强制使用 bun
trigger:
  - kind: command
    pattern: "npm (install|i|ci)"
    action: block
    message: "请使用 bun install 代替 npm"

# 场景 B：rm 必须带 -f
trigger:
  - kind: command
    pattern: "rm (?!.*-f)"
    action: warn
    message: "建议使用 rm -f 避免交互确认"
```

**效果**：AI 执行 `npm install` 时被阻止；执行 `rm` 时收到警告。

---

### 场景 3：提醒历史教训（inject-context）

**痛点**：某个文件之前出过严重 bug，但 AI 不知道，可能再次犯错。

**解法**：创建 inject-context 触发器，AI 编辑该文件时自动注入上下文。

```yaml
# .fdd/pits/PIT-003-sql-injection-history.md
trigger:
  - kind: inject-context
    when_touching: ["src/lib/database.ts", "src/lib/query.ts"]
    context: "这些文件曾有 SQL 注入漏洞，修改时必须使用参数化查询"
```

**效果**：AI 第一次编辑这些文件时，会收到历史教训提醒（每 session 一次）。

---

### 场景 4：检测关键变更（change）

**痛点**：数据库 schema 改了，但忘记跑迁移；配置文件改了，但忘记重启服务。

**解法**：创建 change 触发器，检测 git 变更并提醒。

```yaml
trigger:
  - kind: change
    when_changed: ["prisma/schema.prisma"]
    message: "Schema 已变更，记得运行 bunx prisma migrate dev"
```

**效果**：`fdd check` 时如果检测到 schema 变更，会输出提醒。

---

### 场景 5：复用现有工具（external）

**痛点**：项目已经有 husky/biome/eslint 等检查，不想重复配置。

**解法**：创建 external 触发器，引用现有工具。

```yaml
trigger:
  - kind: external
    tool: husky
    ref: .husky/pre-commit
    message: "提交前会运行 pre-commit hook"

  - kind: external
    tool: biome
    ref: biome.json#no-console
    message: "Biome 禁止 console.log"
```

**效果**：FDD 不重复检查，但会记录这些规则的存在，供 AI 参考。

---

## 快速开始

```bash
# 安装
npm install -g fdd-cli

# 初始化（创建 .fdd 目录 + Claude Code hooks）
fdd init

# 记录一个 Pit（让 AI 用 --json 参数生成）
fdd add --json '{
  "title": "使用 bun 而非 npm",
  "origin": "inductive",
  "trigger": [{"kind": "command", "pattern": "npm", "action": "warn", "message": "请用 bun"}]
}'

# 列出所有 Pit
fdd list

# 运行检查
fdd check
```

### 配合 Claude Code 使用

1. 运行 `fdd init` 后，`.claude/hooks/` 会自动生成
2. Claude Code 会自动加载这些 hooks
3. 当你修复一个 bug 后，告诉 Claude："记录这个 Pit"
4. Claude 会自动用 `fdd add --json` 创建记录

---

## 核心概念

### 双 F 模型

```
FDD = Feedforward + Feedback

Feedforward（前馈/演绎）
  时机：开发前
  来源：AI 预判 —— "我知道未来的我可能不知道"
  产出：演绎 Pit

Feedback（反馈/归纳）
  时机：Bug 修复后
  来源：真实错误
  产出：归纳 Pit
```

### Pit 的来源（Origin）

| Origin | 说明 | 检查严格度 |
|--------|------|-----------|
| `deductive` | 演绎 Pit - 预防性的 | 宽松（evidence 可选） |
| `inductive` | 归纳 Pit - 来自真实 bug | 严格（必须有 evidence） |

### Pit 的生命周期（Scope）

| Type | 说明 | 示例 |
|------|------|------|
| `permanent` | 长期有效 | 架构约束、安全规则 |
| `temporary` | 有终止条件 | 版本升级前的 workaround |

### TRAV 协议

每个 Pit 包含四部分：

| 部分 | 说明 | 示例 |
|------|------|------|
| **T**rigger | 如何检测 | `kind: command, pattern: "npm"` |
| **R**eplay | 根因分析 | "团队统一用 bun，npm 会导致 lockfile 冲突" |
| **A**ction | 如何修复 | "改用 bun install" |
| **V**erify | 如何验证 | "检查 package-lock.json 不存在" |

### Gate 检查

创建 Pit 前的质量门禁：

- **归纳 Pit**：必须有 evidence（错误截图/日志）、regression（复现步骤）、edge（边界情况）
- **演绎 Pit**：宽松，上述可选

---

## 命令参考

| 命令 | 说明 |
|------|------|
| `fdd init` | 初始化 .fdd 目录和 Claude Code hooks |
| `fdd add --json '<JSON>'` | 添加 Pit（通常让 AI 生成 JSON） |
| `fdd list` | 列出 Pit（支持 `--origin`/`--scope`/`--archived` 过滤） |
| `fdd check` | 运行触发器检查 |

---

## Claude Code 集成

`fdd init` 会自动生成以下 hooks：

| Hook | 作用 | 对应触发器 |
|------|------|-----------|
| `fdd-protect.cjs` | 阻止修改受保护文件 | `protect` |
| `fdd-guard.cjs` | 拦截危险命令 | `command` |
| `fdd-context.cjs` | 编辑文件时注入上下文 | `inject-context` |
| `fdd-stop.cjs` | 修改文件后提示记录 Pit | - |

这些 hooks 会自动注册到 `.claude/settings.json`，Claude Code 启动时自动加载。

---

## Interview 流程（可选）

在开发新功能前，可以用 Interview 流程做前馈规划：

```
用户：开始 Interview
AI：进入发散阶段，挖掘需求...
    → 收敛阶段，确认取舍...
    → 确认阶段，锁定 SPEC...
    → 纠偏阶段，生成演绎 Pit
```

产出：`.fdd/specs/{feature}/` 目录下的规划文档 + 演绎 Pit。

---

## 触发器类型一览

| Kind | 用途 | Hook |
|------|------|------|
| `protect` | 保护文件不被修改 | PreToolUse |
| `command` | 拦截 shell 命令 | PreToolUse |
| `inject-context` | 编辑前注入上下文 | PreToolUse |
| `change` | 检测 git 变更 | `fdd check` |
| `external` | 复用现有工具 | 仅记录 |

---

## 开发

```bash
bun install
bun dev <command>    # 开发运行
bun test             # 测试
bun lint             # 代码检查
```

## License

MIT
