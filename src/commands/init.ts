import {
	appendFileSync,
	existsSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { getPaths, isInitialized } from "../lib/config.js";

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
		join(paths.claude.commands, "fdd-record.md"),
	);
	await copyTemplate(
		"claude/fdd-list.md",
		join(paths.claude.commands, "fdd-list.md"),
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
		chalk.cyan("  2. Run /fdd-record (in Claude) or fdd record (in terminal)"),
	);
}

// Shell hook constants and installation
const HOOK_MARKER_START = "# >>> FDD Command Guard >>>";
const HOOK_MARKER_END = "# <<< FDD Command Guard <<<";

const ZSH_HOOK = `${HOOK_MARKER_START}
# FDD (Failure-Driven Development) command guard
# Automatically blocks dangerous commands defined in .fdd/pitfalls/
# Uninstall: fdd install-hook --uninstall

__fdd_preexec() {
  # Skip if command is empty or starts with space (private command)
  [[ -z "$1" ]] && return 0
  [[ "$1" == " "* ]] && return 0

  # Skip fdd commands to avoid recursion
  [[ "$1" == fdd* ]] && return 0

  # Check if .fdd directory exists in current or parent directories
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -d "$dir/.fdd" ]]; then
      # Run guard check
      fdd guard "$1" 2>&1
      local exit_code=$?

      if [[ $exit_code -eq 1 ]]; then
        # Blocked - return false to prevent command execution
        return 1
      elif [[ $exit_code -eq 2 ]]; then
        # Warning - allow command but user saw warning
        return 0
      fi
      break
    fi
    dir="$(dirname "$dir")"
  done
  return 0
}

# Add to preexec hook array (works with other hooks)
autoload -Uz add-zsh-hook
add-zsh-hook preexec __fdd_preexec
${HOOK_MARKER_END}`;

function installShellHook(): boolean {
	// Detect shell from SHELL env or default to zsh (macOS default)
	const shellPath = process.env.SHELL || "/bin/zsh";
	const isZsh = shellPath.includes("zsh");

	if (!isZsh) {
		console.log(
			chalk.yellow("⚠ Command guard hook only supports zsh for now."),
		);
		console.log(
			chalk.gray("  For bash, manually add fdd guard to your workflow."),
		);
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
