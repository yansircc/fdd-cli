/**
 * External tool integration module
 * Generates and validates husky/biome/scripts configurations
 */

export {
	detectTool,
	detectHusky,
	detectBiome,
	detectScripts,
	type ToolDetectionResult,
} from "./detect.js";

export {
	generateHuskyHook,
	huskyHookExists,
	type HuskyGenerateResult,
} from "./husky.js";

export {
	generateBiomeRule,
	biomeRuleExists,
	type BiomeGenerateResult,
} from "./biome.js";

export {
	generateScript,
	scriptExists,
	type ScriptsGenerateResult,
} from "./scripts.js";

export { validateExternalRef, type RefValidationResult } from "./validate.js";
