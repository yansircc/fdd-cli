# FDD CLI

> **Feedback-Driven Development** — Compile fixes into triggerable, regression-testable pitfalls.

## Installation

```bash
npm install -g fdd-cli
```

## Quick Start

```bash
fdd init                    # Initialize FDD + shell hook
fdd record "Fix title"      # Record pitfall (interactive or --json)
fdd list                    # List pitfalls
fdd check                   # Run triggers to find issues
fdd validate                # Validate gate checks
```

## Commands

| Command | Description | Options |
|---------|-------------|---------|
| `init` | Initialize FDD directory + shell hook | `--force`, `--skip-hook` |
| `record [title]` | Record pitfall | `-s severity`, `-t tags`, `--json` |
| `list` | List pitfalls | `-s severity`, `-t tag` |
| `validate` | Validate gate checks | `-i id` |
| `check` | Run triggers | `-i id`, `-v verbose` |
| `guard <cmd>` | Check command (for hook) | `-q quiet` |
| `install-hook` | Install/uninstall hook | `--shell`, `--uninstall` |

## Command Guard

Automatically intercept dangerous commands via shell hook.

```yaml
trigger:
  - kind: command
    pattern: "wrangler\\s+d1\\s+execute"
    action: block  # or "warn"
    message: "Use bun db:* instead"
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

## Claude Integration

Use `/fdd-record` in Claude after completing a fix to compile pitfalls while context is warm.

## Development

```bash
bun install && bun dev <cmd>
bun test && bun lint
```

## License

MIT
