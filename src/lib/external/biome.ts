/**
 * Biome rule generation
 * Updates biome.json with new lint rules
 */

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface BiomeGenerateResult {
	success: boolean;
	ref: string;
	error?: string;
}

export async function generateBiomeRule(
	cwd: string,
	ruleName: string,
	ruleConfig: Record<string, unknown>,
	pitfallId: string,
): Promise<BiomeGenerateResult> {
	const biomePath = join(cwd, "biome.json");
	const ref = `biome.json#${ruleName}`;

	if (!existsSync(biomePath)) {
		return {
			success: false,
			ref,
			error: "biome.json not found.",
		};
	}

	const content = await readFile(biomePath, "utf-8");
	const config = JSON.parse(content);

	// Check if rule already exists in linter.rules
	const linterRules = config.linter?.rules || {};

	// Check in all rule categories (nursery, recommended, etc.)
	for (const category of Object.keys(linterRules)) {
		if (typeof linterRules[category] === "object" && linterRules[category]) {
			if (ruleName in linterRules[category]) {
				return {
					success: false,
					ref,
					error: `Rule ${ruleName} already exists in biome.json.`,
				};
			}
		}
	}

	// For now, we don't modify biome.json directly
	// The agent should set up the rule manually, and FDD just tracks the reference
	// This is because biome rules are complex and have specific categories

	return {
		success: true,
		ref,
		// Note: In practice, the agent should configure the rule in biome.json
		// and then create a Pit with the ref pointing to it
	};
}

/**
 * Check if a biome rule exists
 */
export async function biomeRuleExists(
	cwd: string,
	ruleName: string,
): Promise<boolean> {
	const biomePath = join(cwd, "biome.json");

	if (!existsSync(biomePath)) {
		return false;
	}

	try {
		const content = await readFile(biomePath, "utf-8");
		const config = JSON.parse(content);
		const linterRules = config.linter?.rules || {};

		// Check in all rule categories
		for (const category of Object.keys(linterRules)) {
			if (typeof linterRules[category] === "object" && linterRules[category]) {
				if (ruleName in linterRules[category]) {
					return true;
				}
			}
		}

		return false;
	} catch {
		return false;
	}
}
