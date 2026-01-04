# Commands Reference

## CLI Commands

### fdd init

初始化 FDD 目录和 hooks。

```bash
fdd init           # 初始化
fdd init --force   # 强制重新初始化
fdd init --skip-hook  # 跳过 shell hook 安装
```

实现：`src/commands/init.ts`

行为：
1. 创建 `.fdd/` 目录结构（包括 `specs/` 和 `pits/`）
2. 创建 `.claude/` hooks 目录
3. 复制模板文件
4. 安装 ZSH shell hook（除非 --skip-hook）

### fdd add

添加 pitfall。

```bash
fdd add --json '<JSON>'     # JSON 模式（AI 自动生成）
```

实现：`src/commands/add/`

选项：
- `--json` - JSON 输入（必填）
- `-s, --severity <level>` - 严重级别
- `-t, --tags <tags>` - 标签（逗号分隔）

JSON 格式参考：`.claude/skills/fdd/workflows/record.md`

**Origin 说明**：
- `origin: "inductive"` - 归纳 Pit，需要 evidence/regression/edge
- `origin: "deductive"` - 演绎 Pit，evidence/regression/edge 可选

### fdd list

列出 pitfalls。

```bash
fdd list                    # 列出所有生效的 Pit
fdd list -s high            # 按严重级别过滤
fdd list -t security        # 按标签过滤
fdd list --origin deductive # 只看演绎 Pit
fdd list --origin inductive # 只看归纳 Pit
fdd list --scope permanent  # 只看长期 Pit
fdd list --scope temporary  # 只看临时 Pit
fdd list --archived         # 只看已归档
```

实现：`src/commands/list.ts`

### fdd check

运行触发器检测问题。

```bash
fdd check              # 检查所有（跳过过期和归档）
fdd check -i PIT-001   # 检查特定 pitfall
fdd check -v           # 详细输出
```

实现：`src/commands/check.ts`

**行为**：
- 自动跳过过期的临时 Pit（显示警告）
- 自动跳过已归档的 Pit

### fdd validate

验证 gate checks。

```bash
fdd validate          # 验证所有
fdd validate -i PIT-001  # 验证特定 pitfall
```

实现：`src/commands/validate.ts`

**Origin 差异**：
- 归纳 Pit：完整 Gate 检查（evidence/regression/edge 必填）
- 演绎 Pit：宽松 Gate 检查（evidence/regression/edge 可选）

### fdd guard

检查命令是否被阻止（供 hook 使用）。

```bash
fdd guard "rm -rf /"   # 检查命令
fdd guard "npm test" -q  # 静默模式
```

实现：`src/commands/guard.ts`

返回码：
- 0: 允许
- 1: 阻止
- 2: 警告

### fdd install-hook

安装/卸载 shell hook。

```bash
fdd install-hook              # 安装到当前 shell
fdd install-hook --shell zsh  # 指定 shell
fdd install-hook --uninstall  # 卸载
```

实现：`src/commands/install-hook.ts`

## 开发命令

```bash
# 开发运行
bun dev <command>

# 构建
bun build

# 测试
bun test
bun test --watch

# 代码检查
bun lint
bun lint:fix

# 类型检查
tsc --noEmit
```

## 构建产物

```bash
bun build src/index.ts --outdir dist --target node
rm -rf templates
cp -r src/templates templates
```

输出：
- `dist/index.js` - CLI 入口
- `templates/` - 模板文件副本（包括 skills/ 和 specs/）

## 调试技巧

```bash
# 查看 pitfall 内容
cat .fdd/pits/PIT-001-*.md

# 查看规划文档
ls .fdd/specs/

# 查看配置
cat .fdd/config.yaml

# 查看 hook 配置
cat .claude/settings.json

# 查看生成的 hook
cat .claude/hooks/*.mjs

# 测试触发器
bun dev check -v

# 测试命令拦截
bun dev guard "dangerous command"
```
