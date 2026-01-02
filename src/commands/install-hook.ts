import {
	appendFileSync,
	existsSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import chalk from "chalk";
import {
	HOOK_MARKER_END,
	HOOK_MARKER_START,
	type ShellType,
	getHookScript,
	getRcFile,
} from "../lib/shell-hooks.js";

interface InstallHookOptions {
	shell?: ShellType;
	uninstall?: boolean;
}

export async function installHook(
	options: InstallHookOptions = {},
): Promise<void> {
	const shell = options.shell || "zsh";
	const rcFile = getRcFile(shell);
	const rcPath = join(homedir(), rcFile);

	if (options.uninstall) {
		await uninstallHook(rcPath, rcFile);
		return;
	}

	// Check if rc file exists
	if (!existsSync(rcPath)) {
		console.log(chalk.yellow(`${rcFile} not found at ${rcPath}`));
		console.log(chalk.yellow(`Creating ${rcFile}...`));
		writeFileSync(rcPath, "", "utf-8");
	}

	// Read current rc file
	const rcContent = readFileSync(rcPath, "utf-8");

	// Check if hook already installed
	if (rcContent.includes(HOOK_MARKER_START)) {
		console.log(chalk.yellow(`FDD hook already installed in ${rcFile}`));
		console.log(
			chalk.gray(
				"Use --uninstall to remove it first if you want to reinstall.",
			),
		);
		return;
	}

	// Append hook
	const hookContent = getHookScript(shell);
	appendFileSync(rcPath, `\n${hookContent}\n`, "utf-8");

	console.log(chalk.green(`✓ FDD command guard installed in ~/${rcFile}`));
	console.log();
	console.log(chalk.cyan("To activate, run:"));
	console.log(chalk.white(`  source ~/${rcFile}`));
	console.log();
	console.log(chalk.gray("Or open a new terminal window."));
	console.log();
	console.log(
		chalk.gray("The hook will automatically check for .fdd/ in your project"),
	);
	console.log(
		chalk.gray("and block commands matching 'command' type triggers."),
	);
}

async function uninstallHook(rcPath: string, rcFile: string): Promise<void> {
	if (!existsSync(rcPath)) {
		console.log(chalk.yellow(`${rcFile} not found at ${rcPath}`));
		return;
	}

	const rcContent = readFileSync(rcPath, "utf-8");

	if (!rcContent.includes(HOOK_MARKER_START)) {
		console.log(chalk.yellow(`FDD hook not found in ${rcFile}`));
		return;
	}

	// Remove hook content between markers (including markers and surrounding newlines)
	const startIdx = rcContent.indexOf(HOOK_MARKER_START);
	const endIdx = rcContent.indexOf(HOOK_MARKER_END) + HOOK_MARKER_END.length;

	// Also remove surrounding newlines
	let removeStart = startIdx;
	let removeEnd = endIdx;

	if (removeStart > 0 && rcContent[removeStart - 1] === "\n") {
		removeStart--;
	}
	if (removeEnd < rcContent.length && rcContent[removeEnd] === "\n") {
		removeEnd++;
	}

	const newContent =
		rcContent.slice(0, removeStart) + rcContent.slice(removeEnd);
	writeFileSync(rcPath, newContent, "utf-8");

	console.log(chalk.green(`✓ FDD command guard removed from ~/${rcFile}`));
	console.log();
	console.log(chalk.cyan("To apply changes, run:"));
	console.log(chalk.white(`  source ~/${rcFile}`));
	console.log();
	console.log(chalk.gray("Or open a new terminal window."));
}
