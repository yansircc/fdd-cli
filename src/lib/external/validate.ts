/**
 * External ref validation
 * Validates that external trigger refs point to existing rules
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface RefValidationResult {
	valid: boolean;
	error?: string;
}

export async function validateExternalRef(
	cwd: string,
	tool: string,
	ref: string,
): Promise<RefValidationResult> {
	switch (tool) {
		case "husky":
			return validateHuskyRef(cwd, ref);
		case "biome":
			return await validateBiomeRef(cwd, ref);
		case "scripts":
			return await validateScriptsRef(cwd, ref);
		default:
			return { valid: false, error: `Unknown tool: ${tool}` };
	}
}

function validateHuskyRef(cwd: string, ref: string): RefValidationResult {
	// ref format: .husky/pre-push
	const hookPath = join(cwd, ref);
	if (!existsSync(hookPath)) {
		return { valid: false, error: `Husky hook not found: ${ref}` };
	}
	return { valid: true };
}

async function validateBiomeRef(
	cwd: string,
	ref: string,
): Promise<RefValidationResult> {
	// ref format: biome.json#rule-name
	const match = ref.match(/^biome\.json#(.+)$/);
	if (!match) {
		return { valid: false, error: `Invalid biome ref format: ${ref}` };
	}

	const ruleName = match[1];
	const biomePath = join(cwd, "biome.json");

	if (!existsSync(biomePath)) {
		return { valid: false, error: "biome.json not found" };
	}

	try {
		const content = await readFile(biomePath, "utf-8");
		const config = JSON.parse(content);
		const linterRules = config.linter?.rules || {};

		// Check in all rule categories (nursery, recommended, style, etc.)
		for (const category of Object.keys(linterRules)) {
			if (typeof linterRules[category] === "object" && linterRules[category]) {
				if (ruleName in linterRules[category]) {
					return { valid: true };
				}
			}
		}

		return { valid: false, error: `Biome rule not found: ${ruleName}` };
	} catch (e) {
		return {
			valid: false,
			error: `Failed to parse biome.json: ${e instanceof Error ? e.message : String(e)}`,
		};
	}
}

async function validateScriptsRef(
	cwd: string,
	ref: string,
): Promise<RefValidationResult> {
	// ref format: package.json#scripts.check
	const match = ref.match(/^package\.json#scripts\.(.+)$/);
	if (!match) {
		return { valid: false, error: `Invalid scripts ref format: ${ref}` };
	}

	const scriptName = match[1];
	const pkgPath = join(cwd, "package.json");

	if (!existsSync(pkgPath)) {
		return { valid: false, error: "package.json not found" };
	}

	try {
		const content = await readFile(pkgPath, "utf-8");
		const pkg = JSON.parse(content);

		if (!pkg.scripts?.[scriptName]) {
			return { valid: false, error: `Script not found: ${scriptName}` };
		}

		return { valid: true };
	} catch (e) {
		return {
			valid: false,
			error: `Failed to parse package.json: ${e instanceof Error ? e.message : String(e)}`,
		};
	}
}
