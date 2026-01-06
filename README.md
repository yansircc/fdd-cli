# FDD CLI

> **Feedforward & Feedback Driven Development** — 前馈驱动 + 反馈驱动开发

## 双 F 模型

```
FDD = Feedforward + Feedback

Feedforward（前馈/演绎）
  来源：AI 元认知 —— "我知道未来的我不知道"
  时机：开发前
  产出：specs/ 文档 + 演绎 Pit

Feedback（反馈/归纳）
  来源：真实错误
  时机：Bug 修复后
  产出：归纳 Pit
```

## Installation

```bash
npm install -g fdd-cli
```

## Quick Start

```bash
fdd init                    # Initialize FDD + Claude Code skills
fdd add --json '<JSON>'     # Add pitfall (AI auto-generates JSON)
fdd list                    # List pitfalls
fdd check                   # Run triggers to find issues
fdd validate                # Validate gate checks
```

## Commands

| Command | Description | Options |
|---------|-------------|---------|
| `init` | Initialize FDD directory + skills | `--force`, `--skip-hook` |
| `add` | Add pitfall | `--json` (required) |
| `list` | List pitfalls | `-s severity`, `-t tag`, `--origin`, `--scope`, `--archived` |
| `validate` | Validate gate checks | `-i id` |
| `check` | Run triggers | `-i id`, `-v verbose` |
| `guard <cmd>` | Check command (for hook) | `-q quiet` |
| `install-hook` | Install/uninstall shell hook | `--shell`, `--uninstall` |

## Origin（来源）

| Origin | 说明 | Gate 检查 |
|--------|------|-----------|
| `deductive` | 演绎 Pit - 来自 AI 预判 | evidence/regression/edge 可选 |
| `inductive` | 归纳 Pit - 来自真实错误 | evidence/regression/edge 必填 |

## Scope（生命周期）

| Type | 说明 |
|------|------|
| `permanent` | 长期 - 项目级约束 |
| `temporary` | 临时 - 有终止条件 |

## Trigger Types

| Kind | Description | Use Case |
|------|-------------|----------|
| `rule` | Grep pattern matching | Detect code anti-patterns |
| `change` | Git file change detection | Trigger on schema changes |
| `dynamic` | Run shell commands | Runtime checks |
| `command` | Intercept shell commands | Block dangerous commands |
| `protect` | Protect files from AI edits | Prevent accidental overwrites |
| `inject-context` | Inject context for AI | Remind AI of past issues |

## Claude Code Integration

FDD automatically generates Claude Code hooks:

- **Stop Hook**: Prompts AI to record pitfalls after file modifications
- **Context Hook**: Injects relevant pitfall context when touching certain files
- **Protect Hook**: Blocks AI from modifying protected files
- **Guard Hook**: Intercepts dangerous Bash commands

## TRAV Protocol

Each pitfall contains:
- **Trigger** — How to detect this issue
- **Replay** — Root cause analysis
- **Action** — How to fix it
- **Verify** — How to confirm the fix

## Development

```bash
bun install && bun dev <cmd>
bun test && bun lint
```

## License

MIT
