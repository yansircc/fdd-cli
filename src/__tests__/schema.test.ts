import { describe, expect, it } from "bun:test";
import { validatePitfallInput } from "../lib/schema.js";

describe("validatePitfallInput", () => {
	// Helper to create a valid inductive pitfall JSON (all fields required)
	const validPitfall = {
		title: "Test pitfall",
		origin: "inductive",
		scope: { type: "permanent" },
		severity: "medium",
		tags: ["test"],
		evidence: { error_snippet: "Error: something went wrong" },
		trigger: [
			{ kind: "change", when_changed: ["src/*.ts"], strength: "strong" },
		],
		replay: { root_cause: "Missing null check" },
		action: [{ level: "low", kind: "transform", action: "Add null check" }],
		verify: { level: "V0", checks: ["bun test"] },
		regression: { repro: ["step 1"], expected: "error occurs" },
		edge: { negative_case: ["valid input"], expected: "no error" },
	};

	describe("JSON parsing", () => {
		it("should parse valid JSON", () => {
			const result = validatePitfallInput(JSON.stringify(validPitfall));
			expect(result.title).toBe("Test pitfall");
		});

		it("should throw on invalid JSON", () => {
			expect(() => validatePitfallInput("not json")).toThrow(
				"Invalid JSON format",
			);
		});

		it("should throw on incomplete JSON", () => {
			expect(() => validatePitfallInput('{"title":')).toThrow(
				"Invalid JSON format",
			);
		});
	});

	describe("Evidence validation (inductive)", () => {
		it("should pass with error_snippet", () => {
			const input = { ...validPitfall, evidence: { error_snippet: "Error" } };
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.evidence?.error_snippet).toBe("Error");
		});

		it("should pass with command", () => {
			const input = { ...validPitfall, evidence: { command: "npm test" } };
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.evidence?.command).toBe("npm test");
		});

		it("should pass with both error_snippet and command", () => {
			const input = {
				...validPitfall,
				evidence: { error_snippet: "Error", command: "npm test" },
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.evidence?.error_snippet).toBe("Error");
			expect(result.evidence?.command).toBe("npm test");
		});

		it("should fail without error_snippet or command", () => {
			const input = { ...validPitfall, evidence: {} };
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"evidence must contain error_snippet or command",
			);
		});
	});

	describe("Trigger validation", () => {
		it("should pass external trigger with tool and ref", () => {
			const input = {
				...validPitfall,
				trigger: [
					{
						kind: "external",
						tool: "husky",
						ref: ".husky/pre-push",
						strength: "strong",
					},
				],
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.trigger[0].kind).toBe("external");
			expect(result.trigger[0].tool).toBe("husky");
			expect(result.trigger[0].ref).toBe(".husky/pre-push");
		});

		it("should fail external trigger without tool", () => {
			const input = {
				...validPitfall,
				trigger: [
					{ kind: "external", ref: ".husky/pre-push", strength: "strong" },
				],
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"external needs tool and ref",
			);
		});

		it("should fail external trigger without ref", () => {
			const input = {
				...validPitfall,
				trigger: [{ kind: "external", tool: "husky", strength: "strong" }],
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"external needs tool and ref",
			);
		});

		it("should pass command trigger with pattern and action", () => {
			const input = {
				...validPitfall,
				trigger: [
					{
						kind: "command",
						pattern: "npm i",
						action: "block",
						strength: "strong",
					},
				],
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.trigger[0].kind).toBe("command");
			expect(result.trigger[0].action).toBe("block");
		});

		it("should fail command trigger without pattern", () => {
			const input = {
				...validPitfall,
				trigger: [{ kind: "command", action: "block", strength: "strong" }],
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"command needs pattern",
			);
		});

		it("should pass change trigger with when_changed", () => {
			const input = {
				...validPitfall,
				trigger: [
					{ kind: "change", when_changed: ["src/*.ts"], strength: "strong" },
				],
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.trigger[0].kind).toBe("change");
		});

		it("should fail change trigger without when_changed", () => {
			const input = {
				...validPitfall,
				trigger: [{ kind: "change", strength: "strong" }],
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"change needs when_changed",
			);
		});

		it("should pass protect trigger with paths", () => {
			const input = {
				...validPitfall,
				trigger: [
					{
						kind: "protect",
						paths: [".fdd/**"],
						permissions: { create: "deny" },
						strength: "strong",
					},
				],
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.trigger[0].kind).toBe("protect");
		});

		it("should fail protect trigger without paths", () => {
			const input = {
				...validPitfall,
				trigger: [{ kind: "protect", strength: "strong" }],
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"protect needs paths",
			);
		});

		it("should pass ai-context trigger with when_touching and context", () => {
			const input = {
				...validPitfall,
				trigger: [
					{
						kind: "ai-context",
						when_touching: ["src/db/**"],
						context: "Use parameterized queries",
						strength: "strong",
					},
				],
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.trigger[0].kind).toBe("ai-context");
		});

		it("should fail ai-context trigger without when_touching", () => {
			const input = {
				...validPitfall,
				trigger: [
					{
						kind: "ai-context",
						context: "Use parameterized queries",
						strength: "strong",
					},
				],
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"ai-context needs when_touching and context",
			);
		});

		it("should fail ai-context trigger without context", () => {
			const input = {
				...validPitfall,
				trigger: [
					{
						kind: "ai-context",
						when_touching: ["src/db/**"],
						strength: "strong",
					},
				],
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"ai-context needs when_touching and context",
			);
		});

		it("should require at least one trigger", () => {
			const input = { ...validPitfall, trigger: [] };
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"at least one trigger required",
			);
		});
	});

	describe("Action validation", () => {
		it("should pass with action field", () => {
			const input = {
				...validPitfall,
				action: [{ level: "low", kind: "transform", action: "Fix it" }],
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.action[0].action).toBe("Fix it");
		});

		it("should pass with steps field", () => {
			const input = {
				...validPitfall,
				action: [{ level: "low", kind: "transform", steps: ["Step 1"] }],
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.action[0].steps).toEqual(["Step 1"]);
		});

		it("should pass with doc field", () => {
			const input = {
				...validPitfall,
				action: [{ level: "low", kind: "read", doc: "README.md" }],
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.action[0].doc).toBe("README.md");
		});

		it("should fail without action, steps, or doc", () => {
			const input = {
				...validPitfall,
				action: [{ level: "low", kind: "transform" }],
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"action requires action, steps, or doc",
			);
		});
	});

	describe("Verify validation", () => {
		it("should pass V0 with checks", () => {
			const input = {
				...validPitfall,
				verify: { level: "V0", checks: ["bun test"] },
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.verify.level).toBe("V0");
		});

		it("should pass V1 with checks", () => {
			const input = {
				...validPitfall,
				verify: { level: "V1", checks: ["bun lint"] },
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.verify.level).toBe("V1");
		});

		it("should fail V0 without checks", () => {
			const input = {
				...validPitfall,
				verify: { level: "V0" },
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"V0/V1 requires checks",
			);
		});

		it("should fail V1 without checks", () => {
			const input = {
				...validPitfall,
				verify: { level: "V1" },
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"V0/V1 requires checks",
			);
		});

		it("should pass V2 without checks", () => {
			const input = {
				...validPitfall,
				verify: { level: "V2" },
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.verify.level).toBe("V2");
		});

		it("should pass V3 with fallback.self_proof", () => {
			const input = {
				...validPitfall,
				verify: {
					level: "V3",
					fallback: { level: "V3", self_proof: ["Verified manually"] },
				},
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.verify.level).toBe("V3");
		});

		it("should fail V3 without fallback", () => {
			const input = {
				...validPitfall,
				verify: { level: "V3" },
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"V3 requires fallback.self_proof",
			);
		});
	});

	describe("Regression validation (inductive)", () => {
		it("should pass with repro steps", () => {
			const input = {
				...validPitfall,
				regression: { repro: ["step 1"], expected: "error" },
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.regression?.repro).toEqual(["step 1"]);
		});

		it("should pass with waiver and reason", () => {
			const input = {
				...validPitfall,
				regression: {
					repro: [],
					expected: "",
					waiver: true,
					waiver_reason: "Cannot reproduce",
				},
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.regression?.waiver).toBe(true);
		});

		it("should fail with empty repro and no waiver", () => {
			const input = {
				...validPitfall,
				regression: { repro: [], expected: "" },
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"regression requires repro steps or waiver",
			);
		});

		it("should fail with waiver but no reason", () => {
			const input = {
				...validPitfall,
				regression: { repro: [], expected: "", waiver: true },
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"regression waiver requires waiver_reason",
			);
		});
	});

	describe("Edge validation (inductive)", () => {
		it("should pass with negative_case", () => {
			const input = {
				...validPitfall,
				edge: { negative_case: ["valid input"], expected: "no error" },
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.edge?.negative_case).toEqual(["valid input"]);
		});

		it("should pass with waiver and reason", () => {
			const input = {
				...validPitfall,
				edge: {
					negative_case: [],
					expected: "",
					waiver: true,
					waiver_reason: "No edge case",
				},
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.edge?.waiver).toBe(true);
		});

		it("should fail with empty negative_case and no waiver", () => {
			const input = {
				...validPitfall,
				edge: { negative_case: [], expected: "" },
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"edge requires negative_case or waiver",
			);
		});

		it("should fail with waiver but no reason", () => {
			const input = {
				...validPitfall,
				edge: { negative_case: [], expected: "", waiver: true },
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"edge waiver requires waiver_reason",
			);
		});
	});

	describe("Replay validation", () => {
		it("should pass with root_cause", () => {
			const input = {
				...validPitfall,
				replay: { root_cause: "Missing null check" },
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.replay.root_cause).toBe("Missing null check");
		});

		it("should fail without root_cause", () => {
			const input = {
				...validPitfall,
				replay: {},
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow();
		});

		it("should fail with empty root_cause", () => {
			const input = {
				...validPitfall,
				replay: { root_cause: "" },
			};
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"replay.root_cause is required",
			);
		});
	});

	describe("Required fields", () => {
		it("should fail without title", () => {
			const { title, ...noTitle } = validPitfall;
			expect(() => validatePitfallInput(JSON.stringify(noTitle))).toThrow();
		});

		it("should fail with empty title", () => {
			const input = { ...validPitfall, title: "" };
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow(
				"title is required",
			);
		});

		it("should fail without severity", () => {
			const { severity, ...noSeverity } = validPitfall;
			expect(() => validatePitfallInput(JSON.stringify(noSeverity))).toThrow();
		});

		it("should fail with invalid severity", () => {
			const input = { ...validPitfall, severity: "invalid" };
			expect(() => validatePitfallInput(JSON.stringify(input))).toThrow();
		});
	});

	describe("Error messages", () => {
		it("should include field path in error", () => {
			const input = {
				...validPitfall,
				trigger: [{ kind: "external", strength: "strong" }],
			};
			try {
				validatePitfallInput(JSON.stringify(input));
				expect(true).toBe(false); // Should not reach here
			} catch (e) {
				expect((e as Error).message).toContain("trigger");
			}
		});

		it("should list multiple errors", () => {
			const input = {
				title: "",
				origin: "inductive",
				scope: { type: "permanent" },
				severity: "medium",
				tags: [],
				evidence: {},
				trigger: [],
				replay: {},
				action: [],
				verify: { level: "V0" },
				regression: { repro: [], expected: "" },
				edge: { negative_case: [], expected: "" },
			};
			try {
				validatePitfallInput(JSON.stringify(input));
				expect(true).toBe(false);
			} catch (e) {
				const message = (e as Error).message;
				expect(message).toContain("Validation failed");
				// Should contain multiple errors
				expect(message.split("\n").length).toBeGreaterThan(2);
			}
		});
	});

	describe("Deductive pitfall validation", () => {
		it("should pass deductive pitfall without evidence/regression/edge", () => {
			const input = {
				title: "Deductive test",
				origin: "deductive",
				scope: { type: "permanent" },
				severity: "medium",
				tags: ["test"],
				trigger: [
					{
						kind: "ai-context",
						when_touching: ["src/**"],
						context: "Test context",
						strength: "strong",
					},
				],
				replay: { root_cause: "Preventive constraint" },
				action: [{ level: "low", kind: "read", doc: "https://example.com" }],
				verify: {
					level: "V3",
					fallback: { level: "V3", self_proof: ["Preventive"] },
				},
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.origin).toBe("deductive");
			expect(result.evidence).toBeUndefined();
			expect(result.regression).toBeUndefined();
			expect(result.edge).toBeUndefined();
		});

		it("should pass deductive pitfall with temporary scope", () => {
			const input = {
				title: "Temporary deductive",
				origin: "deductive",
				scope: {
					type: "temporary",
					reason: "v1.0 only",
					expires: "2025-12-31",
				},
				severity: "low",
				tags: ["non-goal"],
				trigger: [
					{
						kind: "command",
						pattern: "npm install oauth",
						action: "block",
						message: "Not in scope",
						strength: "strong",
					},
				],
				replay: { root_cause: "Product decision" },
				action: [{ level: "low", kind: "read", doc: "Wait for v2" }],
				verify: {
					level: "V3",
					fallback: { level: "V3", self_proof: ["Product decision"] },
				},
			};
			const result = validatePitfallInput(JSON.stringify(input));
			expect(result.scope.type).toBe("temporary");
			expect(result.scope.expires).toBe("2025-12-31");
		});
	});
});
