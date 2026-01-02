import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runChangeTrigger } from "../../lib/trigger/change.js";
import type { BaseTriggerResult } from "../../lib/trigger/types.js";
import type { TriggerRule } from "../../types/index.js";

describe("runChangeTrigger", () => {
	const testDir = join(tmpdir(), `fdd-change-test-${Date.now()}`);

	// Base result for all tests
	const baseResult: BaseTriggerResult = {
		pitfallId: "PIT-001",
		pitfallTitle: "Test pitfall",
		triggerIndex: 0,
		kind: "change",
	};

	beforeAll(() => {
		// Create test directory and initialize git repo
		mkdirSync(testDir, { recursive: true });
		mkdirSync(join(testDir, "src"), { recursive: true });
		mkdirSync(join(testDir, "src", "db"), { recursive: true });

		// Initialize git repo
		execSync("git init", { cwd: testDir, stdio: "ignore" });
		execSync("git config user.email 'test@test.com'", {
			cwd: testDir,
			stdio: "ignore",
		});
		execSync("git config user.name 'Test'", { cwd: testDir, stdio: "ignore" });

		// Create initial files and commit
		writeFileSync(join(testDir, "src", "index.ts"), "console.log('hello');");
		writeFileSync(join(testDir, "src", "utils.ts"), "export const x = 1;");
		writeFileSync(
			join(testDir, "src", "db", "schema.ts"),
			"export const schema = {};",
		);
		execSync("git add .", { cwd: testDir, stdio: "ignore" });
		execSync("git commit -m 'initial'", { cwd: testDir, stdio: "ignore" });

		// Make changes (but don't commit)
		writeFileSync(join(testDir, "src", "index.ts"), "console.log('modified');");
		writeFileSync(
			join(testDir, "src", "db", "schema.ts"),
			"export const schema = { updated: true };",
		);
	});

	afterAll(() => {
		// Cleanup
		rmSync(testDir, { recursive: true, force: true });
	});

	describe("pattern matching", () => {
		it("should trigger on exact file match", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["src/index.ts"],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});

		it("should not trigger when file not changed", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["src/utils.ts"],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(false);
		});

		it("should trigger on prefix match", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["src/db/"],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});

		it("should trigger on wildcard pattern", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["src/*.ts"],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});

		it("should trigger on double wildcard pattern", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["src/**/*.ts"],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});

		it("should match specific schema file", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["src/db/schema.ts"],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});
	});

	describe("multiple patterns", () => {
		it("should trigger if any pattern matches", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["nonexistent.ts", "src/index.ts"],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});

		it("should not trigger if no patterns match", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["nonexistent.ts", "other.js"],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(false);
		});
	});

	describe("result structure", () => {
		it("should include changed files in matches when triggered", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["src/index.ts"],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.matches).toBeDefined();
			expect(result.matches?.length).toBeGreaterThan(0);
		});

		it("should not include matches when not triggered", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["nonexistent.ts"],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.matches).toBeUndefined();
		});
	});

	describe("error handling", () => {
		it("should return error when when_changed is missing", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(false);
			expect(result.error).toBe("Change trigger missing when_changed");
		});

		it("should return error when when_changed is empty", async () => {
			const trigger: TriggerRule = {
				kind: "change",
				when_changed: [],
				strength: "strong",
			};
			const result = await runChangeTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(false);
			expect(result.error).toBe("Change trigger missing when_changed");
		});
	});

	describe("non-git directory", () => {
		it("should handle non-git directory gracefully", async () => {
			const nonGitDir = join(tmpdir(), `non-git-${Date.now()}`);
			mkdirSync(nonGitDir, { recursive: true });

			const trigger: TriggerRule = {
				kind: "change",
				when_changed: ["src/*.ts"],
				strength: "strong",
			};

			try {
				const result = await runChangeTrigger(baseResult, trigger, nonGitDir);
				// Should not crash, and should return not triggered (no changes)
				expect(result.triggered).toBe(false);
			} finally {
				rmSync(nonGitDir, { recursive: true, force: true });
			}
		});
	});
});
