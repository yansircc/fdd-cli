/**
 * Package.json scripts generation
 * Updates package.json with new npm scripts
 */

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface ScriptsGenerateResult {
	success: boolean;
	ref: string;
	error?: string;
}

export async function generateScript(
	cwd: string,
	scriptName: string,
	scriptCommand: string,
	_pitfallId: string,
): Promise<ScriptsGenerateResult> {
	const pkgPath = join(cwd, "package.json");
	const ref = `package.json#scripts.${scriptName}`;

	if (!existsSync(pkgPath)) {
		return {
			success: false,
			ref,
			error: "package.json not found.",
		};
	}

	const content = await readFile(pkgPath, "utf-8");
	const pkg = JSON.parse(content);

	// Check if script already exists
	if (pkg.scripts?.[scriptName]) {
		return {
			success: false,
			ref,
			error: `Script "${scriptName}" already exists in package.json.`,
		};
	}

	// Add script
	if (!pkg.scripts) {
		pkg.scripts = {};
	}
	pkg.scripts[scriptName] = scriptCommand;

	await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");

	return { success: true, ref };
}

/**
 * Check if a npm script exists
 */
export async function scriptExists(
	cwd: string,
	scriptName: string,
): Promise<boolean> {
	const pkgPath = join(cwd, "package.json");

	if (!existsSync(pkgPath)) {
		return false;
	}

	try {
		const content = await readFile(pkgPath, "utf-8");
		const pkg = JSON.parse(content);
		return Boolean(pkg.scripts?.[scriptName]);
	} catch {
		return false;
	}
}
