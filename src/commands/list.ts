import chalk from "chalk";
import Table from "cli-table3";
import { getPaths, isInitialized } from "../lib/config.js";
import { listPitfalls } from "../lib/pitfall.js";

interface ListOptions {
	severity?: string;
	tag?: string;
}

export async function list(options: ListOptions = {}): Promise<void> {
	const cwd = process.cwd();

	if (!isInitialized(cwd)) {
		console.log(chalk.red("FDD is not initialized. Run `fdd init` first."));
		return;
	}

	const paths = getPaths(cwd);
	const pitfalls = await listPitfalls(paths.pitfalls, {
		severity: options.severity,
		tag: options.tag,
	});

	if (pitfalls.length === 0) {
		console.log(chalk.yellow("No pitfalls found."));
		if (options.severity || options.tag) {
			console.log(chalk.gray("Try removing filters to see all pitfalls."));
		} else {
			console.log(
				chalk.gray("Run /fdd-record (in Claude) or fdd record to create one.")
			);
		}
		return;
	}

	const table = new Table({
		head: [
			chalk.cyan("ID"),
			chalk.cyan("Title"),
			chalk.cyan("Severity"),
			chalk.cyan("Tags"),
			chalk.cyan("Created"),
		],
		colWidths: [12, 40, 12, 20, 12],
		wordWrap: true,
	});

	for (const pitfall of pitfalls) {
		const severityColor = getSeverityColor(pitfall.severity);
		table.push([
			pitfall.id,
			pitfall.title,
			severityColor(pitfall.severity),
			(pitfall.tags || []).join(", "),
			pitfall.created,
		]);
	}

	console.log(table.toString());
	console.log();
	console.log(chalk.gray(`Total: ${pitfalls.length} pitfall(s)`));
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
