import type { Pitfall, TriggerRule } from "../../types/index.js";
import type { BaseTriggerResult, TriggerResult } from "./types.js";

export interface AiContextRule {
	pitfallId: string;
	pitfallTitle: string;
	triggerIndex: number;
	whenTouching: string[];
	exclude: string[];
	context: string;
}

/**
 * Extract all ai-context rules from a list of pitfalls
 */
export function extractAiContextRules(pitfalls: Pitfall[]): AiContextRule[] {
	const rules: AiContextRule[] = [];

	for (const pitfall of pitfalls) {
		for (let i = 0; i < (pitfall.trigger || []).length; i++) {
			const trigger = pitfall.trigger[i];
			if (trigger.kind !== "ai-context") continue;
			if (!trigger.when_touching || trigger.when_touching.length === 0)
				continue;
			if (!trigger.context) continue;

			rules.push({
				pitfallId: pitfall.id,
				pitfallTitle: pitfall.title,
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
 * Run ai-context trigger (for fdd check command - informational only)
 * Returns triggered=false since ai-context triggers are passive
 * They only act when Claude Code receives a prompt via hooks
 */
export async function runAiContextTrigger(
	baseResult: BaseTriggerResult,
	trigger: TriggerRule,
	_cwd: string,
): Promise<TriggerResult> {
	// AI Context triggers are passive - they don't actively scan
	// They only inject context when Claude Code receives a prompt
	return {
		...baseResult,
		triggered: false,
		matches: trigger.when_touching || [],
	};
}
