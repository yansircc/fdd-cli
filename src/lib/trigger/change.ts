import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { TriggerRule } from "../../types/index.js";
import type { BaseTriggerResult, TriggerResult } from "./types.js";

const execAsync = promisify(exec);

/**
 * Run change-based trigger (check if specific files changed)
 */
export async function runChangeTrigger(
	baseResult: BaseTriggerResult,
	trigger: TriggerRule,
	cwd: string,
): Promise<TriggerResult> {
	if (!trigger.when_changed || trigger.when_changed.length === 0) {
		return {
			...baseResult,
			triggered: false,
			error: "Change trigger missing when_changed",
		};
	}

	// Check git status for changed files
	const { stdout } = await execAsync(
		"git diff --name-only HEAD 2>/dev/null || git diff --name-only 2>/dev/null || true",
		{ cwd },
	);
	const changedFiles = stdout
		.trim()
		.split("\n")
		.filter((f) => f.length > 0);

	// Check if any watched files changed
	const watchPatterns = trigger.when_changed;
	const triggered = changedFiles.some((file) =>
		watchPatterns.some((pattern) => {
			if (pattern.includes("*")) {
				const regex = new RegExp(
					`^${pattern.replace(/\*/g, ".*").replace(/\?/g, ".")}$`,
				);
				return regex.test(file);
			}
			return file === pattern || file.startsWith(pattern);
		}),
	);

	return {
		...baseResult,
		triggered,
		matches: triggered ? changedFiles : undefined,
	};
}
