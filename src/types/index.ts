/**
 * FDD CLI Types - TRAV Protocol
 * Trigger / Replay / Action / Verify
 */

export type Severity = "critical" | "high" | "medium" | "low";
export type TriggerStrength = "strong" | "weak";
export type TriggerKind = "rule" | "change" | "dynamic" | "command" | "protect";
export type ProtectPermission = "deny" | "allow";
export type CommandAction = "block" | "warn";
export type VerifyLevel = "V0" | "V1" | "V2" | "V3";
export type ActionLevel = "low" | "medium" | "high";
export type ActionKind = "transform" | "read" | "run";

/**
 * Evidence captured during fix
 */
export interface Evidence {
	error_snippet?: string;
	commit?: string;
	command?: string;
	env_fingerprint?: Record<string, string>;
	diff_summary?: string;
}

/**
 * Trigger rule - how to detect the issue
 */
export interface TriggerRule {
	kind: TriggerKind;
	tool?: string;
	pattern?: string;
	scope?: string[];
	exclude?: string[];
	when_changed?: string[];
	must_run?: string[];
	strength: TriggerStrength;
	// Command trigger specific fields
	action?: CommandAction; // block or warn (default: block)
	message?: string; // Custom message to show when triggered
	// Protect trigger specific fields
	paths?: string[]; // Glob patterns to protect
	permissions?: {
		create?: ProtectPermission; // deny | allow (default: allow)
		update?: ProtectPermission;
		delete?: ProtectPermission;
	};
}

/**
 * Action path - how to fix the issue
 */
export interface ActionPath {
	level: ActionLevel;
	kind: ActionKind;
	action?: string;
	steps?: string[];
	doc?: string;
}

/**
 * Verification config
 */
export interface Verify {
	level: VerifyLevel;
	checks?: string[];
	fallback?: {
		level: VerifyLevel;
		self_proof: string[];
	};
}

/**
 * Regression test config
 */
export interface Regression {
	repro: string[];
	expected: string;
	waiver?: boolean;
	waiver_reason?: string;
}

/**
 * Edge case test config
 */
export interface Edge {
	negative_case: string[];
	expected: string;
	waiver?: boolean;
	waiver_reason?: string;
}

/**
 * Replay - root cause analysis
 */
export interface Replay {
	root_cause: string;
	trigger_condition?: string;
	affected_scope?: string[];
}

/**
 * Complete Pitfall structure (TRAV protocol)
 */
export interface Pitfall {
	id: string;
	title: string;
	severity: Severity;
	tags: string[];
	created: string;
	evidence: Evidence;
	trigger: TriggerRule[];
	replay: Replay;
	action: ActionPath[];
	related_rule?: string;
	verify: Verify;
	regression: Regression;
	edge: Edge;
}

/**
 * Rule structure (long-term invariant)
 */
export interface Rule {
	id: string;
	title: string;
	severity: Severity;
	tags: string[];
	created: string;
	constraint: string;
	verify: string[];
	related_pitfalls: string[];
}

/**
 * FDD Config
 */
export interface FDDConfig {
	version: number;
	defaults: {
		scope: string[];
		exclude: string[];
		verify_hooks: string[];
		trigger_tools: string[];
	};
	limits: {
		max_pitfalls_in_context: number;
	};
	waiver: {
		require_reason: boolean;
	};
}

/**
 * Gate check result
 */
export interface GateCheckResult {
	passed: boolean;
	errors: string[];
	warnings: string[];
}
