# FDD CLI

> **Feedback-Driven Development** — Compile fixes into triggerable, regression-testable pitfalls.

## Installation

```bash
npm install -g fdd-cli
```

## Quick Start

```bash
fdd init                    # Initialize FDD + Claude Code hooks
fdd record "Fix title"      # Record pitfall (interactive or --json)
fdd list                    # List pitfalls
fdd check                   # Run triggers to find issues
fdd validate                # Validate gate checks
```

## Commands

| Command | Description | Options |
|---------|-------------|---------|
| `init` | Initialize FDD directory + hooks | `--force`, `--skip-hook` |
| `record [title]` | Record pitfall | `-s severity`, `-t tags`, `--json` |
| `list` | List pitfalls | `-s severity`, `-t tag` |
| `validate` | Validate gate checks | `-i id` |
| `check` | Run triggers | `-i id`, `-v verbose` |
| `guard <cmd>` | Check command (for hook) | `-q quiet` |
| `install-hook` | Install/uninstall shell hook | `--shell`, `--uninstall` |

## Trigger Types

| Kind | Description | Use Case |
|------|-------------|----------|
| `rule` | Grep pattern matching | Detect code anti-patterns |
| `change` | Git file change detection | Trigger on schema changes |
| `dynamic` | Run shell commands | Runtime checks |
| `command` | Intercept shell commands | Block dangerous commands |
| `protect` | Protect files from AI edits | Prevent accidental overwrites |
| `ai-context` | Inject context for AI | Remind AI of past issues |

## Claude Code Integration

FDD automatically generates Claude Code hooks:

- **Stop Hook**: Prompts AI to record pitfalls after file modifications
- **Context Hook**: Injects relevant pitfall context when touching certain files
- **Protect Hook**: Blocks AI from modifying protected files
- **Guard Hook**: Intercepts dangerous Bash commands

### ai-context Trigger

Automatically remind AI about past issues when modifying certain files:

```yaml
trigger:
  - kind: ai-context
    when_touching: ["src/lib/database.ts", "src/db/**"]
    context: "This area had SQL injection issues. Use parameterized queries."
    strength: strong
```

### protect Trigger

Prevent AI from modifying protected files:

```yaml
trigger:
  - kind: protect
    paths: [".fdd/pitfalls/**"]
    permissions:
      create: deny
      update: deny
      delete: deny
    message: "Use fdd record --json instead"
```

## TRAV Protocol

Each pitfall contains:
- **Trigger** — How to detect this issue
- **Replay** — Root cause analysis
- **Action** — How to fix it
- **Verify** — How to confirm the fix

## Gate Checks

Required fields:
- `evidence` — Error snippet or command
- `regression` — Repro steps (or waiver)
- `edge` — Negative case (or waiver)

## Development

```bash
bun install && bun dev <cmd>
bun test && bun lint
```

## License

MIT
