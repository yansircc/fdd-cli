# Coding Standards

## TypeScript

### 类型定义

- 使用 Zod 进行运行时验证
- TypeScript 类型从 Zod schema 推导

```typescript
// 推荐
const PitfallSchema = z.object({ ... });
type Pitfall = z.infer<typeof PitfallSchema>;

// 避免：手写重复类型
```

### 导入

- 使用 ES Module 语法
- 相对路径导入项目文件
- 外部依赖按字母排序

```typescript
import { existsSync } from 'node:fs';
import chalk from 'chalk';
import { z } from 'zod';

import { loadConfig } from '../lib/config';
import type { Pitfall } from '../types';
```

### 异步处理

- 优先使用 async/await
- 使用 Bun 的 fs API（如 `Bun.write`, `Bun.file`）
- 避免回调风格

### 错误处理

- 使用具体的错误消息
- 对用户输入进行验证
- 提供有用的错误提示

```typescript
// 推荐
if (!existsSync(path)) {
  console.error(chalk.red(`File not found: ${path}`));
  process.exit(1);
}

// 避免：静默失败或泛泛的错误
```

## 代码风格

### 格式化

- 使用 Biome 进行格式化和 lint
- Tab 缩进
- 运行 `bun lint` 检查

### 命名

| 类型 | 风格 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `loadConfig`, `pitfallId` |
| 类型/接口 | PascalCase | `Pitfall`, `TriggerResult` |
| 常量 | UPPER_SNAKE | `DEFAULT_CONFIG` |
| 文件 | kebab-case | `shell-hooks.ts` |

### 函数

- 单一职责
- 保持函数短小（<50 行）
- 参数超过 3 个时使用对象

```typescript
// 推荐
function createPitfall(options: CreatePitfallOptions): Promise<Pitfall>

// 避免
function createPitfall(title, severity, tags, triggers, ...): Promise<Pitfall>
```

## 输出规范

### CLI 输出

- 使用 chalk 着色
- 错误输出到 stderr
- 表格使用 cli-table3

```typescript
console.log(chalk.green('✓ Created pitfall'));
console.error(chalk.red('✗ Validation failed'));
```

### Hook 输出

- stdout: 给 Claude 看的指令
- stderr: 输出空格避免 "No stderr output" 警告

```typescript
// src/lib/hooks/stop.ts
process.stdout.write('...');  // Claude 可见
process.stderr.write(' ');    // 避免警告
```

## Schema 设计

### Zod 验证

- 为每种触发器提供具体的 schema
- 使用 discriminated union
- 提供清晰的错误消息

```typescript
const TriggerSchema = z.discriminatedUnion('kind', [
  RuleTriggerSchema,
  ChangeTriggerSchema,
  // ...
]);
```

### 可选字段

- 明确区分可选和必填
- 使用 `.optional()` 或 `.default()`
- 避免隐式默认值
