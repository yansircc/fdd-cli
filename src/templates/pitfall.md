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

trigger:
  - kind: rule
    tool: grep
    pattern: ""
    scope: ["src/**"]
    exclude: []
    strength: strong

replay:
  root_cause: "[Root cause of the issue - required]"
  trigger_condition: ""
  affected_scope: []

action:
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

# Trigger

[Describe how to trigger/detect this issue]

# Replay

[Describe how the issue occurred and its root cause]

# Action

[Describe the fix steps]

# Verify

[Describe how to verify the fix succeeded]
