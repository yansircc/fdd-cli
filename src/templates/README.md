# FDD (Feedback-Driven Development)

> Capture fix knowledge while AI context is warm, compiling it into triggerable, regression-testable pitfalls.

## Workflow

1. Human + AI collaborate to complete a fix (context is warm)
2. Stop hook triggers → AI decides if worth recording
3. AI automatically: generates TRAV → runs regression test → runs edge test
4. Pitfall is written to `.fdd/pitfalls/`, becoming long-term repository memory

## Directory Structure

```
.fdd/
├── pitfalls/     # Pitfall entries (TRAV protocol)
└── config.yaml   # Global configuration

.claude/
└── skills/fdd/   # FDD skill for Claude Code
```

## TRAV Protocol

Each pitfall must contain:

- **Trigger** — How to detect this issue
- **Replay** — How the issue occurred (root cause)
- **Action** — How to fix it
- **Verify** — How to verify the fix succeeded

## Gate Checks

Pitfalls must include:
- `evidence` — Original evidence (error_snippet or command)
- `regression` — Regression test (or waiver + reason)
- `edge` — False positive boundary test (or waiver + reason)

Missing any required field will prevent the pitfall from being written.

## Commands

- `fdd add --json` — Create pitfall via JSON input
- `fdd list` — List all pitfalls
- `fdd check` — Run triggers to detect issues
- `fdd validate` — Validate pitfalls against gate checks
