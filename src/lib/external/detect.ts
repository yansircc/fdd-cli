/**
 * External tool detection
 * Checks if husky/biome/scripts are available in the project
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

export interface ToolDetectionResult {
	installed: boolean;
	configPath?: string;
	error?: string;
}

export function detectHusky(cwd: string): ToolDetectionResult {
	const huskyDir = join(cwd, ".husky");
	if (!existsSync(huskyDir)) {
		return {
			installed: false,
			error: "husky is not installed. Run `npx husky init` first.",
		};
	}
	return { installed: true, configPath: huskyDir };
}

export function detectBiome(cwd: string): ToolDetectionResult {
	const biomePath = join(cwd, "biome.json");
	if (!existsSync(biomePath)) {
		return {
			installed: false,
			error: "biome.json not found. Run `npx @biomejs/biome init` first.",
		};
	}
	return { installed: true, configPath: biomePath };
}

export function detectScripts(cwd: string): ToolDetectionResult {
	const pkgPath = join(cwd, "package.json");
	if (!existsSync(pkgPath)) {
		return {
			installed: false,
			error: "package.json not found.",
		};
	}
	return { installed: true, configPath: pkgPath };
}

export function detectTool(
	tool: "husky" | "biome" | "scripts",
	cwd: string,
): ToolDetectionResult {
	switch (tool) {
		case "husky":
			return detectHusky(cwd);
		case "biome":
			return detectBiome(cwd);
		case "scripts":
			return detectScripts(cwd);
	}
}
