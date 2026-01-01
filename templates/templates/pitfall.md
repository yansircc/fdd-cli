---
id: PIT-XXX
title: "[坑位标题]"
severity: medium
tags: []
created: YYYY-MM-DD

evidence:
  error_snippet: |
    [粘贴错误日志]
  commit: ""
  command: ""
  env_fingerprint: {}
  diff_summary: |
    [变更摘要]

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

# Detect（抓现行）

[描述如何检测这个问题]

# Replay（放回放）

[描述问题是如何发生的，根因是什么]

# Remedy（给方案）

[描述修复步骤]

# Verify（过安检）

[描述如何验证修复成功]
