/**
 * External trigger implementation
 *
 * External triggers are passive - they point to external tools
 * (biome, husky, npm scripts) that run independently.
 * fdd check does NOT execute them.
 */

import type { TriggerRule } from "../../types/index.js";
import type { BaseTriggerResult, TriggerResult } from "./types.js";

/**
 * Run external trigger check
 * Always returns triggered=false since external tools run independently
 */
export async function runExternalTrigger(
	baseResult: BaseTriggerResult,
	trigger: TriggerRule,
	_cwd: string,
): Promise<TriggerResult> {
	return {
		...baseResult,
		triggered: false,
		// Include ref in matches for informational purposes
		matches: trigger.ref ? [`[${trigger.tool}] ${trigger.ref}`] : [],
	};
}
