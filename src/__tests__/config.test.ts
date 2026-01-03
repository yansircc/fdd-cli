import { describe, expect, it } from "bun:test";
import { getFddRoot, getPaths } from "../lib/config.js";

describe("getFddRoot", () => {
	it("should return .fdd path in current directory", () => {
		const root = getFddRoot("/home/user/project");
		expect(root).toBe("/home/user/project/.fdd");
	});

	it("should handle paths with trailing slash", () => {
		const root = getFddRoot("/home/user/project");
		expect(root).toBe("/home/user/project/.fdd");
	});
});

describe("getPaths", () => {
	it("should return all required paths", () => {
		const paths = getPaths("/home/user/project");

		expect(paths.root).toBe("/home/user/project/.fdd");
		expect(paths.pitfalls).toBe("/home/user/project/.fdd/pitfalls");
		expect(paths.config).toBe("/home/user/project/.fdd/config.yaml");
		expect(paths.readme).toBe("/home/user/project/.fdd/README.md");
	});

	it("should return claude paths", () => {
		const paths = getPaths("/home/user/project");

		expect(paths.claude.skills).toBe("/home/user/project/.claude/skills");
		expect(paths.claude.fddSkill).toBe("/home/user/project/.claude/skills/fdd");
	});
});
