/**
 * Shared types and constants for FDD hooks
 */

export const HOOKS_DIR = ".claude/hooks";
export const SETTINGS_FILE = ".claude/settings.json";

export const HOOK_FILES = {
	protect: "fdd-protect.cjs",
	context: "fdd-context.cjs",
	autocheck: "fdd-autocheck.cjs",
	guard: "fdd-guard.cjs",
	stop: "fdd-stop.cjs",
	sessionInit: "fdd-session-init.cjs",
} as const;

export interface SyncResult {
	hooksPath: string;
	rulesCount: number;
	generated: boolean;
}

export interface SyncAllResult {
	protect: SyncResult;
	context: SyncResult;
	autocheck: SyncResult;
	guard: SyncResult;
	stop: SyncResult;
	sessionInit: SyncResult;
}

export interface HookFlags {
	protect: boolean;
	context: boolean;
	autocheck: boolean;
	guard: boolean;
	stop: boolean;
	sessionInit: boolean;
}
