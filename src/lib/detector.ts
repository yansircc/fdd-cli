import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { CommandAction, DetectRule, Pitfall } from "../types/index.js";

const execAsync = promisify(exec);

export interface DetectorResult {
	pitfallId: string;
	pitfallTitle: string;
	detectorIndex: number;
	kind: string;
	triggered: boolean;
	matches?: string[];
	error?: string;
}

export interface CheckResult {
	pitfallId: string;
	pitfallTitle: string;
	severity: string;
	triggered: boolean;
	detectors: DetectorResult[];
}

/**
 * Run all detectors for a pitfall
 */
export async function runDetectors(
	pitfall: Pitfall,
	cwd: string,
): Promise<CheckResult> {
	const detectorResults: DetectorResult[] = [];

	for (let i = 0; i < (pitfall.detect || []).length; i++) {
		const detector = pitfall.detect[i];
		const result = await runSingleDetector(pitfall, detector, i, cwd);
		detectorResults.push(result);
	}

	const triggered = detectorResults.some((r) => r.triggered);

	return {
		pitfallId: pitfall.id,
		pitfallTitle: pitfall.title,
		severity: pitfall.severity,
		triggered,
		detectors: detectorResults,
	};
}

/**
 * Run a single detector
 */
async function runSingleDetector(
	pitfall: Pitfall,
	detector: DetectRule,
	index: number,
	cwd: string,
): Promise<DetectorResult> {
	const baseResult = {
		pitfallId: pitfall.id,
		pitfallTitle: pitfall.title,
		detectorIndex: index,
		kind: detector.kind,
	};

	try {
		switch (detector.kind) {
			case "rule":
				return await runRuleDetector(baseResult, detector, cwd);
			case "change":
				return await runChangeDetector(baseResult, detector, cwd);
			case "dynamic":
				return await runDynamicDetector(baseResult, detector, cwd);
			default:
				return {
					...baseResult,
					triggered: false,
					error: `Unknown detector kind: ${detector.kind}`,
				};
		}
	} catch (error) {
		return {
			...baseResult,
			triggered: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Run rule-based detector (grep, lint, etc.)
 */
async function runRuleDetector(
	baseResult: Omit<DetectorResult, "triggered">,
	detector: DetectRule,
	cwd: string,
): Promise<DetectorResult> {
	if (!detector.pattern) {
		return {
			...baseResult,
			triggered: false,
			error: "Rule detector missing pattern",
		};
	}

	const tool = detector.tool || "grep";
	const scope = detector.scope || ["src/**"];
	const exclude = detector.exclude || [];

	// Build grep command
	if (tool === "grep") {
		// Build include patterns for file types (e.g., src/**/*.tsx -> --include=*.tsx)
		const includeArgs = scope
			.map((s) => {
				const ext = s.match(/\*\.(\w+)$/);
				return ext ? `--include="*.${ext[1]}"` : "";
			})
			.filter(Boolean)
			.join(" ");

		// Build exclude patterns
		const excludeArgs = exclude
			.map((e) => {
				if (e.includes("*")) {
					// Glob pattern like **/*.test.* -> --exclude=*.test.*
					const pattern = e.replace(/^\*\*\//, "");
					return `--exclude="${pattern}"`;
				}
				// Directory name -> --exclude-dir
				return `--exclude-dir="${e}"`;
			})
			.join(" ");

		// Get base directories from scope (e.g., src/**/*.tsx -> src/)
		const baseDirs = [
			...new Set(
				scope.map(
					(s) => s.split("/").filter((p) => !p.includes("*"))[0] || ".",
				),
			),
		].join(" ");

		const cmd = `grep -r -n ${includeArgs} ${excludeArgs} -E "${detector.pattern}" ${baseDirs} 2>/dev/null || true`;

		const { stdout } = await execAsync(cmd, { cwd });
		const matches = stdout
			.trim()
			.split("\n")
			.filter((line) => line.length > 0);

		return {
			...baseResult,
			triggered: matches.length > 0,
			matches: matches.slice(0, 10), // Limit to 10 matches
		};
	}

	// For other tools, run directly
	const cmd = `${tool} ${detector.pattern}`;
	try {
		await execAsync(cmd, { cwd });
		return { ...baseResult, triggered: false };
	} catch {
		// Non-zero exit usually means match found for lint tools
		return { ...baseResult, triggered: true };
	}
}

/**
 * Run change-based detector (check if specific files changed)
 */
async function runChangeDetector(
	baseResult: Omit<DetectorResult, "triggered">,
	detector: DetectRule,
	cwd: string,
): Promise<DetectorResult> {
	if (!detector.when_changed || detector.when_changed.length === 0) {
		return {
			...baseResult,
			triggered: false,
			error: "Change detector missing when_changed",
		};
	}

	// Check git status for changed files
	const { stdout } = await execAsync(
		"git diff --name-only HEAD 2>/dev/null || git diff --name-only 2>/dev/null || true",
		{ cwd },
	);
	const changedFiles = stdout
		.trim()
		.split("\n")
		.filter((f) => f.length > 0);

	// Check if any watched files changed
	const watchPatterns = detector.when_changed;
	const triggered = changedFiles.some((file) =>
		watchPatterns.some((pattern) => {
			if (pattern.includes("*")) {
				const regex = new RegExp(
					`^${pattern.replace(/\*/g, ".*").replace(/\?/g, ".")}$`,
				);
				return regex.test(file);
			}
			return file === pattern || file.startsWith(pattern);
		}),
	);

	return {
		...baseResult,
		triggered,
		matches: triggered ? changedFiles : undefined,
	};
}

/**
 * Run dynamic detector (execute must_run commands)
 */
async function runDynamicDetector(
	baseResult: Omit<DetectorResult, "triggered">,
	detector: DetectRule,
	cwd: string,
): Promise<DetectorResult> {
	if (!detector.must_run || detector.must_run.length === 0) {
		return {
			...baseResult,
			triggered: false,
			error: "Dynamic detector missing must_run",
		};
	}

	// Run each command and check if any fails
	const failures: string[] = [];

	for (const cmd of detector.must_run) {
		try {
			await execAsync(cmd, { cwd, timeout: 30000 });
		} catch (error) {
			failures.push(
				`${cmd}: ${error instanceof Error ? error.message : "failed"}`,
			);
		}
	}

	return {
		...baseResult,
		triggered: failures.length > 0,
		matches: failures.length > 0 ? failures : undefined,
	};
}

/**
 * Run command detector (match command against regex pattern)
 * This is used by `fdd guard` to intercept dangerous commands
 */
function runCommandDetector(
	baseResult: Omit<DetectorResult, "triggered">,
	detector: DetectRule,
	command: string,
): DetectorResult {
	if (!detector.pattern) {
		return {
			...baseResult,
			triggered: false,
			error: "Command detector missing pattern",
		};
	}

	try {
		const regex = new RegExp(detector.pattern);
		const triggered = regex.test(command);

		return {
			...baseResult,
			triggered,
			matches: triggered ? [command] : undefined,
		};
	} catch (error) {
		return {
			...baseResult,
			triggered: false,
			error: `Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Check if a command should be blocked by any pitfall's command detector
 * Returns the first matching pitfall with its detector info, or null if no match
 */
export interface CommandGuardResult {
	blocked: boolean;
	pitfall?: Pitfall;
	detector?: DetectRule;
	action: "block" | "warn";
	message?: string;
}

export function checkCommandAgainstPitfalls(
	command: string,
	pitfalls: Pitfall[],
): CommandGuardResult {
	for (const pitfall of pitfalls) {
		for (const detector of pitfall.detect || []) {
			if (detector.kind !== "command") continue;

			if (!detector.pattern) continue;

			try {
				const regex = new RegExp(detector.pattern);
				if (regex.test(command)) {
					return {
						blocked: true,
						pitfall,
						detector,
						action: detector.action || "block",
						message: detector.message,
					};
				}
			} catch {}
		}
	}

	return { blocked: false, action: "block" };
}
