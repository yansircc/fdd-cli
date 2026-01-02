import { describe, expect, it } from "bun:test";
import { checkCommandAgainstTriggers } from "../../lib/trigger/command.js";
import type { Pitfall } from "../../types/index.js";

describe("checkCommandAgainstTriggers", () => {
	// Helper to create a pitfall with command trigger
	const createPitfall = (
		pattern: string,
		action: "block" | "warn" = "block",
		message?: string,
	): Pitfall =>
		({
			id: "PIT-001",
			title: "Test pitfall",
			trigger: [
				{
					kind: "command",
					pattern,
					action,
					message,
					strength: "strong",
				},
			],
		}) as Pitfall;

	describe("basic matching", () => {
		it("should block matching command", () => {
			const pitfalls = [createPitfall("npm i")];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.blocked).toBe(true);
			expect(result.action).toBe("block");
		});

		it("should not block non-matching command", () => {
			const pitfalls = [createPitfall("npm i")];
			const result = checkCommandAgainstTriggers("bun install", pitfalls);
			expect(result.blocked).toBe(false);
		});

		it("should return empty result for empty pitfalls", () => {
			const result = checkCommandAgainstTriggers("npm i", []);
			expect(result.blocked).toBe(false);
		});
	});

	describe("regex patterns", () => {
		it("should match with regex pattern", () => {
			const pitfalls = [createPitfall("npm\\s+i(nstall)?")];
			const result = checkCommandAgainstTriggers("npm install", pitfalls);
			expect(result.blocked).toBe(true);
		});

		it("should match partial command", () => {
			const pitfalls = [createPitfall("wrangler\\s+d1")];
			const result = checkCommandAgainstTriggers(
				"wrangler d1 execute --remote",
				pitfalls,
			);
			expect(result.blocked).toBe(true);
		});

		it("should handle word boundaries", () => {
			const pitfalls = [createPitfall("\\brm\\b")];
			const result1 = checkCommandAgainstTriggers("rm -rf", pitfalls);
			const result2 = checkCommandAgainstTriggers("perform action", pitfalls);
			expect(result1.blocked).toBe(true);
			expect(result2.blocked).toBe(false);
		});

		it("should skip invalid regex patterns", () => {
			const pitfalls = [createPitfall("[invalid(regex")];
			const result = checkCommandAgainstTriggers("any command", pitfalls);
			expect(result.blocked).toBe(false);
		});
	});

	describe("action types", () => {
		it("should return block action", () => {
			const pitfalls = [createPitfall("npm i", "block")];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.action).toBe("block");
		});

		it("should return warn action", () => {
			const pitfalls = [createPitfall("npm i", "warn")];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.blocked).toBe(true);
			expect(result.action).toBe("warn");
		});

		it("should default to block when action is not specified", () => {
			const pitfall: Pitfall = {
				id: "PIT-001",
				title: "Test",
				trigger: [{ kind: "command", pattern: "npm i", strength: "strong" }],
			} as Pitfall;
			const result = checkCommandAgainstTriggers("npm i", [pitfall]);
			expect(result.action).toBe("block");
		});
	});

	describe("message handling", () => {
		it("should include message when provided", () => {
			const pitfalls = [createPitfall("npm i", "block", "Use bun instead")];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.message).toBe("Use bun instead");
		});

		it("should have undefined message when not provided", () => {
			const pitfalls = [createPitfall("npm i")];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.message).toBeUndefined();
		});
	});

	describe("multiple pitfalls", () => {
		it("should return first matching pitfall", () => {
			const pitfalls = [
				createPitfall("npm", "warn", "First"),
				createPitfall("npm i", "block", "Second"),
			];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.message).toBe("First");
			expect(result.action).toBe("warn");
		});

		it("should skip non-command triggers", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "Rule trigger",
					trigger: [{ kind: "rule", pattern: "error", strength: "strong" }],
				} as Pitfall,
				createPitfall("npm i", "block", "Command trigger"),
			];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.message).toBe("Command trigger");
		});

		it("should skip triggers without pattern", () => {
			const pitfalls: Pitfall[] = [
				{
					id: "PIT-001",
					title: "No pattern",
					trigger: [{ kind: "command", strength: "strong" }],
				} as Pitfall,
				createPitfall("npm i", "block", "Has pattern"),
			];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.message).toBe("Has pattern");
		});
	});

	describe("result structure", () => {
		it("should include pitfall in result when matched", () => {
			const pitfalls = [createPitfall("npm i")];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.pitfall).toBeDefined();
			expect(result.pitfall?.id).toBe("PIT-001");
		});

		it("should include trigger in result when matched", () => {
			const pitfalls = [createPitfall("npm i")];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.trigger).toBeDefined();
			expect(result.trigger?.kind).toBe("command");
			expect(result.trigger?.pattern).toBe("npm i");
		});

		it("should not include pitfall/trigger when not matched", () => {
			const pitfalls = [createPitfall("npm i")];
			const result = checkCommandAgainstTriggers("bun install", pitfalls);
			expect(result.pitfall).toBeUndefined();
			expect(result.trigger).toBeUndefined();
		});
	});

	describe("edge cases", () => {
		it("should handle empty command", () => {
			const pitfalls = [createPitfall("npm i")];
			const result = checkCommandAgainstTriggers("", pitfalls);
			expect(result.blocked).toBe(false);
		});

		it("should handle pitfall with empty trigger array", () => {
			const pitfalls = [
				{ id: "PIT-001", title: "Empty triggers", trigger: [] },
			] as unknown as Pitfall[];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.blocked).toBe(false);
		});

		it("should handle pitfall with undefined trigger", () => {
			const pitfalls = [
				{ id: "PIT-001", title: "No triggers" },
			] as unknown as Pitfall[];
			const result = checkCommandAgainstTriggers("npm i", pitfalls);
			expect(result.blocked).toBe(false);
		});

		it("should handle special regex characters in command", () => {
			const pitfalls = [createPitfall("npm\\s+run\\s+build")];
			const result = checkCommandAgainstTriggers("npm run build", pitfalls);
			expect(result.blocked).toBe(true);
		});
	});
});
