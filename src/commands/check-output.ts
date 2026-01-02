import chalk from "chalk";
import type { CheckResult } from "../lib/trigger/index.js";

export function printTriggeredResult(
	result: CheckResult,
	verbose?: boolean,
): void {
	const severityColor = getSeverityColor(result.severity);
	console.log(
		chalk.red("⚠ TRIGGERED: ") +
			chalk.bold(result.pitfallId) +
			chalk.gray(" — ") +
			result.pitfallTitle,
	);
	console.log(chalk.gray("  Severity: ") + severityColor(result.severity));

	for (const trigger of result.triggers) {
		if (trigger.triggered) {
			console.log(
				chalk.red(
					`  ├─ Trigger ${trigger.triggerIndex + 1} (${trigger.kind}): TRIGGERED`,
				),
			);
			if (verbose && trigger.matches) {
				for (const match of trigger.matches.slice(0, 5)) {
					console.log(chalk.gray(`  │  └─ ${match.slice(0, 80)}`));
				}
				if (trigger.matches.length > 5) {
					console.log(
						chalk.gray(`  │  └─ ... and ${trigger.matches.length - 5} more`),
					);
				}
			}
		} else if (trigger.error) {
			console.log(
				chalk.yellow(
					`  ├─ Trigger ${trigger.triggerIndex + 1} (${trigger.kind}): ERROR`,
				),
			);
			console.log(chalk.yellow(`  │  └─ ${trigger.error}`));
		}
	}
	console.log();
}

export function printPassedResult(result: CheckResult): void {
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
