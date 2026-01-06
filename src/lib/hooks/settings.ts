/**
 * Claude Code settings.json management
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	HOOKS_DIR,
	HOOK_FILES,
	type HookFlags,
	SETTINGS_FILE,
} from "./types.js";

/**
 * Ensure settings.json has all FDD hooks configured
 */
export async function ensureAllHookSettings(
	cwd: string,
	flags: HookFlags,
): Promise<void> {
	const settingsPath = join(cwd, SETTINGS_FILE);
	// biome-ignore lint/suspicious/noExplicitAny: settings structure is dynamic
	let settings: any = {};

	// Read existing settings
	if (existsSync(settingsPath)) {
		try {
			const content = await readFile(settingsPath, "utf-8");
			settings = JSON.parse(content);
		} catch {
			settings = {};
		}
	}

	if (!settings.hooks) settings.hooks = {};

	// Configure PreToolUse for protect hooks (Write|Edit|MultiEdit)
	if (flags.protect) {
		addPreToolUseHook(settings, "Write|Edit|MultiEdit", HOOK_FILES.protect);
	}

	// Configure PreToolUse for guard hooks (Bash)
	if (flags.guard) {
		addPreToolUseHook(settings, "Bash", HOOK_FILES.guard);
	}

	// Configure PostToolUse for autocheck hooks
	if (flags.autocheck) {
		addPostToolUseHook(
			settings,
			"Write|Edit|MultiEdit",
			HOOK_FILES.autocheck,
			30,
		);
	}

	// Configure PreToolUse for inject-context hooks (Edit|Write|MultiEdit)
	// Injects context into Claude before editing files matching inject-context rules
	if (flags.context) {
		addPreToolUseHook(settings, "Edit|Write|MultiEdit", HOOK_FILES.context);
	}

	// Configure Stop hook for quality gates
	if (flags.stop) {
		addStopHook(settings, HOOK_FILES.stop, 30);
	}

	// Configure SessionStart hook for clearing inject-context state
	if (flags.sessionInit) {
		addSessionStartHook(settings, HOOK_FILES.sessionInit);
	}

	await mkdir(join(cwd, ".claude"), { recursive: true });
	await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
}

/**
 * Ensure settings.json has the protect hook configured
 */
export async function ensureProtectHookSettings(cwd: string): Promise<boolean> {
	const settingsPath = join(cwd, SETTINGS_FILE);
	// biome-ignore lint/suspicious/noExplicitAny: settings structure is dynamic
	let settings: any = {};

	if (existsSync(settingsPath)) {
		try {
			const content = await readFile(settingsPath, "utf-8");
			settings = JSON.parse(content);
		} catch {
			settings = {};
		}
	}

	if (hasHookConfigured(settings, "PreToolUse", "fdd-protect")) {
		return false;
	}

	if (!settings.hooks) settings.hooks = {};
	addPreToolUseHook(settings, "Write|Edit|MultiEdit", HOOK_FILES.protect);

	await mkdir(join(cwd, ".claude"), { recursive: true });
	await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
	return true;
}

// Helper functions

function hasHookConfigured(
	// biome-ignore lint/suspicious/noExplicitAny: settings structure is dynamic
	settings: any,
	hookType: string,
	hookFile: string,
): boolean {
	const hooks = settings.hooks?.[hookType] || [];
	return hooks.some(
		// biome-ignore lint/suspicious/noExplicitAny: hook structure varies
		(h: any) =>
			// biome-ignore lint/suspicious/noExplicitAny: hook structure varies
			h.hooks?.some((hook: any) => hook.command?.includes(hookFile)),
	);
}

function addPreToolUseHook(
	// biome-ignore lint/suspicious/noExplicitAny: settings structure is dynamic
	settings: any,
	matcher: string,
	hookFile: string,
	timeout = 5,
): void {
	if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];
	if (hasHookConfigured(settings, "PreToolUse", hookFile)) return;

	settings.hooks.PreToolUse.push({
		matcher,
		hooks: [
			{
				type: "command",
				command: `node "$CLAUDE_PROJECT_DIR/${HOOKS_DIR}/${hookFile}"`,
				timeout,
			},
		],
	});
}

function addPostToolUseHook(
	// biome-ignore lint/suspicious/noExplicitAny: settings structure is dynamic
	settings: any,
	matcher: string,
	hookFile: string,
	timeout = 5,
): void {
	if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];
	if (hasHookConfigured(settings, "PostToolUse", hookFile)) return;

	settings.hooks.PostToolUse.push({
		matcher,
		hooks: [
			{
				type: "command",
				command: `node "$CLAUDE_PROJECT_DIR/${HOOKS_DIR}/${hookFile}"`,
				timeout,
			},
		],
	});
}

function addStopHook(
	// biome-ignore lint/suspicious/noExplicitAny: settings structure is dynamic
	settings: any,
	hookFile: string,
	timeout = 30,
): void {
	if (!settings.hooks.Stop) settings.hooks.Stop = [];
	if (hasHookConfigured(settings, "Stop", hookFile)) return;

	settings.hooks.Stop.push({
		matcher: ".*",
		hooks: [
			{
				type: "command",
				command: `node "$CLAUDE_PROJECT_DIR/${HOOKS_DIR}/${hookFile}"`,
				timeout,
			},
		],
	});
}

function addSessionStartHook(
	// biome-ignore lint/suspicious/noExplicitAny: settings structure is dynamic
	settings: any,
	hookFile: string,
): void {
	if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];
	if (hasHookConfigured(settings, "SessionStart", hookFile)) return;

	settings.hooks.SessionStart.push({
		hooks: [
			{
				type: "command",
				command: `node "$CLAUDE_PROJECT_DIR/${HOOKS_DIR}/${hookFile}"`,
			},
		],
	});
}
