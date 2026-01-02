import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runRuleTrigger } from "../../lib/trigger/rule.js";
import type { BaseTriggerResult } from "../../lib/trigger/types.js";
import type { TriggerRule } from "../../types/index.js";

describe("runRuleTrigger", () => {
	const testDir = join(tmpdir(), `fdd-rule-test-${Date.now()}`);
	const srcDir = join(testDir, "src");

	// Base result for all tests
	const baseResult: BaseTriggerResult = {
		pitfallId: "PIT-001",
		pitfallTitle: "Test pitfall",
		triggerIndex: 0,
		kind: "rule",
	};

	beforeAll(() => {
		// Create test directory structure
		mkdirSync(srcDir, { recursive: true });
		mkdirSync(join(srcDir, "components"), { recursive: true });

		// Create test files
		writeFileSync(
			join(srcDir, "index.ts"),
			`
const x = null;
if (x.value) { // This should trigger
  console.log(x);
}
`,
		);

		writeFileSync(
			join(srcDir, "utils.ts"),
			`
export function getValue(obj: any) {
  return obj?.value; // Safe access
}
`,
		);

		writeFileSync(
			join(srcDir, "components", "Button.tsx"),
			`
export function Button({ onClick }) {
  const state = {};
  return state.values(); // Should match pattern
}
`,
		);

		writeFileSync(
			join(srcDir, "index.test.ts"),
			`
// Test file - should be excluded
const mock = { values: () => [] };
mock.values();
`,
		);
	});

	afterAll(() => {
		// Cleanup
		rmSync(testDir, { recursive: true, force: true });
	});

	describe("grep matching", () => {
		it("should find matches with simple pattern", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				pattern: "console\\.log",
				scope: ["src/**"],
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
			expect(result.matches?.length).toBeGreaterThan(0);
		});

		it("should not trigger when no matches", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				pattern: "nonexistent_pattern_xyz",
				scope: ["src/**"],
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(false);
		});

		it("should match regex patterns", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				pattern: "\\.values\\(\\)",
				scope: ["src/**/*.tsx"],
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});
	});

	describe("scope filtering", () => {
		it("should only search in specified scope", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				pattern: "Button",
				scope: ["src/components/**"],
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});

		it("should filter by file extension", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				pattern: "values",
				scope: ["src/**/*.tsx"],
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
			// Should only find .tsx files
			expect(result.matches?.every((m) => m.includes(".tsx"))).toBe(true);
		});
	});

	describe("exclude patterns", () => {
		it("should exclude test files", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				pattern: "values",
				scope: ["src/**"],
				exclude: ["**/*.test.*"],
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			// Should not find matches in test files
			expect(result.matches?.every((m) => !m.includes(".test."))).toBe(true);
		});

		it("should exclude directories", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				pattern: "Button",
				scope: ["src/**"],
				exclude: ["components"],
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			// Should not find matches in components directory
			expect(result.matches?.every((m) => !m.includes("components"))).toBe(
				true,
			);
		});
	});

	describe("result limiting", () => {
		it("should limit matches to 10", async () => {
			// Create a file with many matches
			const manyMatches = Array(20).fill("const x = null;").join("\n");
			writeFileSync(join(srcDir, "many.ts"), manyMatches);

			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				pattern: "null",
				scope: ["src/**"],
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			expect(result.matches?.length).toBeLessThanOrEqual(10);
		});
	});

	describe("error handling", () => {
		it("should return error when pattern is missing", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(false);
			expect(result.error).toBe("Rule trigger missing pattern");
		});
	});

	describe("non-grep tools", () => {
		it("should run tool command directly", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "echo",
				pattern: "test",
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			// echo always succeeds, so triggered should be false
			expect(result.triggered).toBe(false);
		});

		it("should trigger on tool failure", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "exit",
				pattern: "1", // exit 1 always fails
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			// exit 1 fails, so triggered should be true
			expect(result.triggered).toBe(true);
		});
	});

	describe("defaults", () => {
		it("should default tool to grep", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				pattern: "console",
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});

		it("should default scope to src/**", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				pattern: "console",
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			expect(result.triggered).toBe(true);
		});

		it("should default exclude to empty array", async () => {
			const trigger: TriggerRule = {
				kind: "rule",
				tool: "grep",
				pattern: "mock",
				scope: ["src/**"],
				strength: "strong",
			};
			const result = await runRuleTrigger(baseResult, trigger, testDir);
			// Should find match in test file (no exclusion)
			expect(result.triggered).toBe(true);
		});
	});
});
