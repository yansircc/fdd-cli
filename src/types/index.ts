/**
 * FDD CLI Types - TRAV Protocol
 * Trigger / Replay / Action / Verify
 *
 * FDD = Feedforward & Feedback Driven Development
 * - Feedforward (deductive): AI 元认知，预防性约束
 * - Feedback (inductive): 真实错误，防止复发
 */

export type Severity = "critical" | "high" | "medium" | "low";

/**
 * Origin - 约束来源
 * deductive: 演绎（前馈）- 来自 AI 预判或 Interview
 * inductive: 归纳（反馈）- 来自真实错误
 */
export type Origin = "deductive" | "inductive";

/**
 * Scope type - 生命周期类型
 */
export type ScopeType = "permanent" | "temporary";

/**
 * Scope - 生命周期配置
 */
export interface Scope {
	type: ScopeType;
	// temporary 时的可选字段
	reason?: string; // 为什么是临时的
	expires?: string; // ISO date - 日期过期
	branch?: string; // 分支合并后过期
	milestone?: string; // 里程碑完成后过期
}
export type TriggerStrength = "strong" | "weak";
export type TriggerKind =
	| "external"
	| "change"
	| "command"
	| "protect"
	| "inject-context";
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
	tool?: string; // external: "husky" | "biome" | "scripts"
	ref?: string; // external: path to rule (e.g., ".husky/pre-push", "biome.json#no-console")
	pattern?: string;
	scope?: string[];
	exclude?: string[];
	when_changed?: string[];
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
	// AI Context trigger specific fields
	when_touching?: string[]; // Glob patterns - inject context when these files are mentioned/modified
	context?: string; // Context to inject into AI agent
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

	// FDD v2: 来源和生命周期
	origin: Origin; // deductive | inductive
	scope: Scope; // permanent | temporary

	// TRAV 协议
	trigger: TriggerRule[];
	replay: Replay;
	action: ActionPath[];
	verify: Verify;

	// Gate 检查（归纳必填，演绎可选）
	evidence?: Evidence;
	regression?: Regression;
	edge?: Edge;

	// 可选
	related_rule?: string;

	// 归档状态
	archived?: boolean;
	archived_at?: string;
	archived_reason?: string;
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
