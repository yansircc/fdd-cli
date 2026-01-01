# FDD (Feedback-Driven Development)

> Capture fix knowledge while AI context is warm, compiling it into triggerable, regression-testable pitfalls.

## Workflow

1. Human + AI collaborate to complete a fix (context is warm)
2. Immediately run: `/fdd-record` (Claude) or `fdd record` (terminal)
3. AI automatically: generates DRRV → runs regression test → runs edge test
4. Pitfall is written to `.fdd/pitfalls/`, becoming long-term repository memory

## Directory Structure

```
.fdd/
├── pitfalls/     # Pitfall entries (DRRV protocol)
├── rules/        # Long-term invariants (architectural contracts)
└── config.yaml   # Global configuration
```

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

## Commands

- `/fdd-record` — Compile pitfall in Claude (one-click)
- `fdd record` — Record pitfall in terminal
- `fdd list` — List all pitfalls
- `fdd validate` — Validate pitfalls against gate checks
