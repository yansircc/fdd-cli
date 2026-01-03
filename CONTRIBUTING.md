# Contributing to FDD CLI

## Development Setup

```bash
# Clone and install
git clone https://github.com/user/fdd-cli.git
cd fdd-cli
bun install

# Development
bun dev <command>     # Run CLI in dev mode
bun test              # Run tests
bun test --watch      # Watch mode
bun lint              # Lint check
bun lint:fix          # Auto-fix lint issues

# Build
bun build             # Build to dist/ + copy templates
```

## Project Structure

```
fdd-cli/
├── src/
│   ├── index.ts           # CLI entry (commander.js)
│   ├── types/             # TypeScript type definitions
│   ├── commands/          # CLI command handlers
│   │   ├── init.ts
│   │   ├── add/           # Add pitfall command
│   │   ├── list.ts
│   │   ├── check.ts
│   │   ├── validate.ts
│   │   ├── guard.ts
│   │   └── install-hook.ts
│   ├── lib/               # Core business logic
│   │   ├── config.ts      # Config loading
│   │   ├── pitfall.ts     # Pitfall CRUD
│   │   ├── schema.ts      # Zod validation schemas
│   │   ├── gate.ts        # Gate checks
│   │   ├── id.ts          # ID generation
│   │   ├── shell-hooks.ts # Shell hook scripts
│   │   ├── trigger/       # Trigger implementations
│   │   └── hooks/         # Claude Code hook generators
│   ├── templates/         # Template source files
│   └── __tests__/         # Unit tests
├── tests/e2e/             # E2E tests
├── templates/             # Built templates (don't edit directly)
└── dist/                  # Build output
```

## Architecture

### Layers

- **Commands** (`src/commands/`) - Parse arguments, call lib functions, format output
- **Library** (`src/lib/`) - Core business logic, modular and testable
- **Types** (`src/types/`) - TypeScript interfaces and Zod schemas

### Trigger System

Each trigger type is independently implemented in `src/lib/trigger/`:

| File | Trigger Kind | Purpose |
|------|--------------|---------|
| `rule.ts` | `rule` | Grep pattern matching |
| `change.ts` | `change` | Git file change detection |
| `dynamic.ts` | `dynamic` | Shell command execution |
| `command.ts` | `command` | Command interception |
| `protect.ts` | `protect` | File protection |
| `ai-context.ts` | `ai-context` | AI context injection |

### Hooks System

Claude Code hooks are generated in `src/lib/hooks/`:

| File | Hook Type | Purpose |
|------|-----------|---------|
| `stop.ts` | Stop | Prompt after file edits |
| `context.ts` | Context | Inject AI reminders |
| `protect.ts` | Protect | Block AI file edits |
| `guard.ts` | Guard | Intercept bash commands |

## Common Tasks

### Adding a New Trigger Type

1. Add type to `src/lib/trigger/types.ts`
2. Create `src/lib/trigger/{kind}.ts`
3. Register in `src/lib/trigger/index.ts`
4. Add Zod schema to `src/lib/schema.ts`
5. Add tests to `src/__tests__/trigger/{kind}.test.ts`

### Adding a New Hook Type

1. Create generator in `src/lib/hooks/{type}.ts`
2. Register in `src/lib/hooks/index.ts`
3. Update `src/lib/hooks/settings.ts`

### Modifying Pitfall Structure

1. Update types in `src/types/index.ts`
2. Update Zod schema in `src/lib/schema.ts`
3. Update skill files in `src/templates/skills/fdd/`
4. Run `bun build` to copy templates

## Testing

### Unit Tests

Located in `src/__tests__/`. Run with `bun test`.

Focus on:
- Schema validation edge cases
- Trigger matching logic
- Gate check logic
- ID generation uniqueness

### E2E Tests

Located in `tests/e2e/`. Manual execution:

```bash
cd tests/e2e/mini-project
rm -rf .fdd .claude
fdd init
# ... run test scenarios
bun ../../verify.ts .fdd/pits/pit-xxx.md ../../expected/pit-xxx.json
```

## Code Style

- **Formatter**: Biome (tab indentation)
- **Linter**: Biome
- **Types**: Zod for runtime validation, infer TypeScript types

Run `bun lint` before committing.

## Important Notes

- Edit `src/templates/`, not `templates/` (build output)
- Hook stdout goes to Claude, stderr should output space to avoid warnings
- E2E test artifacts (`mini-project/.fdd/`) are gitignored
