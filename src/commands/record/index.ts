import chalk from "chalk";
import { getPaths, isInitialized, loadConfig } from "../../lib/config.js";
import { recordInteractive } from "./interactive.js";
import { recordFromJson } from "./json-mode.js";
import type { RecordOptions } from "./types.js";

export type { RecordOptions };

export async function record(
	title: string | undefined,
	options: RecordOptions = {},
): Promise<void> {
	const cwd = process.cwd();

	if (!isInitialized(cwd)) {
		console.log(chalk.red("FDD is not initialized. Run `fdd init` first."));
		return;
	}

	const paths = getPaths(cwd);
	const config = await loadConfig(cwd);

	// Non-interactive JSON mode for AI agents
	if (options.json) {
		await recordFromJson(paths.pitfalls, options.json);
		return;
	}

	try {
		await recordInteractive(title, options, config, paths.pitfalls);
	} catch (error) {
		// Handle Ctrl+C gracefully
		if ((error as Error).name === "ExitPromptError") {
			console.log(chalk.gray("\nCancelled."));
			return;
		}
		console.log();
		console.log(chalk.red("Failed to record pitfall:"));
		console.log(chalk.red((error as Error).message));
	}
}
