# Testing Rules

## Test Structure

### 单元测试

位置：`src/__tests__/`

```
src/__tests__/
├── schema.test.ts      # Zod 验证测试
├── gate.test.ts        # Gate 检查测试
├── pitfall.test.ts     # Pitfall CRUD 测试
├── config.test.ts      # 配置加载测试
├── id.test.ts          # ID 生成测试
└── trigger/
    ├── rule.test.ts
    ├── change.test.ts
    ├── dynamic.test.ts
    ├── command.test.ts
    ├── protect.test.ts
    └── ai-context.test.ts
```

### E2E 测试

位置：`tests/e2e/`

```
tests/e2e/
├── mini-project/       # 独立测试项目
│   ├── src/buggy-*.ts  # 6 个测试场景
│   └── .fdd/, .claude/ # gitignore
├── expected/           # 验证点 JSON（非完整答案）
├── fixtures/           # pit 模板
├── verify.ts           # 验证脚本
└── run-tests.md        # 测试指南
```

## 运行测试

```bash
# 单元测试
bun test

# 单个测试文件
bun test src/__tests__/schema.test.ts

# 监听模式
bun test --watch

# E2E 测试（手动）
cd tests/e2e/mini-project
rm -rf .fdd .claude
fdd init
# ... 执行测试场景
bun ../../verify.ts .fdd/pitfalls/pit-xxx.md ../../expected/pit-xxx.json
```

## 测试规范

### 命名

```typescript
describe('模块名', () => {
  describe('函数名', () => {
    it('should 预期行为', () => {});
    it('should handle 边界情况', () => {});
    it('should throw when 错误条件', () => {});
  });
});
```

### Arrange-Act-Assert

```typescript
it('should create pitfall with valid input', async () => {
  // Arrange
  const input = { title: 'Test', severity: 'medium' };

  // Act
  const result = await createPitfall(input);

  // Assert
  expect(result.id).toMatch(/^PIT-\d+$/);
  expect(result.title).toBe('Test');
});
```

### Mock 策略

- 尽量不 mock，使用真实文件系统
- 需要隔离时使用临时目录
- Mock 外部命令（如 git）

```typescript
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(path.join(tmpdir(), 'fdd-test-'));
});

afterEach(async () => {
  await rm(testDir, { recursive: true });
});
```

## E2E 测试场景

| 场景 | 文件 | 验证点 |
|------|------|--------|
| 配置保护 | `buggy-config.ts` | `pit-config-protect.json` |
| 环境检查 | `buggy-env.ts` | `pit-env-check.json` |
| Hooks 上下文 | `buggy-hooks.ts` | `pit-hooks-context.json` |
| 发布守卫 | `buggy-publish.ts` | `pit-publish-guard.json` |
| 正则错误 | `buggy-regex.ts` | `pit-regex-error.json` |
| Schema 变更 | `buggy-schema.ts` | `pit-schema-change.json` |

## 验证脚本

```bash
# 验证生成的 pit 是否包含预期字段
bun tests/e2e/verify.ts <pit-file> <expected-json>
```

expected JSON 只包含验证点，不是完整答案：

```json
{
  "trigger": { "kind": "rule" },
  "severity": "high",
  "has_evidence": true
}
```

## 测试覆盖

重点测试：
- Schema 验证边界情况
- 触发器匹配逻辑
- Gate 检查逻辑
- ID 生成唯一性
- 文件读写正确性
