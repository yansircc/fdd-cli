import chalk from "chalk";
import { getPaths, isInitialized } from "../lib/config.js";
import { listPitfalls } from "../lib/pitfall.js";
import { type CheckResult, runTriggers } from "../lib/trigger/index.js";
import type { Pitfall } from "../types/index.js";
import { printPassedResult, printTriggeredResult } from "./check-output.js";

interface CheckOptions {
	id?: string;
	verbose?: boolean;
}

/**
 * Check if a temporary pit has expired
 */
function isExpired(pitfall: Pitfall): { expired: boolean; reason?: string } {
	if (pitfall.scope?.type !== "temporary") {
		return { expired: false };
	}

	// Check date expiration
	if (pitfall.scope.expires) {
		const expiresDate = new Date(pitfall.scope.expires);
		if (new Date() > expiresDate) {
			return {
				expired: true,
				reason: `已过日期 ${pitfall.scope.expires}`,
			};
		}
	}

	// Note: branch/milestone checks would require git integration
	// For now, only date expiration is checked

	return { expired: false };
}

export async function check(options: CheckOptions = {}): Promise<void> {
	const cwd = process.cwd();

	if (!isInitialized(cwd)) {
		console.log(chalk.red("FDD is not initialized. Run `fdd init` first."));
		return;
	}

	const paths = getPaths(cwd);
	// listPitfalls already filters out archived pitfalls by default
	const pitfalls = await listPitfalls(paths.pits);

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

	// Separate expired pitfalls
	const expiredPitfalls: { pitfall: Pitfall; reason: string }[] = [];
	const activePitfalls: Pitfall[] = [];

	for (const pitfall of toCheck) {
		const { expired, reason } = isExpired(pitfall);
		if (expired && reason) {
			expiredPitfalls.push({ pitfall, reason });
		} else {
			activePitfalls.push(pitfall);
		}
	}

	// Warn about expired pitfalls
	if (expiredPitfalls.length > 0) {
		console.log(
			chalk.yellow(`⚠ Skipping ${expiredPitfalls.length} expired pitfall(s):`),
		);
		for (const { pitfall, reason } of expiredPitfalls) {
			console.log(chalk.gray(`  - ${pitfall.id}: ${reason}`));
		}
		console.log();
	}

	if (activePitfalls.length === 0) {
		console.log(chalk.yellow("No active pitfalls to check."));
		return;
	}

	console.log(
		chalk.blue(`Running triggers for ${activePitfalls.length} pitfall(s)...\n`),
	);

	const results: CheckResult[] = [];
	let triggeredCount = 0;

	for (const pitfall of activePitfalls) {
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
			chalk.green(
				`✓ No issues detected across ${activePitfalls.length} pitfall(s).`,
			),
		);
	} else {
		console.log(
			chalk.red(`⚠ ${triggeredCount} pitfall(s) triggered`) +
				chalk.gray(` out of ${activePitfalls.length}`),
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
