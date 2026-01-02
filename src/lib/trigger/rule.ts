import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { TriggerRule } from "../../types/index.js";
import type { BaseTriggerResult, TriggerResult } from "./types.js";

const execAsync = promisify(exec);

/**
 * Run rule-based trigger (grep, lint, etc.)
 */
export async function runRuleTrigger(
	baseResult: BaseTriggerResult,
	trigger: TriggerRule,
	cwd: string,
): Promise<TriggerResult> {
	if (!trigger.pattern) {
		return {
			...baseResult,
			triggered: false,
			error: "Rule trigger missing pattern",
		};
	}

	const tool = trigger.tool || "grep";
	const scope = trigger.scope || ["src/**"];
	const exclude = trigger.exclude || [];

	// Build grep command
	if (tool === "grep") {
		// Build include patterns for file types (e.g., src/**/*.tsx -> --include=*.tsx)
		const includeArgs = scope
			.map((s) => {
				const ext = s.match(/\*\.(\w+)$/);
				return ext ? `--include="*.${ext[1]}"` : "";
			})
			.filter(Boolean)
			.join(" ");

		// Build exclude patterns
		const excludeArgs = exclude
			.map((e) => {
				if (e.includes("*")) {
					// Glob pattern like **/*.test.* -> --exclude=*.test.*
					const pattern = e.replace(/^\*\*\//, "");
					return `--exclude="${pattern}"`;
				}
				// Directory name -> --exclude-dir
				return `--exclude-dir="${e}"`;
			})
			.join(" ");

		// Get base directories from scope (e.g., src/**/*.tsx -> src/)
		const baseDirs = [
			...new Set(
				scope.map(
					(s) => s.split("/").filter((p) => !p.includes("*"))[0] || ".",
				),
			),
		].join(" ");

		const cmd = `grep -r -n ${includeArgs} ${excludeArgs} -E "${trigger.pattern}" ${baseDirs} 2>/dev/null || true`;

		const { stdout } = await execAsync(cmd, { cwd });
		const matches = stdout
			.trim()
			.split("\n")
			.filter((line) => line.length > 0);

		return {
			...baseResult,
			triggered: matches.length > 0,
			matches: matches.slice(0, 10), // Limit to 10 matches
		};
	}

	// For other tools, run directly
	const cmd = `${tool} ${trigger.pattern}`;
	try {
		await execAsync(cmd, { cwd });
		return { ...baseResult, triggered: false };
	} catch {
		// Non-zero exit usually means match found for lint tools
		return { ...baseResult, triggered: true };
	}
}
