import type {
	Pitfall,
	ProtectPermission,
	TriggerRule,
} from "../../types/index.js";
import type { BaseTriggerResult, TriggerResult } from "./types.js";

export interface ProtectRule {
	pitfallId: string;
	pitfallTitle: string;
	triggerIndex: number;
	paths: string[];
	exclude: string[];
	permissions: {
		create: ProtectPermission;
		update: ProtectPermission;
		delete: ProtectPermission;
	};
	message?: string;
}

/**
 * Extract all protect rules from a list of pitfalls
 */
export function extractProtectRules(pitfalls: Pitfall[]): ProtectRule[] {
	const rules: ProtectRule[] = [];

	for (const pitfall of pitfalls) {
		for (let i = 0; i < (pitfall.trigger || []).length; i++) {
			const trigger = pitfall.trigger[i];
			if (trigger.kind !== "protect") continue;
			if (!trigger.paths || trigger.paths.length === 0) continue;

			rules.push({
				pitfallId: pitfall.id,
				pitfallTitle: pitfall.title,
				triggerIndex: i,
				paths: trigger.paths,
				exclude: trigger.exclude || [],
				permissions: {
					create: trigger.permissions?.create || "allow",
					update: trigger.permissions?.update || "allow",
					delete: trigger.permissions?.delete || "allow",
				},
				message: trigger.message,
			});
		}
	}

	return rules;
}

/**
 * Run protect trigger (for fdd check command - informational only)
 * Returns triggered=false since protect triggers are passive
 */
export async function runProtectTrigger(
	baseResult: BaseTriggerResult,
	trigger: TriggerRule,
	_cwd: string,
): Promise<TriggerResult> {
	// Protect triggers are passive - they don't actively scan
	// They only act when Claude Code attempts a write via hooks
	return {
		...baseResult,
		triggered: false,
		matches: trigger.paths || [],
	};
}
