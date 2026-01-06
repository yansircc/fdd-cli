# FDD E2E Mini Project

这是一个用于测试 FDD CLI hooks 的迷你项目。

## 测试场景

| 文件 | 场景 | 预期 trigger 类型 |
|------|------|-------------------|
| `src/buggy-regex.ts` | 无效正则表达式 | `rule` |
| `src/buggy-publish.ts` | 忘记 build 就 publish | `command` |
| `src/buggy-schema.ts` | 类型变更没跑 typecheck | `change` |
| `src/buggy-config.ts` | 直接写入配置文件 | `protect` |
| `src/buggy-hooks.ts` | 修改敏感文件需要提醒 | `inject-context` |
| `src/buggy-env.ts` | 缺少环境变量检查 | `dynamic` |

## 测试流程

1. 在此目录运行 `fdd init`
2. Claude 读取某个 buggy 文件并"修复"
3. stop hook 触发 → AskUserQuestion
4. 选择"记录" → 生成 pit
5. 对比 `../expected/` 下的预期结果

## 注意

- `.fdd/` 和 `.claude/` 目录会在测试时生成
- 这些产物已被 gitignore，不会提交
- 每次测试前可以删除这些目录重新开始
