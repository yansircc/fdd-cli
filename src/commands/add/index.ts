import chalk from "chalk";
import { isInitialized } from "../../lib/config.js";
import { addFromJson } from "./json-mode.js";
import type { AddOptions } from "./types.js";

export type { AddOptions };

export async function add(options: AddOptions): Promise<void> {
	const cwd = process.cwd();

	if (!isInitialized(cwd)) {
		console.log(chalk.red("FDD is not initialized. Run `fdd init` first."));
		return;
	}

	if (!options.json) {
		console.log(chalk.red("--json option is required."));
		console.log(chalk.gray("Usage: fdd add --json '<JSON>'"));
		return;
	}

	try {
		await addFromJson(cwd, options.json);
	} catch (error) {
		console.log(chalk.red("Failed to add pitfall:"));
		console.log(chalk.red((error as Error).message));
	}
}
