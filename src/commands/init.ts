import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { getPaths, isInitialized } from "../lib/config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "templates");

interface InitOptions {
	force?: boolean;
}

export async function init(options: InitOptions = {}): Promise<void> {
	const cwd = process.cwd();
	const paths = getPaths(cwd);

	// Check if already initialized
	if (isInitialized(cwd) && !options.force) {
		console.log(chalk.yellow("FDD is already initialized in this directory."));
		console.log(chalk.gray("Use --force to reinitialize."));
		return;
	}

	console.log(chalk.blue("Initializing FDD..."));

	// Create .fdd directory structure
	await mkdir(paths.pitfalls, { recursive: true });
	await mkdir(paths.rules, { recursive: true });

	// Create .claude directories
	await mkdir(paths.claude.commands, { recursive: true });
	await mkdir(paths.claude.rules, { recursive: true });

	// Copy templates
	await copyTemplate("config.yaml", paths.config);
	await copyTemplate("README.md", paths.readme);
	await copyTemplate("pitfall.md", join(paths.pitfalls, "_template.md"));
	await copyTemplate("rule.md", join(paths.rules, "_template.md"));

	// Copy Claude commands
	await copyTemplate(
		"claude/fdd-record.md",
		join(paths.claude.commands, "fdd-record.md")
	);
	await copyTemplate(
		"claude/fdd-list.md",
		join(paths.claude.commands, "fdd-list.md")
	);
	await copyTemplate("claude/fdd.md", join(paths.claude.rules, "fdd.md"));

	console.log(chalk.green("✓ FDD initialized successfully!"));
	console.log();
	console.log("Created:");
	console.log(chalk.gray("  .fdd/"));
	console.log(chalk.gray("    ├── pitfalls/"));
	console.log(chalk.gray("    │   └── _template.md"));
	console.log(chalk.gray("    ├── rules/"));
	console.log(chalk.gray("    │   └── _template.md"));
	console.log(chalk.gray("    ├── config.yaml"));
	console.log(chalk.gray("    └── README.md"));
	console.log(chalk.gray("  .claude/"));
	console.log(chalk.gray("    ├── commands/"));
	console.log(chalk.gray("    │   ├── fdd-record.md"));
	console.log(chalk.gray("    │   └── fdd-list.md"));
	console.log(chalk.gray("    └── rules/"));
	console.log(chalk.gray("        └── fdd.md"));
	console.log();
	console.log("Next steps:");
	console.log(chalk.cyan("  1. Complete a fix with AI assistance"));
	console.log(
		chalk.cyan("  2. Run /fdd-record (in Claude) or fdd record (in terminal)")
	);
}

async function copyTemplate(name: string, dest: string): Promise<void> {
	// Try multiple possible template locations
	const possiblePaths = [
		join(TEMPLATES_DIR, name), // src/templates (dev mode)
		join(__dirname, "..", "..", "templates", name), // templates/ (npm installed)
		join(__dirname, "..", "..", "..", "templates", name), // fallback
	];

	for (const src of possiblePaths) {
		if (existsSync(src)) {
			const content = await readFile(src, "utf-8");
			await writeFile(dest, content, "utf-8");
			return;
		}
	}

	console.warn(chalk.yellow(`Template not found: ${name}`));
}
