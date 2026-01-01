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
	Severity,
	Verify,
} from "../types/index.js";

interface RecordOptions {
	severity?: Severity;
	tags?: string;
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

		// Verification
		console.log(chalk.yellow("\n✅ Verification\n"));

		const defaultVerifyHooks = config.defaults.verify_hooks.join(", ");
		const verifyCheck = await input({
			message: "Verify check command",
			default: defaultVerifyHooks,
		});

		const verify: Verify = {
			level: "V1",
			checks: verifyCheck ? [verifyCheck] : config.defaults.verify_hooks,
		};

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
