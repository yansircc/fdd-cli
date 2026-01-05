import { describe, expect, it } from "bun:test";
import {
	extractInjectContextRules,
	runInjectContextTrigger,
} from "../../lib/trigger/inject-context.js";
import type { BaseTriggerResult } from "../../lib/trigger/types.js";
import type { Pitfall, TriggerRule } from "../../types/index.js";

describe("extractInjectContextRules", () => {
	// Helper to create a pitfall with inject-context trigger
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
					kind: "inject-context",
					when_touching: whenTouching,
					context,
					exclude,
					strength: "strong",
				},
			],
		}) as Pitfall;

	describe("basic extraction", () => {
		it("should extract inject-context rules from pitfalls", () => {
			const pitfalls = [
				createPitfall("PIT-001", ["src/db/**"], "Use parameterized queries"),
			];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules.length).toBe(1);
			expect(rules[0].pitfallId).toBe("PIT-001");
			expect(rules[0].whenTouching).toEqual(["src/db/**"]);
			expect(rules[0].context).toBe("Use parameterized queries");
		});

		it("should return empty array for empty pitfalls", () => {
			const rules = extractInjectContextRules([]);
			expect(rules).toEqual([]);
		});

		it("should skip pitfalls without inject-context triggers", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "Change trigger",
					trigger: [
						{ kind: "change", when_changed: ["src/**"], strength: "strong" },
					],
				} as Pitfall,
			];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules).toEqual([]);
		});

		it("should skip inject-context triggers without when_touching", () => {
			const pitfalls = [
				{
					id: "PIT-001",
					title: "No when_touching",
					trigger: [
						{
							kind: "inject-context",
							context: "Some context",
							strength: "strong",
						},
					],
				},
			] as unknown as Pitfall[];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules).toEqual([]);
		});

		it("should skip inject-context triggers with empty when_touching", () => {
			const pitfalls = [
				{
					id: "PIT-001",
					title: "Empty when_touching",
					trigger: [
						{
							kind: "inject-context",
							when_touching: [],
							context: "Some context",
							strength: "strong",
						},
					],
				},
			] as unknown as Pitfall[];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules).toEqual([]);
		});

		it("should skip inject-context triggers without context", () => {
			const pitfalls = [
				{
					id: "PIT-001",
					title: "No context",
					trigger: [
						{
							kind: "inject-context",
							when_touching: ["src/**"],
							strength: "strong",
						},
					],
				},
			] as unknown as Pitfall[];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules).toEqual([]);
		});
	});

	describe("multiple pitfalls and triggers", () => {
		it("should extract rules from multiple pitfalls", () => {
			const pitfalls = [
				createPitfall("PIT-001", ["src/db/**"], "Database context"),
				createPitfall("PIT-002", ["src/auth/**"], "Auth context"),
			];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules.length).toBe(2);
			expect(rules[0].pitfallId).toBe("PIT-001");
			expect(rules[1].pitfallId).toBe("PIT-002");
		});

		it("should extract multiple inject-context triggers from same pitfall", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "Multiple triggers",
					trigger: [
						{
							kind: "inject-context",
							when_touching: ["src/db/**"],
							context: "DB context",
							strength: "strong",
						},
						{
							kind: "inject-context",
							when_touching: ["src/auth/**"],
							context: "Auth context",
							strength: "strong",
						},
					],
				} as Pitfall,
			];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules.length).toBe(2);
			expect(rules[0].triggerIndex).toBe(0);
			expect(rules[1].triggerIndex).toBe(1);
		});

		it("should mix inject-context and non-inject-context triggers", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "Mixed triggers",
					trigger: [
						{
							kind: "external",
							tool: "biome",
							ref: "rule",
							strength: "strong",
						},
						{
							kind: "inject-context",
							when_touching: ["src/**"],
							context: "Context",
							strength: "strong",
						},
						{ kind: "command", pattern: "npm i", strength: "strong" },
					],
				} as Pitfall,
			];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules.length).toBe(1);
			expect(rules[0].triggerIndex).toBe(1);
		});
	});

	describe("rule fields", () => {
		it("should include pitfall title", () => {
			const pitfalls = [createPitfall("PIT-001", ["src/**"], "Context")];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules[0].pitfallTitle).toBe("Test pitfall PIT-001");
		});

		it("should include exclude patterns", () => {
			const pitfalls = [
				createPitfall("PIT-001", ["src/**"], "Context", ["*.test.ts"]),
			];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules[0].exclude).toEqual(["*.test.ts"]);
		});

		it("should default exclude to empty array", () => {
			const pitfalls = [createPitfall("PIT-001", ["src/**"], "Context")];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules[0].exclude).toEqual([]);
		});

		it("should include multiple when_touching patterns", () => {
			const pitfalls = [
				createPitfall("PIT-001", ["src/db/**", "src/models/**"], "Context"),
			];
			const rules = extractInjectContextRules(pitfalls);
			expect(rules[0].whenTouching).toEqual(["src/db/**", "src/models/**"]);
		});
	});
});

describe("runInjectContextTrigger", () => {
	const baseResult: BaseTriggerResult = {
		pitfallId: "PIT-001",
		pitfallTitle: "Test pitfall",
		triggerIndex: 0,
		kind: "inject-context",
	};

	it("should always return triggered=false (passive trigger)", async () => {
		const trigger: TriggerRule = {
			kind: "inject-context",
			when_touching: ["src/**"],
			context: "Some context",
			strength: "strong",
		};
		const result = await runInjectContextTrigger(baseResult, trigger, "/tmp");
		expect(result.triggered).toBe(false);
	});

	it("should include when_touching in matches", async () => {
		const trigger: TriggerRule = {
			kind: "inject-context",
			when_touching: ["src/db/**", "src/auth/**"],
			context: "Some context",
			strength: "strong",
		};
		const result = await runInjectContextTrigger(baseResult, trigger, "/tmp");
		expect(result.matches).toEqual(["src/db/**", "src/auth/**"]);
	});

	it("should handle missing when_touching", async () => {
		const trigger: TriggerRule = {
			kind: "inject-context",
			context: "Some context",
			strength: "strong",
		};
		const result = await runInjectContextTrigger(baseResult, trigger, "/tmp");
		expect(result.matches).toEqual([]);
	});

	it("should preserve base result fields", async () => {
		const trigger: TriggerRule = {
			kind: "inject-context",
			when_touching: ["src/**"],
			context: "Some context",
			strength: "strong",
		};
		const result = await runInjectContextTrigger(baseResult, trigger, "/tmp");
		expect(result.pitfallId).toBe("PIT-001");
		expect(result.kind).toBe("inject-context");
		expect(result.triggerIndex).toBe(0);
	});
});
