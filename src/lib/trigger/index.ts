import type { Pitfall, TriggerRule } from "../../types/index.js";
import { runAiContextTrigger } from "./ai-context.js";
import { runChangeTrigger } from "./change.js";
import { runExternalTrigger } from "./external.js";
import { runProtectTrigger } from "./protect.js";
import type { CheckResult, TriggerResult } from "./types.js";

// Re-export types and utilities
export type {
	CheckResult,
	CommandGuardResult,
	TriggerResult,
} from "./types.js";
export { checkCommandAgainstTriggers } from "./command.js";
export { extractProtectRules, type ProtectRule } from "./protect.js";
export { extractAiContextRules, type AiContextRule } from "./ai-context.js";

/**
 * Run all triggers for a pitfall
 */
export async function runTriggers(
	pitfall: Pitfall,
	cwd: string,
): Promise<CheckResult> {
	const triggerResults: TriggerResult[] = [];

	for (let i = 0; i < (pitfall.trigger || []).length; i++) {
		const trigger = pitfall.trigger[i];
		const result = await runSingleTrigger(pitfall, trigger, i, cwd);
		triggerResults.push(result);
	}

	const triggered = triggerResults.some((r) => r.triggered);

	return {
		pitfallId: pitfall.id,
		pitfallTitle: pitfall.title,
		severity: pitfall.severity,
		triggered,
		triggers: triggerResults,
		// Include TRAV info for display
		replay: pitfall.replay,
		action: pitfall.action,
	};
}

/**
 * Run a single trigger
 */
async function runSingleTrigger(
	pitfall: Pitfall,
	trigger: TriggerRule,
	index: number,
	cwd: string,
): Promise<TriggerResult> {
	const baseResult = {
		pitfallId: pitfall.id,
		pitfallTitle: pitfall.title,
		triggerIndex: index,
		kind: trigger.kind,
	};

	try {
		switch (trigger.kind) {
			case "external":
				return await runExternalTrigger(baseResult, trigger, cwd);
			case "change":
				return await runChangeTrigger(baseResult, trigger, cwd);
			case "protect":
				return await runProtectTrigger(baseResult, trigger, cwd);
			case "ai-context":
				return await runAiContextTrigger(baseResult, trigger, cwd);
			default:
				// Handle deprecated trigger kinds
				if (
					(trigger as { kind: string }).kind === "rule" ||
					(trigger as { kind: string }).kind === "dynamic"
				) {
					return {
						...baseResult,
						triggered: false,
						error: `Trigger kind "${(trigger as { kind: string }).kind}" is deprecated. Migrate to "external" with tool: biome/husky/scripts`,
					};
				}
				return {
					...baseResult,
					triggered: false,
					error: `Unknown trigger kind: ${trigger.kind}`,
				};
		}
	} catch (error) {
		return {
			...baseResult,
			triggered: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
