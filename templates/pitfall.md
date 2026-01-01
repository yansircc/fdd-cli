---
id: PIT-XXX
title: "[Pitfall title]"
severity: medium
tags: []
created: YYYY-MM-DD

evidence:
  error_snippet: |
    [Paste error log here]
  commit: ""
  command: ""
  env_fingerprint: {}
  diff_summary: |
    [Summary of changes]

detect:
  - kind: rule
    tool: grep
    pattern: ""
    scope: ["src/**"]
    exclude: []
    strength: strong

remedy:
  - level: low
    kind: transform
    action: ""
    steps: []

verify:
  level: V1
  checks: []
  fallback:
    level: V3
    self_proof: []

regression:
  repro: []
  expected: ""
  # waiver: false
  # waiver_reason: ""

edge:
  negative_case: []
  expected: ""
  # waiver: false
  # waiver_reason: ""
---

# Detect

[Describe how to detect this issue]

# Replay

[Describe how the issue occurred and its root cause]

# Remedy

[Describe the fix steps]

# Verify

[Describe how to verify the fix succeeded]
