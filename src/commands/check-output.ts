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

	// Show trigger details with matches
	for (const trigger of result.triggers) {
		if (trigger.triggered) {
			console.log(chalk.red(`  ├─ Trigger (${trigger.kind}): TRIGGERED`));
			// Always show matches (location info)
			if (trigger.matches && trigger.matches.length > 0) {
				const limit = verbose ? 10 : 3;
				for (const match of trigger.matches.slice(0, limit)) {
					console.log(chalk.yellow(`  │  → ${match.slice(0, 100)}`));
				}
				if (trigger.matches.length > limit) {
					console.log(
						chalk.gray(`  │    ... and ${trigger.matches.length - limit} more`),
					);
				}
			}
		} else if (trigger.error) {
			console.log(chalk.yellow(`  ├─ Trigger (${trigger.kind}): ERROR`));
			console.log(chalk.yellow(`  │  └─ ${trigger.error}`));
		}
	}

	// Show Replay (root cause)
	if (result.replay?.root_cause) {
		console.log(chalk.cyan("  ├─ Replay: ") + result.replay.root_cause);
	}

	// Show Action (fix steps)
	if (result.action && result.action.length > 0) {
		const act = result.action[0];
		if (act.action) {
			console.log(chalk.green("  └─ Action: ") + act.action);
		}
		if (act.steps && act.steps.length > 0 && verbose) {
			for (const step of act.steps) {
				console.log(chalk.gray(`     • ${step}`));
			}
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
