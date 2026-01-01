import type { GateCheckResult, Pitfall } from "../types/index.js";

/**
 * Check if pitfall passes all gates before writing
 */
export function checkGates(pitfall: Partial<Pitfall>): GateCheckResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Gate 1: Evidence required
	if (pitfall.evidence) {
		const hasContent =
			pitfall.evidence.error_snippet || pitfall.evidence.command;
		if (!hasContent) {
			errors.push(
				"Gate 1 failed: evidence must contain error_snippet or command"
			);
		}
	} else {
		errors.push("Gate 1 failed: evidence is required");
	}

	// Gate 2: Regression required
	if (!pitfall.regression) {
		errors.push("Gate 2 failed: regression is required");
	} else if (!(pitfall.regression.waiver || pitfall.regression.repro?.length)) {
		errors.push("Gate 2 failed: regression must have repro steps or waiver");
	} else if (pitfall.regression.waiver && !pitfall.regression.waiver_reason) {
		errors.push("Gate 2 failed: regression waiver requires waiver_reason");
	}

	// Gate 3: Edge required
	if (!pitfall.edge) {
		errors.push("Gate 3 failed: edge (negative case) is required");
	} else if (!(pitfall.edge.waiver || pitfall.edge.negative_case?.length)) {
		errors.push("Gate 3 failed: edge must have negative_case or waiver");
	} else if (pitfall.edge.waiver && !pitfall.edge.waiver_reason) {
		errors.push("Gate 3 failed: edge waiver requires waiver_reason");
	}

	// Gate 4: Weak detector warning
	if (pitfall.detect) {
		const hasWeakDetector = pitfall.detect.some((d) => d.strength === "weak");
		const allWeak = pitfall.detect.every((d) => d.strength === "weak");

		if (allWeak && pitfall.detect.length > 0) {
			warnings.push(
				"Gate 4 warning: all detectors are weak - consider upgrading to rule/change/dynamic"
			);
		} else if (hasWeakDetector) {
			warnings.push(
				"Gate 4 warning: some detectors are weak - marked for future upgrade"
			);
		}
	}

	return {
		passed: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Format gate check result for display
 */
export function formatGateResult(result: GateCheckResult): string {
	const lines: string[] = [];

	if (result.passed) {
		lines.push("All gates passed");
	} else {
		lines.push("Gate check FAILED:");
		for (const error of result.errors) {
			lines.push(`  - ${error}`);
		}
	}

	if (result.warnings.length > 0) {
		lines.push("\nWarnings:");
		for (const warning of result.warnings) {
			lines.push(`  - ${warning}`);
		}
	}

	return lines.join("\n");
}
