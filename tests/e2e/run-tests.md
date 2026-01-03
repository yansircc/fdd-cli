# FDD E2E 测试指南

## 测试原则

1. **AI 必须自己分析并构建完整的 pit JSON**（不是照抄答案）
2. **expected JSON 只包含验证点**，用于检查关键字段是否正确
3. **验证脚本自动对比**，确保测试可重复

---

## 测试准备

```bash
cd tests/e2e/mini-project
fdd init
```

---

## 测试流程

```
1. AI 读取 buggy 代码
2. AI 分析并修复
3. stop hook 触发 → AskUserQuestion
4. 用户选择"记录" → AI 自己构建完整 JSON
5. fdd add --json '...'
6. 运行验证脚本检查结果
```

---

## 6 个测试场景

| 场景 | 文件 | 预期 trigger |
|------|------|--------------|
| 1 | `src/buggy-regex.ts` | `rule` |
| 2 | `src/buggy-publish.ts` | `command` |
| 3 | `src/buggy-schema.ts` | `change` |
| 4 | `src/buggy-config.ts` | `protect` |
| 5 | `src/buggy-hooks.ts` | `ai-context` |
| 6 | `src/buggy-env.ts` | `dynamic` |

---

## 验证方法

每个场景完成后，运行验证脚本：

```bash
# 在 mini-project 目录下
bun ../../verify.ts .fdd/pits/pit-xxx.md ../../expected/pit-regex-error.json
```

验证脚本语法：
- **精确匹配**: `"trigger[0].kind": "rule"`
- **包含检查**: `"trigger[0].pattern": "contains:RegExp"`
- **存在检查**: `"trigger[0].context": "exists"`

---

## 重要说明

### AI 必须自己构建 JSON

expected JSON **不是答案**，只是验证点。AI 需要：

1. 分析问题的根本原因
2. 选择合适的 trigger 类型
3. 构建完整的、符合 schema 的 JSON
4. 包含所有必填字段：`title`, `severity`, `tags`, `evidence`, `trigger`, `replay`, `action`, `verify`, `regression`, `edge`

### 常见错误

| 错误 | 原因 |
|------|------|
| `Invalid JSON format` | JSON 语法错误或转义问题 |
| `expected array, received undefined` | 缺少必填字段 |
| `Invalid option` | 字段值不在允许的枚举中 |
| `FDD is not initialized` | 需要先 `fdd init` |

### action.kind 允许的值

只能是: `"transform"` | `"read"` | `"run"`

---

## 测试完成后

```bash
# 1. 恢复 buggy 源码（重要！）
git checkout -- src/

# 2. 清理测试产物（可选，下次测试前执行）
rm -rf .fdd/ .claude/
```

**注意**：测试时对 `src/buggy-*.ts` 的修复不应提交，否则下次无法重复测试。

---

## 重置测试环境

```bash
# 完整重置
git checkout -- src/
rm -rf .fdd/ .claude/
fdd init
```
