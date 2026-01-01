# FDD Rules (Gate Checks)

## Core Principle

> AI context is ephemeral, but the codebase persists. When encountering errors, compile fixes into triggerable pitfalls while context is warm.

## Gate 1: Evidence Required

Pitfall must contain an `evidence` block with at least:
- `error_snippet` or `command`
- `commit` (if available)

Pitfalls missing evidence **will be rejected**.

## Gate 2: Regression Required

Pitfall must contain a `regression` block.
- If reproduction is not possible, explicitly declare `waiver: true` + `waiver_reason`

Pitfalls missing regression **will be rejected**.

## Gate 3: Edge Required

Pitfall must contain an `edge` block (at least one negative case).
- If negative case design is not possible, use `waiver: true` + `waiver_reason`

Pitfalls missing edge **will be rejected**.

## Gate 4: Weak Detector Marking

If detect only uses string matching (e.g., error log keywords), must:
- Mark `strength: weak`
- Generate TODO: how to upgrade to rule/change/dynamic

## Verify Levels

- V0 (test/type/build) → highest priority
- V1 (rules: lint/grep/AST)
- V2 (evidence existence)
- V3 (structured self-proof) → last resort

## Detect Priority Principle

> **Order by cost-effectiveness, not by category: lowest cost + highest accuracy first.**
> Static/change-based detection is usually cheaper, but if the issue is inherently about dynamic contracts, prioritize dynamic detection.

## Command Reference

- `/fdd-record` — Compile pitfall while context is warm (one-click)
- `/fdd-list` — List all pitfalls

## Error Handling Workflow

When encountering an error:
1. First search `.fdd/pitfalls/` for related records
2. If found: follow Remedy steps, complete Verify checks
3. If not found: fix the issue, then immediately run `/fdd-record` to compile a new pitfall
