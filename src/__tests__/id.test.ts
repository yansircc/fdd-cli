import { describe, expect, it } from "bun:test";
import { pitfallFilename, ruleFilename, slugify } from "../lib/id.js";

describe("slugify", () => {
	it("should convert to lowercase", () => {
		expect(slugify("Hello World")).toBe("hello-world");
	});

	it("should replace spaces with hyphens", () => {
		expect(slugify("hello world")).toBe("hello-world");
	});

	it("should remove special characters", () => {
		expect(slugify("hello@world!")).toBe("hello-world");
	});

	it("should remove Chinese characters", () => {
		expect(slugify("配置错误")).toBe("");
	});

	it("should keep English in mixed Chinese and English", () => {
		expect(slugify("API 配置错误")).toBe("api");
	});

	it("should trim leading and trailing hyphens", () => {
		expect(slugify("---hello---")).toBe("hello");
	});

	it("should collapse multiple hyphens", () => {
		expect(slugify("hello   world")).toBe("hello-world");
	});

	it("should truncate to 50 characters", () => {
		const longTitle = "a".repeat(100);
		expect(slugify(longTitle).length).toBe(50);
	});

	it("should handle empty string", () => {
		expect(slugify("")).toBe("");
	});

	it("should handle only special characters", () => {
		expect(slugify("@#$%")).toBe("");
	});
});

describe("pitfallFilename", () => {
	it("should generate correct filename", () => {
		expect(pitfallFilename("PIT-001", "Hello World")).toBe(
			"pit-001-hello-world.md",
		);
	});

	it("should handle Chinese titles (removed)", () => {
		expect(pitfallFilename("PIT-002", "配置错误")).toBe("pit-002-.md");
	});

	it("should lowercase the ID", () => {
		expect(pitfallFilename("PIT-123", "Test")).toBe("pit-123-test.md");
	});
});

describe("ruleFilename", () => {
	it("should generate correct filename", () => {
		expect(ruleFilename("RULE-001", "No Direct DB Access")).toBe(
			"rule-001-no-direct-db-access.md",
		);
	});

	it("should handle Chinese titles (removed)", () => {
		expect(ruleFilename("RULE-002", "禁止硬编码")).toBe("rule-002-.md");
	});
});
