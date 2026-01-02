import chalk from "chalk";
import { syncAllHooks } from "../../lib/hooks/index.js";
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

		// Always sync all hooks after recording a pitfall
		// - protect: if there are protect triggers
		// - context: if there are ai-context triggers
		// - autocheck: if there are any pitfalls (runs fdd check after edits)
		// - guard: if there are command triggers (intercepts Bash commands)
		const syncResult = await syncAllHooks(cwd);

		const hooksSynced = {
			protect: syncResult.protect.generated,
			context: syncResult.context.generated,
			autocheck: syncResult.autocheck.generated,
			guard: syncResult.guard.generated,
		};

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
