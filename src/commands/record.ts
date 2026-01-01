import * as readline from "node:readline";
import chalk from "chalk";
import { getPaths, isInitialized } from "../lib/config.js";
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
	options: RecordOptions = {}
): Promise<void> {
	const cwd = process.cwd();

	if (!isInitialized(cwd)) {
		console.log(chalk.red("FDD is not initialized. Run `fdd init` first."));
		return;
	}

	const paths = getPaths(cwd);

	console.log(chalk.blue("Recording a new pitfall..."));
	console.log(
		chalk.gray(
			"Tip: For best results, run /fdd-record in Claude while the context is hot."
		)
	);
	console.log();

	// Interactive collection
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const question = (prompt: string): Promise<string> =>
		new Promise((resolve) => rl.question(prompt, resolve));

	const pitfallTitle = title || (await question(chalk.cyan("Title: ")));
	const severity = (options.severity ||
		((await question(
			chalk.cyan("Severity (critical/high/medium/low) [medium]: ")
		)) as Severity) ||
		"medium") as Severity;
	const tagsInput =
		options.tags || (await question(chalk.cyan("Tags (comma-separated): ")));
	const tags = tagsInput ? tagsInput.split(",").map((t) => t.trim()) : [];

	console.log();
	console.log(chalk.yellow("Evidence collection:"));

	const errorSnippet = await question(
		chalk.cyan("Error snippet (paste, then press Enter twice):\n")
	);
	const command = await question(chalk.cyan("Command that triggered it: "));
	const commit = await question(chalk.cyan("Commit hash (optional): "));
	const diffSummary = await question(chalk.cyan("Diff summary (optional): "));

	const evidence: Evidence = {
		error_snippet: errorSnippet || undefined,
		command: command || undefined,
		commit: commit || undefined,
		diff_summary: diffSummary || undefined,
	};

	console.log();
	console.log(chalk.yellow("Detection strategy:"));

	const detectPattern = await question(
		chalk.cyan("Detection pattern (grep regex): ")
	);
	const detectScope = await question(chalk.cyan("Detection scope [src/**]: "));

	const detect: DetectRule[] = [
		{
			kind: "rule",
			tool: "grep",
			pattern: detectPattern,
			scope: [detectScope || "src/**"],
			strength: "strong",
		},
	];

	console.log();
	console.log(chalk.yellow("Remedy:"));

	const remedyAction = await question(chalk.cyan("Fix action: "));
	const remedySteps = await question(
		chalk.cyan("Fix steps (comma-separated): ")
	);

	const remedy: RemedyPath[] = [
		{
			level: "low",
			kind: "transform",
			action: remedyAction,
			steps: remedySteps ? remedySteps.split(",").map((s) => s.trim()) : [],
		},
	];

	console.log();
	console.log(chalk.yellow("Verification:"));

	const verifyCheck = await question(chalk.cyan("Verify check command: "));

	const verify: Verify = {
		level: "V1",
		checks: verifyCheck ? [verifyCheck] : [],
	};

	console.log();
	console.log(chalk.yellow("Regression test:"));

	const regressionRepro = await question(
		chalk.cyan("How to reproduce (comma-separated steps): ")
	);
	const regressionExpected = await question(chalk.cyan("Expected result: "));
	const regressionWaiver = await question(
		chalk.cyan("Waiver reason (if cannot reproduce, otherwise leave empty): ")
	);

	const regression: Regression = regressionWaiver
		? {
				repro: [],
				expected: "",
				waiver: true,
				waiver_reason: regressionWaiver,
			}
		: {
				repro: regressionRepro
					? regressionRepro.split(",").map((s) => s.trim())
					: [],
				expected: regressionExpected,
			};

	console.log();
	console.log(chalk.yellow("Edge case (negative sample):"));

	const edgeNegative = await question(
		chalk.cyan("Negative case (should NOT trigger): ")
	);
	const edgeExpected = await question(chalk.cyan("Expected behavior: "));
	const edgeWaiver = await question(
		chalk.cyan("Waiver reason (if cannot design, otherwise leave empty): ")
	);

	const edge: Edge = edgeWaiver
		? {
				negative_case: [],
				expected: "",
				waiver: true,
				waiver_reason: edgeWaiver,
			}
		: {
				negative_case: edgeNegative ? [edgeNegative] : [],
				expected: edgeExpected,
			};

	rl.close();

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

	try {
		const result = await createPitfall(paths.pitfalls, pitfallData);

		console.log();
		console.log(chalk.green("✓ Pitfall recorded successfully!"));
		console.log();
		console.log(chalk.white(`ID: ${result.id}`));
		console.log(chalk.white(`Title: ${pitfallTitle}`));
		console.log(chalk.white(`Severity: ${severity}`));
		console.log(chalk.white(`File: ${result.path}`));

		if (result.gateResult.warnings.length > 0) {
			console.log();
			console.log(chalk.yellow("Warnings:"));
			for (const warning of result.gateResult.warnings) {
				console.log(chalk.yellow(`  - ${warning}`));
			}
		}
	} catch (error) {
		console.log();
		console.log(chalk.red("Failed to record pitfall:"));
		console.log(chalk.red((error as Error).message));
	}
}
