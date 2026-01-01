---
description: Compile the recently completed fix into a triggerable pitfall (one-click, while context is warm)
---

## Task

You just helped the user complete a fix. Now compile this fix into a triggerable, regression-testable pitfall.

**Complete in one action — write directly and notify the user.**

## Execution Protocol

### A. Collect Warm Context

Extract automatically from current context:
- Error symptoms (logs/screenshots/description) → store in `evidence.error_snippet`
- Root cause analysis → store in Replay section
- Fix diff → store in `evidence.diff_summary`
- Fix command → store in `evidence.command`
- Commit hash → store in `evidence.commit`

If critical information is missing, **ask only 1-2 clarifying questions**.

### B. Generate DRRV

- **Detect**: At least 2 strategies (ordered by cost-effectiveness, not by category)
  - If only string matching is possible, mark `strength: weak`
- **Replay**: Minimal text describing root cause
- **Remedy**: 1-3 paths, ordered by risk level
  - Reference related Rules if applicable
- **Verify**: Assign the highest achievable V-level (V0 > V1 > V2 > V3)

### C. Regression Test (Required)

Provide a way to "intentionally reproduce" the issue to verify detector effectiveness.
- Ideal: Executable repro steps/script
- Acceptable: Simulated input or minimal change to trigger detector
- If reproduction is not possible:
  - Set `waiver: true` + `waiver_reason`
  - Downgrade verify to V3
  - Note "non-regression risk"

### D. Edge Test (Required)

Provide at least one negative case: a similar situation that should NOT trigger the detector.
- Provide differentiation strategy (scope/regex/path whitelist)
- If design is not possible: `waiver: true` + `waiver_reason`

### E. Write and Notify

1. Execute gate checks
2. Generate pitfall file
3. Write to `.fdd/pitfalls/`
4. Output notification:
   - Pitfall ID and title
   - File path
   - Key information summary (severity, detect strategies, verify level)
   - If waiver exists, highlight the reason
   - If warnings exist (e.g., weak detector), suggest improvements

## Gate Checks

Before writing, verify:
- [ ] Evidence exists (error_snippet or command)
- [ ] Regression exists (or has waiver + reason)
- [ ] Edge exists (or has waiver + reason)
- [ ] Weak detectors are marked with `strength: weak`

If any check fails → **reject write**, prompt for completion.

## Verify Levels

- V0 (test/type/build) → highest priority
- V1 (rules: lint/grep/AST)
- V2 (evidence existence)
- V3 (structured self-proof) → last resort

## Detect Priority Principle

> **Order by cost-effectiveness, not by category: lowest cost + highest accuracy first.**
> Static/change-based detection is usually cheaper, but if the issue is inherently about dynamic contracts, prioritize dynamic detection.
