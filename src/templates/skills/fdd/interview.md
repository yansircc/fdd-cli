# FDD Interview

> 通过 Interview 厘清想法、定义约束、识别 AI 认知盲区。

## 触发场景

1. **新功能开发前** - 用户描述功能需求
2. **AI 发现认知盲区** - 遇到不熟悉的框架/技术
3. **用户主动提醒** - "这个项目有特殊约定..."

## Interview 流程

```
1. 发散阶段 → stories.md, flows.md, context.md
2. 收敛阶段 → constraints.md, unresolved.md
3. 生成索引 → SPEC.md
4. 元认知阶段 → 识别盲区 → 演绎 Pit
```

---

## 阶段 1: 发散

> 帮用户勾勒完整 picture

### D1: 用户故事

- 有哪些角色会使用这个功能？
- 每个角色希望达成什么目标？
- 格式：`作为 X，我希望 Y，以便 Z`

**产出**：`stories.md`

### D2: 流程与场景

- 核心流程是什么？
- 有哪些主要场景？
- 成功的标志是什么？

**产出**：`flows.md`

### D3: 技术背景

- 涉及哪些现有模块？
- 有技术选型偏好吗？
- 有哪些依赖？

**产出**：`context.md`

---

## 阶段 2: 收敛

> 从 picture 提取约束边界

### C1: 约束定义

- 什么情况算失败？
- 边界情况有哪些？
- 性能/资源要求？

### C2: Non-Goals

- 这个版本不做什么？
- 哪些技术方案排除？

### C3: 未决事项（可选）

- 哪些还没想清楚？
- 需要谁来确认？

**产出**：`constraints.md`, `unresolved.md`（可选）

---

## 阶段 3: 生成索引

创建 `SPEC.md`，包含：
- Intent（一句话描述）
- 文档链接
- 相关 Pit 列表（稍后填充）

---

## 阶段 4: 元认知

> 核心阶段：识别 AI 认知盲区

### 筛选标准

**如果这个约束不记录，未来没有当前上下文的 AI 大概率会犯同样的错**

| 信号 | 示例 |
|------|------|
| **知识截止** | 新框架、新 API（训练数据里没有） |
| **反直觉约定** | "用 UTC+8 存储，不是 UTC" |
| **项目特有** | "禁止用 lodash" |
| **经典陷阱** | 时区、浮点、并发 |
| **上下文易失** | "上次决定用方案 A" |

### 流程

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

5. **用户确认后**，生成演绎 Pit

---

## 产出结构

```
.fdd/specs/{feature-name}/
├── SPEC.md              # 索引 + Intent
├── stories.md           # 用户故事
├── flows.md             # 核心流程、场景
├── context.md           # 技术背景
├── constraints.md       # 约束 + Non-Goals
└── unresolved.md        # 未决事项（可选）

.fdd/pits/
└── PIT-xxx.md           # 演绎 Pit（AI 容易犯错的）
```

---

## constraints.md vs Pit

**不是所有约束都生成 Pit**：

```
constraints.md（所有约束）
    │
    ├── P99 < 500ms          → 难以检测，只留在文档
    ├── Token 15 分钟过期     → 可检测，但 AI 不易犯错，不生成 Pit
    ├── 用 day.js 不用 moment → AI 容易犯错 → 生成演绎 Pit ✓
    └── 时区用 UTC+8          → AI 容易犯错 → 生成演绎 Pit ✓
```

---

## 演绎 Pit 示例

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
      "self_proof": ["预防性约束，无法自动验证"]
    }
  }
}
```

---

## 最佳实践

1. **主动识别**：扫描项目时主动发现反直觉的约定
2. **最小化**：只记录真正容易犯错的地方
3. **用户确认**：始终询问用户是否值得记录
4. **触发器选择**：
   - 软提醒 → `ai-context`
   - 硬阻止 → `command`、`rule`、`protect`
