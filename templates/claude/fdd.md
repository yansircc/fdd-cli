# FDD 规则（硬门禁）

## 核心原则

> AI 会忘，但代码库不会。遇到错误时，趁热把修复编译成可触发的坑位。

## Gate 1: Evidence 必填

Pitfall 必须包含 `evidence` 区块，至少包含：
- `error_snippet` 或 `command`
- `commit`（如果有）

缺少 evidence 的 pitfall **不允许写入**。

## Gate 2: Regression 必填

Pitfall 必须包含 `regression` 区块。
- 如果无法复现，必须显式声明 `waiver: true` + `waiver_reason`

没有 regression 的 pitfall **不允许写入**。

## Gate 3: Edge 必填

Pitfall 必须包含 `edge` 区块（至少一个负样本）。
- 如果确实无法设计负样本，必须 `waiver: true` + `waiver_reason`

没有 edge 的 pitfall **不允许写入**。

## Gate 4: 弱 Detector 标记

如果 detect 只有字符串匹配（如 error log 关键词），必须：
- 标记 `strength: weak`
- 生成 TODO：如何升级到 rule/change/dynamic

## Verify 梯度

- V0（测试/类型/构建）→ 最优先
- V1（规则：lint/grep/AST）
- V2（证据存在性）
- V3（结构化自证）→ 最后手段

## Detect 优先级原则

> **按"性价比"而不是按类别排序：最低成本且最高判定力优先。**
> 静态/变更通常更便宜，但如果问题本质是动态契约，应优先动态。

## 命令提示

- `/fdd-record` - 趁热编译坑位（一键完成）
- `/fdd-list` - 列出所有坑位

## 错误处理流程

当遇到错误时：
1. 先搜索 `.fdd/pitfalls/` 是否有相关记录
2. 如果有：按 Remedy 步骤修复，完成 Verify 验证
3. 如果没有：修复后立刻运行 `/fdd-record` 编译新坑位
