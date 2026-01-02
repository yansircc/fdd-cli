import type { Pitfall } from "../../types/index.js";
import type { CommandGuardResult } from "./types.js";

/**
 * Check if a command should be blocked by any pitfall's command trigger
 * Returns the first matching pitfall with its trigger info, or null if no match
 */
export function checkCommandAgainstTriggers(
	command: string,
	pitfalls: Pitfall[],
): CommandGuardResult {
	for (const pitfall of pitfalls) {
		for (const trigger of pitfall.trigger || []) {
			if (trigger.kind !== "command") continue;
			if (!trigger.pattern) continue;

			try {
				const regex = new RegExp(trigger.pattern);
				if (regex.test(command)) {
					return {
						blocked: true,
						pitfall,
						trigger,
						action: trigger.action || "block",
						message: trigger.message,
					};
				}
			} catch {
				// Skip invalid regex patterns
			}
		}
	}

	return { blocked: false, action: "block" };
}
