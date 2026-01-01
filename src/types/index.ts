/**
 * FDD CLI Types
 */

export type Severity = "critical" | "high" | "medium" | "low";
export type DetectorStrength = "strong" | "weak";
export type DetectorKind = "rule" | "change" | "dynamic";
export type VerifyLevel = "V0" | "V1" | "V2" | "V3";
export type RemedyLevel = "low" | "medium" | "high";
export type RemedyKind = "transform" | "read" | "run";

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
 * Detection rule
 */
export interface DetectRule {
	kind: DetectorKind;
	tool?: string;
	pattern?: string;
	scope?: string[];
	exclude?: string[];
	when_changed?: string[];
	must_run?: string[];
	strength: DetectorStrength;
}

/**
 * Remedy path
 */
export interface RemedyPath {
	level: RemedyLevel;
	kind: RemedyKind;
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
 * Complete Pitfall structure
 */
export interface Pitfall {
	id: string;
	title: string;
	severity: Severity;
	tags: string[];
	created: string;
	evidence: Evidence;
	detect: DetectRule[];
	replay: Replay;
	remedy: RemedyPath[];
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
		detector_tools: string[];
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
