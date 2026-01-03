# FDD v2 Handoff

> 2026-01-04 | Claude Opus 4.5

## 背景

用户希望将两套独立的 skill（CDD 和 FDD）统一成一个框架。经过哲学层面的探讨，确定了以下核心洞察：

1. **双 F 模型**：FDD = Feedforward + Feedback
   - Feedforward（前馈/演绎）：AI 预判自己的认知盲区
   - Feedback（反馈/归纳）：从真实错误中学习

2. **演绎约束的价值**：不是所有约束都值得提前设计，只有 AI 认定"未来的我大概率会犯错"的地方才值得

3. **长期 vs 临时**：Pit 有生命周期，临时 Pit 有过期条件

## 完成的工作

### 数据结构

- `Origin`: `deductive` | `inductive`
- `Scope`: `{ type: permanent | temporary, expires?, branch?, milestone? }`
- 归档字段：`archived`, `archived_at`, `archived_reason`

### Schema 验证

使用 Zod discriminatedUnion 实现差异化验证：
- 归纳 Pit：evidence/regression/edge 必填
- 演绎 Pit：evidence/regression/edge 可选

### Gate 检查

演绎 Pit 跳过 Gate 1-3，保留 Gate 4-8。

### CLI 命令

- `fdd list --origin deductive|inductive`
- `fdd list --scope permanent|temporary`
- `fdd list --archived`
- `fdd check` 自动跳过过期和归档的 Pit

### Skill 文档

- 更新 SKILL.md, create.md, gates.md, examples.md
- 新增 interview.md（从 CDD 迁移）
- 删除 cdd/ 目录

## 未完成 / 待观察

1. **ai-context 触发器效果有限**：用户反馈注入 context 的方法均未奏效，需等待 Claude hooks 升级

2. **分支/里程碑过期检测**：目前只实现了日期过期检测，branch/milestone 需要 git 集成

3. **cleanup/archive 命令**：用户决定不需要，agent 可以直接修改文件

## 关键决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 品牌名 | FDD | Feedforward + Feedback 双 F |
| action 字段 | 保持必填 | 用户选择 |
| Interview 流程 | 保持 Skill | 不做成 CLI 命令 |
| 归档位置 | 字段标记 | `archived: true`，不单独目录 |
| 向后兼容 | 不需要 | 用户明确说是本地测试玩具 |

## 测试状态

```
239 pass, 0 fail
```

## 文件变更清单

```
Modified:
  src/types/index.ts
  src/lib/schema.ts
  src/lib/gate.ts
  src/lib/pitfall.ts
  src/commands/list.ts
  src/commands/check.ts
  src/index.ts
  src/__tests__/schema.test.ts
  src/__tests__/gate.test.ts
  src/__tests__/pitfall.test.ts
  src/templates/skills/fdd/SKILL.md
  src/templates/skills/fdd/create.md
  src/templates/skills/fdd/gates.md
  src/templates/skills/fdd/examples.md

Added:
  src/templates/skills/fdd/interview.md
  .cdd/features/fdd-v2/00-spec.md
  .cdd/features/fdd-v2/HANDOFF.md

Deleted:
  src/templates/skills/cdd/
```

## 后续建议

1. 运行 `bun build` 构建
2. 实际测试创建演绎 Pit
3. 观察 ai-context 触发器的实际效果
4. 考虑是否需要添加演绎 Pit 的自动识别逻辑
