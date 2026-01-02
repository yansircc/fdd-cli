import chalk from "chalk";
import { getPaths, isInitialized } from "../lib/config.js";
import { listPitfalls } from "../lib/pitfall.js";
import { checkCommandAgainstTriggers } from "../lib/trigger/index.js";

interface GuardOptions {
	quiet?: boolean;
}

/**
 * Check if a command should be blocked by any pitfall's command trigger
 * This is called by the shell hook before executing user commands
 *
 * Exit codes:
 *   0 - Command is allowed (no matching command trigger)
 *   1 - Command is blocked (matching command trigger with action=block)
 *   2 - Command has warning (matching command trigger with action=warn)
 */
export async function guard(
	command: string,
	options: GuardOptions = {},
): Promise<void> {
	const cwd = process.cwd();

	// If FDD is not initialized in current directory, allow all commands
	if (!isInitialized(cwd)) {
		process.exit(0);
	}

	const paths = getPaths(cwd);
	const pitfalls = await listPitfalls(paths.pitfalls);

	if (pitfalls.length === 0) {
		process.exit(0);
	}

	const result = checkCommandAgainstTriggers(command, pitfalls);

	if (!result.blocked) {
		process.exit(0);
	}

	// Command matched a trigger
	const { pitfall, trigger, action, message } = result;

	if (!pitfall || !trigger) {
		process.exit(0);
	}

	if (action === "warn") {
		// Warning mode: show message but allow command to proceed
		if (!options.quiet) {
			console.error();
			console.error(chalk.yellow("⚠️  FDD WARNING: ") + chalk.bold(pitfall.id));
			console.error(chalk.yellow("   ") + pitfall.title);
			console.error();

			if (message) {
				console.error(chalk.gray(`   ${message}`));
				console.error();
			}

			// Show action hints
			if (pitfall.action && pitfall.action.length > 0) {
				const act = pitfall.action[0];
				console.error(chalk.gray("   Action:"));
				if (act.action) {
					console.error(chalk.gray(`   → ${act.action}`));
				}
				if (act.steps) {
					for (const step of act.steps.slice(0, 3)) {
						console.error(chalk.gray(`   • ${step}`));
					}
				}
				console.error();
			}
		}
		process.exit(2); // Warning exit code
	}

	// Block mode: prevent command execution
	if (!options.quiet) {
		console.error();
		console.error(chalk.red("🚫 FDD BLOCKED: ") + chalk.bold(pitfall.id));
		console.error(chalk.red("   ") + pitfall.title);
		console.error();

		if (message) {
			console.error(chalk.white(`   ${message}`));
			console.error();
		}

		// Show action
		if (pitfall.action && pitfall.action.length > 0) {
			console.error(chalk.cyan("   Action:"));
			const act = pitfall.action[0];
			if (act.action) {
				console.error(chalk.cyan(`   → ${act.action}`));
			}
			if (act.steps) {
				for (const step of act.steps) {
					console.error(chalk.white(`   • ${step}`));
				}
			}
			console.error();
		}

		// Show root cause
		if (pitfall.replay?.root_cause) {
			console.error(chalk.gray(`   Root cause: ${pitfall.replay.root_cause}`));
			console.error();
		}
	}

	process.exit(1); // Block exit code
}
