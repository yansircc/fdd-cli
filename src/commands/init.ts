import {
	appendFileSync,
	existsSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { getPaths, isInitialized } from "../lib/config.js";
import { syncAllHooks } from "../lib/hooks/index.js";
import { HOOK_MARKER_START, ZSH_HOOK } from "../lib/shell-hooks.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "templates");

interface InitOptions {
	force?: boolean;
	skipHook?: boolean;
}

export async function init(options: InitOptions = {}): Promise<void> {
	const cwd = process.cwd();
	const paths = getPaths(cwd);

	// Check if already initialized
	if (isInitialized(cwd) && !options.force) {
		console.log(chalk.yellow("FDD is already initialized in this directory."));
		console.log(chalk.gray("Use --force to reinitialize."));

		// Still check and install shell hook for new users who cloned the repo
		if (!options.skipHook) {
			const hookInstalled = installShellHook();
			if (hookInstalled) {
				console.log();
				console.log(chalk.cyan("To activate command guard, run:"));
				console.log(chalk.white("  source ~/.zshrc"));
				console.log(chalk.gray("  (or open a new terminal)"));
			}
		}
		return;
	}

	console.log(chalk.blue("Initializing FDD..."));

	// Create .fdd directory structure
	await mkdir(paths.pits, { recursive: true });

	// Create .claude directories
	await mkdir(paths.claude.fddSkill, { recursive: true });

	// Copy .fdd templates
	await copyTemplate("config.yaml", paths.config);
	await copyTemplate("README.md", paths.readme);

	// Copy example pitfall (demonstrates protect trigger)
	await copyTemplate(
		"pitfall-example.md",
		join(paths.pits, "pit-000-example-protect-pitfalls.md"),
	);

	// Copy FDD skill files
	await copySkillDirectory(paths.claude.fddSkill);

	// Initialize all hooks (will be empty if no pitfalls exist)
	const hooksResult = await syncAllHooks(cwd);

	console.log(chalk.green("✓ FDD initialized successfully!"));
	console.log();
	console.log("Created:");
	console.log(chalk.gray("  .fdd/"));
	console.log(chalk.gray("    ├── pits/"));
	console.log(
		chalk.gray("    │   └── pit-000-example-protect-pitfalls.md ") +
			chalk.dim("(示例，可删除)"),
	);
	console.log(chalk.gray("    ├── config.yaml"));
	console.log(chalk.gray("    └── README.md"));
	console.log(chalk.gray("  .claude/"));
	console.log(chalk.gray("    ├── skills/"));
	console.log(chalk.gray("    │   └── fdd/"));
	console.log(chalk.gray("    │       ├── SKILL.md"));
	console.log(chalk.gray("    │       ├── stop.md"));
	console.log(chalk.gray("    │       ├── create.md"));
	console.log(chalk.gray("    │       ├── triggers.md"));
	console.log(chalk.gray("    │       ├── gates.md"));
	console.log(chalk.gray("    │       └── examples.md"));

	const anyHooksGenerated =
		hooksResult.protect.generated ||
		hooksResult.context.generated ||
		hooksResult.autocheck.generated ||
		hooksResult.guard.generated ||
		hooksResult.stop.generated;
	if (anyHooksGenerated) {
		console.log(chalk.gray("    └── hooks/"));
		if (hooksResult.stop.generated) {
			console.log(chalk.gray("        ├── fdd-stop.cjs"));
		}
		if (hooksResult.protect.generated) {
			console.log(chalk.gray("        ├── fdd-protect.cjs"));
		}
		if (hooksResult.context.generated) {
			console.log(chalk.gray("        ├── fdd-context.cjs"));
		}
		if (hooksResult.guard.generated) {
			console.log(chalk.gray("        └── fdd-guard.cjs"));
		}
	}

	// Install shell hook if not skipped
	if (!options.skipHook) {
		console.log();
		const hookInstalled = installShellHook();
		if (hookInstalled) {
			console.log();
			console.log(chalk.cyan("To activate command guard, run:"));
			console.log(chalk.white("  source ~/.zshrc"));
			console.log(chalk.gray("  (or open a new terminal)"));
		}
	}

	console.log();
	console.log("Next steps:");
	console.log(chalk.cyan("  1. Complete a fix with AI assistance"));
	console.log(
		chalk.cyan("  2. AI will auto-detect and prompt to record pitfall"),
	);
}

function installShellHook(): boolean {
	// Detect shell from SHELL env or default to zsh (macOS default)
	const shellPath = process.env.SHELL || "/bin/zsh";
	const isZsh = shellPath.includes("zsh");

	if (!isZsh) {
		console.log(
			chalk.yellow("⚠ Command guard hook only supports zsh for now."),
		);
		console.log(chalk.gray("  For bash, run: fdd install-hook --shell bash"));
		return false;
	}

	const rcPath = join(homedir(), ".zshrc");

	// Check if rc file exists
	if (!existsSync(rcPath)) {
		writeFileSync(rcPath, "", "utf-8");
	}

	// Read current rc file
	const rcContent = readFileSync(rcPath, "utf-8");

	// Check if hook already installed
	if (rcContent.includes(HOOK_MARKER_START)) {
		console.log(chalk.gray("✓ Command guard hook already installed"));
		return false;
	}

	// Append hook
	appendFileSync(rcPath, `\n${ZSH_HOOK}\n`, "utf-8");
	console.log(chalk.green("✓ Command guard hook installed in ~/.zshrc"));
	return true;
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

async function copySkillDirectory(destDir: string): Promise<void> {
	// Try multiple possible skill template locations
	const possiblePaths = [
		join(TEMPLATES_DIR, "skills", "fdd"), // src/templates (dev mode)
		join(__dirname, "..", "..", "templates", "skills", "fdd"), // templates/ (npm installed)
		join(__dirname, "..", "..", "..", "templates", "skills", "fdd"), // fallback
	];

	let srcDir: string | null = null;
	for (const path of possiblePaths) {
		if (existsSync(path)) {
			srcDir = path;
			break;
		}
	}

	if (!srcDir) {
		console.warn(chalk.yellow("Skill templates not found"));
		return;
	}

	// Copy all files in the skill directory
	const files = await readdir(srcDir);
	for (const file of files) {
		const srcPath = join(srcDir, file);
		const destPath = join(destDir, file);
		const content = await readFile(srcPath, "utf-8");
		await writeFile(destPath, content, "utf-8");
	}
}
