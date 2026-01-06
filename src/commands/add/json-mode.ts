import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getPaths } from "../../lib/config.js";
import { detectTool } from "../../lib/external/index.js";
import { syncAllHooks } from "../../lib/hooks/index.js";
import { createPitfall } from "../../lib/pitfall.js";
import { validatePitfallInput } from "../../lib/schema.js";

// Pattern to match example pit files (pit-00x-example-*.md)
const EXAMPLE_PIT_PATTERN = /^pit-00\d-example-.*\.md$/;

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

		// Validate external triggers - check if tools are installed
		for (const trigger of data.trigger) {
			if (trigger.kind === "external" && trigger.tool) {
				const toolName = trigger.tool as "husky" | "biome" | "scripts";
				const detection = detectTool(toolName, cwd);
				if (!detection.installed) {
					throw new Error(detection.error);
				}
			}
		}

		const result = await createPitfall(paths.pits, data);

		// Remove all example pit files on first real pit creation
		if (existsSync(paths.pits)) {
			const files = readdirSync(paths.pits);
			for (const file of files) {
				if (EXAMPLE_PIT_PATTERN.test(file)) {
					unlinkSync(join(paths.pits, file));
				}
			}
		}

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
