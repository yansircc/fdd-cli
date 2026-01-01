---
description: 把刚完成的修复编译成可触发坑位（趁热，一键完成）
---

## 任务

你刚帮用户完成了一次修复。现在需要把这次修复"编译"成一个可触发、可回归的坑位。

**必须一键完成，直接写入后通知用户。**

## 执行协议

### A. 收集热记忆材料

从当前上下文自动提取：
- 错误现象（日志/截图/描述）→ 存入 `evidence.error_snippet`
- 根因分析 → 存入 Replay
- 修复 diff → 存入 `evidence.diff_summary`
- 修复命令 → 存入 `evidence.command`
- commit hash → 存入 `evidence.commit`

如果缺关键材料，**只问 1~2 个补充问题**。

### B. 生成 DRRV

- **Detect**: 至少 2 条策略（按性价比排序，不按类别）
  - 如果只能做字符串匹配，标记 `strength: weak`
- **Replay**: 最少文字描述根因
- **Remedy**: 1~3 条路径，按风险排序
  - 如果有相关 Rule，引用它
- **Verify**: 给最高可达的 V-level (V0 > V1 > V2 > V3)

### C. 故意复现（必须）

提供方式"故意再犯一次"验证 detector 能命中。
- 最理想：可执行的 repro 步骤/脚本
- 次理想：模拟输入/最小改动触发 detector
- 如果无法复现：
  - 设置 `waiver: true` + `waiver_reason`
  - 降级 verify 为 V3
  - 标注"不可回归风险"

### D. 误诊边界（必须）

至少一个负样本：相似但不应触发的情况。
- 给出区分策略（scope/regex/路径白名单）
- 如果无法设计：`waiver: true` + `waiver_reason`

### E. 直接写入并通知

1. 执行硬门禁检查
2. 生成坑位文件
3. 写入 `.fdd/pitfalls/`
4. 输出通知：
   - 坑位 ID 和标题
   - 文件路径
   - 关键信息摘要（severity, detect 策略, verify 级别）
   - 如果有 waiver，高亮显示原因
   - 如果有 warnings（如弱 detector），提示后续改进

## 硬门禁检查

写入前检查：
- [ ] evidence 存在（error_snippet 或 command）
- [ ] regression 存在（或有 waiver + reason）
- [ ] edge 存在（或有 waiver + reason）
- [ ] 弱 detector 已标记 strength: weak

任一检查失败 → **拒绝写入**，提示补齐。

## Verify 梯度

- V0（测试/类型/构建）→ 最优先
- V1（规则：lint/grep/AST）
- V2（证据存在性）
- V3（结构化自证）→ 最后手段

## Detect 优先级原则

> **按"性价比"而不是按类别排序：最低成本且最高判定力优先。**
> 静态/变更通常更便宜，但如果问题本质是动态契约，应优先动态。
