/**
 * FDD Hooks Generator
 * Main entry point for Claude Code hooks management
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { listPitfalls } from "../pitfall.js";
import { syncAutocheckHook } from "./autocheck.js";
import { syncContextHook } from "./context.js";
import { syncGuardHook } from "./guard.js";
import { syncProtectHook } from "./protect.js";
import {
	ensureAllHookSettings,
	ensureProtectHookSettings,
} from "./settings.js";
import { syncStopHook } from "./stop.js";
import type { SyncAllResult, SyncResult } from "./types.js";

// Re-export types
export type { SyncAllResult, SyncResult } from "./types.js";

/**
 * Sync all FDD hooks (protect + context + autocheck + guard)
 * Called after: fdd record, fdd init
 */
export async function syncAllHooks(cwd: string): Promise<SyncAllResult> {
	const pitfallsDir = join(cwd, ".fdd", "pitfalls");

	let pitfalls: Awaited<ReturnType<typeof listPitfalls>> = [];
	if (existsSync(pitfallsDir)) {
		pitfalls = await listPitfalls(pitfallsDir);
	}

	// Sync all hook types
	const protect = await syncProtectHook(cwd, pitfalls);
	const context = await syncContextHook(cwd, pitfalls);
	const autocheck = await syncAutocheckHook(cwd, pitfalls);
	const guard = await syncGuardHook(cwd, pitfalls);
	const stop = await syncStopHook(cwd, pitfalls);

	// Update settings with all hooks
	await ensureAllHookSettings(cwd, {
		protect: protect.generated,
		context: context.generated,
		autocheck: autocheck.generated,
		guard: guard.generated,
		stop: stop.generated,
	});

	return { protect, context, autocheck, guard, stop };
}

/**
 * Sync only protect hooks (legacy single hook support)
 */
export async function syncProtectHooks(cwd: string): Promise<SyncResult> {
	const pitfallsDir = join(cwd, ".fdd", "pitfalls");

	let pitfalls: Awaited<ReturnType<typeof listPitfalls>> = [];
	if (existsSync(pitfallsDir)) {
		pitfalls = await listPitfalls(pitfallsDir);
	}

	const result = await syncProtectHook(cwd, pitfalls);
	await ensureProtectHookSettings(cwd);
	return result;
}
