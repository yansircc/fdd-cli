# FDD CLI

> **Feedback-Driven Development** - Compile fixes into triggerable pitfalls

趁 AI 还记得，把一次修复编译成"可触发、可回归"的坑位。

## 安装

```bash
npm install -g fdd-cli
```

## 快速开始

```bash
# 1. 在项目中初始化 FDD
fdd init

# 2. 完成一次修复后，记录坑位
fdd record "修复了 QueryClient 直接实例化的问题"

# 3. 查看所有坑位
fdd list
```

## 命令

### `fdd init`

初始化 FDD 目录结构。

```bash
fdd init [--force]
```

创建：
- `.fdd/pitfalls/` - 坑位条目
- `.fdd/rules/` - 长期不变量
- `.fdd/config.yaml` - 全局策略
- `.claude/commands/fdd-record.md` - Claude 斜杠命令
- `.claude/rules/fdd.md` - FDD 硬门禁规则

### `fdd record [title]`

记录一个新的坑位。

```bash
fdd record "标题" [-s high] [-t api,security]
```

选项：
- `-s, --severity` - 严重度 (critical/high/medium/low)
- `-t, --tags` - 标签 (逗号分隔)

### `fdd list`

列出所有坑位。

```bash
fdd list [-s high] [-t api]
```

选项：
- `-s, --severity` - 按严重度过滤
- `-t, --tag` - 按标签过滤

## Claude 集成

在 Claude 中使用 `/fdd-record` 命令可以趁上下文还热时一键编译坑位：

1. 与 Claude 协作完成修复
2. 输入 `/fdd-record`
3. Claude 自动提取上下文，生成 DRRV，执行回归测试
4. 坑位直接写入 `.fdd/pitfalls/`

## DRRV 协议

每个坑位必须包含：

- **Detect（抓现行）**：如何检测到这个问题
- **Replay（放回放）**：问题是怎么发生的
- **Remedy（给方案）**：如何修复
- **Verify（过安检）**：如何验证修复成功

## 硬门禁

坑位必须包含：
- `evidence`：原始证据 (error_snippet 或 command)
- `regression`：回归测试 (或 waiver + reason)
- `edge`：误诊边界测试 (或 waiver + reason)

缺失任一项将无法写入。

## 开发

```bash
# 安装依赖
bun install

# 运行开发版本
bun run src/index.ts <command>

# 构建
bun run build

# 类型检查
bun run typecheck
```

## License

MIT
