# CDD 收敛状态

> 若进展不可证明为单调，则收敛不可相信。

## 收敛指标

| 指标 | 收敛方向 |
|------|----------|
| Unresolved Count | ↓ 减少 |
| Validator Coverage | ↑ 增加 |
| Change Radius | ↓ 减少 |
| Reversibility | ↑ 增加 |

**每次交互必须改善至少一个指标，否则停止并报告原因。**

## 收敛状态

| 状态 | 条件 | Merge |
|------|------|-------|
| CONVERGING | 指标在改善 | ❌ |
| BLOCKED | 无法继续 | ❌ |
| READY | UC=0, Coverage≥90% | ✅ |

## 03-convergence.md 模板

```markdown
# Convergence — {feature}

## Status: CONVERGING | BLOCKED | READY

| 指标 | 当前 | 目标 |
|------|------|------|
| Unresolved | 2 | 0 |
| Coverage | 85% | ≥90% |
| Reversible | Yes | Yes |

## Blocking Issues
1. UC-01: 锁定解锁（待产品）
2. UC-02: Token 刷新（待安全）

## Merge Allowed: ❌ NO

Required:
- [ ] 解决 UC-01
- [ ] 解决 UC-02

## Progress
| Date | Action | Δ UC | Δ Cov |
|------|--------|------|-------|
| 01-03 | 初始化 | +10 | 0% |
| 01-03 | 添加验证器 | -8 | +85% |
```

## Merge 决策

```
IF unresolved > 0 → NO
ELSE IF coverage < 90% → NO
ELSE → YES
```
