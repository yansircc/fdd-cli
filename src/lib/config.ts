import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import type { FDDConfig } from "../types/index.js";

const DEFAULT_CONFIG: FDDConfig = {
	version: 1,
	defaults: {
		scope: ["src/**"],
		exclude: ["node_modules/**", "dist/**"],
		verify_hooks: ["bun lint", "bun test"],
		trigger_tools: ["grep", "bun lint"],
	},
	limits: {
		max_pitfalls_in_context: 5,
	},
	waiver: {
		require_reason: true,
	},
};

/**
 * Get FDD root directory (looks for .fdd/)
 */
export function getFddRoot(cwd: string = process.cwd()): string {
	return join(cwd, ".fdd");
}

/**
 * Check if FDD is initialized
 */
export function isInitialized(cwd: string = process.cwd()): boolean {
	return existsSync(getFddRoot(cwd));
}

/**
 * Load FDD config
 */
export async function loadConfig(
	cwd: string = process.cwd(),
): Promise<FDDConfig> {
	const configPath = join(getFddRoot(cwd), "config.yaml");

	if (!existsSync(configPath)) {
		return DEFAULT_CONFIG;
	}

	const content = await readFile(configPath, "utf-8");
	const parsed = parseYaml(content) as Partial<FDDConfig>;

	return {
		...DEFAULT_CONFIG,
		...parsed,
		defaults: { ...DEFAULT_CONFIG.defaults, ...parsed.defaults },
		limits: { ...DEFAULT_CONFIG.limits, ...parsed.limits },
		waiver: { ...DEFAULT_CONFIG.waiver, ...parsed.waiver },
	};
}

/**
 * Get paths for FDD directories
 */
export function getPaths(cwd: string = process.cwd()) {
	const root = getFddRoot(cwd);
	return {
		root,
		pitfalls: join(root, "pitfalls"),
		rules: join(root, "rules"),
		config: join(root, "config.yaml"),
		readme: join(root, "README.md"),
		claude: {
			commands: join(cwd, ".claude", "commands"),
			rules: join(cwd, ".claude", "rules"),
		},
	};
}
