import type { Pitfall, TriggerRule } from "../../types/index.js";
import { pitfallFilename } from "../id.js";
import type { BaseTriggerResult, TriggerResult } from "./types.js";

export interface InjectContextRule {
	pitfallId: string;
	pitfallTitle: string;
	pitfallFilename: string;
	triggerIndex: number;
	whenTouching: string[];
	exclude: string[];
	context: string;
}

/**
 * Extract all inject-context rules from a list of pitfalls
 */
export function extractInjectContextRules(
	pitfalls: Pitfall[],
): InjectContextRule[] {
	const rules: InjectContextRule[] = [];

	for (const pitfall of pitfalls) {
		for (let i = 0; i < (pitfall.trigger || []).length; i++) {
			const trigger = pitfall.trigger[i];
			if (trigger.kind !== "inject-context") continue;
			if (!trigger.when_touching || trigger.when_touching.length === 0)
				continue;
			if (!trigger.context) continue;

			rules.push({
				pitfallId: pitfall.id,
				pitfallTitle: pitfall.title,
				pitfallFilename: pitfallFilename(pitfall.id, pitfall.title),
				triggerIndex: i,
				whenTouching: trigger.when_touching,
				exclude: trigger.exclude || [],
				context: trigger.context,
			});
		}
	}

	return rules;
}

/**
 * Run inject-context trigger (for fdd check command - informational only)
 * Returns triggered=false since inject-context triggers are passive
 * They only act when Claude Code executes Edit/Write/MultiEdit via PreToolUse hook
 */
export async function runInjectContextTrigger(
	baseResult: BaseTriggerResult,
	trigger: TriggerRule,
	_cwd: string,
): Promise<TriggerResult> {
	// Inject Context triggers are passive - they don't actively scan
	// They only inject context when Claude Code executes Edit/Write/MultiEdit
	return {
		...baseResult,
		triggered: false,
		matches: trigger.when_touching || [],
	};
}
