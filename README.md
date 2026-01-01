# FDD CLI

> **Feedback-Driven Development** — Compile fixes into triggerable, regression-testable pitfalls.

Capture fix knowledge while the AI context is still warm, transforming ephemeral debugging sessions into persistent, actionable records.

## Installation

```bash
npm install -g fdd-cli
```

## Quick Start

```bash
# 1. Initialize FDD in your project
fdd init

# 2. After completing a fix, record the pitfall
fdd record "Fixed QueryClient direct instantiation issue"

# 3. List all recorded pitfalls
fdd list

# 4. Validate pitfalls against gate checks
fdd validate
```

## Commands

### `fdd init`

Initialize the FDD directory structure.

```bash
fdd init [--force]
```

Creates:
- `.fdd/pitfalls/` — Pitfall entries (DRRV protocol)
- `.fdd/rules/` — Long-term invariants (architectural contracts)
- `.fdd/config.yaml` — Global configuration
- `.claude/commands/fdd-record.md` — Claude slash command
- `.claude/rules/fdd.md` — FDD gate rules

### `fdd record [title]`

Record a new pitfall entry.

```bash
fdd record "Title" [-s high] [-t api,security]
```

Options:
- `-s, --severity` — Severity level (critical/high/medium/low)
- `-t, --tags` — Tags (comma-separated)

### `fdd list`

List all recorded pitfalls.

```bash
fdd list [-s high] [-t api]
```

Options:
- `-s, --severity` — Filter by severity
- `-t, --tag` — Filter by tag

### `fdd validate`

Validate pitfalls against gate checks.

```bash
fdd validate [--id PIT-001]
```

Options:
- `-i, --id` — Validate a specific pitfall by ID

### `fdd check`

Run detectors to find potential issues in the codebase.

```bash
fdd check [--id PIT-001] [--verbose]
```

Options:
- `-i, --id` — Check a specific pitfall by ID
- `-v, --verbose` — Show detailed match information

## Claude Integration

Use the `/fdd-record` command in Claude to compile pitfalls while the context is still warm:

1. Complete a fix with Claude's assistance
2. Execute `/fdd-record`
3. Claude automatically extracts context, generates DRRV, and runs regression tests
4. Pitfall is written to `.fdd/pitfalls/`

## DRRV Protocol

Each pitfall must contain:

- **Detect** — How to detect this issue
- **Replay** — How the issue occurred (root cause)
- **Remedy** — How to fix it
- **Verify** — How to verify the fix succeeded

## Gate Checks

Pitfalls must include:
- `evidence` — Original evidence (error_snippet or command)
- `regression` — Regression test (or waiver + reason)
- `edge` — False positive boundary test (or waiver + reason)

Missing any required field will prevent the pitfall from being written.

## Development

```bash
# Install dependencies
bun install

# Run development version
bun run dev <command>

# Build
bun run build

# Run tests
bun test

# Type check
bun typecheck

# Lint
bun lint
```

## License

MIT
