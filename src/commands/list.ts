import chalk from "chalk";
import Table from "cli-table3";
import { getPaths, isInitialized } from "../lib/config.js";
import { listPitfalls } from "../lib/pitfall.js";
import type { Origin, ScopeType } from "../types/index.js";

export interface ListOptions {
	severity?: string;
	tag?: string;
	origin?: Origin;
	scope?: ScopeType;
	archived?: boolean;
}

export async function list(options: ListOptions = {}): Promise<void> {
	const cwd = process.cwd();

	if (!isInitialized(cwd)) {
		console.log(chalk.red("FDD is not initialized. Run `fdd init` first."));
		return;
	}

	const paths = getPaths(cwd);
	const pitfalls = await listPitfalls(paths.pits, {
		severity: options.severity,
		tag: options.tag,
		origin: options.origin,
		scope: options.scope,
		archived: options.archived,
	});

	if (pitfalls.length === 0) {
		console.log(chalk.yellow("No pitfalls found."));
		const hasFilters =
			options.severity ||
			options.tag ||
			options.origin ||
			options.scope ||
			options.archived;
		if (hasFilters) {
			console.log(chalk.gray("Try removing filters to see all pitfalls."));
		} else {
			console.log(
				chalk.gray(
					"AI will auto-detect and prompt to add pitfalls after fixes.",
				),
			);
		}
		return;
	}

	const table = new Table({
		head: [
			chalk.cyan("ID"),
			chalk.cyan("Title"),
			chalk.cyan("Origin"),
			chalk.cyan("Scope"),
			chalk.cyan("Severity"),
			chalk.cyan("Status"),
		],
		colWidths: [12, 35, 10, 10, 10, 10],
		wordWrap: true,
	});

	for (const pitfall of pitfalls) {
		const severityColor = getSeverityColor(pitfall.severity);
		const originLabel = pitfall.origin === "deductive" ? "演绎" : "归纳";
		const scopeLabel = pitfall.scope?.type === "temporary" ? "临时" : "长期";
		const status = pitfall.archived
			? chalk.gray("已归档")
			: chalk.green("生效");

		table.push([
			pitfall.id,
			pitfall.title,
			pitfall.origin === "deductive"
				? chalk.magenta(originLabel)
				: chalk.blue(originLabel),
			pitfall.scope?.type === "temporary"
				? chalk.yellow(scopeLabel)
				: scopeLabel,
			severityColor(pitfall.severity),
			status,
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
