import type { Pitfall, TriggerRule } from "../../types/index.js";

export interface TriggerResult {
	pitfallId: string;
	pitfallTitle: string;
	triggerIndex: number;
	kind: string;
	triggered: boolean;
	matches?: string[];
	error?: string;
}

export interface CheckResult {
	pitfallId: string;
	pitfallTitle: string;
	severity: string;
	triggered: boolean;
	triggers: TriggerResult[];
	// TRAV info for display
	replay?: {
		root_cause?: string;
	};
	action?: Array<{
		action?: string;
		steps?: string[];
	}>;
}

export interface CommandGuardResult {
	blocked: boolean;
	pitfall?: Pitfall;
	trigger?: TriggerRule;
	action: "block" | "warn";
	message?: string;
}

export type BaseTriggerResult = Omit<TriggerResult, "triggered">;
