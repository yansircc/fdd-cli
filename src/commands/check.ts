import chalk from "chalk";
import { getPaths, isInitialized } from "../lib/config.js";
import { type CheckResult, runDetectors } from "../lib/detector.js";
import { listPitfalls } from "../lib/pitfall.js";

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
		chalk.blue(`Running detectors for ${toCheck.length} pitfall(s)...\n`),
	);

	const results: CheckResult[] = [];
	let triggeredCount = 0;

	for (const pitfall of toCheck) {
		const result = await runDetectors(pitfall, cwd);
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
			chalk.yellow("Review the Remedy section in each pitfall for fixes."),
		);
		process.exitCode = 1;
	}
}

function printTriggeredResult(result: CheckResult, verbose?: boolean): void {
	const severityColor = getSeverityColor(result.severity);
	console.log(
		chalk.red("⚠ TRIGGERED: ") +
			chalk.bold(result.pitfallId) +
			chalk.gray(" — ") +
			result.pitfallTitle,
	);
	console.log(chalk.gray("  Severity: ") + severityColor(result.severity));

	for (const detector of result.detectors) {
		if (detector.triggered) {
			console.log(
				chalk.red(
					`  ├─ Detector ${detector.detectorIndex + 1} (${detector.kind}): TRIGGERED`,
				),
			);
			if (verbose && detector.matches) {
				for (const match of detector.matches.slice(0, 5)) {
					console.log(chalk.gray(`  │  └─ ${match.slice(0, 80)}`));
				}
				if (detector.matches.length > 5) {
					console.log(
						chalk.gray(`  │  └─ ... and ${detector.matches.length - 5} more`),
					);
				}
			}
		} else if (detector.error) {
			console.log(
				chalk.yellow(
					`  ├─ Detector ${detector.detectorIndex + 1} (${detector.kind}): ERROR`,
				),
			);
			console.log(chalk.yellow(`  │  └─ ${detector.error}`));
		}
	}
	console.log();
}

function printPassedResult(result: CheckResult): void {
	console.log(
		chalk.green("✓ ") +
			chalk.dim(result.pitfallId) +
			chalk.gray(" — ") +
			chalk.dim(result.pitfallTitle),
	);
}

function getSeverityColor(severity: string): (text: string) => string {
	switch (severity) {
		case "critical":
			return chalk.red;
		case "high":
			return chalk.yellow;
		case "medium":
			return chalk.blue;
		case "low":
			return chalk.gray;
		default:
			return chalk.white;
	}
}
