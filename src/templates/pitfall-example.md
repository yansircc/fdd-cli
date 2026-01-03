---
id: PIT-000
title: "[示例] 保护 pitfall 文件不被 AI 直接写入"
severity: high
tags: [example, protection]
created: 2024-01-01

evidence:
  error_snippet: |
    AI agent 绕过门禁检查直接写入 .fdd/pitfalls/ 目录，
    导致 pitfall 文件缺少必要字段或格式不正确。
  command: "AI 使用 Write 工具直接创建 pitfall 文件"

trigger:
  - kind: protect
    paths:
      - ".fdd/pitfalls/**"
    exclude:
      - "_template.md"
      - "pit-000-*.md"
    permissions:
      create: deny
      update: allow
      delete: allow
    message: "请使用 fdd add --json 命令创建 pitfall，而不是直接写入文件"
    strength: strong

replay:
  root_cause: "AI agent 不知道 pitfall 文件需要通过 CLI 创建以确保门禁检查和 ID 生成"
  trigger_condition: "AI 尝试直接使用 Write/Edit 工具操作 .fdd/pitfalls/ 目录"
  affected_scope:
    - ".fdd/pitfalls/"

action:
  - level: low
    kind: run
    action: "使用 fdd add --json 命令创建 pitfall"
    steps:
      - "构建符合 TRAV 协议的 JSON"
      - "执行 fdd add --json '<JSON>'"
      - "CLI 自动处理 ID 生成和门禁检查"

verify:
  level: V3
  fallback:
    level: V3
    self_proof:
      - "protect trigger 会在 AI 尝试写入时自动拦截"
      - "Claude Code hooks 实现实时保护"

regression:
  repro: []
  expected: ""
  waiver: true
  waiver_reason: "被动保护机制，无需主动复现"

edge:
  negative_case: []
  expected: ""
  waiver: true
  waiver_reason: "glob 模式已排除模板文件和本示例文件"
---

# 这是一个示例 Pitfall

> **提示：这是一个示例文件，你可以随时删除它。**
>
> 此文件展示了 `protect` trigger 的用法，用于保护特定文件不被 AI agent 直接写入。

## Trigger

本 pitfall 使用 `protect` 类型的 trigger，配置如下：

- **paths**: `.fdd/pitfalls/**` - 保护整个 pitfalls 目录
- **exclude**: `_template.md`, `pit-000-*.md` - 排除模板和本示例
- **permissions**: 禁止 Create 操作
- **message**: 提示使用正确的命令

## Replay

AI agent 可能不了解 FDD 的工作流程，直接使用 Write/Edit 工具创建 pitfall 文件。这会绕过：

1. **门禁检查** - 确保必填字段完整
2. **ID 生成** - 确保 ID 唯一且有序
3. **格式验证** - 确保 YAML frontmatter 正确

## Action

正确的创建方式是使用 CLI：

```bash
fdd add --json '{
  "title": "...",
  "severity": "...",
  ...
}'
```

## Verify

当 AI 尝试写入被保护的路径时，Claude Code 的 preToolUse hook 会：

1. 检查文件路径是否匹配 protect 规则
2. 如果匹配且权限为 `deny`，阻止操作
3. 显示 pitfall 信息和建议的替代方案
