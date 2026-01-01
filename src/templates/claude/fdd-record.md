---
description: Compile the recently completed fix into a triggerable pitfall (one-click, while context is warm)
---

# STOP - READ THIS FIRST

> **YOU MUST USE `fdd record --json '...'` COMMAND.**
>
> **DO NOT WRITE FILES DIRECTLY. DO NOT USE Write/Edit TOOLS FOR PITFALL FILES.**
>
> The CLI handles ID generation, gate validation, and formatting automatically.

---

## Task

Compile the recently completed fix into a triggerable, regression-testable pitfall.

## Execution Protocol

### Step 1: Collect Context

Extract from current conversation:

| Field | Source |
|-------|--------|
| `evidence.error_snippet` | Error logs/symptoms |
| `evidence.diff_summary` | Fix diff |
| `evidence.command` | Triggering command |
| `evidence.commit` | Commit hash (if available) |

If critical info is missing, ask **1-2 clarifying questions max**.

### Step 2: Build JSON Structure

```json
{
  "title": "Short descriptive title",
  "severity": "high",
  "tags": ["category1", "category2"],
  "evidence": {
    "error_snippet": "What went wrong",
    "diff_summary": "What changed to fix it"
  },
  "detect": [
    {
      "kind": "rule",
      "tool": "grep",
      "pattern": "regex pattern",
      "scope": ["src/**/*.tsx"],
      "strength": "strong"
    }
  ],
  "remedy": [
    {
      "level": "low",
      "kind": "transform",
      "action": "How to fix",
      "steps": ["Step 1", "Step 2"]
    }
  ],
  "verify": {
    "level": "V1",
    "checks": ["command to verify fix"]
  },
  "regression": {
    "repro": ["Step to reproduce"],
    "expected": "What happens when bug exists"
  },
  "edge": {
    "negative_case": ["Similar case that should NOT trigger"],
    "expected": "Why it's different"
  }
}
```

### Step 3: Execute CLI Command

```bash
fdd record --json '<your JSON here>'
```

**Example:**

```bash
fdd record --json '{"title":"Collection.state.values() not reactive","severity":"high","tags":["tanstack-db","react"],"evidence":{"error_snippet":"Page shows empty data but DB has records"},"detect":[{"kind":"rule","tool":"grep","pattern":"\\.state\\.values\\(\\)","scope":["src/routes/**/*.tsx"],"strength":"strong"}],"remedy":[{"level":"low","kind":"transform","action":"Use useLiveQuery instead","steps":["Import useLiveQuery","Replace state.values() call"]}],"verify":{"level":"V1","checks":["rg state.values src/routes/"]},"regression":{"repro":["Create component using .state.values()","Refresh page"],"expected":"Empty data displayed"},"edge":{"negative_case":["Using .state.values() in non-React code"],"expected":"Valid use case, should not trigger"}}'
```

### Step 4: Verify Output

CLI returns:
```json
{
  "success": true,
  "id": "PIT-003",
  "path": ".fdd/pitfalls/pit-003-short-title.md",
  "warnings": []
}
```

If `success: false`, fix the errors and retry.

---

## Field Reference

### severity
`critical` | `high` | `medium` | `low`

### detect[].kind
`rule` (static analysis) | `change` (git-based) | `dynamic` (runtime)

### detect[].strength
`strong` (reliable) | `weak` (may have false positives)

### remedy[].level
`low` (safe) | `medium` (moderate risk) | `high` (risky)

### remedy[].kind
`transform` (code change) | `read` (documentation) | `run` (command)

### verify.level
`V0` (test/type/build) | `V1` (lint/grep) | `V2` (evidence) | `V3` (self-proof)

### Waivers

If regression or edge cannot be provided:
```json
{
  "regression": {
    "repro": [],
    "expected": "",
    "waiver": true,
    "waiver_reason": "Why reproduction is not possible"
  }
}
```

---

## Why CLI, Not Direct File Write?

| Direct Write | CLI |
|--------------|-----|
| ❌ Manual ID generation | ✅ Automatic sequential ID |
| ❌ No validation | ✅ Gate checks before write |
| ❌ Format errors | ✅ Correct YAML frontmatter |
| ❌ Silent failures | ✅ Clear success/error output |
