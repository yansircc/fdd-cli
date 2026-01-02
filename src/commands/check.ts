import chalk from "chalk";
import { getPaths, isInitialized } from "../lib/config.js";
import { listPitfalls } from "../lib/pitfall.js";
import { type CheckResult, runTriggers } from "../lib/trigger/index.js";
import { printPassedResult, printTriggeredResult } from "./check-output.js";

interface CheckOptions {
	id?: string;
	verbose?: boolean;
}

export async function check(options: CheckOptions = {}): Promise<void> {
	const cwd = process.cwd();

	if (!isInitialized(cwd)) {
		console.log(chalk.red("FDD is not initialized. Run `fdd init` first."));
		return;
	}

	const paths = getPaths(cwd);
	const pitfalls = await listPitfalls(paths.pitfalls);

	if (pitfalls.length === 0) {
		console.log(chalk.yellow("No pitfalls found."));
		return;
	}

	// Filter by ID if specified
	const toCheck = options.id
		? pitfalls.filter((p) => p.id === options.id)
		: pitfalls;

	if (options.id && toCheck.length === 0) {
		console.log(chalk.red(`Pitfall ${options.id} not found.`));
		return;
	}

	console.log(
		chalk.blue(`Running triggers for ${toCheck.length} pitfall(s)...\n`),
	);

	const results: CheckResult[] = [];
	let triggeredCount = 0;

	for (const pitfall of toCheck) {
		const result = await runTriggers(pitfall, cwd);
		results.push(result);

		if (result.triggered) {
			triggeredCount++;
			printTriggeredResult(result, options.verbose);
		} else if (options.verbose) {
			printPassedResult(result);
		}
	}

	// Summary
	console.log();
	console.log(chalk.gray("─".repeat(50)));

	if (triggeredCount === 0) {
		console.log(
			chalk.green(`✓ No issues detected across ${toCheck.length} pitfall(s).`),
		);
	} else {
		console.log(
			chalk.red(`⚠ ${triggeredCount} pitfall(s) triggered`) +
				chalk.gray(` out of ${toCheck.length}`),
		);
		console.log();
		console.log(
			chalk.yellow("Triggered pitfalls may indicate recurring issues."),
		);
		console.log(
			chalk.yellow("Review the Action section in each pitfall for fixes."),
		);
		process.exitCode = 1;
	}
}
