---
description: 列出所有已记录的 FDD 坑位
argument-hint: "[--severity critical|high|medium|low] [--tag xxx]"
---

## 任务

列出 `.fdd/pitfalls/` 中的所有坑位。

## 过滤选项

- `--severity`：按严重度过滤（critical/high/medium/low）
- `--tag`：按标签过滤

## 输出格式

| ID | 标题 | 严重度 | 标签 | 创建日期 |
|----|------|--------|------|----------|

## 执行

1. 读取 `.fdd/pitfalls/*.md` 文件
2. 解析 frontmatter
3. 应用过滤条件
4. 格式化输出表格
