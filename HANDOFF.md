# FDD CLI 重构 Handoff 文档

## 背景

用户希望对 FDD CLI 进行现代化重构：
1. **模块化** - 消灭巨石文件
2. **压缩文档** - 减少 AI context 占用
3. **移除 fdd-list** - Claude 命令已废弃
4. **DRRV → TRAV** - 核心概念重命名

## 已完成的工作

### Phase 1: Shell Hooks 提取 ✅

**新增文件:**
- `src/lib/shell-hooks.ts` - 共享的 shell hook 常量和工具函数

**修改文件:**
- `src/commands/init.ts` - 使用共享模块，移除重复代码
- `src/commands/install-hook.ts` - 使用共享模块

### Phase 2: DRRV → TRAV 重命名 ✅

**术语变更:**
| 旧 | 新 |
|---|---|
| `detect` | `trigger` |
| `remedy` | `action` |
| `DetectRule` | `TriggerRule` |
| `RemedyPath` | `ActionPath` |
| `DetectorStrength` | `TriggerStrength` |
| `DetectorKind` | `TriggerKind` |
| `runDetectors` | `runTriggers` |

**修改文件:**
- `src/types/index.ts` - 所有类型重命名
- `src/lib/detector.ts` → `src/lib/trigger.ts` - 重命名并更新
- `src/lib/gate.ts` - 更新字段引用
- `src/lib/pitfall.ts` - 更新 section 格式化
- `src/commands/record.ts` - 更新变量名和提示
- `src/commands/check.ts` - 更新导入和输出
- `src/commands/guard.ts` - 更新引用
- `src/index.ts` - 更新 CLI 描述
- `src/__tests__/gate.test.ts` - 更新测试

### Phase 3: 移除 fdd-list + 更新模板 ✅

**删除文件:**
- `src/templates/claude/fdd-list.md`
- `templates/claude/fdd-list.md`

**更新模板:**
- `src/templates/pitfall.md` - TRAV 术语
- `templates/pitfall.md` - TRAV 术语
- `src/templates/claude/fdd.md` - 移除 fdd-list 引用
- `templates/claude/fdd.md` - 移除 fdd-list 引用

**更新:**
- `src/commands/init.ts` - 移除 fdd-list.md 复制逻辑

## 待完成的工作

### Phase 4: 模块化大文件 🔲

根据计划文件 `/Users/yansir/.claude/plans/gleaming-soaring-beaver.md`:

#### 4.1 拆分 record.ts (370 行)
```
src/commands/record/
├── index.ts           # 主入口 (~30 行)
├── interactive.ts     # 交互式提示 (~250 行)
├── json-mode.ts       # JSON 模式 (~40 行)
└── types.ts           # RecordOptions (~10 行)
```

#### 4.2 拆分 trigger.ts (326 行)
```
src/lib/trigger/
├── index.ts           # 导出 runTriggers (~30 行)
├── types.ts           # TriggerResult 接口 (~20 行)
├── rule.ts            # runRuleTrigger (~70 行)
├── change.ts          # runChangeTrigger (~45 行)
├── dynamic.ts         # runDynamicTrigger (~35 行)
└── command.ts         # runCommandTrigger + guard (~80 行)
```

#### 4.3 提取 check-output.ts
```
src/commands/
├── check.ts           # 主逻辑 (~60 行)
└── check-output.ts    # 输出格式化 (~60 行)
```

### Phase 5: 压缩文档 🔲

#### 5.1 fdd-record.md (435 → ~200 行)
- 当前路径: `src/templates/claude/fdd-record.md`
- 合并示例 A-I 为紧凑表格
- 移除冗余解释
- 字段参考合并为表格格式
- **重要**: 需要同时更新 DRRV → TRAV 术语

#### 5.2 README.md (201 → ~100 行)
- 合并命令文档为表格
- 移除详细示例
- **需要**: 更新 DRRV Protocol → TRAV Protocol

#### 5.3 .claude/CLAUDE.md (~80 行)
- 本地文件，在 .gitignore 中
- 移除代码示例
- 精简项目结构

## 关键发现

### 模板位置
项目有两个模板目录，需要同步更新：
- `src/templates/` - 源码模板
- `templates/` - 分发模板

### fdd-record.md 最大
这是最大的模板文件（435 行），包含：
- 7 步 pitfall 记录协议
- 问题类型决策树
- 9 个示例 (A-I)
- 字段参考
- 检查清单

**压缩策略:**
1. 将示例合并为表格 + 代码片段
2. 移除 "Why CLI, Not Direct File Write?" 章节
3. 使用更紧凑的格式

### 测试状态
所有 65 个测试通过，lint 检查通过。

## 文件清单

### 源码结构 (更新后)
```
src/
├── index.ts                    # CLI 入口
├── types/index.ts              # 类型定义 (TRAV)
├── commands/
│   ├── init.ts                 # 初始化
│   ├── record.ts               # 记录 (待拆分)
│   ├── list.ts                 # 列表 (保留 CLI)
│   ├── validate.ts             # 验证
│   ├── check.ts                # 检查 (待拆分)
│   ├── guard.ts                # 命令守卫
│   └── install-hook.ts         # Hook 安装
├── lib/
│   ├── config.ts               # 配置
│   ├── pitfall.ts              # Pitfall 操作
│   ├── gate.ts                 # 门禁检查
│   ├── id.ts                   # ID 生成
│   ├── trigger.ts              # 触发器 (待拆分)
│   └── shell-hooks.ts          # Shell hook 共享
└── templates/
    ├── pitfall.md              # Pitfall 模板
    ├── claude/
    │   ├── fdd-record.md       # 记录命令 (待压缩)
    │   └── fdd.md              # 规则文件
    └── ...
```

## 注意事项

1. **保持 CLI list 命令** - 用户只要求移除 Claude `/fdd-list` 命令，CLI `fdd list` 保留
2. **无需迁移** - 用户确认没有现有的 pitfall 文件需要迁移
3. **模板同步** - 更新 `src/templates/` 后需同步到 `templates/`
4. **cp 命令问题** - 使用 Write 工具直接更新，避免交互式 cp 确认

## 运行命令

```bash
# 开发测试
bun dev <command>

# 运行测试
bun test

# Lint 检查
bun lint

# 构建
bun build
```
