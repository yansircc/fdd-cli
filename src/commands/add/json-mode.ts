import chalk from "chalk";
import { getPaths } from "../../lib/config.js";
import { syncAllHooks } from "../../lib/hooks/index.js";
import { createPitfall } from "../../lib/pitfall.js";
import { validatePitfallInput } from "../../lib/schema.js";

/**
 * Add pitfall from JSON (for AI agents)
 */
export async function addFromJson(
	cwd: string,
	jsonInput: string,
): Promise<void> {
	try {
		const paths = getPaths(cwd);

		// Validate JSON with Zod schema
		const data = validatePitfallInput(jsonInput);

		const result = await createPitfall(paths.pits, data);

		// Sync all hooks after adding a pitfall
		const syncResult = await syncAllHooks(cwd);

		const hooksSynced = {
			protect: syncResult.protect.generated,
			context: syncResult.context.generated,
			autocheck: syncResult.autocheck.generated,
			guard: syncResult.guard.generated,
		};

		console.log(chalk.green("✓ Pitfall added successfully!"));
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
		console.error(chalk.red("Failed to add pitfall:"));
		console.log(
			JSON.stringify({
				success: false,
				error: (error as Error).message,
			}),
		);
		process.exitCode = 1;
	}
}
