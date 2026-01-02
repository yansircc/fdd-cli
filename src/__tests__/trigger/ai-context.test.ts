import { describe, expect, it } from "bun:test";
import {
	extractAiContextRules,
	runAiContextTrigger,
} from "../../lib/trigger/ai-context.js";
import type { BaseTriggerResult } from "../../lib/trigger/types.js";
import type { Pitfall, TriggerRule } from "../../types/index.js";

describe("extractAiContextRules", () => {
	// Helper to create a pitfall with ai-context trigger
	const createPitfall = (
		id: string,
		whenTouching: string[],
		context: string,
		exclude?: string[],
	): Pitfall =>
		({
			id,
			title: `Test pitfall ${id}`,
			trigger: [
				{
					kind: "ai-context",
					when_touching: whenTouching,
					context,
					exclude,
					strength: "strong",
				},
			],
		}) as Pitfall;

	describe("basic extraction", () => {
		it("should extract ai-context rules from pitfalls", () => {
			const pitfalls = [
				createPitfall("PIT-001", ["src/db/**"], "Use parameterized queries"),
			];
			const rules = extractAiContextRules(pitfalls);
			expect(rules.length).toBe(1);
			expect(rules[0].pitfallId).toBe("PIT-001");
			expect(rules[0].whenTouching).toEqual(["src/db/**"]);
			expect(rules[0].context).toBe("Use parameterized queries");
		});

		it("should return empty array for empty pitfalls", () => {
			const rules = extractAiContextRules([]);
			expect(rules).toEqual([]);
		});

		it("should skip pitfalls without ai-context triggers", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "Rule trigger",
					trigger: [{ kind: "rule", pattern: "error", strength: "strong" }],
				} as Pitfall,
			];
			const rules = extractAiContextRules(pitfalls);
			expect(rules).toEqual([]);
		});

		it("should skip ai-context triggers without when_touching", () => {
			const pitfalls = [
				{
					id: "PIT-001",
					title: "No when_touching",
					trigger: [
						{
							kind: "ai-context",
							context: "Some context",
							strength: "strong",
						},
					],
				},
			] as unknown as Pitfall[];
			const rules = extractAiContextRules(pitfalls);
			expect(rules).toEqual([]);
		});

		it("should skip ai-context triggers with empty when_touching", () => {
			const pitfalls = [
				{
					id: "PIT-001",
					title: "Empty when_touching",
					trigger: [
						{
							kind: "ai-context",
							when_touching: [],
							context: "Some context",
							strength: "strong",
						},
					],
				},
			] as unknown as Pitfall[];
			const rules = extractAiContextRules(pitfalls);
			expect(rules).toEqual([]);
		});

		it("should skip ai-context triggers without context", () => {
			const pitfalls = [
				{
					id: "PIT-001",
					title: "No context",
					trigger: [
						{
							kind: "ai-context",
							when_touching: ["src/**"],
							strength: "strong",
						},
					],
				},
			] as unknown as Pitfall[];
			const rules = extractAiContextRules(pitfalls);
			expect(rules).toEqual([]);
		});
	});

	describe("multiple pitfalls and triggers", () => {
		it("should extract rules from multiple pitfalls", () => {
			const pitfalls = [
				createPitfall("PIT-001", ["src/db/**"], "Database context"),
				createPitfall("PIT-002", ["src/auth/**"], "Auth context"),
			];
			const rules = extractAiContextRules(pitfalls);
			expect(rules.length).toBe(2);
			expect(rules[0].pitfallId).toBe("PIT-001");
			expect(rules[1].pitfallId).toBe("PIT-002");
		});

		it("should extract multiple ai-context triggers from same pitfall", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "Multiple triggers",
					trigger: [
						{
							kind: "ai-context",
							when_touching: ["src/db/**"],
							context: "DB context",
							strength: "strong",
						},
						{
							kind: "ai-context",
							when_touching: ["src/auth/**"],
							context: "Auth context",
							strength: "strong",
						},
					],
				} as Pitfall,
			];
			const rules = extractAiContextRules(pitfalls);
			expect(rules.length).toBe(2);
			expect(rules[0].triggerIndex).toBe(0);
			expect(rules[1].triggerIndex).toBe(1);
		});

		it("should mix ai-context and non-ai-context triggers", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "Mixed triggers",
					trigger: [
						{ kind: "rule", pattern: "error", strength: "strong" },
						{
							kind: "ai-context",
							when_touching: ["src/**"],
							context: "Context",
							strength: "strong",
						},
						{ kind: "command", pattern: "npm i", strength: "strong" },
					],
				} as Pitfall,
			];
			const rules = extractAiContextRules(pitfalls);
			expect(rules.length).toBe(1);
			expect(rules[0].triggerIndex).toBe(1);
		});
	});

	describe("rule fields", () => {
		it("should include pitfall title", () => {
			const pitfalls = [createPitfall("PIT-001", ["src/**"], "Context")];
			const rules = extractAiContextRules(pitfalls);
			expect(rules[0].pitfallTitle).toBe("Test pitfall PIT-001");
		});

		it("should include exclude patterns", () => {
			const pitfalls = [
				createPitfall("PIT-001", ["src/**"], "Context", ["*.test.ts"]),
			];
			const rules = extractAiContextRules(pitfalls);
			expect(rules[0].exclude).toEqual(["*.test.ts"]);
		});

		it("should default exclude to empty array", () => {
			const pitfalls = [createPitfall("PIT-001", ["src/**"], "Context")];
			const rules = extractAiContextRules(pitfalls);
			expect(rules[0].exclude).toEqual([]);
		});

		it("should include multiple when_touching patterns", () => {
			const pitfalls = [
				createPitfall("PIT-001", ["src/db/**", "src/models/**"], "Context"),
			];
			const rules = extractAiContextRules(pitfalls);
			expect(rules[0].whenTouching).toEqual(["src/db/**", "src/models/**"]);
		});
	});
});

describe("runAiContextTrigger", () => {
	const baseResult: BaseTriggerResult = {
		pitfallId: "PIT-001",
		pitfallTitle: "Test pitfall",
		triggerIndex: 0,
		kind: "ai-context",
	};

	it("should always return triggered=false (passive trigger)", async () => {
		const trigger: TriggerRule = {
			kind: "ai-context",
			when_touching: ["src/**"],
			context: "Some context",
			strength: "strong",
		};
		const result = await runAiContextTrigger(baseResult, trigger, "/tmp");
		expect(result.triggered).toBe(false);
	});

	it("should include when_touching in matches", async () => {
		const trigger: TriggerRule = {
			kind: "ai-context",
			when_touching: ["src/db/**", "src/auth/**"],
			context: "Some context",
			strength: "strong",
		};
		const result = await runAiContextTrigger(baseResult, trigger, "/tmp");
		expect(result.matches).toEqual(["src/db/**", "src/auth/**"]);
	});

	it("should handle missing when_touching", async () => {
		const trigger: TriggerRule = {
			kind: "ai-context",
			context: "Some context",
			strength: "strong",
		};
		const result = await runAiContextTrigger(baseResult, trigger, "/tmp");
		expect(result.matches).toEqual([]);
	});

	it("should preserve base result fields", async () => {
		const trigger: TriggerRule = {
			kind: "ai-context",
			when_touching: ["src/**"],
			context: "Some context",
			strength: "strong",
		};
		const result = await runAiContextTrigger(baseResult, trigger, "/tmp");
		expect(result.pitfallId).toBe("PIT-001");
		expect(result.kind).toBe("ai-context");
		expect(result.triggerIndex).toBe(0);
	});
});
