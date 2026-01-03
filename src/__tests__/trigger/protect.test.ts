import { describe, expect, it } from "bun:test";
import {
	extractProtectRules,
	runProtectTrigger,
} from "../../lib/trigger/protect.js";
import type { BaseTriggerResult } from "../../lib/trigger/types.js";
import type { Pitfall, TriggerRule } from "../../types/index.js";

describe("extractProtectRules", () => {
	// Helper to create a pitfall with protect trigger
	const createPitfall = (
		id: string,
		paths: string[],
		options?: {
			exclude?: string[];
			permissions?: {
				create?: "allow" | "deny";
				update?: "allow" | "deny";
				delete?: "allow" | "deny";
			};
			message?: string;
		},
	): Pitfall =>
		({
			id,
			title: `Test pitfall ${id}`,
			trigger: [
				{
					kind: "protect",
					paths,
					exclude: options?.exclude,
					permissions: options?.permissions,
					message: options?.message,
					strength: "strong",
				},
			],
		}) as Pitfall;

	describe("basic extraction", () => {
		it("should extract protect rules from pitfalls", () => {
			const pitfalls = [createPitfall("PIT-001", [".fdd/**"])];
			const rules = extractProtectRules(pitfalls);
			expect(rules.length).toBe(1);
			expect(rules[0].pitfallId).toBe("PIT-001");
			expect(rules[0].paths).toEqual([".fdd/**"]);
		});

		it("should return empty array for empty pitfalls", () => {
			const rules = extractProtectRules([]);
			expect(rules).toEqual([]);
		});

		it("should skip pitfalls without protect triggers", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "Rule trigger",
					trigger: [{ kind: "rule", pattern: "error", strength: "strong" }],
				} as Pitfall,
			];
			const rules = extractProtectRules(pitfalls);
			expect(rules).toEqual([]);
		});

		it("should skip protect triggers without paths", () => {
			const pitfalls = [
				{
					id: "PIT-001",
					title: "No paths",
					trigger: [{ kind: "protect", strength: "strong" }],
				},
			] as unknown as Pitfall[];
			const rules = extractProtectRules(pitfalls);
			expect(rules).toEqual([]);
		});

		it("should skip protect triggers with empty paths", () => {
			const pitfalls = [
				{
					id: "PIT-001",
					title: "Empty paths",
					trigger: [{ kind: "protect", paths: [], strength: "strong" }],
				},
			] as unknown as Pitfall[];
			const rules = extractProtectRules(pitfalls);
			expect(rules).toEqual([]);
		});
	});

	describe("multiple pitfalls and triggers", () => {
		it("should extract rules from multiple pitfalls", () => {
			const pitfalls = [
				createPitfall("PIT-001", [".fdd/**"]),
				createPitfall("PIT-002", ["secrets/**"]),
			];
			const rules = extractProtectRules(pitfalls);
			expect(rules.length).toBe(2);
			expect(rules[0].pitfallId).toBe("PIT-001");
			expect(rules[1].pitfallId).toBe("PIT-002");
		});

		it("should extract multiple protect triggers from same pitfall", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "Multiple triggers",
					trigger: [
						{ kind: "protect", paths: [".fdd/**"], strength: "strong" },
						{ kind: "protect", paths: ["secrets/**"], strength: "strong" },
					],
				} as Pitfall,
			];
			const rules = extractProtectRules(pitfalls);
			expect(rules.length).toBe(2);
			expect(rules[0].triggerIndex).toBe(0);
			expect(rules[1].triggerIndex).toBe(1);
		});

		it("should mix protect and non-protect triggers", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "Mixed triggers",
					trigger: [
						{ kind: "rule", pattern: "error", strength: "strong" },
						{ kind: "protect", paths: [".fdd/**"], strength: "strong" },
						{ kind: "command", pattern: "npm i", strength: "strong" },
					],
				} as Pitfall,
			];
			const rules = extractProtectRules(pitfalls);
			expect(rules.length).toBe(1);
			expect(rules[0].triggerIndex).toBe(1);
		});
	});

	describe("rule fields", () => {
		it("should include pitfall title", () => {
			const pitfalls = [createPitfall("PIT-001", [".fdd/**"])];
			const rules = extractProtectRules(pitfalls);
			expect(rules[0].pitfallTitle).toBe("Test pitfall PIT-001");
		});

		it("should include exclude patterns", () => {
			const pitfalls = [
				createPitfall("PIT-001", [".fdd/**"], { exclude: ["*.bak"] }),
			];
			const rules = extractProtectRules(pitfalls);
			expect(rules[0].exclude).toEqual(["*.bak"]);
		});

		it("should default exclude to empty array", () => {
			const pitfalls = [createPitfall("PIT-001", [".fdd/**"])];
			const rules = extractProtectRules(pitfalls);
			expect(rules[0].exclude).toEqual([]);
		});

		it("should include message", () => {
			const pitfalls = [
				createPitfall("PIT-001", [".fdd/**"], { message: "Use fdd add" }),
			];
			const rules = extractProtectRules(pitfalls);
			expect(rules[0].message).toBe("Use fdd add");
		});
	});

	describe("permissions", () => {
		it("should include specified permissions", () => {
			const pitfalls = [
				createPitfall("PIT-001", [".fdd/**"], {
					permissions: { create: "deny", update: "allow", delete: "deny" },
				}),
			];
			const rules = extractProtectRules(pitfalls);
			expect(rules[0].permissions).toEqual({
				create: "deny",
				update: "allow",
				delete: "deny",
			});
		});

		it("should default permissions to allow", () => {
			const pitfalls = [createPitfall("PIT-001", [".fdd/**"])];
			const rules = extractProtectRules(pitfalls);
			expect(rules[0].permissions).toEqual({
				create: "allow",
				update: "allow",
				delete: "allow",
			});
		});

		it("should fill in missing permissions with allow", () => {
			const pitfalls = [
				createPitfall("PIT-001", [".fdd/**"], {
					permissions: { create: "deny" },
				}),
			];
			const rules = extractProtectRules(pitfalls);
			expect(rules[0].permissions).toEqual({
				create: "deny",
				update: "allow",
				delete: "allow",
			});
		});
	});
});

describe("runProtectTrigger", () => {
	const baseResult: BaseTriggerResult = {
		pitfallId: "PIT-001",
		pitfallTitle: "Test pitfall",
		triggerIndex: 0,
		kind: "protect",
	};

	it("should always return triggered=false (passive trigger)", async () => {
		const trigger: TriggerRule = {
			kind: "protect",
			paths: [".fdd/**"],
			strength: "strong",
		};
		const result = await runProtectTrigger(baseResult, trigger, "/tmp");
		expect(result.triggered).toBe(false);
	});

	it("should include paths in matches", async () => {
		const trigger: TriggerRule = {
			kind: "protect",
			paths: [".fdd/**", "secrets/**"],
			strength: "strong",
		};
		const result = await runProtectTrigger(baseResult, trigger, "/tmp");
		expect(result.matches).toEqual([".fdd/**", "secrets/**"]);
	});

	it("should handle missing paths", async () => {
		const trigger: TriggerRule = {
			kind: "protect",
			strength: "strong",
		};
		const result = await runProtectTrigger(baseResult, trigger, "/tmp");
		expect(result.matches).toEqual([]);
	});

	it("should preserve base result fields", async () => {
		const trigger: TriggerRule = {
			kind: "protect",
			paths: [".fdd/**"],
			strength: "strong",
		};
		const result = await runProtectTrigger(baseResult, trigger, "/tmp");
		expect(result.pitfallId).toBe("PIT-001");
		expect(result.kind).toBe("protect");
		expect(result.triggerIndex).toBe(0);
	});
});
