import { describe, expect, it } from "bun:test";
import { checkGates, formatGateResult } from "../lib/gate.js";
import type { Pitfall } from "../types/index.js";

describe("checkGates", () => {
	// Helper to create a valid pitfall
	const validPitfall: Partial<Pitfall> = {
		evidence: { error_snippet: "Error: something went wrong" },
		regression: { repro: ["step 1", "step 2"], expected: "error occurs" },
		edge: { negative_case: ["valid input"], expected: "no error" },
		detect: [{ kind: "rule", strength: "strong" }],
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
					{ kind: "rule", strength: "weak" },
					{ kind: "change", strength: "weak" },
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
					{ kind: "rule", strength: "strong" },
					{ kind: "change", strength: "weak" },
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
					{ kind: "rule", strength: "strong" },
					{ kind: "change", strength: "strong" },
				],
			});
			expect(result.passed).toBe(true);
			expect(result.warnings).toHaveLength(0);
		});
	});

	describe("multiple gate failures", () => {
		it("should collect all errors", () => {
			const result = checkGates({});
			expect(result.passed).toBe(false);
			expect(result.errors.length).toBeGreaterThanOrEqual(3);
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
