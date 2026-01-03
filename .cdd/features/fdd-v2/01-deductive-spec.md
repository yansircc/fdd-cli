# 演绎约束完整设计

> 补充 00-spec.md，定义演绎约束的文档产出和 Interview 流程

## 1. 核心理念

### 演绎约束的价值

**AI 的元认知** = "知道自己不知道什么"

Pit 的筛选标准：

> **如果这个约束不记录，未来没有当前上下文的 AI 大概率会犯同样的错**

| 信号 | 示例 | 为什么容易犯错 |
|------|------|---------------|
| 知识截止 | 新框架、新 API | 训练数据里没有或很少 |
| 反直觉约定 | "用 UTC+8 存储" | 与主流做法相反 |
| 项目特有 | "禁止用 lodash" | AI 不可能提前知道 |
| 经典陷阱 | 时区、浮点、并发 | AI 知道原理但实操容易忘 |
| 上下文易失 | "上次决定用方案 A" | 对话重启后会忘记 |

### constraints.md vs Pit 的关系

```
constraints.md（所有约束）
    │
    ├── P99 < 500ms          → 难以检测，只留在文档
    ├── Token 15 分钟过期     → 可以检测，但 AI 不容易犯错，不生成 Pit
    ├── 用 day.js 不用 moment → AI 容易犯错 → 生成演绎 Pit ✓
    └── 时区用 UTC+8          → AI 容易犯错 → 生成演绎 Pit ✓
```

---

## 2. 目录结构

```
.fdd/
├── specs/                       # 规划文档
│   └── {feature-name}/
│       ├── SPEC.md              # 索引 + Intent（入口）
│       ├── stories.md           # 用户故事
│       ├── flows.md             # 核心流程、场景
│       ├── context.md           # 技术背景、选型
│       ├── constraints.md       # 约束 + Non-Goals
│       └── unresolved.md        # 未决事项（可选）
├── pits/
│   └── PIT-xxx.md
└── config.yaml
```

---

## 3. 文档模板

### SPEC.md（索引）

```markdown
# SPEC — {feature}

## Intent

当 X 发生时，系统必须 Y，且 Z 不能发生。

## 文档

| 文件 | 说明 |
|------|------|
| [stories.md](stories.md) | 用户故事 |
| [flows.md](flows.md) | 核心流程、主要场景 |
| [context.md](context.md) | 技术背景、选型约束 |
| [constraints.md](constraints.md) | 约束、Non-Goals |
| [unresolved.md](unresolved.md) | 未决事项 |

## 相关 Pit

- PIT-xxx: ...
```

### stories.md

```markdown
# Stories — {feature}

## 角色 1: {role}

- 作为 {role}，我希望 {goal}，以便 {benefit}
- 作为 {role}，我希望 {goal}，以便 {benefit}

## 角色 2: {role}

- 作为 {role}，我希望 {goal}，以便 {benefit}
```

### flows.md

```markdown
# Flows — {feature}

## 核心流程

1. 用户 {action}
2. 系统 {response}
3. 结果 {outcome}

## 场景

### 场景 A: {name}

- 前置条件：...
- 步骤：...
- 预期结果：...

### 场景 B: {name}

- 前置条件：...
- 步骤：...
- 预期结果：...
```

### context.md

```markdown
# Context — {feature}

## 技术背景

- 涉及模块：...
- 现有实现：...

## 技术选型

- 使用 {library} 因为 {reason}
- 不使用 {library} 因为 {reason}

## 依赖

- {dependency}: {version}
```

### constraints.md

```markdown
# Constraints — {feature}

## 约束

- {constraint-1}
- {constraint-2}
- {constraint-3}

## Non-Goals

- 本版本不做 {feature}
- 本版本不做 {feature}
```

### unresolved.md（可选）

```markdown
# Unresolved — {feature}

## 待决事项

1. {question}（待 {owner} 确认）
2. {question}（待 {owner} 确认）

## 状态

- [ ] 解决 #1
- [ ] 解决 #2
```

---

## 4. Interview 流程

```
Interview
    │
    ├── 1. 发散阶段
    │   ├── 用户故事 → stories.md
    │   ├── 流程场景 → flows.md
    │   └── 技术背景 → context.md
    │
    ├── 2. 收敛阶段
    │   ├── 约束定义 → constraints.md
    │   ├── Non-Goals → constraints.md
    │   └── 未决事项 → unresolved.md（可选）
    │
    ├── 3. 生成索引 → SPEC.md
    │
    └── 4. 元认知阶段
        ├── AI 扫描项目 + 约束
        ├── 识别认知盲区
        ├── 与用户商量：哪些值得记录 Pit
        └── 生成演绎 Pit
```

### 元认知阶段详细流程

AI 应该主动识别：

1. **扫描项目**：查看 package.json、配置文件、现有代码
2. **对比认知**：哪些和 AI 的默认认知不同
3. **评估风险**：哪些地方 AI 容易犯错
4. **提示用户**：

```
我注意到以下可能会犯错的地方：

1. 项目使用 day.js（我更熟悉 moment）
2. 时间存储为 UTC+8（通常是 UTC）
3. 日期格式是 YYYY/MM/DD

这些我未来大概率会犯错。要创建预防性 Pit 吗？

[ ] 1. day.js
[ ] 2. UTC+8
[ ] 3. 日期格式
[ ] 全部
[ ] 跳过
```

---

## 5. 实现计划

### Phase 1: 模板文件

1. 创建 `src/templates/specs/` 目录
2. 添加模板文件：
   - `SPEC.md`
   - `stories.md`
   - `flows.md`
   - `context.md`
   - `constraints.md`
   - `unresolved.md`

### Phase 2: Skill 更新

1. 更新 `src/templates/skills/fdd/interview.md`
   - 完整的 Interview 流程
   - 元认知阶段说明
   - 文档产出说明

2. 更新 `src/templates/skills/fdd/SKILL.md`
   - 添加 specs 目录说明
   - 更新使用场景

### Phase 3: 构建

1. 运行 `bun build` 复制模板
2. 测试完整流程
