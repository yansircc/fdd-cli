import chalk from "chalk";
import { getPaths, isInitialized } from "../lib/config.js";
import { checkGates, formatGateResult } from "../lib/gate.js";
import { listPitfalls } from "../lib/pitfall.js";

interface ValidateOptions {
	id?: string;
}

export async function validate(options: ValidateOptions = {}): Promise<void> {
	const cwd = process.cwd();

	if (!isInitialized(cwd)) {
		console.log(chalk.red("FDD is not initialized. Run `fdd init` first."));
		return;
	}

	const paths = getPaths(cwd);
	const pitfalls = await listPitfalls(paths.pits);

	if (pitfalls.length === 0) {
		console.log(chalk.yellow("No pitfalls found."));
		return;
	}

	// Filter by ID if specified
	const toValidate = options.id
		? pitfalls.filter((p) => p.id === options.id)
		: pitfalls;

	if (options.id && toValidate.length === 0) {
		console.log(chalk.red(`Pitfall ${options.id} not found.`));
		return;
	}

	console.log(chalk.blue(`Validating ${toValidate.length} pitfall(s)...\n`));

	let passCount = 0;
	let failCount = 0;

	for (const pitfall of toValidate) {
		const result = checkGates(pitfall);

		if (result.passed) {
			passCount++;
			console.log(chalk.green(`✓ ${pitfall.id}: ${pitfall.title}`));
			if (result.warnings.length > 0) {
				for (const warning of result.warnings) {
					console.log(chalk.yellow(`    ⚠ ${warning}`));
				}
			}
		} else {
			failCount++;
			console.log(chalk.red(`✗ ${pitfall.id}: ${pitfall.title}`));
			for (const error of result.errors) {
				console.log(chalk.red(`    • ${error}`));
			}
			if (result.warnings.length > 0) {
				for (const warning of result.warnings) {
					console.log(chalk.yellow(`    ⚠ ${warning}`));
				}
			}
		}
	}

	console.log();
	console.log(chalk.gray("─".repeat(50)));

	if (failCount === 0) {
		console.log(chalk.green(`All ${passCount} pitfall(s) passed gate checks.`));
	} else {
		console.log(
			chalk.red(`${failCount} failed`) +
				chalk.gray(", ") +
				chalk.green(`${passCount} passed`),
		);
		process.exitCode = 1;
	}
}
