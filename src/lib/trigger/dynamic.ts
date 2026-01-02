import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { TriggerRule } from "../../types/index.js";
import type { BaseTriggerResult, TriggerResult } from "./types.js";

const execAsync = promisify(exec);

/**
 * Run dynamic trigger (execute must_run commands)
 */
export async function runDynamicTrigger(
	baseResult: BaseTriggerResult,
	trigger: TriggerRule,
	cwd: string,
): Promise<TriggerResult> {
	if (!trigger.must_run || trigger.must_run.length === 0) {
		return {
			...baseResult,
			triggered: false,
			error: "Dynamic trigger missing must_run",
		};
	}

	// Run each command and check if any fails
	const failures: string[] = [];

	for (const cmd of trigger.must_run) {
		try {
			await execAsync(cmd, { cwd, timeout: 30000 });
		} catch (error) {
			failures.push(
				`${cmd}: ${error instanceof Error ? error.message : "failed"}`,
			);
		}
	}

	return {
		...baseResult,
		triggered: failures.length > 0,
		matches: failures.length > 0 ? failures : undefined,
	};
}
