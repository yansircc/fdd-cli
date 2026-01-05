import { z } from "zod";

/**
 * Zod schemas for FDD CLI - validates AI agent JSON input
 *
 * FDD v2: Feedforward & Feedback Driven Development
 * - deductive (演绎): evidence/regression/edge 可选
 * - inductive (归纳): evidence/regression/edge 必填
 */

// Base types
const SeveritySchema = z.enum(["critical", "high", "medium", "low"]);
const TriggerStrengthSchema = z.enum(["strong", "weak"]);
const CommandActionSchema = z.enum(["block", "warn"]);
const ProtectPermissionSchema = z.enum(["deny", "allow"]);
const VerifyLevelSchema = z.enum(["V0", "V1", "V2", "V3"]);
const ActionLevelSchema = z.enum(["low", "medium", "high"]);
const ActionKindSchema = z.enum(["transform", "read", "run"]);

// FDD v2: Origin and Scope
const OriginSchema = z.enum(["deductive", "inductive"]);
const ScopeTypeSchema = z.enum(["permanent", "temporary"]);

const ScopeSchema = z
	.object({
		type: ScopeTypeSchema,
		reason: z.string().optional(),
		expires: z.string().optional(), // ISO date
		branch: z.string().optional(),
		milestone: z.string().optional(),
	})
	.refine(
		(data) => {
			// temporary 类型建议提供过期条件，但不强制
			return true;
		},
		{ message: "scope validation failed" },
	);

// Evidence
const EvidenceSchema = z
	.object({
		error_snippet: z.string().optional(),
		commit: z.string().optional(),
		command: z.string().optional(),
		env_fingerprint: z.record(z.string(), z.string()).optional(),
		diff_summary: z.string().optional(),
	})
	.refine((data) => data.error_snippet || data.command, {
		message: "evidence must contain error_snippet or command",
	});

// Trigger Rule
const TriggerRuleSchema = z
	.object({
		kind: z.enum([
			"external",
			"change",
			"command",
			"protect",
			"inject-context",
		]),
		tool: z.enum(["husky", "biome", "scripts"]).optional(),
		ref: z.string().optional(), // external: path to rule
		pattern: z.string().optional(),
		scope: z.array(z.string()).optional(),
		exclude: z.array(z.string()).optional(),
		when_changed: z.array(z.string()).optional(),
		strength: TriggerStrengthSchema,
		action: CommandActionSchema.optional(),
		message: z.string().optional(),
		paths: z.array(z.string()).optional(),
		permissions: z
			.object({
				create: ProtectPermissionSchema.optional(),
				update: ProtectPermissionSchema.optional(),
				delete: ProtectPermissionSchema.optional(),
			})
			.optional(),
		// AI Context trigger fields
		when_touching: z.array(z.string()).optional(),
		context: z.string().optional(),
	})
	.refine(
		(data) => {
			// external: requires tool and ref
			if (data.kind === "external") {
				if (!data.tool || !data.ref) return false;
			}
			if (data.kind === "command" && !data.pattern) return false;
			if (
				data.kind === "change" &&
				(!data.when_changed || data.when_changed.length === 0)
			)
				return false;
			if (data.kind === "protect" && (!data.paths || data.paths.length === 0))
				return false;
			if (
				data.kind === "inject-context" &&
				(!data.when_touching ||
					data.when_touching.length === 0 ||
					!data.context)
			)
				return false;
			return true;
		},
		{
			message:
				"trigger missing required field: external needs tool and ref, command needs pattern, change needs when_changed, protect needs paths, inject-context needs when_touching and context",
		},
	);

// Action Path
const ActionPathSchema = z
	.object({
		level: ActionLevelSchema,
		kind: ActionKindSchema,
		action: z.string().optional(),
		steps: z.array(z.string()).optional(),
		doc: z.string().optional(),
	})
	.refine((data) => data.action || data.steps?.length || data.doc, {
		message: "action requires action, steps, or doc",
	});

// Verify
const VerifySchema = z
	.object({
		level: VerifyLevelSchema,
		checks: z.array(z.string()).optional(),
		fallback: z
			.object({
				level: VerifyLevelSchema,
				self_proof: z.array(z.string()),
			})
			.optional(),
	})
	.refine(
		(data) => {
			if ((data.level === "V0" || data.level === "V1") && !data.checks?.length)
				return false;
			if (data.level === "V3" && !data.fallback?.self_proof?.length)
				return false;
			return true;
		},
		{
			message: "verify: V0/V1 requires checks, V3 requires fallback.self_proof",
		},
	);

// Regression
const RegressionSchema = z
	.object({
		repro: z.array(z.string()),
		expected: z.string(),
		waiver: z.boolean().optional(),
		waiver_reason: z.string().optional(),
	})
	.refine((data) => data.waiver || data.repro.length > 0, {
		message: "regression requires repro steps or waiver",
	})
	.refine((data) => !data.waiver || data.waiver_reason, {
		message: "regression waiver requires waiver_reason",
	});

// Edge
const EdgeSchema = z
	.object({
		negative_case: z.array(z.string()),
		expected: z.string(),
		waiver: z.boolean().optional(),
		waiver_reason: z.string().optional(),
	})
	.refine((data) => data.waiver || data.negative_case.length > 0, {
		message: "edge requires negative_case or waiver",
	})
	.refine((data) => !data.waiver || data.waiver_reason, {
		message: "edge waiver requires waiver_reason",
	});

// Replay
const ReplaySchema = z.object({
	root_cause: z.string().min(1, "replay.root_cause is required"),
	trigger_condition: z.string().optional(),
	affected_scope: z.array(z.string()).optional(),
});

// Evidence schema (relaxed version for optional use)
const EvidenceSchemaOptional = z.object({
	error_snippet: z.string().optional(),
	commit: z.string().optional(),
	command: z.string().optional(),
	env_fingerprint: z.record(z.string(), z.string()).optional(),
	diff_summary: z.string().optional(),
});

// Regression schema (relaxed version for optional use)
const RegressionSchemaOptional = z.object({
	repro: z.array(z.string()).optional(),
	expected: z.string().optional(),
	waiver: z.boolean().optional(),
	waiver_reason: z.string().optional(),
});

// Edge schema (relaxed version for optional use)
const EdgeSchemaOptional = z.object({
	negative_case: z.array(z.string()).optional(),
	expected: z.string().optional(),
	waiver: z.boolean().optional(),
	waiver_reason: z.string().optional(),
});

// Base Pitfall Input (common fields)
const BasePitfallInputSchema = z.object({
	title: z.string().min(1, "title is required"),
	severity: SeveritySchema,
	tags: z.array(z.string()),
	origin: OriginSchema,
	scope: ScopeSchema,
	trigger: z.array(TriggerRuleSchema).min(1, "at least one trigger required"),
	replay: ReplaySchema,
	action: z.array(ActionPathSchema).min(1, "at least one action required"),
	verify: VerifySchema,
	related_rule: z.string().optional(),
});

// Inductive Pitfall Input (evidence/regression/edge required)
export const InductivePitfallInputSchema = BasePitfallInputSchema.extend({
	origin: z.literal("inductive"),
	evidence: EvidenceSchema,
	regression: RegressionSchema,
	edge: EdgeSchema,
});

// Deductive Pitfall Input (evidence/regression/edge optional)
export const DeductivePitfallInputSchema = BasePitfallInputSchema.extend({
	origin: z.literal("deductive"),
	evidence: EvidenceSchemaOptional.optional(),
	regression: RegressionSchemaOptional.optional(),
	edge: EdgeSchemaOptional.optional(),
});

// Combined schema using discriminated union
export const PitfallInputSchema = z.discriminatedUnion("origin", [
	InductivePitfallInputSchema,
	DeductivePitfallInputSchema,
]);

export type PitfallInput = z.infer<typeof PitfallInputSchema>;
export type InductivePitfallInput = z.infer<typeof InductivePitfallInputSchema>;
export type DeductivePitfallInput = z.infer<typeof DeductivePitfallInputSchema>;

/**
 * Validate and parse pitfall JSON input
 * Returns parsed data or throws with friendly error messages
 */
export function validatePitfallInput(jsonInput: string): PitfallInput {
	// First try to parse JSON
	let data: unknown;
	try {
		data = JSON.parse(jsonInput);
	} catch {
		throw new Error("Invalid JSON format");
	}

	// Then validate with Zod
	const result = PitfallInputSchema.safeParse(data);

	if (!result.success) {
		const errors = result.error.issues.map((issue) => {
			const path = issue.path.join(".");
			return path ? `${path}: ${issue.message}` : issue.message;
		});
		throw new Error(`Validation failed:\n  - ${errors.join("\n  - ")}`);
	}

	return result.data;
}
