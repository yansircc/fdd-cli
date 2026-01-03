# FDD 集成

> CDD 定义约束（事前），FDD 执行检测（运行时）

## 常用命令

```bash
fdd list              # 查看现有 Pitfall
fdd add --json '{}'   # 添加 Pitfall
fdd check             # 运行检测
fdd check --mute      # 静默检测（hook 用）
```

## 约束 → 触发器映射

| CDD 约束 | FDD 触发器 | 预防性？ |
|----------|-----------|---------|
| BC | `rule` / `dynamic` | ✅ |
| SC | `protect` / `rule` | ✅ |
| Non-Goals | `command` / `protect` | ✅✅ |
| RC | `dynamic` | ⚠️ |

## Stage 3: 预防性 Pitfall

收敛完成后：

1. `fdd list` 检查现有
2. 识别适合预防的约束
3. 展示列表询问用户
4. `fdd add` 执行添加
5. `fdd check` 验证

**询问模板**：
```
以下约束适合添加为 Pitfall：
| # | 约束 | 触发器 |
|---|------|--------|
| 1 | BC-01 | rule |
| 2 | Non-Goal | command |
要添加哪些？（1,2 / all / none）
```

## 触发器类型

| 触发器 | 用途 |
|--------|------|
| `rule` | 代码模式检测 |
| `dynamic` | 运行时检查 |
| `protect` | 阻止文件修改 |
| `command` | 阻止危险命令 |
| `change` | 文件变更触发 |
| `ai-context` | AI 上下文注入 |

## 示例

```bash
# BC-01: 禁止 SQL 拼接
fdd add --json '{
  "title": "SQL 注入防护",
  "trigger": [{"kind": "rule", "pattern": "\\$\\{.*\\}.*SELECT"}],
  "replay": {"root_cause": "预防性约束"},
  "verify": {"level": "V0", "checks": ["bun test:security"]}
}'
```
