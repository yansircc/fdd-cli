import { existsSync, readdirSync } from "node:fs";
import chalk from "chalk";
import { getPaths } from "../lib/config.js";
import { startServer } from "../lib/ui/index.js";

interface UiOptions {
	port?: number;
	noOpen?: boolean;
}

export async function ui(options: UiOptions = {}): Promise<void> {
	const cwd = process.cwd();
	const paths = getPaths(cwd);

	// Check if specs directory exists and has content
	if (!existsSync(paths.specs)) {
		console.error(chalk.red("Error: No specs found."));
		console.error(chalk.gray(`  Directory not found: ${paths.specs}`));
		console.error();
		console.error("Run an Interview first to create specs:");
		console.error(chalk.cyan("  /fdd Interview"));
		process.exit(1);
	}

	// Check if specs directory has subdirectories (actual specs)
	const entries = readdirSync(paths.specs, { withFileTypes: true });
	const specDirs = entries.filter((e) => e.isDirectory());

	if (specDirs.length === 0) {
		console.error(chalk.red("Error: No specs found."));
		console.error(chalk.gray(`  ${paths.specs} is empty`));
		console.error();
		console.error("Run an Interview first to create specs:");
		console.error(chalk.cyan("  /fdd Interview"));
		process.exit(1);
	}

	console.log(chalk.blue(`Found ${specDirs.length} spec(s)`));

	// Start server
	await startServer(cwd, {
		port: options.port,
		open: !options.noOpen,
	});
}
