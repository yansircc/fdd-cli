import { confirm, input, select } from "@inquirer/prompts";
import chalk from "chalk";
import { createPitfall } from "../../lib/pitfall.js";
import type {
	ActionPath,
	Edge,
	Evidence,
	FDDConfig,
	Pitfall,
	Regression,
	Replay,
	Severity,
	TriggerRule,
	Verify,
	VerifyLevel,
} from "../../types/index.js";
import type { RecordOptions } from "./types.js";

/**
 * Interactive pitfall recording
 */
export async function recordInteractive(
	title: string | undefined,
	options: RecordOptions,
	config: FDDConfig,
	pitfallsDir: string,
): Promise<void> {
	console.log(chalk.blue("\n📝 Recording a new pitfall\n"));
	console.log(
		chalk.gray(
			"Tip: For best results, run /fdd-record in Claude while the context is hot.\n",
		),
	);

	// Basic info
	const pitfallTitle =
		title ||
		(await input({
			message: "Title",
			validate: (v) => (v.length > 0 ? true : "Title is required"),
		}));

	const severity =
		options.severity ||
		((await select({
			message: "Severity",
			choices: [
				{ value: "critical", name: "Critical - System breaking" },
				{ value: "high", name: "High - Major functionality affected" },
				{ value: "medium", name: "Medium - Minor functionality affected" },
				{ value: "low", name: "Low - Cosmetic or minor issue" },
			],
			default: "medium",
		})) as Severity);

	const tagsInput =
		options.tags ||
		(await input({
			message: "Tags (comma-separated)",
			default: "",
		}));
	const tags = tagsInput ? tagsInput.split(",").map((t) => t.trim()) : [];

	// Evidence
	const evidence = await collectEvidence();

	// Trigger
	const trigger = await collectTrigger(config);

	// Action
	const action = await collectAction();

	// Replay
	const replay = await collectReplay();

	// Verification
	const verify = await collectVerify(config);

	// Regression
	const regression = await collectRegression();

	// Edge case
	const edge = await collectEdge();

	// Create pitfall
	const pitfallData: Omit<Pitfall, "id" | "created"> = {
		title: pitfallTitle,
		severity,
		tags,
		evidence,
		trigger,
		replay,
		action,
		verify,
		regression,
		edge,
	};

	const result = await createPitfall(pitfallsDir, pitfallData);

	console.log();
	console.log(chalk.green("✓ Pitfall recorded successfully!\n"));
	console.log(chalk.white(`  ID:       ${result.id}`));
	console.log(chalk.white(`  Title:    ${pitfallTitle}`));
	console.log(chalk.white(`  Severity: ${severity}`));
	console.log(chalk.white(`  File:     ${result.path}`));

	if (result.gateResult.warnings.length > 0) {
		console.log();
		console.log(chalk.yellow("Warnings:"));
		for (const warning of result.gateResult.warnings) {
			console.log(chalk.yellow(`  - ${warning}`));
		}
	}
}

async function collectEvidence(): Promise<Evidence> {
	console.log(chalk.yellow("\n📋 Evidence collection\n"));

	const errorSnippet = await input({
		message: "Error snippet (paste error log)",
		default: "",
	});

	const command = await input({
		message: "Command that triggered it",
		default: "",
	});

	const commit = await input({
		message: "Commit hash (optional)",
		default: "",
	});

	const diffSummary = await input({
		message: "Diff summary (optional)",
		default: "",
	});

	return {
		error_snippet: errorSnippet || undefined,
		command: command || undefined,
		commit: commit || undefined,
		diff_summary: diffSummary || undefined,
	};
}

async function collectTrigger(config: FDDConfig): Promise<TriggerRule[]> {
	console.log(chalk.yellow("\n🔍 Trigger strategy\n"));

	const defaultScope = config.defaults.scope.join(", ");
	const triggerPattern = await input({
		message: "Trigger pattern (grep regex)",
		validate: (v) => (v.length > 0 ? true : "Pattern is required"),
	});

	const triggerScope = await input({
		message: "Trigger scope",
		default: defaultScope,
	});

	return [
		{
			kind: "rule",
			tool: "grep",
			pattern: triggerPattern,
			scope: triggerScope ? [triggerScope] : config.defaults.scope,
			exclude: config.defaults.exclude,
			strength: "strong",
		},
	];
}

async function collectAction(): Promise<ActionPath[]> {
	console.log(chalk.yellow("\n🔧 Action\n"));

	const actionDesc = await input({
		message: "Fix action",
		validate: (v) => (v.length > 0 ? true : "Action is required"),
	});

	const actionSteps = await input({
		message: "Fix steps (comma-separated)",
		default: "",
	});

	return [
		{
			level: "low",
			kind: "transform",
			action: actionDesc,
			steps: actionSteps ? actionSteps.split(",").map((s) => s.trim()) : [],
		},
	];
}

async function collectReplay(): Promise<Replay> {
	console.log(chalk.yellow("\n🔄 Replay (root cause analysis)\n"));

	const rootCause = await input({
		message: "Root cause (why did this happen?)",
		validate: (v) => (v.length > 0 ? true : "Root cause is required"),
	});

	const triggerCondition = await input({
		message: "Trigger condition (optional)",
		default: "",
	});

	const affectedScopeInput = await input({
		message: "Affected scope (comma-separated, optional)",
		default: "",
	});

	return {
		root_cause: rootCause,
		trigger_condition: triggerCondition || undefined,
		affected_scope: affectedScopeInput
			? affectedScopeInput.split(",").map((s) => s.trim())
			: undefined,
	};
}

async function collectVerify(config: FDDConfig): Promise<Verify> {
	console.log(chalk.yellow("\n✅ Verification\n"));

	const verifyLevel = (await select({
		message: "Verify level",
		choices: [
			{ value: "V0", name: "V0 - Test/Type/Build (strongest)" },
			{ value: "V1", name: "V1 - Lint/Grep/AST" },
			{ value: "V2", name: "V2 - Evidence existence" },
			{ value: "V3", name: "V3 - Self-proof (weakest)" },
		],
		default: "V0",
	})) as VerifyLevel;

	const defaultVerifyHooks = config.defaults.verify_hooks.join(", ");

	if (verifyLevel === "V3") {
		const selfProof = await input({
			message: "Self-proof statement",
			validate: (v) => (v.length > 0 ? true : "Self-proof is required for V3"),
		});
		return {
			level: "V3",
			fallback: {
				level: "V3",
				self_proof: [selfProof],
			},
		};
	}

	const verifyCheck = await input({
		message: "Verify check command",
		default: defaultVerifyHooks,
		validate: (v) => (v.length > 0 ? true : "Check command is required"),
	});

	return {
		level: verifyLevel,
		checks: verifyCheck ? [verifyCheck] : config.defaults.verify_hooks,
	};
}

async function collectRegression(): Promise<Regression> {
	console.log(chalk.yellow("\n🔄 Regression test\n"));

	const hasRegression = await confirm({
		message: "Can you provide reproduction steps?",
		default: true,
	});

	if (hasRegression) {
		const regressionRepro = await input({
			message: "How to reproduce (comma-separated steps)",
			validate: (v) => (v.length > 0 ? true : "Steps are required"),
		});
		const regressionExpected = await input({
			message: "Expected result",
			validate: (v) => (v.length > 0 ? true : "Expected result is required"),
		});
		return {
			repro: regressionRepro.split(",").map((s) => s.trim()),
			expected: regressionExpected,
		};
	}

	const regressionWaiver = await input({
		message: "Waiver reason (why cannot reproduce)",
		validate: (v) => (v.length > 0 ? true : "Waiver reason is required"),
	});
	return {
		repro: [],
		expected: "",
		waiver: true,
		waiver_reason: regressionWaiver,
	};
}

async function collectEdge(): Promise<Edge> {
	console.log(chalk.yellow("\n🎯 Edge case (negative sample)\n"));

	const hasEdge = await confirm({
		message: "Can you provide a negative case (should NOT trigger)?",
		default: true,
	});

	if (hasEdge) {
		const edgeNegative = await input({
			message: "Negative case",
			validate: (v) => (v.length > 0 ? true : "Negative case is required"),
		});
		const edgeExpected = await input({
			message: "Expected behavior",
			validate: (v) => (v.length > 0 ? true : "Expected behavior is required"),
		});
		return {
			negative_case: [edgeNegative],
			expected: edgeExpected,
		};
	}

	const edgeWaiver = await input({
		message: "Waiver reason (why cannot design negative case)",
		validate: (v) => (v.length > 0 ? true : "Waiver reason is required"),
	});
	return {
		negative_case: [],
		expected: "",
		waiver: true,
		waiver_reason: edgeWaiver,
	};
}
