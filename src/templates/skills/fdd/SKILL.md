---
name: fdd
description: Feedforward & Feedback Driven Development - 前馈（演绎）+ 反馈（归纳）。开发前 Interview 厘清想法，Bug 后创建 Pit 防复发。
---

# FDD - Feedforward & Feedback Driven Development

## 双 F 模型

```
Feedforward（前馈/演绎）: AI 元认知 → specs/ + 演绎 Pit
Feedback（反馈/归纳）: 真实错误 → 归纳 Pit
```

## Interview 流程（前馈）

```
发散 → 收敛 → Challenge → 生成 Spec → 元认知 → 完成
                  ↑
            生成前挑刺
```

详见：[interview.md](interview.md)

## Bug 修复后（反馈）

1. 值得记录？（能帮未来 AI 避坑？）
2. `fdd list` 检查重复
3. 询问用户确认
4. `fdd add --json '{...}'`

格式：[create.md](create.md)

## 目录结构

```
.fdd/
├── specs/{feature}/    # 规划文档
│   ├── SPEC.md         # 索引
│   ├── stories.md      # 用户故事
│   ├── flows.md        # 核心流程
│   ├── context.md      # 技术决策
│   └── constraints.md  # 约束 + Non-Goals
└── pits/               # Pit 文件
```

## 核心原则

- **精简**：不损失信息的前提下，最小化 token
- **完整**：Interview 后无模棱两可
- **元认知**：只有 AI 易犯错的才生成 Pit

## Origin / Scope

- `deductive`：演绎，evidence/regression/edge 可选
- `inductive`：归纳，evidence/regression/edge 必填
- `permanent`：长期
- `temporary`：临时（有过期条件）

## 触发器

`rule` | `change` | `dynamic` | `command` | `protect` | `ai-context`

详见：[triggers.md](triggers.md) [gates.md](gates.md) [examples.md](examples.md)
