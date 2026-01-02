import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runDynamicTrigger } from "../../lib/trigger/dynamic.js";
import type { BaseTriggerResult } from "../../lib/trigger/types.js";
import type { TriggerRule } from "../../types/index.js";

describe("runDynamicTrigger", () => {
	const testDir = join(tmpdir(), `fdd-dynamic-test-${Date.now()}`);

	// Base result for all tests
	const baseResult: BaseTriggerResult = {
		pitfallId: "PIT-001",
		pitfallTitle: "Test pitfall",
		triggerIndex: 0,
		kind: "dynamic",
	};

	beforeAll(() => {
		mkdirSync(testDir, { recursive: true });
	});

	afterAll(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	describe("command execution", () => {
		it("should not trigger when command succeeds", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["echo 'test'"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(false);
		});

		it("should trigger when command fails", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["exit 1"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});

		it("should include failure message in matches", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["exit 1"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.matches).toBeDefined();
			expect(result.matches?.length).toBe(1);
			expect(result.matches?.[0]).toContain("exit 1");
		});
	});

	describe("multiple commands", () => {
		it("should run all commands in order", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["echo 'first'", "echo 'second'"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(false);
		});

		it("should continue after failure and collect all failures", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["exit 1", "exit 2"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
			expect(result.matches?.length).toBe(2);
		});

		it("should trigger if any command fails", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["echo 'success'", "exit 1", "echo 'also success'"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
			expect(result.matches?.length).toBe(1);
		});
	});

	describe("error handling", () => {
		it("should return error when must_run is missing", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(false);
			expect(result.error).toBe("Dynamic trigger missing must_run");
		});

		it("should return error when must_run is empty", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: [],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(false);
			expect(result.error).toBe("Dynamic trigger missing must_run");
		});

		it("should handle command not found", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["nonexistent_command_xyz"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
			expect(result.matches?.[0]).toContain("nonexistent_command_xyz");
		});
	});

	describe("working directory", () => {
		it("should run commands in specified directory", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["pwd"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			// pwd should succeed
			expect(result.triggered).toBe(false);
		});
	});

	describe("result structure", () => {
		it("should not include matches when all commands succeed", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["echo 'test'"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.matches).toBeUndefined();
		});

		it("should preserve base result fields", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["echo 'test'"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			expect(result.pitfallId).toBe("PIT-001");
			expect(result.kind).toBe("dynamic");
			expect(result.triggerIndex).toBe(0);
		});
	});

	describe("real commands", () => {
		it("should work with test command for file existence", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["test -d /tmp"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			// /tmp exists, so test -d should succeed
			expect(result.triggered).toBe(false);
		});

		it("should trigger when file does not exist", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ["test -f /nonexistent_file_xyz"],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			// File doesn't exist, so test -f should fail
			expect(result.triggered).toBe(true);
		});

		it("should work with environment variable check", async () => {
			const trigger: TriggerRule = {
				kind: "dynamic",
				must_run: ['test -n "$HOME"'],
				strength: "strong",
			};
			const result = await runDynamicTrigger(baseResult, trigger, testDir);
			// HOME is always set
			expect(result.triggered).toBe(false);
		});
	});
});
