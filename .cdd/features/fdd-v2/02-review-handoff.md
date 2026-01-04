# FDD v2.1 - 评审机制 Handoff

> 2026-01-04 | 交接给下一个 Agent

## 背景

FDD Interview 流程产出的文档总是有缺憾，核心原因是**缺乏评审环节**。

### 核心洞察

**subagent 没有 context = 新人视角 = 天然的挑刺者**

- 写文档的人"当局者迷"
- subagent 只看最终产出，不被之前讨论带偏
- 这正是 code review 的价值所在

## 需求

### 1. 在 Interview 流程中加入评审阶段

```
阶段 1: 发散 → stories.md, flows.md
阶段 2: 收敛 → context.md, constraints.md
阶段 3: 确认 → SPEC.md
阶段 4: 评审 → subagent 挑刺（可选，可多轮）  ← 新增
阶段 5: 元认知 → 演绎 Pit
```

### 2. 评审的触发

- 文档生成后，用 AskUserQuestionTool 询问用户
- 选项：[评审] / [跳过]
- 用户可选择多轮评审

### 3. 评审的执行

- 使用 Task tool 启动 subagent（类型待定，可能是 general-purpose）
- subagent 读取生成的 spec 文档
- subagent 按评审标准挑刺
- 返回问题列表

### 4. 多轮迭代

- 根据评审结果修复文档
- 再次询问是否需要评审
- 循环直到用户满意

## 设计约束

### 必须遵守

1. **通用可复用**：评审标准不能专项专用，必须是泛用逻辑
2. **精简原则**：不损失信息的前提下最小化 token
3. **用户控制**：评审是可选的，用户决定是否开启、几轮

### 评审标准的设计思路

不要写"检查是否有数据结构定义"这种具体的检查项。

要写的是**元原则**：
- "文档应该描述'做什么'，不描述'怎么实现'"
- "信息不应该在多处重复"
- "数字需要有依据或标注为目标"

让 subagent 自己判断什么违反了这些原则。

## 需要修改的文件

### 1. `src/templates/skills/fdd/interview.md`

- 加入阶段 4: 评审
- 描述评审的触发条件和流程
- 说明如何使用 Task tool 启动 subagent

### 2. 新建 `src/templates/skills/fdd/review.md`（或嵌入 interview.md）

评审标准，核心原则：

```
## 评审原则

1. **分离关注点**
   - 文档描述"做什么"，不描述"怎么实现"
   - 发现任何实现细节，指出

2. **信息唯一性**
   - 同一信息不应在多处重复
   - 发现重复，指出

3. **完整性**
   - 技术决策必须已确认，不能有"待定"
   - 发现未确认项，指出

4. **可验证性**
   - 数字需有依据或标注为"目标"
   - 发现凭空数字，指出

5. **精简性**
   - 不使用占用大量 token 的格式（图表等）
   - 发现冗余，指出
```

### 3. 构建和测试

- 运行 `bun build`
- 测试完整的 Interview + 评审流程

## 之前对话中确认的其他问题

这次对话还修复了以下问题（已完成）：

| 问题 | 状态 |
|------|------|
| Mermaid 图表占用 token | ✅ 已在模板中禁止 |
| SPEC.md 和 context.md 重复 | ✅ 已更新模板 |
| 数据模型过早定义 | ✅ 已在禁止项中说明 |
| 设计决策放错位置 | ✅ 已移到 context.md |
| 元认知标准不精准 | ✅ 已更新为"反常识+易遗忘" |

## 相关文件位置

```
src/templates/
├── specs/                    # spec 文档模板（已更新）
│   ├── SPEC.md
│   ├── stories.md
│   ├── flows.md
│   ├── context.md
│   ├── constraints.md
│   └── unresolved.md
└── skills/fdd/
    ├── SKILL.md              # 主入口
    ├── interview.md          # Interview 流程（需更新）
    ├── create.md             # 创建 Pit
    ├── gates.md              # Gate 检查
    └── examples.md           # 示例
```

## 验收标准

- [ ] interview.md 包含评审阶段的完整说明
- [ ] 评审标准是通用的元原则，不是具体检查项
- [ ] 用户可以通过 AskUserQuestionTool 选择是否评审
- [ ] 支持多轮评审
- [ ] 构建通过，测试通过

## 备注

- 这次对话的 context 快用完了，所以交接给下一个 agent
- 核心设计已经讨论清楚，主要是实现工作
- 如有疑问，可以参考 `.cdd/features/fdd-v2/00-spec.md` 和 `01-deductive-spec.md`
