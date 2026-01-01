import { confirm, input, select } from "@inquirer/prompts";
import chalk from "chalk";
import { getPaths, isInitialized, loadConfig } from "../lib/config.js";
import { createPitfall } from "../lib/pitfall.js";
import type {
	DetectRule,
	Edge,
	Evidence,
	Pitfall,
	Regression,
	RemedyPath,
	Replay,
	Severity,
	Verify,
	VerifyLevel,
} from "../types/index.js";

interface RecordOptions {
	severity?: Severity;
	tags?: string;
	json?: string;
}

/**
 * Record pitfall from JSON (non-interactive mode for AI agents)
 */
async function recordFromJson(
	pitfallsDir: string,
	jsonInput: string,
): Promise<void> {
	try {
		const data = JSON.parse(jsonInput) as Omit<Pitfall, "id" | "created">;

		const result = await createPitfall(pitfallsDir, data);

		console.log(chalk.green("✓ Pitfall recorded successfully!"));
		console.log(
			JSON.stringify({
				success: true,
				id: result.id,
				path: result.path,
				warnings: result.gateResult.warnings,
			}),
		);
	} catch (error) {
		console.error(chalk.red("Failed to record pitfall:"));
		console.log(
			JSON.stringify({
				success: false,
				error: (error as Error).message,
			}),
		);
		process.exitCode = 1;
	}
}

export async function record(
	title: string | undefined,
	options: RecordOptions = {},
): Promise<void> {
	const cwd = process.cwd();

	if (!isInitialized(cwd)) {
		console.log(chalk.red("FDD is not initialized. Run `fdd init` first."));
		return;
	}

	const paths = getPaths(cwd);
	const config = await loadConfig(cwd);

	// Non-interactive JSON mode for AI agents
	if (options.json) {
		await recordFromJson(paths.pitfalls, options.json);
		return;
	}

	console.log(chalk.blue("\n📝 Recording a new pitfall\n"));
	console.log(
		chalk.gray(
			"Tip: For best results, run /fdd-record in Claude while the context is hot.\n",
		),
	);

	try {
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

		const evidence: Evidence = {
			error_snippet: errorSnippet || undefined,
			command: command || undefined,
			commit: commit || undefined,
			diff_summary: diffSummary || undefined,
		};

		// Detection
		console.log(chalk.yellow("\n🔍 Detection strategy\n"));

		const defaultScope = config.defaults.scope.join(", ");
		const detectPattern = await input({
			message: "Detection pattern (grep regex)",
			validate: (v) => (v.length > 0 ? true : "Pattern is required"),
		});

		const detectScope = await input({
			message: "Detection scope",
			default: defaultScope,
		});

		const detect: DetectRule[] = [
			{
				kind: "rule",
				tool: "grep",
				pattern: detectPattern,
				scope: detectScope ? [detectScope] : config.defaults.scope,
				exclude: config.defaults.exclude,
				strength: "strong",
			},
		];

		// Remedy
		console.log(chalk.yellow("\n🔧 Remedy\n"));

		const remedyAction = await input({
			message: "Fix action",
			validate: (v) => (v.length > 0 ? true : "Action is required"),
		});

		const remedySteps = await input({
			message: "Fix steps (comma-separated)",
			default: "",
		});

		const remedy: RemedyPath[] = [
			{
				level: "low",
				kind: "transform",
				action: remedyAction,
				steps: remedySteps ? remedySteps.split(",").map((s) => s.trim()) : [],
			},
		];

		// Replay (root cause analysis)
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

		const replay: Replay = {
			root_cause: rootCause,
			trigger_condition: triggerCondition || undefined,
			affected_scope: affectedScopeInput
				? affectedScopeInput.split(",").map((s) => s.trim())
				: undefined,
		};

		// Verification
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

		let verify: Verify;
		if (verifyLevel === "V3") {
			const selfProof = await input({
				message: "Self-proof statement",
				validate: (v) =>
					v.length > 0 ? true : "Self-proof is required for V3",
			});
			verify = {
				level: "V3",
				fallback: {
					level: "V3",
					self_proof: [selfProof],
				},
			};
		} else {
			const verifyCheck = await input({
				message: "Verify check command",
				default: defaultVerifyHooks,
				validate: (v) => (v.length > 0 ? true : "Check command is required"),
			});
			verify = {
				level: verifyLevel,
				checks: verifyCheck ? [verifyCheck] : config.defaults.verify_hooks,
			};
		}

		// Regression
		console.log(chalk.yellow("\n🔄 Regression test\n"));

		const hasRegression = await confirm({
			message: "Can you provide reproduction steps?",
			default: true,
		});

		let regression: Regression;
		if (hasRegression) {
			const regressionRepro = await input({
				message: "How to reproduce (comma-separated steps)",
				validate: (v) => (v.length > 0 ? true : "Steps are required"),
			});
			const regressionExpected = await input({
				message: "Expected result",
				validate: (v) => (v.length > 0 ? true : "Expected result is required"),
			});
			regression = {
				repro: regressionRepro.split(",").map((s) => s.trim()),
				expected: regressionExpected,
			};
		} else {
			const regressionWaiver = await input({
				message: "Waiver reason (why cannot reproduce)",
				validate: (v) => (v.length > 0 ? true : "Waiver reason is required"),
			});
			regression = {
				repro: [],
				expected: "",
				waiver: true,
				waiver_reason: regressionWaiver,
			};
		}

		// Edge case
		console.log(chalk.yellow("\n🎯 Edge case (negative sample)\n"));

		const hasEdge = await confirm({
			message: "Can you provide a negative case (should NOT trigger)?",
			default: true,
		});

		let edge: Edge;
		if (hasEdge) {
			const edgeNegative = await input({
				message: "Negative case",
				validate: (v) => (v.length > 0 ? true : "Negative case is required"),
			});
			const edgeExpected = await input({
				message: "Expected behavior",
				validate: (v) =>
					v.length > 0 ? true : "Expected behavior is required",
			});
			edge = {
				negative_case: [edgeNegative],
				expected: edgeExpected,
			};
		} else {
			const edgeWaiver = await input({
				message: "Waiver reason (why cannot design negative case)",
				validate: (v) => (v.length > 0 ? true : "Waiver reason is required"),
			});
			edge = {
				negative_case: [],
				expected: "",
				waiver: true,
				waiver_reason: edgeWaiver,
			};
		}

		// Create pitfall
		const pitfallData: Omit<Pitfall, "id" | "created"> = {
			title: pitfallTitle,
			severity,
			tags,
			evidence,
			detect,
			replay,
			remedy,
			verify,
			regression,
			edge,
		};

		const result = await createPitfall(paths.pitfalls, pitfallData);

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
	} catch (error) {
		// Handle Ctrl+C gracefully
		if ((error as Error).name === "ExitPromptError") {
			console.log(chalk.gray("\nCancelled."));
			return;
		}
		console.log();
		console.log(chalk.red("Failed to record pitfall:"));
		console.log(chalk.red((error as Error).message));
	}
}
