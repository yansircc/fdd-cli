import { describe, expect, it } from "bun:test";
import { checkGates, formatGateResult } from "../lib/gate.js";
import type { Pitfall } from "../types/index.js";

describe("checkGates", () => {
	// Helper to create a valid pitfall
	const validPitfall: Partial<Pitfall> = {
		evidence: { error_snippet: "Error: something went wrong" },
		regression: { repro: ["step 1", "step 2"], expected: "error occurs" },
		edge: { negative_case: ["valid input"], expected: "no error" },
		detect: [{ kind: "rule", pattern: "error", strength: "strong" }],
		replay: { root_cause: "Missing null check" },
		remedy: [{ level: "low", kind: "transform", action: "Add null check" }],
		verify: { level: "V0", checks: ["bun test"] },
	};

	describe("Gate 1: Evidence", () => {
		it("should pass with error_snippet", () => {
			const result = checkGates({
				...validPitfall,
				evidence: { error_snippet: "Error" },
			});
			expect(result.passed).toBe(true);
		});

		it("should pass with command", () => {
			const result = checkGates({
				...validPitfall,
				evidence: { command: "npm test" },
			});
			expect(result.passed).toBe(true);
		});

		it("should fail without evidence", () => {
			const { evidence, ...noEvidence } = validPitfall;
			const result = checkGates(noEvidence);
			expect(result.passed).toBe(false);
			expect(result.errors).toContain("Gate 1 failed: evidence is required");
		});

		it("should fail with empty evidence", () => {
			const result = checkGates({
				...validPitfall,
				evidence: {},
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 1 failed: evidence must contain error_snippet or command",
			);
		});
	});

	describe("Gate 2: Regression", () => {
		it("should pass with repro steps", () => {
			const result = checkGates({
				...validPitfall,
				regression: { repro: ["step 1"], expected: "error" },
			});
			expect(result.passed).toBe(true);
		});

		it("should pass with waiver and reason", () => {
			const result = checkGates({
				...validPitfall,
				regression: {
					repro: [],
					expected: "",
					waiver: true,
					waiver_reason: "Cannot reproduce in test environment",
				},
			});
			expect(result.passed).toBe(true);
		});

		it("should fail without regression", () => {
			const { regression, ...noRegression } = validPitfall;
			const result = checkGates(noRegression);
			expect(result.passed).toBe(false);
			expect(result.errors).toContain("Gate 2 failed: regression is required");
		});

		it("should fail with empty repro and no waiver", () => {
			const result = checkGates({
				...validPitfall,
				regression: { repro: [], expected: "" },
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 2 failed: regression must have repro steps or waiver",
			);
		});

		it("should fail with waiver but no reason", () => {
			const result = checkGates({
				...validPitfall,
				regression: { repro: [], expected: "", waiver: true },
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 2 failed: regression waiver requires waiver_reason",
			);
		});
	});

	describe("Gate 3: Edge", () => {
		it("should pass with negative_case", () => {
			const result = checkGates({
				...validPitfall,
				edge: { negative_case: ["valid input"], expected: "no error" },
			});
			expect(result.passed).toBe(true);
		});

		it("should pass with waiver and reason", () => {
			const result = checkGates({
				...validPitfall,
				edge: {
					negative_case: [],
					expected: "",
					waiver: true,
					waiver_reason: "No meaningful negative case exists",
				},
			});
			expect(result.passed).toBe(true);
		});

		it("should fail without edge", () => {
			const { edge, ...noEdge } = validPitfall;
			const result = checkGates(noEdge);
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 3 failed: edge (negative case) is required",
			);
		});

		it("should fail with empty negative_case and no waiver", () => {
			const result = checkGates({
				...validPitfall,
				edge: { negative_case: [], expected: "" },
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 3 failed: edge must have negative_case or waiver",
			);
		});

		it("should fail with waiver but no reason", () => {
			const result = checkGates({
				...validPitfall,
				edge: { negative_case: [], expected: "", waiver: true },
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 3 failed: edge waiver requires waiver_reason",
			);
		});
	});

	describe("Gate 4: Weak detector warning", () => {
		it("should warn when all detectors are weak", () => {
			const result = checkGates({
				...validPitfall,
				detect: [
					{ kind: "rule", pattern: "a", strength: "weak" },
					{ kind: "dynamic", must_run: ["test"], strength: "weak" },
				],
			});
			expect(result.passed).toBe(true);
			expect(result.warnings).toContain(
				"Gate 4 warning: all detectors are weak - consider upgrading to rule/change/dynamic",
			);
		});

		it("should warn when some detectors are weak", () => {
			const result = checkGates({
				...validPitfall,
				detect: [
					{ kind: "rule", pattern: "a", strength: "strong" },
					{ kind: "dynamic", must_run: ["test"], strength: "weak" },
				],
			});
			expect(result.passed).toBe(true);
			expect(result.warnings).toContain(
				"Gate 4 warning: some detectors are weak - marked for future upgrade",
			);
		});

		it("should not warn when all detectors are strong", () => {
			const result = checkGates({
				...validPitfall,
				detect: [
					{ kind: "rule", pattern: "a", strength: "strong" },
					{ kind: "dynamic", must_run: ["test"], strength: "strong" },
				],
			});
			expect(result.passed).toBe(true);
			expect(result.warnings).toHaveLength(0);
		});
	});

	describe("Gate 5: Detect field validation", () => {
		it("should fail when rule detector missing pattern", () => {
			const result = checkGates({
				...validPitfall,
				detect: [{ kind: "rule", strength: "strong" }],
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 5 failed: detect[0] kind=rule requires pattern",
			);
		});

		it("should fail when dynamic detector missing must_run", () => {
			const result = checkGates({
				...validPitfall,
				detect: [{ kind: "dynamic", strength: "strong" }],
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 5 failed: detect[0] kind=dynamic requires must_run",
			);
		});

		it("should fail when change detector missing when_changed", () => {
			const result = checkGates({
				...validPitfall,
				detect: [{ kind: "change", strength: "strong" }],
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 5 failed: detect[0] kind=change requires when_changed",
			);
		});

		it("should fail when no detectors", () => {
			const result = checkGates({
				...validPitfall,
				detect: [],
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 5 failed: at least one detector is required",
			);
		});

		it("should pass with valid rule detector", () => {
			const result = checkGates({
				...validPitfall,
				detect: [{ kind: "rule", pattern: "error", strength: "strong" }],
			});
			expect(result.passed).toBe(true);
		});

		it("should pass with valid dynamic detector", () => {
			const result = checkGates({
				...validPitfall,
				detect: [
					{ kind: "dynamic", must_run: ["bun test"], strength: "strong" },
				],
			});
			expect(result.passed).toBe(true);
		});

		it("should pass with valid change detector", () => {
			const result = checkGates({
				...validPitfall,
				detect: [
					{
						kind: "change",
						when_changed: ["src/**"],
						must_run: ["test"],
						strength: "strong",
					},
				],
			});
			expect(result.passed).toBe(true);
		});
	});

	describe("Gate 6: Replay", () => {
		it("should pass with root_cause", () => {
			const result = checkGates({
				...validPitfall,
				replay: { root_cause: "Missing null check" },
			});
			expect(result.passed).toBe(true);
		});

		it("should fail without replay", () => {
			const { replay, ...noReplay } = validPitfall;
			const result = checkGates(noReplay);
			expect(result.passed).toBe(false);
			expect(result.errors).toContain("Gate 6 failed: replay is required");
		});

		it("should fail with empty root_cause", () => {
			const result = checkGates({
				...validPitfall,
				replay: { root_cause: "" },
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 6 failed: replay.root_cause is required",
			);
		});

		it("should fail with whitespace-only root_cause", () => {
			const result = checkGates({
				...validPitfall,
				replay: { root_cause: "   " },
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 6 failed: replay.root_cause is required",
			);
		});
	});

	describe("Gate 7: Remedy", () => {
		it("should pass with action", () => {
			const result = checkGates({
				...validPitfall,
				remedy: [{ level: "low", kind: "transform", action: "Fix it" }],
			});
			expect(result.passed).toBe(true);
		});

		it("should pass with steps", () => {
			const result = checkGates({
				...validPitfall,
				remedy: [{ level: "low", kind: "transform", steps: ["step 1"] }],
			});
			expect(result.passed).toBe(true);
		});

		it("should pass with doc", () => {
			const result = checkGates({
				...validPitfall,
				remedy: [{ level: "low", kind: "read", doc: "README.md" }],
			});
			expect(result.passed).toBe(true);
		});

		it("should fail without remedy", () => {
			const { remedy, ...noRemedy } = validPitfall;
			const result = checkGates(noRemedy);
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 7 failed: at least one remedy is required",
			);
		});

		it("should fail with empty remedy", () => {
			const result = checkGates({
				...validPitfall,
				remedy: [],
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 7 failed: at least one remedy is required",
			);
		});

		it("should fail when remedy has no action/steps/doc", () => {
			const result = checkGates({
				...validPitfall,
				remedy: [{ level: "low", kind: "transform" }],
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 7 failed: remedy[0] requires action, steps, or doc",
			);
		});
	});

	describe("Gate 8: Verify consistency", () => {
		it("should pass V0 with checks", () => {
			const result = checkGates({
				...validPitfall,
				verify: { level: "V0", checks: ["bun test"] },
			});
			expect(result.passed).toBe(true);
		});

		it("should pass V1 with checks", () => {
			const result = checkGates({
				...validPitfall,
				verify: { level: "V1", checks: ["bun lint"] },
			});
			expect(result.passed).toBe(true);
		});

		it("should pass V2 without checks", () => {
			const result = checkGates({
				...validPitfall,
				verify: { level: "V2" },
			});
			expect(result.passed).toBe(true);
		});

		it("should pass V3 with fallback.self_proof", () => {
			const result = checkGates({
				...validPitfall,
				verify: {
					level: "V3",
					fallback: { level: "V3", self_proof: ["Verified manually"] },
				},
			});
			expect(result.passed).toBe(true);
		});

		it("should fail V0 without checks", () => {
			const result = checkGates({
				...validPitfall,
				verify: { level: "V0" },
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 8 failed: verify.level=V0 requires checks commands",
			);
		});

		it("should fail V1 without checks", () => {
			const result = checkGates({
				...validPitfall,
				verify: { level: "V1" },
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 8 failed: verify.level=V1 requires checks commands",
			);
		});

		it("should fail V3 without fallback.self_proof", () => {
			const result = checkGates({
				...validPitfall,
				verify: { level: "V3" },
			});
			expect(result.passed).toBe(false);
			expect(result.errors).toContain(
				"Gate 8 failed: verify.level=V3 requires fallback.self_proof",
			);
		});

		it("should fail without verify", () => {
			const { verify, ...noVerify } = validPitfall;
			const result = checkGates(noVerify);
			expect(result.passed).toBe(false);
			expect(result.errors).toContain("Gate 8 failed: verify is required");
		});
	});

	describe("multiple gate failures", () => {
		it("should collect all errors", () => {
			const result = checkGates({});
			expect(result.passed).toBe(false);
			expect(result.errors.length).toBeGreaterThanOrEqual(5);
		});
	});
});

describe("formatGateResult", () => {
	it("should format passed result", () => {
		const result = formatGateResult({
			passed: true,
			errors: [],
			warnings: [],
		});
		expect(result).toContain("All gates passed");
	});

	it("should format failed result with errors", () => {
		const result = formatGateResult({
			passed: false,
			errors: ["Gate 1 failed: evidence is required"],
			warnings: [],
		});
		expect(result).toContain("Gate check FAILED");
		expect(result).toContain("Gate 1 failed: evidence is required");
	});

	it("should include warnings", () => {
		const result = formatGateResult({
			passed: true,
			errors: [],
			warnings: ["Gate 4 warning: some detectors are weak"],
		});
		expect(result).toContain("Warnings:");
		expect(result).toContain("Gate 4 warning: some detectors are weak");
	});
});
