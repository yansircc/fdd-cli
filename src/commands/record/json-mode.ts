import chalk from "chalk";
import { syncProtectHooks } from "../../lib/hooks-generator.js";
import { createPitfall } from "../../lib/pitfall.js";
import { validatePitfallInput } from "../../lib/schema.js";

/**
 * Record pitfall from JSON (non-interactive mode for AI agents)
 */
export async function recordFromJson(
	pitfallsDir: string,
	jsonInput: string,
): Promise<void> {
	try {
		const cwd = process.cwd();

		// Validate JSON with Zod schema
		const data = validatePitfallInput(jsonInput);

		const result = await createPitfall(pitfallsDir, data);

		// Auto-sync protect hooks if pitfall contains protect triggers
		let hooksSynced = false;
		const hasProtectTrigger = data.trigger?.some((t) => t.kind === "protect");

		if (hasProtectTrigger) {
			const syncResult = await syncProtectHooks(cwd);
			hooksSynced = syncResult.generated;
		}

		console.log(chalk.green("✓ Pitfall recorded successfully!"));
		console.log(
			JSON.stringify({
				success: true,
				id: result.id,
				path: result.path,
				warnings: result.gateResult.warnings,
				hooksSynced,
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
