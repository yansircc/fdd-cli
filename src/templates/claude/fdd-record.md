---
description: Compile the recently completed fix into a triggerable pitfall (one-click, while context is warm)
---

## Task

You just helped the user complete a fix. Now compile this fix into a triggerable, regression-testable pitfall.

**IMPORTANT: You MUST use the `fdd record --json` command to create the pitfall. Do NOT write files directly.**

## Execution Protocol

### A. Collect Warm Context

Extract automatically from current context:
- Error symptoms (logs/screenshots/description) → `evidence.error_snippet`
- Root cause analysis → Replay section
- Fix diff → `evidence.diff_summary`
- Fix command → `evidence.command`
- Commit hash → `evidence.commit`

If critical information is missing, **ask only 1-2 clarifying questions**.

### B. Generate DRRV

- **Detect**: At least 2 strategies (ordered by cost-effectiveness)
  - If only string matching is possible, mark `strength: weak`
- **Replay**: Minimal text describing root cause
- **Remedy**: 1-3 paths, ordered by risk level
- **Verify**: Assign the highest achievable V-level (V0 > V1 > V2 > V3)

### C. Regression Test (Required)

Provide reproduction steps or waiver:
- Ideal: Executable repro steps
- If not possible: Set `waiver: true` + `waiver_reason`

### D. Edge Test (Required)

Provide at least one negative case or waiver:
- Ideal: Similar situation that should NOT trigger
- If not possible: Set `waiver: true` + `waiver_reason`

### E. Create Pitfall Using CLI

**MUST use this command format:**

```bash
fdd record --json '{
  "title": "Your pitfall title",
  "severity": "medium",
  "tags": ["tag1", "tag2"],
  "evidence": {
    "error_snippet": "Error message or symptoms",
    "command": "command that triggered it",
    "commit": "commit hash if available",
    "diff_summary": "what changed"
  },
  "detect": [
    {
      "kind": "rule",
      "tool": "grep",
      "pattern": "pattern to match",
      "scope": ["src/**"],
      "strength": "strong"
    }
  ],
  "remedy": [
    {
      "level": "low",
      "kind": "transform",
      "action": "What to do",
      "steps": ["step 1", "step 2"]
    }
  ],
  "verify": {
    "level": "V1",
    "checks": ["verification command"]
  },
  "regression": {
    "repro": ["step 1", "step 2"],
    "expected": "expected result"
  },
  "edge": {
    "negative_case": ["case that should NOT trigger"],
    "expected": "expected behavior"
  }
}'
```

### F. Verify Result

After running `fdd record --json`, the CLI will output:
- `success: true/false`
- `id`: The generated pitfall ID
- `warnings`: Any gate warnings

If creation fails, fix the issues and retry.

## Gate Checks (Automatic)

The CLI automatically validates:
- [ ] Evidence exists (error_snippet or command)
- [ ] Regression exists (or has waiver + reason)
- [ ] Edge exists (or has waiver + reason)
- [ ] Weak detectors are marked

## Why Use CLI Instead of Direct File Write?

1. **Automatic ID generation** - Ensures unique, sequential IDs
2. **Gate validation** - Catches missing required fields immediately
3. **Consistent formatting** - Correct YAML frontmatter structure
4. **JSON output** - Easy to verify success/failure

## Verify Levels

- V0 (test/type/build) → highest priority
- V1 (rules: lint/grep/AST)
- V2 (evidence existence)
- V3 (structured self-proof) → last resort
