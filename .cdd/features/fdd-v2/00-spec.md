# FDD v2 Specification

> Feedforward & Feedback Driven Development
> 前馈驱动 + 反馈驱动开发

## 1. 核心概念

### 1.1 双 F 模型

```
FDD = Feedforward + Feedback

Feedforward（前馈/演绎）
  来源：AI 元认知 —— "我知道未来的我不知道"
  时机：开发前
  价值：弥补 AI 认知盲区

Feedback（反馈/归纳）
  来源：真实错误
  时机：Bug 修复后
  价值：防止复发
```

### 1.2 统一数据模型

所有约束统一为 **Pit**，通过 `origin` 字段区分来源：

| Origin | 中文 | 来源 | 必填字段 |
|--------|------|------|----------|
| `deductive` | 演绎 | AI 预判 / Interview | 宽松 |
| `inductive` | 归纳 | 真实错误 | 严格 |

### 1.3 生命周期

通过 `scope.type` 区分：

| Type | 中文 | 说明 |
|------|------|------|
| `permanent` | 长期 | 项目级约束，持续有效 |
| `temporary` | 临时 | 阶段性约束，有终止条件 |

---

## 2. 数据结构

### 2.1 完整 Pit 结构

```typescript
interface Pit {
  // === 元信息 ===
  id: string;                    // PIT-001
  title: string;
  severity: Severity;            // critical | high | medium | low
  tags: string[];
  created: string;               // ISO date

  // === 新增字段 ===
  origin: Origin;                // deductive | inductive
  scope: Scope;

  // === TRAV 协议 ===
  trigger: TriggerRule[];        // T - 如何检测
  replay: Replay;                // R - 根因分析
  action: ActionPath[];          // A - 如何修复
  verify: Verify;                // V - 如何验证

  // === Gate 检查（归纳必填，演绎可选）===
  evidence?: Evidence;           // 错误证据
  regression?: Regression;       // 复现步骤
  edge?: Edge;                   // 边界情况

  // === 可选 ===
  related_rule?: string;
  archived?: boolean;            // 归档标记
  archived_at?: string;          // 归档时间
  archived_reason?: string;      // 归档原因
}
```

### 2.2 Origin 类型

```typescript
type Origin = 'deductive' | 'inductive';
```

### 2.3 Scope 结构

```typescript
interface Scope {
  type: 'permanent' | 'temporary';

  // temporary 时的可选字段
  reason?: string;               // 为什么是临时的
  expires?: string;              // ISO date - 日期过期
  branch?: string;               // 分支合并后过期
  milestone?: string;            // 里程碑完成后过期
}
```

### 2.4 字段必填规则

| 字段 | 演绎 Pit | 归纳 Pit |
|------|----------|----------|
| `id`, `title`, `severity` | 必填 | 必填 |
| `origin` | `deductive` | `inductive` |
| `scope` | 必填 | 必填（默认 permanent） |
| `trigger` | 必填（至少 1 个） | 必填（至少 1 个） |
| `replay` | 必填 | 必填 |
| `action` | 必填（至少 1 个） | 必填（至少 1 个） |
| `verify` | 必填 | 必填 |
| `evidence` | 可选 | 必填 |
| `regression` | 可选 | 必填（或 waiver） |
| `edge` | 可选 | 必填（或 waiver） |

---

## 3. CLI 命令变更

### 3.1 fdd add

```bash
# 归纳 Pit（默认，向后兼容）
fdd add --json '{...}'

# 演绎 Pit（新增 --deductive 标志）
fdd add --deductive --json '{...}'
```

演绎模式下，放宽验证：
- `evidence` 可选
- `regression` 可选
- `edge` 可选

### 3.2 fdd list

```bash
# 新增过滤选项
fdd list --origin deductive     # 只看演绎
fdd list --origin inductive     # 只看归纳
fdd list --scope temporary      # 只看临时
fdd list --scope permanent      # 只看长期
fdd list --expired              # 只看已过期
fdd list --archived             # 只看已归档
```

输出增加 Origin 和 Scope 列：

```
┌─────────┬───────────────────┬────────┬───────────┬───────────┐
│ ID      │ Title             │ Origin │ Scope     │ Status    │
├─────────┼───────────────────┼────────┼───────────┼───────────┤
│ PIT-001 │ 用 day.js 处理日期 │ 演绎   │ 长期      │ 生效      │
│ PIT-002 │ 不做 OAuth        │ 演绎   │ 临时      │ 已过期    │
│ PIT-003 │ SQL 注入防护       │ 归纳   │ 长期      │ 生效      │
└─────────┴───────────────────┴────────┴───────────┴───────────┘
```

### 3.3 fdd cleanup（新命令）

```bash
fdd cleanup                     # 交互式清理过期 Pit
fdd cleanup --auto              # 自动归档所有过期 Pit
fdd cleanup --delete            # 自动删除所有过期 Pit
```

交互流程：

```
过期的临时 Pit (2):
┌─────────┬──────────────────┬─────────────────────┐
│ ID      │ Title            │ 过期原因             │
├─────────┼──────────────────┼─────────────────────┤
│ PIT-002 │ 不做 OAuth       │ 日期 2024-03-01     │
│ PIT-005 │ 重构期间允许 any  │ 分支 refactor 已合并│
└─────────┴──────────────────┴─────────────────────┘

操作：
  [A] 全部归档
  [D] 全部删除
  [E] 延期（重新设置过期时间）
  [P] 转为长期
  [S] 逐个确认
  [X] 跳过
```

### 3.4 fdd check

行为变更：
- 过期的临时 Pit 显示警告，不执行检查
- 已归档的 Pit 完全跳过
- 新增 `--include-expired` 选项强制检查过期 Pit

```bash
fdd check                       # 正常检查（跳过过期和归档）
fdd check --include-expired     # 包含过期 Pit
```

### 3.5 fdd archive（新命令）

```bash
fdd archive PIT-001             # 归档指定 Pit
fdd archive PIT-001 --reason "已迁移到新方案"
```

### 3.6 fdd unarchive（新命令）

```bash
fdd unarchive PIT-001           # 恢复归档的 Pit
```

---

## 4. Skill 更新

### 4.1 目录结构

```
src/templates/skills/
└── fdd/
    ├── SKILL.md           # 主入口（更新）
    ├── create.md          # 创建 Pit（更新）
    ├── stop.md            # Stop hook 处理（保持）
    ├── interview.md       # Interview 流程（新增，从 CDD 迁移）
    ├── triggers.md        # 触发器参考（保持）
    ├── gates.md           # Gate 检查（更新）
    └── examples.md        # 示例（更新）
```

### 4.2 SKILL.md 更新

```markdown
# FDD - Feedforward & Feedback Driven Development

> 前馈驱动 + 反馈驱动开发

## 双 F 模型

| | Feedforward（前馈） | Feedback（反馈） |
|--|---------------------|------------------|
| 来源 | AI 元认知 | 真实错误 |
| 时机 | 开发前 | Bug 修复后 |
| Origin | deductive | inductive |

## 使用场景

1. **Interview 场景**（前馈）
   - 新功能开发前
   - AI 识别到自己的认知盲区
   - 用户提醒项目特有约定

2. **Stop Hook 场景**（反馈）
   - Bug 修复后
   - 值得记录的经验教训

## 核心命令

- `fdd add --json '{...}'` - 创建归纳 Pit
- `fdd add --deductive --json '{...}'` - 创建演绎 Pit
- `fdd list` - 查看所有 Pit
- `fdd check` - 运行检测
- `fdd cleanup` - 清理过期 Pit
```

### 4.3 interview.md（新增）

从 CDD 的 interview.md 迁移，调整为产出演绎 Pit。

核心流程：
1. 用户描述功能需求
2. AI 通过访谈识别约束
3. AI 识别自己的认知盲区
4. 询问用户是否创建演绎 Pit
5. 生成 `fdd add --deductive --json '{...}'`

### 4.4 create.md 更新

增加 `origin` 和 `scope` 字段说明：

```markdown
## 新增字段

### origin（必填）

| 值 | 说明 |
|----|------|
| `deductive` | 演绎 Pit - 来自预判 |
| `inductive` | 归纳 Pit - 来自真实错误 |

### scope（必填）

```json
{
  "scope": {
    "type": "permanent"
  }
}

// 或

{
  "scope": {
    "type": "temporary",
    "reason": "v1.0 scope 限制",
    "expires": "2024-03-01"
  }
}
```
```

### 4.5 gates.md 更新

增加演绎 Pit 的宽松规则：

```markdown
## 演绎 Pit 的 Gate 检查

演绎 Pit（origin: deductive）的 Gate 检查更宽松：

| Gate | 归纳 Pit | 演绎 Pit |
|------|----------|----------|
| Evidence | 必填 | 可选 |
| Regression | 必填或 waiver | 可选 |
| Edge | 必填或 waiver | 可选 |
| Trigger | 必填 | 必填 |
| Verify | 必填 | 必填 |
```

---

## 5. 文件结构变更

### 5.1 .fdd 目录

```
.fdd/
├── config.yaml              # 配置（保持）
├── pits/                    # 所有 Pit（保持）
│   ├── PIT-001-dayjs.md
│   ├── PIT-002-no-oauth.md  # archived: true
│   └── PIT-003-sql-injection.md
└── rules/                   # 规则（保持）
```

**注意**：不再需要单独的 `archive/` 目录，归档状态通过字段标记。

### 5.2 Pit 文件格式

```yaml
---
id: PIT-002
title: 本版本不做 OAuth
origin: deductive
severity: medium
tags: [non-goal, auth]
created: 2024-01-15T10:00:00Z
scope:
  type: temporary
  reason: "v1.0 scope 限制"
  expires: 2024-03-01
archived: true
archived_at: 2024-03-02T10:00:00Z
archived_reason: "已过期，v2.0 已支持 OAuth"
---

## Trigger

...
```

---

## 6. 实现计划

### Phase 1: 数据结构（必须先做）

1. 更新 `src/types/index.ts`
   - 添加 `Origin` 类型
   - 添加 `Scope` 接口
   - 更新 `Pitfall` 接口
   - 添加归档相关字段

2. 更新 `src/lib/schema.ts`
   - 添加 `OriginSchema`
   - 添加 `ScopeSchema`
   - 更新 `PitfallInputSchema`
   - 实现演绎/归纳的差异化验证

### Phase 2: 核心命令

3. 更新 `src/commands/add/`
   - 支持 `--deductive` 标志
   - 实现差异化 Gate 检查

4. 更新 `src/commands/list.ts`
   - 支持 `--origin`, `--scope`, `--expired`, `--archived` 过滤
   - 更新输出格式

5. 更新 `src/commands/check.ts`
   - 实现过期检测逻辑
   - 支持 `--include-expired`

### Phase 3: 新命令

6. 新增 `src/commands/cleanup.ts`
   - 交互式清理流程
   - `--auto`, `--delete` 选项

7. 新增 `src/commands/archive.ts`
   - 归档和恢复逻辑

### Phase 4: Skill 更新

8. 更新 `src/templates/skills/fdd/`
   - 更新 SKILL.md
   - 新增 interview.md
   - 更新 create.md, gates.md, examples.md

9. 删除 `src/templates/skills/cdd/`（迁移完成后）

### Phase 5: 测试和文档

10. 更新测试
    - schema 测试
    - gate 测试
    - 新命令测试

11. 更新文档
    - README.md
    - .claude/rules/*.md

---

## 7. 向后兼容

### 7.1 现有 Pit 迁移

现有的 Pit 文件没有 `origin` 和 `scope` 字段，需要处理：

```typescript
// 读取时的默认值
const pit = {
  ...rawPit,
  origin: rawPit.origin ?? 'inductive',  // 默认归纳
  scope: rawPit.scope ?? { type: 'permanent' },  // 默认长期
};
```

### 7.2 CLI 兼容

- `fdd add --json` 不带 `--deductive` 时，默认 `origin: inductive`
- 所有现有命令保持原有行为

---

## 8. 前馈 Pit 的最佳实践

### 8.1 什么时候创建前馈 Pit？

| 信号 | 示例 |
|------|------|
| AI 知识截止 | 新框架、新 API |
| 反直觉约定 | "用 UTC+8 存储，不是 UTC" |
| 项目特有 | "禁止用 lodash" |
| 经典陷阱 | 时区、浮点、并发 |

### 8.2 前馈 Pit 的 action 怎么写？

既然 action 必填，演绎 Pit 的 action 应该描述"正确做法"：

```json
{
  "action": [{
    "level": "low",
    "kind": "read",
    "doc": "参考 https://day.js.org/docs/en/parse/string-format"
  }]
}
```

或者描述"如何避免"：

```json
{
  "action": [{
    "level": "low",
    "kind": "transform",
    "steps": [
      "使用 dayjs() 而不是 moment()",
      "日期格式统一用 YYYY/MM/DD"
    ]
  }]
}
```

---

## 9. 验收标准

- [ ] `fdd add --deductive` 可以创建演绎 Pit
- [ ] 演绎 Pit 不要求 evidence/regression/edge
- [ ] `fdd list` 可以按 origin/scope 过滤
- [ ] `fdd check` 自动跳过过期和归档的 Pit
- [ ] `fdd cleanup` 可以交互式清理过期 Pit
- [ ] 现有 Pit 可以正常读取（向后兼容）
- [ ] Skill 文档更新完成
