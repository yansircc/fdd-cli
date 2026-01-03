# FDD Interview

> 调用 AskUserQuestionTool，厘清想法、定义约束、识别 AI 盲区

## 原则

- **完整**：结束时无模棱两可
- **高效**：每轮 3-5 个问题

## 流程

```
1. 发散 → stories.md, flows.md
2. 收敛 → context.md, constraints.md
3. Challenge → 挑刺
4. 生成 Spec → 确认后写文件
5. 元认知 → 识别盲区 → Pit Challenge → 创建
6. 完成
```

---

## 1. 发散

目标：理解用户想做什么

- **What**：目标？问题？
- **Why**：痛点？动机？
- **Scope**：边界？MVP？

**产出**：stories.md, flows.md

## 2. 收敛

目标：确定怎么实现

- **How**：技术方案？关键决策？
- **Constraints**：约束？Non-Goals？
- **Edge cases**：异常处理？

**产出**：context.md, constraints.md

---

## 3. Challenge

> 生成前挑刺

检查维度：
- **数据**：结构？示例？损坏处理？
- **状态**：状态列表？转换规则？
- **输入输出**：边界？格式？
- **一致性**：文档间矛盾？

```
## Challenge 结果

### 必须补充
1. **{问题}** - {影响}

### 建议补充
1. **{问题}** - {建议}

补充？[补充 / 跳过]
```

---

## 4. 生成 Spec

先确认再写：

```
## 即将生成

Feature: {name}
技术摘要: {关键决策}
文件: stories.md, flows.md, context.md, constraints.md

确认？[生成 / 修改]
```

---

## 5. 元认知

> 识别 AI 易犯错的地方

### 筛选标准

**未来没有当前上下文的 AI 大概率会犯同样的错**

信号：
- **知识截止**：新框架/API
- **反直觉**：与主流相反
- **项目特有**：AI 无法提前知道
- **经典陷阱**：时区、编码、并发

### 识别

```
## 元认知

我注意到以下容易犯错：

1. **{决策}** - 风险：{AI 可能怎么犯错}
2. ...

创建 Pit？[1,2,... / 全部 / 跳过]
```

### Pit Challenge（必须）

对每个要创建的 Pit，使用 AskUserQuestionTool 展示设计：

```
## Pit 设计预览

**标题**: {title}
**Trigger**: {kind}
  - scope: src/**/*.ts（通用模式）
  - context/pattern: {value}

**风险**: {description}
**验证**: V3（预防性约束）

确认？[创建 / 调整 / 跳过]
```

调整后再次确认。确认后读取 [create.md](create.md) 执行。

---

## 6. 完成

更新 SPEC.md 添加 Related Pits：

```
## 完成

产出: .fdd/specs/{feature}/
Pit: PIT-001, PIT-002
Status: Ready
```

---

## 反模式

| 避免 | 正确 |
|------|------|
| 每轮 1 问 | 合并 3-5 个 |
| 直接写文件 | 先确认再写 |
| Challenge 在生成后 | 生成前 |
| stories 写验收标准 | 只写故事 |
| context 写备选/待定 | 只写确定的 |
| flows/context 重复 | flows 写步骤，context 写细节 |
| 所有约束生成 Pit | 只有 AI 盲区 |
| Pit 假设代码结构 | 通用模式 `src/**` |
| 直接创建 Pit | 先 Challenge 确认 |
