---
description: List all recorded FDD pitfalls
argument-hint: "[--severity critical|high|medium|low] [--tag xxx]"
---

## Task

List all pitfalls in `.fdd/pitfalls/`.

## Filter Options

- `--severity` — Filter by severity (critical/high/medium/low)
- `--tag` — Filter by tag

## Output Format

| ID | Title | Severity | Tags | Created |
|----|-------|----------|------|---------|

## Execution

1. Read `.fdd/pitfalls/*.md` files
2. Parse frontmatter
3. Apply filter conditions
4. Format output as table
